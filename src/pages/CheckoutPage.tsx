import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { Chip } from '../components/ui/Chip'
import { useStore } from '../lib/store'
import { productImage } from '../data/products'
import { stores } from '../data/stores'
import { euro, monthlyQuote } from '../lib/format'

// Checkout de 3 pasos (§4.10). Cabecera simplificada (sin menú, para reducir
// fugas). Resumen del pedido siempre visible. Validación antes de avanzar (§9.3).
const STEPS = ['Entrega', 'Pago y extras', 'Confirmación']

export function CheckoutPage() {
  const { step } = useParams()
  const current = Math.min(3, Math.max(1, Number(step) || 1))
  const navigate = useNavigate()
  const {
    cart,
    cartSubtotal,
    cartInsuranceTotal,
    clearCart,
    setLineInsurance,
    insurancePrice,
  } = useStore()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<'envio' | 'recogida'>('envio')
  const [form, setForm] = useState({ nombre: '', email: '', direccion: '', isla: 'Gran Canaria', tienda: 'triana' })
  const [pay, setPay] = useState<'tarjeta' | 'bizum' | 'financiacion'>('tarjeta')
  const [months, setMonths] = useState(24)
  const [processing, setProcessing] = useState(false)
  const [orderId] = useState(() => 'BC-' + Math.floor(100000 + Math.random() * 899999))

  if (cart.length === 0 && current < 3) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">No hay nada que comprar</h1>
        <Link to="/iphone" className="mt-4 inline-block font-semibold text-ink hover:underline">
          Ver productos
        </Link>
      </Container>
    )
  }

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Introduce tu nombre.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Introduce un email válido.'
    if (mode === 'envio' && !form.direccion.trim()) e.direccion = 'Introduce la dirección de envío.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (current === 1 && !validateStep1()) return
    if (current === 2) {
      setProcessing(true)
      setTimeout(() => {
        setProcessing(false)
        clearCart()
        navigate('/checkout/3')
      }, 1400)
      return
    }
    navigate(`/checkout/${current + 1}`)
  }

  const total = cartSubtotal + cartInsuranceTotal

  return (
    <div>
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
                <ModeButton active={mode === 'envio'} onClick={() => setMode('envio')} icon="truck" label="Envío a domicilio" />
                <ModeButton active={mode === 'recogida'} onClick={() => setMode('recogida')} icon="store" label="Recogida en tienda" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre y apellidos" error={errors.nombre}>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="field"
                  />
                </Field>
                {mode === 'envio' ? (
                  <>
                    <Field label="Dirección" error={errors.direccion} full>
                      <input
                        value={form.direccion}
                        onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                        className="field"
                      />
                    </Field>
                    <Field label="Isla" full>
                      <select
                        value={form.isla}
                        onChange={(e) => setForm({ ...form, isla: e.target.value })}
                        className="field"
                      >
                        <option>Gran Canaria</option>
                        <option>Tenerife</option>
                        <option>Lanzarote</option>
                        <option>Fuerteventura</option>
                      </select>
                    </Field>
                  </>
                ) : (
                  <Field label="Tienda de recogida" full>
                    <select
                      value={form.tienda}
                      onChange={(e) => setForm({ ...form, tienda: e.target.value })}
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
                Plazo estimado según isla · <span className="italic">Condiciones pendientes de validación</span>
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

              {pay === 'financiacion' && (
                <div className="mt-4 rounded-[12px] border border-line bg-neutral p-4">
                  <p className="text-sm font-semibold text-ink">Simulador de cuotas</p>
                  <p className="mb-3 text-xs text-muted">Condiciones pendientes de validación.</p>
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
                    La contratación se completa hoy de forma presencial en tienda.
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
                  Servicio presencial: la tasación se gestiona en tienda, no forma parte de este paso online.{' '}
                  <Link to="/plan-renove" className="font-semibold text-ink hover:underline">
                    Ver Plan Renove ›
                  </Link>
                </p>
              </div>
            </div>
          )}

          {current === 3 && (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-available-050 text-available">
                <Icon name="check" size={30} />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-ink">¡Pedido confirmado!</h1>
              <p className="mt-2 text-muted">
                Número de pedido: <strong className="text-ink">{orderId}</strong>
              </p>
              <div className="mt-3 flex justify-center">
                <ProvisionalBadge label="Stock de ejemplo" />
              </div>
              <div className="mx-auto mt-6 max-w-sm rounded-[12px] bg-neutral p-5 text-left text-sm text-muted">
                <p className="font-semibold text-ink">Próximos pasos</p>
                <ul className="mt-2 space-y-1">
                  <li>· Recibirás un email de confirmación (demostración).</li>
                  <li>· Si elegiste financiación o Plan Renove, se completan en tienda.</li>
                  <li>· Puedes seguir tu pedido desde el centro de soporte.</li>
                </ul>
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
              {(cart.length ? cart : []).map((line) => (
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
              {current === 3 && cart.length === 0 && <li className="text-sm text-muted">Pedido {orderId}</li>}
            </ul>
            {current < 3 && (
              <>
                <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
                  {cartInsuranceTotal > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted">Seguro</dt>
                      <dd className="text-ink">{euro(cartInsuranceTotal)}/mes*</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted">Envío</dt>
                    <dd className="font-medium text-available">Gratis*</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2">
                    <dt className="font-bold text-ink">Total</dt>
                    <dd className="font-bold text-ink">{euro(total)}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <ProvisionalBadge label="Precio demostrativo" />
                </div>
              </>
            )}
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
