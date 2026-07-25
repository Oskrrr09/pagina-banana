import type { Availability } from '../../data/types'
import { Icon } from './Icon'

// Indicador de stock (§6): color + texto, NUNCA solo color (accesibilidad 9.4).
const config: Record<Availability, { label: string; cls: string; icon: string }> = {
  disponible: { label: 'Disponible', cls: 'text-available bg-available-050 border-available/30', icon: 'check' },
  'bajo-pedido': { label: 'Bajo pedido', cls: 'text-backorder bg-backorder-050 border-backorder/40', icon: 'clock' },
  agotado: { label: 'Agotado', cls: 'text-soldout bg-neutral border-line', icon: 'info' },
}

export function StockIndicator({
  status,
  note,
  size = 'md',
}: {
  status: Availability
  note?: string
  size?: 'sm' | 'md'
}) {
  const c = config[status]
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold ${c.cls} ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        }`}
      >
        <Icon name={c.icon} size={size === 'sm' ? 13 : 15} />
        {c.label}
      </span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </span>
  )
}
