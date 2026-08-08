import { describe, expect, it } from 'vitest'
import { construirFilaDePedido } from '../../src/lib/orderSync'
import { INSURANCE_MONTHLY, type DemoOrder, type DemoOrderLine } from '../../src/lib/demoOrderRepository'

// Contrato de lo que se guarda en `pedidos`.
//
// Dos cosas que hay que sostener: que la línea conserve identidad suficiente
// para volver al producto, y que en `pedidos` sólo haya compras.

function linea(parcial: Partial<DemoOrderLine> = {}): DemoOrderLine {
  return {
    id: 'iphone/17-pro/plata/256GB',
    modelSlug: '17-pro',
    family: 'iphone',
    name: 'iPhone 17 Pro',
    color: 'Plata',
    colorSlug: 'plata',
    capacity: '256GB',
    price: 1229,
    qty: 1,
    insured: false,
    kind: 'device',
    ...parcial,
  }
}

function pedido(lines: DemoOrderLine[]): DemoOrder {
  return {
    id: 'BC-100001',
    createdAt: '2026-08-08T10:00:00.000Z',
    status: 'demo',
    delivery: 'envio',
    customer: { nombre: 'Oscar', email: 'oscar@example.test' },
    lines,
    paymentMethod: 'tarjeta',
    // Los agregados locales incluyen las reservas a propósito: el pedido local
    // representa el paso por caja entero. Lo que se guarda, no.
    productsTotal: lines.reduce((n, l) => n + l.price * l.qty, 0),
    monthlyInsuranceTotal: lines.reduce((n, l) => n + (l.insured ? l.qty : 0), 0) * INSURANCE_MONTHLY,
    insuredUnits: lines.reduce((n, l) => n + (l.insured ? l.qty : 0), 0),
  }
}

describe('identidad de la línea guardada', () => {
  it('conserva lo que hace falta para volver al producto', () => {
    const fila = construirFilaDePedido('cliente-1', pedido([linea()]))!
    const guardada = fila.lines[0]

    // Los cinco que antes se perdían por el camino.
    expect(guardada.id).toBe('iphone/17-pro/plata/256GB')
    expect(guardada.family).toBe('iphone')
    expect(guardada.modelSlug).toBe('17-pro')
    expect(guardada.kind).toBe('device')
    expect(guardada.colorSlug).toBe('plata')

    // Y sigue estando la foto de lo que se compró.
    expect(guardada.name).toBe('iPhone 17 Pro')
    expect(guardada.color).toBe('Plata')
    expect(guardada.capacity).toBe('256GB')
    expect(guardada.price).toBe(1229)
  })

  it('normaliza `kind` cuando la línea no lo trae', () => {
    // Era la convención histórica: sin `kind`, dispositivo.
    const fila = construirFilaDePedido('cliente-1', pedido([linea({ kind: undefined })]))!
    expect(fila.lines[0].kind).toBe('device')
  })

  it('un accesorio se guarda como accesorio', () => {
    const accesorio = linea({
      id: 'accessory:cargador-magsafe/1m',
      modelSlug: 'cargador-magsafe',
      family: 'accesorios',
      name: 'Cargador MagSafe · 1 m',
      color: '',
      colorSlug: undefined,
      capacity: '',
      kind: 'accessory',
      price: 49,
    })
    const fila = construirFilaDePedido('cliente-1', pedido([accesorio]))!

    expect(fila.lines[0].kind).toBe('accessory')
    // El slug de la variante sigue dentro del `id`, que es donde ya vivía.
    expect(fila.lines[0].id).toBe('accessory:cargador-magsafe/1m')
    expect(fila.lines[0].modelSlug).toBe('cargador-magsafe')
  })
})

describe('una reserva no es una compra', () => {
  const comprado = linea({ id: 'iphone/17-pro/plata/256GB', name: 'iPhone 17 Pro', price: 1229, insured: true })
  const reservado = linea({
    id: 'mac/macbook-air-m5/azul-cielo/15" · 16 GB · 512 GB',
    modelSlug: 'macbook-air-m5',
    family: 'mac',
    name: 'MacBook Air M5',
    color: 'Azul cielo',
    colorSlug: 'azul-cielo',
    capacity: '15" · 16 GB · 512 GB',
    price: 1579,
    insured: false,
    reservation: true,
  })

  it('con carrito mixto, en `pedidos` sólo queda lo comprado', () => {
    const fila = construirFilaDePedido('cliente-1', pedido([comprado, reservado]))!

    expect(fila.lines).toHaveLength(1)
    expect(fila.lines[0].name).toBe('iPhone 17 Pro')
    expect(
      fila.lines.some((l) => l.modelSlug === 'macbook-air-m5'),
      'lo reservado vive en `reservas`, no aquí',
    ).toBe(false)
  })

  it('los agregados corresponden a las líneas guardadas', () => {
    const local = pedido([comprado, reservado])
    const fila = construirFilaDePedido('cliente-1', local)!

    // El pedido local suma las dos: son las dos cosas que pasaron en caja.
    expect(local.productsTotal).toBe(1229 + 1579)
    // La fila guardada, sólo la comprada. Si copiara el total del pedido local,
    // habría una fila cuyo importe incluye un artículo que no aparece en ella.
    expect(fila.products_total).toBe(1229)
    expect(fila.insured_units).toBe(1)
    expect(fila.insurance_total).toBe(INSURANCE_MONTHLY)

    // Y la suma de sus líneas cuadra con su total.
    expect(fila.lines.reduce((n, l) => n + l.price * l.qty, 0)).toBe(fila.products_total)
  })

  it('un pedido sólo de reservas no genera fila', () => {
    expect(construirFilaDePedido('cliente-1', pedido([reservado]))).toBeNull()
  })

  it('las cantidades cuentan por unidades, no por líneas', () => {
    const fila = construirFilaDePedido('cliente-1', pedido([linea({ qty: 3, insured: true, price: 100 })]))!
    expect(fila.products_total).toBe(300)
    expect(fila.insured_units).toBe(3)
    expect(fila.insurance_total).toBeCloseTo(3 * INSURANCE_MONTHLY, 5)
  })
})
