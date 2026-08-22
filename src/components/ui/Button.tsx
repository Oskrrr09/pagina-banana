import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Botones (§5.5): primario (relleno ámbar), secundario (contorno),
// terciario (enlace de texto). Radio 12px. Estados hover/active con
// micro-movimiento sutil; deshabilitado con opacidad reducida.

type Variant = 'primary' | 'secondary' | 'tertiary' | 'brand'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold transition-[transform,background-color,color,border-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 select-none'

const variants: Record<Variant, string> = {
  // Relleno amarillo Banana con texto negro (legible sobre amarillo).
  primary: 'bg-action text-[#1d1d1f] hover:bg-action-600 hover:-translate-y-0.5 shadow-[var(--shadow-rest)]',
  brand: 'bg-brand text-[#1d1d1f] hover:bg-brand-600 hover:-translate-y-0.5 shadow-[var(--shadow-rest)]',
  secondary:
    'border border-ink/20 text-ink bg-transparent hover:bg-action-050 hover:border-ink/40 hover:-translate-y-0.5',
  tertiary: 'text-ink underline-offset-4 hover:underline px-0',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 text-sm',
  md: 'h-11 text-[15px]',
  lg: 'h-13 text-base min-h-[48px]',
}

// El padding horizontal sale del tamaño, pero vive aparte para poder
// sustituirlo.
//
// POR QUÉ NO BASTA CON PASARLO EN `className`
//
// `px-3` y `px-8` son la misma propiedad con la misma especificidad: gana la
// que Tailwind emita más tarde en la hoja, no la que se escriba después en el
// atributo. Con `sizes` incluyendo `px-8`, tres llamadas de la barra de compra
// pedían `px-3`/`px-4` y recibían 32 px por lado igualmente —medido: 64 px de
// padding por botón—. Eran overrides muertos, y ahí nació UI-002.
//
// Separándolo, quien necesita otro padding lo sustituye en vez de competir con
// él, y quien no pasa nada recibe exactamente lo de siempre.
const paddingsX: Record<Size, string> = {
  sm: 'px-4',
  md: 'px-6',
  lg: 'px-8',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
  /** Sustituye el padding horizontal del tamaño. Admite variantes responsive. */
  paddingX?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  paddingX,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls =
    variant === 'tertiary'
      ? `${base} ${variants[variant]} ${className}`
      : `${base} ${variants[variant]} ${sizes[size]} ${paddingX ?? paddingsX[size]} ${className}`
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  paddingX,
  to,
  children,
}: CommonProps & { to: string }) {
  const cls =
    variant === 'tertiary'
      ? `${base} ${variants[variant]} ${className}`
      : `${base} ${variants[variant]} ${sizes[size]} ${paddingX ?? paddingsX[size]} ${className}`
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}
