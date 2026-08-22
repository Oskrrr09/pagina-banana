import { describe, expect, it } from 'vitest'
import { APARTADOS } from '../../src/components/account/apartados'
import {
  contextoDe,
  esCliente,
  esComercial,
  muestraCarrito,
  muestraChipsDeCategoria,
  seccionActiva,
} from '../../src/lib/appSections'

// La clasificación de rutas del shell nativo.
//
// Existe como módulo aparte porque tres sitios necesitan la misma respuesta:
// qué pestaña se marca, si salen los chips de categoría y si sale el carrito.
// Antes cada uno la resolvía con su propio `startsWith` y bastaba una ruta
// nueva para que dijeran cosas distintas de la misma pantalla.

describe('qué pestaña se marca activa', () => {
  it('Inicio sólo en la raíz', () => {
    expect(seccionActiva('/')).toBe('inicio')
    // Que una ruta empiece por barra no la convierte en la portada.
    expect(seccionActiva('/iphone')).not.toBe('inicio')
  })

  it('Tienda en todo lo comercial', () => {
    for (const ruta of [
      '/tienda',
      '/iphone',
      '/mac',
      '/ipad',
      '/apple-watch',
      '/airpods',
      '/accesorios',
      '/buscar',
      '/comparar',
      '/favoritos',
      '/carrito',
    ]) {
      expect(seccionActiva(ruta), ruta).toBe('tienda')
    }
  })

  it('Tienda también en fichas y variantes', () => {
    expect(seccionActiva('/iphone/17-pro')).toBe('tienda')
    expect(seccionActiva('/iphone/17-pro/256gb-plata')).toBe('tienda')
    expect(seccionActiva('/accesorios/cargador-magsafe')).toBe('tienda')
  })

  it('Mis compras en su ruta y en las que cuelguen de ella', () => {
    expect(seccionActiva('/mis-productos')).toBe('compras')
    // Rutas hijas que todavía no existen: el detalle de una compra.
    expect(seccionActiva('/mis-productos/BC-482910')).toBe('compras')
  })

  it('Cuenta incluye identificarse y registrarse', () => {
    expect(seccionActiva('/cuenta')).toBe('cuenta')
    expect(seccionActiva('/login')).toBe('cuenta')
    expect(seccionActiva('/registro')).toBe('cuenta')
  })

  it('en lo ambiguo, ninguna activa', () => {
    // Marcar una cualquiera le diría a quien navega que está en un sitio donde
    // no está. Mejor ninguna que mentir.
    for (const ruta of ['/soporte', '/tiendas', '/tiendas/las-arenas', '/servicio-tecnico', '/plan-renove']) {
      expect(seccionActiva(ruta), ruta).toBeNull()
    }
  })

  it('`/mis-productos` no se confunde con una ficha de producto', () => {
    // La forma `/algo/algo` marca Tienda, pero el área de cliente gana antes.
    expect(seccionActiva('/mis-productos/lo-que-sea')).toBe('compras')
    expect(seccionActiva('/cuenta/direcciones')).toBe('cuenta')
  })

  it('los apartados de la cuenta siguen siendo la pestaña Cuenta', () => {
    // Desde que cada apartado tiene ruta propia esto dejó de ser hipotético:
    // si `seccionActiva` no los reconociera, entrar en un apartado apagaría la
    // pestaña y la barra inferior diría que no estás en ninguna sección.
    for (const { id } of APARTADOS) {
      expect(seccionActiva(`/cuenta/${id}`), id).toBe('cuenta')
    }
  })
})

describe('los dos contextos', () => {
  it('separa comercio de cliente', () => {
    expect(contextoDe('/iphone')).toBe('comercial')
    expect(contextoDe('/carrito')).toBe('comercial')
    expect(contextoDe('/mis-productos')).toBe('cliente')
    expect(contextoDe('/cuenta')).toBe('cliente')
    expect(contextoDe('/soporte')).toBe('neutro')
  })

  it('una ruta no puede ser las dos cosas', () => {
    for (const ruta of ['/', '/iphone', '/mis-productos', '/cuenta', '/soporte', '/carrito']) {
      expect(esComercial(ruta) && esCliente(ruta), ruta).toBe(false)
    }
  })
})

describe('qué enseña la barra superior', () => {
  it('los chips de categoría sólo en el contexto comercial', () => {
    expect(muestraChipsDeCategoria('/tienda')).toBe(true)
    expect(muestraChipsDeCategoria('/iphone')).toBe(true)
    expect(muestraChipsDeCategoria('/carrito')).toBe(true)
  })

  it('nunca encima de Mis compras ni de Cuenta', () => {
    // Son una herramienta para elegir qué comprar. Ahí invitan a irse justo
    // cuando alguien ha entrado a mirar lo suyo.
    for (const ruta of ['/mis-productos', '/cuenta', '/cuenta/pedidos', '/login', '/registro']) {
      expect(muestraChipsDeCategoria(ruta), ruta).toBe(false)
    }
  })

  it('tampoco en Inicio', () => {
    expect(muestraChipsDeCategoria('/')).toBe(false)
  })

  it('el carrito se ve en todas partes menos dentro del carrito', () => {
    for (const ruta of ['/', '/tienda', '/iphone', '/mis-productos', '/cuenta', '/soporte']) {
      expect(muestraCarrito(ruta), ruta).toBe(true)
    }
    expect(muestraCarrito('/carrito')).toBe(false)
  })
})
