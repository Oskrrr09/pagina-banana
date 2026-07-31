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
import { supabase, type DbAddress, type DbCustomer } from './supabase'

// Sesión del CLIENTE de la tienda — Fase 2.
//
// Usa el cliente `supabase` principal (el mismo que el chat del
// visitante). La sesión del agente vive en `supabaseAgent`, aparte, para
// que ambas convivan; ver comentario en lib/supabase.ts.
//
// Las cuentas son de DEMOSTRACIÓN: no hay clientes reales de Banana. Los
// pedidos siguen siendo demostrativos y no disparan cobros ni envíos.
//
// Nota de configuración: para que el registro sea inmediato hay que
// desactivar "Confirm email" en Supabase (Authentication → Providers →
// Email). Si está activo, `signUp` devuelve sesión null y el usuario
// tendría que abrir un correo antes de poder entrar.

export interface CustomerProfileUpdate {
  nombre?: string | null
  telefono?: string | null
  direccion_envio?: DbAddress | null
  direccion_facturacion?: DbAddress | null
}

interface CustomerAuthState {
  session: Session | null
  /** Ficha del cliente. Null mientras carga o si la cuenta no tiene ficha. */
  cliente: DbCustomer | null
  /** true mientras resolvemos la sesión inicial. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    nombre: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  updateProfile: (patch: CustomerProfileUpdate) => Promise<{ error: string | null }>
  /** Recarga la ficha desde Supabase (tras subir un justificante, por ejemplo). */
  refresh: () => Promise<void>
}

const CustomerAuthContext = createContext<CustomerAuthState | null>(null)

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cliente, setCliente] = useState<DbCustomer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSession(next)
      if (!next) {
        setCliente(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null
  const userEmail = session?.user.email ?? null

  const loadProfile = useCallback(async () => {
    if (!supabase || !userId) {
      setCliente(null)
      return
    }
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[customerAuth] no se pudo cargar la ficha', error)
      setCliente(null)
      return
    }

    if (data) {
      setCliente(data as DbCustomer)
      return
    }

    // Sin ficha todavía: la creamos. Pasa con cuentas creadas a mano en
    // el panel de Supabase, o si el insert del registro falló a medias.
    const { data: creada, error: insertError } = await supabase
      .from('clientes')
      .insert({ id: userId, email: userEmail ?? '' })
      .select('*')
      .single()

    if (insertError) {
      console.error('[customerAuth] no se pudo crear la ficha', insertError)
      setCliente(null)
      return
    }
    setCliente(creada as DbCustomer)
  }, [userId, userEmail])

  useEffect(() => {
    if (!userId) {
      setCliente(null)
      return
    }
    let active = true
    setLoading(true)
    loadProfile().finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [userId, loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase no está configurado.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, nombre: string) => {
    if (!supabase) {
      return { error: 'Supabase no está configurado.', needsEmailConfirmation: false }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })
    if (error) return { error: error.message, needsEmailConfirmation: false }

    // Con "Confirm email" activo, signUp no devuelve sesión: hay que
    // validar el correo antes de poder entrar.
    if (!data.session) {
      return { error: null, needsEmailConfirmation: true }
    }

    // Con sesión ya activa creamos la ficha aquí para no depender de un
    // trigger en la base de datos.
    const { error: insertError } = await supabase
      .from('clientes')
      .insert({ id: data.user!.id, email, nombre })
    if (insertError && insertError.code !== '23505') {
      // 23505 = clave duplicada: la ficha ya existía, no es un problema.
      console.error('[customerAuth] no se pudo crear la ficha', insertError)
    }
    return { error: null, needsEmailConfirmation: false }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setCliente(null)
  }, [])

  const updateProfile = useCallback(
    async (patch: CustomerProfileUpdate) => {
      if (!supabase || !userId) return { error: 'No hay sesión iniciada.' }
      const { data, error } = await supabase
        .from('clientes')
        .update(patch)
        .eq('id', userId)
        .select('*')
        .single()
      if (error) return { error: error.message }
      setCliente(data as DbCustomer)
      return { error: null }
    },
    [userId],
  )

  const value = useMemo<CustomerAuthState>(
    () => ({
      session,
      cliente,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      refresh: loadProfile,
    }),
    [session, cliente, loading, signIn, signUp, signOut, updateProfile, loadProfile],
  )

  return (
    <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth(): CustomerAuthState {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) {
    throw new Error('useCustomerAuth debe usarse dentro de <CustomerAuthProvider>')
  }
  return ctx
}
