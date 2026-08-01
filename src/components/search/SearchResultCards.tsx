import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { ProvisionalBadge } from '../ui/Tag'
import type { SearchItem } from '../../data/searchIndex'
import { useCatalogo } from '../../lib/i18n'

// Tarjeta compacta para productos relacionados y accesorios (Apple o
// compatibles). NO muestra precio, stock, financiación ni CTA de compra.
// Cuando el ítem es demostrativo lo etiqueta como "Contenido demostrativo".
export function CompactSearchCard({ item }: { item: SearchItem }) {
  const cat = useCatalogo()
  const iconByKind: Record<string, string> = {
    'apple-accessory': 'shield',
    'compatible-accessory': 'shield',
    'related-product': 'star',
    service: 'store',
    help: 'info',
    'apple-family': 'search',
    'apple-device': 'search',
  }
  const iconName = iconByKind[item.kind] ?? 'search'
  const brand = item.brand ?? 'Genérica'
  const relLabel = describeRelation(item, cat)

  const inner = (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-neutral text-muted">
        <Icon name={iconName} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{cat(item.name)}</p>
        <p className="mt-0.5 text-xs text-muted">
          {brand}
          {relLabel ? ` · ${relLabel}` : ''}
        </p>
        {item.demo && (
          <div className="mt-2">
            <ProvisionalBadge label="Contenido demostrativo" />
          </div>
        )}
      </div>
    </div>
  )

  if (item.route) {
    return (
      <Link
        to={item.route}
        className="block rounded-[12px] border border-line bg-surface p-3 hover:border-ink/30 hover:bg-neutral"
      >
        {inner}
      </Link>
    )
  }
  return (
    <div className="rounded-[12px] border border-dashed border-line bg-surface p-3">
      {inner}
    </div>
  )
}

function describeRelation(item: SearchItem, cat: (t: string, v?: Record<string, string>) => string): string {
  if (item.compatibleWith && item.compatibleWith.length > 0) {
    return cat('Compatible con {productos}', { productos: item.compatibleWith.join(', ') })
  }
  if (item.category) return item.category
  return ''
}

// Encabezado de sección con conteo opcional.
export function SearchSectionHeading({
  title,
  count,
}: {
  title: string
  count?: number
}) {
  return (
    <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold text-ink">
      {title}
      {count != null && count > 0 && (
        <span className="text-sm font-medium text-muted">({count})</span>
      )}
    </h2>
  )
}
