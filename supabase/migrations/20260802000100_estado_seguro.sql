-- ============================================================================
-- Estado final del esquema de Banana Computer (migración base).
--
-- FUENTE ÚNICA EJECUTABLE. `supabase db reset` aplica este directorio y deja
-- la base en el estado seguro completo. `supabase/schema.sql` ya no se
-- ejecuta: se conserva solo como documento generado desde aquí.
--
-- POR QUÉ UNA SOLA MIGRACIÓN Y NO TRES
--
-- Había `schema.sql` más dos migraciones con nombres cuyo orden alfabético no
-- coincidía con el cronológico, y `schema.sql` recreaba políticas que las
-- migraciones habían cerrado. Con tres fuentes y un orden ambiguo, el estado
-- final dependía de en qué orden se hubieran ejecutado — que es exactamente lo
-- que no puede pasar con la seguridad.
--
-- Todo el fichero es idempotente y arranca soltando las firmas antiguas, así
-- que sirve igual para una base nueva que para la ya desplegada: en ambas
-- termina en el mismo sitio.
--
-- ORDEN (importa: las políticas invocan funciones, así que las funciones van
-- antes que las políticas):
--   1. Extensiones · 2. Tablas · 3. Columnas e índices · 4. Funciones
--   5. Disparadores · 6. RLS · 7. Políticas · 8. Permisos · 9. Storage
--   10. Realtime
-- ============================================================================

-- ---- 0. Fuera las firmas antiguas ---------------------------------------
--
-- Sin esto quedan sobrecargas conviviendo: PostgreSQL distingue las funciones
-- por su lista de parámetros, así que `create or replace` con una firma nueva
-- NO sustituye a la vieja, la deja al lado. Y la vieja de `abrir_conversacion`
-- aceptaba el texto de la bienvenida, es decir, dejaba almacenar mensajes
-- firmados por el bot desde el navegador.
drop function if exists public.abrir_conversacion(text, text, text, text, text);
-- `conversacion_es_mia()` se retira: su condición vive ahora dentro de las
-- políticas de `mensajes`.
--
-- Pero soltarla a secas falla sobre una base ya desplegada. PostgreSQL usa
-- RESTRICT por defecto, y en el estado anterior hay dos políticas que la
-- invocan: «cannot drop function ... because other objects depend on it».
--
-- Se sueltan primero esas dos políticas, por su nombre. No con CASCADE: eso
-- se llevaría por delante lo que dependiera de la función sin decir qué, que
-- sobre una base de verdad es una forma estupenda de borrar algo sin
-- enterarse.
drop policy if exists "visitante lee sus mensajes" on public.mensajes;
drop policy if exists "visitante manda mensaje"    on public.mensajes;
drop policy if exists "chat lectura mensajes"      on public.mensajes;
drop function if exists public.conversacion_es_mia(uuid);
drop function if exists public.actualizar_mi_ficha(text, text, jsonb, jsonb, text);
drop function if exists public.enviar_valoracion(uuid, uuid, smallint, text);

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

-- Identidad verificable del visitante. Es el único vínculo del que cuelgan las
-- políticas: el UUID que el navegador guarda en localStorage lo controla el
-- propio visitante, así que sirve para recordar el hilo pero no autoriza nada.
alter table public.visitantes
  add column if not exists auth_id uuid unique references auth.users(id) on delete set null;
create index if not exists visitantes_auth_id_idx on public.visitantes (auth_id);

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
-- Mantiene `ultimo_mensaje_at`, que es por lo que se ordena la bandeja del
-- agente.
--
-- Iba sin `security definer`, así que se ejecutaba con los permisos de quien
-- inserta el mensaje. Un visitante no tiene UPDATE sobre `conversaciones`, de
-- modo que su mensaje entraba y la fecha **no se movía**: la conversación se
-- quedaba hundida en la bandeja y el agente no veía que alguien había escrito.
-- No daba error, que es lo peor que puede hacer un fallo así.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo la conversación del mensaje que entra. No recibe parámetros del
  -- cliente: lo único que usa es `new`, que lo compone PostgreSQL.
  update public.conversaciones
    set ultimo_mensaje_at = new.created_at
    where id = new.conversacion_id;
  return new;
end;
$$;
revoke all on function public.touch_conversation_on_message() from public, anon, authenticated;

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

-- Valoración del chat. Al cerrar, el agente decide si pide valoración;
-- si la pide, el visitante ve el formulario de estrellas la próxima vez
-- que abra el chat. Una por conversación.
alter table public.conversaciones
  add column if not exists valoracion_solicitada boolean not null default false,
  add column if not exists valoracion_estrellas smallint
    check (valoracion_estrellas between 1 and 5),
  add column if not exists valoracion_observacion text,
  add column if not exists valoracion_at timestamptz,
  add column if not exists cerrada_at timestamptz;

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

-- Valoración del chat por parte del visitante.
--
-- Va en función y no en una política de UPDATE porque el visitante es
-- anónimo: si le abriéramos `conversaciones` para escribir, podría tocar
-- también el estado o la asignación. Aquí solo puede dejar su nota, una
-- vez, y únicamente si el agente se la ha pedido.
--
-- Se exige además el `visitor_id` de la conversación: el visitante lo
-- tiene en su localStorage, así que hay que conocer los DOS uuid para
-- poder valorar. No es autenticación de verdad — el visitante no tiene
-- cuenta — pero evita que valga con adivinar un solo identificador.


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

-- ============================================================
-- Funciones de acceso controlado
-- ============================================================
--
-- Todo lo que un cliente o un visitante necesita escribir y que RLS no puede
-- expresar —porque RLS filtra filas y aquí hace falta filtrar COLUMNAS— pasa
-- por una de estas funciones.
--
-- Reglas comunes, y ninguna es opcional:
--   · `security definer` + `set search_path = public`. Sin fijar el
--     search_path, quien controle el suyo puede anteponer una tabla propia y
--     hacer que la función escriba donde no debe.
--   · El propietario sale SIEMPRE de `auth.uid()`. Ninguna acepta un id de
--     dueño por parámetro: sería ofrecerle al servidor la respuesta a la
--     pregunta que tiene que comprobar.
--   · `revoke ... from public` y `grant` solo al rol que la necesita.


-- Abre (o recupera) la conversación del visitante. No acepta texto: la
-- bienvenida la pinta el widget en el idioma activo y no se persiste, así que
-- ningún mensaje firmado como bot puede originarse en el navegador.
create or replace function public.abrir_conversacion(
  p_nombre text default null,
  p_email text default null,
  p_telefono text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_visitante uuid;
  v_conversacion uuid;
begin
  if v_uid is null then
    raise exception 'Hace falta una sesión (aunque sea anónima) para abrir conversación'
      using errcode = '42501';
  end if;

  select id into v_visitante from public.visitantes where auth_id = v_uid;
  if v_visitante is null then
    insert into public.visitantes (auth_id, nombre, email, telefono, user_agent)
    values (v_uid, p_nombre, p_email, p_telefono, p_user_agent)
    returning id into v_visitante;
  else
    update public.visitantes
       set nombre     = coalesce(nullif(p_nombre, ''), nombre),
           email      = coalesce(nullif(p_email, ''), email),
           telefono   = coalesce(nullif(p_telefono, ''), telefono),
           user_agent = coalesce(nullif(p_user_agent, ''), user_agent)
     where id = v_visitante;
  end if;

  select id into v_conversacion
    from public.conversaciones
   where visitor_id = v_visitante and estado = 'abierta'
   order by created_at desc
   limit 1;

  if v_conversacion is null then
    insert into public.conversaciones (visitor_id, estado, ultimo_mensaje_at)
    values (v_visitante, 'abierta', now())
    returning id into v_conversacion;
  end if;

  return v_conversacion;
end;
$$;
revoke all on function public.abrir_conversacion(text, text, text, text) from public;
grant execute on function public.abrir_conversacion(text, text, text, text) to anon, authenticated;

-- `cliente_id` y `auth_id` no son editables. RLS no sabe de columnas, así que
-- la protección va en un disparador; la vinculación legítima levanta una
-- bandera de transacción que es lo único que la deja pasar.
create or replace function public.visitantes_protege_columnas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- En el alta no hay fila anterior con la que comparar, así que se
    -- comprueba contra la sesión: la ficha nace del usuario que la crea y
    -- nunca enlazada a un cliente.
    if new.auth_id is distinct from auth.uid() then
      raise exception 'auth_id debe ser el de la sesión' using errcode = '42501';
    end if;
    if new.cliente_id is not null
       and coalesce(current_setting('app.vinculando_cliente', true), '') <> 'on' then
      raise exception 'una ficha de visitante no puede nacer enlazada a un cliente'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.auth_id is distinct from old.auth_id then
    raise exception 'auth_id no se puede cambiar' using errcode = '42501';
  end if;
  if new.cliente_id is distinct from old.cliente_id
     and coalesce(current_setting('app.vinculando_cliente', true), '') <> 'on' then
    raise exception 'cliente_id solo se asigna por vincular_mi_visitante_a_cliente()'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.visitantes_protege_columnas() from public, anon, authenticated;

drop trigger if exists visitantes_protege_columnas on public.visitantes;
create trigger visitantes_protege_columnas
  before insert or update on public.visitantes
  for each row execute function public.visitantes_protege_columnas();

-- Vincula la ficha del visitante con SU cuenta. Sin parámetros: el UID sale de
-- la sesión, así que no hay nada que falsificar.
create or replace function public.vincular_mi_visitante_a_cliente()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Hace falta sesión' using errcode = '42501';
  end if;
  if not exists (select 1 from public.clientes where id = v_uid) then
    raise exception 'Esta sesión no tiene ficha de cliente' using errcode = '42501';
  end if;
  perform set_config('app.vinculando_cliente', 'on', true);
  update public.visitantes set cliente_id = v_uid where auth_id = v_uid;
  perform set_config('app.vinculando_cliente', 'off', true);
end;
$$;
revoke all on function public.vincular_mi_visitante_a_cliente() from public;
grant execute on function public.vincular_mi_visitante_a_cliente() to authenticated;

-- Valoración de la conversación. La propiedad se deduce de la sesión: recibir
-- el `visitor_id` del cliente permitía puntuar la conversación de otro.
create or replace function public.enviar_valoracion(
  p_conversacion_id uuid,
  p_estrellas smallint,
  p_observacion text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_afectadas integer;
begin
  if auth.uid() is null then
    raise exception 'Hace falta sesión para valorar' using errcode = '42501';
  end if;
  if p_estrellas is null or p_estrellas < 1 or p_estrellas > 5 then
    raise exception 'La valoración debe estar entre 1 y 5';
  end if;

  update public.conversaciones c
     set valoracion_estrellas = p_estrellas,
         valoracion_observacion = nullif(btrim(coalesce(p_observacion, '')), ''),
         valoracion_at = now()
   where c.id = p_conversacion_id
     and exists (
       select 1 from public.visitantes v
       where v.id = c.visitor_id
         and v.auth_id is not null
         and v.auth_id = auth.uid()
     )
     and c.valoracion_solicitada
     and c.valoracion_estrellas is null;

  get diagnostics v_afectadas = row_count;
  if v_afectadas = 0 then
    raise exception 'No hay ninguna valoración pendiente para esta conversación';
  end if;
end;
$$;
revoke all on function public.enviar_valoracion(uuid, smallint, text) from public;
grant execute on function public.enviar_valoracion(uuid, smallint, text) to anon, authenticated;

-- Edición de la ficha del cliente. Deja fuera a propósito el estado del
-- descuento educativo y los campos de revisión.
--
-- Convenio de los parámetros de texto: `null` = no tocar, `''` = limpiar. Sin
-- esa distinción no se puede borrar un teléfono, porque `undefined` y `null`
-- llegan igual por la red.
create or replace function public.actualizar_mi_ficha(
  p_nombre text default null,
  p_telefono text default null,
  p_direccion_envio jsonb default null,
  p_direccion_facturacion jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Hace falta sesión' using errcode = '42501';
  end if;
  update public.clientes
     set nombre = case
                    when p_nombre is null then nombre   -- no se toca
                    when p_nombre = ''    then null     -- se limpia
                    else p_nombre
                  end,
         telefono = case
                      when p_telefono is null then telefono
                      when p_telefono = ''    then null
                      else p_telefono
                    end,
         -- Las direcciones no distinguen "limpiar": la interfaz solo permite
         -- sustituirlas por otra, nunca dejarlas vacías.
         direccion_envio       = coalesce(p_direccion_envio, direccion_envio),
         direccion_facturacion = coalesce(p_direccion_facturacion, direccion_facturacion)
   where id = v_uid;
  if not found then
    raise exception 'No hay ficha de cliente para esta sesión' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.actualizar_mi_ficha(text, text, jsonb, jsonb) from public;
grant execute on function public.actualizar_mi_ficha(text, text, jsonb, jsonb) to authenticated;


-- Creación de reservas. El cliente ya no inserta filas: podía enviar
-- `pagado_at` retrasado y colarse en la lista de espera, o marcarlas como
-- 'disponible' directamente.
--
-- Nota honesta sobre los precios: siguen llegando del navegador y siguen
-- siendo demostrativos. Esta función impide la manipulación *estructural*
-- —dueño, estado, fecha, cantidades— pero NO valida que el precio sea el
-- real. Eso exige un catálogo en servidor, que este prototipo no tiene.
create or replace function public.crear_mis_reservas(p_lineas jsonb)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_linea jsonb;
  v_unidades int;
  v_precio numeric;
  v_family text;
  v_slug text;
  v_nombre text;
  v_variant text;
  v_total int := 0;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Hace falta sesión' using errcode = '42501';
  end if;
  -- Una cuenta de agente no tiene ficha de cliente: sin esto podría crear
  -- reservas a su nombre que después nadie sabe a quién pertenecen.
  if not exists (select 1 from public.clientes where id = v_uid) then
    raise exception 'Esta sesión no tiene ficha de cliente' using errcode = '42501';
  end if;
  if p_lineas is null or jsonb_typeof(p_lineas) <> 'array' then
    raise exception 'Se esperaba una lista de líneas';
  end if;
  if jsonb_array_length(p_lineas) = 0 then
    raise exception 'No hay ninguna línea que reservar';
  end if;
  if jsonb_array_length(p_lineas) > 20 then
    raise exception 'Demasiadas líneas en una sola llamada';
  end if;

  for v_linea in select * from jsonb_array_elements(p_lineas) loop
    -- `model_name` y `variant_label` son NOT NULL en la tabla: sin
    -- comprobarlo aquí, el fallo llegaría como un error de restricción de
    -- Postgres en vez de como un mensaje que se entienda.
    -- `btrim` y comprobación de vacío: `''` pasaría el NOT NULL de la tabla y
    -- dejaría una reserva sin producto legible.
    v_family  := btrim(coalesce(v_linea->>'family', ''));
    v_slug    := btrim(coalesce(v_linea->>'model_slug', ''));
    v_nombre  := btrim(coalesce(v_linea->>'model_name', ''));
    v_variant := btrim(coalesce(v_linea->>'variant_label', ''));

    if v_family = '' or v_slug = '' or v_nombre = '' or v_variant = '' then
      raise exception 'Falta family, model_slug, model_name o variant_label en una línea';
    end if;
    if length(v_family) > 40 or length(v_slug) > 80
       or length(v_nombre) > 120 or length(v_variant) > 120 then
      raise exception 'Alguno de los textos de la línea es demasiado largo';
    end if;

    v_unidades := coalesce((v_linea->>'unidades')::int, 1);
    if v_unidades < 1 or v_unidades > 10 then
      raise exception 'Unidades fuera de rango (1-10)';
    end if;

    -- `jsonb` deja pasar cualquier cosa como texto; sin esto un "precio" de
    -- 'abc' o negativo entraría tal cual.
    begin
      v_precio := (v_linea->>'price')::numeric;
    exception when others then
      raise exception 'Precio no numérico';
    end;
    -- La columna es numeric(10,2): un valor mayor reventaría con un error de
    -- Postgres en vez de con un mensaje que se entienda.
    if v_precio is null or v_precio < 0 or v_precio > 99999999.99 then
      raise exception 'Precio inválido';
    end if;
    if v_precio <> round(v_precio, 2) then
      raise exception 'El precio no puede tener más de dos decimales';
    end if;

    v_total := v_total + v_unidades;
    if v_total > 50 then
      raise exception 'Demasiadas reservas en una sola llamada';
    end if;

    -- Una fila por unidad: cada una ocupa su puesto en la cola.
    for i in 1..v_unidades loop
      insert into public.reservas (
        cliente_id, family, model_slug, model_name, variant_label, price, estado, pagado_at
      ) values (
        v_uid,                                  -- de la sesión, no del cliente
        v_family,
        v_slug,
        v_nombre,
        v_variant,
        v_precio,
        'en-espera',                            -- nunca lo elige el cliente
        now()                                   -- ni la fecha: fija la cola
      )
      returning id into v_id;
      return next v_id;
    end loop;
  end loop;
end;
$$;
revoke all on function public.crear_mis_reservas(jsonb) from public;
grant execute on function public.crear_mis_reservas(jsonb) to authenticated;

-- Lo único que un agente cambia de su ficha: si está disponible, ocupado o
-- ausente, y su nombre visible. Ni el rol, ni el email, ni la tienda.
create or replace function public.cambiar_mi_estado(
  p_estado text default null,
  p_nombre text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from public.agentes where id = v_uid) then
    raise exception 'Solo un agente dado de alta' using errcode = '42501';
  end if;
  if p_estado is not null and p_estado not in ('disponible', 'ocupado', 'ausente') then
    raise exception 'Estado no válido';
  end if;

  update public.agentes
     set estado = coalesce(p_estado, estado),
         nombre = coalesce(nullif(p_nombre, ''), nombre)
   where id = v_uid;
end;
$$;
revoke all on function public.cambiar_mi_estado(text, text) from public;
grant execute on function public.cambiar_mi_estado(text, text) to authenticated;

-- ---- Operaciones del agente sobre una conversación ----------------------
--
-- Cada una toca solo lo suyo. Ninguna acepta el identificador del agente por
-- parámetro: sale de la sesión.

create or replace function public.asignarme_conversacion(p_conversacion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_afectadas integer;
begin
  if v_uid is null or not exists (select 1 from public.agentes where id = v_uid) then
    raise exception 'Solo un agente dado de alta' using errcode = '42501';
  end if;
  -- Abierta, y libre o ya suya. Faltaba lo de abierta: se podía reclamar una
  -- conversación cerrada, que no significa nada y ensucia la trazabilidad.
  -- Repetirlo sobre la propia no rompe nada: es idempotente.
  update public.conversaciones
     set agente_id = v_uid
   where id = p_conversacion_id
     and estado = 'abierta'
     and (agente_id is null or agente_id = v_uid);
  get diagnostics v_afectadas = row_count;
  if v_afectadas = 0 then
    raise exception 'No existe, está cerrada, o la lleva otro agente'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.asignarme_conversacion(uuid) from public;
grant execute on function public.asignarme_conversacion(uuid) to authenticated;

create or replace function public.liberar_mi_conversacion(p_conversacion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_afectadas integer;
begin
  -- Exige fila en `agentes`, no solo sesión.
  --
  -- `conversaciones.agente_id` referencia `auth.users`, no `public.agentes`, y
  -- versiones anteriores dejaban escribir ahí cualquier UUID. Puede quedar un
  -- dato heredado con el UUID de un cliente: comprobando solo `agente_id =
  -- auth.uid()`, ese cliente podría retirar la asignación de una conversación.
  if v_uid is null or not exists (select 1 from public.agentes where id = v_uid) then
    raise exception 'Solo un agente dado de alta' using errcode = '42501';
  end if;
  -- Solo sobre abiertas: una conversación cerrada conserva el agente que la
  -- atendió, que es lo que permite saber después quién llevó cada caso.
  -- Y solo si hay algo que liberar: decir que sí sobre una sin asignar sería
  -- informar de un cambio que no ha ocurrido.
  update public.conversaciones
     set agente_id = null
   where id = p_conversacion_id
     and estado = 'abierta'
     and agente_id is not null
     and (agente_id = v_uid or public.es_supervisor());
  get diagnostics v_afectadas = row_count;
  if v_afectadas = 0 then
    raise exception 'No existe, está cerrada, no tiene agente, o no es tuya'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.liberar_mi_conversacion(uuid) from public;
grant execute on function public.liberar_mi_conversacion(uuid) to authenticated;

create or replace function public.cerrar_conversacion(
  p_conversacion_id uuid,
  p_solicitar_valoracion boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_afectadas integer;
begin
  if v_uid is null or not exists (select 1 from public.agentes where id = v_uid) then
    raise exception 'Solo un agente dado de alta' using errcode = '42501';
  end if;
  -- El que la lleva, o un supervisor. Y nada más.
  --
  -- Antes también entraba `agente_id is null`, así que cualquier agente podía
  -- cerrar una conversación libre — que es la de otro compañero que aún no la
  -- ha cogido. Para cerrarla hay que asignársela primero.
  --
  -- Solo toca estado, fecha de cierre y si se pide valoración: las estrellas
  -- las escribe el visitante, no el agente que le atendió.
  update public.conversaciones
     set estado = 'cerrada',
         cerrada_at = now(),
         valoracion_solicitada = coalesce(p_solicitar_valoracion, true)
   where id = p_conversacion_id
     and estado = 'abierta'
     and (agente_id = v_uid or public.es_supervisor());
  get diagnostics v_afectadas = row_count;
  if v_afectadas = 0 then
    raise exception 'No se puede cerrar: no existe, ya está cerrada, o no es tuya'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.cerrar_conversacion(uuid, boolean) from public;
grant execute on function public.cerrar_conversacion(uuid, boolean) to authenticated;

create or replace function public.reabrir_conversacion(p_conversacion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_afectadas integer;
begin
  if v_uid is null or not exists (select 1 from public.agentes where id = v_uid) then
    raise exception 'Solo un agente dado de alta' using errcode = '42501';
  end if;
  -- Solo el agente que la atendió, o un supervisor. Antes bastaba con ser
  -- agente: cualquiera podía reabrir la conversación de cualquier compañero.
  --
  -- Una conversación cerrada sin agente solo la reabre un supervisor, y
  -- reabrir NO asigna: el `agente_id` se queda como estaba, para que la
  -- reapertura no se lleve por delante la trazabilidad de quién atendió.
  --
  -- Tampoco se toca la valoración: si el visitante ya puntuó, esa puntuación
  -- es suya y se queda.
  update public.conversaciones
     set estado = 'abierta',
         cerrada_at = null
   where id = p_conversacion_id
     and estado = 'cerrada'
     and (agente_id = v_uid or public.es_supervisor());
  get diagnostics v_afectadas = row_count;
  if v_afectadas = 0 then
    raise exception 'No se puede reabrir: no existe, no está cerrada, o no es tuya'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.reabrir_conversacion(uuid) from public;
grant execute on function public.reabrir_conversacion(uuid) to authenticated;

-- Mensaje del visitante. Todo lo que no es el texto lo pone el servidor.
create or replace function public.enviar_mensaje_visitante(
  p_conversacion_id uuid,
  p_texto text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_estado text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Hace falta una sesión, aunque sea anónima' using errcode = '42501';
  end if;

  select c.estado into v_estado
    from public.conversaciones c
    join public.visitantes v on v.id = c.visitor_id
   where c.id = p_conversacion_id
     and v.auth_id is not null
     and v.auth_id = v_uid;

  if v_estado is null then
    raise exception 'Esa conversación no es tuya' using errcode = '42501';
  end if;
  if v_estado <> 'abierta' then
    raise exception 'La conversación está cerrada' using errcode = '42501';
  end if;

  if p_texto is null or btrim(p_texto) = '' then
    raise exception 'El mensaje no puede estar vacío';
  end if;
  if length(p_texto) > 4000 then
    raise exception 'El mensaje es demasiado largo';
  end if;

  -- `created_at` no se toma del parámetro ni del cliente: lo pone la columna
  -- por omisión, que es `now()`. De eso depende el orden de la bandeja.
  insert into public.mensajes (conversacion_id, autor, texto, agente_id)
  values (p_conversacion_id, 'visitor', btrim(p_texto), null)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.enviar_mensaje_visitante(uuid, text) from public;
grant execute on function public.enviar_mensaje_visitante(uuid, text) to anon, authenticated;

-- ¿Es supervisor la sesión actual? Solo la usan otras funciones.
create or replace function public.es_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.agentes where id = auth.uid() and rol = 'supervisor'
  );
$$;
revoke all on function public.es_supervisor() from public, anon, authenticated;

-- Respuesta del agente. Fija `autor` y `agente_id` desde la sesión: el
-- frontend no los envía, así que no puede equivocarse ni mentir.
create or replace function public.responder_como_agente(
  p_conversacion_id uuid,
  p_texto text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_asignado uuid;
  v_estado text;
begin
  if v_uid is null or not exists (select 1 from public.agentes where id = v_uid) then
    raise exception 'Solo un agente dado de alta puede responder' using errcode = '42501';
  end if;
  if p_texto is null or btrim(p_texto) = '' then
    raise exception 'El mensaje no puede estar vacío';
  end if;
  if length(p_texto) > 4000 then
    raise exception 'El mensaje es demasiado largo';
  end if;

  -- Comprobación y reclamación en la misma sentencia, para que dos agentes
  -- que pulsen a la vez no se queden ambos con la conversación: el `where`
  -- solo casa mientras siga sin asignar, y quien llegue segundo no actualiza
  -- nada. `returning` dice si nos la hemos quedado.
  update public.conversaciones
     set agente_id = coalesce(agente_id, v_uid)
   where id = p_conversacion_id
     and estado = 'abierta'
     and (agente_id is null or agente_id = v_uid)
  returning agente_id into v_asignado;

  if v_asignado is null then
    -- O no existe, o está cerrada, o la lleva otro. Se distingue para que el
    -- panel pueda decir algo útil.
    select estado, agente_id into v_estado, v_asignado
      from public.conversaciones where id = p_conversacion_id;
    if v_estado is null then
      raise exception 'Esa conversación no existe' using errcode = '42501';
    elsif v_estado <> 'abierta' then
      raise exception 'La conversación está cerrada' using errcode = '42501';
    else
      raise exception 'La lleva otro agente' using errcode = '42501';
    end if;
  end if;

  insert into public.mensajes (conversacion_id, autor, texto, agente_id)
  values (p_conversacion_id, 'agent', btrim(p_texto), v_uid)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.responder_como_agente(uuid, text) from public;
grant execute on function public.responder_como_agente(uuid, text) to authenticated;

-- Cambio de estado de una reserva, por el agente. Solo el estado, y solo por
-- transiciones que tengan sentido.
create or replace function public.cambiar_estado_reserva(
  p_reserva_id uuid,
  p_estado text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_actual text;
begin
  if v_uid is null or not exists (select 1 from public.agentes where id = v_uid) then
    raise exception 'Solo un agente dado de alta' using errcode = '42501';
  end if;

  -- Comprobación y escritura en UNA sentencia.
  --
  -- Antes se leía el estado, se validaba la transición y luego se escribía.
  -- Entre la lectura y la escritura cabe otra operación: dos agentes leían
  -- 'disponible', uno pedía 'completada' y el otro 'cancelada', y ambas
  -- llamadas decían que sí. El resultado efectivo era completada → cancelada,
  -- que es justo lo que la máquina de estados prohíbe.
  --
  -- Metiendo la condición en el `where`, la segunda no encuentra fila que
  -- casar y no escribe nada.
  update public.reservas
     set estado = p_estado
   where id = p_reserva_id
     and (
       (estado = 'en-espera'  and p_estado in ('disponible', 'cancelada')) or
       (estado = 'disponible' and p_estado in ('completada', 'cancelada'))
     )
  returning estado into v_actual;

  if v_actual is null then
    -- No se actualizó nada. Se mira por qué, para poder decir algo útil.
    select estado into v_actual from public.reservas where id = p_reserva_id;
    if v_actual is null then
      raise exception 'Esa reserva no existe' using errcode = '42501';
    end if;
    raise exception 'Transición no permitida: % → %', v_actual, p_estado;
  end if;
end;
$$;
revoke all on function public.cambiar_estado_reserva(uuid, text) from public;
grant execute on function public.cambiar_estado_reserva(uuid, text) to authenticated;

-- Cancelación de una reserva propia en espera. Lo único que el cliente puede
-- cambiar de una reserva: ni precio, ni producto, ni `pagado_at`.
create or replace function public.cancelar_mi_reserva(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_afectadas integer;
begin
  if v_uid is null then
    raise exception 'Hace falta sesión' using errcode = '42501';
  end if;
  update public.reservas
     set estado = 'cancelada'
   where id = p_reserva_id and cliente_id = v_uid and estado = 'en-espera';
  get diagnostics v_afectadas = row_count;
  if v_afectadas = 0 then
    raise exception 'No hay ninguna reserva tuya en espera con ese identificador'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.cancelar_mi_reserva(uuid) from public;
grant execute on function public.cancelar_mi_reserva(uuid) to authenticated;

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
drop policy if exists "agente borra conversaciones"     on public.conversaciones;
drop policy if exists "chat lectura mensajes"           on public.mensajes;
drop policy if exists "visitante escribe mensajes"      on public.mensajes;
drop policy if exists "agente escribe mensajes"         on public.mensajes;

-- ---- Chat del visitante -------------------------------------------------
-- El widget no pide login, pero el visitante SÍ tiene identidad: una sesión
-- anónima de Supabase. `auth.uid()` va firmado en el JWT y es lo único en lo
-- que se apoyan estas políticas.
--
-- Aquí hubo `using (true)` para `anon` hasta el 2026-08-02. Como la clave
-- anónima viaja en el bundle, eso equivalía a publicar el nombre, el email y
-- el teléfono de todo el que hubiera escrito por el chat, junto con sus
-- conversaciones. No se debe volver a poner: hay una prueba que lo vigila
-- (`tests/e2e/schema-seguro.spec.ts`).
drop policy if exists "visitante lee su ficha"          on public.visitantes;
drop policy if exists "visitante crea su ficha"         on public.visitantes;
drop policy if exists "visitante edita su ficha"        on public.visitantes;
drop policy if exists "agente lee visitantes"           on public.visitantes;
drop policy if exists "visitante lee sus conversaciones" on public.conversaciones;
drop policy if exists "visitante abre conversacion"     on public.conversaciones;
drop policy if exists "agente lee conversaciones"       on public.conversaciones;
drop policy if exists "visitante lee sus mensajes"      on public.mensajes;
drop policy if exists "visitante manda mensaje"         on public.mensajes;
drop policy if exists "agente lee mensajes"             on public.mensajes;

create policy "visitante lee su ficha"
  on public.visitantes for select to anon, authenticated
  using (auth_id is not null and auth_id = auth.uid());

-- NO hay política de INSERT para el visitante.
--
-- El disparador protegía `cliente_id` en el UPDATE, pero en el INSERT no hay
-- fila anterior con la que comparar: se podía crear la ficha ya apuntando al
-- `cliente_id` de otra persona. La creación pasa entera por
-- `abrir_conversacion()`, que fija `auth_id = auth.uid()` y deja `cliente_id`
-- a nulo; enlazarlo es después y por su propia función.

create policy "visitante edita su ficha"
  on public.visitantes for update to anon, authenticated
  using (auth_id is not null and auth_id = auth.uid())
  with check (auth_id is not null and auth_id = auth.uid());

create policy "agente lee visitantes"
  on public.visitantes for select to authenticated
  using (public.es_agente());

create policy "visitante lee sus conversaciones"
  on public.conversaciones for select to anon, authenticated
  using (
    exists (
      select 1 from public.visitantes v
      where v.id = visitor_id and v.auth_id is not null and v.auth_id = auth.uid()
    )
  );

-- NO hay INSERT directo de conversaciones.
--
-- La política comprobaba que el `visitor_id` fuera suyo, pero el resto de la
-- fila la elegía el navegador: se podía nacer `cerrada`, asignada a un agente,
-- con `ultimo_mensaje_at` en el futuro o con una valoración ya puesta. Se crea
-- por public.abrir_conversacion(), que fija todo eso.

create policy "agente lee conversaciones"
  on public.conversaciones for select to authenticated
  using (public.es_agente());

-- NO hay UPDATE directo de conversaciones.
--
-- La política dejaba a cualquier agente reescribir la fila entera: cambiar el
-- `visitor_id` —y con él, de quién es la conversación—, la fecha de creación,
-- o las estrellas y el comentario que había puesto el visitante. Cada
-- operación tiene ahora su función y toca solo sus columnas.

-- NO hay DELETE. Ninguno.
--
-- Cualquier agente podía borrar cualquier conversación, y `mensajes` cuelga
-- con `on delete cascade`: un clic se llevaba el historial entero, sin
-- papelera. Cerrar una conversación la saca de la bandeja y conserva todo.
-- El borrado físico, si alguna vez hace falta, es tarea de administración con
-- `service_role`, fuera de la aplicación.

-- La condición va escrita aquí y no en una función auxiliar.
--
-- Las expresiones de una política se evalúan **con los permisos de quien
-- consulta**, así que una función auxiliar obliga a concederle EXECUTE a
-- `anon` — y entonces cualquiera puede llamarla para sondear de quién es una
-- conversación. Revocarla, que fue lo primero que probé, simplemente rompe la
-- política: la consulta falla con «permission denied for function».
create policy "visitante lee sus mensajes"
  on public.mensajes for select to anon, authenticated
  using (
    exists (
      select 1
      from public.conversaciones c
      join public.visitantes v on v.id = c.visitor_id
      where c.id = conversacion_id
        and v.auth_id is not null
        and v.auth_id = auth.uid()
    )
  );

-- Solo puede hablar como visitante. Escribir como 'bot' o 'agent' desde el
-- navegador permitiría suplantarlos en cualquier conversación.
-- NO hay INSERT directo de mensajes, ni para el visitante ni para el agente.
--
-- La política fijaba `autor = 'visitor'`, pero el `created_at` seguía viniendo
-- del navegador — y el disparador de actividad usa ese `created_at`. Con una
-- fecha futura la conversación se quedaba clavada arriba de la bandeja del
-- agente; con una antigua, escondida. Se escribe por
-- public.enviar_mensaje_visitante() y public.responder_como_agente().

create policy "agente lee mensajes"
  on public.mensajes for select to authenticated
  using (public.es_agente());

-- El agente NO inserta mensajes directamente.
--
-- La política comprobaba `autor = 'agent' and es_agente()`, pero no quién
-- firmaba: un agente legítimo podía dejar `agente_id` nulo o poner el de otro
-- compañero. Se responde por public.responder_como_agente(), que fija el autor
-- y el firmante desde la sesión.

-- ---- Agentes ------------------------------------------------------------
-- Solo los propios agentes se ven entre sí (para estado y asignaciones).
-- Las altas y bajas se hacen a mano con `service_role`, no desde la web.
drop policy if exists "agente lee agentes"      on public.agentes;
drop policy if exists "agente actualiza su ficha" on public.agentes;

create policy "agente lee agentes"
  on public.agentes for select to authenticated
  using (public.es_agente());

-- El agente NO actualiza su fila directamente.
--
-- RLS filtra filas, no columnas: «puede editar la suya» incluía `rol`, así que
-- un agente normal podía **ascenderse a supervisor**. También podía cambiar su
-- `email` o su `tienda`. Cambia su estado por public.cambiar_mi_estado().

-- ---- Clientes -----------------------------------------------------------
drop policy if exists "cliente lee su ficha"      on public.clientes;
drop policy if exists "cliente crea su ficha"     on public.clientes;
drop policy if exists "cliente actualiza su ficha" on public.clientes;

-- El cliente ve la suya; el agente ve todas para poder revisar los
-- justificantes de descuento educativo.
create policy "cliente lee su ficha"
  on public.clientes for select to authenticated
  using (id = auth.uid() or public.es_agente());

-- El alta no puede venir ya aprobada: RLS no distingue columnas, así que sin
-- estos `is null` bastaba con insertar la ficha propia con el descuento en
-- 'aprobado'.
create policy "cliente crea su ficha"
  on public.clientes for insert to authenticated
  with check (
    id = auth.uid()
    and descuento_educativo_estado is null
    and descuento_educativo_archivo is null
    and descuento_educativo_nota is null
    and descuento_educativo_subido_at is null
    and descuento_educativo_revisado_at is null
    and descuento_educativo_revisado_por is null
  );

-- NO hay UPDATE directo para nadie sobre `clientes`.
--
-- Ni para el agente: RLS filtra filas, no columnas, y dárselo le permitiría
-- editar direcciones o teléfono. Ni para el propio cliente, por el mismo
-- motivo al revés: podía ponerse `descuento_educativo_estado` en 'aprobado'.
--
-- El cliente edita por public.actualizar_mi_ficha() y registra justificantes
-- por public.registrar_mi_justificante(); el agente resuelve por
-- public.revisar_descuento_educativo(). Cada una escribe solo sus columnas.

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



-- El cliente ni crea ni actualiza reservas directamente.
--
-- El UPDATE le dejaba cambiar precio, producto o `pagado_at`. El INSERT era
-- peor: podía crear una reserva con `pagado_at` retrasado y **colarse en la
-- lista de espera** por delante de quien llevaba semanas. Ambas cosas pasan
-- por función: public.crear_mis_reservas() y public.cancelar_mi_reserva().

-- NO hay UPDATE directo de reservas para el agente.
--
-- Dejaba reescribir la fila entera: el dueño, el producto, el precio y
-- `pagado_at`, que es lo que fija el puesto en la lista de espera. Se cambia
-- el estado por public.cambiar_estado_reserva(), y nada más.

-- --------------------------------------------------------------
-- Storage: justificantes del descuento educativo
-- --------------------------------------------------------------
-- Bucket privado. Convención de ruta: `<auth.uid()>/<archivo>`, que es
-- lo que permite que cada cliente solo toque su propia carpeta.
insert into storage.buckets (id, name, public)
values ('descuentos-educativos', 'descuentos-educativos', false)
on conflict (id) do nothing;

drop policy if exists "cliente sube su justificante"      on storage.objects;
drop policy if exists "cliente sustituye su justificante" on storage.objects;
drop policy if exists "cliente borra su justificante"     on storage.objects;
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
  -- Para que la bandeja del agente refresque el nombre en cuanto el
  -- visitante se identifica, sin esperar a su siguiente mensaje.
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'visitantes'
  ) then
    execute 'alter publication supabase_realtime add table public.visitantes';
  end if;
end
$$;

-- ---- Storage: sustituir y limpiar la propia carpeta ---------------------
--
-- Faltaban las dos. La subida usa `upsert: true`, que sobre un objeto que ya
-- existe es un UPDATE: sin política, la segunda subida de un cliente fallaba.
-- Y sin DELETE no se puede limpiar el archivo cuando el registro posterior
-- falla, así que quedaba huérfano en el bucket para siempre.
--
-- Ambas acotadas a la carpeta propia: `<auth.uid()>/...`.
create policy "cliente sustituye su justificante"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'descuentos-educativos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'descuentos-educativos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cliente borra su justificante"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'descuentos-educativos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---- El justificante registrado tiene que existir de verdad --------------
--
-- Antes bastaba con que la ruta *pareciera* de la carpeta propia. Se podía
-- registrar una ruta inventada: el agente vería una solicitud pendiente cuyo
-- documento no existe.
create or replace function public.registrar_mi_justificante(p_ruta text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Hace falta sesión' using errcode = '42501';
  end if;
  if p_ruta is null or p_ruta not like (v_uid::text || '/%') then
    raise exception 'La ruta no pertenece a esta cuenta' using errcode = '42501';
  end if;
  if not exists (
    select 1 from storage.objects
     where bucket_id = 'descuentos-educativos'
       and name = p_ruta
       and (storage.foldername(name))[1] = v_uid::text
  ) then
    raise exception 'No hay ningún archivo subido en esa ruta' using errcode = '42501';
  end if;

  update public.clientes
     set descuento_educativo_archivo = p_ruta,
         descuento_educativo_estado = 'pendiente',
         descuento_educativo_subido_at = now(),
         descuento_educativo_nota = null,
         descuento_educativo_revisado_at = null,
         descuento_educativo_revisado_por = null
   where id = v_uid;
  if not found then
    raise exception 'No hay ficha de cliente para esta sesión' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.registrar_mi_justificante(text) from public;
grant execute on function public.registrar_mi_justificante(text) to authenticated;

-- ---- Privilegios finales de las funciones --------------------------------
--
-- PostgreSQL concede EXECUTE a PUBLIC por omisión al crear una función. Es
-- decir: lo que no se revoca explícitamente queda abierto, incluido `anon`.
--
-- Tres se habían quedado así. Ninguna era un agujero por sí sola —las tres
-- comprueban por dentro quién llama— pero es superficie que no hace falta
-- exponer, y depender de la comprobación interna es depender de que nadie la
-- toque nunca.
--
-- La clasificación de cada función está en `tests/schema/funciones.ts`, y hay
-- una prueba que falla si aparece una función nueva sin clasificar.

-- Auxiliar: la usan las políticas, que se evalúan con los permisos de quien
-- consulta. Por eso `authenticated` sí la necesita; `anon` no, porque ninguna
-- política de rol anónimo la invoca.
revoke all on function public.es_agente() from public, anon;
grant execute on function public.es_agente() to authenticated;

-- Consulta del cliente sobre su propia reserva. Ya comprueba la propiedad por
-- dentro, pero no tiene sentido que la pueda llamar un anónimo.
revoke all on function public.posicion_en_cola(uuid) from public, anon;
grant execute on function public.posicion_en_cola(uuid) to authenticated;

-- Revisión del descuento educativo. Recibe el cliente por parámetro porque el
-- agente actúa sobre otro, y eso está bien; lo que no está bien es que la
-- pueda invocar cualquiera.
revoke all on function public.revisar_descuento_educativo(uuid, text, text)
  from public, anon;
grant execute on function public.revisar_descuento_educativo(uuid, text, text)
  to authenticated;
