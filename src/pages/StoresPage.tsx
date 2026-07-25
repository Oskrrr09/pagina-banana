import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { Chip } from '../components/ui/Chip'
import { stores, islands, ALL_SERVICES } from '../data/stores'

// Página de tiendas (§4.13): mapa, filtros y lista.
export function StoresPage() {
  const [island, setIsland] = useState('Todas')
  const [service, setService] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      stores.filter(
        (s) => (island === 'Todas' || s.island === island) && (!service || s.services.includes(service)),
      ),
    [island, service],
  )

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-extrabold text-ink">Nuestras tiendas</h1>
      <p className="mt-1 text-muted">Encuentra tu Banana más cercana en Canarias.</p>

      {/* 1 — Mapa */}
      <div className="mt-6">
        <Placeholder label="Mapa de tiendas (interactivo en la web real)" ratio="21 / 9" />
      </div>

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
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            {ALL_SERVICES.map((s) => (
              <Chip key={s} selected={service === s} onClick={() => setService(service === s ? null : s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* 3 — Lista de tiendas */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {filtered.map((store) => (
          <Link
            key={store.slug}
            to={`/tiendas/${store.slug}`}
            className="group flex flex-col rounded-[12px] border border-line bg-surface p-5 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink group-hover:text-brand">{store.name}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  store.openNow ? 'bg-available-050 text-available' : 'bg-neutral text-muted'
                }`}
              >
                {store.openNow ? 'Abierta ahora' : 'Cerrada'}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Icon name="map-pin" size={15} /> {store.address}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {store.services.map((s) => (
                <span key={s} className="rounded-full bg-neutral px-2 py-0.5 text-[11px] font-medium text-muted">
                  {s}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 rounded-[12px] border border-dashed border-line py-12 text-center text-muted">
          No hay tiendas que coincidan con estos filtros.
        </p>
      )}
    </Container>
  )
}
