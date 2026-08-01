import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCatalogo, useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ProductCard } from '../components/product/ProductCard'
import { ButtonLink } from '../components/ui/Button'
import { families, allModels, modelsByFamily } from '../data/products'
import { searchCatalog, type SearchResults } from '../lib/catalogSearch'
import type { SearchItem } from '../data/searchIndex'
import { CompactSearchCard, SearchSectionHeading } from '../components/search/SearchResultCards'
import { AccessoryCard } from '../components/product/AccessoryCard'
import { getAccessory } from '../data/accessories'

// Resultados del buscador (§4.4bis). Usa `searchCatalog` — el mismo motor
// determinista y agrupado que el autocompletado del Header. Sincroniza el
// input con `q` en la URL.
export function SearchPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [input, setInput] = useState(q)
  useEffect(() => setInput(q), [q])

  const results = useMemo<SearchResults>(() => searchCatalog(q), [q])

  const hasQuery = q.trim().length > 0
  const nothing = hasQuery && results.total === 0

  return (
    <Container className="py-10">
      <h1 className="sr-only">Buscar en Banana Computer</h1>
      {/* 1 — Campo de búsqueda */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setParams(input.trim() ? { q: input.trim() } : {})
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-line bg-neutral px-5 py-3.5">
          <Icon name="search" className="text-muted" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar productos, categorías, ayuda…"
            aria-label="Buscar en el catálogo"
            data-testid="search-input"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>
      </form>

      {hasQuery && (
        <p className="mt-4 text-sm text-muted">
          {t('search.resultsFor')} <span className="font-semibold text-ink">“{q}”</span>
        </p>
      )}

      {/* 3 — Sugerencia de corrección */}
      {hasQuery && results.correction && (
        <p className="mt-3 rounded-[12px] border border-line bg-neutral px-4 py-2 text-sm text-ink">
          Quizá querías decir{' '}
          <button
            type="button"
            className="font-semibold text-ink underline underline-offset-2"
            onClick={() => setParams({ q: results.correction as string })}
          >
            {results.correction}
          </button>
        </p>
      )}

      {nothing ? <EmptyState query={q} /> : <ResultsSections results={results} />}
    </Container>
  )
}

function ResultsSections({ results }: { results: SearchResults }) {
  const cat = useCatalogo()
  const { exactMatch, appleDevices, relatedProducts, appleAccessories, compatibleAccessories, services, help, intent } = results

  const devicesBlock = appleDevices.length > 0 && (
    <section key="devices" className="mt-10" aria-labelledby="search-devices">
      <SearchSectionHeading title="Dispositivos Apple" count={appleDevices.length} />
      <DeviceGrid items={appleDevices} />
    </section>
  )
  const relatedBlock = relatedProducts.length > 0 && (
    <section key="related" className="mt-10" aria-labelledby="search-related">
      <SearchSectionHeading title="Productos relacionados" count={relatedProducts.length} />
      <CompactGrid items={relatedProducts} />
    </section>
  )
  const appleAccBlock = appleAccessories.length > 0 && (
    <section key="apple-acc" className="mt-10" aria-labelledby="search-apple-acc">
      <SearchSectionHeading title="Accesorios Apple" count={appleAccessories.length} />
      <AccessoryVisualGrid items={appleAccessories} />
    </section>
  )
  const compatBlock = compatibleAccessories.length > 0 && (
    <section key="compat" className="mt-10" aria-labelledby="search-compat-acc">
      <SearchSectionHeading title="Accesorios compatibles" count={compatibleAccessories.length} />
      <CompactGrid items={compatibleAccessories} />
    </section>
  )

  // Orden por intención (§4.4bis):
  //   - device (por defecto): Dispositivos → Relacionados → Acc Apple → Acc compatibles.
  //   - accessory: Acc Apple → Acc compatibles → Dispositivos → Relacionados.
  const ordered =
    intent === 'accessory'
      ? [appleAccBlock, compatBlock, devicesBlock, relatedBlock]
      : [devicesBlock, relatedBlock, appleAccBlock, compatBlock]

  return (
    <>
      {exactMatch && (
        <section className="mt-8" aria-labelledby="search-exact">
          <SearchSectionHeading title="Coincidencia principal" />
          <ExactMatchCard item={exactMatch} />
        </section>
      )}

      {ordered}

      {services.length > 0 && (
        <section className="mt-10" aria-labelledby="search-services">
          <SearchSectionHeading title="Servicios" count={services.length} />
          <ul className="space-y-1">
            {services.map((s) => (
              <li key={s.id}>
                <Link
                  to={s.route ?? '/servicios'}
                  className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-ink hover:bg-neutral"
                >
                  <Icon name="chevron-right" size={16} className="text-muted" />
                  <span>{s.name}</span>
                  {s.description && (
                    <span className="text-sm text-muted">— {cat(s.description)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {help.length > 0 && (
        <section className="mt-10" aria-labelledby="search-help">
          <SearchSectionHeading title="Ayuda" count={help.length} />
          <ul className="divide-y divide-line border-y border-line">
            {help.map((h) => (
              <li key={h.id} className="py-3">
                <Link to={h.route ?? '/soporte'} className="font-medium text-ink hover:text-ink">
                  {h.name}
                </Link>
                {h.description && <p className="mt-0.5 text-sm text-muted">{cat(h.description)}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function ExactMatchCard({ item }: { item: SearchItem }) {
  const cat = useCatalogo()
  const t = useT()
  // Familias y dispositivos usan tarjeta enriquecida cuando existe modelo real.
  if (item.kind === 'apple-device') {
    const model = allModels.find((m) => `device:${m.family}/${m.slug}` === item.id)
    if (model) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 md:max-w-3xl">
          <ProductCard model={model} />
        </div>
      )
    }
  }
  if (item.kind === 'apple-family' && item.route) {
    return (
      <Link
        to={item.route}
        className="block rounded-[16px] border border-line bg-surface p-5 hover:border-ink/30"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Familia Apple</p>
        <p className="mt-1 text-xl font-extrabold text-ink">{item.name}</p>
        {item.description && <p className="mt-1 text-sm text-muted">{cat(item.description)}</p>}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink">
          {t('common.allModels')} <Icon name="chevron-right" size={14} />
        </span>
      </Link>
    )
  }
  if (item.kind === 'apple-accessory' && !item.demo) {
    const slug = item.route?.split('/').pop() ?? ''
    const accessory = getAccessory(slug)
    if (accessory) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 md:max-w-2xl">
          <AccessoryCard accessory={accessory} />
        </div>
      )
    }
  }
  return <CompactSearchCard item={item} />
}

function DeviceGrid({ items }: { items: SearchItem[] }) {
  const cat = useCatalogo()
  const t = useT()
  // Dispositivos Apple: si la entrada es familia, tarjeta destacada; si es
  // modelo real, ProductCard.
  const cards: JSX.Element[] = []
  for (const item of items) {
    if (item.kind === 'apple-family' && item.route) {
      cards.push(
        <Link
          key={item.id}
          to={item.route}
          className="block rounded-[16px] border border-line bg-surface p-5 hover:border-ink/30"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Familia Apple</p>
          <p className="mt-1 text-xl font-extrabold text-ink">{item.name}</p>
          {item.description && <p className="mt-1 text-sm text-muted">{cat(item.description)}</p>}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink">
            {t('common.allModels')} <Icon name="chevron-right" size={14} />
          </span>
        </Link>,
      )
      continue
    }
    if (item.kind === 'apple-device') {
      const model = allModels.find((m) => `device:${m.family}/${m.slug}` === item.id)
      if (model) {
        cards.push(<ProductCard key={item.id} model={model} />)
        continue
      }
    }
    cards.push(<CompactSearchCard key={item.id} item={item} />)
  }
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>
}

function CompactGrid({ items }: { items: SearchItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <CompactSearchCard key={i.id} item={i} />
      ))}
    </div>
  )
}

/**
 * Grid visual para accesorios Apple del catálogo real. Cada ítem se
 * pinta con la MISMA `AccessoryCard` del catálogo (§4.5) para que la
 * jerarquía visual coincida con `ProductCard`. Los demostrativos caen
 * en la tarjeta compacta como fallback.
 */
function AccessoryVisualGrid({ items }: { items: SearchItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => {
        if (i.demo) return <CompactSearchCard key={i.id} item={i} />
        const slug = i.route?.split('/').pop() ?? ''
        const accessory = getAccessory(slug)
        if (!accessory) return <CompactSearchCard key={i.id} item={i} />
        return <AccessoryCard key={i.id} accessory={accessory} />
      })}
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="mt-10 rounded-[12px] border border-dashed border-line py-16 text-center">
      <p className="text-lg font-semibold text-ink">
        No hemos encontrado resultados para “{query}”
      </p>
      <p className="mt-2 text-muted">
        Prueba con otro término o explora las categorías principales.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {families.slice(0, 5).map((f) => (
          <Link
            key={f.slug}
            to={
              modelsByFamily[f.slug]
                ? `/${f.slug}`
                : f.slug === 'accesorios'
                  ? '/accesorios'
                  : `/buscar?q=${encodeURIComponent(f.name)}`
            }
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-ink"
          >
            {f.name}
          </Link>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/elige-tu-apple" variant="secondary">
          Prueba el asistente Encuentra tu Apple
        </ButtonLink>
        <ButtonLink to="/soporte" variant="tertiary">
          Ir al centro de soporte ›
        </ButtonLink>
      </div>
    </div>
  )
}
