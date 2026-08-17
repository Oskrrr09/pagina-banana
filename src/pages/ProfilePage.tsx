import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { useCustomerAuth } from '../lib/customerAuth'
import { useStore } from '../lib/store'
import { isNativeApp } from '../lib/nativeApp'
import { useStorePreference } from '../lib/storePreference'
import { listMyOrders } from '../lib/orderSync'
import {
  cancelReservation,
  describeReservationStatus,
  listMyReservations,
  type ReservationWithPosition,
} from '../lib/reservations'
import { ACCEPTED_ACCEPT_ATTR, describeStatus, uploadEducationalProof } from '../lib/educationalDiscount'
import { supabaseEnabled, type DbAddress, type DbOrder } from '../lib/supabase'
import { ISLAS } from '../lib/checkoutState'
import { euro } from '../lib/format'

// "Mi cuenta" — Fase 2.
//
// Reúne lo que hoy vive disperso (favoritos, tienda favorita) con lo que
// solo existe con sesión (pedidos persistentes, reservas, direcciones y
// descuento educativo). Todo demostrativo.

const EMPTY_ADDRESS: DbAddress = { calle: '', ciudad: '', isla: '', cp: '' }

// Apartados del menú lateral, en el orden en que se muestran.
const APARTADOS = [
  { id: 'datos', label: 'Datos personales' },
  { id: 'envio', label: 'Dirección de envío' },
  { id: 'facturacion', label: 'Dirección de facturación' },
  { id: 'pedidos', label: 'Mis pedidos' },
  { id: 'reservas', label: 'Mis reservas' },
  { id: 'descuento', label: 'Descuento educativo' },
  { id: 'favoritos', label: 'Favoritos y tienda' },
] as const

type Apartado = (typeof APARTADOS)[number]['id']

/**
 * El apartado que pide la URL, si pide alguno válido.
 *
 * `/cuenta?apartado=pedidos` abre «Mis pedidos» en vez de «Datos personales».
 * Es un enlace profundo mínimo y no una ruta nueva: la cuenta sigue siendo una
 * sola pantalla con un menú, y convertir cada apartado en ruta sería rehacer
 * el área entera para resolver un enlace.
 *
 * Un valor desconocido se ignora en vez de romper: llegar a la cuenta y no ver
 * nada porque alguien escribió mal un parámetro sería peor que abrir el
 * apartado de siempre.
 */
function apartadoDeLaUrl(valor: string | null): Apartado {
  const encontrado = APARTADOS.find((a) => a.id === valor)
  return encontrado ? encontrado.id : 'datos'
}

/** ¿La URL pide algo que no es un apartado? */
function apartadoInvalido(valor: string | null): boolean {
  return valor !== null && !APARTADOS.some((a) => a.id === valor)
}

/**
 * La dirección de un apartado, conservando el resto de la URL.
 *
 * «Datos personales» es el estado canónico de `/cuenta`, así que su enlace
 * **quita** el parámetro en vez de escribir `?apartado=datos`. Llegar con ese
 * valor explícito sigue siendo válido —hay enlaces por ahí—, pero no es lo que
 * la aplicación genera.
 *
 * Se parte de los parámetros actuales y se toca **sólo** `apartado`: si alguien
 * llega con algo más en la URL, no se lo borramos por el camino.
 */
function urlDelApartado(id: Apartado, params: URLSearchParams): string {
  const siguientes = new URLSearchParams(params)
  if (id === 'datos') siguientes.delete('apartado')
  else siguientes.set('apartado', id)
  const cadena = siguientes.toString()
  return cadena ? `/cuenta?${cadena}` : '/cuenta'
}

export function ProfilePage() {
  const { session, cliente, loading, signOut } = useCustomerAuth()
  const navigate = useNavigate()
  const t = useT()
  const [params] = useSearchParams()
  // LA URL ES LA FUENTE DE VERDAD, Y NO UNA COPIA
  //
  // Antes esto era un `useState` sembrado desde la URL, y a partir de ahí
  // mandaba el menú. Con eso, `/cuenta?apartado=pedidos` abría Pedidos, se
  // pulsaba Reservas, la pantalla cambiaba… y la URL seguía diciendo
  // `pedidos`. Copiar el enlace daba otro sitio, Atrás no volvía al apartado
  // anterior y el enlace profundo dejaba de ser cierto tras el primer clic.
  //
  // Ahora el apartado se DERIVA de la URL en cada render. No hay estado que
  // pueda desincronizarse, así que Atrás y Adelante funcionan sin que este
  // componente sepa nada de historial: los gestiona el router.
  const apartado = apartadoDeLaUrl(params.get('apartado'))
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  // Un `?apartado=banana` abre Datos personales, que es lo razonable. Pero
  // dejar el parámetro puesto haría que la URL siguiera prometiendo algo que la
  // pantalla no enseña, así que se limpia — con `replace`, para no meter una
  // entrada de historial que nadie ha pedido.
  const invalido = apartadoInvalido(params.get('apartado'))
  useEffect(() => {
    if (invalido) navigate(urlDelApartado('datos', params), { replace: true })
  }, [invalido, navigate, params])
  const [errorCierre, setErrorCierre] = useState<string | null>(null)

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
    return <Navigate to="/login?redirect=%2Fcuenta" replace />
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
        <Button
          variant="secondary"
          disabled={cerrandoSesion}
          onClick={async () => {
            // Se espera a que Supabase confirme el cierre ANTES de navegar.
            // Antes se navegaba primero: si el cierre fallaba, la persona
            // acababa en la portada con la sesión abierta, convencida de haber
            // salido. El guardia de arriba está suspendido mientras tanto.
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
          }}
        >
          {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </Button>
      </div>

      {errorCierre && (
        <p role="alert" className="mt-4 rounded-[12px] border border-line bg-neutral px-4 py-3 text-sm text-ink">
          No se ha podido cerrar la sesión: {errorCierre}. Sigues dentro de tu cuenta; inténtalo de nuevo.
        </p>
      )}

      {/* Acceso a «Mis compras» — sólo en la web.
          Dentro de la app tiene pestaña propia en la barra inferior desde la
          PR #41, y repetir el mismo destino en la misma pantalla no ayuda a
          nadie. En la web no hay barra, así que aquí sigue siendo la forma de
          descubrir que la sección existe. Es un enlace y no un apartado más
          del menú de al lado porque el menú cambia de sección sin navegar, y
          esto sí es otra página. */}
      {!isNativeApp && (
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
      )}

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
        <ProfileNav active={apartado} params={params} />
        <div>
          {apartado === 'datos' && <PersonalDataSection />}
          {apartado === 'envio' && <AddressSection which="envio" title="Dirección de envío" />}
          {apartado === 'facturacion' && <AddressSection which="facturacion" title="Dirección de facturación" />}
          {apartado === 'pedidos' && <OrdersSection clienteId={session.user.id} />}
          {apartado === 'reservas' && <ReservationsSection clienteId={session.user.id} />}
          {apartado === 'descuento' && <EducationalDiscountSection />}
          {apartado === 'favoritos' && <FavoritesSection />}
        </div>
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

/**
 * Menú de apartados. En escritorio es una columna a la izquierda; en
 * móvil se convierte en una fila de pestañas desplazable, para no comerse
 * la pantalla antes de llegar al contenido.
 */
function ProfileNav({ active, params }: { active: Apartado; params: URLSearchParams }) {
  const carril = useRef<HTMLUListElement>(null)
  const activo = useRef<HTMLAnchorElement>(null)

  // EL APARTADO ACTIVO TIENE QUE VERSE
  //
  // En móvil los siete apartados viven en una fila desplazable de ~1.088 px.
  // Abrir `/cuenta?apartado=favoritos` enseñaba Favoritos con su botón fuera
  // del área visible: la pantalla decía una cosa y el menú parecía estar en
  // otra.
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
                to={urlDelApartado(item.id, params)}
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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Aviso de guardado que se anuncia a lectores de pantalla. */
function SaveFeedback({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  return (
    <p role="status" aria-live="polite" className="min-h-5 text-xs">
      {state === 'saving' && <span className="text-muted">Guardando…</span>}
      {state === 'saved' && <span className="text-ink">Guardado.</span>}
      {state === 'error' && <span className="text-danger">No se pudo guardar. Inténtalo de nuevo.</span>}
    </p>
  )
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function PersonalDataSection() {
  const t = useT()
  const { cliente, updateProfile } = useCustomerAuth()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [state, setState] = useState<SaveState>('idle')

  useEffect(() => {
    setNombre(cliente?.nombre ?? '')
    setTelefono(cliente?.telefono ?? '')
  }, [cliente])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setState('saving')
    const { error } = await updateProfile({
      nombre: nombre.trim() || null,
      telefono: telefono.trim() || null,
    })
    setState(error ? 'error' : 'saved')
  }

  return (
    <Section title="Datos personales">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label={t('checkout.fullName')}>
          {(props) => (
            <input
              {...props}
              className="field"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          )}
        </Field>
        <Field label="Teléfono">
          {(props) => (
            <input
              {...props}
              type="tel"
              className="field"
              autoComplete="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          )}
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={state === 'saving'}>
            Guardar datos
          </Button>
          <div className="mt-2">
            <SaveFeedback state={state} />
          </div>
        </div>
      </form>
    </Section>
  )
}

function AddressSection({ which, title }: { which: 'envio' | 'facturacion'; title: string }) {
  const { cliente, updateProfile } = useCustomerAuth()
  const stored = which === 'envio' ? cliente?.direccion_envio : cliente?.direccion_facturacion
  // La "otra" dirección, para poder copiarla.
  const otra = which === 'envio' ? cliente?.direccion_facturacion : cliente?.direccion_envio
  const otraLabel = which === 'envio' ? 'facturación' : 'envío'

  const [address, setAddress] = useState<DbAddress>(EMPTY_ADDRESS)
  const [state, setState] = useState<SaveState>('idle')
  const [copiedNotice, setCopiedNotice] = useState(false)

  useEffect(() => {
    setAddress(stored ?? EMPTY_ADDRESS)
  }, [stored])

  function set(patch: Partial<DbAddress>) {
    setAddress((prev) => ({ ...prev, ...patch }))
    setState('idle')
  }

  // Copiar rellena el formulario pero NO guarda: así se puede ajustar
  // algo (un piso distinto, por ejemplo) antes de confirmar.
  function copiarDeLaOtra() {
    if (!otra) return
    setAddress(otra)
    setState('idle')
    setCopiedNotice(true)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setState('saving')
    setCopiedNotice(false)
    const isEmpty = Object.values(address).every((v) => !v.trim())
    const { error } = await updateProfile(
      which === 'envio'
        ? { direccion_envio: isEmpty ? null : address }
        : { direccion_facturacion: isEmpty ? null : address },
    )
    setState(error ? 'error' : 'saved')
  }

  const otraTieneDatos = otra ? Object.values(otra).some((v) => v?.trim()) : false

  return (
    <Section
      title={title}
      description={
        which === 'envio' ? 'Se usa para rellenar el checkout más rápido.' : 'La usamos en la factura del pedido.'
      }
    >
      <form onSubmit={save} className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
        {otraTieneDatos && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] bg-neutral p-3">
            <Button type="button" variant="secondary" size="sm" onClick={copiarDeLaOtra}>
              Copiar dirección de {otraLabel}
            </Button>
            <span role="status" aria-live="polite" className="text-xs text-muted">
              {copiedNotice ? 'Copiada. Revísala y pulsa Guardar.' : 'Rellena este formulario con la otra dirección.'}
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Calle y número" full>
            {(props) => (
              <input
                {...props}
                className="field"
                autoComplete={which === 'envio' ? 'shipping street-address' : 'billing street-address'}
                value={address.calle}
                onChange={(e) => set({ calle: e.target.value })}
              />
            )}
          </Field>
          <Field label="Ciudad">
            {(props) => (
              <input
                {...props}
                className="field"
                value={address.ciudad}
                onChange={(e) => set({ ciudad: e.target.value })}
              />
            )}
          </Field>
          <Field label="Isla">
            {(props) => (
              <select {...props} className="field" value={address.isla} onChange={(e) => set({ isla: e.target.value })}>
                <option value="">Selecciona una isla</option>
                {ISLAS.map((isla) => (
                  <option key={isla} value={isla}>
                    {isla}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Código postal">
            {(props) => (
              <input
                {...props}
                className="field"
                inputMode="numeric"
                value={address.cp}
                onChange={(e) => set({ cp: e.target.value })}
              />
            )}
          </Field>
        </div>

        <div className="mt-4">
          <Button type="submit" disabled={state === 'saving'}>
            Guardar dirección
          </Button>
          <div className="mt-2">
            <SaveFeedback state={state} />
          </div>
        </div>
      </form>
    </Section>
  )
}

function OrdersSection({ clienteId }: { clienteId: string }) {
  const [orders, setOrders] = useState<DbOrder[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    listMyOrders(clienteId).then(({ orders: rows, error }) => {
      if (!active) return
      if (error) {
        setStatus('error')
        return
      }
      setOrders(rows)
      setStatus('ready')
    })
    return () => {
      active = false
    }
  }, [clienteId])

  return (
    <Section title="Mis pedidos" description="Pedidos demostrativos hechos con la sesión iniciada.">
      {status === 'loading' && <p className="text-sm text-muted">Cargando…</p>}
      {status === 'error' && <p className="text-sm text-danger">No se pudieron cargar los pedidos.</p>}
      {status === 'ready' && orders.length === 0 && (
        <p className="rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
          Todavía no has hecho ningún pedido con la sesión iniciada.
        </p>
      )}
      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-mono text-sm font-semibold text-ink">{order.id}</p>
              <p className="text-xs text-muted">
                {new Date(order.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="ml-auto font-semibold text-ink">
                {euro(Number(order.products_total) + Number(order.insurance_total))}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted">
              {order.delivery === 'envio' ? 'Envío a domicilio' : 'Recogida en tienda'} · {order.payment_method}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-ink">
              {order.lines.map((line, index) => (
                <li key={index}>
                  {line.qty} × {line.name}
                  {line.color || line.capacity ? ` (${[line.color, line.capacity].filter(Boolean).join(' · ')})` : ''}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function ReservationsSection({ clienteId }: { clienteId: string }) {
  const [items, setItems] = useState<ReservationWithPosition[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { items: rows, error } = await listMyReservations(clienteId)
    if (error) {
      setStatus('error')
      return
    }
    setItems(rows)
    setStatus('ready')
  }, [clienteId])

  useEffect(() => {
    void load()
  }, [load])

  async function cancel(id: string) {
    setBusyId(id)
    await cancelReservation(id)
    setBusyId(null)
    await load()
  }

  return (
    <Section
      title="Mis reservas"
      description="Reservas de productos sin stock. El puesto en la lista de espera lo fija el momento del pago."
    >
      {status === 'loading' && <p className="text-sm text-muted">Cargando…</p>}
      {status === 'error' && <p className="text-sm text-danger">No se pudieron cargar las reservas.</p>}
      {status === 'ready' && items.length === 0 && (
        <p className="rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
          No tienes ninguna reserva. Cuando un producto esté agotado o sea bajo pedido, podrás reservarlo desde su
          ficha.
        </p>
      )}
      <ul className="space-y-4">
        {items.map(({ reservation, position }) => (
          <li key={reservation.id} className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-semibold text-ink">{reservation.model_name}</p>
              <p className="text-sm text-muted">{reservation.variant_label}</p>
              <p className="ml-auto font-semibold text-ink">{euro(Number(reservation.price))}</p>
            </div>
            <p className="mt-2 text-sm text-ink">
              {describeReservationStatus(reservation.estado)}
              {reservation.estado === 'en-espera' && position != null && (
                <>
                  {' · '}
                  <strong>
                    Posición {position} {position === 1 ? '(siguiente)' : ''}
                  </strong>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted">
              Reservado el{' '}
              {new Date(reservation.pagado_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {reservation.estado === 'en-espera' && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                disabled={busyId === reservation.id}
                onClick={() => void cancel(reservation.id)}
              >
                Cancelar reserva
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function EducationalDiscountSection() {
  const { session, cliente, refresh } = useCustomerAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const estado = cliente?.descuento_educativo_estado ?? null

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !session) return
    setError(null)
    setUploading(true)
    const { error: uploadError } = await uploadEducationalProof(session.user.id, file)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    if (uploadError) {
      setError(uploadError)
      return
    }
    await refresh()
  }

  return (
    <Section
      title="Descuento educativo"
      description="Sube un justificante (matrícula o carné de estudiante). Lo revisa una persona del equipo; no es automático."
    >
      <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
        <p className="text-sm text-ink">
          Estado: <strong>{describeStatus(estado)}</strong>
        </p>

        {cliente?.descuento_educativo_nota && (
          <p className="mt-2 rounded-[12px] bg-neutral p-3 text-sm text-muted">
            <strong className="text-ink">Nota del equipo:</strong> {cliente.descuento_educativo_nota}
          </p>
        )}

        {estado === 'pendiente' && (
          <p className="mt-2 text-sm text-muted">
            Ya tenemos tu justificante. Te avisaremos cuando esté revisado. Puedes subir otro si te has equivocado de
            archivo.
          </p>
        )}

        <div className="mt-4">
          <label htmlFor="justificante-educativo" className="mb-1 block text-sm font-medium text-ink">
            {estado ? 'Subir otro justificante' : 'Subir justificante'}
          </label>
          <input
            ref={inputRef}
            id="justificante-educativo"
            type="file"
            accept={ACCEPTED_ACCEPT_ATTR}
            onChange={onFileChange}
            disabled={uploading}
            className="block w-full text-sm text-ink file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-ink/20 file:bg-transparent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-black/5"
          />
          <p className="mt-1 text-xs text-muted">PDF, JPG o PNG. Máximo 5 MB.</p>
        </div>

        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs">
          {uploading && <span className="text-muted">Subiendo…</span>}
          {error && <span className="text-danger">{error}</span>}
        </p>
      </div>
    </Section>
  )
}

function FavoritesSection() {
  const t = useT()
  const { favorites } = useStore()
  const { favoriteStore } = useStorePreference()

  return (
    <Section title="Favoritos y tienda">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-ink">Productos favoritos</h3>
          <p className="mt-1 text-sm text-muted">
            {favorites.length === 0
              ? 'Todavía no has guardado ninguno.'
              : `Tienes ${favorites.length} producto${favorites.length === 1 ? '' : 's'} guardado${favorites.length === 1 ? '' : 's'}.`}
          </p>
          <Link to="/favoritos" className="mt-3 inline-block text-sm font-semibold text-ink underline">
            Ver mis favoritos
          </Link>
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-ink">Tienda habitual</h3>
          <p className="mt-1 text-sm text-muted">
            {favoriteStore ? favoriteStore.name : 'No has elegido ninguna todavía.'}
          </p>
          <Link to="/tiendas" className="mt-3 inline-block text-sm font-semibold text-ink underline">
            {t('common.viewStores')}
          </Link>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Favoritos y tienda habitual se guardan en este navegador, no en la cuenta.
      </p>
    </Section>
  )
}
