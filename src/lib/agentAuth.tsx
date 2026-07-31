import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabaseAgent, type AgentStatus, type DbAgent } from './supabase'

// Sesión del AGENTE (panel /agente) — Fase 2.
//
// Usa `supabaseAgent`, un cliente aparte del de la tienda, para que la
// sesión del agente y la del cliente puedan convivir en el mismo
// navegador (ver comentario en lib/supabase.ts).
//
// Las cuentas son ficticias y se dan de alta a mano desde el panel de
// Supabase; no hay registro de agentes en la web. Ver supabase/schema.sql.
//
// `agente` es la fila de perfil asociada a la cuenta. Si alguien inicia
// sesión con una cuenta que NO está en la tabla `agentes` (por ejemplo un
// cliente de la tienda reusando su email), la sesión existe pero `agente`
// queda a null: el panel lo trata como "sin permiso".

interface AgentAuthState {
  /** Sesión de Supabase, o null si nadie ha entrado. */
  session: Session | null
  /** Perfil del agente. Null si la cuenta no está dada de alta como agente. */
  agente: DbAgent | null
  /** true mientras resolvemos la sesión inicial: evita parpadeos de "no autorizado". */
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  setEstado: (estado: AgentStatus) => Promise<void>
}

const AgentAuthContext = createContext<AgentAuthState | null>(null)

export function AgentAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [agente, setAgente] = useState<DbAgent | null>(null)
  const [loading, setLoading] = useState(true)

  // Sesión inicial + suscripción a cambios (login, logout, refresh de token).
  useEffect(() => {
    if (!supabaseAgent) {
      setLoading(false)
      return
    }
    let active = true

    supabaseAgent.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabaseAgent.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSession(next)
      if (!next) {
        setAgente(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Cargamos el perfil cada vez que cambia el usuario de la sesión.
  const userId = session?.user.id ?? null
  useEffect(() => {
    if (!supabaseAgent || !userId) {
      setAgente(null)
      return
    }
    let active = true
    setLoading(true)

    supabaseAgent
      .from('agentes')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error('[agentAuth] no se pudo cargar el perfil', error)
        setAgente((data as DbAgent | null) ?? null)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabaseAgent) return { error: 'Supabase no está configurado.' }
    const { error } = await supabaseAgent.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabaseAgent) return
    await supabaseAgent.auth.signOut()
    setAgente(null)
  }, [])

  const setEstado = useCallback(
    async (estado: AgentStatus) => {
      if (!supabaseAgent || !agente) return
      // Optimista: el selector responde al instante y se revierte si falla.
      const anterior = agente.estado
      setAgente({ ...agente, estado })
      const { error } = await supabaseAgent
        .from('agentes')
        .update({ estado })
        .eq('id', agente.id)
      if (error) {
        console.error('[agentAuth] no se pudo cambiar el estado', error)
        setAgente((prev) => (prev ? { ...prev, estado: anterior } : prev))
      }
    },
    [agente],
  )

  const value = useMemo<AgentAuthState>(
    () => ({ session, agente, loading, signIn, signOut, setEstado }),
    [session, agente, loading, signIn, signOut, setEstado],
  )

  return <AgentAuthContext.Provider value={value}>{children}</AgentAuthContext.Provider>
}

export function useAgentAuth(): AgentAuthState {
  const ctx = useContext(AgentAuthContext)
  if (!ctx) {
    throw new Error('useAgentAuth debe usarse dentro de <AgentAuthProvider>')
  }
  return ctx
}
