import { describe, expect, it } from 'vitest'
import { clasificarErrorInicioSesion } from '../../src/lib/loginErrors'

// Complemento de `tests/integration/login-errores-servidor.spec.ts`, que es
// quien protege de verdad las pantallas. Aquí sólo se fija la regla: todo lo
// que no sea el error de credenciales cae en el saco genérico, incluido lo que
// todavía no existe.
describe('clasificarErrorInicioSesion', () => {
  it('reconoce el error de credenciales de GoTrue', () => {
    expect(clasificarErrorInicioSesion('Invalid login credentials')).toBe('credenciales')
  })

  it('manda a genérico cualquier error técnico, de red o desconocido', () => {
    for (const mensaje of [
      'Failed to fetch',
      'relation "auth.users" does not exist',
      '{}',
      'NetworkError when attempting to fetch resource.',
      'Database error querying schema',
      'un mensaje que aún no existe',
      '',
      null,
      undefined,
      { message: 'objeto' },
    ]) {
      expect(clasificarErrorInicioSesion(mensaje), String(mensaje)).toBe('generico')
    }
  })

  it('no cuela variantes parecidas al de credenciales', () => {
    expect(clasificarErrorInicioSesion('invalid login credentials')).toBe('generico')
    expect(clasificarErrorInicioSesion('Invalid login credentials: extra')).toBe('generico')
  })
})
