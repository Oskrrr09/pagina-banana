import type { ProvisionalTag } from '../../data/types'

// Etiqueta de contenido provisional (§7): visible en el propio prototipo,
// no solo en el documento. Ámbar sobre fondo claro, texto en grafito.
export function ProvisionalBadge({ label, className = '' }: { label: ProvisionalTag | string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line bg-neutral px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted ${className}`}
      title="Dato de ejemplo, pendiente de validación con Banana Computer"
    >
      {label}
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
