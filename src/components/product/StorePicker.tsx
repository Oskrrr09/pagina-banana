import { Link } from 'react-router-dom'
import { stores } from '../../data/stores'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { StockIndicator } from '../ui/StockIndicator'
import { ProvisionalBadge } from '../ui/Tag'
import type { Availability } from '../../data/types'
import { useStorePreference, sortStoresWithFavoriteFirst } from '../../lib/storePreference'

// Selector de tienda / stock por tienda (flujo B, §6). Modal en escritorio,
// panel deslizante en móvil (lo gestiona <Modal>). Stock de ejemplo.

// Disponibilidad de ejemplo, derivada de forma estable del nombre de la tienda
// y la variante, para que sea consistente entre aperturas.
function fakeAvailability(seed: string): { status: Availability; note?: string } {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff
  const r = h % 3
  if (r === 0) return { status: 'disponible', note: 'Listo para recoger hoy' }
  if (r === 1) return { status: 'bajo-pedido', note: 'Recogida en 2-3 días' }
  return { status: 'agotado' }
}

export function StorePicker({
  open,
  onClose,
  variantLabel,
}: {
  open: boolean
  onClose: () => void
  variantLabel: string
}) {
  const { favoriteSlug } = useStorePreference()
  const ordered = sortStoresWithFavoriteFirst(stores.slice(), favoriteSlug)

  return (
    <Modal open={open} onClose={onClose} title={`Stock por tienda · ${variantLabel}`}>
      <div className="mb-3 flex items-center gap-2">
        <ProvisionalBadge label="Stock de ejemplo" />
      </div>
      <ul className="divide-y divide-line">
        {ordered.map((store) => {
          const av = fakeAvailability(store.slug + variantLabel)
          const isFav = store.slug === favoriteSlug
          return (
            <li key={store.slug} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="flex items-center gap-2 font-semibold text-ink">
                  {store.name}
                  {isFav && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-050 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                      <Icon name="star" size={10} aria-hidden="true" /> Tu tienda
                    </span>
                  )}
                </p>
                <p className="flex items-center gap-1 text-sm text-muted">
                  <Icon name="map-pin" size={14} /> {store.island}
                </p>
                <div className="mt-2">
                  <StockIndicator status={av.status} note={av.note} size="sm" />
                </div>
                {isFav && (
                  <p className="mt-1 text-xs text-muted">Consultar en tu tienda.</p>
                )}
              </div>
              <Link
                to={`/tiendas/${store.slug}`}
                className="shrink-0 text-sm font-semibold text-ink hover:underline"
              >
                Ver tienda ›
              </Link>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
