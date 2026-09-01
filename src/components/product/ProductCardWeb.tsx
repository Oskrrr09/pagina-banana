import { Link } from 'react-router-dom'
import type { Model } from '../../data/types'
import { euro } from '../../lib/format'
import { ProductImage } from './ProductImage'
import { ProvisionalBadge, OfferBadge } from '../ui/Tag'
import { Icon } from '../ui/Icon'
import { useTarjetaDeProducto } from './useTarjetaDeProducto'

/**
 * Tarjeta de producto de rejilla, **en el navegador** (§6).
 *
 * Resume un modelo para decidir si entrar a la ficha. Precio y disponibilidad
 * en texto, no sólo en color. Favorito con estado.
 *
 * POR QUÉ HAY DOS TARJETAS
 *
 * Hasta esta entrega había una sola, montada por la web y por la app. Con eso,
 * cualquier retoque pensado para el catálogo nativo —altura, marco, imagen,
 * precio, distintivos, espaciado— cambiaba también la web sin que nadie lo
 * pidiera. Es el mismo acoplamiento que `FamilyPage` tenía antes de la PR #86 y
 * que D-085 prohíbe.
 *
 * Ahora cada plataforma tiene la suya, y **ambas nacen idénticas a lo que su
 * plataforma enseñaba**: esta entrega construye la puerta, no la cruza. Lo que
 * las dos siguen compartiendo es el comportamiento, en
 * `useTarjetaDeProducto`: variante enseñada, oferta, destino, favorito y
 * comparación se definen una sola vez.
 */
export function ProductCardWeb({
  model,
  loading = false,
  priority = false,
}: {
  model: Model
  loading?: boolean
  /**
   * `true` sólo para la primera tarjeta que vive sobre el pliegue. El resto
   * sigue en carga diferida.
   */
  priority?: boolean
}) {
  const { t, intl, cat, nombre, color, oferta, destino, favorito, alternarFavorito, etiquetaFavorito } =
    useTarjetaDeProducto(model)

  if (loading) {
    return (
      <div className="rounded-[12px] border border-line p-4">
        <div className="skeleton aspect-square w-full rounded-[12px]" />
        <div className="skeleton mt-4 h-4 w-2/3 rounded" />
        <div className="skeleton mt-2 h-5 w-1/3 rounded" />
      </div>
    )
  }

  return (
    <div
      data-product-card
      data-product-card-surface="web"
      className="group relative flex h-full min-h-[400px] flex-col rounded-[12px] border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-banana hover:shadow-[var(--shadow-raised)]"
    >
      {/* LO QUE SE VE Y LO QUE SE PULSA, SEPARADOS
          Antes de la adaptación nativa este botón era un disco de 36 px a 20 px
          del borde. `f3143d85` lo llevó a 44 y a 12 px por una necesidad de la
          app, sobre la tarjeta que entonces era única.
          Aquí vuelve su aspecto —36 px, a 20 del borde— sin devolver el área
          pulsable a 36: en la web móvil eso está por debajo del mínimo táctil y
          perderlo sería una regresión de accesibilidad de verdad, no fidelidad.
          Así que el BOTÓN es la caja de 44 y el DISCO vive centrado dentro: 44
          menos 36 son 8, cuatro por lado, así que con la caja a 16 px del borde
          el disco queda a los 20 de siempre.
          Sin `isNativeApp`, sin medir anchos en JS y sin media queries: es la
          misma geometría en todos los anchos. */}
      <button
        onClick={alternarFavorito}
        aria-label={etiquetaFavorito}
        aria-pressed={favorito}
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center text-muted transition-colors hover:text-danger"
      >
        <span data-fav-superficie className="grid h-9 w-9 place-items-center rounded-full bg-surface/80 backdrop-blur">
          <Icon name="heart" className={favorito ? 'fill-danger text-danger' : ''} />
        </span>
      </button>

      {oferta && (
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          {oferta.descuento > 0 && (
            <span className="rounded-[10px] bg-danger px-2.5 py-1.5 text-sm font-extrabold leading-none text-white shadow-[var(--shadow-rest)]">
              -{oferta.descuento}%
            </span>
          )}
          <OfferBadge>{t('common.offer')}</OfferBadge>
        </div>
      )}

      <Link to={destino} className="block focus-visible:outline-none">
        <ProductImage
          src={color.image}
          alt={`${nombre} ${color.name}`}
          bgColor={color.imageBg}
          pad={!color.imageBg}
          priority={priority}
        />
        <h3 className="mt-4 min-h-10 text-[15px] font-semibold text-ink group-hover:text-ink">{nombre}</h3>
      </Link>

      <p className="mt-1 min-h-10 line-clamp-2 text-sm text-muted">{cat(model.tagline)}</p>

      <div className="mt-auto pt-3">
        {oferta ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold leading-none text-danger">{euro(oferta.precio, intl)}</span>
            <span className="text-sm font-semibold text-muted line-through decoration-2">
              {euro(oferta.precioAnterior, intl)}
            </span>
          </div>
        ) : (
          <span className="text-lg font-bold text-ink">
            {t('common.from', { precio: euro(model.fromPrice, intl) })}
          </span>
        )}
      </div>
      <div className="mt-2">
        <ProvisionalBadge label={t('common.demoPrice')} />
      </div>

      {/* AQUÍ TERMINABA LA TARJETA ANTES DE LA APP, Y AQUÍ VUELVE A TERMINAR
          `f3143d85` le añadió un «Añadir a comparar» a todo el ancho por una
          necesidad del catálogo nativo. En la web el comparador se alimenta de
          donde se alimentaba: la ficha de modelo, el selector de `/comparar` y
          los enlaces del propio listado. La capacidad de comparar no se toca:
          `useTarjetaDeProducto` la sigue exponiendo y `ProductCardApp` la sigue
          usando. */}
    </div>
  )
}
