import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useCatalogo, useIdioma } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { ProductCard } from '../components/product/ProductCard'
import { Button, ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { OfferBadge, ProvisionalBadge } from '../components/ui/Tag'
import { getFamilyModels, familyInfo, variantPath } from '../data/products'
import type { Family, Model } from '../data/types'
import { euro } from '../lib/format'
import { NotFound } from './NotFound'
import { CatalogFilters } from '../components/product/CatalogFilters'
import { aplicarFiltros, escribirFiltrosEnUrl, leerFiltrosDeUrl, type FiltrosCatalogo } from '../lib/catalogFilters'

// Página de familia genérica (§4.5): encabezado, modelos y acceso al
// comparador. Sirve para las familias sin escaparate propio —hoy AirPods—.
//
// El filtro por tramos de precio que vivía aquí se retiró: hacía lo mismo que
// `CatalogoFiltrable` pero peor —sin disponibilidad, sin ordenación y guardando
// el estado en `useState`, así que Atrás no lo recuperaba y un enlace no lo
// llevaba—. Mantener dos sistemas de filtrado según la familia sólo servía para
// que la experiencia dependiera de por dónde entrases.

export function FamilyPage() {
  const { t } = useIdioma()
  const { family: familySlug } = useParams()

  const family = familyInfo(familySlug ?? '')
  const models = getFamilyModels(familySlug ?? '')

  // Familia inexistente o sin catálogo desarrollado → 404 amable.
  if (!family || models.length === 0) return <NotFound />

  if (family.slug === 'iphone' || family.slug === 'mac' || family.slug === 'ipad' || family.slug === 'apple-watch') {
    return <ShowcaseFamilyPage family={family} models={models} />
  }

  const heroImage = models[0].colors[0].image

  return (
    <>
      {/* 1 — Encabezado de familia */}
      <section className="border-b border-line bg-linear-to-b from-banana/25 to-surface">
        <Container className="py-8 md:py-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{family.name}</h1>
              <p className="mt-3 max-w-md text-lg text-muted">
                {family.taglineKey ? t(family.taglineKey) : family.tagline}. {t('catalog.compareAndChoose')}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to={`/comparar?familia=${family.slug}`} variant="secondary">
                  <Icon name="compare" size={18} /> Comparar modelos
                </ButtonLink>
              </div>
            </div>
            <img
              src={heroImage}
              alt={`Gama ${family.name} en Banana`}
              width={1080}
              height={1080}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="mx-auto w-full max-w-sm rounded-[20px] bg-neutral p-6"
            />
          </div>
        </Container>
      </section>

      <Container className="py-10">
        {/* Los mismos filtros que el resto de familias: no había motivo para
            que AirPods tuviera su propio sistema con otro comportamiento. */}
        <CatalogoFiltrable models={models} />

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
  const { t, intl } = useIdioma()
  const cat = useCatalogo()
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
              {t('catalog.buyA', { familia: family.name })}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted">{t('catalog.chooseModel')}</p>
          </div>

          <nav aria-label={`Modelos de ${family.name}`} className="mt-8 overflow-x-auto no-scrollbar pb-2">
            <ul className="flex w-max min-w-full gap-3 justify-start lg:justify-center">
              {models.map((model) => (
                <li key={model.slug} className="w-32 shrink-0">
                  <Link
                    to={variantPath(model)}
                    className="group flex flex-col items-center rounded-[16px] border border-transparent px-3 py-3 text-center transition-[background-color,border-color,transform] hover:-translate-y-1 hover:border-line hover:bg-surface"
                  >
                    <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-[12px] bg-surface p-2">
                      <img
                        src={model.colors[0].image}
                        alt=""
                        width={128}
                        height={128}
                        loading="lazy"
                        decoding="async"
                        className="block h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="mt-2 text-sm font-semibold leading-tight text-ink">{cat(model.name)}</span>
                    <span className="mt-1 text-xs text-muted">
                      {t('common.from', { precio: euro(model.fromPrice, intl) })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>

      <section className="bg-[linear-gradient(135deg,#f4f8fc_0%,#c9dcf1_48%,#ffe08a_100%)] py-12 md:py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-danger">Oportunidades</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-5xl">
              {t('catalog.featuredIn', { familia: family.name })}
            </h2>
            <p className="mt-3 text-muted">{t('family.demoPrices')}</p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2">
            {(offerModels.length > 0 ? offerModels : models.slice(0, 4)).map((model) => {
              const firstColor = model.colors[0]
              const offer =
                firstColor.capacities.find((capacity) => capacity.previousPrice != null) ?? firstColor.capacities[0]

              return (
                <Link
                  key={model.slug}
                  to={variantPath(model, firstColor, offer)}
                  className="group relative overflow-hidden rounded-[20px] border border-line bg-surface/55 p-6 shadow-[var(--shadow-rest)] backdrop-blur-sm transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <OfferBadge>{t('common.offer')}</OfferBadge>
                      <h3 className="mt-3 text-2xl font-extrabold text-ink">{cat(model.name)}</h3>
                      <p className="mt-1 text-sm text-muted">{cat(model.tagline)}</p>
                    </div>
                    <Icon
                      name="arrow-right"
                      className="shrink-0 text-ink transition-transform group-hover:translate-x-1"
                    />
                  </div>
                  <div className="mt-5 grid items-end gap-4 sm:grid-cols-[1fr_1.2fr]">
                    <div>
                      {offer.previousPrice && (
                        <p className="text-sm text-muted line-through">{euro(offer.previousPrice)}</p>
                      )}
                      <p className="text-3xl font-extrabold text-danger">{euro(offer.price)}</p>
                      <div className="mt-2">
                        <ProvisionalBadge />
                      </div>
                    </div>
                    <ProductImage
                      src={firstColor.image}
                      alt={`${cat(model.name)} ${firstColor.name}`}
                      ratio="1 / 1"
                      bgColor={firstColor.imageBg}
                      pad={!firstColor.imageBg}
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

      <Container className="py-10">
        <h2 className="mb-6 text-2xl font-extrabold text-ink">Catálogo completo {family.name}</h2>
        <CatalogoFiltrable models={models} />
      </Container>
    </>
  )
}

/**
 * Rejilla del catálogo con filtros y orden.
 *
 * El estado vive en la URL, no en `useState`: así Atrás y Adelante recuperan lo
 * que se estaba viendo y un enlace compartido llega filtrado igual. Se navega
 * con `replace` para no llenar el historial de una entrada por cada toque en un
 * filtro — de lo contrario, salir de la página exigiría pulsar Atrás tantas
 * veces como filtros se hubieran tocado.
 */
function CatalogoFiltrable({ models }: { models: Model[] }) {
  const { t } = useIdioma()
  const [params, setParams] = useSearchParams()
  const filtros = useMemo(() => leerFiltrosDeUrl(params), [params])
  const visibles = useMemo(() => aplicarFiltros(models, filtros), [models, filtros])

  const cambiar = (siguiente: FiltrosCatalogo) => {
    setParams(escribirFiltrosEnUrl(siguiente), { replace: true })
  }

  return (
    <>
      <CatalogFilters filtros={filtros} onCambiar={cambiar} totalVisible={visibles.length} totalSin={models.length} />
      {visibles.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((m) => (
            <ProductCard key={m.slug} model={m} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-muted">{t('catalog.noResults')}</p>
      )}
    </>
  )
}
