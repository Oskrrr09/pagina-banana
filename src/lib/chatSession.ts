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

const VISITOR_STORAGE_KEY = 'bananito:visitor_id'
const CONVERSATION_STORAGE_KEY = 'bananito:conversation_id'

const WELCOME_TEXT =
  '¡Hola! Soy Bananito 🍌 el asistente de Banana Computer. Puedo ayudarte con productos, accesorios, comparar modelos, tiendas o precios. ¿En qué te ayudo?'

type Status = 'loading' | 'ready' | 'demo' | 'error'

export interface ChatSession {
  messages: DbMessage[]
  sendMessage: (texto: string) => Promise<void>
  status: Status
  demo: boolean
  conversationId: string | null
}

function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
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

// Asegura que existe un visitante en Supabase para este navegador. Devuelve
// el UUID. La primera vez inserta la fila; después reutiliza el guardado.
//
// Si el visitante tiene cuenta, se le pega la identidad a la fila. Se hace
// también sobre filas ya existentes: alguien puede haber usado el chat como
// anónimo y registrarse después, y a partir de ese momento el agente debe
// verle identificado.
async function ensureVisitor(identity: VisitorIdentity | null): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado')

  const identityFields = identity
    ? {
        cliente_id: identity.clienteId,
        nombre: identity.nombre,
        email: identity.email,
        telefono: identity.telefono,
      }
    : {}

  const stored = readStored(VISITOR_STORAGE_KEY)
  if (stored) {
    if (identity) {
      const { error } = await supabase
        .from('visitantes')
        .update(identityFields)
        .eq('id', stored)
      if (error) console.error('[chatSession] no se pudo identificar al visitante', error)
    }
    return stored
  }

  const { data, error } = await supabase
    .from('visitantes')
    .insert({ user_agent: navigator.userAgent, ...identityFields })
    .select('id')
    .single()
  if (error) throw error
  writeStored(VISITOR_STORAGE_KEY, data.id)
  return data.id
}

// Asegura que existe una conversación abierta para el visitante. Reutiliza la
// guardada si sigue abierta; si no, busca la más reciente abierta o crea una.
async function ensureConversation(visitorId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado')
  const stored = readStored(CONVERSATION_STORAGE_KEY)
  if (stored) {
    const { data } = await supabase
      .from('conversaciones')
      .select('id, estado, visitor_id')
      .eq('id', stored)
      .maybeSingle()
    if (data && data.estado === 'abierta' && data.visitor_id === visitorId) {
      return data.id
    }
  }
  const { data: existing } = await supabase
    .from('conversaciones')
    .select('id')
    .eq('visitor_id', visitorId)
    .eq('estado', 'abierta')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing) {
    writeStored(CONVERSATION_STORAGE_KEY, existing.id)
    return existing.id
  }
  const { data: created, error } = await supabase
    .from('conversaciones')
    .insert({ visitor_id: visitorId })
    .select('id')
    .single()
  if (error) throw error
  writeStored(CONVERSATION_STORAGE_KEY, created.id)
  // Mensaje de bienvenida como primer mensaje del bot en la conversación.
  await supabase
    .from('mensajes')
    .insert({ conversacion_id: created.id, autor: 'bot', texto: WELCOME_TEXT })
  return created.id
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
  // Guardamos IDs vistos en un Set para dedupear entre insert optimista y
  // el evento realtime que llega después con el mismo id.
  const seenIdsRef = useRef<Set<string>>(new Set())

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
    let cancelled = false
    ;(async () => {
      try {
        const visitorId = await ensureVisitor(identity)
        const convId = await ensureConversation(visitorId)
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
  }, [active, conversationId])

  // Si el visitante inicia sesión con el chat ya abierto, le pegamos la
  // identidad a su fila para que el agente deje de ver un UUID anónimo.
  const clienteId = identity?.clienteId ?? null
  useEffect(() => {
    if (!supabase || !clienteId) return
    const visitorId = readStored(VISITOR_STORAGE_KEY)
    if (!visitorId) return
    void supabase
      .from('visitantes')
      .update({
        cliente_id: clienteId,
        nombre: identity?.nombre ?? null,
        email: identity?.email ?? null,
        telefono: identity?.telefono ?? null,
      })
      .eq('id', visitorId)
      .then(({ error }) => {
        if (error) {
          console.error('[chatSession] no se pudo identificar al visitante', error)
        }
      })
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

  return {
    messages,
    sendMessage,
    status,
    demo: !supabaseEnabled,
    conversationId,
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
    // Para cada conversación, buscar el último mensaje.
    const ids = (convs ?? []).map((c) => c.id)
    let lastByConv: Record<string, DbMessage> = {}
    if (ids.length > 0) {
      const { data: msgs } = await supabaseAgent
        .from('mensajes')
        .select('*')
        .in('conversacion_id', ids)
        .order('created_at', { ascending: false })
      // Nos quedamos con el primer mensaje que veamos por conversación (el
      // más reciente porque venimos ordenados desc).
      for (const m of (msgs ?? []) as DbMessage[]) {
        if (!lastByConv[m.conversacion_id]) lastByConv[m.conversacion_id] = m
      }
    }
    setItems(
      (convs ?? []).map((c) => ({
        conversation: c as DbConversation,
        lastMessage: lastByConv[c.id] ?? null,
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
): Promise<{ error: string | null }> {
  if (!supabaseAgent) return { error: 'Supabase no está configurado.' }
  const { error } = await supabaseAgent
    .from('conversaciones')
    .update({ estado })
    .eq('id', conversationId)
  if (error) {
    console.error('[setConversationState] error', error)
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
