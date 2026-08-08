import { families } from '../data/products'

// A qué parte de la aplicación pertenece una ruta.
//
// POR QUÉ ESTO EXISTE
//
// Tres cosas necesitan la misma respuesta: qué pestaña se marca activa, si la
// barra superior enseña los chips de categoría, y si enseña el carrito. Antes
// cada una la resolvía por su cuenta con su propio `pathname.startsWith(...)`,
// y bastaba con añadir una ruta para que dijeran cosas distintas de la misma
// pantalla. Aquí se decide una vez y se prueba sin montar nada.

/** Las cuatro secciones de la navegación inferior. */
export type Seccion = 'inicio' | 'tienda' | 'compras' | 'cuenta'

/**
 * Los dos mundos de la aplicación.
 *
 * `comercial` es lo que se puede comprar: catálogo, fichas, búsqueda, carrito.
 * `cliente` es lo que ya es tuyo: tus compras, tu cuenta, tu identidad.
 *
 * La distinción no es decorativa. Los chips de categoría —iPhone, Mac, iPad…—
 * son una herramienta para elegir qué comprar, y encima de «Mis compras» o de
 * «Cuenta» no ayudan a nada: invitan a irse justo cuando alguien ha entrado a
 * mirar lo suyo.
 */
export type Contexto = 'comercial' | 'cliente' | 'neutro'

/** Rutas comerciales que no cuelgan de una familia del catálogo. */
const COMERCIALES = ['/tienda', '/accesorios', '/buscar', '/comparar', '/favoritos', '/carrito', '/elige-tu-apple']

/** Rutas del área de cliente. */
const CLIENTE = ['/mis-productos', '/cuenta', '/login', '/registro']

/**
 * Familias del catálogo, sacadas del propio catálogo.
 *
 * Derivarlas en vez de escribirlas a mano tiene una razón concreta: una familia
 * nueva entra sola. Con una lista escrita aparte, su catálogo se quedaría sin
 * pestaña marcada y sin chips, y nadie lo notaría hasta verlo.
 */
const FAMILIAS = families.map((f) => `/${f.slug}`)

function empiezaPor(pathname: string, rutas: string[]): boolean {
  return rutas.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

/** ¿La ruta pertenece al catálogo o a la compra? */
export function esComercial(pathname: string): boolean {
  return empiezaPor(pathname, COMERCIALES) || empiezaPor(pathname, FAMILIAS)
}

/** ¿La ruta pertenece al área de cliente? */
export function esCliente(pathname: string): boolean {
  return empiezaPor(pathname, CLIENTE)
}

export function contextoDe(pathname: string): Contexto {
  if (esCliente(pathname)) return 'cliente'
  if (esComercial(pathname)) return 'comercial'
  return 'neutro'
}

/**
 * Qué pestaña se marca activa, o `null` si ninguna.
 *
 * Devolver `null` es una respuesta legítima y no un caso olvidado: en soporte,
 * tiendas o servicio técnico ninguna de las cuatro es cierta, y marcar una
 * cualquiera le diría a quien navega que está en un sitio donde no está.
 */
export function seccionActiva(pathname: string): Seccion | null {
  if (pathname === '/') return 'inicio'
  if (empiezaPor(pathname, ['/mis-productos'])) return 'compras'
  if (empiezaPor(pathname, ['/cuenta', '/login', '/registro'])) return 'cuenta'
  if (esComercial(pathname)) return 'tienda'
  // Nada más. Las fichas de producto ya caen arriba, porque cuelgan de la
  // familia. Y no se adivina por la forma de la ruta: `/tiendas/las-arenas`
  // tiene la misma pinta que `/iphone/17-pro` y no es una ficha de nada.
  return null
}

/** ¿Se enseñan los chips de categoría encima del contenido? */
export function muestraChipsDeCategoria(pathname: string): boolean {
  return contextoDe(pathname) === 'comercial'
}

/**
 * ¿Se enseña el carrito en la barra superior?
 *
 * Siempre que la barra exista. El carrito salió de la navegación inferior, y
 * si además desapareciera en media aplicación se habría escondido, que es justo
 * lo que no se quería. La única excepción la pone el propio carrito: dentro de
 * él, el acceso sobra.
 */
export function muestraCarrito(pathname: string): boolean {
  return pathname !== '/carrito'
}
