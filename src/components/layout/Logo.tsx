import { Link } from 'react-router-dom'

// Logo real de Banana Computer (su wordmark oficial). `variant` elige la versión
// según el fondo: oscuro para claros/amarillos, blanco para fondos oscuros.
export function Logo({ onClick, variant = 'dark' }: { onClick?: () => void; variant?: 'dark' | 'white' }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="-my-2 -ml-1 flex shrink-0 items-center rounded-lg px-1 py-2 transition-opacity hover:opacity-80"
      aria-label="Banana Computer — Inicio"
    >
      <img
        src={variant === 'white' ? '/img/logo-white.svg' : '/img/logo-dark.svg'}
        alt="Banana Computer"
        className="pointer-events-none h-5 w-auto sm:h-6"
      />
    </Link>
  )
}
