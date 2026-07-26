import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { ProductCard } from '../components/product/ProductCard'
import { Button, ButtonLink } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { OfferBadge, ProvisionalBadge } from '../components/ui/Tag'
import { getFamilyModels, familyInfo, variantPath } from '../data/products'
import type { Family, Model } from '../data/types'
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

  if (family.slug === 'iphone' || family.slug === 'mac') {
    return <ShowcaseFamilyPage family={family} models={models} />
  }

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

function ShowcaseFamilyPage({ family, models }: { family: Family; models: Model[] }) {
  const offerModels = models.filter((model) =>
    model.colors.some((color) => color.capacities.some((capacity) => capacity.previousPrice != null)),
  )

  return (
    <>
      <section className="border-b border-line bg-neutral">
        <Container className="py-8 md:py-12">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">Catálogo Banana</p>
            <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">
              Comprar un {family.name}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              Elige un modelo y entra directamente en su configuración de color y capacidad.
            </p>
          </div>

          <nav aria-label={`Modelos de ${family.name}`} className="mt-8 overflow-x-auto pb-2 no-scrollbar">
            <ul className="mx-auto flex w-max min-w-full justify-start gap-3 md:justify-center">
              {models.map((model) => (
                <li key={model.slug} className="w-32 shrink-0 sm:w-36">
                  <Link
                    to={variantPath(model)}
                    className="group flex min-h-40 flex-col items-center rounded-[16px] border border-transparent px-3 py-3 text-center transition-[background-color,border-color,transform] hover:-translate-y-1 hover:border-line hover:bg-surface"
                  >
                    <span className="grid h-24 w-full place-items-center overflow-hidden rounded-[12px] bg-surface">
                      <img
                        src={model.colors[0].image}
                        alt=""
                        className="block h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="mt-2 text-sm font-semibold leading-tight text-ink">{model.name}</span>
                    <span className="mt-1 text-xs text-muted">desde {euro(model.fromPrice)}</span>
                  </Link>
                </li>
              ))}
              <li className="w-32 shrink-0 sm:w-36">
                <Link
                  to={`/comparar?familia=${family.slug}`}
                  className="group flex min-h-40 flex-col items-center justify-center rounded-[16px] border border-line bg-surface px-3 py-3 text-center transition-transform hover:-translate-y-1"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-[16px] bg-neutral text-ink">
                    <Icon name="compare" size={28} />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-ink">Comparar {family.name}</span>
                </Link>
              </li>
            </ul>
          </nav>
        </Container>
      </section>

      <section className="bg-[linear-gradient(135deg,#d9f1ff_0%,#eee7fa_48%,#ffe5b8_100%)] py-12 md:py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-danger">Oportunidades</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-5xl">
              Ofertas destacadas en {family.name}
            </h2>
            <p className="mt-3 text-muted">
              Precios demostrativos pendientes de validación con Banana Computer.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2">
            {(offerModels.length > 0 ? offerModels : models.slice(0, 4)).map((model) => {
              const firstColor = model.colors[0]
              const offer =
                firstColor.capacities.find((capacity) => capacity.previousPrice != null) ??
                firstColor.capacities[0]

              return (
                <Link
                  key={model.slug}
                  to={variantPath(model, firstColor, offer)}
                  className="group relative overflow-hidden rounded-[20px] border border-line bg-surface/55 p-6 shadow-[var(--shadow-rest)] backdrop-blur-sm transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <OfferBadge>Oferta</OfferBadge>
                      <h3 className="mt-3 text-2xl font-extrabold text-ink">{model.name}</h3>
                      <p className="mt-1 text-sm text-muted">{model.tagline}</p>
                    </div>
                    <Icon name="arrow-right" className="shrink-0 text-ink transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-5 grid items-end gap-4 sm:grid-cols-[1fr_1.2fr]">
                    <div>
                      {offer.previousPrice && (
                        <p className="text-sm text-muted line-through">{euro(offer.previousPrice)}</p>
                      )}
                      <p className="text-3xl font-extrabold text-danger">{euro(offer.price)}</p>
                      <div className="mt-2">
                        <ProvisionalBadge label="Precio demostrativo" />
                      </div>
                    </div>
                    <ProductImage
                      src={firstColor.image}
                      alt={`${model.name} ${firstColor.name}`}
                      ratio="4 / 3"
                    />
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <ButtonLink to={`/comparar?familia=${family.slug}`} variant="secondary" size="lg">
              <Icon name="compare" size={18} /> Comparar modelos de {family.name}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}
