import { useT } from '../../lib/i18n'
import type { ProvisionalTag } from '../../data/types'

// Etiqueta de contenido provisional (§7): visible en el propio prototipo,
// no solo en el documento. Ámbar sobre fondo claro, texto en grafito.
export function ProvisionalBadge({ label, className = '' }: { label?: ProvisionalTag | string; className?: string }) {
  const t = useT()
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line bg-neutral px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted ${className}`}
      title={t('common.demoTooltip')}
    >
      {/* Sin etiqueta, la insignia dice "precio demostrativo": es su uso
          mayoritario y así no hay que repetir el texto en cada llamada. */}
      {label ?? t('common.demoPrice')}
    </span>
  )
}

// Insignia de oferta: rojo Banana, texto blanco (como su web real).
export function OfferBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-danger px-2.5 py-0.5 text-[11px] font-bold text-white">
      {children}
    </span>
  )
}
