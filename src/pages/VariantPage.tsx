import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { getModel, familyInfo } from '../data/products'
import { serviceFaq } from '../data/content'
import { euro } from '../lib/format'
import { useStore } from '../lib/store'
import { NotFound } from './NotFound'

const TABS = ['Características', 'Comparar', 'Plan Renove', 'Garantía', 'Accesorios', 'FAQ'] as const

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
  const { family: familySlug, model: modelSlug, variant } = useParams()
  const family = familyInfo(familySlug ?? '')
  const model = getModel(familySlug ?? '', modelSlug ?? '')
  const navigate = useNavigate()
  const { addToCart } = useStore()

  // Parse "256gb-plata" → capacidad + color
  const [capToken, ...colorParts] = (variant ?? '').split('-')
  const colorToken = colorParts.join('-')

  const initialColor =
    model?.colors.find((c) => c.color === colorToken) ?? model?.colors[0]
  const [colorSlug, setColorSlug] = useState(initialColor?.color ?? '')
  const color = model?.colors.find((c) => c.color === colorSlug) ?? model?.colors[0]

  const initialCapacity =
    color?.capacities.find((c) => c.capacity.toLowerCase() === capToken?.toLowerCase())?.capacity ??
    color?.capacities[0].capacity
  const [capacity, setCapacity] = useState(initialCapacity ?? '')

  const current = useMemo(
    () => color?.capacities.find((c) => c.capacity === capacity) ?? color?.capacities[0],
    [color, capacity],
  )

  const [tab, setTab] = useState<(typeof TABS)[number]>('Características')
  const [storeOpen, setStoreOpen] = useState(false)
  const [financeOpen, setFinanceOpen] = useState(false)
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
      const slug = `${capacity.toLowerCase()}-${color.color}`
      window.history.replaceState(null, '', `/${family.slug}/${model.slug}/${slug}`)
    }
  }, [family, model, color, capacity])

  if (!family || !model || !color || !current) return <NotFound />

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
  }
  const buyNow = () => {
    addToCart(cartLine)
    navigate('/carrito')
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
          <p className="mt-3 text-center text-xs text-muted">Elige un color · imagen de ejemplo</p>
        </div>

        <div ref={buyBoxRef}>
          <h1 className="text-3xl font-extrabold text-ink">
            {model.name} {current.capacity} {color.name}
          </h1>

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
                    // mantiene capacidad si existe en el nuevo color
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

          {/* Selector de capacidad */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-ink">Capacidad: {current.capacity}</p>
            <div className="flex flex-wrap gap-2">
              {color.capacities.map((cap) => (
                <Chip
                  key={cap.capacity}
                  selected={cap.capacity === current.capacity}
                  onClick={() => setCapacity(cap.capacity)}
                  disabled={cap.availability === 'agotado'}
                  ariaLabel={`${cap.capacity} · ${euro(cap.price)}${cap.availability === 'agotado' ? ' · agotado' : ''}`}
                >
                  {cap.capacity}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <StockIndicator status={current.availability} note={current.availabilityNote} />
          </div>

          {/* Entrega / recogida */}
          <div className="mt-6 border-t border-line pt-5">
            <p className="font-semibold text-ink">Entrega o recogida</p>
            <p className="text-sm text-muted">Envío a toda Canarias · Recogida gratuita en tienda</p>
            <button onClick={() => setStoreOpen(true)} className="mt-1 text-sm font-semibold text-ink hover:underline">
              Ver stock por tienda ›
            </button>
          </div>

          {/* Financiación resumida */}
          <div className="mt-5 border-t border-line pt-5">
            <p className="font-semibold text-ink">Financiación</p>
            <button onClick={() => setFinanceOpen(true)} className="text-sm text-muted hover:text-ink">
              desde {euro(model.financeFrom.monthly)}/mes (TIN/TAE de ejemplo, a validar)* ·{' '}
              <span className="font-semibold text-ink">Simular ›</span>
            </button>
          </div>

          {/* Acciones */}
          <div className="mt-6 flex flex-col gap-3">
            {soldOut ? (
              <div className="rounded-[12px] border border-line bg-neutral p-4">
                <p className="text-sm font-semibold text-ink">Esta variante está agotada.</p>
                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => alert('Te avisaremos cuando esté disponible (demostración).')}
                >
                  Avísame cuando esté disponible
                </Button>
              </div>
            ) : (
              <Button size="lg" className="w-full" onClick={buyNow}>
                Comprar
              </Button>
            )}
            <Button variant="secondary" size="lg" className="w-full" onClick={() => addToCart(cartLine)}>
              <Icon name="shield" size={18} /> Añadir seguro a todo riesgo
            </Button>
          </div>
        </div>
      </Container>

      {/* Información secundaria — pestañas */}
      <div className="border-t border-line bg-neutral">
        <Container className="py-8">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-white'
                }`}
              >
                {t}
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
                <p className="text-muted">Compara este modelo con hasta 2 más.</p>
                <Button variant="secondary" className="mt-4" onClick={() => navigate('/comparar')}>
                  <Icon name="compare" size={18} /> Ir al comparador
                </Button>
              </div>
            )}
            {tab === 'Plan Renove' && (
              <div>
                <p className="text-ink">Entrega tu dispositivo actual y ahorra en esta compra.</p>
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
        </Container>
      </div>

      {/* Espacio para que la barra fija no tape contenido en móvil */}
      <div className="h-24 lg:hidden" aria-hidden />

      {/* Barra de compra fija (móvil) */}
      <AnimatePresence>
        {showBar && !soldOut && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <div>
                <p className="text-lg font-bold leading-none text-ink">{euro(current.price)}</p>
                {current.previousPrice && (
                  <p className="text-xs text-ink">antes {euro(current.previousPrice)}</p>
                )}
              </div>
              <Button size="lg" onClick={buyNow} className="min-w-[45%]">
                Comprar
              </Button>
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
