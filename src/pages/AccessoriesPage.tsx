import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { conNegritas, useCatalogo, useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ButtonLink } from '../components/ui/Button'
import { AccessoryCard } from '../components/product/AccessoryCard'
import { ACCESSORY_CATEGORIES, appleAccessories, type Accessory, type AccessoryCategory } from '../data/accessories'

// Página general de accesorios oficiales Apple (§4.5). Filtra por
// categoría y por familia de dispositivo compatible. Todos los precios
// son demostrativos; la disponibilidad debe validarse en tienda.

type CompatibilityFilter = 'todas' | 'iphone' | 'ipad' | 'mac' | 'apple-watch' | 'airpods' | 'airtag'

// El `label` de «todas» es el único que se traduce: el resto son nombres de
// producto. Se resuelve al pintar, no aquí, porque aquí no hay contexto de
// idioma.
const COMPAT_OPTIONS: { slug: CompatibilityFilter; label: string }[] = [
  { slug: 'todas', label: 'accessories.all' },
  { slug: 'iphone', label: 'iPhone' },
  { slug: 'ipad', label: 'iPad' },
  { slug: 'mac', label: 'Mac' },
  { slug: 'apple-watch', label: 'Apple Watch' },
  { slug: 'airpods', label: 'AirPods' },
  { slug: 'airtag', label: 'AirTag' },
]

export function AccessoriesPage() {
  const t = useT()
  const cat = useCatalogo()
  const [category, setCategory] = useState<AccessoryCategory | 'todas'>('todas')
  const [compat, setCompat] = useState<CompatibilityFilter>('todas')

  const results = useMemo(() => filter(appleAccessories, category, compat), [category, compat])
  const dirty = category !== 'todas' || compat !== 'todas'

  return (
    <Container className="py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{t('accessories.kicker')}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">{t('accessories.title')}</h1>
        <p className="mt-2 text-muted">{conNegritas(t('accessories.intro'))}</p>
      </header>

      {/* Filtros */}
      <section aria-labelledby="filters" className="mt-8 space-y-4">
        <h2 id="filters" className="sr-only">
          {t('accessories.filters')}
        </h2>
        <FilterGroup
          legend={t('accessories.category')}
          value={category}
          onChange={(v) => setCategory(v as AccessoryCategory | 'todas')}
          options={[
            { slug: 'todas', label: t('accessories.allCategories') },
            ...ACCESSORY_CATEGORIES.map((c) => ({ slug: c.slug, label: cat(c.label) })),
          ]}
        />
        <FilterGroup
          legend={t('accessories.compatibility')}
          value={compat}
          onChange={(v) => setCompat(v as CompatibilityFilter)}
          options={COMPAT_OPTIONS.map((o) => (o.slug === 'todas' ? { ...o, label: t('accessories.all') } : o))}
        />
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setCategory('todas')
              setCompat('todas')
            }}
            className="text-sm font-semibold text-ink underline underline-offset-2"
          >
            {t('accessories.clearFilters')}
          </button>
        )}
      </section>

      {/* Grid */}
      <section aria-labelledby="grid" className="mt-8">
        <h2 id="grid" className="sr-only">
          {t('accessories.results')}
        </h2>
        {results.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-line py-16 text-center">
            <p className="text-lg font-semibold text-ink">{t('accessories.emptyTitle')}</p>
            <p className="mt-2 text-muted">{t('accessories.emptyBody')}</p>
            <button
              type="button"
              onClick={() => {
                setCategory('todas')
                setCompat('todas')
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
            >
              {t('common.allAccessories')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((a) => (
              <AccessoryCard key={a.slug} accessory={a} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="mt-12 rounded-[16px] border border-line bg-neutral p-6">
        <h2 className="text-lg font-bold text-ink">{t('accessories.ctaTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('accessories.ctaBody')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink to="/tiendas" variant="secondary">
            {t('accessories.ctaStores')} <Icon name="chevron-right" size={14} aria-hidden="true" />
          </ButtonLink>
          <ButtonLink to="/soporte" variant="tertiary">
            {t('accessories.ctaSupport')}
          </ButtonLink>
        </div>
      </section>
    </Container>
  )
}

function filter(items: Accessory[], category: AccessoryCategory | 'todas', compat: CompatibilityFilter): Accessory[] {
  return items.filter((a) => {
    if (category !== 'todas' && a.category !== category) return false
    if (compat !== 'todas') {
      const inFamilies = a.compatibility.families?.includes(compat as never)
      const inModels = a.compatibility.models?.some((m) => m.startsWith(`${compat}/`))
      const isAirTag = compat === 'airtag' && a.category === 'airtag'
      if (!inFamilies && !inModels && !isAirTag) return false
    }
    return true
  })
}

function FilterGroup<T extends string>({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string
  value: T
  onChange: (v: T) => void
  options: { slug: T; label: string }[]
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.slug
          return (
            <button
              key={opt.slug}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.slug)}
              className={`inline-flex min-h-[44px] items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? 'border-ink bg-ink text-surface' : 'border-line bg-surface text-ink hover:border-ink/30'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

// Enlace opcional al breadcrumb de Home (para volver rápido).
export function AccessoriesBreadcrumb() {
  return (
    <nav aria-label="Ruta" className="text-sm text-muted">
      <Link to="/" className="hover:text-ink">
        Inicio
      </Link>{' '}
      / <span className="text-ink">Accesorios</span>
    </nav>
  )
}
