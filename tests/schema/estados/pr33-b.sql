-- ============================================================================
-- 2026-08-02 (b) · Cierra los huecos de escritura que quedaron abiertos
--
-- La migración anterior cerró la LECTURA de datos ajenos. La revisión del
-- PR #33 encontró que la ESCRITURA seguía teniendo agujeros, y varios los
-- introduje yo al arreglar lo primero:
--
--   1. `abrir_conversacion()` recibía el texto de la bienvenida y lo guardaba
--      con `autor = 'bot'`. Como el texto lo manda el navegador, cualquiera
--      podía llamar al RPC y almacenar la afirmación que quisiera firmada por
--      el bot. Además fijaba una bienvenida en castellano en una base que
--      sirve a cinco idiomas.
--   2. Un visitante podía ponerse `cliente_id` de otra persona: RLS filtra
--      filas, no columnas, así que "puede editar su fila" incluía esa.
--   3. La política de alta de `clientes` solo comprobaba `id = auth.uid()`.
--      Nada impedía crear la ficha ya con `descuento_educativo_estado`
--      en 'aprobado'.
--   4. `cliente cancela sus reservas` daba UPDATE sobre la fila entera: se
--      podía cambiar el precio, el producto o `pagado_at`, que es lo que fija
--      el puesto en la cola.
--
-- Idempotente, como el resto.
-- ============================================================================

-- ---- 1. La bienvenida deja de venir del cliente --------------------------

-- Se elimina el parámetro. La bienvenida ya no se persiste: la pinta el widget
-- en el idioma activo. Guardarla en la base obligaba a elegir un idioma para
-- siempre y, sobre todo, obligaba a aceptar texto del navegador como si lo
-- hubiera dicho el bot.
drop function if exists public.abrir_conversacion(text, text, text, text, text);

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

comment on function public.abrir_conversacion is
  'Crea (o recupera) la conversación abierta del visitante autenticado. No '
  'acepta texto: ningún mensaje firmado como bot puede originarse en el cliente.';

revoke all on function public.abrir_conversacion(text, text, text, text) from public;
grant execute on function public.abrir_conversacion(text, text, text, text)
  to anon, authenticated;

-- ---- 2. `cliente_id` y `auth_id` dejan de ser editables ------------------

-- RLS no sabe de columnas, así que la protección va en un disparador. La
-- vinculación legítima levanta una bandera de transacción antes de escribir;
-- es lo único que la deja pasar.
create or replace function public.visitantes_protege_columnas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists visitantes_protege_columnas on public.visitantes;
create trigger visitantes_protege_columnas
  before update on public.visitantes
  for each row execute function public.visitantes_protege_columnas();

-- Vincula la ficha del visitante con SU cuenta. No acepta parámetros: el UID
-- sale de la sesión, así que no hay nada que falsificar. Solo vincula si ese
-- mismo usuario tiene ficha de cliente.
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

-- ---- 3. El alta de cliente no puede venir aprobada -----------------------

drop policy if exists "cliente crea su ficha" on public.clientes;

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

-- ---- 4. Justificante educativo ------------------------------------------

-- Antes: subir el archivo y luego un UPDATE directo sobre `clientes`. Con las
-- políticas nuevas ese UPDATE ya no existe, así que el archivo quedaría subido
-- y la solicitud sin registrar.
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

  -- La ruta debe estar dentro de la carpeta del propio usuario. Sin esto,
  -- alguien podría registrar como suyo el justificante de otra persona y
  -- provocar que el agente revisara un documento ajeno.
  if p_ruta is null or p_ruta not like (v_uid::text || '/%') then
    raise exception 'La ruta no pertenece a esta cuenta' using errcode = '42501';
  end if;

  update public.clientes
     set descuento_educativo_archivo = p_ruta,
         descuento_educativo_estado = 'pendiente',
         descuento_educativo_subido_at = now(),
         -- Vuelve a la cola desde cero: lo que dijera la revisión anterior ya
         -- no aplica al documento nuevo.
         descuento_educativo_nota = null,
         descuento_educativo_revisado_at = null,
         descuento_educativo_revisado_por = null
   where id = v_uid;

  if not found then
    raise exception 'No hay ficha de cliente para esta sesión' using errcode = '42501';
  end if;
end;
$$;

comment on function public.registrar_mi_justificante(text) is
  'Registra el justificante del propio cliente y deja la solicitud pendiente. '
  'No puede aprobar ni rechazar: eso solo lo hace el agente.';

revoke all on function public.registrar_mi_justificante(text) from public;
grant execute on function public.registrar_mi_justificante(text) to authenticated;

-- ---- 5. Reservas: solo cancelar, y solo las propias ----------------------

-- La política daba UPDATE sobre la fila entera. Se podía cambiar el precio, el
-- producto, o `pagado_at`, que es lo que fija el puesto en la lista de espera.
drop policy if exists "cliente cancela sus reservas" on public.reservas;

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
   where id = p_reserva_id
     and cliente_id = v_uid
     and estado = 'en-espera';

  get diagnostics v_afectadas = row_count;
  if v_afectadas = 0 then
    raise exception 'No hay ninguna reserva tuya en espera con ese identificador'
      using errcode = '42501';
  end if;
end;
$$;

comment on function public.cancelar_mi_reserva(uuid) is
  'Cancela una reserva propia que siga en espera. Es lo único que el cliente '
  'puede cambiar de una reserva: ni precio, ni producto, ni pagado_at.';

revoke all on function public.cancelar_mi_reserva(uuid) from public;
grant execute on function public.cancelar_mi_reserva(uuid) to authenticated;

-- ---- 6. Repaso de las funciones `security definer` -----------------------

-- Todas las de este proyecto deben cumplir lo mismo: `search_path` fijo (si no,
-- quien controle el suyo puede colocar una tabla suya delante y hacer que la
-- función escriba donde no debe), sin permiso para `public`, y concedido solo
-- al rol que la necesita.

-- Auxiliares: las usan las políticas, no la API. Nadie debe poder llamarlas.
revoke all on function public.conversacion_es_mia(uuid) from public, anon, authenticated;
revoke all on function public.visitantes_protege_columnas() from public, anon, authenticated;

-- `es_agente()` sí la consultan las políticas y también el panel para saber si
-- la sesión tiene permiso, así que se deja al rol autenticado.
revoke all on function public.es_agente() from public, anon;
grant execute on function public.es_agente() to authenticated;

do $$
begin
  -- Se fija el search_path de las que venían del esquema original y no lo
  -- declaraban. Sin él, `security definer` es un vector de escalada.
  if exists (select 1 from pg_proc where proname = 'es_agente' and pronamespace = 'public'::regnamespace) then
    execute 'alter function public.es_agente() set search_path = public';
  end if;
  if exists (select 1 from pg_proc where proname = 'revisar_descuento_educativo' and pronamespace = 'public'::regnamespace) then
    execute 'alter function public.revisar_descuento_educativo(uuid, text, text) set search_path = public';
  end if;
end $$;

-- ---- 7. `actualizar_mi_ficha` sin el parámetro del justificante ----------

-- La primera versión aceptaba `p_descuento_archivo` y movía el estado a
-- 'pendiente'. Eso ahora vive en `registrar_mi_justificante()`, que además
-- comprueba que la ruta sea de la carpeta del propio usuario. Se quita de
-- aquí para que cada función escriba solo lo suyo.
drop function if exists public.actualizar_mi_ficha(text, text, jsonb, jsonb, text);

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
  -- `null` = no tocar, `''` = limpiar. Sin la distinción no se puede borrar
  -- un teléfono: `undefined` y `null` llegan igual por la red.
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
