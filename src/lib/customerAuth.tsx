import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
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
//
// SESIONES ANÓNIMAS — POR QUÉ SE IGNORAN AQUÍ
//
// El chat del visitante abre una sesión anónima con `signInAnonymously()`.
// Supabase le da a esa sesión el mismo rol PostgreSQL que a una cuenta de
// verdad: `authenticated`. La única diferencia viaja como un reclamo del JWT,
// `is_anonymous: true`.
//
// Este proveedor trataba cualquier sesión como sesión de cliente. Con eso,
// abrir el chat bastaba para que se buscara una ficha en `clientes`, no se
// encontrara, y **se creara sola**: el visitante pasaba a ser cliente sin
// haberse registrado, y la tienda le enseñaba «Mi cuenta».
//
// A partir de aquí una sesión anónima NO es una sesión de cliente. `session`
// se expone como null mientras lo sea, que es lo que ya interpretan todas las
// pantallas como «no hay cuenta», y no se toca `clientes` en ningún caso. La
// base lo impide además por su cuenta; ver
// `20260806000400_separa_sesiones_anonimas.sql`.

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

/** true si la sesión existe pero es una sesión anónima del chat. */
export function esSesionAnonima(session: Session | null): boolean {
  return session?.user.is_anonymous === true
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  // La sesión tal y como la devuelve Supabase, anónima incluida. No sale de
  // este módulo: hacia fuera se publica sólo si es una cuenta permanente.
  const [sesionCruda, setSesionCruda] = useState<Session | null>(null)
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
      setSesionCruda(data.session)
      if (!data.session || esSesionAnonima(data.session)) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSesionCruda(next)
      if (!next || esSesionAnonima(next)) {
        setCliente(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const anonima = esSesionAnonima(sesionCruda)
  // Lo que ve el resto de la aplicación. Una sesión anónima es, a todos los
  // efectos de la tienda, no haber iniciado sesión.
  const session = anonima ? null : sesionCruda

  const userId = session?.user.id ?? null
  const userEmail = session?.user.email ?? null

  const loadProfile = useCallback(async () => {
    // `userId` ya es null en una sesión anónima, porque sale de `session` y no
    // de `sesionCruda`. La condición se deja escrita igualmente: es la línea
    // que creaba la ficha sola, y conviene que se lea por qué no puede
    // ejecutarse sin cuenta permanente.
    if (!supabase || !userId) {
      setCliente(null)
      return
    }
    const { data, error } = await supabase.from('clientes').select('*').eq('id', userId).maybeSingle()

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

  // Crea la ficha de `clientes` de una cuenta ya permanente.
  //
  // Va aquí y no en un disparador de la base a propósito: la política de alta
  // exige que los campos del descuento educativo vengan nulos, y así el alta
  // se ve en el mismo sitio que la valida.
  const crearFicha = useCallback(async (id: string, email: string, nombre: string) => {
    const { error } = await supabase!.from('clientes').insert({ id, email, nombre })
    // 23505 = clave duplicada: la ficha ya existía, no es un problema.
    if (error && error.code !== '23505') {
      console.error('[customerAuth] no se pudo crear la ficha', error)
    }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, nombre: string) => {
      if (!supabase) {
        return { error: 'Supabase no está configurado.', needsEmailConfirmation: false }
      }

      // DECISIÓN: si el visitante ya tiene sesión anónima del chat, se
      // CONVIERTE esa cuenta en permanente. No se cierra para registrar una
      // nueva.
      //
      // Se decide aquí y de forma explícita porque `signUp()` con una sesión
      // anónima abierta no tiene un comportamiento evidente: GoTrue puede
      // convertir la cuenta o crear otra según su configuración, y de eso
      // depende si el visitante conserva su chat o lo pierde en silencio.
      //
      // Se convierte, y no se reemplaza, porque el esquema está construido
      // para eso: `vincular_mi_visitante_a_cliente()` enlaza la ficha de
      // visitante con la de cliente **por el mismo `auth.uid()`**. Cerrar la
      // sesión anónima daría un uid distinto, dejaría la conversación
      // huérfana y el visitante perdería el hilo que acababa de escribir con
      // un agente.
      //
      // La conversión es `updateUser({ email, password })` sobre la propia
      // sesión anónima. Después hace falta `refreshSession()`: `is_anonymous`
      // viaja dentro del *access token*, y hasta que no se emite uno nuevo la
      // base sigue viendo la sesión como anónima y rechaza el alta de la ficha.
      const { data: actual } = await supabase.auth.getSession()
      if (esSesionAnonima(actual.session)) {
        const { error: errorConversion } = await supabase.auth.updateUser({
          email,
          password,
          data: { nombre },
        })
        if (errorConversion) {
          return { error: errorConversion.message, needsEmailConfirmation: false }
        }

        const { data: renovada, error: errorRefresco } = await supabase.auth.refreshSession()
        if (errorRefresco) {
          return { error: errorRefresco.message, needsEmailConfirmation: false }
        }

        // Con "Confirm email" activo la cuenta sigue siendo anónima hasta que
        // se valide el correo. No se crea la ficha: la base la rechazaría.
        if (esSesionAnonima(renovada.session) || !renovada.session) {
          return { error: null, needsEmailConfirmation: true }
        }

        await crearFicha(renovada.session.user.id, email, nombre)
        return { error: null, needsEmailConfirmation: false }
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

      await crearFicha(data.user!.id, email, nombre)
      return { error: null, needsEmailConfirmation: false }
    },
    [crearFicha],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setCliente(null)
  }, [])

  const updateProfile = useCallback(
    async (patch: CustomerProfileUpdate) => {
      if (!supabase || !userId) return { error: 'No hay sesión iniciada.' }

      // Por RPC y no con un `update` directo. El cliente ya no tiene UPDATE
      // sobre `clientes`: RLS filtra filas pero no columnas, así que poder
      // editar la fila propia incluía poder ponerse el descuento educativo en
      // 'aprobado'. La función solo escribe las cuatro columnas de contacto.
      //
      // `undefined` significa "no lo toques" y `null` significa "bórralo".
      // La distinción importa: mandar `undefined` por la red lo convierte en
      // ausente, y la función lo interpreta con `coalesce` como "sin cambio";
      // `null` explícito no se puede distinguir así, por eso lo que se quiera
      // limpiar viaja como cadena vacía y la función la normaliza.
      const { error } = await supabase.rpc('actualizar_mi_ficha', {
        p_nombre: patch.nombre === undefined ? null : (patch.nombre ?? ''),
        p_telefono: patch.telefono === undefined ? null : (patch.telefono ?? ''),
        p_direccion_envio: patch.direccion_envio === undefined ? null : patch.direccion_envio,
        p_direccion_facturacion: patch.direccion_facturacion === undefined ? null : patch.direccion_facturacion,
      })
      if (error) return { error: error.message }

      // La función no devuelve la fila, así que se recarga para que la UI
      // refleje lo que quedó guardado de verdad y no lo que creíamos enviar.
      await loadProfile()
      return { error: null }
    },
    [userId, loadProfile],
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

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth(): CustomerAuthState {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) {
    throw new Error('useCustomerAuth debe usarse dentro de <CustomerAuthProvider>')
  }
  return ctx
}
