import { developedFamilies } from '../data/products'

/**
 * A dónde vuelve una pantalla de la aplicación nativa.
 *
 * POR QUÉ EXISTE
 *
 * En iPhone no hay botón de retroceso del sistema, así que las pantallas
 * secundarias necesitan uno propio. Y un botón que sólo hiciera `navigate(-1)`
 * no sirve: a una ficha se puede llegar por un enlace profundo, y entonces no
 * hay nada detrás dentro de la aplicación.
 *
 * Este módulo responde SÓLO a la pregunta semántica —«si esta pantalla se abre
 * en frío, ¿cuál es su sitio de vuelta?»—. Cómo se navega, y si el historial
 * real tiene prioridad sobre esta respuesta, lo decide `useAppBack`.
 *
 * Es una función pura: sin React, sin `window`, sin sesión. Por eso se puede
 * probar entera sin montar nada.
 */

/**
 * Las pantallas que NO llevan control de vuelta.
 *
 * Las cuatro primeras son las raíces de `AppTabBar`. `/login` está aquí porque
 * es el destino de la pestaña «Cuenta» mientras no hay sesión: allí no hay
 * «atrás», hay pestañas. Con sesión no llega a verse, porque `LoginPage`
 * redirige con `replace` antes de pintar.
 *
 * Que `/login` sea raíz por ruta y no por sesión es deliberado: mantiene este
 * módulo puro y evita que el shell dependa del estado de autenticación para
 * decidir qué dibuja.
 */
const RAICES = new Set(['/', '/tienda', '/mis-productos', '/cuenta', '/login'])

/**
 * Pantallas con un sitio de vuelta fijo.
 *
 * El destino no es «la anterior», es el contenedor conceptual de cada una:
 * lo comercial vuelve a Tienda y lo que se llega desde Inicio vuelve a Inicio.
 * `/servicio-tecnico` y `/plan-renove` cuelgan de `/soporte` y `/servicios`
 * porque es desde donde se enlazan.
 */
const ESTATICAS: Record<string, string> = {
  '/accesorios': '/tienda',
  '/buscar': '/tienda',
  '/favoritos': '/tienda',
  '/carrito': '/tienda',
  // El asistente vuelve a Inicio, no a Tienda: se entra desde Inicio y desde
  // el catálogo, y es una herramienta de decisión, no una estantería. Su
  // «Atrás» interno —el del paso anterior— es otra cosa y no se toca.
  '/elige-tu-apple': '/',
  '/tiendas': '/',
  '/soporte': '/',
  '/servicio-tecnico': '/soporte',
  '/servicios': '/',
  '/plan-renove': '/servicios',
}

/** Padres de las rutas de detalle con un solo nivel debajo. */
const DETALLES: Record<string, string> = {
  '/accesorios': '/accesorios',
  '/tiendas': '/tiendas',
}

/**
 * Un destino interno que se puede conservar sin abrir un redirector abierto.
 *
 * Misma semántica que `safeRedirect` de `LoginPage`, escrita aquí en sus tres
 * condiciones en vez de importarla: traerla crearía una dependencia del shell
 * hacia una página, y son tres líneas.
 */
function redirectSeguro(valor: string | null): string | null {
  if (!valor) return null
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.includes('\\')) return null
  return valor
}

/**
 * El sitio de vuelta de una pantalla, o `null` si es una raíz y no lleva
 * control.
 *
 * Recibe `search` además de `pathname` porque dos pantallas cambian de destino
 * según sus parámetros: el comparador conoce su familia y el registro conoce a
 * dónde iba quien se está dando de alta.
 */
export function destinoAtrasApp(pathname: string, search = ''): string | null {
  const ruta = normaliza(pathname)

  if (RAICES.has(ruta)) return null

  // El registro devuelve al acceso, y con él el destino que se traía: quien
  // iba a «Mis productos» y acabó registrándose no debe perderlo por volver.
  if (ruta === '/registro') {
    const destino = redirectSeguro(new URLSearchParams(search).get('redirect'))
    return destino ? `/login?redirect=${encodeURIComponent(destino)}` : '/login'
  }

  // El comparador siempre compara dentro de una familia. Si la URL dice cuál
  // —y es una de verdad—, ahí es donde se estaba mirando.
  if (ruta === '/comparar') {
    const familia = new URLSearchParams(search).get('familia') ?? ''
    return developedFamilies.includes(familia) ? `/${familia}` : '/tienda'
  }

  // Las estáticas se resuelven ANTES que las dinámicas: `/accesorios` es una
  // ruta propia, no la familia `accesorios` del catálogo, que no tiene
  // catálogo desarrollado.
  const estatica = ESTATICAS[ruta]
  if (estatica) return estatica

  const segmentos = ruta.split('/').filter(Boolean)

  // `/accesorios/:slug` y `/tiendas/:slug`.
  if (segmentos.length === 2) {
    const padre = DETALLES[`/${segmentos[0]}`]
    if (padre) return padre
  }

  // Catálogo: `/:family`, `/:family/:model` y `/:family/:model/:variant`.
  //
  // La familia se valida contra el catálogo real, no por la forma de la ruta:
  // `/banana/inventado` no vuelve a `/banana`, porque `/banana` no existe y
  // ofrecerlo sería mandar a otro 404.
  //
  // Una ficha vuelve al catálogo de SU FAMILIA, no a la pantalla del modelo:
  // el catálogo enlaza directamente a la variante, así que ése es el sitio del
  // que se viene cuando hay historial y el que tiene sentido cuando no lo hay.
  // Que el modelo exista o no no cambia la respuesta, así que no se consulta.
  if (segmentos.length >= 1 && segmentos.length <= 3) {
    const familia = segmentos[0]
    if (!developedFamilies.includes(familia)) return '/'
    return segmentos.length === 1 ? '/tienda' : `/${familia}`
  }

  // Cualquier otra cosa es la ruta comodín: se vuelve a Inicio, que es el
  // único destino que siempre existe.
  return '/'
}

/**
 * ¿Hay una pantalla de Banana detrás de la actual?
 *
 * React Router numera sus entradas en `window.history.state.idx` y sube de uno
 * en uno con cada navegación que apila. `idx` en 0 significa que **el router
 * no tiene ninguna entrada anterior apilada en esta sesión de historial**: es
 * el caso de un enlace profundo o una pestaña nueva. Una recarga no lo baja a
 * 0 por sí misma —el navegador conserva `history.state`—, así que si esa
 * entrada ya venía de navegar dentro de la aplicación, su `idx` sigue siendo
 * mayor que 0 y volver atrás sigue siendo correcto.
 *
 * Un `replace` no mueve `idx`, que es justo por lo que `location.key` no vale
 * aquí: una redirección con `replace` sobre la primera entrada le da clave
 * nueva sin que haya aparecido nada detrás.
 *
 * Es un detalle interno del router, así que vive encapsulado aquí y con prueba
 * propia: si una versión futura cambia el supuesto, se pone roja esta pieza y
 * no la aplicación.
 */
export function puedeVolverEnHistorial(state: unknown): boolean {
  if (typeof state !== 'object' || state === null) return false
  const idx = (state as { idx?: unknown }).idx
  return Number.isInteger(idx) && (idx as number) > 0
}

/** Quita la barra final para que `/soporte/` y `/soporte` sean la misma ruta. */
function normaliza(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}
