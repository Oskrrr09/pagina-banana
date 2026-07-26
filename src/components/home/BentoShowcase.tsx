import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { ProductImage } from '../product/ProductImage'
import { iphoneModels } from '../../data/products'
import { euro } from '../../lib/format'

// Rejilla "bento" (estilo Apple): tarjetas de distinto tamaño que combinan el
// producto estrella con los servicios clave. Impacto de marketing de un vistazo.
const feature = iphoneModels.find((m) => m.slug === '17-pro') ?? iphoneModels[0]

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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
      {/* Producto estrella (2×2) */}
      <Cell
        to={`/iphone/${feature.slug}`}
        className="bg-neutral sm:col-span-2 lg:col-span-2 lg:row-span-2"
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
      <Cell to="/servicios#financiacion" className="bg-banana text-ink">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-black/10">
          <Icon name="credit-card" />
        </span>
        <h3 className="mt-4 text-lg font-bold">Financiación</h3>
        <p className="mt-1 text-sm text-ink/80">Llévatelo hoy y págalo hasta en 24 meses.</p>
        <span className="mt-auto pt-3 text-sm font-semibold">Simular cuota ›</span>
      </Cell>

      {/* Plan Renove */}
      <Cell to="/plan-renove" className="bg-surface">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-050 text-ink">
          <Icon name="refresh" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink">Plan Renove</h3>
        <p className="mt-1 text-sm text-muted">Tu Apple actual vale más de lo que crees.</p>
        <span className="mt-auto pt-3 text-sm font-semibold text-ink">Valorar ›</span>
      </Cell>

      {/* Tiendas */}
      <Cell to="/tiendas" className="bg-ink text-white">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-banana">
          <Icon name="store" />
        </span>
        <h3 className="mt-4 text-lg font-bold">Tiendas en Canarias</h3>
        <p className="mt-1 text-sm text-white/70">Recogida gratis y servicio técnico cerca de ti.</p>
        <span className="mt-auto pt-3 text-sm font-semibold text-banana">Ver tiendas ›</span>
      </Cell>

      {/* Envío */}
      <Cell to="/servicios" className="bg-surface">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-050 text-ink">
          <Icon name="truck" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-ink">Envío a toda Canarias</h3>
        <p className="mt-1 text-sm text-muted">Rápido y con seguimiento en cada pedido.</p>
        <span className="mt-auto pt-3 text-sm font-semibold text-ink">Cómo funciona ›</span>
      </Cell>
    </div>
  )
}
