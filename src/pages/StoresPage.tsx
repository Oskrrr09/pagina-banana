import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { Chip } from '../components/ui/Chip'
import { stores, islands, ALL_SERVICES, UNIVERSAL_SERVICES, getTodayHours, isOpenNow } from '../data/stores'

// Página de tiendas (§4.13): mapa, filtros y lista.
export function StoresPage() {
  const [island, setIsland] = useState('Todas')
  const [service, setService] = useState<string | null>(null)
  const [activeStore, setActiveStore] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      stores.filter(
        (s) => (island === 'Todas' || s.island === island) && (!service || s.services.includes(service)),
      ),
    [island, service],
  )

  // URL del mapa. Si hay tienda activa, se centra en ella; si no, en Canarias.
  const focus = activeStore ? stores.find((s) => s.slug === activeStore) : null
  const mapSrc = focus
    ? `https://www.google.com/maps?q=${focus.coords.lat},${focus.coords.lng}(${encodeURIComponent(focus.name)})&z=16&output=embed`
    : 'https://www.google.com/maps?q=Banana+Computer+Canarias&z=8&output=embed'

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-extrabold text-ink">Nuestras tiendas</h1>
      <p className="mt-1 text-muted">Encuentra tu Banana más cercana en Canarias.</p>

      {/* 1 — Mapa interactivo (Google Maps). Al pulsar una tienda de la lista
             se centra el mapa en ella con su nombre como pin. */}
      <div className="mt-6 overflow-hidden rounded-[16px] border border-line">
        <iframe
          key={mapSrc}
          title={focus ? `Mapa de ${focus.name}` : 'Mapa de tiendas Banana Computer en Canarias'}
          src={mapSrc}
          className="block h-[340px] w-full sm:h-[420px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      {focus && (
        <button
          onClick={() => setActiveStore(null)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink"
        >
          <Icon name="chevron-right" className="rotate-180" size={12} />
          Ver todas las tiendas en el mapa
        </button>
      )}

      {/* 2 — Filtros */}
      <div className="mt-6 space-y-3">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Isla</p>
          <div className="flex flex-wrap gap-2">
            {islands.map((i) => (
              <Chip key={i} selected={island === i} onClick={() => setIsland(i)}>
                {i}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Servicio disponible</p>
          <div className="flex flex-wrap gap-2 px-0.5 py-1.5">
            {ALL_SERVICES.map((s) => (
              <Chip key={s} selected={service === s} onClick={() => setService(service === s ? null : s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Servicios comunes a todas las tiendas */}
      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[12px] bg-neutral px-4 py-3 text-sm text-muted">
        <Icon name="check" size={16} className="text-available" />
        <span className="font-semibold text-ink">Todas las tiendas</span> ofrecen{' '}
        {UNIVERSAL_SERVICES.join(' · ')}.
      </p>

      {/* 3 — Lista de tiendas */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {filtered.map((store) => {
          const todayHours = getTodayHours(store)
          const open = isOpenNow(store)
          const isActive = activeStore === store.slug
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.coords.lat},${store.coords.lng}`

          return (
            <div
              key={store.slug}
              className={`group relative flex flex-col rounded-[12px] border bg-surface p-5 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-raised)] ${
                isActive ? 'border-banana ring-2 ring-banana/30' : 'border-line'
              }`}
            >
              <Link to={`/tiendas/${store.slug}`} className="focus-visible:outline-none">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold text-ink group-hover:text-ink">{store.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      open ? 'bg-[#e4f5ea] text-[#2e7a4a]' : 'bg-[#fce8e8] text-[#b13333]'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${open ? 'bg-[#2e9a5a]' : 'bg-[#c14545]'}`} />
                    {open ? 'Abierto ahora' : 'Cerrado'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  <span className="font-semibold text-ink">Hoy:</span> {todayHours?.time ?? 'Consulta el horario'}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <Icon name="map-pin" size={15} /> {store.address}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {store.services.length > 0 ? (
                    store.services.map((s) => (
                      <span key={s} className="rounded-full bg-brand-050 px-2 py-0.5 text-[11px] font-semibold text-ink">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-muted">Servicios comunes de Banana</span>
                  )}
                </div>
              </Link>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStore(isActive ? null : store.slug)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-banana text-ink'
                      : 'bg-neutral text-ink hover:bg-banana/40'
                  }`}
                >
                  <Icon name="map-pin" size={13} />
                  {isActive ? 'Enfocada en el mapa' : 'Ver en el mapa'}
                </button>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-neutral px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-banana/40"
                >
                  <Icon name="arrow-right" size={13} /> Cómo llegar
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 rounded-[12px] border border-dashed border-line py-12 text-center text-muted">
          No hay tiendas que coincidan con estos filtros.
        </p>
      )}
    </Container>
  )
}
