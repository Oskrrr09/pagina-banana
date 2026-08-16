import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nuevoIdDePedido, esIdDePedido } from '../../src/lib/orderId'
import {
  guardarPendiente,
  listarPendientes,
  reclamar,
  consumir,
  renombrar,
  hayPendientes,
} from '../../src/lib/pendingGuestOrders'
import type { DemoOrder } from '../../src/lib/demoOrderRepository'

// ============================================================================
// La compra invitada: identificador y cola de pendientes.
//
// Lo que se prueba aquí es la parte que no necesita servidor. El recorrido
// completo —compra sin cuenta, identificarse, y que el pedido acabe en
// `pedidos` a nombre de quien se identificó— vive en
// `tests/integration/compra-invitado-servidor.spec.ts`, contra un Supabase de
// verdad.
// ============================================================================

function pedido(id: string): DemoOrder {
  return {
    id,
    createdAt: '2026-08-17T10:00:00.000Z',
    status: 'demo',
    delivery: 'envio',
    customer: { nombre: 'Invitada', email: 'invitada@example.test' },
    paymentMethod: 'tarjeta',
    lines: [
      {
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
      },
    ],
    productsTotal: 1229,
    monthlyInsuranceTotal: 0,
    insuredUnits: 0,
  }
}

// Mismo patrón que el resto de unitarias del proyecto: Vitest corre en `node`,
// así que el almacenamiento se sustituye por uno de mentira. Lo que se prueba es
// la lógica —qué entra, quién puede reclamarlo, cuándo se retira—, no la API del
// navegador.
function almacenamientoFalso() {
  const datos = new Map<string, string>()
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage
}

beforeEach(() => {
  vi.stubGlobal('localStorage', almacenamientoFalso())
  vi.stubGlobal('sessionStorage', almacenamientoFalso())
})

describe('el identificador de un pedido', () => {
  it('deja de salir de un espacio de seis cifras', () => {
    // LA PROPIEDAD, NO LA IMPLEMENTACIÓN
    //
    // El formato anterior era `BC-` y seis dígitos: 900.000 valores para lo que
    // es la clave primaria de `pedidos`. Con la reconciliación de compras
    // invitadas, un choque significa una compra que no se puede recuperar.
    const id = nuevoIdDePedido()
    expect(id, `«${id}» no puede ser el formato de seis cifras`).not.toMatch(/^BC-\d{6}$/)
    expect(id).toMatch(/^BC-[0-9A-F]{12}$/)
  })

  it('usa la fuente criptográfica, no `Math.random`', () => {
    const aleatorio = vi.spyOn(Math, 'random')
    const cripto = vi.spyOn(crypto, 'getRandomValues')
    nuevoIdDePedido()
    expect(cripto, 'la entropía sale de `crypto`').toHaveBeenCalled()
    expect(aleatorio, '`Math.random` no interviene').not.toHaveBeenCalled()
    aleatorio.mockRestore()
    cripto.mockRestore()
  })

  it('no repite en diez mil tiradas', () => {
    // No demuestra la entropía —para eso está el formato—, pero sí caza un
    // generador que se hubiera quedado corto o constante.
    const vistos = new Set<string>()
    for (let i = 0; i < 10_000; i++) vistos.add(nuevoIdDePedido())
    expect(vistos.size).toBe(10_000)
  })

  it('sigue aceptando los identificadores antiguos', () => {
    // En `pedidos` hay filas con `BC-123456` y en el almacenamiento de alguien
    // puede quedar un pedido de una versión anterior. Rechazarlos sería romper
    // datos que ya existen.
    expect(esIdDePedido('BC-482910')).toBe(true)
    expect(esIdDePedido(nuevoIdDePedido())).toBe(true)
    expect(esIdDePedido('BC-12345')).toBe(false)
    expect(esIdDePedido('otra-cosa')).toBe(false)
    expect(esIdDePedido(undefined)).toBe(false)
  })
})

describe('la cola de compras pendientes', () => {
  it('sobrevive en `localStorage`, no en la sesión de la pestaña', () => {
    guardarPendiente(pedido('BC-AAAAAAAAAAAA'))
    // `sessionStorage` muere al cerrar la pestaña; quien compra sin cuenta
    // puede registrarse mañana.
    expect(localStorage.getItem('banana:pending-guest-orders')).toBeTruthy()
    expect(sessionStorage.getItem('banana:pending-guest-orders')).toBeNull()
  })

  it('no duplica la misma compra', () => {
    guardarPendiente(pedido('BC-AAAAAAAAAAAA'))
    guardarPendiente(pedido('BC-AAAAAAAAAAAA'))
    expect(listarPendientes()).toHaveLength(1)
  })

  it('una vez reclamada por una cuenta, otra no puede quedársela', () => {
    // EL CASO QUE ESTO IMPIDE
    //
    // Invitada compra → entra A → falla la red antes del insert → A cierra
    // sesión → entra B en el mismo navegador. B no puede heredar la compra.
    guardarPendiente(pedido('BC-AAAAAAAAAAAA'))
    expect(reclamar('BC-AAAAAAAAAAAA', 'uid-A')).toBe(true)
    expect(reclamar('BC-AAAAAAAAAAAA', 'uid-B'), 'B no puede reclamar lo de A').toBe(false)
    // Y A sí puede reintentarlo tantas veces como haga falta.
    expect(reclamar('BC-AAAAAAAAAAAA', 'uid-A')).toBe(true)
  })

  it('el reclamo se guarda, no se queda en memoria', () => {
    guardarPendiente(pedido('BC-AAAAAAAAAAAA'))
    reclamar('BC-AAAAAAAAAAAA', 'uid-A')
    expect(listarPendientes()[0].claimedBy).toBe('uid-A')
  })

  it('consumir la retira y ya no la puede reclamar nadie', () => {
    guardarPendiente(pedido('BC-AAAAAAAAAAAA'))
    reclamar('BC-AAAAAAAAAAAA', 'uid-A')
    consumir('BC-AAAAAAAAAAAA')
    expect(hayPendientes()).toBe(false)
    expect(reclamar('BC-AAAAAAAAAAAA', 'uid-B')).toBe(false)
  })

  it('renombrar conserva el reclamo', () => {
    // Pasa cuando el identificador chocó con un pedido ajeno: la compra se
    // queda con uno nuevo, pero sigue siendo de quien la estaba reclamando.
    guardarPendiente(pedido('BC-AAAAAAAAAAAA'))
    reclamar('BC-AAAAAAAAAAAA', 'uid-A')
    renombrar('BC-AAAAAAAAAAAA', 'BC-BBBBBBBBBBBB')
    const [p] = listarPendientes()
    expect(p.order.id).toBe('BC-BBBBBBBBBBBB')
    expect(p.claimedBy, 'el dueño no cambia porque cambie el número').toBe('uid-A')
  })

  it('un almacenamiento corrupto no rompe la aplicación', () => {
    localStorage.setItem('banana:pending-guest-orders', 'esto no es json')
    expect(listarPendientes()).toEqual([])
    expect(hayPendientes()).toBe(false)
  })

  it('descarta entradas sin forma de pedido en vez de creérselas', () => {
    localStorage.setItem('banana:pending-guest-orders', JSON.stringify([{ order: { id: 'BC-X' } }, { nada: 1 }]))
    expect(listarPendientes()).toEqual([])
  })
})
