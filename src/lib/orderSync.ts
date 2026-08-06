import { supabase, type DbOrder } from './supabase'
import type { DemoOrder } from './demoOrderRepository'

// Espejo de los pedidos demostrativos en Supabase.
//
// El pedido "de verdad" del prototipo sigue viviendo en sessionStorage
// (demoOrderRepository), igual que antes: quien compra como invitado no
// nota ningún cambio. Cuando hay sesión de cliente guardamos además una
// copia para que "Mis pedidos" sobreviva a cerrar el navegador.
//
// Si el espejo falla, NO se rompe la compra: el pedido demostrativo ya
// existe y el usuario ve su confirmación igual. Solo se registra el error.

export async function mirrorOrderToSupabase(clienteId: string, order: DemoOrder): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no está configurado.' }

  const row = {
    id: order.id,
    cliente_id: clienteId,
    created_at: order.createdAt,
    delivery: order.delivery,
    payment_method: order.paymentMethod,
    financing_months: order.financingMonths ?? null,
    products_total: order.productsTotal,
    insurance_total: order.monthlyInsuranceTotal,
    insured_units: order.insuredUnits,
    lines: order.lines.map((l) => ({
      name: l.name,
      color: l.color,
      capacity: l.capacity,
      price: l.price,
      qty: l.qty,
      insured: l.insured,
      image: l.image,
    })),
    status: order.status,
  }

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
