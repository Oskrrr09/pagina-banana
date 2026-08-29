import { Link } from 'react-router-dom'
import { useCatalogo, useIdioma } from '../../lib/i18n'
import { useCatalogoFamilia } from '../../lib/useCatalogoFamilia'
import { Container } from '../ui/Container'
import { Button, ButtonLink } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { ProductCardWeb } from '../product/ProductCardWeb'
import { ProductImage } from '../product/ProductImage'
import { CatalogFiltersWeb } from '../product/CatalogFiltersWeb'
import { OfferBadge, ProvisionalBadge } from '../ui/Tag'
import { CatalogoVacio } from './CatalogoVacio'
import { variantPath } from '../../data/products'
import { getOfferVariant, type VarianteOfertada } from '../../lib/offers'
import { euro } from '../../lib/format'
import type { Family, Model } from '../../data/types'

/**
 * La página de familia **en el navegador**.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 *
 * Esta composición estuvo en `FamilyPage` hasta `f3143d85`, una entrega
 * titulada «feat(app)» que simplificaba la pantalla para la app —y tenía razón:
 * en `/iphone` los filtros aparecían en y=2.238, casi tres pantallas abajo—.
 * Pero `FamilyPage` la montaban las dos plataformas, así que el carrusel de
 * modelos, el escaparate de Oportunidades y el encabezado del catálogo
 * desaparecieron **también de la web**, donde nadie los había estorbado. En
 * escritorio quedó una pantalla de móvil estirada a 1440 px.
 *
 * Ahora cada plataforma tiene la suya. Comparten catálogo, tarjetas, rutas,
 * ofertas y el estado de los filtros —ver `useCatalogoFamilia`—; no comparten
 * marcado, que es justo lo que permitía que tocar una cambiara la otra.
 *
 * `data-familia-seccion` marca qué es cada bloque para que las pruebas puedan
 * comprobar la arquitectura —qué secciones hay y en qué orden— sin depender de
 * clases de Tailwind, que cambian con cualquier retoque.
 */
export function WebFamilyPage({ family, models }: { family: Family; models: Model[] }) {
  // Las cuatro familias con escaparate propio son las que siempre lo tuvieron.
  // AirPods nunca lo tuvo y no se le inventa uno ahora: entra por la
  // composición genérica de abajo.
  const conEscaparate =
    family.slug === 'iphone' || family.slug === 'mac' || family.slug === 'ipad' || family.slug === 'apple-watch'

  return conEscaparate ? (
    <WebFamilyShowcase family={family} models={models} />
  ) : (
    <WebFamilyGenerica family={family} models={models} />
  )
}

function WebFamilyShowcase({ family, models }: { family: Family; models: Model[] }) {
  const { t, intl } = useIdioma()
  const cat = useCatalogo()

  // QUÉ ES UNA OFERTA LO DECIDE `offers.ts`, NO ESTA PÁGINA
  //
  // La primera versión de este archivo recorría `model.colors` a mano buscando
  // un `previousPrice`. Eso repetía —peor— una lógica que ya existe y que está
  // ahí por motivos concretos: la rebaja puede vivir en una capacidad que no es
  // la de entrada (el MacBook Air M5 lo hace hoy mismo), un `previousPrice` que
  // no baje el precio no es una rebaja, y si el precio, la foto y el enlace no
  // salen de la MISMA variante la tarjeta anuncia un descuento que nadie puede
  // comprar. `getOfferVariant` devuelve la variante entera precisamente para
  // que todo eso hable de lo mismo.
  //
  // NO HAY RESPALDO: SIN OFERTAS NO HAY SECCIÓN
  //
  // Antes, si la familia no tenía ninguna rebaja se pintaban los cuatro
  // primeros modelos del catálogo bajo el título «Oportunidades», con
  // distintivo de oferta y precio en rojo. iPad y Apple Watch no tienen hoy
  // ningún precio anterior, así que la web les inventaba un escaparate de
  // rebajas que no existen. En un prototipo cuyos precios ya van marcados como
  // demostrativos, fabricar descuentos es justo lo que no se puede hacer.
  //
  // Sin ofertas reales, la sección no se monta y el catálogo sube.
  const destacados = models
    .map((model) => ({ model, oferta: getOfferVariant(model) }))
    .filter((item): item is { model: Model; oferta: VarianteOfertada } => item.oferta !== null)

  return (
    <>
      {/* 1 — Encabezado y carrusel de modelos. */}
      <section data-familia-seccion="modelos" className="border-b border-line bg-neutral">
        <Container className="py-8 md:py-12">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">{t('catalog.eyebrow')}</p>
            <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">
              {t('catalog.buyA', { familia: family.name })}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted">{t('catalog.chooseModel')}</p>
          </div>

          <nav
            aria-label={t('catalog.modelsOf', { familia: family.name })}
            className="no-scrollbar mt-8 overflow-x-auto pb-2"
          >
            <ul className="flex w-max min-w-full justify-start gap-3 lg:justify-center">
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

      {/* 2 — Oportunidades, SÓLO si las hay. Sin rebajas reales esta sección no
             se monta: el catálogo completo sube y ocupa su sitio. El degradado
             es la identidad de la sección, lo que la separa del catálogo de
             abajo sin necesidad de un marco. */}
      {destacados.length > 0 && (
        <section
          data-familia-seccion="oportunidades"
          className="bg-[linear-gradient(135deg,#f4f8fc_0%,#c9dcf1_48%,#ffe08a_100%)] py-12 md:py-16"
        >
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-danger">{t('catalog.opportunities')}</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-5xl">
                {t('catalog.featuredIn', { familia: family.name })}
              </h2>
              <p className="mt-3 text-muted">{t('family.demoPrices')}</p>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2">
              {destacados.map(({ model, oferta }) => {
                // Imagen, color, capacidad, precio, precio anterior, descuento y
                // enlace salen todos de la MISMA variante ofertada. Es lo que
                // `getOfferVariant` garantiza por construcción.
                const { color, capacity } = oferta

                return (
                  <Link
                    key={model.slug}
                    to={variantPath(model, color, capacity)}
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
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-5 grid items-end gap-4 sm:grid-cols-[1fr_1.2fr]">
                      <div>
                        <p className="text-sm text-muted line-through">{euro(oferta.precioAnterior, intl)}</p>
                        <p className="text-3xl font-extrabold text-danger">{euro(oferta.precio, intl)}</p>
                        <div className="mt-2">
                          <ProvisionalBadge label={t('common.demoPrice')} />
                        </div>
                      </div>
                      <ProductImage
                        src={color.image}
                        alt={`${cat(model.name)} ${color.name}`}
                        ratio="1 / 1"
                        bgColor={color.imageBg}
                        pad={!color.imageBg}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-10 flex justify-center">
              <ButtonLink to={`/comparar?familia=${family.slug}`} variant="secondary" size="lg">
                <Icon name="compare" size={18} aria-hidden="true" />
                {t('catalog.compareModelsOf', { familia: family.name })}
              </ButtonLink>
            </div>
          </Container>
        </section>
      )}

      {/* 3 — El catálogo completo, con sus filtros. */}
      <section data-familia-seccion="catalogo">
        <Container className="py-10">
          <h2 className="mb-6 text-2xl font-extrabold text-ink">
            {t('catalog.fullCatalog', { familia: family.name })}
          </h2>
          <CatalogoWeb models={models} />
        </Container>
      </section>
    </>
  )
}

/**
 * Familias sin escaparate propio —hoy AirPods—. No se le inventa uno: la
 * historia demuestra que nunca lo tuvo.
 */
function WebFamilyGenerica({ family, models }: { family: Family; models: Model[] }) {
  const { t } = useIdioma()
  const heroImage = models[0].colors[0].image

  return (
    <>
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
                  <Icon name="compare" size={18} aria-hidden="true" />
                  {t('catalog.compareModelsOf', { familia: family.name })}
                </ButtonLink>
              </div>
            </div>
            <img
              src={heroImage}
              alt={`${family.name} — Banana`}
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
        <CatalogoWeb models={models} />

        {models.length > 1 && (
          <div className="mt-10 flex justify-center">
            <Link to={`/comparar?familia=${family.slug}`}>
              <Button variant="secondary" size="lg">
                <Icon name="compare" size={18} aria-hidden="true" />
                {t('catalog.compareModelsOf', { familia: family.name })}
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </>
  )
}

/** Rejilla del catálogo con filtros y orden, en su presentación de navegador. */
function CatalogoWeb({ models }: { models: Model[] }) {
  const { t } = useIdioma()
  const { filtros, visibles, cambiar, familia, enComparacion } = useCatalogoFamilia(models)

  return (
    <>
      <CatalogFiltersWeb
        filtros={filtros}
        onCambiar={cambiar}
        totalVisible={visibles.length}
        totalSin={models.length}
      />

      {/* La llamada al comparador es del listado, no de cada tarjeta: con dos
          modelos comparados se pintaban dos enlaces idénticos. */}
      {enComparacion > 0 && (
        <div className="mb-5 flex justify-center">
          <ButtonLink to={`/comparar?familia=${familia}`} variant="secondary" size="sm">
            <Icon name="compare" size={16} aria-hidden="true" />
            {t('compare.see', { n: String(enComparacion) })}
          </ButtonLink>
        </div>
      )}

      {visibles.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((m) => (
            <ProductCardWeb key={m.slug} model={m} />
          ))}
        </div>
      ) : (
        <CatalogoVacio onLimpiar={cambiar} />
      )}
    </>
  )
}
