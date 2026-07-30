import { Link } from 'react-router-dom'
import { ProvisionalBadge } from '../ui/Tag'
import { euro } from '../../lib/format'
import type { Accessory } from '../../data/accessories'
import { accessoryPath } from '../../data/accessories'
import { ProductImage } from './ProductImage'

// Tarjeta de accesorio (§4.5). Comparte la jerarquía visual con
// `ProductCard` (mismo borde, radio, padding, altura mínima, hover,
// sombra) para que en el catálogo y en el buscador los accesorios se
// perciban como productos del mismo nivel.
//
// NO añade favoritos, carrito, comparador ni seguro — los accesorios
// no participan en esos flujos en esta fase.
export function AccessoryCard({ accessory }: { accessory: Accessory }) {
  const compat = describeCompatibility(accessory)

  return (
    <div className="group relative flex h-full min-h-[400px] flex-col rounded-[12px] border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-banana hover:shadow-[var(--shadow-raised)]">
      <Link to={accessoryPath(accessory.slug)} className="block focus-visible:outline-none">
        <ProductImage
          src={accessory.image}
          alt={accessory.name}
          bgColor={accessory.imageBg}
          pad={!accessory.imageBg}
        />
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
          {categoryLabel(accessory.category)}
        </p>
        <h3 className="mt-1 min-h-10 text-[15px] font-semibold text-ink group-hover:text-ink">
          {accessory.name}
        </h3>
      </Link>

      <p className="mt-1 min-h-10 line-clamp-2 text-sm text-muted">{compat}</p>

      <div className="mt-auto pt-3">
        {accessory.price != null ? (
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-ink">
              {accessory.priceLabel === 'desde' ? 'desde ' : ''}
              {euro(accessory.price)}
            </span>
            <ProvisionalBadge label="Precio demostrativo" />
          </div>
        ) : (
          <span className="text-sm font-semibold text-ink">Consultar precio</span>
        )}
      </div>
    </div>
  )
}

function categoryLabel(category: Accessory['category']): string {
  switch (category) {
    case 'carga':
      return 'Carga y cables'
    case 'iphone':
      return 'Accesorios iPhone'
    case 'ipad':
      return 'Accesorios iPad'
    case 'mac':
      return 'Accesorios Mac'
    case 'apple-watch':
      return 'Accesorios Apple Watch'
    case 'airtag':
      return 'AirTag'
  }
}

function describeCompatibility(a: Accessory): string {
  const models = a.compatibility.models ?? []
  const families = a.compatibility.families ?? []
  if (models.length > 0) {
    const readable = models
      .map((m) => m.split('/')[1])
      .map((s) => s.replace(/-/g, ' '))
      .join(', ')
    return `Compatible con ${readable}`
  }
  if (families.length > 0) {
    return `Compatible con ${families
      .map((f) => familyDisplay(f))
      .join(', ')}`
  }
  return 'Consulta compatibilidad en la ficha'
}

function familyDisplay(family: string): string {
  switch (family) {
    case 'apple-watch':
      return 'Apple Watch'
    case 'iphone':
      return 'iPhone'
    case 'ipad':
      return 'iPad'
    case 'mac':
      return 'Mac'
    case 'airpods':
      return 'AirPods'
    default:
      return family
  }
}
