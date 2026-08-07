import { Link } from 'react-router-dom'
import type { Model } from '../../data/types'
import { euro } from '../../lib/format'
import { useStore } from '../../lib/store'
import { ProductImage } from './ProductImage'
import { ProvisionalBadge, OfferBadge } from '../ui/Tag'
import { Icon } from '../ui/Icon'
import { variantPath } from '../../data/products'
import { useCatalogo, useIdioma } from '../../lib/i18n'
import { presentacionDeTarjeta } from '../../lib/offers'

// Tarjeta de producto (§6): resume un modelo para decidir si entrar a la ficha.
// Precio y disponibilidad en texto, no solo en color. Favorito con estado.
export function ProductCard({ model, loading = false }: { model: Model; loading?: boolean }) {
  const { t, intl } = useIdioma()
  const cat = useCatalogo()
  const { toggleFavorite, isFavorite } = useStore()
  const favId = `${model.family}/${model.slug}`
  const fav = isFavorite(favId)
  // La oferta se busca en todo el modelo, no sólo en su primera capacidad:
  // hay modelos rebajados en otra configuración —el MacBook Air M5, por
  // ejemplo—, y mirando sólo la de entrada se quedaban sin marcar. Imagen,
  // precio, precio anterior, porcentaje y enlace salen de la MISMA variante,
  // para no juntar el «desde» de una con el precio anterior —o la foto— de otra.
  const { oferta, color, capacity } = presentacionDeTarjeta(model)
  const destino = variantPath(model, color, capacity)

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
    <div className="group relative flex h-full min-h-[400px] flex-col rounded-[12px] border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-banana hover:shadow-[var(--shadow-raised)]">
      <button
        onClick={() => toggleFavorite(favId)}
        aria-label={
          fav
            ? t('favorites.removeNamed', { nombre: cat(model.name) })
            : t('favorites.addNamed', { nombre: cat(model.name) })
        }
        aria-pressed={fav}
        className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-surface/80 text-muted backdrop-blur transition-colors hover:text-danger"
      >
        <Icon name="heart" className={fav ? 'fill-danger text-danger' : ''} />
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
          alt={`${cat(model.name)} ${color.name}`}
          bgColor={color.imageBg}
          pad={!color.imageBg}
        />
        <h3 className="mt-4 min-h-10 text-[15px] font-semibold text-ink group-hover:text-ink">{cat(model.name)}</h3>
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
    </div>
  )
}
