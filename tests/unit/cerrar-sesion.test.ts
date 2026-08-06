import { describe, expect, it, vi } from 'vitest'
import { cerrarSesionCliente } from '../../src/lib/customerAuth'
import { alCerrarSesionCliente, notificarCierreSesionCliente } from '../../src/lib/accountSession'

// ============================================================================
// El cableado entre cerrar sesión en Supabase y reiniciar las preferencias.
//
// `tests/e2e-prefs` comprueba que los proveedores se vacían cuando llega el
// aviso, pero su botón lo emite a mano: no demuestra que `signOut()` lo emita,
// ni —lo que importa más— que NO lo emita cuando Supabase devuelve error.
//
// Se prueba la función real que usa el proveedor, con las dependencias
// inyectadas. No hay copia de la lógica: es la misma que corre en producción.
// ============================================================================

/** Imita `supabase.auth.signOut()` con el resultado que se quiera. */
function supabaseQueDevuelve(error: { message: string } | null) {
  return vi.fn(async () => ({ error }))
}

describe('cerrarSesionCliente()', () => {
  it('cuando Supabase cierra bien, limpia y no devuelve error', async () => {
    const cerrar = supabaseQueDevuelve(null)
    const limpiar = vi.fn()

    const resultado = await cerrarSesionCliente(cerrar, limpiar)

    expect(cerrar).toHaveBeenCalledTimes(1)
    expect(limpiar, 'la limpieza se ejecuta exactamente una vez').toHaveBeenCalledTimes(1)
    expect(resultado).toEqual({ error: null })
  })

  it('cuando Supabase falla, NO limpia y devuelve el error', async () => {
    // El fallo que motiva todo esto: si el cierre no se completó, la sesión
    // sigue abierta y borrar sus preferencias sería mentir sobre lo ocurrido.
    const cerrar = supabaseQueDevuelve({ message: 'Network request failed' })
    const limpiar = vi.fn()

    const resultado = await cerrarSesionCliente(cerrar, limpiar)

    expect(limpiar, 'no se puede limpiar si la sesión sigue abierta').not.toHaveBeenCalled()
    expect(resultado).toEqual({ error: 'Network request failed' })
  })

  it('emite el aviso a los proveedores una sola vez tras un cierre correcto', async () => {
    const escucha = vi.fn()
    const baja = alCerrarSesionCliente(escucha)

    await cerrarSesionCliente(supabaseQueDevuelve(null), () => notificarCierreSesionCliente())

    expect(escucha).toHaveBeenCalledTimes(1)
    baja()
  })

  it('no emite ningún aviso si el cierre falló', async () => {
    const escucha = vi.fn()
    const baja = alCerrarSesionCliente(escucha)

    const resultado = await cerrarSesionCliente(supabaseQueDevuelve({ message: 'sesión no encontrada' }), () =>
      notificarCierreSesionCliente(),
    )

    expect(escucha, 'las preferencias deben quedarse donde están').not.toHaveBeenCalled()
    expect(resultado.error).toBe('sesión no encontrada')
    baja()
  })

  it('un proveedor que no puede tocar localStorage no bloquea el cierre', async () => {
    // El cierre en Supabase sí fue correcto: aunque el borrado local falle, la
    // llamada tiene que terminar sin error y los demás reinicios ejecutarse.
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rota = vi.fn(() => {
      throw new Error('localStorage no disponible')
    })
    const sana = vi.fn()
    const bajaRota = alCerrarSesionCliente(rota)
    const bajaSana = alCerrarSesionCliente(sana)

    const resultado = await cerrarSesionCliente(supabaseQueDevuelve(null), () => notificarCierreSesionCliente())

    expect(resultado, 'el cierre fue correcto pese al fallo local').toEqual({ error: null })
    expect(sana).toHaveBeenCalledTimes(1)

    bajaRota()
    bajaSana()
    consola.mockRestore()
  })

  it('propaga el error tal cual lo da Supabase, sin inventarse un mensaje', async () => {
    const resultado = await cerrarSesionCliente(supabaseQueDevuelve({ message: 'AuthApiError: 503' }), vi.fn())
    expect(resultado.error).toBe('AuthApiError: 503')
  })
})
