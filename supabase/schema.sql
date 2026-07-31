-- Esquema del chat de Bananito y de las cuentas — Fases 1 y 2
-- ============================================================
-- Cómo aplicarlo: abre el SQL Editor en el panel de Supabase,
-- pega este archivo entero y pulsa "Run". Es idempotente (usa
-- `if not exists` y `create or replace`), así que puedes volver
-- a ejecutarlo sin miedo si iteramos.
--
-- Modelo (chat, Fase 1):
--   visitantes      → una fila por navegador que visita la web.
--   conversaciones  → agrupan mensajes; un visitante puede tener
--                     varias (una por sesión activa).
--   mensajes        → cada línea del chat, con `autor` = visitor|agent|bot.
--
-- Modelo (cuentas, Fase 2):
--   agentes   → perfil de cada agente de tienda. `id` = auth.users.id.
--               Altas MANUALES (ver "Alta de agentes ficticios" abajo).
--   clientes  → perfil de cada cliente de la tienda. `id` = auth.users.id.
--               Se crea solo al registrarse desde /registro.
--   pedidos   → espejo persistente de los pedidos demostrativos, para que
--               el perfil tenga historial. El pedido "de verdad" sigue
--               viviendo en sessionStorage (demoOrderRepository).
--   reservas  → lista de espera de variantes agotadas / bajo pedido.
--               El orden de la cola lo fija `pagado_at`.
--
-- ⚠️  TODO ESTO ES UNA DEMOSTRACIÓN. No hay agentes ni clientes reales de
--     Banana Computer, ni pagos reales. Las cuentas son ficticias y se
--     crean solo para poder enseñar el flujo completo.
--
-- Seguridad (RLS):
--   - El widget de chat del visitante sigue SIN login, así que `anon`
--     conserva el acceso que necesita (crear visitante, conversación y
--     mensajes propios). Riesgo ya aceptado y documentado en
--     docs/04-problemas-pendientes.md (CHAT-001) y docs/02-decisiones.md
--     (D-025).
--   - Todo lo que hace un AGENTE (responder, asignarse una conversación,
--     revisar descuentos) exige ahora `auth.uid()` presente en `agentes`.
--   - Los datos de cada CLIENTE (perfil, pedidos, reservas) solo son
--     accesibles por ese cliente; los agentes pueden leer lo que
--     necesitan para gestionar la cola y los descuentos, nada más.
--
-- ⚠️  ORDEN DE DESPLIEGUE: este archivo restringe la escritura de mensajes
--     con `autor='agent'` a agentes autenticados. Aplícalo a la vez (o
--     después) de desplegar la versión de la web que incluye
--     /agente/login; si lo aplicas antes, el panel de agentes dejará de
--     poder responder hasta que exista el login.

-- --------------------------------------------------------------
-- Extensión para generar UUIDs (viene activa en Supabase, pero
-- lo dejamos explícito para hacer el script portable).
-- --------------------------------------------------------------
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------
-- Tablas
-- --------------------------------------------------------------
create table if not exists public.visitantes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text,
  email text,
  user_agent text
);

create table if not exists public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_id uuid not null references public.visitantes(id) on delete cascade,
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  agente_id text,
  ultimo_mensaje_at timestamptz
);

create index if not exists conversaciones_ultimo_mensaje_idx
  on public.conversaciones (ultimo_mensaje_at desc nulls last);

create index if not exists conversaciones_visitor_idx
  on public.conversaciones (visitor_id);

create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  autor text not null check (autor in ('visitor', 'agent', 'bot')),
  texto text not null
);

create index if not exists mensajes_conversacion_idx
  on public.mensajes (conversacion_id, created_at);

-- --------------------------------------------------------------
-- Tablas de cuentas (Fase 2)
-- --------------------------------------------------------------

-- Agentes de tienda. `id` es el mismo uuid que en auth.users, así que
-- la fila de perfil y la cuenta de login van siempre emparejadas.
--
-- Alta de agentes ficticios (manual, no hay self-registro):
--   1. Panel de Supabase → Authentication → Users → "Add user"
--      → "Create new user". Marca "Auto Confirm User" para no tener
--      que validar el correo.
--      Ej.: ana.demo@banana.example / una contraseña que recuerdes.
--   2. Copia el UUID que te muestra esa fila.
--   3. Ejecuta aquí, sustituyendo el uuid y los datos:
--        insert into public.agentes (id, email, nombre, rol, tienda)
--        values ('<uuid-copiado>', 'ana.demo@banana.example',
--                'Ana (demo)', 'agente', 'triana')
--        on conflict (id) do nothing;
create table if not exists public.agentes (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  email text not null,
  nombre text not null,
  rol text not null default 'agente' check (rol in ('agente', 'supervisor')),
  tienda text,
  estado text not null default 'disponible'
    check (estado in ('disponible', 'ocupado', 'ausente'))
);

-- Clientes de la tienda. Se crea una fila al registrarse en /registro.
-- Las direcciones son jsonb para poder evolucionar el formulario sin
-- migrar el esquema: { calle, ciudad, isla, cp }.
create table if not exists public.clientes (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  email text not null,
  nombre text,
  telefono text,
  direccion_envio jsonb,
  direccion_facturacion jsonb,
  descuento_educativo_estado text
    check (descuento_educativo_estado in ('pendiente', 'aprobado', 'rechazado')),
  descuento_educativo_archivo text, -- ruta dentro del bucket de Storage
  descuento_educativo_nota text,    -- motivo del rechazo / comentario del agente
  descuento_educativo_subido_at timestamptz,
  descuento_educativo_revisado_at timestamptz,
  descuento_educativo_revisado_por uuid references auth.users(id)
);

create index if not exists clientes_descuento_pendiente_idx
  on public.clientes (descuento_educativo_estado)
  where descuento_educativo_estado = 'pendiente';

-- Espejo persistente de los pedidos demostrativos. El id mantiene el
-- formato BC-XXXXXX que ya genera demoOrderRepository.
create table if not exists public.pedidos (
  id text primary key,
  created_at timestamptz not null default now(),
  cliente_id uuid not null references auth.users(id) on delete cascade,
  delivery text not null check (delivery in ('envio', 'recogida')),
  payment_method text not null check (payment_method in ('tarjeta', 'bizum', 'financiacion')),
  financing_months integer,
  products_total numeric(10, 2) not null default 0,
  insurance_total numeric(10, 2) not null default 0,
  insured_units integer not null default 0,
  lines jsonb not null default '[]'::jsonb,
  status text not null default 'demo'
);

create index if not exists pedidos_cliente_idx
  on public.pedidos (cliente_id, created_at desc);

-- Reservas de variantes sin stock. `pagado_at` fija el puesto en la cola:
-- quien paga antes, antes se le sirve cuando llegue la unidad.
create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  cliente_id uuid not null references auth.users(id) on delete cascade,
  family text not null,
  model_slug text not null,
  variant_label text not null, -- color + capacidad, tal y como se muestra
  model_name text not null,
  price numeric(10, 2) not null,
  pagado_at timestamptz not null default now(),
  estado text not null default 'en-espera'
    check (estado in ('en-espera', 'disponible', 'completada', 'cancelada'))
);

create index if not exists reservas_cliente_idx
  on public.reservas (cliente_id, pagado_at desc);

-- Índice que sostiene el cálculo de posición en la cola.
create index if not exists reservas_cola_idx
  on public.reservas (family, model_slug, variant_label, pagado_at)
  where estado = 'en-espera';

-- --------------------------------------------------------------
-- Trigger: mantener `ultimo_mensaje_at` al día en la conversación
-- para que el panel del agente pueda ordenar por actividad reciente.
-- --------------------------------------------------------------
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversaciones
    set ultimo_mensaje_at = new.created_at
    where id = new.conversacion_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation on public.mensajes;
create trigger trg_touch_conversation
  after insert on public.mensajes
  for each row execute function public.touch_conversation_on_message();

-- --------------------------------------------------------------
-- Migración: `conversaciones.agente_id` nació como `text` en la Fase 1
-- y nunca llegó a escribirse. Ahora pasa a uuid para poder referenciar
-- al agente autenticado que se asigna la conversación.
-- --------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversaciones'
      and column_name = 'agente_id'
      and data_type = 'text'
  ) then
    alter table public.conversaciones
      alter column agente_id type uuid using nullif(agente_id, '')::uuid;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and constraint_name = 'conversaciones_agente_id_fkey'
  ) then
    alter table public.conversaciones
      add constraint conversaciones_agente_id_fkey
      foreign key (agente_id) references auth.users(id) on delete set null;
  end if;
end
$$;

-- --------------------------------------------------------------
-- Migración: enlazar el visitante del chat con su cuenta de cliente.
-- Cuando alguien con sesión iniciada abre el chat, guardamos quién es
-- para que el agente vea su nombre y su teléfono en vez de un UUID.
-- Los visitantes sin cuenta siguen funcionando igual, con `cliente_id`
-- a null.
-- --------------------------------------------------------------
alter table public.visitantes
  add column if not exists cliente_id uuid references auth.users(id) on delete set null;

alter table public.visitantes
  add column if not exists telefono text;

-- Quién escribió cada respuesta. Sin esto, con más de un agente en el
-- panel no se puede saber a quién atribuir un mensaje 'agent'.
alter table public.mensajes
  add column if not exists agente_id uuid references auth.users(id) on delete set null;

create index if not exists visitantes_cliente_idx
  on public.visitantes (cliente_id)
  where cliente_id is not null;

-- --------------------------------------------------------------
-- Funciones auxiliares
-- --------------------------------------------------------------

-- ¿Quien llama es un agente dado de alta?
-- SECURITY DEFINER a propósito: si consultásemos `agentes` desde una
-- política DE `agentes`, la propia política se llamaría a sí misma en
-- bucle. Al saltarse RLS aquí, cortamos la recursión.
create or replace function public.es_agente()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.agentes where id = auth.uid());
$$;

-- Posición de una reserva en su lista de espera (1 = siguiente en ser
-- servido). Va en SECURITY DEFINER porque cada cliente solo puede leer
-- sus propias reservas y, aun así, necesita saber cuántas hay por
-- delante. Solo responde al dueño de la reserva o a un agente.
create or replace function public.posicion_en_cola(p_reserva_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_propia public.reservas;
  v_posicion integer;
begin
  select * into v_propia from public.reservas where id = p_reserva_id;
  if v_propia.id is null then
    return null;
  end if;
  if v_propia.cliente_id <> auth.uid() and not public.es_agente() then
    return null;
  end if;

  select 1 + count(*)::int into v_posicion
    from public.reservas otras
   where otras.family = v_propia.family
     and otras.model_slug = v_propia.model_slug
     and otras.variant_label = v_propia.variant_label
     and otras.estado = 'en-espera'
     and otras.pagado_at < v_propia.pagado_at;

  return v_posicion;
end;
$$;

-- Revisión del descuento educativo por parte de un agente.
-- Se hace con función (y no con una política de UPDATE sobre `clientes`)
-- porque RLS es por FILA, no por columna: darle UPDATE al agente sobre
-- `clientes` le dejaría tocar también direcciones o teléfono. Así el
-- agente solo puede mover exactamente los campos de la revisión.
create or replace function public.revisar_descuento_educativo(
  p_cliente_id uuid,
  p_estado text,
  p_nota text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_agente() then
    raise exception 'Solo un agente autenticado puede revisar descuentos educativos';
  end if;
  if p_estado not in ('pendiente', 'aprobado', 'rechazado') then
    raise exception 'Estado no válido: %', p_estado;
  end if;

  update public.clientes
     set descuento_educativo_estado = p_estado,
         descuento_educativo_nota = p_nota,
         descuento_educativo_revisado_at = now(),
         descuento_educativo_revisado_por = auth.uid()
   where id = p_cliente_id;
end;
$$;

-- --------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------
alter table public.visitantes     enable row level security;
alter table public.conversaciones enable row level security;
alter table public.mensajes       enable row level security;
alter table public.agentes        enable row level security;
alter table public.clientes       enable row level security;
alter table public.pedidos        enable row level security;
alter table public.reservas       enable row level security;

-- Limpieza de las políticas de la Fase 1 (este archivo se re-ejecuta).
drop policy if exists "fase1 anon read visitantes"      on public.visitantes;
drop policy if exists "fase1 anon insert visitantes"    on public.visitantes;
drop policy if exists "fase1 anon update visitantes"    on public.visitantes;

drop policy if exists "fase1 anon read conversaciones"  on public.conversaciones;
drop policy if exists "fase1 anon insert conversaciones" on public.conversaciones;
drop policy if exists "fase1 anon update conversaciones" on public.conversaciones;

drop policy if exists "fase1 anon read mensajes"        on public.mensajes;
drop policy if exists "fase1 anon insert mensajes"      on public.mensajes;

drop policy if exists "chat lectura visitantes"         on public.visitantes;
drop policy if exists "chat alta visitantes"            on public.visitantes;
drop policy if exists "chat actualiza visitantes"       on public.visitantes;
drop policy if exists "chat lectura conversaciones"     on public.conversaciones;
drop policy if exists "chat alta conversaciones"        on public.conversaciones;
drop policy if exists "agente actualiza conversaciones" on public.conversaciones;
drop policy if exists "chat lectura mensajes"           on public.mensajes;
drop policy if exists "visitante escribe mensajes"      on public.mensajes;
drop policy if exists "agente escribe mensajes"         on public.mensajes;

-- ---- Chat del visitante -------------------------------------------------
-- El widget sigue sin login, así que `anon` conserva lo que necesita.
-- Riesgo conocido y aceptado (CHAT-001 / D-025): cualquiera con la URL
-- del panel puede leer conversaciones. La lectura se cierra cuando el
-- visitante tenga también cuenta, fuera del alcance de esta fase.
create policy "chat lectura visitantes"
  on public.visitantes for select to anon, authenticated using (true);
create policy "chat alta visitantes"
  on public.visitantes for insert to anon, authenticated with check (true);
create policy "chat actualiza visitantes"
  on public.visitantes for update to anon, authenticated using (true) with check (true);

create policy "chat lectura conversaciones"
  on public.conversaciones for select to anon, authenticated using (true);
create policy "chat alta conversaciones"
  on public.conversaciones for insert to anon, authenticated with check (true);

-- Asignarse una conversación o cerrarla es cosa de agentes.
create policy "agente actualiza conversaciones"
  on public.conversaciones for update to authenticated
  using (public.es_agente())
  with check (public.es_agente());

create policy "chat lectura mensajes"
  on public.mensajes for select to anon, authenticated using (true);

-- Un visitante anónimo solo puede hablar como visitante (o como el bot,
-- que es quien manda el mensaje de bienvenida desde el propio widget).
create policy "visitante escribe mensajes"
  on public.mensajes for insert to anon, authenticated
  with check (autor in ('visitor', 'bot'));

-- Responder como agente exige estar autenticado y dado de alta.
create policy "agente escribe mensajes"
  on public.mensajes for insert to authenticated
  with check (autor = 'agent' and public.es_agente());

-- ---- Agentes ------------------------------------------------------------
-- Solo los propios agentes se ven entre sí (para estado y asignaciones).
-- Las altas y bajas se hacen a mano con `service_role`, no desde la web.
drop policy if exists "agente lee agentes"      on public.agentes;
drop policy if exists "agente actualiza su ficha" on public.agentes;

create policy "agente lee agentes"
  on public.agentes for select to authenticated
  using (public.es_agente());

create policy "agente actualiza su ficha"
  on public.agentes for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- Clientes -----------------------------------------------------------
drop policy if exists "cliente lee su ficha"      on public.clientes;
drop policy if exists "cliente crea su ficha"     on public.clientes;
drop policy if exists "cliente actualiza su ficha" on public.clientes;

-- El cliente ve la suya; el agente ve todas para poder revisar los
-- justificantes de descuento educativo.
create policy "cliente lee su ficha"
  on public.clientes for select to authenticated
  using (id = auth.uid() or public.es_agente());

create policy "cliente crea su ficha"
  on public.clientes for insert to authenticated
  with check (id = auth.uid());

-- Ojo: NO se da UPDATE al agente. RLS filtra filas, no columnas, así que
-- dárselo le permitiría editar direcciones o teléfono. El agente revisa
-- descuentos a través de public.revisar_descuento_educativo().
create policy "cliente actualiza su ficha"
  on public.clientes for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- Pedidos ------------------------------------------------------------
drop policy if exists "cliente lee sus pedidos"  on public.pedidos;
drop policy if exists "cliente crea sus pedidos" on public.pedidos;

create policy "cliente lee sus pedidos"
  on public.pedidos for select to authenticated
  using (cliente_id = auth.uid());

create policy "cliente crea sus pedidos"
  on public.pedidos for insert to authenticated
  with check (cliente_id = auth.uid());

-- ---- Reservas -----------------------------------------------------------
drop policy if exists "cliente lee sus reservas"     on public.reservas;
drop policy if exists "cliente crea sus reservas"    on public.reservas;
drop policy if exists "cliente cancela sus reservas" on public.reservas;
drop policy if exists "agente gestiona reservas"     on public.reservas;

create policy "cliente lee sus reservas"
  on public.reservas for select to authenticated
  using (cliente_id = auth.uid() or public.es_agente());

create policy "cliente crea sus reservas"
  on public.reservas for insert to authenticated
  with check (cliente_id = auth.uid());

create policy "cliente cancela sus reservas"
  on public.reservas for update to authenticated
  using (cliente_id = auth.uid())
  with check (cliente_id = auth.uid());

create policy "agente gestiona reservas"
  on public.reservas for update to authenticated
  using (public.es_agente())
  with check (public.es_agente());

-- --------------------------------------------------------------
-- Storage: justificantes del descuento educativo
-- --------------------------------------------------------------
-- Bucket privado. Convención de ruta: `<auth.uid()>/<archivo>`, que es
-- lo que permite que cada cliente solo toque su propia carpeta.
insert into storage.buckets (id, name, public)
values ('descuentos-educativos', 'descuentos-educativos', false)
on conflict (id) do nothing;

drop policy if exists "cliente sube su justificante" on storage.objects;
drop policy if exists "cliente lee su justificante"  on storage.objects;
drop policy if exists "agente lee justificantes"     on storage.objects;

create policy "cliente sube su justificante"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'descuentos-educativos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cliente lee su justificante"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'descuentos-educativos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "agente lee justificantes"
  on storage.objects for select to authenticated
  using (bucket_id = 'descuentos-educativos' and public.es_agente());

-- --------------------------------------------------------------
-- Realtime: publicar las tres tablas para que los clientes se
-- puedan suscribir a INSERT/UPDATE en vivo.
-- --------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes'
  ) then
    execute 'alter publication supabase_realtime add table public.mensajes';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversaciones'
  ) then
    execute 'alter publication supabase_realtime add table public.conversaciones';
  end if;
end
$$;
