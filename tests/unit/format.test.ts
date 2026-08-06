import { describe, expect, it } from 'vitest'
import { euro, monthlyQuote } from '../../src/lib/format'
import { detectarIdioma } from '../../src/lib/i18n'

describe('formatos monetarios', () => {
  it('mantiene EUR y respeta el locale activo', () => {
    expect(euro(1229, 'es-ES')).toBe('1229\u00a0€')
    expect(euro(1229, 'en-GB')).toBe('€1,229')
    expect(euro(12.5, 'de-DE')).toBe('12,50\u00a0€')
  })

  it('redondea la cuota demostrativa a céntimos', () => {
    expect(monthlyQuote(1000, 24)).toBe(41.67)
    expect(monthlyQuote(0, 12)).toBe(0)
  })
})

describe('detección de idioma', () => {
  it('prioriza una preferencia guardada válida', () => {
    expect(detectarIdioma(['de-DE'], 'fr')).toBe('fr')
  })

  it('usa el primer idioma de navegador soportado y cae a español', () => {
    expect(detectarIdioma(['pt-BR', 'it-IT'], null)).toBe('it')
    expect(detectarIdioma(['pt-BR'], 'invalido')).toBe('es')
  })

  it('fuerza español dentro de la aplicación nativa', () => {
    expect(detectarIdioma(['de-DE'], 'fr', true)).toBe('es')
  })
})
