import { Link } from 'react-router-dom'
import { useIdioma } from '../../lib/i18n'
import { useCatalogoFamilia } from '../../lib/useCatalogoFamilia'
import { Container } from '../ui/Container'
import { Button, ButtonLink } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { ProductCardApp } from '../product/ProductCardApp'
import { CatalogFiltersApp } from '../product/CatalogFiltersApp'
import { CatalogoVacio } from './CatalogoVacio'
import type { Family, Model } from '../../data/types'

/**
 * La página de familia **dentro de la app**.
 *
 * Es la composición aprobada en la Fase A y no cambia con esta separación: lo
 * único que ocurre es que ahora vive en su propio archivo, de modo que la web
 * pueda evolucionar sin moverla —y al revés—.
 *
 * EL PRIMER VIEWPORT ES PARA EL PRODUCTO
 *
 * Aquí había, por delante del catálogo: una banda gris con eyebrow «Catálogo
 * Banana», un título centrado, un párrafo explicativo y un botón grande de
 * comparar. Medido a 320×568, donde entre la barra de arriba y la de pestañas
 * hay 398 px útiles: ese bloque ocupaba 281 y los controles del catálogo otros
 * ~130. La primera tarjeta empezaba en y=576 y se veía **cero**.
 *
 * Nada de aquello decía algo que la pantalla no dijera ya: la barra y los chips
 * indican la familia, y que se elige un modelo lo demuestra la propia rejilla.
 * Así que se retiró —no se sustituyó por otra cosa— y queda una fila: el nombre
 * de la familia y el acceso a comparar.
 *
 * `tests/e2e/producto-en-pantalla.spec.ts` protege el resultado.
 *
 * AIRPODS CONSERVA SU ENCABEZADO, PERO CON LOS FILTROS DE LA APP
 *
 * La Fase A sólo rediseñó las cuatro familias con escaparate; AirPods entra por
 * la composición genérica y sigue igual. Lo que **no** puede hacer es heredar la
 * página web: allí el orden es un `<select>`, y en la app tiene que seguir
 * siendo el control táctil que el resto de familias —«AirPods tiene los mismos
 * filtros que el resto de familias», `app-shopping.spec.ts`—. Por eso el
 * encabezado genérico se monta aquí y no se delega.
 *
 * Que la app siga sin encabezado propio para AirPods queda anotado como
 * pendiente, no como decisión de esta entrega.
 */
export function AppFamilyPage({ family, models }: { family: Family; models: Model[] }) {
  const { t } = useIdioma()

  const conComposicionPropia =
    family.slug === 'iphone' || family.slug === 'mac' || family.slug === 'ipad' || family.slug === 'apple-watch'

  if (!conComposicionPropia) return <AppFamilyGenerica family={family} models={models} />

  return (
    <Container className="px-4 pb-8 pt-2">
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

      {/* LOS PÍXELES SALEN DE AQUÍ, NO DE LA TARJETA
          Medido a 320×568: con `pt-4` y `mb-3` el nombre del primer producto
          asomaba 3 px por encima de la barra de pestañas —presente, pero
          ilegible—. Se recuperan 12 px entre el espacio superior y el que hay
          bajo los controles; los 8 px entre el título y los controles se
          mantienen, que es donde el aire se nota.

          Acortar la tarjeta habría sido lo fácil y es Fase B: `min-h-[400px]`,
          tagline, distintivo y precio se quedan como están. */}
      <div className="mt-2">
        <CatalogoApp models={models} />
      </div>
    </Container>
  )
}

/**
 * Familias sin composición propia en la app —hoy AirPods—. Es el encabezado que
 * ya tenían, sin tocar; lo único que se garantiza aquí es que el catálogo de
 * debajo use los controles de la app y no los del navegador.
 */
function AppFamilyGenerica({ family, models }: { family: Family; models: Model[] }) {
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
        <CatalogoApp models={models} />

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

function CatalogoApp({ models }: { models: Model[] }) {
  const { t } = useIdioma()
  const { filtros, visibles, cambiar, familia, enComparacion } = useCatalogoFamilia(models)

  return (
    <>
      <CatalogFiltersApp
        filtros={filtros}
        onCambiar={cambiar}
        totalVisible={visibles.length}
        totalSin={models.length}
      />

      {/* LA LLAMADA AL COMPARADOR ES DEL LISTADO, NO DE CADA TARJETA
          Estaba dentro de la tarjeta, así que con dos modelos comparados se
          pintaban dos enlaces idénticos y con tres, tres. Es una sola acción
          sobre una sola comparación: se pinta una vez, aquí. */}
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
            <ProductCardApp key={m.slug} model={m} priority={i === 0} />
          ))}
        </div>
      ) : (
        <CatalogoVacio onLimpiar={cambiar} />
      )}
    </>
  )
}
