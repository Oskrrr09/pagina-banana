import { supabase, type DbReservation } from './supabase'
import type { CartLine } from './store'

// Reservas por lista de espera — Fase 2.
//
// Cuando una variante está agotada o es bajo pedido, el cliente puede
// pagarla por adelantado y entrar en una cola. El puesto lo fija
// `pagado_at`: quien paga antes, se le sirve antes. Es lo que hace hoy
// Banana con las unidades que aún no han llegado.
//
// La posición NO se guarda: se calcula al vuelo con la función
// `posicion_en_cola` de la base de datos. Así sigue siendo correcta
// cuando alguien por delante cancela. Va por RPC porque cada cliente solo
// puede leer sus propias reservas y aun así necesita saber cuántas hay
// delante (ver supabase/schema.sql).
//
// El pago es DEMOSTRATIVO, igual que el resto del checkout: no se cobra.

export interface ReservationWithPosition {
  reservation: DbReservation
  /** 1 = siguiente en ser servido. null si la cola no se pudo calcular. */
  position: number | null
}

/** ¿Esta línea del carrito es una reserva? */
export function isReservationLine(line: CartLine): boolean {
  return line.reservation === true
}

/**
 * Crea las reservas correspondientes a las líneas marcadas del carrito.
 * Una fila por unidad: cada unidad ocupa su propio puesto en la cola.
 */
export async function createReservationsFromCart(
  // El identificador del cliente ya no se recibe: lo deduce el servidor de la
  // sesión. Se mantiene el parámetro para no cambiar las llamadas, pero se
  // ignora a propósito — aceptarlo era ofrecerle al servidor la respuesta a la
  // pregunta que tiene que comprobar.
  _clienteId: string,
  cart: CartLine[],
): Promise<{ created: DbReservation[]; error: string | null }> {
  if (!supabase) return { created: [], error: 'Supabase no está configurado.' }

  // Una línea por producto, con las unidades dentro. El desglose a una fila
  // por unidad lo hace el servidor.
  //
  // Ni `cliente_id`, ni `estado`, ni `pagado_at` viajan desde aquí: el INSERT
  // directo dejaba enviar un `pagado_at` retrasado y **colarse en la lista de
  // espera** por delante de quien llevaba semanas.
  const lineas = cart.filter(isReservationLine).map((line) => ({
    family: line.family,
    model_slug: line.modelSlug,
    model_name: line.name,
    variant_label: [line.color, line.capacity].filter(Boolean).join(' · '),
    price: line.price,
    unidades: line.qty,
  }))

  if (lineas.length === 0) return { created: [], error: null }

  const { data: ids, error } = await supabase.rpc('crear_mis_reservas', {
    p_lineas: lineas,
  })
  if (error) return { created: [], error: error.message }

  // El RPC devuelve solo los identificadores; las filas se leen después, que
  // además confirma que quedaron como el servidor decidió y no como pedimos.
  const { data, error: errorLectura } = await supabase
    .from('reservas')
    .select('*')
    .in('id', (ids ?? []) as string[])
  if (errorLectura) return { created: [], error: errorLectura.message }
  return { created: (data ?? []) as DbReservation[], error: null }
}

/** Reservas del cliente, con su posición en la cola ya resuelta. */
export async function listMyReservations(
  clienteId: string,
): Promise<{ items: ReservationWithPosition[]; error: string | null }> {
  if (!supabase) return { items: [], error: 'Supabase no está configurado.' }

  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('pagado_at', { ascending: false })
  if (error) return { items: [], error: error.message }

  const reservations = (data ?? []) as DbReservation[]
  const items = await Promise.all(
    reservations.map(async (reservation) => ({
      reservation,
      position:
        reservation.estado === 'en-espera'
          ? await queuePosition(reservation.id)
          : null,
    })),
  )
  return { items, error: null }
}

async function queuePosition(reservationId: string): Promise<number | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('posicion_en_cola', {
    p_reserva_id: reservationId,
  })
  if (error) {
    console.error('[reservations] no se pudo calcular la posición', error)
    return null
  }
  return typeof data === 'number' ? data : null
}

export async function cancelReservation(
  reservationId: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no está configurado.' }
  // Por RPC: el UPDATE directo dejaba cambiar cualquier columna de la reserva
  // —precio, producto, o `pagado_at`, que es lo que fija el puesto en la lista
  // de espera—. La función solo toca el estado, y solo si la reserva es tuya y
  // sigue en espera.
  const { error } = await supabase.rpc('cancelar_mi_reserva', {
    p_reserva_id: reservationId,
  })
  return { error: error ? error.message : null }
}

export function describeReservationStatus(estado: DbReservation['estado']): string {
  switch (estado) {
    case 'en-espera':
      return 'En lista de espera'
    case 'disponible':
      return 'Disponible para recoger'
    case 'completada':
      return 'Completada'
    case 'cancelada':
      return 'Cancelada'
  }
}
