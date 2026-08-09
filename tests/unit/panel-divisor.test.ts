import { describe, expect, it } from 'vitest'
import {
  ANCHO_INICIAL,
  encajarAncho,
  ANCHO_DIVISOR,
  MAXIMO_PROPORCION,
  maximoLista,
  MINIMO_CONVERSACION,
  MINIMO_LISTA,
} from '../../src/lib/panelDivisor'

// El arrastre del divisor no puede dejar inservible ninguno de los dos paneles.
//
// Es aritmética, así que se prueba sin montar nada. Lo que se comprueba no es
// que los números sean bonitos, sino que los tres límites —mínimo de la lista,
// mínimo de la conversación y tope proporcional— se respeten a la vez, incluso
// cuando se contradicen.

const ANCHO = 1440

describe('límites del arrastre', () => {
  it('respeta el mínimo de la lista', () => {
    expect(encajarAncho(0, ANCHO)).toBe(MINIMO_LISTA)
    expect(encajarAncho(-500, ANCHO)).toBe(MINIMO_LISTA)
    expect(encajarAncho(MINIMO_LISTA - 1, ANCHO)).toBe(MINIMO_LISTA)
  })

  it('respeta el tope proporcional', () => {
    // Una lista de 900 px en una pantalla ancha no aporta nada y le roba sitio
    // a lo que se está leyendo.
    expect(encajarAncho(9999, ANCHO)).toBe(Math.round(ANCHO * MAXIMO_PROPORCION))
  })

  it('deja siempre sitio útil a la conversación', () => {
    // En una ventana estrecha manda este límite y no el proporcional.
    const estrecha = 900
    const resultado = encajarAncho(9999, estrecha)
    expect(estrecha - resultado).toBeGreaterThanOrEqual(MINIMO_CONVERSACION)
  })

  it('en el medio, devuelve lo que se le pide', () => {
    expect(encajarAncho(500, ANCHO)).toBe(500)
    expect(encajarAncho(ANCHO_INICIAL, ANCHO)).toBe(ANCHO_INICIAL)
  })

  it('cuando los límites se contradicen, gana la conversación', () => {
    // 600 px de ventana: 280 de lista + 360 de conversación son 640, no caben.
    // Se devuelve el mínimo de la lista y el contenedor se encarga; nunca un
    // número negativo ni uno que deje la conversación en nada.
    const resultado = encajarAncho(400, 600)
    expect(resultado).toBe(MINIMO_LISTA)
    expect(resultado).toBeGreaterThan(0)
  })

  it('tolera medidas imposibles sin devolver basura', () => {
    for (const [pedido, contenedor] of [
      [NaN, ANCHO],
      [400, 0],
      [400, NaN],
      [Infinity, ANCHO],
    ]) {
      const r = encajarAncho(pedido, contenedor)
      expect(Number.isFinite(r), `${pedido}/${contenedor}`).toBe(true)
      expect(r).toBeGreaterThanOrEqual(MINIMO_LISTA)
    }
  })

  it('los valores por defecto son coherentes entre sí', () => {
    expect(ANCHO_INICIAL).toBeGreaterThanOrEqual(MINIMO_LISTA)
    // El inicial tiene que caber en una pantalla de portátil sin comerse la
    // conversación.
    expect(encajarAncho(ANCHO_INICIAL, 1280)).toBe(ANCHO_INICIAL)
  })
})

describe('maximoLista descuenta lo que el divisor ocupa', () => {
  // Los 9 px del divisor son espacio real, no una raya pintada encima. Sin
  // descontarlos, el máximo deja a la conversación 9 px por debajo de su mínimo
  // en cuanto el tope que manda es el de la conversación y no el proporcional.
  it('con el tope de la conversación mandando, resta el divisor', () => {
    const bloque = 700
    expect(maximoLista(bloque)).toBe(bloque - MINIMO_CONVERSACION - ANCHO_DIVISOR)
    expect(bloque - maximoLista(bloque) - ANCHO_DIVISOR).toBe(MINIMO_CONVERSACION)
  })

  it('con el tope proporcional mandando, la conversación sobra de largo', () => {
    const bloque = 1600
    expect(maximoLista(bloque)).toBe(bloque * MAXIMO_PROPORCION)
    expect(bloque - maximoLista(bloque) - ANCHO_DIVISOR).toBeGreaterThan(MINIMO_CONVERSACION)
  })

  it('el ancho del bloque es el del panel MENOS la ficha del visitante', () => {
    // 1280 y 1440 con `VisitorColumn` a 288: los dos casos del bloqueante.
    for (const [ventana, conversacionEsperada] of [
      [1280, 437],
      [1440, 509],
    ] as const) {
      const bloque = ventana - 288
      const lista = Math.round(maximoLista(bloque))
      expect(bloque - lista - ANCHO_DIVISOR).toBe(conversacionEsperada)
      expect(bloque - lista - ANCHO_DIVISOR).toBeGreaterThanOrEqual(MINIMO_CONVERSACION)
    }
  })
})
