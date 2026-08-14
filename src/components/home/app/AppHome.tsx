import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { allModels } from '../../../data/products'
import { useIdioma } from '../../../lib/i18n'
import { tieneOferta } from '../../../lib/offers'
import { Icon } from '../../ui/Icon'
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
//
// POR QUÉ ESTA PANTALLA ES TAN CORTA
//
// Lo era mucho menos, y medía 1.951 px a 390×844. Se fueron cuatro bloques, y
// ninguno por gusto:
//
//   - el HERO, 430 px —el 51 % de la primera pantalla— para un solo producto
//     elegido por ser «la oferta más cara», que no es una señal de relevancia;
//     además convertía el nombre de ese producto en el `h1` de Tienda y repetía
//     lo que hay tres dedos más abajo en Oportunidades;
//   - «Compra por categoría», porque las familias ya viven en los chips de
//     `AppTopBar`, que están SIEMPRE arriba y a un toque;
//   - «Vistos recientemente» y «Tu tienda», que desde la PR #55 son de Inicio:
//     ahí son «lo mío», aquí eran un eco.
//   - «Destacados», un segundo carrusel sin criterio que explicar.
//
// Lo que queda es lo que sólo puede estar aquí: la oferta real del catálogo, la
// ayuda para elegir y los servicios de compra. Nada de esto lo enseña Inicio.
// ============================================================================

export function AppHome() {
  return (
    <div className="pb-10">
      <Encabezado />
      <Oportunidades />
      <AyudaParaElegir />
      <Servicios />
    </div>
  )
}

/**
 * Encabezado de la sección.
 *
 * El `h1` de esta pantalla es «Tienda». Antes lo era el nombre del producto del
 * hero, así que la sección no se anunciaba en ninguna parte y la estructura del
 * documento empezaba por un producto cualquiera.
 */
function Encabezado() {
  const { t } = useIdioma()

  return (
    <header className="px-4 pt-5">
      <h1 className="text-2xl font-extrabold text-ink">{t('appnav.store')}</h1>
      <p className="mt-1 text-sm text-muted">{t('app.store.lead')}</p>
    </header>
  )
}

/**
 * Ayuda para elegir.
 *
 * Una fila, no el bloque amarillo de Inicio: allí el asistente es la pieza
 * principal y aquí es una salida para quien se ha quedado mirando el catálogo
 * sin decidirse. Repetir el bloque grande sería la duplicación que esta pantalla
 * viene a quitar. Lleva al asistente real; no se duplica ni una pregunta suya.
 */
function AyudaParaElegir() {
  const { t } = useIdioma()

  return (
    <section aria-labelledby="tienda-ayuda" className="mt-8 px-4">
      <Link
        to="/elige-tu-apple"
        className="flex min-h-14 items-center gap-3 rounded-[16px] border border-line bg-surface p-4"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brand text-ink">
          <Icon name="sparkles" size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span id="tienda-ayuda" className="block font-semibold text-ink">
            {t('home.finder.eyebrow')}
          </span>
          <span className="block text-sm text-muted">{t('home.finder.title')}</span>
        </span>
        <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
      </Link>
    </section>
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
 * C. Oportunidades.
 *
 * Sólo productos con `previousPrice` de verdad en el catálogo. Si no hay
 * ninguno, no hay sección: no se fabrica una oferta poniendo la etiqueta encima
 * de un precio normal.
 */
function Oportunidades() {
  const { t } = useIdioma()
  const enOferta = useMemo(() => allModels.filter(tieneOferta), [])

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
