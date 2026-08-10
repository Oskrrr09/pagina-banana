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
  -- Resolución ATÓMICA del visitante, apoyada en `visitantes_auth_id_key`.
  --
  -- Antes esto era «buscar, y si no está insertar», con un `for update`
  -- DESPUÉS. Y ese bloqueo no puede proteger una fila que todavía no existe:
  -- en la PRIMERA apertura de una cuenta, dos llamadas concurrentes veían las
  -- dos que no había visitante, las dos insertaban, y una se estrellaba contra
  -- la unicidad. Medido con un único token compartido y dos POST simultáneos al
  -- RPC: 13 de 13 iteraciones devolvieron `23505` en una de las dos llamadas,
  -- con HTTP 409, y alternando cuál de ellas fallaba. La integridad se
  -- conservaba —un visitante y una conversación—, pero uno de los dos que
  -- abrían el chat se quedaba sin conversación.
  --
  -- Con `on conflict (auth_id) do update` la carrera desaparece por
  -- construcción: quien pierde no revienta, relee la fila del ganador. Y el
  -- `do update` toma el bloqueo de esa fila y lo mantiene hasta el final de la
  -- transacción, así que también serializa el tramo de abajo —buscar
  -- conversación reciente y crearla si falta— para ese mismo visitante. Por eso
  -- el `for update` que había aquí se retira: era redundante con este bloqueo y
  -- llegaba tarde para lo único que no cubría.
  --
  -- La semántica de actualización se conserva: nombre, email y teléfono sólo se
  -- pisan si llega un valor no vacío, y `user_agent` se sigue sin guardar.
  -- `cliente_id` y `auth_id` no se tocan.
  insert into public.visitantes (auth_id, nombre, email, telefono, user_agent)
  values (v_uid, p_nombre, p_email, p_telefono, null)
  on conflict (auth_id) do update
     set nombre     = coalesce(nullif(excluded.nombre, ''), public.visitantes.nombre),
         email      = coalesce(nullif(excluded.email, ''), public.visitantes.email),
         telefono   = coalesce(nullif(excluded.telefono, ''), public.visitantes.telefono),
         user_agent = null
  returning id into v_visitante;

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
