import { describe, expect, it } from 'vitest'
import {
  FILTROS_VACIOS,
  aplicarFiltros,
  cuentaFiltrosActivos,
  disponibilidadDe,
  escribirFiltrosEnUrl,
  leerFiltrosDeUrl,
} from '../../src/lib/catalogFilters'
import type { Model } from '../../src/data/types'

// Filtrado y orden del catálogo. Se prueba con modelos mínimos hechos a mano y
// no con el catálogo real: así las pruebas siguen valiendo cuando cambien los
// precios de la demostración, y dicen algo sobre la lógica en vez de sobre los
// datos de hoy.

function modelo(slug: string, precio: number, disponibilidad: string): Model {
  return {
    family: 'iphone',
    slug,
    name: slug,
    tagline: '',
    fromPrice: precio,
    colors: [
      {
        name: 'Plata',
        slug: 'plata',
        hex: '#ccc',
        image: '',
        capacities: [{ capacity: '256GB', price: precio, previousPrice: null, availability: disponibilidad }],
      },
    ],
  } as unknown as Model
}

const CATALOGO = [
  modelo('barato', 500, 'disponible'),
  modelo('medio', 1200, 'bajo-pedido'),
  modelo('caro', 2000, 'agotado'),
]

describe('disponibilidadDe', () => {
  it('se queda con la mejor disponibilidad de todas las variantes', () => {
    const mixto = {
      ...modelo('mixto', 900, 'agotado'),
      colors: [
        {
          name: 'A',
          slug: 'a',
          hex: '#000',
          image: '',
          capacities: [
            { capacity: '1', price: 900, previousPrice: null, availability: 'agotado' },
            { capacity: '2', price: 900, previousPrice: null, availability: 'disponible' },
          ],
        },
      ],
    } as unknown as Model
    expect(disponibilidadDe(mixto)).toBe('disponible')
  })
})

describe('aplicarFiltros', () => {
  it('sin filtros devuelve el catálogo en su orden original', () => {
    expect(aplicarFiltros(CATALOGO, FILTROS_VACIOS).map((m) => m.slug)).toEqual(['barato', 'medio', 'caro'])
  })

  it('filtra por precio máximo', () => {
    const salida = aplicarFiltros(CATALOGO, { ...FILTROS_VACIOS, precioMax: 1500 })
    expect(salida.map((m) => m.slug)).toEqual(['barato', 'medio'])
  })

  it('filtra por disponibilidad', () => {
    const salida = aplicarFiltros(CATALOGO, { ...FILTROS_VACIOS, disponibilidad: ['disponible'] })
    expect(salida.map((m) => m.slug)).toEqual(['barato'])
  })

  it('combina precio y disponibilidad', () => {
    const salida = aplicarFiltros(CATALOGO, {
      ...FILTROS_VACIOS,
      precioMax: 1500,
      disponibilidad: ['bajo-pedido'],
    })
    expect(salida.map((m) => m.slug)).toEqual(['medio'])
  })

  it('ordena por precio ascendente y descendente', () => {
    expect(aplicarFiltros(CATALOGO, { ...FILTROS_VACIOS, orden: 'precio-asc' }).map((m) => m.fromPrice)).toEqual([
      500, 1200, 2000,
    ])
    expect(aplicarFiltros(CATALOGO, { ...FILTROS_VACIOS, orden: 'precio-desc' }).map((m) => m.fromPrice)).toEqual([
      2000, 1200, 500,
    ])
  })

  it('ordenar no altera la lista original', () => {
    const antes = CATALOGO.map((m) => m.slug)
    aplicarFiltros(CATALOGO, { ...FILTROS_VACIOS, orden: 'precio-desc' })
    expect(
      CATALOGO.map((m) => m.slug),
      'se ordena una copia',
    ).toEqual(antes)
  })

  it('puede no devolver nada', () => {
    expect(aplicarFiltros(CATALOGO, { ...FILTROS_VACIOS, precioMax: 100 })).toEqual([])
  })
})

describe('cuentaFiltrosActivos', () => {
  it('no cuenta el orden como filtro', () => {
    expect(cuentaFiltrosActivos({ ...FILTROS_VACIOS, orden: 'precio-asc' })).toBe(0)
  })

  it('cuenta precio y disponibilidad', () => {
    expect(cuentaFiltrosActivos({ precioMax: 900, disponibilidad: ['disponible'], orden: 'catalogo' })).toBe(2)
  })
})

describe('estado en la URL', () => {
  it('ida y vuelta conserva los filtros', () => {
    const filtros = { precioMax: 1000, disponibilidad: ['disponible' as const], orden: 'precio-asc' as const }
    expect(leerFiltrosDeUrl(escribirFiltrosEnUrl(filtros))).toEqual(filtros)
  })

  it('no ensucia la URL cuando no hay nada aplicado', () => {
    expect(escribirFiltrosEnUrl(FILTROS_VACIOS).toString()).toBe('')
  })

  it('ignora valores inventados en la URL', () => {
    const params = new URLSearchParams('precio=abc&disp=inventada&orden=aleatorio')
    expect(leerFiltrosDeUrl(params)).toEqual(FILTROS_VACIOS)
  })

  it('descarta un precio negativo', () => {
    expect(leerFiltrosDeUrl(new URLSearchParams('precio=-5')).precioMax).toBeNull()
  })

  it('acepta varias disponibilidades separadas por coma', () => {
    const leidos = leerFiltrosDeUrl(new URLSearchParams('disp=disponible,agotado'))
    expect(leidos.disponibilidad).toEqual(['disponible', 'agotado'])
  })
})
