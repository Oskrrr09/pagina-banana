import { supabase, type DbOrder, type DbOrderLine } from './supabase'
import { INSURANCE_MONTHLY, type DemoOrder, type DemoOrderLine } from './demoOrderRepository'

// Espejo de los pedidos demostrativos en Supabase.
//
// El pedido "de verdad" del prototipo sigue viviendo en sessionStorage
// (demoOrderRepository), igual que antes: quien compra como invitado no
// nota ningún cambio. Cuando hay sesión de cliente guardamos además una
// copia para que "Mis pedidos" sobreviva a cerrar el navegador.
//
// Si el espejo falla, NO se rompe la compra: el pedido demostrativo ya
// existe y el usuario ve su confirmación igual. Solo se registra el error.
//
// UNA RESERVA NO ES UNA COMPRA
//
// El `DemoOrder` local recoge todo lo que pasó en ese paso por caja, compras y
// reservas juntas, y la pantalla de confirmación las enseña juntas con razón.
// La tabla `pedidos` no: ahí sólo va lo comprado, porque las reservas ya tienen
// su sitio en `reservas` con su cola y su estado.
//
// Antes se espejaba `order.lines` entero. Con un carrito mixto —algo comprado y
// algo reservado— la línea reservada acababa en `pedidos` sin ninguna marca, y
// además contaba en `products_total`. Nadie lo veía porque «Mis pedidos» sólo
// pintaba cantidad y nombre, pero el dato decía que el cliente había comprado
// un aparato que en realidad estaba esperando en una lista. Filtrar aquí y no
// en quien llama es a propósito: este módulo es el que decide qué entra en
// `pedidos`, y así ningún futuro llamante puede saltárselo.

/** Lo comprado de verdad: todo lo que no sea una reserva. */
function lineasCompradas(order: DemoOrder): DemoOrderLine[] {
  return order.lines.filter((line) => !line.reservation)
}

/**
 * Traduce una línea local a la forma que se guarda.
 *
 * Se conserva la identidad —`id`, `family`, `modelSlug`, `kind`, `colorSlug`—
 * para poder volver del pedido al producto del catálogo. Sin ella, de una
 * compra guardada sólo quedaba un nombre suelto.
 */
function aLineaPersistida(line: DemoOrderLine): DbOrderLine {
  return {
    id: line.id,
    family: line.family,
    modelSlug: line.modelSlug,
    kind: line.kind ?? 'device',
    colorSlug: line.colorSlug,
    name: line.name,
    color: line.color,
    capacity: line.capacity,
    price: line.price,
    qty: line.qty,
    insured: line.insured,
    image: line.image,
  }
}

/**
 * La fila que se va a guardar, sin tocar la red.
 *
 * Está fuera de `mirrorOrderToSupabase` para poder comprobar el contrato —qué
 * líneas entran y qué agregados salen— sin levantar Supabase. Devuelve `null`
 * cuando no hay nada que guardar.
 */
export function construirFilaDePedido(clienteId: string, order: DemoOrder) {
  const compradas = lineasCompradas(order)
  // Un pedido íntegramente de reservas no genera fila: hoy el checkout ya no
  // llama aquí en ese caso, pero la garantía vive donde se toma la decisión.
  if (compradas.length === 0) return null

  // Los agregados se recalculan sobre lo que se guarda, no se copian del
  // pedido local: si se copiaran, un carrito mixto dejaría una fila cuyo total
  // incluye un artículo que no aparece entre sus líneas.
  const unidadesAseguradas = compradas.reduce((n, l) => n + (l.insured ? l.qty : 0), 0)

  return {
    id: order.id,
    cliente_id: clienteId,
    created_at: order.createdAt,
    delivery: order.delivery,
    payment_method: order.paymentMethod,
    financing_months: order.financingMonths ?? null,
    products_total: compradas.reduce((n, l) => n + l.price * l.qty, 0),
    insurance_total: unidadesAseguradas * INSURANCE_MONTHLY,
    insured_units: unidadesAseguradas,
    lines: compradas.map(aLineaPersistida),
    status: order.status,
  }
}

export async function mirrorOrderToSupabase(clienteId: string, order: DemoOrder): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no está configurado.' }

  const row = construirFilaDePedido(clienteId, order)
  if (!row) return { error: null }

  const { error } = await supabase.from('pedidos').insert(row)
  if (error) {
    console.error('[orderSync] no se pudo guardar el pedido', error)
    return { error: error.message }
  }
  return { error: null }
}

export async function listMyOrders(clienteId: string): Promise<{ orders: DbOrder[]; error: string | null }> {
  if (!supabase) return { orders: [], error: 'Supabase no está configurado.' }
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  if (error) return { orders: [], error: error.message }
  return { orders: (data ?? []) as DbOrder[], error: null }
}
