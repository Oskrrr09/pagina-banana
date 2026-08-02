import { describe, expect, it } from 'vitest'
import { traducirCatalogo } from '../../src/i18n/catalogo'

// La traducción de datos se hace por búsqueda sobre el texto castellano. Es
// cómoda de mantener, pero tiene dos filos que sólo se ven con pruebas:
// qué pasa cuando el texto no está, y qué pasa con los marcadores `{clave}`.

describe('traducirCatalogo', () => {
  it('devuelve el castellano tal cual cuando el idioma es es', () => {
    expect(traducirCatalogo('Pantalla', 'es')).toBe('Pantalla')
  })

  it('traduce un texto del catálogo de productos', () => {
    expect(traducirCatalogo('Pantalla', 'en')).toBe('Display')
    expect(traducirCatalogo('Pantalla', 'fr')).toBe('Écran')
  })

  it('traduce un texto del mapa de accesorios', () => {
    expect(traducirCatalogo('Material', 'fr')).toBe('Matière')
  })

  it('traduce un texto del mapa del asistente', () => {
    expect(traducirCatalogo('Uso cotidiano', 'en')).toBe('Everyday use')
  })

  it('deja pasar en castellano lo que no está traducido', () => {
    // Es el comportamiento buscado: preferimos castellano a una cadena vacía
    // o a la clave en crudo. La prueba de cobertura es la que vigila que no
    // falte nada que debería estar.
    const inventado = 'Texto que no existe en ningún mapa'
    expect(traducirCatalogo(inventado, 'de')).toBe(inventado)
  })

  it('sustituye los marcadores después de traducir', () => {
    // El orden importa: si se sustituyera antes, la frase resultante ya no
    // coincidiría con ninguna clave y saldría en castellano.
    const salida = traducirCatalogo('Hasta {importe}', 'de', { importe: '1.000 €' })
    expect(salida).toBe('Bis 1.000 €')
  })

  it('sustituye los marcadores también en castellano', () => {
    expect(traducirCatalogo('Hasta {importe}', 'es', { importe: '900 €' })).toBe('Hasta 900 €')
  })

  it('deja el marcador visible si no se le pasa el valor', () => {
    // Preferible a imprimir "undefined": si esto sale en pantalla, se ve.
    expect(traducirCatalogo('Hasta {importe}', 'es')).toBe('Hasta {importe}')
  })

  it('no traduce los nombres propios que comparten forma en los cinco idiomas', () => {
    expect(traducirCatalogo('USB-C', 'de')).toBe('USB-C')
    expect(traducirCatalogo('Apple Pencil Pro', 'it')).toBe('Apple Pencil Pro')
  })
})
