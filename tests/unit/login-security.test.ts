import { describe, expect, it } from 'vitest'
import { safeRedirect } from '../../src/pages/LoginPage'

describe('redirección posterior al acceso', () => {
  it('acepta únicamente rutas internas normales', () => {
    expect(safeRedirect('/cuenta/pedidos?estado=abierto')).toBe('/cuenta/pedidos?estado=abierto')
  })

  it.each([null, '', 'https://ejemplo.invalid', '//ejemplo.invalid', '/\\ejemplo.invalid', '\\ejemplo.invalid'])(
    'rechaza destinos externos o ambiguos: %s',
    (redirect) => {
      expect(safeRedirect(redirect)).toBe('/cuenta')
    },
  )
})
