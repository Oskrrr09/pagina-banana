import { Children, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

// Envoltorio de móvil: en pantallas <sm renderiza los hijos en un carrusel
// horizontal con snap y flechas de navegación; en sm+ delega el layout al
// `desktopClass` (por ejemplo grid de tarjetas). Cada hijo recibe el ancho
// `itemClass` en móvil (por defecto ~85 % del viewport) para que se vea la
// siguiente tarjeta asomando.
export function MobileScroller({
  children,
  desktopClass,
  itemClass = 'w-[85vw] sm:w-auto',
}: {
  children: ReactNode
  desktopClass: string
  itemClass?: string
}) {
  const items = Children.toArray(children)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)

  const scrollToCard = (i: number) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[i] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    setIdx(i)
  }

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    let closest = 0
    let minDist = Infinity
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement
      const cardCenter = c.offsetLeft + c.clientWidth / 2
      const dist = Math.abs(center - cardCenter)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    setIdx(closest)
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 no-scrollbar sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 ${desktopClass}`}
      >
        {items.map((child, i) => (
          <div key={i} className={`shrink-0 snap-center sm:w-auto sm:shrink ${itemClass}`}>
            {child}
          </div>
        ))}
      </div>

      {/* Flechas — sólo visibles en móvil */}
      {idx > 0 && (
        <button
          onClick={() => scrollToCard(idx - 1)}
          aria-label="Anterior"
          className="absolute left-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/95 text-ink shadow-[var(--shadow-rest)] backdrop-blur transition-colors hover:bg-surface sm:hidden"
        >
          <Icon name="chevron-right" className="rotate-180" size={18} />
        </button>
      )}
      {idx < items.length - 1 && (
        <button
          onClick={() => scrollToCard(idx + 1)}
          aria-label="Siguiente"
          className="absolute right-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/95 text-ink shadow-[var(--shadow-rest)] backdrop-blur transition-colors hover:bg-surface sm:hidden"
        >
          <Icon name="chevron-right" size={18} />
        </button>
      )}

      {/* Puntos — sólo visibles en móvil, indican posición */}
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToCard(i)}
              aria-label={`Ir al elemento ${i + 1}`}
              aria-current={i === idx}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-6 bg-ink' : 'w-1.5 bg-ink/25 hover:bg-ink/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
