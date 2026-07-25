import { Link } from 'react-router-dom'
import { Icon } from './Icon'

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <Icon name="chevron-right" size={14} className="text-line" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
