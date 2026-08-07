import { Link } from 'react-router-dom'
import type { Model } from '../../data/types'
import { euro } from '../../lib/format'
import { useStore } from '../../lib/store'
import { ProductImage } from './ProductImage'
import { Icon } from '../ui/Icon'
import { variantPath } from '../../data/products'
import { useCatalogo, useIdioma } from '../../lib/i18n'
import { getOfferVariant } from '../../lib/offers'

/**
 * Tarjeta de producto para carruseles horizontales de la aplicación.
 *
 * `ProductCard` mide 400 px de alto como mínimo, con hueco reservado para dos
 * líneas de título y dos de descripción. En una rejilla de escritorio eso es lo
 * correcto: alinea las tarjetas y deja respirar. Metida en un carrusel de móvil
 * obliga a elegir entre tarjetas muy estrechas o un bloque que se come la
 * pantalla, y el precio —que es lo que se va a mirar— acaba abajo del todo.
 *
 * Esta versión quita la descripción, sube el precio justo debajo del nombre y
 * deja la imagen como protagonista. Es un componente aparte y no una prop de
 * `ProductCard` a propósito: son dos composiciones distintas, y meterlas en el
 * mismo archivo habría dejado media docena de condicionales repartidos por el
 * marcado.
 *
 * La oferta sale de `getOfferVariant`, que recorre el modelo entero. Precio,
 * precio anterior, porcentaje y enlace se refieren todos a **esa** variante: si
 * la rebaja está en la de 15 pulgadas, la tarjeta enseña su precio y abre esa,
 * no la configuración de entrada.
 *
 * La imagen se deja en carga diferida —`ProductImage` lo hace por defecto sin
 * `priority`—: estos carruseles viven por debajo del pliegue.
 */
export function ProductCardCompact({ model }: { model: Model }) {
  const { t, intl } = useIdioma()
  const cat = useCatalogo()
  const { toggleFavorite, isFavorite } = useStore()

  const favId = `${model.family}/${model.slug}`
  const fav = isFavorite(favId)
  const oferta = getOfferVariant(model)
  // Sin oferta se enlaza la variante de entrada, como cualquier otra tarjeta.
  const destino = oferta ? variantPath(model, oferta.color, oferta.capacity) : variantPath(model)

  return (
    <article className="relative flex w-[9.5rem] shrink-0 flex-col rounded-[12px] border border-line bg-surface p-3 sm:w-44">
      <button
        type="button"
        onClick={() => toggleFavorite(favId)}
        aria-label={
          fav
            ? t('favorites.removeNamed', { nombre: cat(model.name) })
            : t('favorites.addNamed', { nombre: cat(model.name) })
        }
        aria-pressed={fav}
        // 44 px de lado: el mínimo táctil, aunque el icono sea menor.
        className="absolute right-1 top-1 z-10 grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:text-danger"
      >
        <Icon name="heart" size={18} className={fav ? 'fill-danger text-danger' : ''} />
      </button>

      {oferta && oferta.descuento > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-[8px] bg-danger px-1.5 py-1 text-xs font-extrabold leading-none text-white">
          -{oferta.descuento}%
        </span>
      )}

      <Link to={destino} className="flex flex-1 flex-col focus-visible:outline-none">
        <ProductImage
          src={model.colors[0].image}
          alt={`${cat(model.name)} ${model.colors[0].name}`}
          bgColor={model.colors[0].imageBg}
          pad={!model.colors[0].imageBg}
        />
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-tight text-ink">{cat(model.name)}</h3>
        <div className="mt-auto pt-2">
          {oferta ? (
            <>
              {/* Los dos precios son de la MISMA variante: la ofertada. */}
              <span className="block text-base font-extrabold leading-none text-danger">
                {euro(oferta.precio, intl)}
              </span>
              <span className="text-xs font-semibold text-muted line-through">{euro(oferta.precioAnterior, intl)}</span>
            </>
          ) : (
            <span className="block text-base font-bold leading-none text-ink">
              {t('common.from', { precio: euro(model.fromPrice, intl) })}
            </span>
          )}
        </div>
      </Link>
    </article>
  )
}
