import { Link } from 'react-router-dom'
import { ProvisionalBadge } from '../ui/Tag'
import { euro } from '../../lib/format'
import { AccessoryImage } from '../product/AccessoryImage'
import { getAccessory } from '../../data/accessories'
import type { SearchItem } from '../../data/searchIndex'

// Tarjeta visual para un accesorio Apple del catálogo real en /buscar
// (§4.5). Muestra fotografía, nombre, marca, categoría, compatibilidad
// resumida y precio demostrativo. Enlaza a /accesorios/:slug. Se usa
// solo para `kind: 'apple-accessory'` con `demo: false` — los terceros
// demostrativos siguen usando `CompactSearchCard`.
export function AccessorySearchCard({ item }: { item: SearchItem }) {
  // La ruta contiene el slug: /accesorios/<slug>
  const slug = item.route?.split('/').pop() ?? ''
  const accessory = getAccessory(slug)
  const compat = describeCompatibility(item)
  return (
    <Link
      to={item.route ?? '/accesorios'}
      className="group flex h-full flex-col overflow-hidden rounded-[12px] border border-line bg-surface transition-colors hover:border-ink/30"
    >
      <AccessoryImage
        src={item.image ?? accessory?.image ?? ''}
        alt={item.name}
        size="card"
        presentation={accessory?.imagePresentation}
        imageBg={accessory?.imageBg}
        width={400}
        height={400}
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Accesorio Apple
        </p>
        <p className="text-sm font-semibold text-ink">{item.name}</p>
        {compat && <p className="text-xs text-muted">{compat}</p>}
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
          {accessory?.price != null ? (
            <>
              <span className="text-sm font-bold text-ink">{euro(accessory.price)}</span>
              <ProvisionalBadge label="Precio demostrativo" />
            </>
          ) : (
            <span className="text-xs font-semibold text-ink">Consultar precio</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function describeCompatibility(item: SearchItem): string {
  if (item.compatibleWith && item.compatibleWith.length > 0) {
    return `Compatible con ${item.compatibleWith.join(', ')}`
  }
  if (item.category) return item.category
  return ''
}
