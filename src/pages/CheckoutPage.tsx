import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useColorName, useT, type ClaveTexto } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { Chip } from '../components/ui/Chip'
import { useStore } from '../lib/store'
import { ISLAS, useCheckoutState, formatAddressLine } from '../lib/checkoutState'
import { useCustomerAuth } from '../lib/customerAuth'
import { createReservationsFromCart, isReservationLine } from '../lib/reservations'
import { mirrorOrderToSupabase } from '../lib/orderSync'
import { demoOrderRepository, type DemoOrder } from '../lib/demoOrderRepository'
import { productImage } from '../data/products'
import { stores, getStore } from '../data/stores'
import { euro, monthlyQuote } from '../lib/format'

// Checkout de 3 pasos (§4.10).
// - Paso 1 y 2 dependen del carrito. Paso 3 depende de un pedido real creado
//   en demoOrderRepository al pulsar "Confirmar pedido"; no basta con abrir
//   la URL.
// - El estado de entrega y los datos de contacto viven en CheckoutProvider
//   (sessionStorage) para no perderlos al navegar hacia atrás.
// Claves, no texto: esto vive fuera del componente y la traducción se aplica
// al pintar cada paso.
const STEPS: ClaveTexto[] = ['checkout.step.delivery', 'checkout.step.payment', 'checkout.step.confirmation']

export function CheckoutPage() {
  const t = useT()
  const nombreColor = useColorName()
  const { step } = useParams()
  const parsedStep = Number(step)
  const current = (parsedStep === 1 || parsedStep === 2 || parsedStep === 3 ? parsedStep : 1) as 1 | 2 | 3
  const navigate = useNavigate()

  const { cart, cartSubtotal, cartInsuranceTotal, clearCart, setLineInsurance, insurancePrice } = useStore()
  const { delivery, setDelivery, form, setForm, step1Valid, validateStep1 } = useCheckoutState()
  const { session: customerSession, cliente } = useCustomerAuth()

  // El carrito puede llevar compras normales, reservas de productos sin
  // stock, o ambas cosas a la vez.
  const hasReservations = cart.some(isReservationLine)
  const hasPurchases = cart.some((line) => !isReservationLine(line))

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pay, setPay] = useState<'tarjeta' | 'bizum' | 'financiacion'>('tarjeta')
  const [months, setMonths] = useState(24)
  const [processing, setProcessing] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<DemoOrder | null>(() => demoOrderRepository.getLast())

  // Todos los hooks se llaman ANTES de cualquier return condicional para
  // garantizar el mismo orden entre renders (Reglas de los Hooks). Las
  // guardas viven en un bloque contiguo justo debajo.
  const tiendaObj = useMemo(() => getStore(form.tienda), [form.tienda])

  // Al terminar (paso 3) limpiamos el carrito una sola vez, pero conservamos
  // el pedido para poder recargar la página sin perder el resumen.
  useEffect(() => {
    if (current === 3 && confirmedOrder && cart.length > 0) clearCart()
  }, [current, confirmedOrder, cart.length, clearCart])

  // Con sesión iniciada, rellenamos el formulario con los datos del perfil.
  // Solo tocamos los campos vacíos: si el usuario ya ha escrito algo (o
  // vuelve atrás desde el paso 2), no se le pisa. Se hace una sola vez por
  // montaje para que borrar un campo a propósito no lo repueble.
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !cliente) return
    const patch: Partial<typeof form> = {}
    if (!form.nombre.trim() && cliente.nombre) patch.nombre = cliente.nombre
    if (!form.email.trim() && cliente.email) patch.email = cliente.email

    const envio = cliente.direccion_envio
    if (envio) {
      if (!form.direccion.trim()) {
        const linea = formatAddressLine(envio)
        if (linea) patch.direccion = linea
      }
      // Solo si es una de las islas que ofrece el selector.
      if (envio.isla && (ISLAS as readonly string[]).includes(envio.isla)) {
        patch.isla = envio.isla
      }
    }

    if (Object.keys(patch).length > 0) setForm(patch)
    prefilled.current = true
  }, [cliente, form, setForm])

  // --- Guardas de navegación (después de todos los hooks) ---
  // Paso 3: exige un pedido demostrativo real creado en esta sesión.
  if (current === 3 && !confirmedOrder) {
    return <Navigate to={cart.length > 0 ? '/carrito' : '/iphone'} replace />
  }
  // Pasos 1 y 2: sin carrito no hay flujo (salvo que ya haya pedido).
  if ((current === 1 || current === 2) && cart.length === 0) {
    if (confirmedOrder) return <Navigate to="/checkout/3" replace />
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">{t('checkout.empty')}</h1>
        <p className="mt-2 text-muted">{t('checkout.emptyBody')}</p>
        <Link to="/iphone" className="mt-4 inline-block font-semibold text-ink hover:underline">
          Ver productos
        </Link>
      </Container>
    )
  }
  // Paso 2: bloqueado hasta que el paso 1 sea válido.
  if (current === 2 && !step1Valid) {
    return <Navigate to="/checkout/1" replace />
  }

  function next() {
    if (current === 1) {
      const e = validateStep1()
      setErrors(e)
      if (Object.keys(e).length > 0) return
      navigate('/checkout/2')
      return
    }
    if (current === 2) {
      setProcessing(true)
      window.setTimeout(() => {
        void confirmOrder()
      }, 900)
      return
    }
  }

  async function confirmOrder() {
    const order = demoOrderRepository.createFromCart({
      cart,
      delivery,
      customer: {
        nombre: form.nombre,
        email: form.email,
        direccion: delivery === 'envio' ? form.direccion : undefined,
        isla: delivery === 'envio' ? form.isla : undefined,
        tienda: delivery === 'recogida' ? form.tienda : undefined,
      },
      paymentMethod: pay,
      financingMonths: pay === 'financiacion' ? months : undefined,
    })

    // Con sesión iniciada dejamos constancia en Supabase para que "Mi
    // cuenta" tenga historial. Si algo falla, el pedido demostrativo ya
    // existe y la confirmación se muestra igual: no bloqueamos la compra.
    if (customerSession) {
      const clienteId = customerSession.user.id
      if (hasReservations) {
        const { error } = await createReservationsFromCart(clienteId, cart)
        if (error) console.error('[checkout] no se pudieron crear las reservas', error)
      }
      if (hasPurchases) {
        await mirrorOrderToSupabase(clienteId, order)
      }
    }

    setConfirmedOrder(order)
    setProcessing(false)
    navigate('/checkout/3')
  }

  const total = cartSubtotal + cartInsuranceTotal
  const summaryLines = current === 3 && confirmedOrder ? confirmedOrder.lines : cart
  const summaryInsurance = current === 3 && confirmedOrder ? confirmedOrder.monthlyInsuranceTotal : cartInsuranceTotal
  const summaryProducts = current === 3 && confirmedOrder ? confirmedOrder.productsTotal : cartSubtotal

  return (
    <div>
      {/* Aviso demostrativo global — evita que el flujo se confunda con una compra real */}
      <Container className="pt-6">
        <div className="rounded-[12px] border border-line bg-neutral px-4 py-2 text-xs text-muted">
          <strong className="text-ink">{t('checkout.demoOrder')}</strong> {t('checkout.demoOrderBody')}
          los datos se guardan solo en tu navegador.
        </div>
      </Container>

      {/* Indicador de pasos */}
      <Container className="py-6">
        <ol className="flex items-center justify-between gap-2 sm:justify-start sm:gap-4">
          {STEPS.map((clavePaso, i) => {
            const n = i + 1
            const done = n < current
            const active = n === current
            return (
              <li
                key={clavePaso}
                aria-label={t('checkout.stepAria', { n, nombre: t(clavePaso) })}
                aria-current={active ? 'step' : undefined}
                className="flex items-center gap-2 sm:gap-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                      active ? 'bg-ink text-white' : done ? 'bg-brand text-ink' : 'bg-line text-muted'
                    }`}
                  >
                    {done ? <Icon name="check" size={14} /> : n}
                  </span>
                  <span className={`hidden text-sm sm:inline ${active ? 'font-semibold text-ink' : 'text-muted'}`}>
                    {t(clavePaso)}
                  </span>
                </div>
                {n < STEPS.length && <span className="h-px w-6 bg-line sm:w-10" aria-hidden />}
              </li>
            )
          })}
        </ol>
      </Container>

      <Container className="grid gap-8 pb-16 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[12px] border border-line bg-surface p-6">
          {current === 1 && (
            <div>
              <h1 className="text-xl font-bold text-ink">{t('checkout.deliveryOrPickup')}</h1>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <ModeButton
                  active={delivery === 'envio'}
                  onClick={() => setDelivery('envio')}
                  icon="truck"
                  label={t('checkout.homeDelivery')}
                />
                <ModeButton
                  active={delivery === 'recogida'}
                  onClick={() => setDelivery('recogida')}
                  icon="store"
                  label={t('checkout.storePickup')}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label={t('checkout.fullName')} error={errors.nombre}>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ nombre: e.target.value })}
                    className="field"
                    autoComplete="name"
                  />
                </Field>
                <Field label={t('account.email')} error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ email: e.target.value })}
                    className="field"
                    autoComplete="email"
                  />
                </Field>
                {delivery === 'envio' ? (
                  <>
                    <Field label={t('checkout.address')} error={errors.direccion} full>
                      <input
                        value={form.direccion}
                        onChange={(e) => setForm({ direccion: e.target.value })}
                        className="field"
                        autoComplete="street-address"
                      />
                    </Field>
                    <Field label={t('checkout.island')} full>
                      <select value={form.isla} onChange={(e) => setForm({ isla: e.target.value })} className="field">
                        {ISLAS.map((isla) => (
                          <option key={isla}>{isla}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                ) : (
                  <Field label="Tienda de recogida" error={errors.tienda} full>
                    <select value={form.tienda} onChange={(e) => setForm({ tienda: e.target.value })} className="field">
                      {stores.map((store) => (
                        <option key={store.slug} value={store.slug}>
                          {store.name} — {store.island}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
              <p className="mt-3 text-xs text-muted">
                {t('checkout.estimateByIsland')} · <span className="italic">{t('checkout.demoCondition')}</span>
              </p>
            </div>
          )}

          {current === 2 && (
            <div>
              <h1 className="text-xl font-bold text-ink">Pago y extras</h1>
              <p className="mb-3 mt-4 text-sm font-semibold text-ink">{t('checkout.paymentMethod')}</p>
              <div className="flex flex-wrap gap-2">
                {(['tarjeta', 'bizum', 'financiacion'] as const).map((p) => (
                  <Chip key={p} selected={pay === p} onClick={() => setPay(p)}>
                    {p === 'tarjeta' ? t('checkout.card') : p === 'bizum' ? 'Bizum' : t('checkout.financing')}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Pago demostrativo · <span className="italic">no se realizan cargos reales.</span>
              </p>

              {pay === 'financiacion' && (
                <div className="mt-4 rounded-[12px] border border-line bg-neutral p-4">
                  <p className="text-sm font-semibold text-ink">{t('checkout.instalmentSimulator')}</p>
                  <p className="mb-3 text-xs text-muted">
                    Condición demostrativa — pendiente de validación con Banana Computer.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[12, 24, 36].map((m) => (
                      <Chip key={m} selected={months === m} onClick={() => setMonths(m)}>
                        {m} meses
                      </Chip>
                    ))}
                  </div>
                  <p className="mt-3 text-lg font-bold text-ink">
                    {euro(monthlyQuote(cartSubtotal, months))}/mes{' '}
                    <span className="text-xs font-normal text-muted">(orientativo)</span>
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    La contratación se completaría de forma presencial en tienda.
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink">{t('checkout.extras')}</p>
                <div className="mt-2 space-y-2">
                  {/* Solo se ofrece seguro para dispositivos. Los
                      accesorios no participan en el cálculo del seguro. */}
                  {cart
                    .filter((line) => line.kind !== 'accessory')
                    .map((line) => (
                      <label
                        key={line.id}
                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border border-line px-3 py-2 text-sm text-ink"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(line.insured)}
                          onChange={(event) => setLineInsurance(line.id, event.target.checked)}
                          className="h-5 w-5 shrink-0 accent-[var(--color-brand)]"
                        />
                        <span>
                          <span className="block font-semibold">Seguro para {line.name}</span>
                          <span className="block text-xs text-muted">
                            {line.capacity} · {nombreColor(line.color)} · +{euro(insurancePrice)}
                            /mes* por unidad
                          </span>
                        </span>
                      </label>
                    ))}
                </div>
                <div className="mt-4">
                  <p className="mb-1 text-sm font-semibold text-ink">{t('checkout.couponCode')}</p>
                  <input placeholder="Introduce tu código" className="field max-w-xs" />
                </div>
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink">{t('checkout.tradeInNote')}</p>
                <p className="mt-1 text-sm text-muted">
                  Servicio presencial: la tasación se gestionaría en tienda, no en este paso online.{' '}
                  <Link to="/plan-renove" className="font-semibold text-ink hover:underline">
                    Ver Plan Renove ›
                  </Link>
                </p>
              </div>
            </div>
          )}

          {current === 3 && confirmedOrder && (
            <div>
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-available-050 text-available">
                  <Icon name="check" size={30} />
                </div>
                <h1 className="mt-4 text-2xl font-bold text-ink">
                  {confirmedOrder.lines.every((l) => l.reservation)
                    ? t('checkout.reservationConfirmed')
                    : t('checkout.orderConfirmed')}
                </h1>
                <p className="mt-2 text-muted">
                  Número de pedido: <strong className="text-ink">{confirmedOrder.id}</strong>
                </p>
                <div className="mt-3 flex justify-center">
                  <ProvisionalBadge label="Pedido de demostración" />
                </div>
              </div>

              {confirmedOrder.lines.some((l) => l.reservation) && (
                <div className="mt-6 rounded-[12px] border border-line bg-neutral p-5 text-sm">
                  <p className="font-semibold text-ink">{t('checkout.waitingList')}</p>
                  <p className="mt-1 text-muted">
                    {customerSession ? (
                      <>
                        Las unidades reservadas se sirven por orden de reserva cuando lleguen. Puedes consultar tu
                        posición en{' '}
                        <Link to="/cuenta" className="font-semibold text-ink underline">
                          Mi cuenta
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        Al no haber sesión iniciada, esta reserva no se ha guardado en ninguna cuenta.{' '}
                        <Link to="/login" className="font-semibold text-ink underline">
                          Inicia sesión
                        </Link>{' '}
                        antes de reservar para poder seguirla.
                      </>
                    )}
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-[12px] bg-neutral p-5 text-sm text-muted">
                <p className="font-semibold text-ink">{t('checkout.orderData')}</p>
                <ul className="mt-2 space-y-1">
                  <li>
                    <span className="font-medium text-ink">{t('checkout.field.date')}</span>{' '}
                    {new Date(confirmedOrder.createdAt).toLocaleString('es-ES', {
                      timeZone: 'Atlantic/Canary',
                    })}
                  </li>
                  <li>
                    <span className="font-medium text-ink">{t('checkout.field.delivery')}</span>{' '}
                    {confirmedOrder.delivery === 'envio' ? t('checkout.homeDelivery') : t('checkout.storePickup')}
                  </li>
                  {confirmedOrder.delivery === 'envio' && confirmedOrder.customer.direccion && (
                    <li>
                      <span className="font-medium text-ink">{t('checkout.field.address')}</span>{' '}
                      {confirmedOrder.customer.direccion} ({confirmedOrder.customer.isla})
                    </li>
                  )}
                  {confirmedOrder.delivery === 'recogida' && (
                    <li>
                      <span className="font-medium text-ink">{t('checkout.field.store')}</span>{' '}
                      {getStore(confirmedOrder.customer.tienda ?? '')?.name ?? confirmedOrder.customer.tienda}
                    </li>
                  )}
                  <li>
                    <span className="font-medium text-ink">{t('checkout.field.payment')}</span>{' '}
                    {confirmedOrder.paymentMethod === 'tarjeta'
                      ? t('checkout.card')
                      : confirmedOrder.paymentMethod === 'bizum'
                        ? 'Bizum'
                        : t('checkout.financingMonths', {
                            meses: confirmedOrder.financingMonths ?? 0,
                          })}{' '}
                    <span className="italic">(demostrativo)</span>
                  </li>
                  <li>
                    <span className="font-medium text-ink">{t('checkout.field.status')}</span> demo · pendiente de
                    validación
                  </li>
                </ul>
                <p className="mt-3 text-xs">
                  No se ha enviado ningún email real ni se ha realizado ningún cargo. Este resumen queda en tu navegador
                  durante esta sesión.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/" className="font-semibold text-ink hover:underline">
                  Volver al inicio
                </Link>
                <span className="text-line">·</span>
                <Link to="/soporte" className="font-semibold text-ink hover:underline">
                  Ir a soporte
                </Link>
              </div>
            </div>
          )}

          {current < 3 && (
            <div className="mt-8 flex items-center justify-between">
              {current > 1 ? (
                <Link to={`/checkout/${current - 1}`} className="text-sm font-semibold text-muted hover:text-ink">
                  ← Atrás
                </Link>
              ) : (
                <span />
              )}
              <Button size="lg" onClick={next} disabled={processing}>
                {processing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Procesando…
                  </>
                ) : current === 2 ? (
                  t('checkout.confirmOrder')
                ) : (
                  t('common.continue')
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Resumen del pedido */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[12px] border border-line bg-surface p-6">
            <h2 className="font-bold text-ink">{t('checkout.summary')}</h2>
            <ul className="mt-4 space-y-3">
              {summaryLines.map((line) => {
                const isAccessory = line.kind === 'accessory'
                const src = isAccessory ? line.image : productImage(line.modelSlug, line.color)
                const altText = isAccessory ? line.name : `${line.name} ${line.color}`
                return (
                  <li key={line.id} className="flex gap-3">
                    <div className="w-14 shrink-0">
                      <ProductImage src={src} alt={altText} ratio="1 / 1" blend={isAccessory} />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-ink">
                        {line.name}
                        {!isAccessory && line.capacity ? ` ${line.capacity}` : ''}
                      </p>
                      <p className="text-muted">
                        {isAccessory ? t('checkout.appleAccessory') : nombreColor(line.color)} ·{' '}
                        {t('checkout.units', { n: line.qty })}
                      </p>
                      <p className="font-semibold text-ink">{euro(line.price * line.qty)}</p>
                      {line.insured && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-available">
                          <Icon name="shield" size={14} />
                          Seguro incluido · {euro(insurancePrice * line.qty)}/mes*
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t('checkout.products')}</dt>
                <dd className="text-ink">{euro(summaryProducts)}</dd>
              </div>
              {summaryInsurance > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">{t('checkout.insurance')}</dt>
                  <dd className="text-ink">{euro(summaryInsurance)}/mes*</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">{t('checkout.shipping')}</dt>
                <dd className="font-medium text-available">{t('cart.free')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Entrega</dt>
                <dd className="text-ink">
                  {current === 3 && confirmedOrder
                    ? confirmedOrder.delivery === 'envio'
                      ? 'Envío a domicilio'
                      : `Recogida — ${getStore(confirmedOrder.customer.tienda ?? '')?.name ?? confirmedOrder.customer.tienda}`
                    : delivery === 'envio'
                      ? 'Envío a domicilio'
                      : `Recogida — ${tiendaObj?.name ?? form.tienda}`}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-bold text-ink">{t('checkout.productsTotal')}</dt>
                <dd className="font-bold text-ink">{euro(current === 3 ? summaryProducts : total)}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <ProvisionalBadge />
            </div>
          </div>
        </aside>
      </Container>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-center gap-2 rounded-[12px] border p-3 text-sm font-semibold transition-colors ${
        active ? 'border-brand bg-brand-050 text-ink ring-1 ring-brand' : 'border-line text-ink hover:border-ink/30'
      }`}
    >
      <Icon name={icon} /> {label}
    </button>
  )
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string
  error?: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}
