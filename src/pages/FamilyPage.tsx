import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { ProductCard } from '../components/product/ProductCard'
import { Button, ButtonLink } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { Icon } from '../components/ui/Icon'
import { getFamilyModels, familyInfo } from '../data/products'
import { euro } from '../lib/format'
import { NotFound } from './NotFound'

// Página de familia genérica (§4.5): encabezado, modelos, acceso al comparador
// y filtro rápido por precio. Sirve para iPhone, Mac, iPad, Watch y AirPods.
const PRICE_RANGES = [
  { label: 'Todos', min: 0, max: Infinity },
  { label: 'Hasta 900 €', min: 0, max: 900 },
  { label: '900 – 1.500 €', min: 900, max: 1500 },
  { label: 'Más de 1.500 €', min: 1500, max: Infinity },
]

export function FamilyPage() {
  const { family: familySlug } = useParams()
  const [range, setRange] = useState(0)

  const family = familyInfo(familySlug ?? '')
  const models = getFamilyModels(familySlug ?? '')

  const filtered = useMemo(() => {
    const r = PRICE_RANGES[range]
    return models.filter((m) => m.fromPrice >= r.min && m.fromPrice <= r.max)
  }, [models, range])

  // Familia inexistente o sin catálogo desarrollado → 404 amable.
  if (!family || models.length === 0) return <NotFound />

  const heroImage = models[0].colors[0].image
  const minPrice = Math.min(...models.map((m) => m.fromPrice))

  return (
    <>
      {/* 1 — Encabezado de familia */}
      <section className="border-b border-line bg-linear-to-b from-banana/25 to-surface">
        <Container className="py-8 md:py-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{family.name}</h1>
              <p className="mt-3 max-w-md text-lg text-muted">{family.tagline}. Compara modelos y elige el tuyo.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to={`/comparar?familia=${family.slug}`} variant="secondary">
                  <Icon name="compare" size={18} /> Comparar modelos
                </ButtonLink>
              </div>
            </div>
            <img
              src={heroImage}
              alt={`Gama ${family.name} en Banana`}
              className="mx-auto w-full max-w-sm rounded-[20px] bg-neutral p-6"
            />
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
            {filtered.length} {filtered.length === 1 ? 'modelo' : 'modelos'} · desde {euro(minPrice)}
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

        {/* 3 — Acceso al comparador */}
        {models.length > 1 && (
          <div className="mt-10 flex justify-center">
            <Link to={`/comparar?familia=${family.slug}`}>
              <Button variant="secondary" size="lg">
                <Icon name="compare" size={18} /> Comparar modelos de {family.name}
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </>
  )
}
