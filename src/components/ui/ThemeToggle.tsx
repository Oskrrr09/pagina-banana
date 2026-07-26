import { useTheme } from '../../lib/theme'
import { Icon } from './Icon'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const nextLabel = theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-ink/10 ${className}`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  )
}
