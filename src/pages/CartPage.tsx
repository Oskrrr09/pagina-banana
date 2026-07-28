import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button, ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { useStore } from '../lib/store'
import { useCheckoutState } from '../lib/checkoutState'
import { productImage } from '../data/products'
import { euro } from '../lib/format'

export function CartPage() {
  const {
    cart,
    setQty,
    setLineInsurance,
    removeFromCart,
    cartSubtotal,
    cartCount,
    cartInsuranceTotal,
    insurancePrice,
  } = useStore()
  // La selección de entrega se comparte con el checkout: si el usuario elige
  // "Recogida en tienda" aquí, el paso 1 del checkout se abrirá con esa opción.
  const { delivery, setDelivery } = useCheckoutState()
  const [couponOpen, setCouponOpen] = useState(false)

  if (cart.length === 0) {
    return (
      <Container className="py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-neutral text-muted">
          <Icon name="cart" size={28} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Tu cesta está vacía</h1>
        <p className="mt-2 text-muted">Descubre las novedades y las mejores ofertas.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/iphone">Ver iPhone</ButtonLink>
          <ButtonLink to="/buscar" variant="secondary">
            Explorar catálogo
          </ButtonLink>
        </div>
      </Container>
    )
  }

  const shipping = delivery === 'recogida' ? 0 : 0 // envío gratis de ejemplo
  const total = cartSubtotal + shipping + cartInsuranceTotal

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-extrabold text-ink">Tu cesta ({cartCount})</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Líneas de producto */}
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {cart.map((line) => (
              <li key={line.id} className="flex gap-4 py-5">
                <div className="w-20 shrink-0 sm:w-24">
                  <ProductImage src={productImage(line.modelSlug, line.color)} alt={`${line.name} ${line.color}`} ratio="1 / 1" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{line.name}</p>
                      <p className="text-sm text-muted">
                        {line.capacity} · {line.color}
                      </p>
                      <div className="mt-1">
                        <ProvisionalBadge label="Precio demostrativo" />
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(line.id)}
                      aria-label={`Quitar ${line.name}`}
                      className="text-muted hover:text-danger"
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="inline-flex items-center rounded-[12px] border border-line">
                      <button
                        onClick={() => setQty(line.id, line.qty - 1)}
                        aria-label="Reducir cantidad"
                        className="grid h-9 w-9 place-items-center text-ink hover:bg-neutral disabled:opacity-40"
                        disabled={line.qty <= 1}
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{line.qty}</span>
                      <button
                        onClick={() => setQty(line.id, line.qty + 1)}
                        aria-label="Aumentar cantidad"
                        className="grid h-9 w-9 place-items-center text-ink hover:bg-neutral"
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                    <span className="font-bold text-ink">{euro(line.price * line.qty)}</span>
                  </div>
                  <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] bg-neutral px-3 py-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={Boolean(line.insured)}
                      onChange={(event) => setLineInsurance(line.id, event.target.checked)}
                      className="h-5 w-5 shrink-0 accent-[var(--color-brand)]"
                    />
                    <Icon name="shield" size={18} />
                    <span>
                      <span className="font-semibold">Seguro a todo riesgo</span>
                      <span className="block text-xs text-muted">
                        +{euro(insurancePrice)}/mes* por unidad
                      </span>
                    </span>
                  </label>
                </div>
              </li>
            ))}
          </ul>

          {/* Entrega o recogida (resumen) */}
          <div className="mt-6 rounded-[12px] border border-line p-5">
            <p className="mb-3 font-semibold text-ink">Entrega o recogida</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <DeliveryOption
                active={delivery === 'envio'}
                onClick={() => setDelivery('envio')}
                icon="truck"
                title="Envío a domicilio"
                desc="Toda Canarias · 24/72h laborables"
              />
              <DeliveryOption
                active={delivery === 'recogida'}
                onClick={() => setDelivery('recogida')}
                icon="store"
                title="Recogida en tienda"
                desc="Gratis · según disponibilidad"
              />
            </div>
            <p className="mt-2 text-xs text-muted">Condiciones pendientes de validación.</p>
          </div>

          {/* Cupón */}
          <div className="mt-4">
            {couponOpen ? (
              <div className="flex gap-2">
                <input
                  placeholder="Código de cupón"
                  aria-label="Código de cupón"
                  className="h-11 flex-1 rounded-[12px] border border-line px-4 text-sm outline-none"
                />
                <Button variant="secondary">Aplicar</Button>
              </div>
            ) : (
              <button onClick={() => setCouponOpen(true)} className="text-sm font-semibold text-ink hover:underline">
                ¿Tienes un cupón?
              </button>
            )}
          </div>
        </div>

        {/* Resumen */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[12px] border border-line bg-neutral p-6">
            <h2 className="font-bold text-ink">Resumen</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium text-ink">{euro(cartSubtotal)}</dd>
              </div>
              {cartInsuranceTotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Seguro a todo riesgo</dt>
                  <dd className="font-medium text-ink">{euro(cartInsuranceTotal)}/mes*</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Envío estimado</dt>
                <dd className="font-medium text-available">Gratis*</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="font-bold text-ink">Total</span>
              <span className="text-xl font-bold text-ink">{euro(total)}</span>
            </div>
            <ButtonLink to="/checkout/1" size="lg" className="mt-5 w-full">
              Finalizar compra
            </ButtonLink>
            <Link
              to="/iphone"
              className="mt-3 block text-center text-sm font-semibold text-ink hover:underline"
            >
              Seguir comprando
            </Link>
          </div>
        </aside>
      </div>

      {/* Productos compatibles */}
      <div className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-ink">Productos compatibles</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {['Funda de silicona', 'Cargador USB-C 20W', 'AirPods Pro', 'Protector de pantalla'].map((a) => (
            <div key={a} className="w-44 shrink-0 rounded-[12px] border border-line p-4">
              <Placeholder label={a} ratio="1 / 1" />
              <p className="mt-2 text-sm font-medium text-ink">{a}</p>
              <p className="text-xs text-muted">Precio demostrativo</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}

function DeliveryOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: string
  title: string
  desc: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-start gap-3 rounded-[12px] border p-3 text-left transition-colors ${
        active ? 'border-brand bg-brand-050 ring-1 ring-brand' : 'border-line hover:border-ink/30'
      }`}
    >
      <Icon name={icon} className={active ? 'text-ink' : 'text-muted'} />
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </button>
  )
}
