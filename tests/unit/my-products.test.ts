import { describe, expect, it } from 'vitest'
import { productosDeMisPedidos } from '../../src/lib/myProducts'
import { getModel, variantPath } from '../../src/data/products'
import type { DbOrder, DbOrderLine } from '../../src/lib/supabase'

// Qué compras se convierten en «Mis productos» y cuáles no.
//
// La regla que vigilan casi todos estos casos es la misma: se resuelve por
// slugs o no se resuelve. Nunca se adivina un producto a partir de su nombre.

// Una variante que existe de verdad en el catálogo.
const IPHONE = getModel('iphone', '17-pro')!
const COLOR = IPHONE.colors[0]
const CAPACIDAD = COLOR.capacities[0]

function linea(parcial: Partial<DbOrderLine> = {}): DbOrderLine {
  return {
    id: `iphone/17-pro/${COLOR.color}/${CAPACIDAD.capacity}`,
    family: 'iphone',
    modelSlug: '17-pro',
    kind: 'device',
    colorSlug: COLOR.color,
    name: 'iPhone 17 Pro',
    color: COLOR.name,
    capacity: CAPACIDAD.capacity,
    price: CAPACIDAD.price,
    qty: 1,
    insured: false,
    image: COLOR.image,
    ...parcial,
  }
}

function pedido(id: string, lines: DbOrderLine[], createdAt = '2026-08-08T10:00:00.000Z'): DbOrder {
  return {
    id,
    created_at: createdAt,
    cliente_id: 'cliente-1',
    delivery: 'envio',
    payment_method: 'tarjeta',
    financing_months: null,
    products_total: lines.reduce((n, l) => n + l.price * l.qty, 0),
    insurance_total: 0,
    insured_units: 0,
    lines,
    status: 'demo',
  }
}

describe('resolución contra el catálogo', () => {
  it('una línea completa se resuelve hasta la variante exacta', () => {
    const [producto] = productosDeMisPedidos([pedido('BC-1', [linea()])])

    expect(producto.model.slug).toBe('17-pro')
    expect(producto.color?.color).toBe(COLOR.color)
    expect(producto.capacity?.capacity).toBe(CAPACIDAD.capacity)
    expect(producto.varianteExacta).toBe(true)
    expect(producto.ruta).toBe(variantPath(IPHONE, COLOR, CAPACIDAD))
    expect(producto.imagen).toBe(COLOR.image)
  })

  it('se resuelve por el slug, no por el nombre visible del color', () => {
    // El nombre es texto editorial: puede cambiar con una corrección de estilo
    // o al traducirse. Mientras el slug siga siendo el mismo, resuelve igual.
    const [producto] = productosDeMisPedidos([pedido('BC-1', [linea({ color: 'Un nombre que ya no se usa' })])])

    expect(producto.varianteExacta).toBe(true)
    expect(producto.color?.color).toBe(COLOR.color)
    // Y se enseña lo que se guardó al comprar, no lo que dice hoy el catálogo.
    expect(producto.colorNombre).toBe('Un nombre que ya no se usa')
  })

  it('un color que ya no existe deja el producto a nivel de modelo', () => {
    const [producto] = productosDeMisPedidos([pedido('BC-1', [linea({ colorSlug: 'color-retirado' })])])

    expect(producto.model.slug, 'el modelo sí se conoce').toBe('17-pro')
    expect(producto.color).toBeNull()
    expect(producto.varianteExacta).toBe(false)
    // Nunca a otra variante: sería un enlace que funciona hacia un producto
    // distinto del que se compró.
    expect(producto.ruta).toBe('/iphone/17-pro')
    expect(producto.ruta).not.toBe(variantPath(IPHONE, COLOR, CAPACIDAD))
  })

  it('una capacidad que ya no existe hace lo mismo', () => {
    const [producto] = productosDeMisPedidos([pedido('BC-1', [linea({ capacity: '999TB' })])])

    expect(producto.color, 'el color sí resuelve').not.toBeNull()
    expect(producto.capacity).toBeNull()
    expect(producto.varianteExacta).toBe(false)
    expect(producto.ruta).toBe('/iphone/17-pro')
    // La capacidad comprada se sigue enseñando tal cual se guardó.
    expect(producto.capacidad).toBe('999TB')
  })

  it('un modelo retirado del catálogo no entra', () => {
    const productos = productosDeMisPedidos([pedido('BC-1', [linea({ modelSlug: 'iphone-de-2011' })])])
    expect(productos).toHaveLength(0)
  })
})

describe('la foto es la de lo que se compró', () => {
  it('con el color resuelto, la del catálogo de hoy', () => {
    // Si el color sigue existiendo, su foto actual manda sobre la guardada:
    // una imagen reprocesada o corregida debe verse.
    const [producto] = productosDeMisPedidos([pedido('BC-1', [linea({ image: '/img/foto-vieja.webp' })])])
    expect(producto.imagen).toBe(COLOR.image)
  })

  it('con el color retirado, la que se guardó al comprar', () => {
    const [producto] = productosDeMisPedidos([
      pedido('BC-1', [linea({ colorSlug: 'color-retirado', image: '/img/el-que-compre.webp' })]),
    ])

    expect(producto.color).toBeNull()
    expect(producto.imagen).toBe('/img/el-que-compre.webp')
  })

  it('sin color y sin foto guardada, no se sustituye por la del primer color', () => {
    // Es lo que hacía antes. La foto del primer color es la de otro producto:
    // más vale un hueco honesto que una imagen convincente y falsa.
    const [producto] = productosDeMisPedidos([
      pedido('BC-1', [linea({ colorSlug: 'color-retirado', image: undefined })]),
    ])

    expect(producto.imagen).toBeUndefined()
    expect(producto.imagen).not.toBe(IPHONE.colors[0].image)
  })
})

describe('qué no entra', () => {
  it('una línea antigua sin identidad no entra, por mucho nombre que tenga', () => {
    // Exactamente lo que guardaba el espejo anterior: ni id, ni family, ni
    // modelSlug, ni kind, ni colorSlug. El nombre coincide con un producto real
    // del catálogo y aun así no se asocia: una coincidencia de texto no
    // demuestra de qué producto se trata.
    const antigua = {
      name: 'iPhone 17 Pro',
      color: 'Plata',
      capacity: '256GB',
      price: 1229,
      qty: 1,
      insured: false,
    } as DbOrderLine

    expect(productosDeMisPedidos([pedido('BC-1', [antigua])])).toHaveLength(0)
  })

  it('un accesorio no entra, aunque sí pertenezca al pedido', () => {
    const accesorio = linea({
      id: 'accessory:cargador-magsafe/1m',
      family: 'accesorios',
      modelSlug: 'cargador-magsafe',
      kind: 'accessory',
      colorSlug: undefined,
      name: 'Cargador MagSafe · 1 m',
      color: '',
      capacity: '',
    })

    expect(productosDeMisPedidos([pedido('BC-1', [accesorio])])).toHaveLength(0)
    // Junto a un dispositivo, sólo sale el dispositivo.
    expect(productosDeMisPedidos([pedido('BC-1', [linea(), accesorio])])).toHaveLength(1)
  })

  it('sin `kind` se toma por dispositivo, que era la convención', () => {
    const [producto] = productosDeMisPedidos([pedido('BC-1', [linea({ kind: undefined })])])
    expect(producto.model.slug).toBe('17-pro')
  })

  it('un pedido sin líneas no rompe nada', () => {
    expect(productosDeMisPedidos([pedido('BC-1', [])])).toHaveLength(0)
    expect(productosDeMisPedidos([])).toHaveLength(0)
  })
})

describe('no se colapsan unidades que no sabemos que sean la misma', () => {
  it('el mismo SKU en dos pedidos son dos entradas', () => {
    // Sin número de serie ni IMEI no hay forma de saber si son el mismo
    // aparato. Probablemente sean dos, y agruparlos haría desaparecer uno.
    const productos = productosDeMisPedidos([
      pedido('BC-1', [linea()], '2026-08-08T10:00:00.000Z'),
      pedido('BC-2', [linea()], '2026-03-12T10:00:00.000Z'),
    ])

    expect(productos).toHaveLength(2)
    expect(productos.map((p) => p.pedidoId)).toEqual(['BC-1', 'BC-2'])
    expect(new Set(productos.map((p) => p.clave)).size, 'cada entrada tiene clave propia').toBe(2)
  })

  it('`qty` se conserva y no se parte en tarjetas inventadas', () => {
    const productos = productosDeMisPedidos([pedido('BC-1', [linea({ qty: 2 })])])

    expect(productos, 'dos unidades sin identificador no son dos aparatos').toHaveLength(1)
    expect(productos[0].cantidad).toBe(2)
  })

  it('el mismo SKU dos veces en el MISMO pedido tampoco colapsa', () => {
    const productos = productosDeMisPedidos([pedido('BC-1', [linea(), linea()])])
    expect(productos).toHaveLength(2)
    expect(new Set(productos.map((p) => p.clave)).size).toBe(2)
  })

  it('se ordenan del pedido más reciente al más antiguo', () => {
    const productos = productosDeMisPedidos([
      pedido('BC-VIEJO', [linea()], '2024-01-01T10:00:00.000Z'),
      pedido('BC-NUEVO', [linea()], '2026-08-08T10:00:00.000Z'),
    ])
    expect(productos.map((p) => p.pedidoId)).toEqual(['BC-NUEVO', 'BC-VIEJO'])
  })
})

describe('compatibilidad: el `id` como último recurso', () => {
  it('con `id` pero sin campos explícitos, se parsea y se verifica', () => {
    // Datos locales escritos antes de que la identidad fuera explícita. El `id`
    // se mira sólo aquí, y lo que sale se comprueba contra el catálogo.
    const [producto] = productosDeMisPedidos([
      pedido('BC-1', [linea({ family: undefined, modelSlug: undefined, colorSlug: undefined })]),
    ])

    expect(producto.model.slug).toBe('17-pro')
    expect(producto.color?.color).toBe(COLOR.color)
    expect(producto.varianteExacta).toBe(true)
  })

  it('un `id` con otro formato no se fuerza', () => {
    const productos = productosDeMisPedidos([
      pedido('BC-1', [linea({ id: 'esto/no/es', family: undefined, modelSlug: undefined, colorSlug: undefined })]),
    ])
    expect(productos).toHaveLength(0)
  })

  it('un `id` que contradice la familia explícita no aporta nada', () => {
    // Lo explícito manda. Coger el color de un `id` que habla de otro producto
    // daría el color de ese otro — y si el slug existiera por casualidad
    // también en este modelo, la tarjeta enseñaría la foto equivocada y abriría
    // la variante equivocada sin que nada fallara.
    const [producto] = productosDeMisPedidos([
      pedido('BC-1', [linea({ id: 'mac/macbook-air-m5/azul-cielo/512GB', colorSlug: undefined })]),
    ])

    // La identidad explícita se basta: el modelo sigue siendo el iPhone.
    expect(producto.model.slug).toBe('17-pro')
    // Pero el color no se rellena con el del `id`.
    expect(producto.color).toBeNull()
    expect(producto.varianteExacta).toBe(false)
    expect(producto.ruta).toBe('/iphone/17-pro')
  })

  it('un `id` que contradice el modelo explícito tampoco', () => {
    // Este es el caso que hace daño de verdad: `azul` existe TANTO en el
    // iPhone 17 como en el 17 Pro. Cogiendo el color del `id` sin comprobar de
    // qué modelo habla, la variante se resolvería —y resolvería bien— con el
    // color de otro producto. Nada fallaría; simplemente sería falso.
    const [producto] = productosDeMisPedidos([
      pedido('BC-1', [linea({ id: 'iphone/17/azul/256GB', colorSlug: undefined })]),
    ])

    expect(producto.model.slug).toBe('17-pro')
    expect(producto.color, 'el `azul` es del iPhone 17, no de este pedido').toBeNull()
    expect(producto.varianteExacta).toBe(false)
  })

  it('un `id` incompatible no invalida una identidad explícita completa', () => {
    // Con `colorSlug` explícito, el `id` sobra por completo: aunque diga otra
    // cosa, la variante se resuelve entera.
    const [producto] = productosDeMisPedidos([pedido('BC-1', [linea({ id: 'mac/macbook-air-m5/azul-cielo/512GB' })])])

    expect(producto.model.slug).toBe('17-pro')
    expect(producto.color?.color).toBe(COLOR.color)
    expect(producto.varianteExacta).toBe(true)
  })

  it('un `id` coherente sí completa lo que falta', () => {
    // Misma familia y mismo modelo: el `id` habla del mismo producto, así que
    // su color vale.
    const [producto] = productosDeMisPedidos([
      pedido('BC-1', [linea({ id: `iphone/17-pro/${COLOR.color}/256GB`, colorSlug: undefined })]),
    ])

    expect(producto.color?.color).toBe(COLOR.color)
    expect(producto.varianteExacta).toBe(true)
  })

  it('un `id` que parsea pero apunta a algo inexistente no inventa nada', () => {
    const productos = productosDeMisPedidos([
      pedido('BC-1', [
        linea({ id: 'iphone/no-existe/plata/256GB', family: undefined, modelSlug: undefined, colorSlug: undefined }),
      ]),
    ])
    expect(productos).toHaveLength(0)
  })
})
