import type { CapacityOption, ColorVariant, Model } from '../data/types'

// Búsqueda de la variante realmente ofertada de un modelo.
//
// POR QUÉ NO VALE MIRAR LA PRIMERA CAPACIDAD
//
// La oferta vive en la variante, no en el modelo: un modelo puede no tener
// rebaja en su configuración de entrada y sí en otra. Pasa hoy mismo en el
// catálogo con el MacBook Air M5, cuya primera capacidad son 1319 € sin rebaja
// mientras que la de 15" · 16 GB · 512 GB está a 1579 € desde 1649 €. Mirar
// sólo `colors[0].capacities[0]` lo dejaba fuera: cinco modelos en oferta de
// los seis que hay.
//
// Y hay una segunda trampa, peor que no encontrarla: si se detecta la oferta
// recorriendo el modelo pero después se pinta el precio «desde» —el de la
// configuración de entrada— junto al precio anterior de OTRA configuración, la
// tarjeta miente. Diría «desde 1319 €, antes 1649 €», dos cifras que no
// pertenecen al mismo producto y un descuento que nadie puede comprar.
//
// Por eso esto devuelve la variante entera. Precio, precio anterior, porcentaje
// y enlace salen todos de aquí, y por construcción hablan de lo mismo.

export interface VarianteOfertada {
  color: ColorVariant
  capacity: CapacityOption
  /** Precio de esa variante. */
  precio: number
  /** Precio anterior de esa misma variante. */
  precioAnterior: number
  /** Porcentaje de rebaja, redondeado, calculado con los dos de arriba. */
  descuento: number
}

/**
 * Devuelve la variante en oferta más ventajosa del modelo, o `null` si no hay
 * ninguna.
 *
 * Cuando hay varias se elige la de mayor porcentaje de rebaja, y a igualdad de
 * porcentaje la primera del catálogo. Es una regla arbitraria pero
 * **determinista**: sin ella, dos secciones de la misma pantalla podrían
 * enseñar rebajas distintas del mismo producto según cómo iterasen.
 */
export function getOfferVariant(model: Model): VarianteOfertada | null {
  let mejor: VarianteOfertada | null = null

  for (const color of model.colors) {
    for (const capacity of color.capacities) {
      const anterior = capacity.previousPrice
      // Una «rebaja» que no baja el precio no es una rebaja.
      if (anterior == null || anterior <= capacity.price) continue

      const descuento = Math.round(((anterior - capacity.price) / anterior) * 100)
      if (!mejor || descuento > mejor.descuento) {
        mejor = { color, capacity, precio: capacity.price, precioAnterior: anterior, descuento }
      }
    }
  }

  return mejor
}

/** ¿Tiene el modelo alguna variante en oferta? */
export function tieneOferta(model: Model): boolean {
  return getOfferVariant(model) !== null
}
