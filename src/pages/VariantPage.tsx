import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useT, type ClaveTexto } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Chip } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { StockIndicator } from '../components/ui/StockIndicator'
import { ProvisionalBadge } from '../components/ui/Tag'
import { Accordion } from '../components/ui/Accordion'
import { StorePicker } from '../components/product/StorePicker'
import { FinanceSimulator } from '../components/product/FinanceSimulator'
import { capacitySlug, getModel, familyInfo, variantPath } from '../data/products'
import { serviceFaq } from '../data/content'
import { getAccessoriesForModel, accessoryPath } from '../data/accessories'
import { euro } from '../lib/format'
import { useStore } from '../lib/store'
import { useCustomerAuth } from '../lib/customerAuth'
import { NotFound } from './NotFound'

const TABS = ['Características', 'Comparar', 'Plan Renove', 'Garantía', 'Accesorios', 'FAQ'] as const

// Los rótulos de las pestañas son además el identificador del estado, así que
// el castellano se queda como identificador y la traducción se aplica solo al
// pintarlos.
const TAB_LABEL: Record<(typeof TABS)[number], ClaveTexto> = {
  'Características': 'product.features',
  'Comparar': 'compare.title',
  'Plan Renove': 'product.tradeIn',
  'Garantía': 'product.warranty',
  'Accesorios': 'product.tab.accessories',
  FAQ: 'product.tab.faq',
}

// Aclara un color hacia el blanco (amount 0–1). Se usa para teñir suavemente el
// fondo de la galería según el color elegido, al estilo de las fichas de Apple.
function tintHex(hex: string, amount: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const to2 = (n: number) => n.toString(16).padStart(2, '0')
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`
}

export function VariantPage() {
  const t = useT()
  const { family: familySlug, model: modelSlug, variant } = useParams()
  const family = familyInfo(familySlug ?? '')
  const model = getModel(familySlug ?? '', modelSlug ?? '')
  const navigate = useNavigate()
  const location = useLocation()
  const { addToCart, cart, insurancePrice, removeFromCart, setQty, toggleFavorite, isFavorite } = useStore()
  const { session: customerSession } = useCustomerAuth()

  const initialColor =
    model?.colors.find((candidate) => variant?.endsWith(`-${candidate.color}`)) ?? model?.colors[0]
  const initialCapacityToken =
    initialColor && variant?.endsWith(`-${initialColor.color}`)
      ? variant.slice(0, -(initialColor.color.length + 1))
      : ''
  const [colorSlug, setColorSlug] = useState(initialColor?.color ?? '')
  const color = model?.colors.find((c) => c.color === colorSlug) ?? model?.colors[0]

  // Extrae el tamaño (e.g. "13"", "15"", "42 mm", "44 mm") del inicio de una
  // string de capacidad. Sirve para MBP/iPad (pulgadas) y Watch (mm).
  const getSize = (cap: string) => cap.match(/^(\d{2}(?:"|\s?mm))/)?.[1] ?? null

  // Tamaños únicos disponibles para este color (vacío si no aplica).
  const sizes = useMemo(() => {
    if (!color) return []
    const seen = new Set<string>()
    return color.capacities.reduce<string[]>((acc, cap) => {
      const s = getSize(cap.capacity)
      if (s && !seen.has(s)) { seen.add(s); acc.push(s) }
      return acc
    }, [])
  }, [color])

  const hasSizeSelector = sizes.length > 1

  const initialCapacity =
    color?.capacities.find((candidate) => capacitySlug(candidate.capacity) === initialCapacityToken)?.capacity ??
    color?.capacities[0].capacity
  const [capacity, setCapacity] = useState(initialCapacity ?? '')

  // Tamaño activo derivado de la capacidad seleccionada (o primero disponible).
  const activeSize = getSize(capacity) ?? sizes[0] ?? null

  // Capacidades filtradas por el tamaño activo.
  const visibleCapacities = hasSizeSelector && activeSize
    ? color?.capacities.filter((c) => getSize(c.capacity) === activeSize) ?? []
    : color?.capacities ?? []

  // Etiqueta de capacidad que se muestra al usuario (sin el prefijo de tamaño).
  const stripSizePrefix = (cap: string) => cap.replace(/^\d{2}(?:"|\s?mm) · /, '')
  const displayCap = (cap: string) => (hasSizeSelector ? stripSizePrefix(cap) : cap)

  const current = useMemo(
    () => color?.capacities.find((c) => c.capacity === capacity) ?? color?.capacities[0],
    [color, capacity],
  )

  const [tab, setTab] = useState<(typeof TABS)[number]>('Características')
  const [storeOpen, setStoreOpen] = useState(false)
  const [financeOpen, setFinanceOpen] = useState(false)
  const [insurance, setInsurance] = useState(false)
  const [addedMessage, setAddedMessage] = useState('')
  const [showBar, setShowBar] = useState(false)
  const buyBoxRef = useRef<HTMLDivElement>(null)

  // Barra de compra móvil: aparece al pasar la caja de compra principal (§4.7)
  useEffect(() => {
    const el = buyBoxRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting), {
      rootMargin: '-120px 0px 0px 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Actualiza la URL al cambiar de variante, sin recargar (§9.3)
  useEffect(() => {
    if (family && model && color && capacity) {
      const selectedCapacity =
        color.capacities.find((candidate) => candidate.capacity === capacity) ?? color.capacities[0]
      navigate(variantPath(model, color, selectedCapacity), { replace: true })
    }
  }, [family, model, color, capacity, navigate])

  if (!family || !model || !color || !current) return <NotFound />

  // Sin stock inmediato: ni agotado ni bajo pedido se compran al momento,
  // se reservan y entran en lista de espera.
  const needsReservation = current.availability !== 'disponible'
  const soldOut = current.availability === 'agotado'
  const cartLine = {
    id: `${family.slug}/${model.slug}/${color.color}/${current.capacity}`,
    modelSlug: model.slug,
    family: family.slug,
    name: model.name,
    color: color.name,
    capacity: current.capacity,
    price: current.price,
    previousPrice: current.previousPrice,
    insured: insurance,
  }
  const lineInCart = cart.find((line) => line.id === cartLine.id)

  const buyNow = () => {
    addToCart(cartLine)
    navigate('/checkout/1')
  }

  // Reservar exige cuenta: la cola se ordena por cliente, no por navegador.
  const reserve = () => {
    if (!customerSession) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }
    addToCart({ ...cartLine, insured: false, reservation: true })
    navigate('/checkout/1')
  }
  const addAndContinue = () => {
    addToCart(cartLine)
    setAddedMessage(`${model.name} se ha añadido al carrito.`)
  }
  const increaseQuantity = () => {
    if (lineInCart) {
      setQty(lineInCart.id, lineInCart.qty + 1)
      setAddedMessage(`Has añadido otra unidad de ${model.name}.`)
      return
    }
    addAndContinue()
  }
  const decreaseQuantity = () => {
    if (!lineInCart) return
    if (lineInCart.qty === 1) {
      removeFromCart(lineInCart.id)
      setAddedMessage(`${model.name} se ha quitado del carrito.`)
      return
    }
    setQty(lineInCart.id, lineInCart.qty - 1)
    setAddedMessage(`Has quitado una unidad de ${model.name}.`)
  }

  return (
    <>
      {/* Información esencial — siempre visible */}
      <Container className="grid gap-8 py-8 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            className="relative grid aspect-square place-items-center overflow-hidden rounded-[20px] border border-line p-6"
            animate={{ backgroundColor: tintHex(color.hex, 0.84) }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={color.color}
                src={color.image}
                alt={`${model.name} · ${color.name}`}
                width={1080}
                height={1080}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full object-contain"
              />
            </AnimatePresence>
          </motion.div>

          {/* Muestras de color: cambian la foto con fundido y tiñen el fondo */}
          <div className="mt-4 flex justify-center gap-2.5">
            {model.colors.map((c) => (
              <button
                key={c.color}
                onClick={() => {
                  setColorSlug(c.color)
                  if (!c.capacities.some((cap) => cap.capacity === capacity)) {
                    setCapacity(c.capacities[0].capacity)
                  }
                }}
                aria-label={`Ver en ${c.name}`}
                aria-pressed={c.color === color.color}
                className={`h-8 w-8 rounded-full border transition-transform hover:scale-110 ${
                  c.color === color.color ? 'border-ink ring-2 ring-ink ring-offset-2' : 'border-black/15'
                }`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted">{t('product.chooseColor')}</p>
        </div>

        <div ref={buyBoxRef}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-extrabold text-ink">
              {model.name}{hasSizeSelector && activeSize ? ` ${activeSize}` : ''}
            </h1>
            <FavoriteToggle
              favId={`${model.family}/${model.slug}`}
              name={model.name}
              isFavorite={isFavorite(`${model.family}/${model.slug}`)}
              onToggle={() => toggleFavorite(`${model.family}/${model.slug}`)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-bold text-ink">{euro(current.price)}</span>
            {current.previousPrice && (
              <span className="pb-1 text-ink">
                {euro(current.previousPrice)} · ahorra {euro(current.previousPrice - current.price)}
              </span>
            )}
          </div>
          <div className="mt-2">
            <ProvisionalBadge label="Precio demostrativo" />
          </div>

          {/* Selector de color */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-ink">Color: {color.name}</p>
            <div className="flex flex-wrap gap-2">
              {model.colors.map((c) => (
                <Chip
                  key={c.color}
                  selected={c.color === color.color}
                  onClick={() => {
                    setColorSlug(c.color)
                    if (!c.capacities.some((cap) => cap.capacity === capacity)) {
                      setCapacity(c.capacities[0].capacity)
                    }
                  }}
                  swatch={c.hex}
                  ariaLabel={`Color ${c.name}`}
                >
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>

          {/* Selector de tamaño de pantalla (solo Air y Pro) */}
          {hasSizeSelector && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink">Tamaño: {activeSize}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <Chip
                    key={s}
                    selected={s === activeSize}
                    onClick={() => {
                      // Al cambiar de tamaño se preserva el sufijo actual
                      // (p. ej. "GPS + Cellular"). Si esa variante no existe
                      // para el nuevo tamaño, cae en la primera disponible.
                      const desired = stripSizePrefix(capacity)
                      const match = color.capacities.find(
                        (c) => getSize(c.capacity) === s && stripSizePrefix(c.capacity) === desired,
                      )
                      const fallback = color.capacities.find((c) => getSize(c.capacity) === s)
                      const next = match ?? fallback
                      if (next) setCapacity(next.capacity)
                    }}
                    ariaLabel={`Pantalla de ${s}`}
                  >
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Selector de capacidad */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-ink">
              Capacidad: {displayCap(current.capacity)}
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleCapacities.map((cap) => (
                <Chip
                  key={cap.capacity}
                  selected={cap.capacity === current.capacity}
                  onClick={() => setCapacity(cap.capacity)}
                  disabled={cap.availability === 'agotado'}
                  ariaLabel={`${displayCap(cap.capacity)} · ${euro(cap.price)}${cap.availability === 'agotado' ? ' · agotado' : ''}`}
                >
                  {displayCap(cap.capacity)}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <StockIndicator status={current.availability} note={current.availabilityNote} />
          </div>

          {/* Entrega / recogida */}
          <div className="mt-6 border-t border-line pt-5">
            <p className="font-semibold text-ink">{t('product.deliveryOrPickup')}</p>
            <p className="text-sm text-muted">{t('product.shippingNote')}</p>
            <button onClick={() => setStoreOpen(true)} className="mt-1 text-sm font-semibold text-ink hover:underline">
              Ver stock por tienda ›
            </button>
          </div>

          {/* Financiación resumida */}
          <div className="mt-5 border-t border-line pt-5">
            <p className="font-semibold text-ink">{t('product.financing')}</p>
            <button onClick={() => setFinanceOpen(true)} className="text-sm text-muted hover:text-ink">
              desde {euro(model.financeFrom.monthly)}/mes (TIN/TAE de ejemplo, a validar)* ·{' '}
              <span className="font-semibold text-ink">{t('product.simulate')}</span>
            </button>
          </div>

          {/* Acciones */}
          <div className="mt-6 flex flex-col gap-3">
            {needsReservation ? (
              <div className="rounded-[12px] border border-line bg-neutral p-4">
                <p className="text-sm font-semibold text-ink">
                  {soldOut
                    ? t('product.soldOutNote')
                    : t('product.backorderNote')}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Puedes reservarla: entras en la lista de espera y se sirve por
                  orden de reserva cuando lleguen unidades.
                </p>
                <Button className="mt-3 w-full" onClick={reserve}>
                  Reservar
                </Button>
                {!customerSession && (
                  <p className="mt-2 text-xs text-muted">
                    Necesitas iniciar sesión para reservar.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button size="lg" className="w-full" onClick={buyNow}>
                  Comprar
                </Button>
                <div className="flex gap-2">
                  <Button size="lg" variant="secondary" className="min-w-0 flex-1" onClick={addAndContinue}>
                    {lineInCart ? t('product.addAnother') : t('common.addToCart')}
                  </Button>
                  {lineInCart && (
                    <QuantityControl
                      quantity={lineInCart.qty}
                      productName={model.name}
                      onDecrease={decreaseQuantity}
                      onIncrease={increaseQuantity}
                    />
                  )}
                </div>
              </div>
            )}
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] border border-line px-4 py-3 text-left transition-colors hover:border-ink/30">
              <input
                type="checkbox"
                checked={insurance}
                onChange={(event) => setInsurance(event.target.checked)}
                className="h-5 w-5 shrink-0 accent-[var(--color-brand)]"
              />
              <span className="flex min-w-0 items-center gap-2">
                <Icon name="shield" size={18} />
                <span>
                  <span className="block text-sm font-semibold text-ink">{t('product.insurance')}</span>
                  <span className="block text-xs text-muted">
                    Añade {euro(insurancePrice)}/mes* por unidad
                  </span>
                </span>
              </span>
            </label>
            <div aria-live="polite" className="min-h-5 text-sm text-available">
              {addedMessage && (
                <>
                  {addedMessage}{' '}
                  <button onClick={() => navigate('/carrito')} className="font-semibold underline">
                    Ver carrito
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Información secundaria — pestañas */}
      <div className="border-t border-line bg-neutral">
        <Container className="py-8">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist">
            {TABS.map((pestana) => (
              <button
                key={pestana}
                role="tab"
                aria-selected={tab === pestana}
                onClick={() => setTab(pestana)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === pestana ? 'bg-ink text-surface' : 'bg-surface text-ink hover:bg-neutral'
                }`}
              >
                {t(TAB_LABEL[pestana])}
              </button>
            ))}
          </div>

          <div className="rounded-[12px] bg-surface p-6" role="tabpanel">
            {tab === 'Características' && (
              <div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {model.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-ink">
                      <Icon name="check" size={18} className="text-available" /> {h}
                    </li>
                  ))}
                </ul>
                <dl className="mt-6 grid gap-x-8 gap-y-2 border-t border-line pt-4 sm:grid-cols-2">
                  {model.specs.map((s) => (
                    <div key={s.label} className="flex justify-between border-b border-line py-2">
                      <dt className="text-muted">{s.label}</dt>
                      <dd className="font-medium text-ink">{s.value}</dd>
                    </div>
                  ))}
                </dl>
                <button className="mt-4 text-sm font-semibold text-ink hover:underline">
                  Ver ficha técnica completa ›
                </button>
              </div>
            )}
            {tab === 'Comparar' && (
              <div className="text-center">
                <p className="text-muted">{t('product.compareHint')}</p>
                <Button variant="secondary" className="mt-4" onClick={() => navigate('/comparar')}>
                  <Icon name="compare" size={18} /> Ir al comparador
                </Button>
              </div>
            )}
            {tab === 'Plan Renove' && (
              <div>
                <p className="text-ink">{t('product.tradeInNote')}</p>
                <p className="mt-2 text-sm text-muted">
                  La tasación es siempre presencial y orientativa online.
                </p>
                <Button variant="secondary" className="mt-4" onClick={() => navigate('/plan-renove')}>
                  Ver Plan Renove
                </Button>
              </div>
            )}
            {tab === 'Garantía' && (
              <p className="text-muted">
                Este producto incluye la garantía legal aplicable. Condiciones pendientes de validación con Banana
                Computer.
              </p>
            )}
            {tab === 'Accesorios' && (
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {['Funda', 'Cargador USB-C', 'AirPods', 'Protector'].map((a) => (
                  <div key={a} className="w-40 shrink-0">
                    <Placeholder label={a} ratio="1 / 1" />
                    <p className="mt-2 text-sm text-ink">{a}</p>
                    <p className="text-xs text-muted">Precio demostrativo</p>
                  </div>
                ))}
              </div>
            )}
            {tab === 'FAQ' && <Accordion items={serviceFaq} />}
          </div>

          <VariantAccessorySuggestions family={familySlug ?? ''} modelSlug={modelSlug ?? ''} />
        </Container>
      </div>

      {/* Espacio para que la barra fija no tape contenido en móvil */}
      <div className="h-24 lg:hidden" aria-hidden />

      {/* Barra de compra fija (móvil) */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <div>
                <p className="text-lg font-bold leading-none text-ink">{euro(current.price)}</p>
                {current.previousPrice && (
                  <p className="text-xs text-ink">antes {euro(current.previousPrice)}</p>
                )}
              </div>
              {needsReservation ? (
                <Button size="lg" onClick={reserve} className="ml-auto px-4">
                  Reservar
                </Button>
              ) : (
                <>
                  {lineInCart ? (
                    <QuantityControl
                      quantity={lineInCart.qty}
                      productName={model.name}
                      onDecrease={decreaseQuantity}
                      onIncrease={increaseQuantity}
                      compact
                      className="ml-auto"
                    />
                  ) : (
                    <Button size="lg" variant="secondary" onClick={addAndContinue} className="ml-auto px-3">
                      Al carrito
                    </Button>
                  )}
                  <Button size="lg" onClick={buyNow} className="px-4">
                    Comprar
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StorePicker
        open={storeOpen}
        onClose={() => setStoreOpen(false)}
        variantLabel={`${model.name} ${current.capacity} ${color.name}`}
      />
      <FinanceSimulator
        open={financeOpen}
        onClose={() => setFinanceOpen(false)}
        price={current.price}
        productName={`${model.name} ${current.capacity} · ${color.name}`}
      />
    </>
  )
}

function QuantityControl({
  quantity,
  productName,
  onDecrease,
  onIncrease,
  compact = false,
  className = '',
}: {
  quantity: number
  productName: string
  onDecrease: () => void
  onIncrease: () => void
  compact?: boolean
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={`Cantidad de ${productName} en el carrito`}
      className={`inline-flex h-13 shrink-0 items-center rounded-[12px] border border-line bg-surface ${className}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        aria-label={quantity === 1 ? `Quitar ${productName} del carrito` : `Quitar una unidad de ${productName}`}
        className={`grid h-full ${compact ? 'w-9' : 'w-10'} place-items-center text-ink hover:bg-neutral`}
      >
        <Icon name="minus" size={16} />
      </button>
      <span className={`min-w-5 text-center text-sm font-bold text-ink ${compact ? '' : 'px-1'}`} aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`Añadir una unidad de ${productName}`}
        className={`grid h-full ${compact ? 'w-9' : 'w-10'} place-items-center text-ink hover:bg-neutral`}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

function FavoriteToggle({
  favId,
  name,
  isFavorite,
  onToggle,
}: {
  favId: string
  name: string
  isFavorite: boolean
  onToggle: () => void
}) {
  const t = useT()
  void favId
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Quitar ${name} de favoritos` : `Añadir ${name} a favoritos`}
      className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-danger hover:text-danger"
    >
      <Icon
        name="heart"
        size={16}
        className={isFavorite ? 'fill-danger text-danger' : ''}
        aria-hidden="true"
      />
      {isFavorite ? t('product.inFavorites') : t('favorites.add')}
    </button>
  )
}

// Cross-sell contextual (§4.5): sección "Complementa tu compra" con
// hasta 4 accesorios cuya `compatibility` incluye este modelo o su
// familia. Enlaza a la ficha del accesorio; el usuario decide desde
// ahí. NO añade al carrito directamente aquí para mantener el flujo
// consistente con ProductCard.
function VariantAccessorySuggestions({
  family,
  modelSlug,
}: {
  family: string
  modelSlug: string
}) {
  const items = getAccessoriesForModel(`${family}/${modelSlug}`).slice(0, 4)
  if (items.length === 0) return null
  return (
    <section aria-labelledby="variant-cross-sell" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="variant-cross-sell" className="text-xl font-bold text-ink">
          Complementa tu compra
        </h2>
        <Link
          to="/accesorios"
          className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
        >
          Ver todos los accesorios ›
        </Link>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((a) => (
          <li key={a.slug}>
            <Link
              to={accessoryPath(a.slug)}
              className="flex h-full flex-col overflow-hidden rounded-[12px] border border-line bg-surface hover:border-ink/30"
            >
              <div
                className="flex aspect-square w-full items-center justify-center overflow-hidden bg-neutral"
              >
                <img
                  src={a.image}
                  alt={a.name}
                  width={400}
                  height={400}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain p-3"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-ink">{a.name}</p>
                {a.price != null && (
                  <p className="mt-1 text-xs text-muted">
                    {a.price === Math.floor(a.price)
                      ? `${a.price} € · precio demostrativo`
                      : `${a.price.toFixed(2).replace('.', ',')} € · precio demostrativo`}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
