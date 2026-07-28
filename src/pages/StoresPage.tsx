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
  // Zoom del mapa (rango Google Maps: 3–20). Se resetea al cambiar de tienda.
  const [zoom, setZoom] = useState(8)

  const filtered = useMemo(
    () =>
      stores.filter(
        (s) => (island === 'Todas' || s.island === island) && (!service || s.services.includes(service)),
      ),
    [island, service],
  )

  // URL del mapa. Si hay tienda activa, se busca por su nombre real
  // ("Banana Safari", "Banana Mesa y López"…) para que Google Maps
  // resuelva la ubicación exacta del local. Si no, vista general de
  // Canarias con las tiendas Banana Computer.
  const focus = activeStore ? stores.find((s) => s.slug === activeStore) : null
  const mapSrc = focus
    ? `https://www.google.com/maps?q=${encodeURIComponent(focus.name)}&z=${zoom}&output=embed`
    : `https://www.google.com/maps?q=Banana+Computer+Canarias&z=${zoom}&output=embed`

  const setFocus = (slug: string | null) => {
    setActiveStore(slug)
    setZoom(slug ? 17 : 8)
  }
  const zoomIn = () => setZoom((z) => Math.min(20, z + 1))
  const zoomOut = () => setZoom((z) => Math.max(3, z - 1))

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-extrabold text-ink">Nuestras tiendas</h1>
      <p className="mt-1 text-muted">Encuentra tu Banana más cercana en Canarias.</p>

      {/* 1 — Mapa interactivo (Google Maps). Al pulsar una tienda de la lista
             se centra el mapa en ella con su nombre como pin. Botones +/−
             cambian el nivel de zoom recargando el iframe. */}
      <div className="relative mt-6 overflow-hidden rounded-[16px] border border-line">
        <iframe
          key={mapSrc}
          title={focus ? `Mapa de ${focus.name}` : 'Mapa de tiendas Banana Computer en Canarias'}
          src={mapSrc}
          className="block h-[340px] w-full sm:h-[420px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[var(--shadow-raised)]">
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Aumentar zoom"
            disabled={zoom >= 20}
            className="grid h-10 w-10 place-items-center text-lg font-bold text-ink transition-colors hover:bg-neutral disabled:cursor-not-allowed disabled:text-muted/50"
          >
            +
          </button>
          <span className="h-px w-full bg-line" />
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Reducir zoom"
            disabled={zoom <= 3}
            className="grid h-10 w-10 place-items-center text-lg font-bold text-ink transition-colors hover:bg-neutral disabled:cursor-not-allowed disabled:text-muted/50"
          >
            −
          </button>
        </div>
      </div>
      {focus && (
        <button
          onClick={() => setFocus(null)}
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
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.name)}`

          const focusMap = () => {
            setFocus(store.slug)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }

          return (
            <div
              key={store.slug}
              onClick={focusMap}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  focusMap()
                }
              }}
              className={`group relative flex cursor-pointer flex-col rounded-[12px] border bg-surface p-5 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-raised)] ${
                isActive ? 'border-banana ring-2 ring-banana/30' : 'border-line'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-ink">{store.name}</h2>
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
              {isActive && (
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink/70">
                  ● Enfocada en el mapa
                </p>
              )}

              {/* Acciones — cada botón usa stopPropagation para no re-enfocar la tienda ya activa */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3" onClick={(e) => e.stopPropagation()}>
                <Link
                  to={`/tiendas/${store.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink/85"
                >
                  Ver detalles
                </Link>
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
