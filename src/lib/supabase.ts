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

// ---------------------------------------------------------------------------
// A62-09 — EL INICIO DE SESIÓN NO ESPERA PARA SIEMPRE
//
// Una respuesta de error llega rápido y una red rechazada también, pero una
// petición que se queda COLGADA —ni resuelve ni rechaza— dejaba las dos
// pantallas de acceso en «Entrando…», deshabilitadas y sin decir nada, sin
// recuperarse nunca por su cuenta: no existía ningún límite propio en todo
// `src/`.
//
// POR QUÉ AQUÍ Y NO EN customerAuth/agentAuth
//
// Un `Promise.race` alrededor de `signInWithPassword` dejaría de esperar, pero
// NO cancelaría nada: la petición seguiría viva y podría completar después,
// guardando la sesión y emitiendo `SIGNED_IN` cuando la interfaz ya ha dicho
// que falló. Eso sería peor que el defecto. Aquí se aborta el `fetch` de
// verdad, así que los tokens nunca llegan a `_saveSession()`.
//
// POR QUÉ SÓLO EL «PASSWORD GRANT»
//
// Este mismo `fetch` lo usan también PostgREST, Storage y el resto de
// operaciones de los dos clientes, así que discriminar no es una elegancia:
// es obligatorio. Todo lo demás pasa intacto, incluido el refresco de sesión.
// ---------------------------------------------------------------------------

/**
 * Cuánto se espera a que responda el inicio de sesión antes de rendirse.
 *
 * Diez segundos, medidos y no intuidos: contra Supabase local la petición
 * tarda 82–96 ms, así que esto es unas cien veces la mediana observada y deja
 * margen de sobra para una red móvil con el cifrado de contraseña del servidor
 * por medio. Alto para no declarar fallo en una conexión lenta; bajo para que
 * nadie se quede mirando «Entrando…».
 */
const LOGIN_PASSWORD_TIMEOUT_MS = 10_000

/** El `fetch` del entorno, resuelto en cada llamada para no fijar `this`. */
const fetchNativo: typeof fetch = (entrada, opciones) => globalThis.fetch(entrada, opciones)

function urlDe(entrada: RequestInfo | URL): URL | null {
  try {
    if (typeof entrada === 'string') return new URL(entrada, globalThis.location?.href)
    if (entrada instanceof URL) return entrada
    return new URL(entrada.url)
  } catch {
    return null
  }
}

function metodoDe(entrada: RequestInfo | URL, opciones?: RequestInit): string {
  if (opciones?.method) return opciones.method.toUpperCase()
  if (typeof entrada !== 'string' && !(entrada instanceof URL)) return entrada.method.toUpperCase()
  return 'GET'
}

/**
 * ¿Es ESTA petición el inicio de sesión por contraseña?
 *
 * Se comprueban las tres cosas por separado en vez de buscar un trozo de texto
 * dentro de la dirección: el orden de la consulta no está garantizado, y
 * `token?grant_type=password` podría aparecer por casualidad en otro sitio.
 */
function esInicioSesionPorContrasena(entrada: RequestInfo | URL, opciones?: RequestInit): boolean {
  if (metodoDe(entrada, opciones) !== 'POST') return false
  const url = urlDe(entrada)
  if (!url || !url.pathname.endsWith('/auth/v1/token')) return false
  return url.searchParams.get('grant_type') === 'password'
}

/** La cancelación que ya traía quien llama, si traía alguna. */
function senalPrevia(entrada: RequestInfo | URL, opciones?: RequestInit): AbortSignal | null {
  if (opciones?.signal) return opciones.signal
  if (typeof entrada !== 'string' && !(entrada instanceof URL)) return entrada.signal ?? null
  return null
}

/**
 * Transporte de los dos clientes. Transparente salvo para el `password grant`.
 *
 * La composición de señales se hace a mano: `AbortSignal.any` y
 * `AbortSignal.timeout` no existen hasta iOS 16 y la aplicación se despliega
 * con destino iOS 15.
 */
const fetchConLimiteDeLogin: typeof fetch = async (entrada, opciones) => {
  if (!esInicioSesionPorContrasena(entrada, opciones)) return fetchNativo(entrada, opciones)

  const control = new AbortController()
  const previa = senalPrevia(entrada, opciones)
  const propagar = () => control.abort()
  if (previa) {
    if (previa.aborted) control.abort()
    else previa.addEventListener('abort', propagar)
  }

  const reloj = setTimeout(() => control.abort(), LOGIN_PASSWORD_TIMEOUT_MS)
  try {
    return await fetchNativo(entrada, { ...opciones, signal: control.signal })
  } finally {
    // Pase lo que pase —éxito, error HTTP, red caída, cancelación externa o
    // nuestro propio límite—, no queda ni un temporizador ni un oyente vivos.
    clearTimeout(reloj)
    previa?.removeEventListener('abort', propagar)
  }
}

// Cliente de la tienda: chat del visitante y sesión del CLIENTE.
export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon, { global: { fetch: fetchConLimiteDeLogin } }) : null

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
        global: { fetch: fetchConLimiteDeLogin },
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
  cerrada_at: string | null
  /** El agente pidió valoración al cerrar. */
  valoracion_solicitada: boolean
  /** 1-5. Null mientras el visitante no la haya enviado. */
  valoracion_estrellas: number | null
  valoracion_observacion: string | null
  valoracion_at: string | null
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

/**
 * Una línea dentro de `pedidos.lines` (jsonb).
 *
 * IDENTIDAD DEL PRODUCTO
 *
 * Los cinco primeros campos son opcionales porque las filas guardadas antes de
 * agosto de 2026 no los tienen: el espejo sólo escribía nombre, color,
 * capacidad, precio, cantidad y seguro, así que de un pedido no se podía
 * volver al producto. Se añadieron para que «Mis productos» pueda resolver la
 * compra contra el catálogo.
 *
 * `colorSlug` y `capacity` son lo que RESUELVE; `color` y `name` son la foto
 * de lo que el cliente vio al comprar y se conservan aunque el catálogo cambie
 * — en una línea de factura importa lo que se compró, no cómo se llama hoy.
 *
 * En `pedidos` sólo hay COMPRAS. Las reservas viven en `reservas` y por eso
 * aquí no hay ninguna marca de reserva: si apareciera una, sería un error.
 */
export interface DbOrderLine {
  /** `familia/modelo/color/capacidad`, o `accessory:slug/variante`. */
  id?: string
  family?: string
  modelSlug?: string
  kind?: 'device' | 'accessory'
  /** Slug del color (`plata`), no el nombre visible. */
  colorSlug?: string
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
