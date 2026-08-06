import { describe, expect, it, vi } from 'vitest'
import { alCerrarSesionCliente, notificarCierreSesionCliente } from '../../src/lib/accountSession'

// El aviso interno que usan los proveedores de preferencias para vaciarse
// cuando una cuenta cierra sesión. Lo importante no es que llame a las
// escuchas —eso es lo fácil— sino que una escucha rota no pueda dejar el
// cierre de sesión a medias.

describe('aviso de cierre de sesión de cliente', () => {
  it('avisa a las escuchas registradas', () => {
    const primera = vi.fn()
    const segunda = vi.fn()
    const bajaPrimera = alCerrarSesionCliente(primera)
    const bajaSegunda = alCerrarSesionCliente(segunda)

    notificarCierreSesionCliente()

    expect(primera).toHaveBeenCalledTimes(1)
    expect(segunda).toHaveBeenCalledTimes(1)
    bajaPrimera()
    bajaSegunda()
  })

  it('deja de avisar tras darse de baja', () => {
    const escucha = vi.fn()
    const baja = alCerrarSesionCliente(escucha)
    baja()

    notificarCierreSesionCliente()

    expect(escucha, 'una escucha dada de baja no debe recibir el aviso').not.toHaveBeenCalled()
  })

  it('una escucha que lanza no impide que se ejecuten las demás', () => {
    // Es el caso de `localStorage` no disponible: modo privado, cuota agotada
    // o permisos. Si el primer proveedor revienta, el segundo tiene que
    // vaciarse igual y quien cerró sesión debe salir de verdad.
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rota = vi.fn(() => {
      throw new Error('localStorage no disponible')
    })
    const sana = vi.fn()
    const bajaRota = alCerrarSesionCliente(rota)
    const bajaSana = alCerrarSesionCliente(sana)

    expect(() => notificarCierreSesionCliente(), 'el aviso no debe propagar la excepción').not.toThrow()
    expect(sana, 'la escucha sana debe ejecutarse igualmente').toHaveBeenCalledTimes(1)
    expect(consola, 'el fallo se registra, no se traga en silencio').toHaveBeenCalled()

    bajaRota()
    bajaSana()
    consola.mockRestore()
  })

  it('sin escuchas registradas no falla', () => {
    expect(() => notificarCierreSesionCliente()).not.toThrow()
  })

  it('darse de baja dos veces es inofensivo', () => {
    const escucha = vi.fn()
    const baja = alCerrarSesionCliente(escucha)
    baja()
    expect(() => baja()).not.toThrow()
  })
})
