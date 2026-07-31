import {
  EDUCATIONAL_DISCOUNT_BUCKET,
  supabase,
  supabaseAgent,
  type DbCustomer,
  type EducationalDiscountStatus,
} from './supabase'

// Descuento educativo — Fase 2.
//
// El cliente sube un justificante (matrícula, carné de estudiante…) y queda
// en estado "pendiente". Un agente lo revisa después a mano desde /agente.
// No hay validación automática: es deliberado, replica lo que hace hoy
// Banana con la documentación educativa.
//
// El bucket es privado. El cliente solo puede escribir y leer dentro de su
// propia carpeta (`<uid>/…`); el agente puede leer todas. Ver las políticas
// de storage.objects en supabase/schema.sql.

/** Tipos aceptados. El agente necesita poder abrir el archivo sin fricción. */
export const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
export const ACCEPTED_ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png'
export const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

export function describeStatus(estado: EducationalDiscountStatus | null): string {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente de revisión'
    case 'aprobado':
      return 'Aprobado'
    case 'rechazado':
      return 'Rechazado'
    default:
      return 'Sin solicitar'
  }
}

/**
 * Sube el justificante del cliente autenticado y deja la solicitud
 * pendiente de revisión. Sustituye a cualquier archivo anterior.
 */
export async function uploadEducationalProof(
  userId: string,
  file: File,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no está configurado.' }

  if (!ACCEPTED_MIME.includes(file.type)) {
    return { error: 'Formato no admitido. Sube un PDF, JPG o PNG.' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: 'El archivo supera los 5 MB.' }
  }

  // Nombre estable por usuario: así una segunda subida reemplaza a la
  // primera y no acumulamos archivos huérfanos en el bucket.
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
  const path = `${userId}/justificante.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(EDUCATIONAL_DISCOUNT_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) return { error: uploadError.message }

  const { error: updateError } = await supabase
    .from('clientes')
    .update({
      descuento_educativo_archivo: path,
      descuento_educativo_estado: 'pendiente',
      descuento_educativo_subido_at: new Date().toISOString(),
      // Limpiamos la revisión anterior: vuelve a la cola desde cero.
      descuento_educativo_nota: null,
      descuento_educativo_revisado_at: null,
      descuento_educativo_revisado_por: null,
    })
    .eq('id', userId)
  if (updateError) return { error: updateError.message }

  return { error: null }
}

/** Solicitudes pendientes de revisar, para el panel del agente. */
export async function listPendingRequests(): Promise<{
  requests: DbCustomer[]
  error: string | null
}> {
  if (!supabaseAgent) return { requests: [], error: 'Supabase no está configurado.' }
  const { data, error } = await supabaseAgent
    .from('clientes')
    .select('*')
    .eq('descuento_educativo_estado', 'pendiente')
    .order('descuento_educativo_subido_at', { ascending: true })
  if (error) return { requests: [], error: error.message }
  return { requests: (data ?? []) as DbCustomer[], error: null }
}

/**
 * URL temporal para que el agente abra el justificante. El bucket es
 * privado, así que no vale con la ruta: hay que firmarla.
 */
export async function signedProofUrl(path: string): Promise<string | null> {
  if (!supabaseAgent) return null
  const { data, error } = await supabaseAgent.storage
    .from(EDUCATIONAL_DISCOUNT_BUCKET)
    .createSignedUrl(path, 60 * 5)
  if (error) {
    console.error('[educationalDiscount] no se pudo firmar la URL', error)
    return null
  }
  return data.signedUrl
}

/**
 * Aprueba o rechaza una solicitud. Va por RPC en vez de UPDATE directo:
 * RLS filtra filas, no columnas, así que dar UPDATE al agente sobre
 * `clientes` le dejaría tocar direcciones o teléfono. La función de la
 * base de datos solo mueve los campos de la revisión.
 */
export async function reviewRequest(
  clienteId: string,
  estado: Extract<EducationalDiscountStatus, 'aprobado' | 'rechazado'>,
  nota?: string,
): Promise<{ error: string | null }> {
  if (!supabaseAgent) return { error: 'Supabase no está configurado.' }
  const { error } = await supabaseAgent.rpc('revisar_descuento_educativo', {
    p_cliente_id: clienteId,
    p_estado: estado,
    p_nota: nota?.trim() ? nota.trim() : null,
  })
  if (error) return { error: error.message }
  return { error: null }
}
