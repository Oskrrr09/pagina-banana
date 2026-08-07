import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAXIMO_RECIENTES, leerRecientes, olvidarRecientes, registrarVisto } from '../../src/lib/recentlyViewed'

// Historial de productos vistos. Se prueba contra un `localStorage` de mentira
// porque las pruebas unitarias corren en Node, sin navegador; lo que se mide es
// la lógica —orden, duplicados, tope, tolerancia a basura—, que es donde están
// los errores posibles.

const CLAVE = 'banana:recientes'

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
  vi.stubGlobal('window', { localStorage: almacenamientoFalso() })
  olvidarRecientes()
})

describe('historial de vistos', () => {
  it('empieza vacío', () => {
    expect(leerRecientes()).toEqual([])
  })

  it('registra un producto visitado', () => {
    registrarVisto('iphone/17-pro')
    expect(leerRecientes()).toEqual(['iphone/17-pro'])
  })

  it('pone el más reciente primero', () => {
    registrarVisto('iphone/17-pro')
    registrarVisto('mac/macbook-air-m4')
    expect(leerRecientes()).toEqual(['mac/macbook-air-m4', 'iphone/17-pro'])
  })

  it('no duplica: al revisitar, reordena', () => {
    registrarVisto('iphone/17-pro')
    registrarVisto('mac/macbook-air-m4')
    registrarVisto('iphone/17-pro')

    const lista = leerRecientes()
    expect(lista, 'sigue habiendo dos, no tres').toHaveLength(2)
    expect(lista[0], 'el revisitado sube al principio').toBe('iphone/17-pro')
  })

  it(`no guarda más de ${MAXIMO_RECIENTES}`, () => {
    for (let i = 0; i < MAXIMO_RECIENTES + 4; i += 1) registrarVisto(`familia/modelo-${i}`)

    const lista = leerRecientes()
    expect(lista).toHaveLength(MAXIMO_RECIENTES)
    expect(lista[0], 'se conservan los últimos, no los primeros').toBe(`familia/modelo-${MAXIMO_RECIENTES + 3}`)
    expect(lista).not.toContain('familia/modelo-0')
  })

  it('tolera un almacenamiento corrupto', () => {
    window.localStorage.setItem(CLAVE, 'esto no es json')
    expect(leerRecientes(), 'no puede tumbar la portada').toEqual([])
  })

  it('descarta entradas que no son identificadores de producto', () => {
    // Lo que alguien hubiera metido a mano, o restos de una versión anterior.
    window.localStorage.setItem(CLAVE, JSON.stringify(['iphone/17-pro', 42, null, 'sin-barra', { a: 1 }]))
    expect(leerRecientes()).toEqual(['iphone/17-pro'])
  })

  it('no guarda lo que no tiene forma de identificador', () => {
    registrarVisto('esto-no-vale')
    expect(leerRecientes()).toEqual([])
  })

  it('si el almacenamiento no está disponible, devuelve lista vacía sin lanzar', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('bloqueado')
        },
        setItem: () => {
          throw new Error('bloqueado')
        },
        removeItem: () => {
          throw new Error('bloqueado')
        },
      } as unknown as Storage,
    })

    expect(() => registrarVisto('iphone/17-pro')).not.toThrow()
    expect(leerRecientes()).toEqual([])
  })
})
