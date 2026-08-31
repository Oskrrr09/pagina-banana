import type { CompareItem } from './store'

// ============================================================================
// LO QUE HAY GUARDADO EN `banana:compare` NO SIEMPRE ES UNA COMPARACIÓN.
//
// `usePersistent` envuelve `JSON.parse` en try/catch, así que la clave ausente
// y el JSON roto están cubiertos. Lo que no estaba cubierto es la FORMA de lo
// que sale del parseo, y el daño no se quedaba en el comparador: `Header` y
// `useTarjetaDeProducto` leen `compare.length`, y no hay `ErrorBoundary` en el
// proyecto, así que una excepción al pintar se lleva la aplicación entera.
// Medido antes de esta guarda:
//
//   null              → EN BLANCO en `/`, `/iphone`, `/carrito` y `/comparar`
//   {"a":1}           → EN BLANCO en `/comparar`, `/iphone` y `/`
//   ["iphone/17-pro"] → EN BLANCO en `/comparar`
//
// Por la interfaz no se llega a ninguna de esas formas: la aplicación sólo
// escribe listas bien formadas. Se llega por una evolución del esquema, por
// una vuelta atrás a un bundle anterior o por manipulación externa.
//
// QUÉ SE EXIGE, Y POR QUÉ NO MÁS
//
// Sólo lo que el dominio necesita para operar:
//
//   `id`        identidad para alternar, quitar y sustituir
//   `modelSlug` con él se resuelve el modelo VIVO del catálogo
//   `family`    la restricción de familia única (`compare[0].family`)
//
// El resto NO se exige a propósito. `name`, `color`, `capacity` y `price` son
// datos de presentación que la pantalla ya tolera ausentes —lo comprobamos: un
// elemento con sólo esos tres campos se pinta sin romper—, y `specs` ni
// siquiera se lee de lo guardado: la tabla la construye `productDecisionData`
// a partir del modelo del catálogo. Una validación estricta habría tirado
// comparaciones que hoy funcionan, que es peor que el problema que resuelve.
//
// Tampoco se comprueba que `modelSlug` exista en el catálogo: eso ya lo
// resuelve `ComparePage`, que se salta los que no encuentra. Aquí sólo se
// garantiza que la ESTRUCTURA es operable.
//
// Esto no cambia el formato persistido ni introduce versión de esquema: la
// primera escritura legítima vuelve a dejar una lista válida.
// ============================================================================

/** ¿Este valor sirve como elemento de la comparación? */
function esComparable(valor: unknown): valor is CompareItem {
  if (typeof valor !== 'object' || valor === null) return false
  const c = valor as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    c.id.length > 0 &&
    typeof c.modelSlug === 'string' &&
    c.modelSlug.length > 0 &&
    typeof c.family === 'string' &&
    c.family.length > 0
  )
}

/**
 * Devuelve siempre una lista utilizable. Nunca lanza.
 *
 * Lo que no es una lista se convierte en comparación vacía; dentro de una
 * lista, los elementos inservibles se descartan uno a uno y los legítimos se
 * conservan **tal cual**, sin recortar campos.
 */
export function normalizarComparacion(valor: unknown): CompareItem[] {
  try {
    if (!Array.isArray(valor)) return []
    return valor.filter(esComparable)
  } catch {
    // Un objeto con un getter que lanza no puede tirar la aplicación.
    return []
  }
}
