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
  primary: 'bg-action text-white hover:bg-action-600 hover:-translate-y-0.5 shadow-[var(--shadow-rest)]',
  brand: 'bg-brand text-white hover:bg-brand-600 hover:-translate-y-0.5 shadow-[var(--shadow-rest)]',
  secondary:
    'border border-action text-action bg-transparent hover:bg-action-050 hover:-translate-y-0.5',
  tertiary: 'text-action hover:text-action-600 underline-offset-4 hover:underline px-0',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[15px]',
  lg: 'h-13 px-8 text-base min-h-[48px]',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = variant === 'tertiary' ? `${base} ${variants[variant]} ${className}` : `${base} ${variants[variant]} ${sizes[size]} ${className}`
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
  to,
  children,
}: CommonProps & { to: string }) {
  const cls = variant === 'tertiary' ? `${base} ${variants[variant]} ${className}` : `${base} ${variants[variant]} ${sizes[size]} ${className}`
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}
