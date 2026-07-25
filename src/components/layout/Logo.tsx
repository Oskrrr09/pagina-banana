import { Link } from 'react-router-dom'

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink"
      aria-label="Banana Computer — Inicio"
    >
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#1F5C4A" />
        <path
          d="M9 8c0 7 3 13 11 14 1 0 1.6-1 .7-1.6C15 17 13 13 13.2 8.3c0-1-1.4-1.2-2-.5C10.4 8.7 9 8.6 9 8Z"
          fill="#F5C242"
        />
      </svg>
      BANANA
    </Link>
  )
}
