import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { useCustomerAuth } from '../lib/customerAuth'
import { isNativeApp } from '../lib/nativeApp'
import { supabaseEnabled } from '../lib/supabase'
import { APARTADOS, esApartado, rutaDeApartado, rutaRaizCuenta, type Apartado } from '../components/account/apartados'
import {
  AddressSection,
  EducationalDiscountSection,
  FavoritesSection,
  OrdersSection,
  PersonalDataSection,
  ReservationsSection,
} from '../components/account/sections'
import { AccountRootNative } from '../components/account/AccountRootNative'

// "Mi cuenta" — Fase 2.
//
// Reúne lo que hoy vive disperso (favoritos, tienda favorita) con lo que
// solo existe con sesión (pedidos persistentes, reservas, direcciones y
// descuento educativo). Todo demostrativo.
//
// ESTA PÁGINA ES EL PUNTO COMÚN DE TODA EL ÁREA
//
// `/cuenta` y `/cuenta/:apartado` la montan las dos. Lo hace a propósito: la
// comprobación de Supabase, el guardia de sesión, los estados de carga y el
// cierre de sesión son los mismos para las ocho direcciones, y repartirlos por
// ocho páginas sería mantener ocho copias de la misma guarda. Lo único que
// cambia según la ruta y según `isNativeApp` es la COMPOSICIÓN.

/** Qué pinta esta pantalla: la lista, un apartado, o la web de siempre. */
function seccionDelApartado(apartado: Apartado, clienteId: string, nativa: boolean) {
  // En la aplicación cada apartado es una pantalla, y su título es el único que
  // hay: por eso allí es `h1`. En la web vive dentro de «Mi cuenta», que ya es
  // el `h1`, y sigue siendo `h2`.
  const nivel = nativa ? (1 as const) : (2 as const)
  switch (apartado) {
    case 'datos':
      return <PersonalDataSection headingLevel={nivel} />
    case 'envio':
      return <AddressSection which="envio" title="Dirección de envío" headingLevel={nivel} />
    case 'facturacion':
      return <AddressSection which="facturacion" title="Dirección de facturación" headingLevel={nivel} />
    case 'pedidos':
      return <OrdersSection clienteId={clienteId} headingLevel={nivel} />
    case 'reservas':
      return <ReservationsSection clienteId={clienteId} headingLevel={nivel} />
    case 'descuento':
      return <EducationalDiscountSection headingLevel={nivel} />
    case 'favoritos':
      return <FavoritesSection headingLevel={nivel} />
  }
}

export function ProfilePage() {
  const { session, cliente, loading, signOut } = useCustomerAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { apartado: segmento } = useParams()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorCierre, setErrorCierre] = useState<string | null>(null)

  // NORMALIZACIÓN DE LA GRAMÁTICA ANTIGUA
  //
  // `/cuenta?apartado=pedidos` fue la dirección de un apartado hasta que las
  // secciones tuvieron ruta propia. Sigue entrando —hay enlaces por ahí— y se
  // traduce a `/cuenta/pedidos` con `replace`: sin `replace` quedaría una
  // entrada de historial que obligaría a pulsar Atrás dos veces para salir.
  //
  // Un valor que no es apartado deja de prometer algo que la pantalla no
  // enseña: se retira el parámetro y se aterriza en la raíz. Y en los dos
  // casos el RESTO de la consulta se conserva: no es nuestra.
  const legacy = params.get('apartado')
  useEffect(() => {
    if (legacy === null) return
    navigate(esApartado(legacy) ? rutaDeApartado(legacy, params) : rutaRaizCuenta(params), { replace: true })
  }, [legacy, navigate, params])

  // Un segmento que no es apartado tampoco pinta nada: vuelve a la raíz. No se
  // manda a la pantalla de 404 porque `/cuenta/loquesea` no es una dirección
  // rota del catálogo, es un apartado que no existe dentro de un área que sí.
  const segmentoInvalido = segmento !== undefined && !esApartado(segmento)
  useEffect(() => {
    if (segmentoInvalido) navigate(rutaRaizCuenta(params), { replace: true })
  }, [segmentoInvalido, navigate, params])

  if (!supabaseEnabled) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Mi cuenta</h1>
        <p className="mt-2 text-muted">Las cuentas necesitan Supabase configurado en este entorno.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-ink hover:underline">
          Volver a la portada
        </Link>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container className="py-20 text-center">
        <p className="text-muted">Cargando tu cuenta…</p>
      </Container>
    )
  }

  // Mientras se cierra la sesión no se dispara el guardia. Al confirmarse el
  // cierre, `session` pasa a null con esta página todavía montada, y sin esta
  // excepción el guardia ganaría la carrera y mandaría a `/login` a quien
  // acaba de salir. Se navega a la portada en cuanto Supabase lo confirma.
  if (!session && !cerrandoSesion) {
    // EL DESTINO ES ESTA PANTALLA, NO EL ÁREA
    //
    // Con un solo `/cuenta` daba igual escribir el destino a mano. Ahora que
    // cada apartado tiene dirección propia, mandar a todo el mundo de vuelta a
    // `/cuenta` perdería el enlace profundo justo cuando más valor tiene: quien
    // abre `/cuenta/pedidos` desde fuera se identifica y quiere sus pedidos.
    //
    // Se compone con `pathname` + `search` de la ubicación real, y `LoginPage`
    // lo valida con `safeRedirect` antes de usarlo: sólo destinos internos.
    const destino = location.pathname + location.search
    return <Navigate to={`/login?redirect=${encodeURIComponent(destino)}`} replace />
  }

  if (!session) {
    // Sólo se llega aquí con `cerrandoSesion` en true: Supabase ya confirmó el
    // cierre y falta un instante para navegar a la portada.
    return (
      <Container className="py-20 text-center">
        <p className="text-muted">Cerrando sesión…</p>
      </Container>
    )
  }

  // Mientras la redirección de compatibilidad está en vuelo no se pinta el
  // apartado antiguo: se enseña la raíz, que es a donde se está yendo.
  const apartado: Apartado | null = esApartado(segmento) ? segmento : null

  async function cerrarSesion() {
    // Se espera a que Supabase confirme el cierre ANTES de navegar. Antes se
    // navegaba primero: si el cierre fallaba, la persona acababa en la portada
    // con la sesión abierta, convencida de haber salido. El guardia de arriba
    // está suspendido mientras tanto.
    //
    // `replace` evita que el botón Atrás devuelva a /cuenta.
    setErrorCierre(null)
    setCerrandoSesion(true)
    const { error } = await signOut()
    if (error) {
      setCerrandoSesion(false)
      setErrorCierre(error)
      return
    }
    navigate('/', { replace: true })
  }

  // ---- Composición de la aplicación nativa ----
  if (isNativeApp) {
    if (apartado === null) {
      return (
        <AccountRootNative
          email={session.user.email ?? ''}
          nombre={cliente?.nombre ?? null}
          cerrandoSesion={cerrandoSesion}
          errorCierre={errorCierre}
          onCerrarSesion={() => void cerrarSesion()}
        />
      )
    }
    // Pantalla secundaria: sin segunda barra de navegación —el «Volver» lo pone
    // `AppTopBar`— y sin repetir el título, que lo pone la propia sección.
    return <Container className="py-6">{seccionDelApartado(apartado, session.user.id, true)}</Container>
  }

  // ---- Composición de la web, sin cambios de disposición ----
  return (
    <Container className="py-12">
      {/* EL CORREO NO COMPITE POR EL ANCHO
          En móvil el bloque de identidad y «Cerrar sesión» se repartían la
          misma fila, y un correo largo acababa partido en tres o cuatro
          líneas. Ahora en móvil van en columna —el correo dispone del ancho
          entero— y a partir de `sm` vuelven a la disposición horizontal de
          siempre.

          El correo NO se trunca: es lo que dice con qué cuenta estás dentro, y
          esconderlo para que quepa sería resolver el hueco equivocado. Se
          permite partir por cualquier punto para que un dominio largo no
          desborde. */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 w-full sm:flex-1">
          <h1 className="text-2xl font-bold text-ink">Mi cuenta</h1>
          <p className="mt-1 text-sm text-muted [overflow-wrap:anywhere]">{session.user.email}</p>
        </div>
        <Button variant="secondary" disabled={cerrandoSesion} onClick={() => void cerrarSesion()}>
          {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </Button>
      </div>

      {errorCierre && (
        <p role="alert" className="mt-4 rounded-[12px] border border-line bg-neutral px-4 py-3 text-sm text-ink">
          No se ha podido cerrar la sesión: {errorCierre}. Sigues dentro de tu cuenta; inténtalo de nuevo.
        </p>
      )}

      <AccesoMisProductos />

      <div className="mt-4 rounded-[12px] border border-line bg-neutral px-4 py-2 text-xs text-muted">
        <strong className="text-ink">Cuenta de demostración.</strong> Los pedidos, reservas y descuentos de esta página
        son de ejemplo: no se cobra ni se envía nada.
      </div>

      {/* `min-w-0` en las dos celdas del grid.
          El menú de apartados es un `flex` sin envolver, así que su ancho
          mínimo es la SUMA de los siete chips: 1088 px. Una celda de grid tiene
          `min-width: auto` y no baja de su contenido, de modo que la columna se
          estiraba a esa medida y arrastraba con ella los campos, que salían
          fuera de la pantalla —789 px de desbordamiento a 320—. Y el
          `overflow-x-auto` del menú no llegaba a actuar: nadie le ponía un
          límite, así que en vez de desplazarse dentro de su caja empujaba la
          página. */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] [&>*]:min-w-0">
        <ProfileNav active={apartado ?? 'datos'} params={params} />
        <div>{seccionDelApartado(apartado ?? 'datos', session.user.id, false)}</div>
      </div>

      {!cliente && (
        <p className="mt-8 text-sm text-danger">
          No se pudo cargar tu ficha de cliente. Recarga la página; si sigue igual, revisa que el esquema de Supabase
          esté aplicado.
        </p>
      )}
    </Container>
  )
}

/** Acceso a «Mis compras» — sólo en la web.
    Dentro de la app tiene pestaña propia en la barra inferior desde la PR #41,
    y repetir el mismo destino en la misma pantalla no ayuda a nadie. En la web
    no hay barra, así que aquí sigue siendo la forma de descubrir que la sección
    existe. Es un enlace y no un apartado más del menú de al lado porque esto es
    otra página. */
function AccesoMisProductos() {
  const t = useT()
  if (isNativeApp) return null
  return (
    <Link
      to="/mis-productos"
      className="mt-6 flex min-h-11 items-center gap-3 rounded-[12px] border border-line bg-surface px-4 py-3 transition-colors hover:border-ink/30"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-neutral text-ink">
        <Icon name="package" size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{t('purchases.title')}</span>
        <span className="block text-sm text-muted">{t('purchases.subtitle')}</span>
      </span>
      <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
    </Link>
  )
}

/**
 * Menú de apartados de la WEB. En escritorio es una columna a la izquierda; en
 * móvil se convierte en una fila de pestañas desplazable, para no comerse
 * la pantalla antes de llegar al contenido.
 *
 * La aplicación ya no lo monta: allí la navegación es la lista vertical de
 * `AccountRootNative`. Lo que cambia aquí es sólo la dirección de cada enlace,
 * que pasa de `?apartado=` a su subruta.
 */
function ProfileNav({ active, params }: { active: Apartado; params: URLSearchParams }) {
  const carril = useRef<HTMLUListElement>(null)
  const activo = useRef<HTMLAnchorElement>(null)

  // EL APARTADO ACTIVO TIENE QUE VERSE
  //
  // En móvil los siete apartados viven en una fila desplazable de ~1.088 px.
  // Abrir el último enseñaba su contenido con el chip fuera del área visible:
  // la pantalla decía una cosa y el menú parecía estar en otra.
  //
  // Se ajusta `scrollLeft` del carril y nada más. `scrollIntoView` habría
  // servido, pero también desplaza la PÁGINA en vertical para acercar el
  // elemento, y aquí no hay ninguna razón para mover la vista de quien acaba de
  // llegar.
  //
  // Corre en cada cambio de apartado, así que cubre la carga inicial, el clic,
  // Atrás y Adelante por igual: todos pasan por un `active` distinto.
  useEffect(() => {
    const acercar = () => {
      const caja = carril.current
      const el = activo.current
      if (!caja || !el) return
      // En escritorio la lista es una columna sin desplazamiento horizontal.
      if (caja.scrollWidth <= caja.clientWidth) return

      // Se comparan cajas reales y no `offsetLeft`: éste se mide contra el
      // ancestro POSICIONADO más cercano, que aquí no es el carril, así que
      // daba una distancia que no correspondía a lo que hay que desplazar. Se
      // vio con el último apartado, que seguía recortado por la derecha.
      const marco = caja.getBoundingClientRect()
      const item = el.getBoundingClientRect()
      if (item.left < marco.left) {
        caja.scrollLeft -= marco.left - item.left
      } else if (item.right > marco.right) {
        caja.scrollLeft += item.right - marco.right
      }
    }

    acercar()

    // Y otra vez cuando el ancho de los rótulos pueda haber cambiado.
    //
    // Las tipografías se cargan con la aplicación, y hasta que llegan el
    // navegador mide con la de reserva: los siete rótulos ocupan menos, el
    // desplazamiento calculado se queda corto y el apartado activo vuelve a
    // salirse al reflujo. Medido: siete píxeles de recorte a 390.
    //
    // El `resize` cubre girar el teléfono y redimensionar la ventana, que
    // cambian el ancho visible del carril.
    let vivo = true
    void document.fonts?.ready.then(() => {
      if (vivo) acercar()
    })
    window.addEventListener('resize', acercar)
    return () => {
      vivo = false
      window.removeEventListener('resize', acercar)
    }
  }, [active])

  return (
    <nav aria-label="Apartados de mi cuenta" className="lg:sticky lg:top-24 lg:self-start">
      <ul ref={carril} className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {APARTADOS.map((item) => {
          const selected = item.id === active
          return (
            <li key={item.id} className="shrink-0 lg:shrink">
              {/* ENLACES DE VERDAD, NO BOTONES QUE SIMULAN NAVEGAR
                  Cada apartado tiene ya una URL propia y copiable, así que un
                  enlace es lo que es: se puede abrir en otra pestaña, se puede
                  compartir, y el historial lo gestiona el router.

                  `replace` en el que ya está activo: volver a pulsarlo no debe
                  añadir una entrada idéntica que luego obligue a un Atrás de
                  más para salir de la pantalla. */}
              <Link
                to={rutaDeApartado(item.id, params)}
                replace={selected}
                ref={selected ? activo : undefined}
                aria-current={selected ? 'page' : undefined}
                className={
                  'flex min-h-11 w-full items-center whitespace-nowrap rounded-[12px] px-4 py-2.5 text-left text-sm font-medium transition-colors lg:whitespace-normal ' +
                  (selected ? 'bg-ink text-white' : 'text-ink hover:bg-neutral')
                }
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
