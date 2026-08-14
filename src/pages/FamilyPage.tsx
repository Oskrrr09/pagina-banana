import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useIdioma } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { ProductCard } from '../components/product/ProductCard'
import { Button, ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { getFamilyModels, familyInfo } from '../data/products'
import type { Family, Model } from '../data/types'
import { NotFound } from './NotFound'
import { CatalogFilters } from '../components/product/CatalogFilters'
import {
  aplicarFiltros,
  escribirFiltrosEnUrl,
  FILTROS_VACIOS,
  leerFiltrosDeUrl,
  type FiltrosCatalogo,
} from '../lib/catalogFilters'

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
  const { t } = useIdioma()

  // POR QUÉ ESTA PÁGINA ES AHORA TAN CORTA POR ARRIBA
  //
  // Antes había, en este orden: encabezado, un carrusel con TODOS los modelos,
  // un escaparate a pantalla completa de «Ofertas destacadas» con su degradado,
  // el botón de comparar y, sólo entonces, el catálogo con sus filtros. Medido
  // a 390×844: 5,2 pantallas, y los filtros aparecían pasadas dos.
  //
  // Se recorría el mismo catálogo dos veces con dos lenguajes distintos, y las
  // ofertas ya salen en las tarjetas de la rejilla —`ProductCard` pinta precio,
  // precio anterior y porcentaje—, así que el escaparate no añadía dato alguno.
  //
  // Queda encabezado, acceso a comparar y catálogo. Nada se pierde: los mismos
  // modelos y las mismas ofertas están abajo, filtrables y ordenables.
  return (
    <>
      <section className="border-b border-line bg-neutral">
        <Container className="py-8 md:py-10">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">Catálogo Banana</p>
            <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
              {t('catalog.buyA', { familia: family.name })}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted">{t('catalog.chooseModel')}</p>
          </div>
          <div className="mt-6 flex justify-center">
            <ButtonLink to={`/comparar?familia=${family.slug}`} variant="secondary">
              <Icon name="compare" size={18} /> Comparar modelos de {family.name}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Container className="py-8">
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
        // ESTADO SIN RESULTADOS
        //
        // Antes sólo decía que no había coincidencias y dejaba a la persona
        // ahí parada. Ahora ofrece las dos salidas que existen de verdad:
        // deshacer los filtros —sin tocarlos por su cuenta— y el asistente, que
        // es literalmente para cuando no se sabe qué elegir. No se enseña
        // ningún producto que no cumpla el filtro.
        <div role="region" aria-label={t('catalog.noResults')} className="py-10 text-center">
          <p className="text-muted">{t('catalog.noResults')}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => cambiar(FILTROS_VACIOS)}>
              {t('catalog.clearFilters')}
            </Button>
            <ButtonLink to="/elige-tu-apple" variant="secondary">
              {t('home.finder.title')}
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  )
}
