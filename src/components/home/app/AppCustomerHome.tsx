import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'
import { ProductCardCompact } from '../../product/ProductCardCompact'
import { StoreStatus } from '../../store/StoreStatus'
import { useCustomerAuth } from '../../../lib/customerAuth'
import { useStorePreference } from '../../../lib/storePreference'
import { useT } from '../../../lib/i18n'
import { openChat } from '../../../lib/chatLauncher'
import { leerRecientes } from '../../../lib/recentlyViewed'
import { tieneOferta } from '../../../lib/offers'
import { listMyReservations } from '../../../lib/reservations'
import { allModels, getModel } from '../../../data/products'
import type { Model } from '../../../data/types'
import type { DbReservation } from '../../../lib/supabase'

/**
 * Inicio de la aplicación nativa: **qué me interesa ahora**.
 *
 * NO es la portada comercial. Esa vive en `/tienda` y sigue siendo la de la
 * PR #39, entera. Aquí no se vende un catálogo: se enseña lo que esta persona
 * estaba mirando, la función que hace distinta a Banana y las rebajas que
 * existen de verdad.
 *
 * DE DÓNDE SALE CADA COSA
 *
 * Todo de datos que ya existen: el historial local de vistos, el catálogo, las
 * reservas del cliente y su tienda favorita. **Ni una cifra inventada.** Lo que
 * haría rica esta pantalla —estado de un envío, garantía, AppleCare— no existe
 * en el modelo, y fingirlo se lee como un producto terminado que no cumple.
 *
 * LOS BLOQUES CONDICIONALES NO DEJAN HUECO
 *
 * «Avisos» y «Continúa» devuelven `null` cuando no tienen nada: sin sesión y en
 * la primera visita, Inicio son cuatro bloques con contenido real y ningún
 * esqueleto esperando datos que no van a llegar.
 *
 * LA ÚNICA COSTURA PARA PRUEBAS
 *
 * `listarReservas` es una prop opcional que por defecto ES `listMyReservations`.
 * No hay ninguna rama de test en el componente: producción llama exactamente a
 * lo que llamaba. Existe porque el aviso de reserva sólo se puede demostrar con
 * una reserva `disponible`, y eso vive en Supabase, que en las pruebas no está.
 * La alternativa —interceptar la red— probaría una API imaginaria en vez de
 * esta pantalla.
 *
 * LO QUE SE FUE, Y POR QUÉ
 *
 * Las tarjetas de «Mis compras» y «Mis pedidos» y el botón final de «Tienda»:
 * los tres son destinos de la barra inferior, a un toque desde cualquier
 * pantalla. Repetirlos aquí ocupaba media Inicio para no llevar a ningún sitio
 * nuevo. Las rutas siguen intactas; lo que se quita es la duplicación.
 */
export function AppCustomerHome({ listarReservas = listMyReservations }: { listarReservas?: ListarReservas } = {}) {
  return (
    <div className="pb-10">
      <Saludo />
      <Avisos listarReservas={listarReservas} />
      <EncuentraTuApple />
      <Continua />
      <Oportunidades />
      <TuTienda />
      <Ayuda />
    </div>
  )
}

/** Envoltorio de sección, con el mismo ritmo vertical que usa `/tienda`. */
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
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-3 px-4">
        <h2 className="text-lg font-bold text-ink">{titulo}</h2>
        {enlace && (
          // `min-h-11` y el margen negativo: el enlace se ve como texto pero se
          // toca como un control de 44 px, sin separarse de la línea del título.
          <Link
            to={enlace}
            className="-my-3 inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-ink underline underline-offset-2"
          >
            {etiquetaEnlace}
          </Link>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

/**
 * Carrusel horizontal.
 *
 * El `px-4` va dentro y no en el padre para que la primera tarjeta quede
 * alineada con los títulos y la última pueda asomar por el borde: es lo que
 * dice, sin flechas ni puntos, que ahí se puede arrastrar.
 */
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
 * 1 · Saludo.
 *
 * Corto a propósito: el contenido tiene que empezar pronto. Sólo se saluda por
 * el nombre si lo hay —un «Hola, null» o un «Hola, cliente» es peor que un hola
 * a secas—, y el `h1` de la pantalla vive aquí.
 */
function Saludo() {
  const { session, cliente } = useCustomerAuth()
  const primerNombre = cliente?.nombre?.trim().split(/\s+/)[0]

  if (!session) {
    return (
      <header className="px-4 pt-5">
        <h1 className="text-2xl font-extrabold text-ink">Hola</h1>
        <p className="mt-1 text-sm text-muted">
          Identifícate y tendrás aquí tus compras, tus pedidos y el soporte de cada producto.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm font-semibold text-ink"
          >
            Crear cuenta
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="flex items-start justify-between gap-4 px-4 pt-5">
      <h1 className="min-w-0 text-2xl font-extrabold text-ink">{primerNombre ? `Hola, ${primerNombre}` : 'Hola'}</h1>
      <Link
        to="/cuenta"
        aria-label="Tu cuenta"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral text-ink"
      >
        <Icon name="user" size={20} aria-hidden="true" />
      </Link>
    </header>
  )
}

/**
 * 2 · Avisos.
 *
 * Sólo entra lo que tiene estado real en el servidor: una reserva que ha pasado
 * a `disponible`. Es la única señal del modelo actual que merece interrumpir,
 * porque significa que hay una unidad esperando a esta persona.
 *
 * Los seguimientos de disponibilidad de favoritos NO entran todavía: viven en
 * `localStorage` con su propia lista de notificaciones, y traerlos aquí pedía
 * una segunda arquitectura de avisos. Queda anotado, no fingido.
 *
 * Sin sesión no se consulta nada. Con cero avisos no se pinta nada: ni marco,
 * ni hueco reservado.
 */
type ListarReservas = typeof listMyReservations

function Avisos({ listarReservas }: { listarReservas: ListarReservas }) {
  const { session, cliente } = useCustomerAuth()
  const [listas, setListas] = useState<DbReservation[]>([])

  useEffect(() => {
    const clienteId = cliente?.id
    if (!session || !clienteId) {
      setListas([])
      return
    }
    let vigente = true
    void listarReservas(clienteId).then(({ items }) => {
      if (!vigente) return
      setListas(
        items
          .map((i) => i.reservation)
          .filter((r) => r.estado === 'disponible')
          .slice(0, 2),
      )
    })
    return () => {
      vigente = false
    }
  }, [session, cliente?.id, listarReservas])

  if (listas.length === 0) return null

  return (
    <section aria-label="Avisos" className="mt-6 px-4">
      <ul className="grid gap-3">
        {listas.map((reserva) => (
          <li key={reserva.id}>
            <Link
              to="/cuenta?apartado=reservas"
              className="flex min-h-14 items-center gap-3 rounded-[16px] border border-brand bg-brand-050 p-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brand text-ink">
                <Icon name="package" size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">Tu reserva está lista</span>
                <span className="block truncate text-sm text-ink/70">
                  {reserva.model_name} · {reserva.variant_label}
                </span>
              </span>
              <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-ink/70" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * 3 · Encuentra tu Apple.
 *
 * La pieza principal, y la única con el amarillo de marca a sangre. Va antes
 * que los productos a propósito: es lo que Banana ofrece y una tienda genérica
 * no. Lleva al asistente de verdad; aquí no se duplica ni una pregunta suya.
 */
function EncuentraTuApple() {
  const t = useT()

  return (
    <section aria-labelledby="inicio-finder" className="mt-6 px-4">
      <div className="rounded-[20px] bg-brand p-5 text-ink">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">{t('home.finder.eyebrow')}</p>
        <h2 id="inicio-finder" className="mt-1 font-display text-2xl font-extrabold leading-tight">
          {t('home.finder.title')}
        </h2>
        <p className="mt-2 text-sm text-ink/80">{t('home.finder.body')}</p>
        <Link
          to="/elige-tu-apple"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white"
        >
          {t('common.start')}
          <Icon name="arrow-right" size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

/**
 * 4 · Continúa donde lo dejaste.
 *
 * El historial es local y guarda sólo `familia/slug`: lo justo para volver a
 * buscar el modelo en el catálogo. Lo que no se resuelve contra el catálogo no
 * se pinta —un producto retirado desaparece solo—, y con cero vistos la sección
 * entera no existe.
 */
function Continua() {
  const t = useT()
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
 * 5 · Oportunidades.
 *
 * Sólo modelos con `previousPrice` de verdad. La tarjeta es la misma que usa
 * `/tienda`, y eso importa más de lo que parece: `presentacionDeTarjeta`
 * resuelve la **variante concreta** que está rebajada y enseña su precio junto
 * a SU precio anterior. Pintar el precio «desde» del modelo al lado del anterior
 * de otra configuración daría un descuento que nadie puede comprar.
 *
 * Sin ofertas en el catálogo, la sección desaparece sola.
 */
function Oportunidades() {
  const t = useT()
  const enOferta = useMemo(() => allModels.filter(tieneOferta).slice(0, 8), [])

  if (enOferta.length === 0) return null

  return (
    <Seccion titulo={t('app.home.deals')} enlace="/tienda" etiquetaEnlace="Ver más">
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
 * 6 · Tu tienda.
 *
 * Con favorita, su ficha con el estado de apertura que ya calcula
 * `StoreStatus` a partir del horario —no se inventa aquí una segunda lógica de
 * horarios—. Sin favorita, la invitación compacta a elegirla: sin modal y sin
 * tapar nada.
 */
function TuTienda() {
  const t = useT()
  const { favoriteStore } = useStorePreference()

  if (!favoriteStore) {
    return (
      <section className="mt-8 px-4">
        <Link
          to="/tiendas"
          className="flex min-h-14 items-center gap-3 rounded-[16px] border border-line bg-surface p-4"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-neutral text-ink">
            <Icon name="store" size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Elige tu tienda</span>
            <span className="block text-sm text-muted">Para tenerla siempre a mano</span>
          </span>
          <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
        </Link>
      </section>
    )
  }

  return (
    <Seccion titulo={t('app.home.yourStore')}>
      <div className="px-4">
        <Link to={`/tiendas/${favoriteStore.slug}`} className="block rounded-[16px] border border-line bg-surface p-4">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{favoriteStore.name}</span>
              <span className="block truncate text-sm text-muted">{favoriteStore.address}</span>
            </span>
            <StoreStatus store={favoriteStore} className="shrink-0" />
          </span>
          <span className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink">
            Ver la tienda
            <Icon name="chevron-right" size={16} aria-hidden="true" />
          </span>
        </Link>
      </div>
    </Seccion>
  )
}

/**
 * 7 · Ayuda.
 *
 * Lo único de la lista anterior que no estaba ya en la barra inferior. El chat
 * es un `<button>`: abre un diálogo, y un enlace que no navega miente al lector
 * de pantalla y al menú contextual del navegador.
 */
function Ayuda() {
  return (
    <section aria-labelledby="inicio-ayuda" className="mt-8 px-4">
      <h2 id="inicio-ayuda" className="text-lg font-bold text-ink">
        ¿Necesitas ayuda?
      </h2>
      <ul className="mt-3 grid gap-3">
        <li>
          <Link to="/soporte" className={CLASES_ACCESO}>
            <Contenido icono="chat" titulo="Soporte" detalle="Ayuda, guías y servicio técnico" />
          </Link>
        </li>
        <li>
          <button type="button" onClick={openChat} className={CLASES_ACCESO}>
            <Contenido icono="chat" titulo="Chatea con Bananito" detalle="Te respondemos en el momento" />
          </button>
        </li>
      </ul>
    </section>
  )
}

const CLASES_ACCESO =
  'flex w-full min-h-14 items-center gap-3 rounded-[16px] border border-line bg-surface p-4 text-left'

function Contenido({ icono, titulo, detalle }: { icono: string; titulo: string; detalle: string }) {
  return (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-neutral text-ink">
        <Icon name={icono} size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{titulo}</span>
        <span className="block text-sm text-muted">{detalle}</span>
      </span>
      <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
    </>
  )
}
