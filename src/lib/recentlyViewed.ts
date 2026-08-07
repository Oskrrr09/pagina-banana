// Historial de productos vistos, para «Continúa donde lo dejaste».
//
// QUÉ SE GUARDA, Y QUÉ NO
//
// Sólo `familia/slug` de cada modelo: lo justo para volver a buscarlo en el
// catálogo y reconstruir su tarjeta. Ni nombres, ni precios, ni imágenes —eso
// ya está en `src/data/products/`, y duplicarlo aquí sólo serviría para que se
// quedara viejo—. Tampoco fechas de visita, ni cuántas veces, ni nada que
// dibuje un perfil de navegación: el orden de la lista basta para lo que hace
// falta.
//
// POR QUÉ NO SE BORRA AL CERRAR SESIÓN
//
// Esto es lo contrario de lo que hacen la tienda favorita o los seguimientos de
// disponibilidad, que sí se vacían al cerrar sesión porque pertenecen a la
// CUENTA. El historial de navegación pertenece al DISPOSITIVO: es lo que se ha
// mirado en este navegador, exista o no una sesión, igual que el carrito o el
// idioma. Nunca se sincroniza con Supabase y no forma parte del perfil.
//
// La consecuencia práctica es deliberada: sobrevive al cierre de sesión
// explícito y tiene que sobrevivir también al que venga de otra pestaña o de
// una sesión invalidada, cuando eso se resuelva. No se suscribe al aviso de
// `accountSession.ts` — y no hacerlo es la decisión, no un olvido.
//
// Quien quiera borrarlo tiene el borrado de datos de navegación del propio
// navegador, que es donde la gente espera encontrarlo.
//
// Ver `docs/02-decisiones.md`, D-064.

const CLAVE = 'banana:recientes'

/** Cuántos se conservan. Corto a propósito: es un atajo, no un historial. */
export const MAXIMO_RECIENTES = 8

/** `familia/slug`, que es como se identifica un modelo en el resto del código. */
export type IdProducto = string

function esIdValido(valor: unknown): valor is IdProducto {
  // Dos segmentos no vacíos y nada más. Filtra tanto la basura como cualquier
  // cosa que alguien hubiera metido a mano en el almacenamiento.
  return typeof valor === 'string' && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(valor)
}

/**
 * Lee el historial. Devuelve el más reciente primero.
 *
 * Tolera que no haya nada, que el almacenamiento no esté disponible y que el
 * contenido esté corrupto: en todos esos casos devuelve una lista vacía en vez
 * de propagar el fallo. Es un adorno de la portada; no puede tumbar la página.
 */
export function leerRecientes(): IdProducto[] {
  try {
    if (typeof window === 'undefined') return []
    const bruto = window.localStorage.getItem(CLAVE)
    if (!bruto) return []
    const datos: unknown = JSON.parse(bruto)
    if (!Array.isArray(datos)) return []
    // Se filtra al leer y no sólo al escribir: lo que ya estuviera guardado de
    // una versión anterior, o modificado a mano, no debe llegar a la interfaz.
    return datos.filter(esIdValido).slice(0, MAXIMO_RECIENTES)
  } catch {
    return []
  }
}

/**
 * Anota un producto como visto y lo coloca el primero.
 *
 * Si ya estaba, se mueve arriba en vez de duplicarse: la lista es «lo último
 * que miraste», no «cuántas veces lo miraste».
 */
export function registrarVisto(id: IdProducto): IdProducto[] {
  if (!esIdValido(id)) return leerRecientes()
  const siguiente = [id, ...leerRecientes().filter((otro) => otro !== id)].slice(0, MAXIMO_RECIENTES)
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(CLAVE, JSON.stringify(siguiente))
  } catch {
    /* almacenamiento no disponible: se devuelve la lista igualmente */
  }
  return siguiente
}

/** Vacía el historial. No lo llama la aplicación; existe para las pruebas. */
export function olvidarRecientes(): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(CLAVE)
  } catch {
    /* almacenamiento no disponible */
  }
}
