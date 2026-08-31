import { describe, expect, it } from 'vitest'
import { normalizarComparacion } from '../../src/lib/comparePersistence'

// ============================================================================
// LO QUE HAY GUARDADO NO SIEMPRE ES LO QUE SE ESPERA.
//
// `banana:compare` guarda `CompareItem[]`. `usePersistent` envuelve
// `JSON.parse` en try/catch, así que aguanta la clave ausente y el JSON roto,
// pero NO comprueba la forma de lo que sale del parseo. Y una forma inesperada
// no rompe sólo el comparador: `Header` y `useTarjetaDeProducto` leen
// `compare.length`, así que un `null` guardado deja EN BLANCO la portada, el
// catálogo y el carrito, en las dos plataformas.
//
// Por dónde puede llegar una forma así: una evolución del esquema, una vuelta
// atrás a un bundle anterior, o manipulación externa. Por la interfaz no: la
// aplicación sólo escribe listas bien formadas.
//
// QUÉ SE EXIGE Y QUÉ NO
//
// Se exige lo que el dominio necesita de verdad para operar: `id` —identidad
// para alternar, quitar y sustituir—, `modelSlug` —con el que se resuelve el
// modelo vivo del catálogo— y `family` —la restricción de familia única—.
//
// NO se exige el resto. `name`, `color`, `capacity` y `price` son datos de
// presentación que la pantalla ya tolera ausentes, y `specs` ni siquiera se
// lee de lo guardado: la tabla la construye `productDecisionData` a partir del
// modelo del catálogo. Validarlos estrictamente tiraría comparaciones que hoy
// funcionan, que es exactamente lo que no se quiere.
// ============================================================================

const item = (id: string, modelSlug: string, family: string) => ({
  id,
  modelSlug,
  family,
  name: 'iPhone 17 Pro',
  color: 'Negro',
  capacity: '256GB',
  price: 1229,
  specs: [],
})

describe('normalizar lo guardado en banana:compare', () => {
  it('una lista legítima se conserva intacta', () => {
    const guardado = [item('a', '17-pro', 'iphone'), item('b', '17', 'iphone')]
    expect(normalizarComparacion(guardado)).toEqual(guardado)
  })

  it('la lista vacía sigue siendo la lista vacía', () => {
    expect(normalizarComparacion([])).toEqual([])
  })

  for (const [etiqueta, valor] of [
    ['null', null],
    ['undefined', undefined],
    ['un objeto', { a: 1 }],
    ['un número', 42],
    ['una cadena', 'iphone/17-pro'],
    ['un booleano', true],
  ] as const) {
    it(`${etiqueta} se trata como comparación vacía`, () => {
      expect(normalizarComparacion(valor)).toEqual([])
    })
  }

  it('una lista de cadenas —la forma que usa banana:fav— se descarta entera', () => {
    expect(normalizarComparacion(['iphone/17-pro', 'iphone/17'])).toEqual([])
  })

  it('los elementos inservibles se caen y los buenos se quedan', () => {
    const bueno = item('a', '17-pro', 'iphone')
    const entrada = [bueno, null, 'texto', { id: 'b' }, { modelSlug: '17', family: 'iphone' }, 7]
    expect(normalizarComparacion(entrada)).toEqual([bueno])
  })

  it('no exige los campos de presentación: se puede reconstruir del catálogo', () => {
    // `specs` no se lee nunca de lo guardado y el resto lo tolera la pantalla.
    const minimo = { id: 'iphone/17-pro/Negro/256GB', modelSlug: '17-pro', family: 'iphone' }
    expect(normalizarComparacion([minimo])).toEqual([minimo])
  })

  it('rechaza identificadores vacíos, que no sirven para operar', () => {
    expect(normalizarComparacion([{ id: '', modelSlug: '17-pro', family: 'iphone' }])).toEqual([])
    expect(normalizarComparacion([{ id: 'a', modelSlug: '', family: 'iphone' }])).toEqual([])
    expect(normalizarComparacion([{ id: 'a', modelSlug: '17-pro', family: '' }])).toEqual([])
  })

  it('nunca lanza, sea cual sea la entrada', () => {
    const raros: unknown[] = [
      Symbol('x'),
      () => {},
      new Map(),
      NaN,
      Infinity,
      [[[]]],
      {
        get id() {
          throw new Error('x')
        },
      },
    ]
    for (const r of raros) expect(() => normalizarComparacion(r)).not.toThrow()
  })
})
