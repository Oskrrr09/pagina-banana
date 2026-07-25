import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { ProductCard } from '../components/product/ProductCard'
import { Button, ButtonLink } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { iphoneModels } from '../data/products'
import { euro } from '../lib/format'

// Página de familia iPhone (§4.5): encabezado, modelos, acceso al comparador
// y filtro rápido por precio.
const PRICE_RANGES = [
  { label: 'Todos', min: 0, max: Infinity },
  { label: 'Hasta 900 €', min: 0, max: 900 },
  { label: '900 – 1.300 €', min: 900, max: 1300 },
  { label: 'Más de 1.300 €', min: 1300, max: Infinity },
]

export function FamilyPage() {
  const [range, setRange] = useState(0)

  const filtered = useMemo(() => {
    const r = PRICE_RANGES[range]
    return iphoneModels.filter((m) => m.fromPrice >= r.min && m.fromPrice <= r.max)
  }, [range])

  return (
    <>
      {/* 1 — Encabezado de familia */}
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-8 md:py-12">
          <Breadcrumb items={[{ label: 'Inicio', to: '/' }, { label: 'iPhone' }]} />
          <div className="mt-6 grid items-center gap-8 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">iPhone</h1>
              <p className="mt-3 max-w-md text-lg text-muted">
                El iPhone que buscas, al mejor precio en Canarias. Compara modelos y elige el tuyo.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to="/comparar" variant="secondary">
                  <Icon name="compare" size={18} /> Comparar modelos
                </ButtonLink>
              </div>
            </div>
            <Placeholder label="iPhone" tint="#c8642a" ratio="4 / 3" />
          </div>
        </Container>
      </section>

      <Container className="py-10">
        {/* 4 — Filtro rápido por precio */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon name="filter" size={16} /> Filtrar por precio
            </p>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((r, i) => (
                <Chip key={r.label} selected={range === i} onClick={() => setRange(i)}>
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted">
            {filtered.length} {filtered.length === 1 ? 'modelo' : 'modelos'} · desde{' '}
            {euro(Math.min(...iphoneModels.map((m) => m.fromPrice)))}
          </p>
        </div>

        {/* 2 — Modelos disponibles */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <ProductCard key={m.slug} model={m} />
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-line py-16 text-center text-muted">
            No hay modelos en este rango de precio.
          </div>
        )}

        {/* 3 — Acceso al comparador (repetido al final, como el wireframe) */}
        <div className="mt-10 flex justify-center">
          <Link to="/comparar">
            <Button variant="secondary" size="lg">
              <Icon name="compare" size={18} /> Comparar hasta 3 modelos
            </Button>
          </Link>
        </div>
      </Container>
    </>
  )
}
