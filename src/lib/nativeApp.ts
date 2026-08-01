/**
 * ¿Estamos dentro del binario nativo (iOS/Android) en vez de en el navegador?
 *
 * Capacitor inyecta `window.Capacitor` en el WebView antes de cargar el
 * bundle, así que se puede resolver una sola vez al arrancar y no cambia
 * durante la vida de la aplicación.
 *
 * Sirve para dar a la app la navegación que espera quien viene de una tienda
 * de aplicaciones —barra inferior, sin pie de página— sin mantener una
 * segunda interfaz: es el mismo código que la web
 * (ver `docs/02-decisiones.md`, D-040 y D-042).
 *
 * En las pruebas E2E se simula con `window.Capacitor = {}` desde un
 * `addInitScript`, que corre antes que el bundle igual que en el WebView.
 */
export const isNativeApp: boolean =
  typeof window !== 'undefined' && Boolean((window as { Capacitor?: unknown }).Capacitor)
