import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useIdioma } from '../lib/i18n'
import { useStore } from '../lib/store'
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
  // EL PRIMER VIEWPORT ERA PARA LA INTERFAZ, NO PARA EL PRODUCTO
  //
  // Aquí había, por delante del catálogo: una banda gris con eyebrow
  // «Catálogo Banana», un título centrado, un párrafo explicativo y un botón
  // grande de comparar. Medido a 320×568, donde entre la barra de arriba y la
  // de pestañas hay 398 px útiles: ese bloque ocupaba 281 y los controles del
  // catálogo otros ~130. La primera tarjeta empezaba en y=576 y se veía
  // **cero**.
  //
  // Nada de aquello decía algo que la pantalla no dijera ya: la barra y los
  // chips indican la familia, y que se elige un modelo lo demuestra la propia
  // rejilla. Así que se retira —no se sustituye por otra cosa— y queda una
  // fila: el nombre de la familia y el acceso a comparar.
  //
  // Comparar sigue estando y sigue siendo táctil; lo que deja de ser es un
  // botón del ancho de la pantalla compitiendo con el producto.
  return (
    <Container className="px-4 pb-8 pt-4">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{family.name}</h1>
        <Link
          to={`/comparar?familia=${family.slug}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-ink"
        >
          <Icon name="compare" size={16} aria-hidden="true" />
          {t('compare.title')}
        </Link>
      </div>

      {/* `mt-2` y no `mt-3`: medido a 320×568, el nombre del primer producto
          se quedaba 5 px por debajo de la barra de pestañas. Los ocho píxeles
          que se recuperan aquí y en la separación de los controles bastan, y
          evitan tener que tocar la tarjeta —eso es Fase B—. */}
      <div className="mt-2">
        <CatalogoFiltrable models={models} />
      </div>
    </Container>
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

  // LA LLAMADA AL COMPARADOR ES DEL LISTADO, NO DE CADA TARJETA
  //
  // Estaba dentro de `ProductCard`, así que con dos modelos comparados se
  // pintaban dos enlaces idénticos y con tres, tres. Es una sola acción sobre
  // una sola comparación: se pinta una vez, aquí.
  //
  // Se cuenta sólo lo de ESTA familia. El comparador guarda una familia a la
  // vez, y enseñar «3 modelos» en /mac porque hay tres iPhone guardados sería
  // un resumen falso de lo que hay en pantalla.
  const { compare } = useStore()
  const familia = models[0]?.family
  const enComparacion = compare.filter((c) => c.family === familia).length

  const cambiar = (siguiente: FiltrosCatalogo) => {
    setParams(escribirFiltrosEnUrl(siguiente), { replace: true })
  }

  return (
    <>
      <CatalogFilters filtros={filtros} onCambiar={cambiar} totalVisible={visibles.length} totalSin={models.length} />
      {enComparacion > 0 && (
        <div className="mb-5 flex justify-center">
          <Link
            to={`/comparar?familia=${familia}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-ink bg-surface px-4 text-sm font-semibold text-ink"
          >
            <Icon name="compare" size={16} aria-hidden="true" />
            {t('compare.see', { n: String(enComparacion) })}
          </Link>
        </div>
      )}
      {visibles.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Sólo la primera imagen se pide con prioridad: ahora está sobre el
              pliegue y era la única que se cargaba tarde por estar marcada como
              diferida cuando este catálogo vivía debajo de dos escaparates. Las
              demás siguen en carga diferida. */}
          {visibles.map((m, i) => (
            <ProductCard key={m.slug} model={m} priority={i === 0} />
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
