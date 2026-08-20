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

/** El mismo asset que usan el chat y el panel de agentes. */
const BANANITO = `${import.meta.env.BASE_URL}img/chat/bananito-square.png`

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
  // EL FONDO ES GRIS Y LAS PIEZAS SON BLANCAS
  //
  // Antes todo era blanco sobre blanco y lo único que separaba una cosa de otra
  // era un borde de 1 px, repetido bloque tras bloque. Con el fondo en neutro,
  // cada pieza se agrupa por SUPERFICIE: se pueden retirar casi todos los
  // bordes sin que nada se despegue, y la mitad inferior deja de leerse como
  // una lista de ajustes.
  //
  // El gris vive aquí y no en `main` a propósito: sólo cambia Inicio, no el
  // resto de pantallas de la aplicación.
  return (
    <div className="min-h-full bg-neutral pb-10">
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

/**
 * Superficie blanca sobre el fondo neutro.
 *
 * Ni borde ni sombra: sobre gris, el blanco ya se separa solo. Cambiar los diez
 * bordes por diez sombras habría sido el mismo dibujo con otra tinta y habría
 * dejado la pantalla con aire de panel de control.
 *
 * La elevación queda reservada para el producto —`ProductCardCompact` trae la
 * suya—, así que en esta pantalla lo único que levanta es lo que se vende.
 */
const TARJETA = 'rounded-[16px] bg-surface'

/**
 * Respuesta al pulsar de las piezas que llevan a algún sitio.
 *
 * Un 1 % con `transform`, que no reordena nada, y desactivada con
 * `prefers-reduced-motion`. No hay animación de entrada ni de ruta.
 */
const PULSABLE =
  'transition-transform duration-100 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100'

/**
 * Envoltorio de sección.
 *
 * `banda` pinta la sección sobre un fondo de marca muy claro y a sangre. Es lo
 * que separa de un vistazo lo comercial —Oportunidades— de lo personal
 * —Continúa—, sin tener que duplicar la tarjeta de producto.
 */
function Seccion({
  titulo,
  enlace,
  etiquetaEnlace,
  children,
  banda = false,
}: {
  titulo: string
  enlace?: string
  etiquetaEnlace?: string
  children: React.ReactNode
  banda?: boolean
}) {
  return (
    <section className={banda ? 'mt-8 bg-brand-050 py-6' : 'mt-8'}>
      <div className="flex items-baseline justify-between gap-3 px-4">
        <h2 className="text-xl font-extrabold text-ink">{titulo}</h2>
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
      <header className="px-4 pt-6">
        <h1 className="font-display text-[28px] font-extrabold leading-none text-ink">Hola</h1>
        <p className="mt-2 max-w-[19rem] text-[15px] leading-snug text-muted">
          Identifícate y tendrás aquí tus compras, tus pedidos y el soporte de cada producto.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/login"
            className={`inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white ${PULSABLE}`}
          >
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className={`inline-flex min-h-11 items-center rounded-full bg-surface px-5 text-sm font-semibold text-ink ${PULSABLE}`}
          >
            Crear cuenta
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="flex items-start justify-between gap-4 px-4 pt-6">
      <h1 className="min-w-0 font-display text-[28px] font-extrabold leading-none text-ink">
        {primerNombre ? `Hola, ${primerNombre}` : 'Hola'}
      </h1>
      <Link
        to="/cuenta"
        aria-label="Tu cuenta"
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-ink ${PULSABLE}`}
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
    // COMPACTA, NO ESCONDIDA
    //
    // Antes eran cuatro filas apiladas —rótulo, título, párrafo y botón— que se
    // comían casi un tercio de la primera pantalla y a 320 px la llenaban
    // entera. Ahora el título y la llamada comparten fila, así que el botón
    // deja de costar su propia altura, y el cuerpo baja a 13 px.
    //
    // Sigue siendo el único bloque con el amarillo de marca a sangre, y sobre
    // el fondo gris destaca más que antes sobre el blanco. Se encoge su altura,
    // no su presencia.
    <section aria-labelledby="inicio-finder" className="mt-6 px-4">
      <div className="rounded-[20px] bg-brand px-5 py-4 text-ink">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">{t('home.finder.eyebrow')}</p>
        <div className="mt-1 flex items-center gap-3">
          <h2 id="inicio-finder" className="min-w-0 flex-1 font-display text-[20px] font-extrabold leading-tight">
            {t('home.finder.title')}
          </h2>
          <Link
            to="/elige-tu-apple"
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white ${PULSABLE}`}
          >
            {t('common.start')}
            <Icon name="arrow-right" size={16} aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-2 text-[13px] leading-snug text-ink/80">{t('home.finder.body')}</p>
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
    // La banda de marca muy clara es lo único que distingue esta sección de
    // «Continúa»: misma tarjeta, mismo carril, pero una se lee comercial y la
    // otra personal sin necesidad de un segundo componente de producto.
    <Seccion titulo={t('app.home.deals')} enlace="/tienda" etiquetaEnlace="Ver más" banda>
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
        <Link to="/tiendas" className={`flex min-h-14 items-center gap-3 p-4 ${TARJETA} ${PULSABLE}`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-050 text-ink">
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
    // UN SITIO, NO UNA FILA
    //
    // La misma información de antes —nombre, dirección y el estado que calcula
    // `StoreStatus`— pero compuesta como una ficha: el rótulo de tienda en un
    // círculo de marca, el nombre con peso de título y la llamada separada por
    // una línea. Ni un dato nuevo: no hay horarios, ni distancia, ni servicios
    // inventados.
    <Seccion titulo={t('app.home.yourStore')}>
      <div className="px-4">
        <Link to={`/tiendas/${favoriteStore.slug}`} className={`block p-4 ${TARJETA} ${PULSABLE}`}>
          <span className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-050 text-ink">
              <Icon name="store" size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-bold leading-tight text-ink">{favoriteStore.name}</span>
              <span className="mt-0.5 block truncate text-sm text-muted">{favoriteStore.address}</span>
            </span>
            <StoreStatus store={favoriteStore} className="shrink-0" />
          </span>
          <span className="mt-3 flex min-h-11 items-center gap-1 border-t border-line pt-3 text-sm font-semibold text-ink">
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
    // DOS COSAS DISTINTAS, NO DOS FILAS CLONADAS
    //
    // Antes eran dos tarjetas idénticas —icono gris, título, detalle, galón—,
    // y esa repetición era lo que hacía que el final de Inicio se leyera como
    // la pantalla de Ajustes del sistema.
    //
    // Ahora tienen papeles distintos y se ven distintas: Bananito es la pieza
    // cálida, con su cara y el amarillo de marca; Soporte es la fila
    // utilitaria, más pequeña y sin adornos. Los destinos, el `openChat` y los
    // textos son los mismos.
    <section aria-labelledby="inicio-ayuda" className="mt-8 px-4">
      <h2 id="inicio-ayuda" className="text-xl font-extrabold text-ink">
        ¿Necesitas ayuda?
      </h2>
      <ul className="mt-3 grid gap-3">
        <li>
          <button
            type="button"
            onClick={openChat}
            className={`flex w-full items-center gap-4 rounded-[16px] bg-brand-050 p-4 text-left ${PULSABLE}`}
          >
            {/* El mismo Bananito que ya usan el chat y el panel de agentes: es
                un asset de la marca que existe, no una ilustración nueva.
                Decorativo, así que `alt` vacío; lo nombra el texto de al lado. */}
            <img src={BANANITO} alt="" width={112} height={112} className="h-14 w-14 shrink-0 object-contain" />
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-bold leading-tight text-ink">Chatea con Bananito</span>
              <span className="mt-0.5 block text-sm text-ink/70">Te respondemos en el momento</span>
            </span>
            <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-ink/60" />
          </button>
        </li>
        <li>
          <Link
            to="/soporte"
            className={`flex w-full min-h-14 items-center gap-3 p-4 text-left ${TARJETA} ${PULSABLE}`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral text-muted">
              <Icon name="wrench" size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">Soporte</span>
              <span className="block text-sm text-muted">Ayuda, guías y servicio técnico</span>
            </span>
            <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
          </Link>
        </li>
      </ul>
    </section>
  )
}
