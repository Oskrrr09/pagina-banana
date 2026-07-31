import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente Supabase compartido para el chat en tiempo real y el panel /agente.
//
// Las credenciales viajan en el bundle público — es lo esperado: la `anon key`
// está pensada para el navegador y todas las restricciones reales se aplican
// mediante Row Level Security en las tablas.
//
// Si faltan las variables (típico en un fork sin `.env.local`), exportamos
// `null` y la UI cae al modo "demo": el chat responde con canned replies como
// antes y el panel /agente enseña un aviso. Así el prototipo sigue siendo
// clonable y desplegable sin depender de Supabase.

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cliente de la tienda: chat del visitante y sesión del CLIENTE.
export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null

// Cliente del panel /agente: sesión del AGENTE.
//
// Va aparte a propósito. supabase-js guarda una única sesión por cliente,
// así que si el panel compartiera este objeto con la tienda, entrar como
// agente cerraría la sesión del cliente (y al revés). Con `storageKey`
// distinto, ambas sesiones conviven en el mismo navegador y se puede
// enseñar la demo con la tienda y el panel abiertos a la vez.
//
// El aviso "Multiple GoTrueClient instances" en consola es esperado y
// benigno mientras las claves de almacenamiento sean distintas.
export const supabaseAgent: SupabaseClient | null =
  url && anon
    ? createClient(url, anon, {
        auth: { storageKey: 'banana-agente-auth' },
      })
    : null

export const supabaseEnabled = supabase !== null

// Tipos que describen las filas tal como viven en Supabase. Deliberadamente
// pequeños — crecerán cuando añadamos WhatsApp/Instagram, asignación,
// etiquetas, etc.
export interface DbVisitor {
  id: string
  created_at: string
  nombre: string | null
  email: string | null
  user_agent: string | null
  /** Cuenta del cliente, si escribió con la sesión iniciada. */
  cliente_id: string | null
  telefono: string | null
}

export interface DbConversation {
  id: string
  created_at: string
  visitor_id: string
  estado: 'abierta' | 'cerrada'
  agente_id: string | null
  ultimo_mensaje_at: string | null
}

export interface DbMessage {
  id: string
  created_at: string
  conversacion_id: string
  autor: 'visitor' | 'agent' | 'bot'
  texto: string
  /** Agente que escribió la respuesta. Null en mensajes de visitante o bot. */
  agente_id: string | null
}

// ---- Cuentas (Fase 2) ------------------------------------------------
// Recordatorio: agentes y clientes son FICTICIOS. Sirven para poder
// enseñar el flujo completo sin tocar datos reales de Banana.

export type AgentStatus = 'disponible' | 'ocupado' | 'ausente'

export interface DbAgent {
  id: string
  created_at: string
  email: string
  nombre: string
  rol: 'agente' | 'supervisor'
  tienda: string | null
  estado: AgentStatus
}

export interface DbAddress {
  calle: string
  ciudad: string
  isla: string
  cp: string
}

export type EducationalDiscountStatus = 'pendiente' | 'aprobado' | 'rechazado'

export interface DbCustomer {
  id: string
  created_at: string
  email: string
  nombre: string | null
  telefono: string | null
  direccion_envio: DbAddress | null
  direccion_facturacion: DbAddress | null
  descuento_educativo_estado: EducationalDiscountStatus | null
  descuento_educativo_archivo: string | null
  descuento_educativo_nota: string | null
  descuento_educativo_subido_at: string | null
  descuento_educativo_revisado_at: string | null
  descuento_educativo_revisado_por: string | null
}

export interface DbOrderLine {
  name: string
  color: string
  capacity: string
  price: number
  qty: number
  insured: boolean
  image?: string
}

export interface DbOrder {
  id: string
  created_at: string
  cliente_id: string
  delivery: 'envio' | 'recogida'
  payment_method: 'tarjeta' | 'bizum' | 'financiacion'
  financing_months: number | null
  products_total: number
  insurance_total: number
  insured_units: number
  lines: DbOrderLine[]
  status: string
}

export type ReservationStatus = 'en-espera' | 'disponible' | 'completada' | 'cancelada'

export interface DbReservation {
  id: string
  created_at: string
  cliente_id: string
  family: string
  model_slug: string
  variant_label: string
  model_name: string
  price: number
  /** Fija el puesto en la lista de espera: quien paga antes, va antes. */
  pagado_at: string
  estado: ReservationStatus
}

export const EDUCATIONAL_DISCOUNT_BUCKET = 'descuentos-educativos'
