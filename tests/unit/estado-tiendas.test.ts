import { describe, expect, it } from 'vitest'
import { estadoDeApertura, isOpenNow, MINUTOS_DE_AVISO } from '../../src/data/stores'
import type { Store } from '../../src/data/types'

// El estado de una tienda a lo largo del día.
//
// «Abierto» y «Cerrado» a secas no bastan para decidir si merece la pena
// acercarse: llegar cinco minutos antes del cierre es, en la práctica, llegar
// tarde. Se avisa con media hora.

/**
 * Una tienda con el horario que haga falta, sin depender del catálogo real.
 *
 * Los días se guardan uno a uno —«Lunes», «Martes»…— como en `stores.ts`, y no
 * en rangos: `getTodayHours` busca por nombre exacto del día.
 */
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const

function tienda({
  laborables,
  sabado = 'Cerrado',
  domingo = 'Cerrado',
}: {
  laborables: string
  sabado?: string
  domingo?: string
}): Store {
  return {
    slug: 'prueba',
    name: 'Banana Prueba',
    hours: [
      ...DIAS.map((day) => ({ day, time: laborables })),
      { day: 'Sábado', time: sabado },
      { day: 'Domingo', time: domingo },
    ],
  } as unknown as Store
}

/** Un momento concreto en hora de Canarias, que es UTC en invierno. */
function el(dia: string, hora: string): Date {
  return new Date(`${dia}T${hora}:00.000Z`)
}

// 2026-01-12 es lunes; 2026-01-17, sábado; 2026-01-18, domingo.
const LUNES = '2026-01-12'
const DOMINGO = '2026-01-18'

const CORRIDO = tienda({ laborables: '10:00–20:00', sabado: '10:00–14:00' })
const PARTIDO = tienda({ laborables: '10:30–14:30 · 17:00–20:00' })

describe('horario corrido', () => {
  it('a media mañana está abierta', () => {
    expect(estadoDeApertura(CORRIDO, el(LUNES, '12:00'))).toBe('abierta')
  })

  it('media hora antes de abrir avisa', () => {
    expect(estadoDeApertura(CORRIDO, el(LUNES, '09:30'))).toBe('abre-pronto')
    expect(estadoDeApertura(CORRIDO, el(LUNES, '09:59'))).toBe('abre-pronto')
  })

  it('un minuto antes de la ventana de aviso todavía es cerrada', () => {
    expect(estadoDeApertura(CORRIDO, el(LUNES, '09:29'))).toBe('cerrada')
  })

  it('media hora antes de cerrar avisa', () => {
    expect(estadoDeApertura(CORRIDO, el(LUNES, '19:30'))).toBe('cierra-pronto')
    expect(estadoDeApertura(CORRIDO, el(LUNES, '19:59'))).toBe('cierra-pronto')
  })

  it('un minuto antes de la ventana de cierre sigue abierta a secas', () => {
    expect(estadoDeApertura(CORRIDO, el(LUNES, '19:29'))).toBe('abierta')
  })

  it('a la hora de cerrar ya está cerrada', () => {
    expect(estadoDeApertura(CORRIDO, el(LUNES, '20:00'))).toBe('cerrada')
  })

  it('un día sin horario está cerrada, y no avisa de nada', () => {
    for (const hora of ['09:45', '12:00', '19:45']) {
      expect(estadoDeApertura(CORRIDO, el(DOMINGO, hora)), hora).toBe('cerrada')
    }
  })
})

describe('horario partido', () => {
  it('cada tramo avisa por su cuenta', () => {
    // A las 14:15 cierra el tramo de mañana…
    expect(estadoDeApertura(PARTIDO, el(LUNES, '14:15'))).toBe('cierra-pronto')
    // …a las 15:00 está cerrada del todo…
    expect(estadoDeApertura(PARTIDO, el(LUNES, '15:00'))).toBe('cerrada')
    // …y a las 16:45 vuelve a avisar, esta vez de que abre.
    expect(estadoDeApertura(PARTIDO, el(LUNES, '16:45'))).toBe('abre-pronto')
    expect(estadoDeApertura(PARTIDO, el(LUNES, '17:30'))).toBe('abierta')
  })

  it('entre tramos no se confunde el cierre de uno con la apertura del otro', () => {
    // Justo al cerrar la mañana: cerrada, no «abre pronto», porque a las
    // 17:00 todavía faltan dos horas y media.
    expect(estadoDeApertura(PARTIDO, el(LUNES, '14:30'))).toBe('cerrada')
  })
})

describe('`isOpenNow` sigue significando lo mismo', () => {
  it('abierta y cierra-pronto son las dos formas de estar abierto', () => {
    expect(isOpenNow(CORRIDO, el(LUNES, '12:00'))).toBe(true)
    expect(isOpenNow(CORRIDO, el(LUNES, '19:45'))).toBe(true)
  })

  it('abre-pronto todavía no es abierto', () => {
    // Es el matiz que importa: avisar de que abre pronto no puede hacer que
    // el resto de la aplicación crea que ya se puede ir.
    expect(estadoDeApertura(CORRIDO, el(LUNES, '09:45'))).toBe('abre-pronto')
    expect(isOpenNow(CORRIDO, el(LUNES, '09:45'))).toBe(false)
  })

  it('cerrada es cerrada', () => {
    expect(isOpenNow(CORRIDO, el(DOMINGO, '12:00'))).toBe(false)
  })
})

describe('la ventana de aviso', () => {
  it('es de media hora y se puede leer desde fuera', () => {
    expect(MINUTOS_DE_AVISO).toBe(30)
  })
})
