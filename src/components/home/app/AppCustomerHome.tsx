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
 * Cuántas ofertas caben en Inicio.
 *
 * Cuatro, exactas. Eran ocho, y ocho es un escaparate: Inicio no es Tienda, que
 * tiene pestaña propia y su propia sección de oportunidades. El resto se
 * alcanza con «Ver más».
 */
const MAX_OPORTUNIDADES = 4

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
/**
 * Los modelos del historial local que todavía existen en el catálogo.
 *
 * Vive fuera de la sección porque Oportunidades necesita saber cuáles se van a
 * pintar para no repetirlos: es la MISMA lista, no una segunda lectura.
 */
function useRecientes(): Model[] {
  const [modelos, setModelos] = useState<Model[]>([])
  useEffect(() => {
    setModelos(
      leerRecientes()
        .map((id) => {
          const [familia, slug] = id.split('/')
          return getModel(familia, slug)
        })
        .filter((m): m is Model => Boolean(m))
        .slice(0, 6),
    )
  }, [])
  return modelos
}

export function AppCustomerHome({ listarReservas = listMyReservations }: { listarReservas?: ListarReservas } = {}) {
  // EL MISMO PRODUCTO NO PUEDE SALIR DOS VECES
  //
  // Los dos carriles se calculaban por separado, y con historial real la
  // primera tarjeta de «Seguías mirando» y la primera de «Oportunidades» eran
  // literalmente el mismo iPhone rebajado, en dos pantallazos seguidos.
  //
  // Se resuelven aquí en orden: primero lo personal, y Oportunidades descarta
  // lo que ya se está enseñando arriba. Se excluye por lo que se PINTA —los
  // modelos resueltos contra el catálogo—, no por lo que hay en
  // `localStorage`: un reciente que ya no existe no debe descartar nada.
  const recientes = useRecientes()
  const yaVistos = recientes.map((m) => `${m.family}/${m.slug}`).join('|')
  const ofertas = useMemo(() => {
    const vistos = new Set(yaVistos ? yaVistos.split('|') : [])
    return allModels
      .filter(tieneOferta)
      .filter((m) => !vistos.has(`${m.family}/${m.slug}`))
      .slice(0, MAX_OPORTUNIDADES)
  }, [yaVistos])

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
      <Identidad />
      {/* EL AVISO VA ANTES QUE EL FINDER
          Una reserva que ha pasado a `disponible` es información temporal y
          accionable: hay una unidad esperando. El Finder es una herramienta
          permanente, y puede esperar un dedo más abajo. Sin avisos este bloque
          no pinta nada y el Finder pasa a ser la primera pieza. */}
      <Avisos listarReservas={listarReservas} />
      <EncuentraTuApple />
      <SeguiasMirando modelos={recientes} />
      <Oportunidades modelos={ofertas} />
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
 * 1 · Identidad.
 *
 * UNA LÍNEA, NO UN TITULAR
 *
 * Era `Hola, Elena` a 28 px de tipografía display: el texto más grande de la
 * pantalla para la única información que quien abre la aplicación ya tiene.
 * Medido, se comía 68 px con sesión y 182 sin ella, y empujaba el Finder hasta
 * y=258 en las tres anchuras.
 *
 * Ahora es una fila: el nombre a la izquierda y el acceso a la cuenta a la
 * derecha. Sigue habiendo un `h1` —la pantalla necesita su encabezado— pero
 * deja de ser lo que más pesa. Sin nombre se dice «Mi cuenta», que es cierto
 * siempre: ni se deriva del correo, ni se inventan iniciales, ni hay avatar.
 */
function Identidad() {
  const { session, cliente } = useCustomerAuth()
  const primerNombre = cliente?.nombre?.trim().split(/\s+/)[0]

  if (!session) {
    // Invitado: la misma invitación de antes, en dos líneas en vez de en un
    // bloque de 182 px. Una sola frase de contexto y los dos destinos de
    // siempre; no se prometen ventajas que no existan.
    return (
      <header className="px-4 pt-5">
        <h1 className="text-[17px] font-bold leading-tight text-ink">Entra en tu cuenta</h1>
        <p className="mt-1 text-sm leading-snug text-muted">Compras, pedidos y soporte en un mismo sitio.</p>
        <div className="mt-3 flex flex-wrap gap-2">
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
    <header className="flex items-center justify-between gap-3 px-4 pt-5">
      <h1 className="min-w-0 truncate text-[17px] font-bold leading-tight text-ink">{primerNombre || 'Mi cuenta'}</h1>
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
    <section aria-label="Avisos" className="mt-4 px-4">
      <ul className="grid gap-3">
        {listas.map((reserva) => (
          <li key={reserva.id}>
            <Link
              to="/cuenta/reservas"
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
 * La pieza distintiva de Inicio, y la única con el amarillo de marca a sangre.
 * Lleva al asistente de verdad; aquí no se duplica ni una pregunta suya.
 *
 * EL DESCARGO SALE DE LA TARJETA
 *
 * `home.finder.body` termina en «Orientación demostrativa», y esa frase ocupaba
 * la tercera línea de la única pieza protagonista de la pantalla. No se retira
 * —el prototipo no puede presentar como real una recomendación que no lo es—:
 * baja a una nota pequeña justo debajo, donde sigue leyéndose y no compite.
 *
 * El texto NO se parte en dos claves: `home.finder.body` lo comparte la portada
 * web, y tocarlo cambiaría una superficie que esta entrega no toca.
 */
function EncuentraTuApple() {
  const t = useT()

  return (
    <section aria-labelledby="inicio-finder" className="mt-5 px-4">
      <div className="rounded-[20px] bg-brand px-5 py-4 text-ink">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">{t('home.finder.eyebrow')}</p>
        <div className="mt-1.5 flex items-center gap-3">
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
      </div>
      <p className="mt-2 px-1 text-xs leading-snug text-muted">{t('home.finder.body')}</p>
    </section>
  )
}

/**
 * 4 · Seguías mirando.
 *
 * El historial es local y guarda sólo `familia/slug`. La lista llega ya
 * resuelta desde la composición —la necesita también Oportunidades para no
 * repetir producto—, así que aquí sólo se pinta. Con cero vistos la sección
 * entera no existe.
 *
 * Las tarjetas van en variante `recent`: mismo producto, misma variante, mismo
 * destino y mismo favorito, pero **sin presentación de oferta**. Antes este
 * carril enseñaba distintivos de descuento y precios tachados, y lo personal
 * se leía igual que el escaparate de abajo.
 */
function SeguiasMirando({ modelos }: { modelos: Model[] }) {
  if (modelos.length === 0) return null

  return (
    <Seccion titulo="Seguías mirando">
      <Carrusel etiqueta="Seguías mirando">
        {modelos.map((m) => (
          <li key={`${m.family}/${m.slug}`} className="snap-start">
            <ProductCardCompact model={m} variant="recent" />
          </li>
        ))}
      </Carrusel>
    </Seccion>
  )
}

/**
 * 5 · Oportunidades.
 *
 * Sólo modelos con `previousPrice` de verdad, **cuatro como mucho** y ninguno
 * que ya esté arriba en «Seguías mirando». La tarjeta es la misma que usa
 * `/tienda`, y eso importa más de lo que parece: `presentacionDeTarjeta`
 * resuelve la **variante concreta** que está rebajada y enseña su precio junto
 * a SU precio anterior. Pintar el precio «desde» del modelo al lado del
 * anterior de otra configuración daría un descuento que nadie puede comprar.
 *
 * Sin ofertas que enseñar, la sección desaparece sola.
 */
function Oportunidades({ modelos }: { modelos: Model[] }) {
  const t = useT()

  if (modelos.length === 0) return null

  return (
    // La banda de marca muy clara separa lo comercial de lo personal. Ahora no
    // es lo único que las distingue —las tarjetas de arriba ya no se presentan
    // como oferta—, pero sigue diciendo de un vistazo qué es cada carril.
    <Seccion titulo={t('app.home.deals')} enlace="/tienda" etiquetaEnlace="Ver más" banda>
      <Carrusel etiqueta={t('app.home.deals')}>
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
 * 6 · Tu tienda.
 *
 * UNA PIEZA, CON FAVORITA Y SIN ELLA
 *
 * Antes eran dos composiciones distintas: sin favorita, una fila; con favorita,
 * un `<h2>` de sección, una ficha y **una segunda llamada «Ver la tienda»** que
 * repetía el destino de la propia ficha. Tres elementos para un enlace.
 *
 * Ahora es la misma fila en los dos casos y cambia lo que dice, no su forma ni
 * su sitio. El estado de apertura lo sigue calculando `StoreStatus` a partir
 * del horario: aquí no hay una segunda lógica, ni distancia, ni servicios.
 */
function TuTienda() {
  const { favoriteStore } = useStorePreference()

  const destino = favoriteStore ? `/tiendas/${favoriteStore.slug}` : '/tiendas'

  return (
    <section className="mt-6 px-4">
      <Link to={destino} className={`flex min-h-14 items-center gap-3 p-4 ${TARJETA} ${PULSABLE}`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-050 text-ink">
          <Icon name="store" size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">
            {favoriteStore ? favoriteStore.name : 'Elige tu tienda'}
          </span>
          <span className="block truncate text-sm text-muted">
            {favoriteStore ? favoriteStore.address : 'Para tenerla siempre a mano'}
          </span>
        </span>
        {/* El estado sólo aparece cuando hay tienda; `shrink-0` para que no lo
            aplaste el nombre y `truncate` arriba para que no lo empuje fuera. */}
        {favoriteStore && <StoreStatus store={favoriteStore} className="shrink-0" />}
        <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
      </Link>
    </section>
  )
}

/**
 * 7 · Ayuda.
 *
 * Lo único de la lista anterior que no estaba ya en la barra inferior. El chat
 * es un `<button>`: abre un diálogo, y un enlace que no navega miente al lector
 * de pantalla y al menú contextual del navegador.
 *
 * SIN ENCABEZADO
 *
 * Tenía un `<h2>` «¿Necesitas ayuda?» para dos accesos. Un título de sección
 * que sólo precede a dos filas no ordena nada: añade un quinto encabezado a la
 * pantalla y alarga el final. Las dos piezas se explican solas.
 *
 * Siguen viéndose distintas porque tienen papeles distintos: Bananito es la
 * pieza cálida, con su cara y el amarillo de marca; Soporte es la fila
 * utilitaria. Los destinos, el `openChat` y los textos no cambian.
 */
function Ayuda() {
  return (
    <section aria-label="Ayuda" className="mt-6 px-4">
      <ul className="grid gap-3">
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
            className={`flex min-h-14 w-full items-center gap-3 p-4 text-left ${TARJETA} ${PULSABLE}`}
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
