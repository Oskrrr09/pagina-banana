import type { ReactNode } from 'react'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

// Sección con fondo alterno opcional (§5.1: fondo neutro para secciones alternas).
export function Section({
  children,
  alt = false,
  className = '',
  id,
}: {
  children: ReactNode
  alt?: boolean
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`${alt ? 'bg-neutral' : 'bg-surface'} py-14 sm:py-20 ${className}`}>
      <Container>{children}</Container>
    </section>
  )
}

export function SectionHeader({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      {eyebrow && (
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-brand">{eyebrow}</p>
      )}
      <h2 className="text-[26px] font-bold leading-tight text-ink sm:text-3xl">{title}</h2>
      {desc && <p className="mt-3 text-[15px] leading-relaxed text-muted">{desc}</p>}
    </div>
  )
}
