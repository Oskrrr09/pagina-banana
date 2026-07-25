// Chip de selección (§6): área táctil ≥44px, nombre siempre en texto (no solo
// color), estado deshabilitado anunciado (no solo atenuado).

export function Chip({
  selected,
  disabled,
  children,
  onClick,
  swatch,
  ariaLabel,
}: {
  selected?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  swatch?: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={[
        'inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-medium transition-all duration-150',
        selected
          ? 'border-brand bg-brand-050 text-brand ring-1 ring-brand'
          : 'border-line bg-surface text-ink hover:border-ink/30',
        disabled ? 'cursor-not-allowed opacity-45 line-through' : 'hover:-translate-y-0.5',
      ].join(' ')}
    >
      {swatch && (
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-black/10"
          style={{ background: swatch }}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
