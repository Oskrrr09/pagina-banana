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

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null

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
}
