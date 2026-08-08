import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { _reloj, suscribir } from '../../src/lib/reloj'

// El reloj compartido.
//
// Lo que importa aquí es que haya **un** temporizador para todos los oyentes.
// El consumidor es el distintivo de estado de cada tienda, y en `/tiendas` hay
// una tarjeta por tienda: uno por tarjeta habría multiplicado el coste por el
// catálogo y habría hecho que unas cambiaran de estado antes que otras.
//
// El hook sobre un DOM real se prueba en `tests/e2e-prefs/tiendas-en-vivo.spec.ts`.

describe('un solo temporizador para todos', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('no corre mientras nadie mira', () => {
    expect(_reloj.oyentes()).toBe(0)
    expect(_reloj.activo(), 'no debería haber temporizador sin oyentes').toBe(false)
  })

  it('tres oyentes comparten un único temporizador', () => {
    const bajas = [vi.fn(), vi.fn(), vi.fn()].map((f) => suscribir(f))

    expect(_reloj.oyentes()).toBe(3)
    expect(_reloj.activo()).toBe(true)

    bajas.forEach((baja) => baja())
    expect(_reloj.oyentes()).toBe(0)
    // Y se apaga con el último: dejar un temporizador vivo en una pantalla que
    // ya nadie mira es una fuga, aunque sea barata.
    expect(_reloj.activo(), 'el temporizador debería morir con el último oyente').toBe(false)
  })

  it('avisa a todos a la vez, una vez por minuto', () => {
    // A mitad de minuto, para comprobar que el primer salto se alinea con el
    // cambio de minuto del reloj y no espera 60 s desde que alguien se suscribe.
    vi.setSystemTime(new Date('2026-01-12T09:29:30.000Z'))

    const a = vi.fn()
    const b = vi.fn()
    const bajaA = suscribir(a)
    const bajaB = suscribir(b)

    vi.advanceTimersByTime(29_000)
    expect(a, 'todavía no ha cambiado el minuto').not.toHaveBeenCalled()

    vi.advanceTimersByTime(1_000)
    expect(a).toHaveBeenCalledTimes(1)
    expect(b, 'los dos oyentes reciben el mismo aviso').toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60_000)
    expect(a).toHaveBeenCalledTimes(2)

    bajaA()
    vi.advanceTimersByTime(60_000)
    expect(a, 'quien se da de baja deja de recibir').toHaveBeenCalledTimes(2)
    expect(b).toHaveBeenCalledTimes(3)
    bajaB()
  })

  it('un oyente que falla no deja sin avisar a los demás', () => {
    vi.setSystemTime(new Date('2026-01-12T09:29:30.000Z'))
    const roto = vi.fn(() => {
      throw new Error('vaya')
    })
    const sano = vi.fn()
    const bajas = [suscribir(roto), suscribir(sano)]

    vi.advanceTimersByTime(30_000)
    expect(sano).toHaveBeenCalledTimes(1)
    // Y el temporizador sigue vivo para el minuto siguiente.
    vi.advanceTimersByTime(60_000)
    expect(sano).toHaveBeenCalledTimes(2)
    bajas.forEach((b) => b())
  })
})
