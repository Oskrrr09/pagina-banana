import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { allModels, families, getModel, variantPath } from '../../../data/products'
import type { Model } from '../../../data/types'
import { euro } from '../../../lib/format'
import { useCatalogo, useIdioma } from '../../../lib/i18n'
import { leerRecientes } from '../../../lib/recentlyViewed'
import { useStorePreference } from '../../../lib/storePreference'
import { ButtonLink } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { ProductImage } from '../../product/ProductImage'
import { ProductCardCompact } from '../../product/ProductCardCompact'

// ============================================================================
// Portada de la aplicación nativa.
//
// La portada de la web es un escaparate corporativo: marca, novedades,
// servicios, Plan Renove, tiendas, preguntas frecuentes. Está bien para quien
// llega buscando quién es Banana. Quien se ha descargado la app ya lo sabe y
// viene a otra cosa, así que aquí el orden es
//
//     producto → descubrimiento → disponibilidad → compra
//
// y los servicios quedan al final.
//
// Vive en su propio componente y no dentro de `Home.tsx` con condicionales:
// son dos páginas distintas que comparten datos y tarjetas, no una página con
// variantes. `Home` decide cuál montar y no sabe nada de esta.
//
// Todo lo que se muestra sale del catálogo real. No hay promociones,
// porcentajes ni disponibilidad inventados: cuando el dato no existe, la
// sección no aparece.
// ============================================================================

/** Familias con producto de verdad, en el orden en que se ofrecen. */
const CATEGORIAS = ['iphone', 'mac', 'ipad', 'apple-watch', 'airpods', 'accesorios'] as const

export function AppHome() {
  return (
    <div className="pb-10">
      <HeroDestacado />
      <VistosRecientemente />
      <Oportunidades />
      <PorCategoria />
      <Destacados />
      <TuTienda />
      <Servicios />
    </div>
  )
}

/** Envoltorio de sección: título a la izquierda y enlace opcional a la derecha. */
function Seccion({
  titulo,
  enlace,
  etiquetaEnlace,
  children,
}: {
  titulo: string
  enlace?: string
  etiquetaEnlace?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-8 first:mt-6">
      <div className="flex items-baseline justify-between gap-3 px-4">
        <h2 className="text-lg font-bold text-ink">{titulo}</h2>
        {enlace && (
          <Link to={enlace} className="shrink-0 text-sm font-semibold text-ink underline underline-offset-2">
            {etiquetaEnlace}
          </Link>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** Carrusel horizontal con desplazamiento por gestos y ajuste al borde. */
function Carrusel({ children, etiqueta }: { children: React.ReactNode; etiqueta: string }) {
  return (
    <ul
      aria-label={etiqueta}
      className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </ul>
  )
}

/**
 * A. Hero comercial.
 *
 * Un solo producto, el más caro con oferta viva; si no hubiera ninguna oferta,
 * el primero del catálogo. Se elige por dato, no por una lista escrita a mano
 * que se quedaría desfasada al tocar el catálogo.
 */
function HeroDestacado() {
  const { t, intl } = useIdioma()
  const cat = useCatalogo()

  const destacado = useMemo<Model | undefined>(() => {
    const conOferta = allModels.filter((m) => m.colors[0].capacities[0].previousPrice != null)
    const candidatos = conOferta.length > 0 ? conOferta : allModels
    return [...candidatos].sort((a, b) => b.fromPrice - a.fromPrice)[0]
  }, [])

  if (!destacado) return null

  const color = destacado.colors[0]
  const primera = color.capacities[0]

  return (
    <section aria-labelledby="app-hero-titulo" className="px-4 pt-4">
      <div className="overflow-hidden rounded-[20px] border border-line bg-neutral">
        <div className="px-5 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{cat(destacado.tagline)}</p>
          <h1 id="app-hero-titulo" className="mt-1 text-2xl font-extrabold leading-tight text-ink">
            {cat(destacado.name)}
          </h1>
          <p className="mt-2 text-sm text-ink">
            {t('common.from', { precio: euro(destacado.fromPrice, intl) })}
            {primera.previousPrice && (
              <span className="ml-2 text-sm font-semibold text-muted line-through">
                {euro(primera.previousPrice, intl)}
              </span>
            )}
          </p>
        </div>
        {/* Apaisada y no cuadrada: con el cuadrado por defecto el hero se
            comía la pantalla entera de un móvil y el botón de comprar quedaba
            fuera, que es justo lo contrario de lo que tiene que hacer un hero
            comercial. Así entran imagen, precio y llamada a la acción de una
            sola mirada. */}
        <Link to={variantPath(destacado)} className="mt-3 block px-5">
          <ProductImage
            src={color.image}
            alt={`${cat(destacado.name)} ${color.name}`}
            bgColor={color.imageBg}
            pad={!color.imageBg}
            ratio="16 / 10"
            // Lo único de la portada por encima del pliegue.
            priority
          />
        </Link>
        <div className="p-5 pt-4">
          <ButtonLink to={variantPath(destacado)} size="lg" className="w-full justify-center">
            {t('common.buy')}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

/**
 * B. Continúa donde lo dejaste.
 *
 * Sale del historial del dispositivo (`lib/recentlyViewed`). Se lee una vez al
 * montar: el historial sólo cambia al visitar una ficha, y entonces se vuelve a
 * esta portada montándola de nuevo.
 *
 * Los identificadores guardados se resuelven contra el catálogo; si alguno ya
 * no existe —producto retirado, historial viejo— simplemente se cae de la
 * lista. Sin historial, la sección no se pinta.
 */
function VistosRecientemente() {
  const { t } = useIdioma()
  const [modelos, setModelos] = useState<Model[]>([])

  useEffect(() => {
    const encontrados = leerRecientes()
      .map((id) => {
        const [familia, slug] = id.split('/')
        return getModel(familia, slug)
      })
      .filter((m): m is Model => Boolean(m))
      .slice(0, 6)
    setModelos(encontrados)
  }, [])

  if (modelos.length === 0) return null

  return (
    <Seccion titulo={t('app.home.recent')}>
      <Carrusel etiqueta={t('app.home.recent')}>
        {modelos.map((m) => (
          <li key={`${m.family}/${m.slug}`} className="snap-start">
            <ProductCardCompact model={m} />
          </li>
        ))}
      </Carrusel>
    </Seccion>
  )
}

/**
 * C. Oportunidades.
 *
 * Sólo productos con `previousPrice` de verdad en el catálogo. Si no hay
 * ninguno, no hay sección: no se fabrica una oferta poniendo la etiqueta encima
 * de un precio normal.
 */
function Oportunidades() {
  const { t } = useIdioma()
  const enOferta = useMemo(() => allModels.filter((m) => m.colors[0].capacities[0].previousPrice != null), [])

  if (enOferta.length === 0) return null

  return (
    <Seccion titulo={t('app.home.deals')}>
      <Carrusel etiqueta={t('app.home.deals')}>
        {enOferta.map((m) => (
          <li key={`${m.family}/${m.slug}`} className="snap-start">
            <ProductCardCompact model={m} />
          </li>
        ))}
      </Carrusel>
    </Seccion>
  )
}

/** D. Compra por categoría. Rejilla de dos columnas, cómoda para el pulgar. */
function PorCategoria() {
  const { t } = useIdioma()
  const cat = useCatalogo()

  return (
    <Seccion titulo={t('app.home.categories')}>
      <ul className="grid grid-cols-2 gap-3 px-4">
        {CATEGORIAS.map((slug) => {
          const familia = families.find((f) => f.slug === slug)
          if (!familia) return null
          const muestra = allModels.find((m) => m.family === slug)
          return (
            <li key={slug}>
              <Link
                to={`/${slug}`}
                className="flex h-full min-h-[6.5rem] flex-col justify-between rounded-[14px] border border-line bg-surface p-3 transition-colors hover:border-banana"
              >
                <span className="text-sm font-bold text-ink">{cat(familia.name)}</span>
                {muestra ? (
                  <img
                    src={muestra.colors[0].image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="mx-auto h-14 w-auto object-contain"
                  />
                ) : (
                  <Icon name="chevron-right" className="ml-auto text-muted" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </Seccion>
  )
}

/**
 * E. Productos destacados.
 *
 * Una muestra corta, no otro catálogo entero: el objetivo es que se entre a una
 * ficha, no que se navegue aquí. Los que ya salen en oportunidades se descartan
 * para no repetir tarjetas dos secciones más abajo.
 */
function Destacados() {
  const { t } = useIdioma()
  const seleccion = useMemo(
    () => allModels.filter((m) => m.colors[0].capacities[0].previousPrice == null).slice(0, 6),
    [],
  )

  if (seleccion.length === 0) return null

  return (
    <Seccion titulo={t('app.home.featured')} enlace="/iphone" etiquetaEnlace={t('app.home.seeAll')}>
      <Carrusel etiqueta={t('app.home.featured')}>
        {seleccion.map((m) => (
          <li key={`${m.family}/${m.slug}`} className="snap-start">
            <ProductCardCompact model={m} />
          </li>
        ))}
      </Carrusel>
    </Seccion>
  )
}

/**
 * F. Tu tienda.
 *
 * La ventaja de Banana frente a una tienda sólo online son las tiendas
 * físicas. Aquí se enseña la favorita si la hay, y si no se ofrece elegirla.
 *
 * NO se promete recogida ni disponibilidad: el catálogo tiene existencias por
 * variante, no por tienda, así que un «recógelo hoy» sería inventado. Se enlaza
 * a la ficha de la tienda, que sí tiene datos reales de horario y dirección.
 */
function TuTienda() {
  const { t } = useIdioma()
  const { favoriteStore } = useStorePreference()

  return (
    <Seccion titulo={t('app.home.yourStore')}>
      <div className="px-4">
        {favoriteStore ? (
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('app.home.yourStore')}</p>
            <p className="mt-1 text-base font-bold text-ink">Banana {favoriteStore.name}</p>
            <p className="mt-1 text-sm text-muted">{favoriteStore.address}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLink to={`/tiendas/${favoriteStore.slug}`} size="sm" variant="secondary">
                {t('app.home.viewStore')}
              </ButtonLink>
              <ButtonLink to="/tiendas" size="sm" variant="tertiary">
                {t('app.home.changeStore')}
              </ButtonLink>
            </div>
          </div>
        ) : (
          <Link
            to="/tiendas"
            className="flex items-center gap-3 rounded-[14px] border border-dashed border-line bg-surface p-4"
          >
            <Icon name="map-pin" className="shrink-0 text-muted" />
            <span className="text-sm font-semibold text-ink">{t('app.home.pickStore')}</span>
            <Icon name="chevron-right" className="ml-auto shrink-0 text-muted" />
          </Link>
        )}
      </div>
    </Seccion>
  )
}

/** G. Servicios, al final y en discreto: son el complemento, no el escaparate. */
function Servicios() {
  const { t } = useIdioma()
  // Etiquetas y rutas ya existentes: no se inventan destinos nuevos.
  const enlaces = [
    { to: '/plan-renove', etiqueta: t('footer.tradeIn') },
    { to: '/servicios', etiqueta: t('nav.services') },
    { to: '/servicio-tecnico', etiqueta: t('footer.repairService') },
    { to: '/soporte', etiqueta: t('footer.helpAndServices') },
    { to: '/tiendas', etiqueta: t('header.utility.stores') },
  ]

  return (
    <Seccion titulo={t('app.home.services')}>
      <ul className="divide-y divide-line border-y border-line">
        {enlaces.map((e) => (
          <li key={e.to}>
            <Link to={e.to} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-ink">
              {e.etiqueta}
              <Icon name="chevron-right" size={18} className="ml-auto shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Seccion>
  )
}
