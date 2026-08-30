import { MAXIMO_RECIENTES, type IdProducto } from './recentlyViewed'

/**
 * Historial de productos vistos **en la aplicación**, separado por identidad.
 *
 * POR QUÉ EXISTE, SI YA HAY UNO
 *
 * `recentlyViewed.ts` guarda el historial bajo una sola clave para todo el
 * dispositivo, y lo hace a propósito: en un navegador, «lo que has mirado» es
 * del navegador, como el idioma o el carrito, y por eso sobrevive al cierre de
 * sesión (D-064).
 *
 * En la app ese razonamiento se rompe. Un teléfono con la aplicación instalada
 * es de alguien, y si esa persona cierra sesión y entra otra, la segunda veía
 * los productos que había mirado la primera. Eso no es un historial de
 * dispositivo: es una fuga entre cuentas.
 *
 * Así que la app usa su propio almacén, con un espacio por identidad. La web no
 * se toca —sigue con D-064— y este módulo no la conoce. Ver D-088.
 *
 * QUÉ SE GUARDA
 *
 * Lo mismo que el otro: sólo `familia/slug`. Ni nombres, ni precios, ni fechas,
 * ni cuántas veces. El orden de la lista es toda la información que hace falta.
 *
 * LOS ESPACIOS NO SE MEZCLAN
 *
 * Anónimo y cuenta son espacios distintos, y entrar en una cuenta **no** arrastra
 * lo que se miró sin ella: quien navega sin identificarse puede no querer que
 * eso quede asociado a su cuenta, y adivinar la intención sería peor que no
 * hacer nada. Volver a la misma cuenta en el mismo teléfono sí recupera lo suyo,
 * porque su espacio sigue estando donde estaba.
 */

const PREFIJO = 'banana:recientes:app'

/** `familia/slug`, la misma identificación que usa el resto del código. */
export type { IdProducto }
export { MAXIMO_RECIENTES }

/**
 * A qué espacio pertenece una identidad.
 *
 * `null` —sin cuenta— tiene el suyo, y no es el de nadie. Las cuentas se
 * separan por el identificador estable que da Supabase, no por el correo: el
 * correo puede cambiar y el identificador no.
 */
export function espacioDe(identidad: string | null | undefined): string {
  return identidad ? `${PREFIJO}:user:${identidad}` : `${PREFIJO}:anon`
}

function esIdValido(valor: unknown): valor is IdProducto {
  // Dos segmentos no vacíos y nada más: filtra la basura y cualquier cosa que
  // alguien hubiera escrito a mano en el almacenamiento.
  return typeof valor === 'string' && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(valor)
}

/**
 * Lee el historial de esa identidad. El más reciente primero.
 *
 * Tolera que no haya nada, que el almacenamiento no esté disponible y que el
 * contenido esté corrupto: devuelve una lista vacía en vez de propagar el
 * fallo. Es un adorno de la portada y no puede tumbar la pantalla.
 */
export function leerRecientesApp(identidad: string | null | undefined): IdProducto[] {
  try {
    if (typeof window === 'undefined') return []
    const bruto = window.localStorage.getItem(espacioDe(identidad))
    if (!bruto) return []
    const datos: unknown = JSON.parse(bruto)
    if (!Array.isArray(datos)) return []
    return datos.filter(esIdValido).slice(0, MAXIMO_RECIENTES)
  } catch {
    return []
  }
}

/**
 * Anota un producto como visto por esa identidad y lo pone el primero.
 *
 * Si ya estaba, se mueve arriba en vez de duplicarse: la lista es «lo último
 * que miraste», no «cuántas veces lo miraste».
 */
export function registrarVistoApp(identidad: string | null | undefined, id: IdProducto): IdProducto[] {
  if (!esIdValido(id)) return leerRecientesApp(identidad)
  const siguiente = [id, ...leerRecientesApp(identidad).filter((otro) => otro !== id)].slice(0, MAXIMO_RECIENTES)
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(espacioDe(identidad), JSON.stringify(siguiente))
  } catch {
    /* almacenamiento no disponible: se devuelve la lista igualmente */
  }
  return siguiente
}

/** Vacía el historial de una identidad concreta. No toca el de las demás. */
export function olvidarRecientesApp(identidad: string | null | undefined): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(espacioDe(identidad))
  } catch {
    /* almacenamiento no disponible */
  }
}
