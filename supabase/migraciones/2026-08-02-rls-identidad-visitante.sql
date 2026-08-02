-- ============================================================================
-- 2026-08-02 · Identidad verificable del visitante y cierre de las políticas
--              anónimas del chat.
--
-- QUÉ ARREGLA
--
-- El esquema anterior daba a `anon` estas políticas sobre el chat:
--
--     visitantes    select using (true)
--     visitantes    update using (true) with check (true)
--     conversaciones select using (true)
--     mensajes      select using (true)
--     mensajes      insert with check (autor in ('visitor','bot'))
--
-- Con la clave pública —que por definición está en el bundle— cualquiera
-- podía descargar el nombre, el email y el teléfono de todas las personas que
-- habían escrito por el chat, leer sus conversaciones enteras, reescribir sus
-- datos y meter mensajes en conversaciones ajenas haciéndose pasar por el bot.
--
-- El comentario del esquema lo daba por "riesgo conocido y aceptado
-- (CHAT-001 / D-025)". Es aceptable no pedir login para escribir; no lo es
-- que un anónimo lea los datos de los demás.
--
-- CÓMO
--
-- El visitante deja de identificarse con un UUID de `localStorage` —que es un
-- dato que él mismo controla y por tanto no autoriza nada— y pasa a usar la
-- **autenticación anónima de Supabase**: obtiene un `auth.uid()` real,
-- firmado, y las políticas cuelgan de él.
--
-- REQUISITO EXTERNO (no se puede hacer desde SQL):
--
--     Supabase → Authentication → Providers → **Anonymous sign-ins: ON**
--
-- Sin eso, el widget no podrá crear sesión y el chat quedará en modo
-- demostración. Está comprobado en el arranque del cliente.
--
-- COMPATIBILIDAD CON LO YA GUARDADO
--
-- Las filas de `visitantes` existentes tienen un `id` aleatorio que no
-- corresponde a ningún usuario de `auth.users`. En vez de reescribirlas
-- —lo que rompería las claves foráneas de `conversaciones`— se añade la
-- columna `auth_id`. Las filas antiguas se quedan con `auth_id` nulo, así que
-- dejan de ser visibles para los anónimos y solo las ven los agentes. Es
-- justo el comportamiento que se busca: son conversaciones de prueba y de
-- personas que ya no tienen forma de reclamar esa sesión.
--
-- Es idempotente, como el resto del esquema.
-- ============================================================================

-- ---- 1. Identidad del visitante ------------------------------------------

alter table public.visitantes
  add column if not exists auth_id uuid unique references auth.users(id) on delete set null;

comment on column public.visitantes.auth_id is
  'Usuario anónimo de Supabase que posee esta ficha. Es el único vínculo en el '
  'que se apoyan las políticas: el id de localStorage no autoriza nada.';

create index if not exists visitantes_auth_id_idx on public.visitantes (auth_id);

-- ---- 2. ¿De quién es esta conversación? ----------------------------------

-- Se encapsula en una función para no repetir el subselect en cada política
-- y para que `mensajes` no tenga que saber cómo se relaciona con `visitantes`.
create or replace function public.conversacion_es_mia(conversacion uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversaciones c
    join public.visitantes v on v.id = c.visitor_id
    where c.id = conversacion
      and v.auth_id is not null
      and v.auth_id = auth.uid()
  );
$$;

comment on function public.conversacion_es_mia(uuid) is
  'true si la conversación pertenece al visitante autenticado en esta sesión.';

-- ---- 3. Apertura de conversación en un contexto autorizado ---------------

-- El mensaje de bienvenida lo firma el bot. Antes lo insertaba el propio
-- widget con `autor = 'bot'`, lo que obligaba a permitir a un anónimo escribir
-- como bot — y quien puede escribir como bot puede suplantarlo en cualquier
-- conversación. Ahora la apertura entera (ficha + conversación + bienvenida)
-- ocurre dentro de esta función, que es lo único con permiso para escribir un
-- mensaje que no sea del visitante.
create or replace function public.abrir_conversacion(
  p_nombre text default null,
  p_email text default null,
  p_telefono text default null,
  p_user_agent text default null,
  p_bienvenida text default null
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

  -- Una ficha por usuario anónimo. Si ya existe se actualizan los datos de
  -- contacto solo cuando llegan rellenos, para no borrar lo que ya había.
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

  -- Una conversación abierta a la vez, igual que antes.
  select id into v_conversacion
    from public.conversaciones
   where visitor_id = v_visitante and estado = 'abierta'
   order by created_at desc
   limit 1;

  if v_conversacion is null then
    insert into public.conversaciones (visitor_id, estado, ultimo_mensaje_at)
    values (v_visitante, 'abierta', now())
    returning id into v_conversacion;

    if p_bienvenida is not null and p_bienvenida <> '' then
      insert into public.mensajes (conversacion_id, autor, texto)
      values (v_conversacion, 'bot', p_bienvenida);
    end if;
  end if;

  return v_conversacion;
end;
$$;

comment on function public.abrir_conversacion is
  'Crea (o recupera) la conversación abierta del visitante autenticado. Es el '
  'único camino por el que un visitante puede provocar un mensaje del bot.';

revoke all on function public.abrir_conversacion(text, text, text, text, text) from public;
grant execute on function public.abrir_conversacion(text, text, text, text, text)
  to anon, authenticated;

-- ---- 4. Políticas nuevas -------------------------------------------------

drop policy if exists "chat lectura visitantes"      on public.visitantes;
drop policy if exists "chat alta visitantes"         on public.visitantes;
drop policy if exists "chat actualiza visitantes"    on public.visitantes;
drop policy if exists "chat lectura conversaciones"  on public.conversaciones;
drop policy if exists "chat alta conversaciones"     on public.conversaciones;
drop policy if exists "chat lectura mensajes"        on public.mensajes;
drop policy if exists "visitante escribe mensajes"   on public.mensajes;

-- Visitantes: cada uno la suya. El agente las ve todas para poder atender.
drop policy if exists "visitante lee su ficha"    on public.visitantes;
drop policy if exists "visitante crea su ficha"   on public.visitantes;
drop policy if exists "visitante edita su ficha"  on public.visitantes;
drop policy if exists "agente lee visitantes"     on public.visitantes;

create policy "visitante lee su ficha"
  on public.visitantes for select to anon, authenticated
  using (auth_id is not null and auth_id = auth.uid());

create policy "visitante crea su ficha"
  on public.visitantes for insert to anon, authenticated
  with check (auth_id is not null and auth_id = auth.uid());

-- Solo sus propios datos, y sin poder reasignarse la ficha a otro usuario.
create policy "visitante edita su ficha"
  on public.visitantes for update to anon, authenticated
  using (auth_id is not null and auth_id = auth.uid())
  with check (auth_id is not null and auth_id = auth.uid());

create policy "agente lee visitantes"
  on public.visitantes for select to authenticated
  using (public.es_agente());

-- Conversaciones: las suyas. El alta pasa por `abrir_conversacion()`, pero se
-- deja el insert acotado por si el cliente necesita crearla directamente.
drop policy if exists "visitante lee sus conversaciones"  on public.conversaciones;
drop policy if exists "visitante abre conversacion"       on public.conversaciones;
drop policy if exists "agente lee conversaciones"         on public.conversaciones;

create policy "visitante lee sus conversaciones"
  on public.conversaciones for select to anon, authenticated
  using (
    exists (
      select 1 from public.visitantes v
      where v.id = visitor_id and v.auth_id is not null and v.auth_id = auth.uid()
    )
  );

create policy "visitante abre conversacion"
  on public.conversaciones for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.visitantes v
      where v.id = visitor_id and v.auth_id is not null and v.auth_id = auth.uid()
    )
  );

create policy "agente lee conversaciones"
  on public.conversaciones for select to authenticated
  using (public.es_agente());

-- Mensajes: los de sus conversaciones, y solo puede hablar como visitante.
drop policy if exists "visitante lee sus mensajes"   on public.mensajes;
drop policy if exists "visitante manda mensaje"      on public.mensajes;
drop policy if exists "agente lee mensajes"          on public.mensajes;

create policy "visitante lee sus mensajes"
  on public.mensajes for select to anon, authenticated
  using (public.conversacion_es_mia(conversacion_id));

create policy "visitante manda mensaje"
  on public.mensajes for insert to anon, authenticated
  with check (autor = 'visitor' and public.conversacion_es_mia(conversacion_id));

create policy "agente lee mensajes"
  on public.mensajes for select to authenticated
  using (public.es_agente());

-- ---- 5. El cliente no se aprueba su propio descuento ---------------------

-- RLS filtra filas, no columnas: `cliente actualiza su ficha` dejaba al
-- cliente escribir cualquier columna de SU fila, y el estado del descuento
-- educativo está en esa fila. Podía ponerse 'aprobado' él solo.
--
-- Se le quita el UPDATE directo y pasa por una función que respeta las
-- columnas que no le corresponden.
drop policy if exists "cliente actualiza su ficha" on public.clientes;

create or replace function public.actualizar_mi_ficha(
  p_nombre text default null,
  p_telefono text default null,
  p_direccion_envio jsonb default null,
  p_direccion_facturacion jsonb default null,
  p_descuento_archivo text default null
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
     set nombre                 = coalesce(p_nombre, nombre),
         telefono               = coalesce(p_telefono, telefono),
         direccion_envio        = coalesce(p_direccion_envio, direccion_envio),
         direccion_facturacion  = coalesce(p_direccion_facturacion, direccion_facturacion),
         -- Subir un justificante nuevo devuelve la solicitud a 'pendiente'.
         -- El cliente puede aportar el documento; quien decide es el agente.
         descuento_educativo_archivo =
           coalesce(p_descuento_archivo, descuento_educativo_archivo),
         descuento_educativo_estado =
           case
             when p_descuento_archivo is not null then 'pendiente'
             else descuento_educativo_estado
           end
   where id = v_uid;
end;
$$;

comment on function public.actualizar_mi_ficha is
  'Único camino del cliente para editar su ficha. Deja fuera a propósito el '
  'estado del descuento educativo, que solo mueve el agente.';

revoke all on function public.actualizar_mi_ficha(text, text, jsonb, jsonb, text) from public;
grant execute on function public.actualizar_mi_ficha(text, text, jsonb, jsonb, text)
  to authenticated;
