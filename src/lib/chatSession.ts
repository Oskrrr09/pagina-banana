import { useCallback, useEffect, useRef, useState } from 'react'
import {
  supabase,
  supabaseAgent,
  supabaseEnabled,
  type DbConversation,
  type DbMessage,
  type DbVisitor,
} from './supabase'

// ============================================================================
// chatSession — sesión de chat del visitante contra Supabase
//
// Un visitante = un navegador. Guardamos su UUID en localStorage para que
// persista entre visitas y podamos recuperar historial. Cada visitante tiene
// una única conversación "abierta" a la vez (Fase 1); si el agente la cierra
// se abriría una nueva en el próximo mensaje.
//
// El hook expone:
//   messages       → lista ordenada del historial + tiempo real
//   sendMessage()  → inserta un mensaje del visitante
//   status         → 'loading' | 'ready' | 'demo' | 'error'
//   demo           → true cuando no hay Supabase configurado (usa el fallback
//                    de canned replies del componente)
// ============================================================================

const CONVERSATION_STORAGE_KEY = 'bananito:conversation_id'
// Nombre y email de quien escribe sin cuenta. Se guardan para no volver a
// pedírselos en cada visita desde el mismo navegador.
const GUEST_STORAGE_KEY = 'bananito:guest'

const WELCOME_TEXT =
  '¡Hola! Soy Bananito 🍌 el asistente de Banana Computer. Puedo ayudarte con productos, accesorios, comparar modelos, tiendas o precios. ¿En qué te ayudo?'

type Status = 'loading' | 'ready' | 'demo' | 'error'

export interface ChatSession {
  messages: DbMessage[]
  sendMessage: (texto: string) => Promise<void>
  status: Status
  demo: boolean
  conversationId: string | null
  /**
   * true cuando hace falta pedir nombre y email antes de empezar: no hay
   * sesión de cliente y este navegador no los ha dado todavía.
   */
  necesitaDatos: boolean
  /** Guarda nombre y email del visitante anónimo y arranca la conversación. */
  registrarDatos: (nombre: string, email: string) => Promise<{ error: string | null }>
  /** Estado de cierre y valoración de la conversación en curso. */
  cierre: {
    cerrada: boolean
    valoracionSolicitada: boolean
    valoracionEnviada: boolean
  }
  enviarValoracion: (
    estrellas: number,
    observacion: string,
  ) => Promise<{ error: string | null }>
  /**
   * Abre una conversación nueva dejando atrás la cerrada, sin recargar la
   * página. El historial anterior sigue en la base de datos.
   */
  empezarNuevaConversacion: () => void
}

function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function removeStored(key: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* localStorage puede estar deshabilitada; ignoramos */
  }
}

function writeStored(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* localStorage puede estar deshabilitada; ignoramos y seguimos en sesión */
  }
}

/**
 * Identidad del cliente cuando escribe con la sesión iniciada, para que el
 * agente vea con quién habla en vez de un UUID.
 */
export interface VisitorIdentity {
  clienteId: string
  nombre: string | null
  email: string | null
  telefono: string | null
}

/** Datos de contacto de quien escribe sin cuenta. */
interface GuestIdentity {
  nombre: string
  email: string
}

function readGuest(): GuestIdentity | null {
  const raw = readStored(GUEST_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<GuestIdentity>
    if (!parsed.nombre || !parsed.email) return null
    return { nombre: parsed.nombre, email: parsed.email }
  } catch {
    return null
  }
}

/**
 * Asegura que hay sesión de Supabase antes de tocar el chat.
 *
 * Es la pieza que sostiene toda la seguridad del chat. Antes el visitante se
 * identificaba con un UUID guardado en `localStorage`, que es un dato que él
 * mismo puede editar desde la consola del navegador: servía para recordar la
 * conversación, pero no autorizaba nada. Las políticas de Supabase tenían que
 * abrirse a `anon` en canal, y eso dejaba los datos de todos al alcance de
 * cualquiera.
 *
 * Ahora se pide una sesión anónima real. El `auth.uid()` va firmado en el JWT
 * y es lo único de lo que cuelgan las políticas.
 *
 * Si ya hay sesión no se toca: puede ser la de un cliente con cuenta, y en ese
 * caso su chat queda ligado a su cuenta, que es lo deseable.
 *
 * Devuelve false cuando el proyecto no tiene activados los inicios de sesión
 * anónimos (Authentication → Providers → Anonymous sign-ins). En ese caso el
 * chat cae a modo demostración en vez de romperse.
 */
async function asegurarSesion(): Promise<boolean> {
  if (!supabase) return false
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session) return true

  const { error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.warn(
      '[chatSession] no se pudo crear sesión anónima; el chat queda en modo ' +
        'demostración. Comprueba que los inicios de sesión anónimos están ' +
        'activados en Supabase.',
      error,
    )
    return false
  }
  return true
}

/**
 * Abre (o recupera) la conversación del visitante autenticado.
 *
 * Toda la apertura ocurre dentro de `abrir_conversacion()` en el servidor:
 * crea la ficha si hace falta, la conversación, y el mensaje de bienvenida.
 *
 * La bienvenida importa más de lo que parece: la firma el bot, y antes la
 * insertaba este mismo código con `autor: 'bot'`. Eso obligaba a que las
 * políticas dejaran a un anónimo escribir como bot — y quien puede escribir
 * como bot puede suplantarlo en la conversación de cualquiera. Ahora el
 * visitante solo puede escribir con `autor: 'visitor'`.
 */
async function abrirConversacion(
  identity: VisitorIdentity | null,
  guest: GuestIdentity | null,
): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado')

  // La cuenta manda sobre los datos escritos a mano como invitado.
  const nombre = identity?.nombre ?? guest?.nombre ?? null
  const email = identity?.email ?? guest?.email ?? null
  const telefono = identity?.telefono ?? null

  const { data, error } = await supabase.rpc('abrir_conversacion', {
    p_nombre: nombre,
    p_email: email,
    p_telefono: telefono,
    p_user_agent: navigator.userAgent,
    p_bienvenida: WELCOME_TEXT,
  })
  if (error) throw error

  // Si además tiene cuenta, se enlaza la ficha con el cliente para que el
  // agente le vea identificado. Va aparte porque la función de apertura no
  // conoce el modelo de clientes.
  if (identity?.clienteId) {
    const { error: errorEnlace } = await supabase
      .from('visitantes')
      .update({ cliente_id: identity.clienteId })
      .eq('auth_id', (await supabase.auth.getUser()).data.user?.id ?? '')
    if (errorEnlace) {
      console.error('[chatSession] no se pudo enlazar la ficha con la cuenta', errorEnlace)
    }
  }

  writeStored(CONVERSATION_STORAGE_KEY, data as string)
  return data as string
}

export function useVisitorChatSession(
  active: boolean,
  identity: VisitorIdentity | null = null,
): ChatSession {
  const [status, setStatus] = useState<Status>(
    supabaseEnabled ? 'loading' : 'demo',
  )
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DbMessage[]>([])
  const [guest, setGuest] = useState<GuestIdentity | null>(() => readGuest())
  const [conversation, setConversation] = useState<DbConversation | null>(null)
  // Guardamos IDs vistos en un Set para dedupear entre insert optimista y
  // el evento realtime que llega después con el mismo id.
  const seenIdsRef = useRef<Set<string>>(new Set())

  // Sin cuenta y sin datos de invitado no arrancamos la conversación: hace
  // falta un contacto para poder avisarle si cierra el chat.
  const necesitaDatos = supabaseEnabled && !identity && !guest

  const appendMessage = useCallback((m: DbMessage) => {
    if (seenIdsRef.current.has(m.id)) return
    seenIdsRef.current.add(m.id)
    setMessages((prev) => [...prev, m])
  }, [])

  // Inicialización: se ejecuta cuando el chat se activa por primera vez.
  useEffect(() => {
    if (!supabaseEnabled || !supabase) return
    if (!active) return
    if (conversationId) return
    if (necesitaDatos) return
    let cancelled = false
    ;(async () => {
      try {
        // Sin sesión no hay identidad verificable y las políticas nuevas
        // rechazarían todo. Se cae a demostración, que es un estado que el
        // widget ya sabe pintar.
        const haySesion = await asegurarSesion()
        if (cancelled) return
        if (!haySesion) {
          setStatus('demo')
          return
        }
        const convId = await abrirConversacion(identity, guest)
        if (cancelled) return
        const { data, error } = await supabase!
          .from('mensajes')
          .select('*')
          .eq('conversacion_id', convId)
          .order('created_at', { ascending: true })
        if (error) throw error
        if (cancelled) return
        seenIdsRef.current = new Set((data ?? []).map((m) => m.id))
        setMessages((data ?? []) as DbMessage[])
        setConversationId(convId)

        // Estado de cierre/valoración de esta conversación.
        const { data: conv } = await supabase!
          .from('conversaciones')
          .select('*')
          .eq('id', convId)
          .maybeSingle()
        if (!cancelled && conv) setConversation(conv as DbConversation)

        setStatus('ready')
      } catch (err) {
        console.error('[chatSession] init error', err)
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
    // `identity` se omite a propósito: el efecto solo inicializa una vez.
    // Los cambios de sesión posteriores los recoge el efecto de abajo.
  }, [active, conversationId, necesitaDatos, guest])

  // Si el visitante inicia sesión con el chat ya abierto, le pegamos la
  // identidad a su fila para que el agente deje de ver un UUID anónimo.
  const clienteId = identity?.clienteId ?? null
  useEffect(() => {
    if (!supabase || !clienteId) return
    void (async () => {
      const { data } = await supabase!.auth.getUser()
      const uid = data.user?.id
      if (!uid) return
      // Por `auth_id`, no por el UUID guardado en el navegador: la política
      // solo deja tocar la fila cuyo `auth_id` coincide con la sesión.
      const { error } = await supabase!
        .from('visitantes')
        .update({
          cliente_id: clienteId,
          nombre: identity?.nombre ?? null,
          email: identity?.email ?? null,
          telefono: identity?.telefono ?? null,
        })
        .eq('auth_id', uid)
      if (error) {
        console.error('[chatSession] no se pudo identificar al visitante', error)
      }
    })()
  }, [clienteId, identity?.nombre, identity?.email, identity?.telefono])

  // Suscripción realtime a los mensajes de esta conversación.
  useEffect(() => {
    if (!supabase || !conversationId) return
    const channel = supabase
      .channel(`mensajes:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversationId}`,
        },
        (payload) => {
          appendMessage(payload.new as DbMessage)
        },
      )
      .subscribe()
    return () => {
      supabase!.removeChannel(channel)
    }
  }, [conversationId, appendMessage])

  // El agente puede cerrar la conversación mientras el visitante la tiene
  // abierta; nos suscribimos para enterarnos sin recargar.
  useEffect(() => {
    if (!supabase || !conversationId) return
    const channel = supabase
      .channel(`conversacion:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversaciones',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          setConversation(payload.new as DbConversation)
        },
      )
      .subscribe()
    return () => {
      supabase!.removeChannel(channel)
    }
  }, [conversationId])

  const sendMessage = useCallback(
    async (texto: string) => {
      if (!supabase || !conversationId) return
      const { data, error } = await supabase
        .from('mensajes')
        .insert({ conversacion_id: conversationId, autor: 'visitor', texto })
        .select('*')
        .single()
      if (error) {
        console.error('[chatSession] send error', error)
        return
      }
      appendMessage(data as DbMessage)
    },
    [conversationId, appendMessage],
  )

  const registrarDatos = useCallback(async (nombre: string, email: string) => {
    const limpio = { nombre: nombre.trim(), email: email.trim() }
    if (!limpio.nombre) return { error: 'Escribe tu nombre.' }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(limpio.email)) {
      return { error: 'Escribe un email válido.' }
    }
    writeStored(GUEST_STORAGE_KEY, JSON.stringify(limpio))
    // Al pasar de null a datos, el efecto de inicialización arranca solo.
    setGuest(limpio)
    return { error: null }
  }, [])

  const enviarValoracion = useCallback(
    async (estrellas: number, observacion: string) => {
      if (!supabase || !conversationId) return { error: 'No hay conversación.' }

      // Ya no se manda el id del visitante: la función deduce de quién es la
      // conversación a partir de la sesión. Mandarlo era ofrecerle al servidor
      // la respuesta a la pregunta que tenía que comprobar.
      const { error } = await supabase.rpc('enviar_valoracion', {
        p_conversacion_id: conversationId,
        p_estrellas: estrellas,
        p_observacion: observacion,
      })
      if (error) {
        console.error('[chatSession] valoración error', error)
        return { error: error.message }
      }
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              valoracion_estrellas: estrellas,
              valoracion_observacion: observacion || null,
              valoracion_at: new Date().toISOString(),
            }
          : prev,
      )
      return { error: null }
    },
    [conversationId],
  )

  // Al soltar la conversación actual, el efecto de inicialización vuelve a
  // entrar (depende de `conversationId`) y, como la anterior quedó
  // cerrada, `ensureConversation` crea una nueva en vez de reutilizarla.
  const empezarNuevaConversacion = useCallback(() => {
    removeStored(CONVERSATION_STORAGE_KEY)
    seenIdsRef.current = new Set()
    setMessages([])
    setConversation(null)
    setConversationId(null)
    setStatus(supabaseEnabled ? 'loading' : 'demo')
  }, [])

  return {
    messages,
    sendMessage,
    status,
    demo: !supabaseEnabled,
    conversationId,
    necesitaDatos,
    registrarDatos,
    cierre: {
      cerrada: conversation?.estado === 'cerrada',
      valoracionSolicitada: conversation?.valoracion_solicitada === true,
      valoracionEnviada: conversation?.valoracion_estrellas != null,
    },
    enviarValoracion,
    empezarNuevaConversacion,
  }
}

// ============================================================================
// Hooks para el panel del agente (/agente)
//
// useAgentInbox()         → lista de conversaciones con actualización en vivo.
// useAgentConversation()  → historial y envío para una conversación concreta.
// ============================================================================

export interface InboxItem {
  conversation: DbConversation
  lastMessage: DbMessage | null
  visitor: DbVisitor | null
}

/**
 * Nombre con el que mostrar a quien escribe. Fuerza mayúscula inicial en
 * cada palabra: la gente escribe su nombre en minúsculas al abrir el
 * chat y en el panel queda pobre. El resto de cada palabra se respeta,
 * para no romper cosas como "McCarthy" o siglas.
 *
 * Sin nombre cae a "Visitante ab12cd34", que al menos permite
 * distinguir conversaciones entre sí.
 */
export function visitorDisplayName(
  visitor: { nombre: string | null; email?: string | null } | null | undefined,
  fallbackId?: string | null,
): string {
  const nombre = visitor?.nombre?.trim()
  if (nombre) {
    return nombre
      .split(/\s+/)
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ')
  }
  // Alguien con cuenta pero sin nombre en el perfil: el email identifica
  // mejor que un uuid opaco.
  const email = visitor?.email?.trim()
  if (email) return email
  return fallbackId ? `Visitante ${fallbackId.slice(0, 8)}` : 'Visitante'
}

/**
 * Bandeja del agente. `estado` separa las conversaciones activas de las
 * archivadas; se filtra en la consulta y no en cliente para que el límite
 * de 50 no se lo coman las cerradas cuando el archivo crezca.
 */
export function useAgentInbox(estado: 'abierta' | 'cerrada' = 'abierta'): {
  items: InboxItem[]
  status: Status
} {
  const [status, setStatus] = useState<Status>(
    supabaseEnabled ? 'loading' : 'demo',
  )
  const [items, setItems] = useState<InboxItem[]>([])

  const reload = useCallback(async () => {
    if (!supabaseAgent) return
    const { data: convs, error } = await supabaseAgent
      .from('conversaciones')
      .select('*')
      .eq('estado', estado)
      .order('ultimo_mensaje_at', { ascending: false, nullsFirst: false })
      .limit(50)
    if (error) {
      console.error('[agentInbox] load error', error)
      setStatus('error')
      return
    }
    // Para cada conversación, su último mensaje y quién la escribe. Se
    // piden en lote (dos consultas) en vez de una por fila.
    const ids = (convs ?? []).map((c) => c.id)
    const visitorIds = [...new Set((convs ?? []).map((c) => c.visitor_id))]

    const lastByConv: Record<string, DbMessage> = {}
    const visitorById: Record<string, DbVisitor> = {}

    if (ids.length > 0) {
      const [{ data: msgs }, { data: visitantes }] = await Promise.all([
        supabaseAgent
          .from('mensajes')
          .select('*')
          .in('conversacion_id', ids)
          .order('created_at', { ascending: false }),
        supabaseAgent.from('visitantes').select('*').in('id', visitorIds),
      ])

      // Nos quedamos con el primer mensaje que veamos por conversación (el
      // más reciente porque venimos ordenados desc).
      for (const m of (msgs ?? []) as DbMessage[]) {
        if (!lastByConv[m.conversacion_id]) lastByConv[m.conversacion_id] = m
      }
      for (const v of (visitantes ?? []) as DbVisitor[]) {
        visitorById[v.id] = v
      }
    }

    setItems(
      (convs ?? []).map((c) => ({
        conversation: c as DbConversation,
        lastMessage: lastByConv[c.id] ?? null,
        visitor: visitorById[(c as DbConversation).visitor_id] ?? null,
      })),
    )
    setStatus('ready')
  }, [estado])

  useEffect(() => {
    if (!supabaseEnabled) return
    void reload()
  }, [reload])

  // Suscripción global: cualquier mensaje nuevo o conversación nueva
  // dispara una recarga. Para Fase 1 es suficiente (< 100 conversaciones);
  // luego optimizamos con updates parciales si hace falta.
  useEffect(() => {
    if (!supabaseAgent) return
    const channel = supabaseAgent
      .channel('agent-inbox')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mensajes' },
        () => {
          void reload()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversaciones' },
        () => {
          void reload()
        },
      )
      // Un visitante que ya existía puede identificarse después (al dar sus
      // datos o al iniciar sesión). Sin esto, la bandeja seguiría enseñando
      // "Visitante ab12cd34" hasta el siguiente mensaje.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'visitantes' },
        () => {
          void reload()
        },
      )
      .subscribe()
    return () => {
      supabaseAgent!.removeChannel(channel)
    }
  }, [reload])

  return { items, status }
}

export function useAgentConversation(conversationId: string | null): {
  messages: DbMessage[]
  sendMessage: (texto: string) => Promise<void>
  status: Status
} {
  const [status, setStatus] = useState<Status>(
    supabaseEnabled ? (conversationId ? 'loading' : 'ready') : 'demo',
  )
  const [messages, setMessages] = useState<DbMessage[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())

  const appendMessage = useCallback((m: DbMessage) => {
    if (seenIdsRef.current.has(m.id)) return
    seenIdsRef.current.add(m.id)
    setMessages((prev) => [...prev, m])
  }, [])

  useEffect(() => {
    if (!supabaseEnabled || !supabaseAgent) return
    if (!conversationId) {
      setMessages([])
      seenIdsRef.current = new Set()
      setStatus('ready')
      return
    }
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      const { data, error } = await supabaseAgent!
        .from('mensajes')
        .select('*')
        .eq('conversacion_id', conversationId)
        .order('created_at', { ascending: true })
      if (cancelled) return
      if (error) {
        console.error('[agentConversation] load error', error)
        setStatus('error')
        return
      }
      seenIdsRef.current = new Set((data ?? []).map((m) => m.id))
      setMessages((data ?? []) as DbMessage[])
      setStatus('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [conversationId])

  useEffect(() => {
    if (!supabaseAgent || !conversationId) return
    const channel = supabaseAgent
      .channel(`agent-mensajes:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversationId}`,
        },
        (payload) => {
          appendMessage(payload.new as DbMessage)
        },
      )
      .subscribe()
    return () => {
      supabaseAgent!.removeChannel(channel)
    }
  }, [conversationId, appendMessage])

  const sendMessage = useCallback(
    async (texto: string) => {
      if (!supabaseAgent || !conversationId) return
      const { data: auth } = await supabaseAgent.auth.getUser()
      const { data, error } = await supabaseAgent
        .from('mensajes')
        .insert({
          conversacion_id: conversationId,
          autor: 'agent',
          texto,
          agente_id: auth.user?.id ?? null,
        })
        .select('*')
        .single()
      if (error) {
        console.error('[agentConversation] send error', error)
        return
      }
      appendMessage(data as DbMessage)
    },
    [conversationId, appendMessage],
  )

  return { messages, sendMessage, status }
}

/**
 * Cierra o reabre una conversación. El visitante que tenga esa
 * conversación guardada empezará una nueva cuando vuelva a escribir, ya
 * que `ensureConversation` solo reutiliza las que están 'abierta'.
 */
export async function setConversationState(
  conversationId: string,
  estado: 'abierta' | 'cerrada',
  opciones: { pedirValoracion?: boolean } = {},
): Promise<{ error: string | null }> {
  if (!supabaseAgent) return { error: 'Supabase no está configurado.' }

  const patch: Record<string, unknown> = { estado }
  if (estado === 'cerrada') {
    patch.cerrada_at = new Date().toISOString()
    patch.valoracion_solicitada = opciones.pedirValoracion === true
  } else {
    // Al reabrir se retira la petición pendiente: si el agente vuelve a
    // cerrar, decidirá otra vez. Una valoración ya enviada no se toca.
    patch.cerrada_at = null
    patch.valoracion_solicitada = false
  }

  const { error } = await supabaseAgent
    .from('conversaciones')
    .update(patch)
    .eq('id', conversationId)
  if (error) {
    console.error('[setConversationState] error', error)
    return { error: error.message }
  }
  return { error: null }
}

/**
 * Borrado definitivo de una conversación y sus mensajes (cascada en la
 * clave foránea). No hay papelera: quien llame a esto debe haber
 * confirmado antes con el agente.
 */
export async function deleteConversation(
  conversationId: string,
): Promise<{ error: string | null }> {
  if (!supabaseAgent) return { error: 'Supabase no está configurado.' }
  const { error } = await supabaseAgent
    .from('conversaciones')
    .delete()
    .eq('id', conversationId)
  if (error) {
    console.error('[deleteConversation] error', error)
    return { error: error.message }
  }
  return { error: null }
}

/**
 * Asigna (o libera, pasando null) una conversación a un agente.
 * La suscripción realtime del inbox refresca la lista sola.
 */
export async function assignConversation(
  conversationId: string,
  agentId: string | null,
): Promise<{ error: string | null }> {
  if (!supabaseAgent) return { error: 'Supabase no está configurado.' }
  const { error } = await supabaseAgent
    .from('conversaciones')
    .update({ agente_id: agentId })
    .eq('id', conversationId)
  if (error) {
    console.error('[assignConversation] error', error)
    return { error: error.message }
  }
  return { error: null }
}

/**
 * Nombres de los agentes indexados por id, para poder firmar cada
 * respuesta del historial. Son 2-3 filas, así que se cargan de una vez.
 */
export function useAgentNames(): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!supabaseAgent) return
    let active = true
    void supabaseAgent
      .from('agentes')
      .select('id, nombre')
      .then(({ data, error }) => {
        if (!active || error || !data) return
        setNames(
          Object.fromEntries(
            (data as { id: string; nombre: string }[]).map((a) => [a.id, a.nombre]),
          ),
        )
      })
    return () => {
      active = false
    }
  }, [])

  return names
}

/**
 * Ficha del visitante de una conversación: sus datos y el resto de
 * conversaciones que ha tenido, para dar contexto al agente.
 */
export function useConversationVisitor(conversationId: string | null): {
  visitor: DbVisitor | null
  otherConversations: DbConversation[]
  status: Status
} {
  const [visitor, setVisitor] = useState<DbVisitor | null>(null)
  const [otherConversations, setOtherConversations] = useState<DbConversation[]>([])
  const [status, setStatus] = useState<Status>(supabaseEnabled ? 'loading' : 'demo')

  useEffect(() => {
    if (!supabaseAgent || !conversationId) {
      setVisitor(null)
      setOtherConversations([])
      setStatus(supabaseEnabled ? 'ready' : 'demo')
      return
    }
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      const { data: conv, error: convError } = await supabaseAgent!
        .from('conversaciones')
        .select('visitor_id')
        .eq('id', conversationId)
        .maybeSingle()
      if (cancelled) return
      if (convError || !conv) {
        setStatus('error')
        return
      }

      const [{ data: v }, { data: otras }] = await Promise.all([
        supabaseAgent!
          .from('visitantes')
          .select('*')
          .eq('id', conv.visitor_id)
          .maybeSingle(),
        supabaseAgent!
          .from('conversaciones')
          .select('*')
          .eq('visitor_id', conv.visitor_id)
          .neq('id', conversationId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      if (cancelled) return
      setVisitor((v as DbVisitor | null) ?? null)
      setOtherConversations((otras ?? []) as DbConversation[])
      setStatus('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [conversationId])

  return { visitor, otherConversations, status }
}
