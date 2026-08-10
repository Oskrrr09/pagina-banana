-- ---------------------------------------------------------------------------
-- Continuidad temporal de la conversación
-- ---------------------------------------------------------------------------
--
-- `abrir_conversacion()` reutilizaba CUALQUIER conversación abierta del
-- visitante, sin mirar cuándo fue la última vez que alguien escribió. Medido
-- contra el Supabase local antes de este cambio: una conversación con 45
-- minutos de inactividad se devolvía igual, así que una cuenta permanente
-- arrastraba la misma conversación indefinidamente.
--
-- El otro extremo tampoco vale: crear una conversación nueva en cada arranque
-- rompería el caso real de una caída de conexión, un cierre accidental o iOS
-- terminando la aplicación, donde quien vuelve a los dos minutos espera seguir
-- donde estaba.
--
-- La regla queda en CONTINUIDAD TEMPORAL: una conversación abierta se reanuda
-- mientras siga siendo reciente, y treinta minutos de inactividad la dan por
-- terminada a efectos de reanudación.
--
-- QUÉ CUENTA COMO ACTIVIDAD
--
-- `ultimo_mensaje_at`, que mantiene el disparador `trg_touch_conversation`
-- después de insertar en `mensajes`. Se eligió por ser lo único que refleja
-- conversación de verdad: se mueve con un mensaje del visitante y también con
-- uno del agente —el disparador no mira el autor—, y NO se mueve por una
-- asignación ni por un cambio administrativo. Una conversación recién creada
-- nace con la fecha puesta, así que el campo nunca queda nulo por esta vía.
--
-- El corte es ESTRICTO: exactamente treinta minutos ya está fuera.
--
-- QUÉ NO HACE
--
-- No cierra nada. Una conversación que deja de ser reanudable sigue `abierta`
-- y sigue en el servidor como histórico: el estado operativo de la
-- conversación y la ventana de continuidad son dos cosas distintas, y
-- mezclarlas cerraría conversaciones a espaldas del agente.
--
-- El resto de la función se conserva igual: `security definer`, `search_path`,
-- la resolución del visitante y la firma del RPC.
-- ---------------------------------------------------------------------------

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

  -- El `for update` serializa dos aperturas simultáneas del mismo visitante:
  -- la segunda espera y ve la conversación que acaba de crear la primera, en
  -- vez de crear otra. Sin él, dos pestañas abiertas a la vez —o el doble
  -- render de un montaje— podían terminar en conversaciones distintas.
  perform 1 from public.visitantes where id = v_visitante for update;

  select id into v_conversacion
    from public.conversaciones
   where visitor_id = v_visitante
     and estado = 'abierta'
     and ultimo_mensaje_at > now() - interval '30 minutes'
   order by ultimo_mensaje_at desc
   limit 1;

  if v_conversacion is null then
    insert into public.conversaciones (visitor_id, estado, ultimo_mensaje_at)
    values (v_visitante, 'abierta', now())
    returning id into v_conversacion;
  end if;

  return v_conversacion;
end;
$$;
