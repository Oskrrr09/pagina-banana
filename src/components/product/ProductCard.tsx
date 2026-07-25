import { Link } from 'react-router-dom'
import type { Model } from '../../data/types'
import { euro } from '../../lib/format'
import { useStore } from '../../lib/store'
import { Placeholder } from '../ui/Placeholder'
import { ProvisionalBadge, OfferBadge } from '../ui/Tag'
import { Icon } from '../ui/Icon'

// Tarjeta de producto (§6): resume un modelo para decidir si entrar a la ficha.
// Precio y disponibilidad en texto, no solo en color. Favorito con estado.
export function ProductCard({ model, loading = false }: { model: Model; loading?: boolean }) {
  const { toggleFavorite, isFavorite } = useStore()
  const favId = `${model.family}/${model.slug}`
  const fav = isFavorite(favId)
  const firstCap = model.colors[0].capacities[0]
  const hasOffer = firstCap.previousPrice != null

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
    <div className="group relative flex flex-col rounded-[12px] border border-line bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]">
      <button
        onClick={() => toggleFavorite(favId)}
        aria-label={fav ? `Quitar ${model.name} de favoritos` : `Añadir ${model.name} a favoritos`}
        aria-pressed={fav}
        className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-surface/80 text-muted backdrop-blur transition-colors hover:text-danger"
      >
        <Icon name="heart" className={fav ? 'fill-danger text-danger' : ''} />
      </button>

      {hasOffer && (
        <div className="absolute left-5 top-5 z-10">
          <OfferBadge>Oferta</OfferBadge>
        </div>
      )}

      <Link to={`/${model.family}/${model.slug}`} className="block focus-visible:outline-none">
        <Placeholder label={model.name} tint={model.colors[0].hex} />
        <h3 className="mt-4 text-[15px] font-semibold text-ink group-hover:text-brand">{model.name}</h3>
      </Link>

      <p className="mt-1 line-clamp-2 text-sm text-muted">{model.tagline}</p>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-lg font-bold text-ink">desde {euro(model.fromPrice)}</span>
        {hasOffer && firstCap.previousPrice && (
          <span className="pb-0.5 text-sm text-muted line-through">{euro(firstCap.previousPrice)}</span>
        )}
      </div>
      <div className="mt-2">
        <ProvisionalBadge label="Precio demostrativo" />
      </div>
    </div>
  )
}
