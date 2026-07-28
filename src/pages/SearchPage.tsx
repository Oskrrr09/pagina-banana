import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ProductCard } from '../components/product/ProductCard'
import { ButtonLink } from '../components/ui/Button'
import { allModels, families, modelsByFamily } from '../data/products'
import { services } from '../data/content'
import { supportTopics } from '../data/content'

// Resultados del buscador (§4.4): productos, categorías/servicios y ayuda.
// El campo se sincroniza siempre con el parámetro `q` de la URL: si se navega
// desde la lupa del Header a "Mac" estando ya en /buscar?q=iPhone, el input
// pasa a "Mac" y los resultados a "Mac". Adelante/atrás del navegador también
// mantienen el input alineado con la URL.
export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [input, setInput] = useState(q)
  useEffect(() => {
    // Cuando la URL cambia (nueva búsqueda desde la lupa, back/forward…) el
    // input debe reflejar el término activo.
    setInput(q)
  }, [q])
  const term = q.trim().toLowerCase()

  const productResults = useMemo(
    () =>
      term
        ? allModels.filter(
            (m) => m.name.toLowerCase().includes(term) || m.tagline.toLowerCase().includes(term),
          )
        : allModels,
    [term],
  )

  const categoryResults = useMemo(
    () =>
      term
        ? [...families, ...services].filter((x) => x.name.toLowerCase().includes(term))
        : [],
    [term],
  )

  const helpResults = useMemo(() => {
    if (!term) return []
    return supportTopics
      .flatMap((t) => t.items)
      .filter((i) => i.q.toLowerCase().includes(term) || i.a.toLowerCase().includes(term))
  }, [term])

  const nothing = term && productResults.length === 0 && categoryResults.length === 0 && helpResults.length === 0

  return (
    <Container className="py-10">
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

      {q && (
        <p className="mt-4 text-sm text-muted">
          Resultados para <span className="font-semibold text-ink">“{q}”</span>
        </p>
      )}

      {nothing ? (
        <div className="mt-10 rounded-[12px] border border-dashed border-line py-16 text-center">
          <p className="text-lg font-semibold text-ink">No hemos encontrado resultados para “{q}”</p>
          <p className="mt-2 text-muted">Prueba con otro término o explora las categorías populares.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {families.slice(0, 4).map((f) => (
              <Link
                key={f.slug}
                to={modelsByFamily[f.slug] ? `/${f.slug}` : '/iphone'}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-ink"
              >
                {f.name}
              </Link>
            ))}
          </div>
          <ButtonLink to="/soporte" variant="tertiary" className="mt-6">
            ¿Necesitas ayuda? Ve al centro de soporte ›
          </ButtonLink>
        </div>
      ) : (
        <>
          {/* 2 — Resultados de producto */}
          {productResults.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-lg font-bold text-ink">Productos</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {productResults.map((m) => (
                  <ProductCard key={m.slug} model={m} />
                ))}
              </div>
            </section>
          )}

          {/* 3 — Categorías y servicios */}
          {categoryResults.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold text-ink">Categorías y servicios</h2>
              <ul className="space-y-1">
                {categoryResults.map((c) => (
                  <li key={c.name}>
                    <Link
                      to={
                        'slug' in c && modelsByFamily[c.slug]
                          ? `/${c.slug}`
                          : 'line' in c
                            ? '/servicios'
                            : '/iphone'
                      }
                      className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-ink hover:bg-neutral hover:text-ink"
                    >
                      <Icon name="chevron-right" size={16} className="text-muted" />
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 4 — Ayuda */}
          {helpResults.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold text-ink">Ayuda</h2>
              <ul className="divide-y divide-line border-y border-line">
                {helpResults.map((h) => (
                  <li key={h.q} className="py-3">
                    <Link to="/soporte" className="font-medium text-ink hover:text-ink">
                      {h.q}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted">{h.a}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </Container>
  )
}
