import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAXIMO_RECIENTES,
  espacioDe,
  leerRecientesApp,
  olvidarRecientesApp,
  registrarVistoApp,
} from '../../src/lib/recentlyViewedApp'

// ============================================================================
// EL HISTORIAL DE LA APP NO SE FILTRA ENTRE CUENTAS.
//
// El almacén de la web guarda una sola lista para todo el dispositivo, y lo hace
// a propósito (D-064): en un navegador, «lo que has mirado» es del navegador.
//
// En la app ese razonamiento no vale. Se detectó en el teléfono: una persona
// miraba productos, cerraba sesión, entraba otra y seguía viendo los de la
// primera. Estas pruebas fijan que cada identidad tiene su espacio y que nadie
// ve el de nadie. Ver D-088.
// ============================================================================

const A = 'usuario-a-0001'
const B = 'usuario-b-0002'

// Las unitarias corren en Node, sin navegador, así que se usa el mismo
// `localStorage` de mentira que la suite del historial web: lo que se mide aquí
// es la lógica de separación, no el almacenamiento del navegador.
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

describe('recientes de la app, separados por identidad', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: almacenamientoFalso() })
  })

  it('cada identidad tiene su propio espacio, y el anónimo el suyo', () => {
    expect(espacioDe(A)).not.toBe(espacioDe(B))
    expect(espacioDe(null)).not.toBe(espacioDe(A))
    // `undefined` y `null` son lo mismo: «sin cuenta».
    expect(espacioDe(undefined)).toBe(espacioDe(null))
  })

  it('lo que mira A no llega a B ni al anónimo', () => {
    registrarVistoApp(A, 'iphone/17-pro')

    expect(leerRecientesApp(A), 'A ve lo suyo').toEqual(['iphone/17-pro'])
    expect(leerRecientesApp(B), 'B no hereda nada de A').toEqual([])
    expect(leerRecientesApp(null), 'ni el anónimo').toEqual([])
  })

  it('lo que mira B tampoco llega a A', () => {
    registrarVistoApp(A, 'iphone/17-pro')
    registrarVistoApp(B, 'mac/macbook-air-m4')

    expect(leerRecientesApp(A)).toEqual(['iphone/17-pro'])
    expect(leerRecientesApp(B)).toEqual(['mac/macbook-air-m4'])
  })

  it('lo anónimo no se mezcla al iniciar sesión', () => {
    // Entrar en una cuenta no arrastra lo que se miró sin ella: quien navega
    // sin identificarse puede no querer que eso quede asociado a su cuenta.
    registrarVistoApp(null, 'ipad/ipad-pro')
    expect(leerRecientesApp(A), 'la cuenta empieza vacía').toEqual([])
    expect(leerRecientesApp(null), 'y lo anónimo sigue donde estaba').toEqual(['ipad/ipad-pro'])
  })

  it('A recupera su historial al volver a entrar en el mismo dispositivo', () => {
    registrarVistoApp(A, 'iphone/17-pro')
    registrarVistoApp(A, 'mac/macbook-air-m4')
    // Pasa por anónimo y por otra cuenta, como en un cambio real de usuario.
    registrarVistoApp(null, 'ipad/ipad-pro')
    registrarVistoApp(B, 'apple-watch/series-11')

    expect(leerRecientesApp(A), 'lo suyo sigue intacto').toEqual(['mac/macbook-air-m4', 'iphone/17-pro'])
  })

  it('olvidar el historial de una identidad no toca el de las demás', () => {
    registrarVistoApp(A, 'iphone/17-pro')
    registrarVistoApp(B, 'mac/macbook-air-m4')

    olvidarRecientesApp(A)

    expect(leerRecientesApp(A)).toEqual([])
    expect(leerRecientesApp(B), 'B conserva el suyo').toEqual(['mac/macbook-air-m4'])
  })

  it('el más reciente va primero y no se duplica', () => {
    registrarVistoApp(A, 'iphone/17-pro')
    registrarVistoApp(A, 'mac/macbook-air-m4')
    registrarVistoApp(A, 'iphone/17-pro')

    // Se mueve arriba en vez de repetirse: es «lo último que miraste», no
    // «cuántas veces».
    expect(leerRecientesApp(A)).toEqual(['iphone/17-pro', 'mac/macbook-air-m4'])
  })

  it(`conserva ${MAXIMO_RECIENTES} como mucho`, () => {
    for (let i = 0; i < MAXIMO_RECIENTES + 4; i += 1) registrarVistoApp(A, `familia/modelo-${i}`)

    const guardados = leerRecientesApp(A)
    expect(guardados).toHaveLength(MAXIMO_RECIENTES)
    expect(guardados[0], 'y el último visto encabeza').toBe(`familia/modelo-${MAXIMO_RECIENTES + 3}`)
  })

  it('ignora identificadores que no son de producto', () => {
    registrarVistoApp(A, 'esto-no-vale')
    expect(leerRecientesApp(A)).toEqual([])
  })

  it('tolera un almacenamiento corrupto sin romper la pantalla', () => {
    window.localStorage.setItem(espacioDe(A), '{no es json')
    expect(leerRecientesApp(A)).toEqual([])

    window.localStorage.setItem(espacioDe(A), '{"ni":"una lista"}')
    expect(leerRecientesApp(A)).toEqual([])
  })
})
