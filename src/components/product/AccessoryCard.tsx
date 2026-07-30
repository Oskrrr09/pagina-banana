import { Link } from 'react-router-dom'
import { ProvisionalBadge } from '../ui/Tag'
import { euro } from '../../lib/format'
import type { Accessory } from '../../data/accessories'
import { accessoryPath } from '../../data/accessories'

// Tarjeta compacta de accesorio (§4.5). Coherente con `ProductCard` en
// espaciado y estilos, pero sin importar su código: los accesorios no
// tienen carrito, favoritos, comparador ni seguro en esta PR.
export function AccessoryCard({ accessory }: { accessory: Accessory }) {
  const compat = describeCompatibility(accessory)
  return (
    <Link
      to={accessoryPath(accessory.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-line bg-surface transition-colors hover:border-ink/30"
    >
      <div
        className="flex aspect-square w-full items-center justify-center"
        style={{ background: accessory.imageBg ?? '#fafafa' }}
      >
        <img
          src={accessory.image}
          alt={accessory.name}
          width={800}
          height={800}
          loading="lazy"
          className="max-h-full max-w-full object-contain p-6"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
          {categoryLabel(accessory.category)}
        </p>
        <h3 className="text-[15px] font-semibold text-ink">{accessory.name}</h3>
        <p className="text-xs text-muted">{compat}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
          {accessory.price != null ? (
            <>
              <span className="text-[15px] font-bold text-ink">
                {euro(accessory.price)}
              </span>
              <ProvisionalBadge label="Precio demostrativo" />
            </>
          ) : (
            <span className="text-sm font-semibold text-ink">
              Consultar precio
            </span>
          )}
        </div>
      </div>
    </Link>
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
