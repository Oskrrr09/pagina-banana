/**
 * ¿Estamos dentro del binario nativo (iOS/Android) en vez de en el navegador?
 *
 * Capacitor inyecta `window.Capacitor` en el WebView antes de cargar el
 * bundle, así que se puede resolver una sola vez al arrancar y no cambia
 * durante la vida de la aplicación.
 *
 * Sirve para dar a la app la navegación que espera quien viene de una tienda de
 * aplicaciones —barra inferior, sin pie de página—.
 *
 * QUÉ SIGNIFICA «EL MISMO CÓDIGO QUE LA WEB»
 *
 * Este comentario decía que la app se resolvía «sin mantener una segunda
 * interfaz», y esa frase se quedó ambigua. Web y app comparten **repositorio,
 * build y dominio** —datos, tipos, precios, ofertas, rutas y estado—, y eso no
 * cambia. Lo que sí puede diverger es la **composición**: `isNativeApp` permite
 * elegir, en fronteras explícitas y contadas, la estructura que cada plataforma
 * necesita. Hoy lo hacen `Home`, `FamilyPage`, `SearchPage` al escoger tarjeta,
 * y el armazón.
 *
 * La regla es de D-085: si cambiar una plataforma puede mover la otra por
 * accidente, la frontera está mal puesta. Ver `docs/02-decisiones.md`, D-040,
 * D-042 y D-085.
 *
 * No se consulta suelto por dentro de los componentes: se decide en la frontera
 * y lo que hay debajo ya no vuelve a preguntar.
 *
 * En las pruebas E2E se simula con `window.Capacitor = {}` desde un
 * `addInitScript`, que corre antes que el bundle igual que en el WebView.
 */
export const isNativeApp: boolean =
  typeof window !== 'undefined' && Boolean((window as { Capacitor?: unknown }).Capacitor)
