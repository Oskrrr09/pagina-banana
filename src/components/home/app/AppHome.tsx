import { useId, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { allModels, families } from '../../../data/products'
import { useIdioma } from '../../../lib/i18n'
import { tieneOferta } from '../../../lib/offers'
import { Icon } from '../../ui/Icon'
import { ProductCardCompact } from '../../product/ProductCardCompact'

// ============================================================================
// Tienda — la puerta al catálogo de Banana.
//
// QUÉ RESUELVE ESTA PANTALLA, Y QUÉ NO
//
// Inicio responde a «lo mío»: lo que estaba mirando, lo que requiere atención y
// la ayuda para decidir. Tienda responde a otra pregunta —«¿qué vende
// Banana?»— y por eso empieza por el catálogo entero, no por una selección.
//
// POR QUÉ VUELVE UNA NAVEGACIÓN DE FAMILIAS
//
// Se retiró en su día porque «las familias ya viven en los chips de
// `AppTopBar`, que están SIEMPRE arriba y a un toque». Medido sobre `main`, esa
// premisa era incompleta en tres puntos: los chips ocupan 474 px y a 320 sólo
// se ven CUATRO de seis —«Accesorios» no aparece nunca sin arrastrar—, miden 32
// px de alto, y **se recortan bajo el buscador al bajar** (lo afirma
// `app-shell.spec.ts`). No son una entrada suficiente al catálogo.
//
// «Explorar» no es la vieja rejilla «Compra por categoría», que era un
// escaparate con imágenes duplicando unos chips que se creían permanentes: es
// una lista de seis destinos, del tamaño que se toca sin mirar.
//
// LO QUE SE MIDIÓ ANTES DE CAMBIARLO
//
// Tienda enseñaba 6 ofertas de un catálogo de 21 modelos —cuatro de ellas
// Mac—, así que iPad, Watch, AirPods y Accesorios no aparecían en toda la
// pantalla. Y con historial real la intersección con Inicio era **6 de 6**: no
// aportaba ni un producto que no se hubiera visto ya en la pestaña anterior.
// Lo que cambia no es el producto que se enseña, es la FUNCIÓN de la pantalla.
//
// Oportunidades sigue enseñando **todas** las ofertas reales del catálogo. En
// Inicio son un teaser de cuatro; aquí son el conjunto, que es lo que se espera
// de una tienda. No hay «ver todas» porque no hay nada más que ver.
//
// Todo lo que se muestra sale del catálogo real. No hay promociones,
// porcentajes ni disponibilidad inventados: cuando el dato no existe, la
// sección no aparece.
// ============================================================================

export function AppHome() {
  return (
    <div className="pb-10">
      <Encabezado />
      <Explorar />
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
 * Explorar — las seis familias del catálogo.
 *
 * La fuente es `families`, la misma lista que alimenta el menú y los chips: si
 * mañana entra una familia nueva, aparece aquí sola. No se escriben rutas a
 * mano.
 *
 * DOS COLUMNAS, NO UN ESCAPARATE
 *
 * Seis destinos en tres filas ocupan poco y dejan el producto a un dedo. Con
 * una sola columna serían seis filas y empujarían Oportunidades fuera de la
 * primera pantalla; con imágenes volveríamos al escaparate que la #56 retiró.
 * Cada entrada mide 56 px de alto: por encima del objetivo táctil, y se toca
 * sin mirar.
 *
 * Sin iconos: no hay en `Icon` una familia de símbolos que distinga un Mac de
 * un iPad sin inventarlos, y seis iconos aproximados dicen menos que seis
 * nombres.
 */
function Explorar() {
  const { t } = useIdioma()

  return (
    <section aria-labelledby="tienda-explorar" className="mt-6 px-4">
      <h2 id="tienda-explorar" className="text-lg font-bold text-ink">
        {t('app.store.explore')}
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {families.map((familia) => (
          <li key={familia.slug}>
            <Link
              to={`/${familia.slug}`}
              className="flex min-h-14 items-center gap-2 rounded-[14px] border border-line bg-surface px-3 text-[15px] font-semibold text-ink transition-colors active:bg-neutral"
            >
              <span className="min-w-0 flex-1 truncate">{familia.nameKey ? t(familia.nameKey) : familia.name}</span>
              <Icon name="chevron-right" size={16} aria-hidden="true" className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Ayuda para elegir.
 *
 * Una fila, no el bloque amarillo de Inicio: allí el asistente es la pieza
 * principal y aquí es una salida para quien se ha quedado mirando el catálogo
 * sin decidirse. Repetir el bloque grande sería la duplicación que esta pantalla
 * viene a quitar. Lleva al asistente real; no se duplica ni una pregunta suya.
 *
 * DOS ARREGLOS DE LECTURA
 *
 * Pedía el icono `sparkles`, que **no existe** en `Icon`; el componente cae a
 * `paths.info` cuando no encuentra el nombre, así que la fila se leía como un
 * aviso con su ⓘ. Ahora usa `star`, que sí existe.
 *
 * Y la jerarquía estaba invertida: el rótulo grande era «¿No sabes cuál
 * elegir?» —el eyebrow— y el pequeño «Encuentra tu Apple», que es el nombre de
 * la herramienta. Se cambian de sitio: primero a dónde vas, debajo por qué.
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
          <Icon name="star" size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span id="tienda-ayuda" className="block font-semibold text-ink">
            {t('home.finder.title')}
          </span>
          <span className="block text-sm text-muted">{t('home.finder.eyebrow')}</span>
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
  // El `h2` nombra la sección: así cada bloque es una `region` con nombre
  // accesible propio, y se puede llegar a él —o comprobarlo— sin depender de
  // su posición en el árbol. `useId` evita colisiones si el título se repite.
  const id = useId()
  return (
    <section aria-labelledby={id} className="mt-8 first:mt-6">
      <div className="flex items-baseline justify-between gap-3 px-4">
        <h2 id={id} className="text-lg font-bold text-ink">
          {titulo}
        </h2>
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

/**
 * Servicios, al final y en discreto: son el complemento, no el escaparate.
 *
 * TRES, Y COMERCIALES
 *
 * Eran cinco y ocupaban 286 px, casi un tercio de la pantalla, con tres
 * rótulos que se distinguían mal entre sí —«Servicios», «Servicio técnico» y
 * «Ayuda y servicios»—. Se quedan los que afectan a una compra: lo que cambia
 * el precio, dónde comprar en persona y qué pasa después.
 *
 * Se van de aquí el índice genérico `/servicios` y `/soporte`, que además ya
 * tiene sitio propio en Inicio. Ninguna ruta desaparece del producto: sólo deja
 * de repetirse en la pantalla de comercio.
 *
 * «Comprar en tienda» reencuadra `/tiendas`: el destino es el de siempre y no
 * se añade comportamiento —ni tienda favorita, ni horarios, ni disponibilidad—;
 * lo que cambia es que aquí se nombra por lo que se viene a hacer.
 */
function Servicios() {
  const { t } = useIdioma()
  // Etiquetas y rutas ya existentes: no se inventan destinos nuevos.
  const enlaces = [
    { to: '/plan-renove', etiqueta: t('footer.tradeIn') },
    { to: '/tiendas', etiqueta: t('app.store.buyInStore') },
    { to: '/servicio-tecnico', etiqueta: t('footer.repairService') },
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
