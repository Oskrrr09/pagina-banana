import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { ProductImage } from '../product/ProductImage'
import { iphoneModels } from '../../data/products'
import { euro } from '../../lib/format'

// Rejilla "bento" (estilo Apple): tarjetas de distinto tamaño que combinan el
// producto estrella con los servicios clave. En móvil, carrusel horizontal con
// flechas y snap. En sm+ mantiene el bento grid original.
const feature = iphoneModels.find((m) => m.slug === '17-pro') ?? iphoneModels[0]
const TOTAL_CARDS = 5

interface CellProps {
  to: string
  className?: string
  children: React.ReactNode
}
function Cell({ to, className = '', children }: CellProps) {
  return (
    <Link
      to={to}
      className={`group relative flex flex-col overflow-hidden rounded-[20px] border border-line p-6 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-banana hover:shadow-[var(--shadow-raised)] ${className}`}
    >
      {children}
    </Link>
  )
}

export function BentoShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [cardIndex, setCardIndex] = useState(0)

  const scrollToCard = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[index] as HTMLElement
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    setCardIndex(index)
  }

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    let closest = 0
    let minDist = Infinity
    Array.from(el.children).forEach((child, i) => {
      const cardEl = child as HTMLElement
      const cardCenter = cardEl.offsetLeft + cardEl.clientWidth / 2
      const dist = Math.abs(center - cardCenter)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    setCardIndex(closest)
  }

  return (
    <div className="relative">
      {/* Carrusel horizontal en móvil */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="-mx-5 flex snap-x snap-mandatory overflow-x-auto no-scrollbar gap-4 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 sm:pb-0 lg:grid-cols-4 lg:grid-rows-2"
      >
        {/* Producto estrella (2×2) */}
        <Cell
          to={`/iphone/${feature.slug}`}
          className="w-[calc(100vw-2.5rem)] shrink-0 snap-center bg-neutral sm:w-auto sm:col-span-2 lg:col-span-2 lg:row-span-2"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink">Novedad</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">{feature.name}</h3>
              <p className="mt-1 text-sm text-muted">{feature.tagline}</p>
            </div>
            <span className="hidden shrink-0 rounded-full bg-surface px-3 py-1 text-sm font-bold text-ink shadow-[var(--shadow-rest)] sm:block">
              desde {euro(feature.fromPrice)}
            </span>
          </div>
          <div className="relative mt-4 flex-1">
            <ProductImage
              src={feature.colors[0].image}
              alt={feature.name}
              ratio="16 / 10"
              className="h-full min-h-[220px]"
            />
          </div>
          <span className="mt-2 inline-flex items-center gap-1 font-semibold text-ink transition-all group-hover:gap-2">
            Descúbrelo <Icon name="arrow-right" size={18} />
          </span>
        </Cell>

        {/* Financiación (acento amarillo) */}
        <Cell to="/servicios#financiacion" className="w-[calc(100vw-2.5rem)] shrink-0 snap-center bg-banana text-ink sm:w-auto">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/10">
            <Icon name="credit-card" />
          </span>
          <h3 className="mt-4 text-lg font-bold">Financiación</h3>
          <p className="mt-1 text-sm text-ink/80">Llévatelo hoy y págalo hasta en 24 meses.</p>
          <span className="mt-auto pt-3 text-sm font-semibold">Simular cuota ›</span>
        </Cell>

        {/* Plan Renove */}
        <Cell to="/plan-renove" className="w-[calc(100vw-2.5rem)] shrink-0 snap-center bg-surface sm:w-auto">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-050 text-ink">
            <Icon name="refresh" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink">Plan Renove</h3>
          <p className="mt-1 text-sm text-muted">Tu Apple actual vale más de lo que crees.</p>
          <span className="mt-auto pt-3 text-sm font-semibold text-ink">Valorar ›</span>
        </Cell>

        {/* Tiendas */}
        <Cell to="/tiendas" className="w-[calc(100vw-2.5rem)] shrink-0 snap-center bg-ink text-white sm:w-auto">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-banana">
            <Icon name="store" />
          </span>
          <h3 className="mt-4 text-lg font-bold">Tiendas en Canarias</h3>
          <p className="mt-1 text-sm text-white/70">Recogida gratis y servicio técnico cerca de ti.</p>
          <span className="mt-auto pt-3 text-sm font-semibold text-banana">Ver tiendas ›</span>
        </Cell>

        {/* Envío */}
        <Cell to="/servicios" className="w-[calc(100vw-2.5rem)] shrink-0 snap-center bg-surface sm:w-auto">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-050 text-ink">
            <Icon name="truck" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink">Envío a toda Canarias</h3>
          <p className="mt-1 text-sm text-muted">Rápido y con seguimiento en cada pedido.</p>
          <span className="mt-auto pt-3 text-sm font-semibold text-ink">Cómo funciona ›</span>
        </Cell>
      </div>

      {/* Flecha izquierda (solo móvil) */}
      {cardIndex > 0 && (
        <button
          onClick={() => scrollToCard(cardIndex - 1)}
          aria-label="Tarjeta anterior"
          className="absolute left-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow-[var(--shadow-rest)] backdrop-blur transition-colors hover:bg-surface sm:hidden"
        >
          <Icon name="chevron-right" className="rotate-180" size={18} />
        </button>
      )}

      {/* Flecha derecha (solo móvil) */}
      {cardIndex < TOTAL_CARDS - 1 && (
        <button
          onClick={() => scrollToCard(cardIndex + 1)}
          aria-label="Tarjeta siguiente"
          className="absolute right-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow-[var(--shadow-rest)] backdrop-blur transition-colors hover:bg-surface sm:hidden"
        >
          <Icon name="chevron-right" size={18} />
        </button>
      )}
    </div>
  )
}
