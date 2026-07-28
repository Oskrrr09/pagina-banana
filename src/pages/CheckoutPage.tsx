import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { Chip } from '../components/ui/Chip'
import { useStore } from '../lib/store'
import { useCheckoutState } from '../lib/checkoutState'
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
const STEPS = ['Entrega', 'Pago y extras', 'Confirmación']

export function CheckoutPage() {
  const { step } = useParams()
  const parsedStep = Number(step)
  const current = (parsedStep === 1 || parsedStep === 2 || parsedStep === 3 ? parsedStep : 1) as 1 | 2 | 3
  const navigate = useNavigate()

  const {
    cart,
    cartSubtotal,
    cartInsuranceTotal,
    clearCart,
    setLineInsurance,
    insurancePrice,
  } = useStore()
  const { delivery, setDelivery, form, setForm, step1Valid, validateStep1 } = useCheckoutState()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pay, setPay] = useState<'tarjeta' | 'bizum' | 'financiacion'>('tarjeta')
  const [months, setMonths] = useState(24)
  const [processing, setProcessing] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<DemoOrder | null>(() =>
    demoOrderRepository.getLast(),
  )

  // Guarda de paso 3: solo se muestra si hay un pedido de demostración
  // creado en la sesión actual. Si alguien abre /checkout/3 directamente sin
  // pedido, se le redirige al carrito o al catálogo según corresponda.
  if (current === 3 && !confirmedOrder) {
    return <Navigate to={cart.length > 0 ? '/carrito' : '/iphone'} replace />
  }

  // Guarda de pasos 1 y 2: no tienen sentido con la cesta vacía (salvo que ya
  // exista un pedido confirmado, en cuyo caso el usuario debe ir al paso 3).
  if ((current === 1 || current === 2) && cart.length === 0) {
    if (confirmedOrder) return <Navigate to="/checkout/3" replace />
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">No hay nada que comprar</h1>
        <p className="mt-2 text-muted">Añade productos al carrito para iniciar el checkout.</p>
        <Link to="/iphone" className="mt-4 inline-block font-semibold text-ink hover:underline">
          Ver productos
        </Link>
      </Container>
    )
  }

  // Guarda de paso 2: bloqueada hasta que el paso 1 sea válido.
  if (current === 2 && !step1Valid) {
    return <Navigate to="/checkout/1" replace />
  }

  // Al terminar (paso 3) limpiamos el carrito una sola vez, pero conservamos
  // el pedido para poder recargar la página sin perder el resumen.
  useEffect(() => {
    if (current === 3 && cart.length > 0) clearCart()
  }, [current, cart.length, clearCart])

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
        setConfirmedOrder(order)
        setProcessing(false)
        navigate('/checkout/3')
      }, 900)
      return
    }
  }

  const total = cartSubtotal + cartInsuranceTotal
  const summaryLines = current === 3 && confirmedOrder ? confirmedOrder.lines : cart
  const summaryInsurance = current === 3 && confirmedOrder ? confirmedOrder.monthlyInsuranceTotal : cartInsuranceTotal
  const summaryProducts = current === 3 && confirmedOrder ? confirmedOrder.productsTotal : cartSubtotal
  const tiendaObj = useMemo(() => getStore(form.tienda), [form.tienda])

  return (
    <div>
      {/* Aviso demostrativo global — evita que el flujo se confunda con una compra real */}
      <Container className="pt-6">
        <div className="rounded-[12px] border border-line bg-neutral px-4 py-2 text-xs text-muted">
          <strong className="text-ink">Pedido de demostración.</strong> No se cobra ni se envía nada;
          los datos se guardan solo en tu navegador.
        </div>
      </Container>

      {/* Indicador de pasos */}
      <Container className="py-6">
        <ol className="flex items-center justify-between gap-2 sm:justify-start sm:gap-4">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = n < current
            const active = n === current
            return (
              <li
                key={label}
                aria-label={`Paso ${n}: ${label}`}
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
                    {label}
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
              <h1 className="text-xl font-bold text-ink">Entrega o recogida</h1>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <ModeButton active={delivery === 'envio'} onClick={() => setDelivery('envio')} icon="truck" label="Envío a domicilio" />
                <ModeButton active={delivery === 'recogida'} onClick={() => setDelivery('recogida')} icon="store" label="Recogida en tienda" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre y apellidos" error={errors.nombre}>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ nombre: e.target.value })}
                    className="field"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email" error={errors.email}>
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
                    <Field label="Dirección" error={errors.direccion} full>
                      <input
                        value={form.direccion}
                        onChange={(e) => setForm({ direccion: e.target.value })}
                        className="field"
                        autoComplete="street-address"
                      />
                    </Field>
                    <Field label="Isla" full>
                      <select
                        value={form.isla}
                        onChange={(e) => setForm({ isla: e.target.value })}
                        className="field"
                      >
                        <option>Gran Canaria</option>
                        <option>Tenerife</option>
                        <option>Lanzarote</option>
                        <option>Fuerteventura</option>
                        <option>La Palma</option>
                        <option>La Gomera</option>
                        <option>El Hierro</option>
                      </select>
                    </Field>
                  </>
                ) : (
                  <Field label="Tienda de recogida" error={errors.tienda} full>
                    <select
                      value={form.tienda}
                      onChange={(e) => setForm({ tienda: e.target.value })}
                      className="field"
                    >
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
                Plazo estimado según isla · <span className="italic">Condición demostrativa.</span>
              </p>
            </div>
          )}

          {current === 2 && (
            <div>
              <h1 className="text-xl font-bold text-ink">Pago y extras</h1>
              <p className="mb-3 mt-4 text-sm font-semibold text-ink">Método de pago</p>
              <div className="flex flex-wrap gap-2">
                {(['tarjeta', 'bizum', 'financiacion'] as const).map((p) => (
                  <Chip key={p} selected={pay === p} onClick={() => setPay(p)}>
                    {p === 'tarjeta' ? 'Tarjeta' : p === 'bizum' ? 'Bizum' : 'Financiación'}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Pago demostrativo · <span className="italic">no se realizan cargos reales.</span>
              </p>

              {pay === 'financiacion' && (
                <div className="mt-4 rounded-[12px] border border-line bg-neutral p-4">
                  <p className="text-sm font-semibold text-ink">Simulador de cuotas</p>
                  <p className="mb-3 text-xs text-muted">Condición demostrativa — pendiente de validación con Banana Computer.</p>
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
                <p className="text-sm font-semibold text-ink">Extras</p>
                <div className="mt-2 space-y-2">
                  {cart.map((line) => (
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
                          {line.capacity} · {line.color} · +{euro(insurancePrice)}/mes* por unidad
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="mb-1 text-sm font-semibold text-ink">Código de cupón</p>
                  <input placeholder="Introduce tu código" className="field max-w-xs" />
                </div>
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink">Nota Plan Renove</p>
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
                <h1 className="mt-4 text-2xl font-bold text-ink">¡Pedido confirmado!</h1>
                <p className="mt-2 text-muted">
                  Número de pedido: <strong className="text-ink">{confirmedOrder.id}</strong>
                </p>
                <div className="mt-3 flex justify-center">
                  <ProvisionalBadge label="Pedido de demostración" />
                </div>
              </div>

              <div className="mt-6 rounded-[12px] bg-neutral p-5 text-sm text-muted">
                <p className="font-semibold text-ink">Datos del pedido</p>
                <ul className="mt-2 space-y-1">
                  <li><span className="font-medium text-ink">Fecha:</span> {new Date(confirmedOrder.createdAt).toLocaleString('es-ES', { timeZone: 'Atlantic/Canary' })}</li>
                  <li><span className="font-medium text-ink">Entrega:</span> {confirmedOrder.delivery === 'envio' ? 'Envío a domicilio' : 'Recogida en tienda'}</li>
                  {confirmedOrder.delivery === 'envio' && confirmedOrder.customer.direccion && (
                    <li><span className="font-medium text-ink">Dirección:</span> {confirmedOrder.customer.direccion} ({confirmedOrder.customer.isla})</li>
                  )}
                  {confirmedOrder.delivery === 'recogida' && (
                    <li>
                      <span className="font-medium text-ink">Tienda:</span>{' '}
                      {getStore(confirmedOrder.customer.tienda ?? '')?.name ?? confirmedOrder.customer.tienda}
                    </li>
                  )}
                  <li>
                    <span className="font-medium text-ink">Método de pago:</span>{' '}
                    {confirmedOrder.paymentMethod === 'tarjeta' ? 'Tarjeta' : confirmedOrder.paymentMethod === 'bizum' ? 'Bizum' : `Financiación (${confirmedOrder.financingMonths} meses)`}
                    {' '}<span className="italic">(demostrativo)</span>
                  </li>
                  <li>
                    <span className="font-medium text-ink">Estado:</span> demo · pendiente de validación
                  </li>
                </ul>
                <p className="mt-3 text-xs">
                  No se ha enviado ningún email real ni se ha realizado ningún cargo. Este resumen queda
                  en tu navegador durante esta sesión.
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
                  'Confirmar pedido'
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Resumen del pedido */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[12px] border border-line bg-surface p-6">
            <h2 className="font-bold text-ink">Resumen del pedido</h2>
            <ul className="mt-4 space-y-3">
              {summaryLines.map((line) => (
                <li key={line.id} className="flex gap-3">
                  <div className="w-14 shrink-0">
                    <ProductImage src={productImage(line.modelSlug, line.color)} alt={`${line.name} ${line.color}`} ratio="1 / 1" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-ink">
                      {line.name} {line.capacity}
                    </p>
                    <p className="text-muted">
                      {line.color} · {line.qty} ud.
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
              ))}
            </ul>

            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Productos</dt>
                <dd className="text-ink">{euro(summaryProducts)}</dd>
              </div>
              {summaryInsurance > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Seguro</dt>
                  <dd className="text-ink">{euro(summaryInsurance)}/mes*</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Envío</dt>
                <dd className="font-medium text-available">Gratis*</dd>
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
                <dt className="font-bold text-ink">Total productos</dt>
                <dd className="font-bold text-ink">{euro(current === 3 ? summaryProducts : total)}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <ProvisionalBadge label="Precio demostrativo" />
            </div>
          </div>
        </aside>
      </Container>
    </div>
  )
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
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
