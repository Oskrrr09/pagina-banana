import type { Model } from '../../data/types'
import { MAX_COMPARE, useStore } from '../../lib/store'
import { variantPath } from '../../data/products'
import { useCatalogo, useIdioma } from '../../lib/i18n'
import { presentacionDeTarjeta } from '../../lib/offers'

/**
 * Todo lo que una tarjeta de producto necesita **saber**, sin decidir nada de
 * cómo se ve.
 *
 * POR QUÉ EXISTE
 *
 * La tarjeta de rejilla se ha separado en dos composiciones —`ProductCardWeb` y
 * `ProductCardApp`— para que rediseñar una plataforma no mueva la otra (D-085).
 * Lo que **no** puede separarse es esto: qué variante se enseña, qué oferta se
 * anuncia, a dónde abre el enlace, qué identidad tiene el favorito y qué entra
 * en el comparador. Si eso se duplicara, las dos tarjetas empezarían a divergir
 * en silencio y una de las dos acabaría mintiendo.
 *
 * Regla de la separación: **comportamiento compartido, JSX independiente.**
 */
export function useTarjetaDeProducto(model: Model) {
  const { t, intl } = useIdioma()
  const cat = useCatalogo()
  const { toggleFavorite, isFavorite, toggleCompare, isComparing, compare } = useStore()

  const nombre = cat(model.name)

  const favId = `${model.family}/${model.slug}`
  const favorito = isFavorite(favId)

  // LA OFERTA SE BUSCA EN TODO EL MODELO, NO EN SU PRIMERA CAPACIDAD
  //
  // Hay modelos rebajados en otra configuración —el MacBook Air M5, por
  // ejemplo—, y mirando sólo la de entrada se quedaban sin marcar. Imagen,
  // precio, precio anterior, porcentaje y enlace salen de la MISMA variante,
  // para no juntar el «desde» de una con el precio anterior —o la foto— de
  // otra. La definición vive en `lib/offers`; aquí no se reimplementa.
  const { oferta, color, capacity } = presentacionDeTarjeta(model)
  const destino = variantPath(model, color, capacity)

  // COMPARAR DESDE EL CATÁLOGO
  //
  // Lo que entra al comparador es **la variante que la tarjeta enseña**, no la
  // de entrada del modelo. Si la tarjeta pinta la configuración rebajada y el
  // comparador recibiera otra, el precio comparado no sería el que se acaba de
  // ver. El identificador es el mismo que usa la ficha —familia/modelo/color/
  // capacidad—, así que añadir aquí y abrir la ficha después no duplica.
  //
  // EL «LLENO» ES POR FAMILIA, NO POR LONGITUD
  //
  // El comparador guarda una familia a la vez: al añadir uno de otra familia,
  // `toggleCompare` empieza una comparación nueva con él. Bloquear el botón
  // mirando sólo `compare.length >= 3` dejaba inservible el catálogo entero:
  // con tres iPhone guardados, TODOS los botones de /mac salían deshabilitados
  // y no había forma de llegar a esa sustitución que el store ya sabe hacer.
  const compareId = `${model.family}/${model.slug}/${color.color}/${capacity.capacity}`
  const comparando = isComparing(compareId)
  const comparadorLleno = compare.length >= MAX_COMPARE && compare[0].family === model.family && !comparando

  const alternarFavorito = () => toggleFavorite(favId)

  const alternarComparar = () =>
    toggleCompare({
      id: compareId,
      modelSlug: model.slug,
      family: model.family,
      name: model.name,
      color: color.name,
      capacity: capacity.capacity,
      price: capacity.price,
      specs: model.specs,
    })

  return {
    t,
    intl,
    cat,
    nombre,
    color,
    capacity,
    oferta,
    destino,
    favorito,
    alternarFavorito,
    comparando,
    comparadorLleno,
    alternarComparar,
    /** Nombre accesible del botón de favorito, según su estado. */
    etiquetaFavorito: favorito ? t('favorites.removeNamed', { nombre }) : t('favorites.addNamed', { nombre }),
    /**
     * El nombre accesible del botón de comparar **no cambia al pulsar**: dice de
     * QUÉ modelo se habla, y el estado lo lleva `aria-pressed`. Si cambiara, un
     * lector de pantalla anunciaría un botón distinto tras cada pulsación.
     */
    etiquetaComparar: t('compare.toggleNamed', { nombre }),
  }
}
