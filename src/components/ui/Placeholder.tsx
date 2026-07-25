// Marcador de imagen (§10): claramente identificado como provisional,
// nunca una fotografía real de Apple sin licencia. Reproduce la caja con
// aspa de los wireframes, con un color de tinte opcional por variante.

interface PlaceholderProps {
  label?: string
  tint?: string
  ratio?: string // p. ej. '1 / 1', '4 / 3', '16 / 9'
  rounded?: boolean
  className?: string
}

export function Placeholder({
  label,
  tint,
  ratio = '1 / 1',
  rounded = true,
  className = '',
}: PlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label ? `Imagen de ejemplo: ${label}` : 'Imagen de ejemplo'}
      className={`relative grid place-items-center overflow-hidden bg-neutral ${
        rounded ? 'rounded-[12px]' : ''
      } ${className}`}
      style={{ aspectRatio: ratio, background: tint ? `${tint}14` : undefined }}
    >
      <svg className="absolute inset-0 h-full w-full text-line" preserveAspectRatio="none" viewBox="0 0 100 100">
        <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {tint && (
        <span
          className="absolute h-14 w-14 rounded-full opacity-70"
          style={{ background: tint }}
          aria-hidden="true"
        />
      )}
      {label && (
        <span className="relative z-10 max-w-[80%] text-center text-xs font-medium text-muted">
          {label}
        </span>
      )}
    </div>
  )
}
