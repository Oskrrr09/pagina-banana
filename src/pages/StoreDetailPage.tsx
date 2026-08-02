import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useT, useCatalogo } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import {
  currentStoreDay,
  getStore,
  isOpenNow,
  STORE_HOURS_CHECKED_ON,
  STORE_HOURS_NOTICE,
  UNIVERSAL_SERVICES,
} from '../data/stores'
import { allModels } from '../data/products'
import { useStorePreference } from '../lib/storePreference'
import { NotFound } from './NotFound'

// Ficha de una tienda (§4.14).
export function StoreDetailPage() {
  const t = useT()
  const cat = useCatalogo()
  const { slug } = useParams()
  const store = getStore(slug ?? '')
  const [product, setProduct] = useState('')
  // Ojo: este `useState` estaba más abajo, después del `return` de tienda no
  // encontrada. Al navegar de una tienda que existe a una que no, React veía
  // un hook menos y se quejaba. Es la misma clase de fallo que HOOKS-001: los
  // hooks van todos antes de cualquier retorno condicional.
  const [zoom, setZoom] = useState(17)

  if (!store) return <NotFound />

  const today = currentStoreDay()
  const open = isOpenNow(store)
  // Todos los servicios de la tienda: los comunes + los propios (p. ej. técnico).
  const services = [...UNIVERSAL_SERVICES, ...store.services]
  // Búsqueda por nombre real ("Banana Safari", "Banana Mesa y López"…) para
  // que Google Maps resuelva la ubicación exacta del local.
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(store.mapQuery)}&z=${zoom}&output=embed`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.mapQuery)}`

  return (
    <Container className="py-8">
      {/* 1 — Cabecera de tienda con mapa */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[16px] border border-line">
          <iframe
            key={mapSrc}
            title={`Mapa de ${store.name}`}
            src={mapSrc}
            className="block h-[280px] w-full sm:h-[340px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[var(--shadow-raised)]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(20, z + 1))}
              aria-label="Aumentar zoom"
              disabled={zoom >= 20}
              className="grid h-10 w-10 place-items-center text-lg font-bold text-ink transition-colors hover:bg-neutral disabled:cursor-not-allowed disabled:text-muted/50"
            >
              +
            </button>
            <span className="h-px w-full bg-line" />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(3, z - 1))}
              aria-label="Reducir zoom"
              disabled={zoom <= 3}
              className="grid h-10 w-10 place-items-center text-lg font-bold text-ink transition-colors hover:bg-neutral disabled:cursor-not-allowed disabled:text-muted/50"
            >
              −
            </button>
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold text-ink">{store.name}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                open ? 'bg-[#e4f5ea] text-[#2e7a4a]' : 'bg-[#fce8e8] text-[#b13333]'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${open ? 'bg-[#2e9a5a]' : 'bg-[#c14545]'}`} />
              {open ? 'Abierto ahora' : 'Cerrado'}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-muted">
            <Icon name="map-pin" size={16} /> {store.address}
          </p>

          {/* 4 — Cómo llegar + marcar como tu tienda */}
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              <Icon name="map-pin" size={18} /> {t('store.directions')}
            </a>
            <FavoriteStoreControl storeSlug={store.slug} storeName={store.name} />
          </div>

          {/* 3 — Servicios disponibles */}
          <div className="mt-6">
            <p className="mb-2 font-semibold text-ink">{cat('Servicios disponibles')}</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-ink">
                  <Icon name="check" size={16} className="text-available" /> {cat(s)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* 2 — Horario */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
            <Icon name="clock" size={18} /> Horario
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {store.hours.map((h) => {
                const isToday = h.day === today
                return (
                  <tr key={h.day} className={`border-b border-line ${isToday ? 'font-semibold text-ink' : 'text-ink'}`}>
                    <td className="py-2">
                      {h.day}
                      {isToday && <span className="ml-2 rounded-full bg-banana px-2 py-0.5 text-[11px] font-bold text-ink">Hoy</span>}
                    </td>
                    <td className="py-2 text-right text-muted">{h.time}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {cat(STORE_HOURS_NOTICE, { fecha: STORE_HOURS_CHECKED_ON })}{' '}
            <a
              href={store.hoursSource}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-ink underline underline-offset-2"
            >
              {t('store.officialSource')}
            </a>
          </p>
        </div>

        {/* 5 — Consultar stock en esta tienda (menú desplegable) */}
        <div>
          <h2 className="mb-3 font-bold text-ink">{t('store.checkStock')}</h2>
          <label htmlFor="stock-product" className="mb-1.5 block text-sm text-muted">
            {t('stores.chooseProduct')}
          </label>
          <select
            id="stock-product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="field"
          >
            <option value="">Selecciona un producto…</option>
            {allModels.map((m) => (
              <option key={`${m.family}/${m.slug}`} value={m.name}>
                {cat(m.name)}
              </option>
            ))}
          </select>

          {product && (
            <div className="mt-4 flex items-start gap-2 rounded-[12px] border border-line bg-neutral p-4">
              <Icon name="check" size={18} className="mt-0.5 text-available" />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {product} · disponible en {store.name}
                </p>
                <p className="text-xs text-muted">Stock de ejemplo: la consulta es una demostración.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

function FavoriteStoreControl({ storeSlug, storeName }: { storeSlug: string; storeName: string }) {
  const t = useT()
  const { favoriteSlug, setFavorite, clearFavorite } = useStorePreference()
  const isFavorite = favoriteSlug === storeSlug

  if (isFavorite) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-brand bg-brand-050 px-4 py-2 text-sm font-semibold text-ink">
        <Icon name="star" size={16} aria-hidden="true" /> Esta es tu tienda
        <button
          type="button"
          onClick={clearFavorite}
          className="ml-1 text-xs font-semibold text-ink underline underline-offset-2"
        >
          Quitar
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => setFavorite(storeSlug)}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
    >
      <Icon name="star" size={16} aria-hidden="true" /> {t('store.setFavorite')}
      <span className="sr-only"> ({storeName})</span>
    </button>
  )
}
