-- Cierre de privacidad del chat y límites del bucket educativo.
--
-- Esta migración puede aplicarse después de 20260802000100_estado_seguro.sql.
-- Conserva la firma de abrir_conversacion() para no romper clientes que aún
-- envíen p_user_agent, pero deja de almacenarlo y limpia el dato histórico.

update public.visitantes
   set user_agent = null
 where user_agent is not null;

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

  -- p_user_agent se mantiene solo por compatibilidad de firma. No se guarda:
  -- no participa en ninguna función del prototipo y aumenta la huella de
  -- identificación del visitante sin aportar una finalidad demostrable.
  select id into v_visitante from public.visitantes where auth_id = v_uid;
  if v_visitante is null then
    insert into public.visitantes (auth_id, nombre, email, telefono, user_agent)
    values (v_uid, p_nombre, p_email, p_telefono, null)
    returning id into v_visitante;
  else
    update public.visitantes
       set nombre     = coalesce(nullif(p_nombre, ''), nombre),
           email      = coalesce(nullif(p_email, ''), email),
           telefono   = coalesce(nullif(p_telefono, ''), telefono),
           user_agent = null
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

-- Los límites viven también en Storage, no solo en la validación React.
-- Así siguen aplicándose si alguien usa directamente la anon key.
update storage.buckets
   set public = false,
       file_size_limit = 5242880,
       allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']::text[]
 where id = 'descuentos-educativos';

drop policy if exists "cliente sube su justificante" on storage.objects;
drop policy if exists "cliente sustituye su justificante" on storage.objects;

create policy "cliente sube su justificante"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'descuentos-educativos'
    and name ~ ('^' || auth.uid()::text || '/justificante\.(pdf|jpg|jpeg|png)$')
  );

create policy "cliente sustituye su justificante"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'descuentos-educativos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'descuentos-educativos'
    and name ~ ('^' || auth.uid()::text || '/justificante\.(pdf|jpg|jpeg|png)$')
  );

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
