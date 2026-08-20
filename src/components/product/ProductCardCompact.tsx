import { Link } from 'react-router-dom'
import type { Model } from '../../data/types'
import { euro } from '../../lib/format'
import { useStore } from '../../lib/store'
import { ProductImage } from './ProductImage'
import { Icon } from '../ui/Icon'
import { variantPath } from '../../data/products'
import { useCatalogo, useIdioma } from '../../lib/i18n'
import { presentacionDeTarjeta } from '../../lib/offers'

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
 * La variante sale de `presentacionDeTarjeta`, que recorre el modelo entero.
 * Imagen, precio, precio anterior, porcentaje y enlace se refieren todos a
 * **esa** variante: si la rebaja está en la de 15 pulgadas, la tarjeta enseña su
 * precio y abre esa, no la configuración de entrada.
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
  // Sin oferta, `color` y `capacity` son los de entrada: es lo mismo que hacía
  // antes `variantPath(model)`.
  const { oferta, color, capacity } = presentacionDeTarjeta(model)
  const destino = variantPath(model, color, capacity)

  return (
    // EL PRODUCTO VA ENCIMA DE LA TARJETA, NO DENTRO DE OTRA CAJA
    //
    // Antes había tres marcos concéntricos: el borde de la tarjeta, la caja
    // gris de la imagen y, dentro, el producto con su propio aire. Medido a
    // 390×844: tarjeta de 152, caja de 126 y un iPhone de unos 90 px. El
    // contenedor pesaba más que lo que se vende.
    //
    // Ahora la tarjeta no se dibuja: sólo se separa del fondo con la sombra
    // más discreta del sistema, y la foto ocupa el ancho completo apoyada
    // sobre ella. El borde se retira porque sumado a la sombra volvía a
    // dibujar el contorno que sobra.
    <article className="group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-rest)] sm:w-48">
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
        className="absolute right-0 top-0 z-10 grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:text-danger"
      >
        <Icon name="heart" size={18} className={fav ? 'fill-danger text-danger' : ''} />
      </button>

      {oferta && oferta.descuento > 0 && (
        // Etiqueta, no cartel: cuenta lo mismo ocupando menos que el producto.
        <span className="absolute left-2 top-2 z-10 rounded-full bg-danger px-2 py-0.5 text-[11px] font-extrabold leading-tight text-white">
          -{oferta.descuento}%
        </span>
      )}

      <Link
        to={destino}
        // Respuesta al pulsar, no animación de adorno: la tarjeta cede un 2 %
        // mientras el dedo está encima y vuelve al soltarlo. `transform` no
        // reordena nada, así que no mueve el carril, y con
        // `prefers-reduced-motion` no se aplica.
        className="flex flex-1 flex-col transition-transform duration-100 ease-out focus-visible:outline-none active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        {/* La foto es la del color al que abre el enlace, no la del primero.
            Sin `pad` y sin fondo gris —salvo que la variante traiga el suyo,
            que forma parte de cómo se presenta ese producto—: el recorte de
            estos PNG ya trae su propio aire, así que cualquier relleno extra
            sólo le quita tamaño al aparato sin separar de nada. */}
        <ProductImage
          src={color.image}
          alt={`${cat(model.name)} ${color.name}`}
          bgColor={color.imageBg}
          pad={false}
          className={color.imageBg ? 'rounded-none' : 'rounded-none bg-transparent'}
        />
        <div className="flex flex-1 flex-col px-3 pb-3 pt-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight text-ink">{cat(model.name)}</h3>
          <div className="mt-auto pt-2">
            {oferta ? (
              <>
                {/* Los dos precios son de la MISMA variante: la ofertada. */}
                <span className="block text-lg font-extrabold leading-none text-danger">
                  {euro(oferta.precio, intl)}
                </span>
                <span className="text-xs font-semibold text-muted line-through">
                  {euro(oferta.precioAnterior, intl)}
                </span>
              </>
            ) : (
              <span className="block text-lg font-bold leading-none text-ink">
                {t('common.from', { precio: euro(model.fromPrice, intl) })}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
