import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DemoDeliveryMode } from './demoOrderRepository'

// Estado compartido del checkout (paso 1: entrega y datos de contacto).
// - Se persiste en sessionStorage para sobrevivir a recargas dentro de la
//   sesión, pero no cruza pestañas ni queda tras cerrar el navegador.
// - Guarda además la selección de entrega elegida en el carrito para que el
//   checkout la abra ya seleccionada.
// - Cuando exista una base de datos real, esta capa puede migrar a un
//   servidor sin cambiar la API pública consumida por CartPage y CheckoutPage.

export interface CheckoutForm {
  nombre: string
  email: string
  direccion: string
  isla: string
  tienda: string
}

/**
 * Islas a las que se envía. Vive aquí porque la comparten el checkout y
 * las direcciones del perfil: si el perfil guardara una isla que el
 * checkout no ofrece, el rellenado automático dejaría el select en un
 * valor imposible.
 */
export const ISLAS = [
  'Gran Canaria',
  'Tenerife',
  'Lanzarote',
  'Fuerteventura',
  'La Palma',
  'La Gomera',
  'El Hierro',
] as const

export type CheckoutStep = 1 | 2 | 3

/**
 * Por qué no se puede pasar del paso 1.
 *
 * Aquí vivían los cuatro mensajes escritos en castellano, y de aquí salían
 * directos al DOM: con la web en inglés, quien se equivocaba de correo leía
 * «Introduce un email válido.». El estado expresa el MOTIVO; el idioma lo
 * decide la interfaz, que es la que tiene diccionario.
 *
 * Este módulo no importa nada de i18n a propósito: así la validación se puede
 * probar sin proveedor de idioma, y no hay dos sitios donde cambiar un copy.
 */
export type MotivoStep1 = 'nombre-requerido' | 'email-invalido' | 'direccion-requerida' | 'tienda-requerida'

/** Qué campo del paso 1 puede quedar mal. */
export type CampoErrorStep1 = 'nombre' | 'email' | 'direccion' | 'tienda'

/** Los motivos por campo. Vacío significa que el paso 1 es válido. */
export type ErroresStep1 = Partial<Record<CampoErrorStep1, MotivoStep1>>

interface CheckoutState {
  delivery: DemoDeliveryMode
  setDelivery: (mode: DemoDeliveryMode) => void
  form: CheckoutForm
  setForm: (partial: Partial<CheckoutForm>) => void
  step1Valid: boolean
  validateStep1: () => ErroresStep1
  reset: () => void
}

const STORAGE_KEY = 'banana:checkout-state'

const emptyForm: CheckoutForm = {
  nombre: '',
  email: '',
  direccion: '',
  isla: 'Gran Canaria',
  tienda: 'triana',
}

/**
 * Aplana una dirección del perfil en la única línea de texto que pide el
 * checkout. Omite las partes vacías para no dejar comas sueltas.
 */
export function formatAddressLine(address: { calle?: string; cp?: string; ciudad?: string }): string {
  return [address.calle, address.cp, address.ciudad]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

const CheckoutContext = createContext<CheckoutState | null>(null)

interface Snapshot {
  delivery: DemoDeliveryMode
  form: CheckoutForm
}

function readSnapshot(): Snapshot {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { delivery: 'envio', form: emptyForm }
    const parsed = JSON.parse(raw) as Partial<Snapshot>
    return {
      delivery: parsed.delivery === 'recogida' ? 'recogida' : 'envio',
      form: { ...emptyForm, ...(parsed.form ?? {}) },
    }
  } catch {
    return { delivery: 'envio', form: emptyForm }
  }
}

function writeSnapshot(snap: Snapshot) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snap))
  } catch {
    /* noop */
  }
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => readSnapshot(), [])
  const [delivery, setDeliveryState] = useState<DemoDeliveryMode>(initial.delivery)
  const [form, setFormState] = useState<CheckoutForm>(initial.form)

  useEffect(() => {
    writeSnapshot({ delivery, form })
  }, [delivery, form])

  const setDelivery = useCallback((mode: DemoDeliveryMode) => setDeliveryState(mode), [])
  const setForm = useCallback((partial: Partial<CheckoutForm>) => setFormState((prev) => ({ ...prev, ...partial })), [])

  const validateStep1 = useCallback((): ErroresStep1 => {
    const errors: ErroresStep1 = {}
    if (!form.nombre.trim()) errors.nombre = 'nombre-requerido'
    if (!EMAIL_RE.test(form.email)) errors.email = 'email-invalido'
    if (delivery === 'envio' && !form.direccion.trim()) {
      errors.direccion = 'direccion-requerida'
    }
    if (delivery === 'recogida' && !form.tienda) {
      errors.tienda = 'tienda-requerida'
    }
    return errors
  }, [delivery, form])

  const step1Valid = useMemo(() => {
    if (!form.nombre.trim() || !EMAIL_RE.test(form.email)) return false
    if (delivery === 'envio' && !form.direccion.trim()) return false
    if (delivery === 'recogida' && !form.tienda) return false
    return true
  }, [delivery, form])

  const reset = useCallback(() => {
    setDeliveryState('envio')
    setFormState(emptyForm)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* noop */
    }
  }, [])

  const value = useMemo<CheckoutState>(
    () => ({ delivery, setDelivery, form, setForm, step1Valid, validateStep1, reset }),
    [delivery, setDelivery, form, setForm, step1Valid, validateStep1, reset],
  )

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckoutState(): CheckoutState {
  const ctx = useContext(CheckoutContext)
  if (!ctx) {
    throw new Error('useCheckoutState debe usarse dentro de <CheckoutProvider>')
  }
  return ctx
}
