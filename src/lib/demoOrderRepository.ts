// Repositorio de pedidos de DEMOSTRACIÓN. Persiste en sessionStorage bajo la
// clave `banana:demo-orders`. Cuando exista una base de datos real deberá
// sustituirse esta capa por un adaptador que hable con la API — los
// componentes ya consumen únicamente la interfaz pública de este módulo.

import type { CartLine } from './store'

export interface DemoOrderLine {
  id: string
  modelSlug: string
  family: string
  name: string
  color: string
  /** Slug del color. Ver `CartLine.colorSlug`: esto resuelve, `color` se enseña. */
  colorSlug?: string
  capacity: string
  price: number
  qty: number
  insured: boolean
  /**
   * Opcional aunque `createFromCart` siempre lo ponga: este objeto se
   * deserializa de `sessionStorage`, donde puede quedar un pedido escrito por
   * una versión anterior. Declararlo obligatorio sería prometer algo que el
   * almacenamiento no garantiza.
   */
  kind?: 'device' | 'accessory'
  image?: string
  /** Línea reservada (lista de espera) en vez de comprada. */
  reservation?: boolean
}

export type DemoDeliveryMode = 'envio' | 'recogida'

export interface DemoOrderCustomer {
  nombre: string
  email: string
  direccion?: string
  isla?: string
  tienda?: string
}

export interface DemoOrder {
  id: string
  createdAt: string // ISO
  status: 'demo' // se marca claramente como pedido de demostración
  delivery: DemoDeliveryMode
  customer: DemoOrderCustomer
  lines: DemoOrderLine[]
  paymentMethod: 'tarjeta' | 'bizum' | 'financiacion'
  financingMonths?: number
  productsTotal: number
  monthlyInsuranceTotal: number
  insuredUnits: number
}

const STORAGE_KEY = 'banana:demo-orders'
const LAST_ID_KEY = 'banana:demo-last-order-id'

function readAll(): Record<string, DemoOrder> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, DemoOrder>) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, DemoOrder>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* almacenamiento no disponible: seguimos en memoria hasta recarga */
  }
}

function generateId() {
  // Formato BC-XXXXXX. El prefijo evita colisionar con IDs reales de la web
  // oficial y deja claro que es una demostración.
  return 'BC-' + Math.floor(100000 + Math.random() * 899999)
}

/**
 * Cuota mensual del seguro demostrativo.
 *
 * Se exporta para que `orderSync` recalcule los agregados de lo que sí se
 * compra sin tener que copiar la cifra. Ojo con lo que significa: es una
 * constante del front, no una tarifa guardada — de un pedido antiguo no se
 * puede recuperar la prima que se le aplicó.
 */
export const INSURANCE_MONTHLY = 8.99

export interface CreateOrderInput {
  cart: CartLine[]
  delivery: DemoDeliveryMode
  customer: DemoOrderCustomer
  paymentMethod: DemoOrder['paymentMethod']
  financingMonths?: number
}

export const demoOrderRepository = {
  createFromCart(input: CreateOrderInput): DemoOrder {
    const id = generateId()
    const insuredUnits = input.cart.reduce((n, line) => n + (line.insured ? line.qty : 0), 0)
    const order: DemoOrder = {
      id,
      createdAt: new Date().toISOString(),
      status: 'demo',
      delivery: input.delivery,
      customer: input.customer,
      paymentMethod: input.paymentMethod,
      financingMonths: input.financingMonths,
      lines: input.cart.map((line) => ({
        id: line.id,
        modelSlug: line.modelSlug,
        family: line.family,
        name: line.name,
        color: line.color,
        colorSlug: line.colorSlug,
        capacity: line.capacity,
        price: line.price,
        qty: line.qty,
        insured: Boolean(line.insured),
        // `kind` se normaliza aquí y no se deja pasar como `undefined`: las
        // líneas de dispositivo nunca lo ponían y el «device» estaba sólo en
        // la convención. A partir de aquí es un dato, no un acuerdo tácito.
        kind: line.kind ?? 'device',
        image: line.image,
        reservation: line.reservation,
      })),
      productsTotal: input.cart.reduce((n, l) => n + l.price * l.qty, 0),
      monthlyInsuranceTotal: insuredUnits * INSURANCE_MONTHLY,
      insuredUnits,
    }
    const all = readAll()
    all[id] = order
    writeAll(all)
    try {
      sessionStorage.setItem(LAST_ID_KEY, id)
    } catch {
      /* noop */
    }
    return order
  },

  get(id: string): DemoOrder | null {
    return readAll()[id] ?? null
  },

  getLast(): DemoOrder | null {
    try {
      const id = sessionStorage.getItem(LAST_ID_KEY)
      if (!id) return null
      return this.get(id)
    } catch {
      return null
    }
  },

  hasAny(): boolean {
    try {
      return Boolean(sessionStorage.getItem(LAST_ID_KEY))
    } catch {
      return false
    }
  },

  clearLastPointer() {
    try {
      sessionStorage.removeItem(LAST_ID_KEY)
    } catch {
      /* noop */
    }
  },
}
