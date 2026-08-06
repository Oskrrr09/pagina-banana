-- Las sesiones anónimas del chat dejan de valer como cuentas de cliente.
--
-- QUÉ ESTABA ROTO
--
-- `signInAnonymously()` no crea un rol aparte. Supabase le da a la sesión
-- anónima el mismo rol PostgreSQL que a una cuenta de verdad: `authenticated`.
-- La única diferencia es un reclamo del JWT, `is_anonymous: true`.
--
-- Todas las políticas escritas `to authenticated` alcanzaban por tanto también
-- a cualquiera que hubiera abierto el chat. Con eso, un visitante anónimo
-- podía crear su ficha en `clientes`, crear pedidos, crear y cancelar
-- reservas, subir un justificante educativo y pedir su revisión. Nada de eso
-- exige registrarse: basta con abrir el widget del chat.
--
-- El chat SÍ debe funcionar con sesión anónima —es su motivo de existir—. Lo
-- que no debe es abrir la puerta al resto de la tienda.
--
-- CÓMO SE CIERRA
--
-- `public.es_usuario_permanente()` lee el reclamo y decide. Se aplica de dos
-- formas, según lo que sea seguro en cada sitio:
--
--   · Políticas RESTRICTIVAS en `clientes`, `pedidos` y `reservas`. Las
--     políticas normales son permisivas y se combinan con OR, así que añadir
--     la condición sólo a las existentes deja la puerta abierta a que una
--     política nueva —escrita más adelante, con toda la buena fe— vuelva a
--     conceder el acceso por su cuenta. Una restrictiva se combina con AND
--     sobre todas las demás: mientras exista, ninguna política futura puede
--     saltársela.
--
--   · Condición incorporada, en Storage y en los RPC. En `storage.objects` una
--     restrictiva alcanzaría a TODOS los buckets del proyecto, incluidos los
--     que no son de esta aplicación, así que allí la condición va dentro de
--     las políticas del bucket. Y los RPC son `security definer`: se ejecutan
--     con los permisos de su propietario y RLS no los mira, por lo que la
--     comprobación tiene que estar escrita dentro de cada función.
--
-- Se comprueba en `tests/schema/anonimos.test.ts` (PostgreSQL real) y en
-- `tests/rls/politicas.spec.ts` (GoTrue real, sesiones anónimas de verdad).

-- --------------------------------------------------------------
-- La comprobación reutilizable
-- --------------------------------------------------------------
-- `auth.jwt()` devuelve los reclamos de la petición. Una sesión anónima trae
-- `is_anonymous: true`; una cuenta permanente trae `false` o no lo trae. El
-- `coalesce` hace que la ausencia signifique "permanente", que es lo correcto
-- para las cuentas creadas antes de que existieran las sesiones anónimas.
--
-- `stable` y no `volatile`: dentro de una misma sentencia el JWT no cambia, y
-- así el planificador puede evaluarla una vez por consulta en vez de por fila.
-- `security definer` por coherencia con `es_agente()` y para no depender de
-- que `auth.jwt()` tenga EXECUTE concedido al rol que consulta. No amplía nada:
-- `request.jwt.claims` es un ajuste de la transacción, así que sigue leyendo el
-- JWT de quien llama y no el de nadie más.
create or replace function public.es_usuario_permanente()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false;
$$;

-- Las expresiones de una política se evalúan con los permisos de quien
-- consulta, así que `authenticated` necesita EXECUTE o la política fallaría
-- con «permission denied for function». No se concede a `anon`: ese rol no
-- aparece en ninguna de las políticas que la usan.
revoke all on function public.es_usuario_permanente() from public, anon;
grant execute on function public.es_usuario_permanente() to authenticated;

-- --------------------------------------------------------------
-- Políticas restrictivas: clientes, pedidos y reservas
-- --------------------------------------------------------------
drop policy if exists "solo cuentas permanentes" on public.clientes;
drop policy if exists "solo cuentas permanentes" on public.pedidos;
drop policy if exists "solo cuentas permanentes" on public.reservas;

create policy "solo cuentas permanentes"
  on public.clientes as restrictive for all to authenticated
  using (public.es_usuario_permanente())
  with check (public.es_usuario_permanente());

create policy "solo cuentas permanentes"
  on public.pedidos as restrictive for all to authenticated
  using (public.es_usuario_permanente())
  with check (public.es_usuario_permanente());

create policy "solo cuentas permanentes"
  on public.reservas as restrictive for all to authenticated
  using (public.es_usuario_permanente())
  with check (public.es_usuario_permanente());

-- Y además dentro del alta de la ficha, que es la operación que el frontend
-- disparaba solo. Duplicar la condición aquí no sobra: deja el requisito
-- escrito en la política que lo concede, no sólo en la que lo limita.
drop policy if exists "cliente crea su ficha" on public.clientes;
create policy "cliente crea su ficha"
  on public.clientes for insert to authenticated
  with check (
    id = auth.uid()
    and public.es_usuario_permanente()
    and descuento_educativo_estado is null
    and descuento_educativo_archivo is null
    and descuento_educativo_nota is null
    and descuento_educativo_subido_at is null
    and descuento_educativo_revisado_at is null
    and descuento_educativo_revisado_por is null
  );

drop policy if exists "cliente lee su ficha" on public.clientes;
create policy "cliente lee su ficha"
  on public.clientes for select to authenticated
  using ((id = auth.uid() and public.es_usuario_permanente()) or public.es_agente());

-- --------------------------------------------------------------
-- Storage: el justificante educativo
-- --------------------------------------------------------------
-- Aquí la condición va incorporada, no en una restrictiva: `storage.objects`
-- es una tabla compartida por todos los buckets del proyecto y una política
-- restrictiva alcanzaría también a los que no son de esta aplicación.
drop policy if exists "cliente sube su justificante"      on storage.objects;
drop policy if exists "cliente sustituye su justificante" on storage.objects;
drop policy if exists "cliente lee su justificante"       on storage.objects;

create policy "cliente sube su justificante"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'descuentos-educativos'
    and public.es_usuario_permanente()
    and name ~ ('^' || auth.uid()::text || '/justificante\.(pdf|jpg|jpeg|png)$')
  );

create policy "cliente sustituye su justificante"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'descuentos-educativos'
    and public.es_usuario_permanente()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'descuentos-educativos'
    and public.es_usuario_permanente()
    and name ~ ('^' || auth.uid()::text || '/justificante\.(pdf|jpg|jpeg|png)$')
  );

create policy "cliente lee su justificante"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'descuentos-educativos'
    and public.es_usuario_permanente()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- --------------------------------------------------------------
-- RPC de cliente: la comprobación va dentro
-- --------------------------------------------------------------
-- Son `security definer`. Se ejecutan con los permisos de su propietario, así
-- que RLS no las filtra y la política restrictiva de arriba no las alcanza.
--
-- El error es 42501 (privilegio insuficiente) y no un mensaje genérico, para
-- que el frontend pueda distinguir "te falta registrarte" de un fallo real.

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
  if not public.es_usuario_permanente() then
    raise exception 'Hace falta una cuenta registrada, no una sesión anónima'
      using errcode = '42501';
  end if;

  update public.clientes
     set nombre   = coalesce(nullif(p_nombre, ''), nombre),
         telefono = coalesce(nullif(p_telefono, ''), telefono),
         direccion_envio = coalesce(p_direccion_envio, direccion_envio),
         direccion_facturacion = coalesce(p_direccion_facturacion, direccion_facturacion)
   where id = v_uid;
  if not found then
    raise exception 'No hay ficha de cliente para esta sesión' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.actualizar_mi_ficha(text, text, jsonb, jsonb) from public;
grant execute on function public.actualizar_mi_ficha(text, text, jsonb, jsonb) to authenticated;

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
  if not public.es_usuario_permanente() then
    raise exception 'Hace falta una cuenta registrada, no una sesión anónima'
      using errcode = '42501';
  end if;

  update public.reservas
     set estado = 'cancelada'
   where id = p_reserva_id
     and cliente_id = v_uid
     and estado in ('en-espera', 'disponible');
  get diagnostics v_afectadas = row_count;

  if v_afectadas = 0 then
    raise exception 'La reserva no existe, no es tuya o ya no se puede cancelar'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.cancelar_mi_reserva(uuid) from public;
grant execute on function public.cancelar_mi_reserva(uuid) to authenticated;

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
  if not public.es_usuario_permanente() then
    raise exception 'Hace falta una cuenta registrada, no una sesión anónima'
      using errcode = '42501';
  end if;
  if p_ruta is null
     or p_ruta !~ ('^' || v_uid::text || '/justificante\.(pdf|jpg|jpeg|png)$') then
    raise exception 'La ruta no pertenece a esta cuenta o no tiene un formato permitido'
      using errcode = '42501';
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
  -- Una sesión anónima nunca tiene ficha de cliente, así que el `if` de abajo
  -- ya la rechazaría. La comprobación explícita da el motivo correcto en vez
  -- de «no hay ficha», que sugeriría que basta con crearla.
  if not public.es_usuario_permanente() then
    raise exception 'Hace falta una cuenta registrada, no una sesión anónima'
      using errcode = '42501';
  end if;
  if not exists (select 1 from public.clientes where id = v_uid) then
    raise exception 'Esta sesión no tiene ficha de cliente' using errcode = '42501';
  end if;

  update public.visitantes set cliente_id = v_uid where auth_id = v_uid;
end;
$$;
revoke all on function public.vincular_mi_visitante_a_cliente() from public;
grant execute on function public.vincular_mi_visitante_a_cliente() to authenticated;

-- `crear_mis_reservas` ya exigía ficha de cliente, y una sesión anónima no
-- puede tener ninguna, así que estaba cubierta de rebote. La comprobación se
-- escribe igualmente y primero: da el motivo correcto —«hace falta cuenta»— en
-- vez de «esta sesión no tiene ficha de cliente», que invita a intentar
-- crearla. El resto del cuerpo es idéntico al de la migración de estado
-- seguro; se repite entero porque `create or replace` no admite parches.
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
  if not public.es_usuario_permanente() then
    raise exception 'Hace falta una cuenta registrada, no una sesión anónima'
      using errcode = '42501';
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

    begin
      v_precio := (v_linea->>'price')::numeric;
    exception when others then
      raise exception 'Precio no numérico';
    end;
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

    for i in 1..v_unidades loop
      insert into public.reservas (
        cliente_id, family, model_slug, model_name, variant_label, price, estado, pagado_at
      ) values (
        v_uid, v_family, v_slug, v_nombre, v_variant, v_precio, 'en-espera', now()
      )
      returning id into v_id;
      return next v_id;
    end loop;
  end loop;
end;
$$;
revoke all on function public.crear_mis_reservas(jsonb) from public;
grant execute on function public.crear_mis_reservas(jsonb) to authenticated;

-- La posición en la cola es lectura de `reservas`, y también pasa por función
-- `security definer`. Una sesión anónima no puede ser dueña de ninguna reserva,
-- así que ya devolvía null; se deja explícito para que no dependa de eso.
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
  if not public.es_usuario_permanente() then
    return null;
  end if;

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
revoke all on function public.posicion_en_cola(uuid) from public, anon;
grant execute on function public.posicion_en_cola(uuid) to authenticated;
