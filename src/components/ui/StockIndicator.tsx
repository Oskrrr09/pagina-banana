import type { Availability } from '../../data/types'
import { Icon } from './Icon'
import { useT, type ClaveTexto } from '../../lib/i18n'

// Indicador de stock (§6): color + texto, NUNCA solo color (accesibilidad 9.4).
// El texto es imprescindible aquí, así que también tiene que estar traducido:
// un turista alemán no debe adivinar la disponibilidad por el color.
const config: Record<Availability, { label: ClaveTexto; cls: string; icon: string }> = {
  disponible: { label: 'availability.inStock', cls: 'text-available bg-available-050 border-available/30', icon: 'check' },
  'bajo-pedido': { label: 'availability.backorder', cls: 'text-backorder bg-backorder-050 border-backorder/40', icon: 'clock' },
  agotado: { label: 'availability.soldOut', cls: 'text-soldout bg-neutral border-line', icon: 'info' },
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
  const t = useT()
  const c = config[status]
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold ${c.cls} ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        }`}
      >
        <Icon name={c.icon} size={size === 'sm' ? 13 : 15} />
        {t(c.label)}
      </span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </span>
  )
}
