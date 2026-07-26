import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { getTodayHours, stores } from '../../data/stores'

// Carrusel de tiendas para la home: avanza solo cada pocos segundos y permite
// navegar con las flechas o los puntos. Se pausa al pasar el cursor por encima.
const INTERVAL = 5000

export function StoreCarousel() {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)

  const go = (next: number, direction: number) => {
    setDir(direction)
    setIndex((next + stores.length) % stores.length)
  }

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => go(index + 1, 1), INTERVAL)
    return () => clearTimeout(t)
  }, [index, paused])

  const store = stores[index]
  const todayHours = getTodayHours(store)

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrusel"
    >
      <div className="relative h-[380px] overflow-hidden rounded-[20px] border border-line bg-neutral sm:h-[340px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={store.slug}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col px-16 py-8 sm:px-20 sm:py-10"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                <Icon name="clock" size={14} />
                Hoy: {todayHours?.time ?? 'Consulta el horario'}
              </span>
              <span className="text-sm text-muted">· {store.island}</span>
            </div>

            <h3 className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">{store.name}</h3>
            <p className="mt-2 flex items-start gap-2 text-muted">
              <Icon name="map-pin" size={18} className="mt-0.5 shrink-0" />
              {store.address}
            </p>

            <div className="mt-4 min-h-16 flex flex-wrap content-start gap-2">
              {store.services.slice(0, 4).map((s) => (
                <span key={s} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink">
                  {s}
                </span>
              ))}
            </div>

            <Link
              to={`/tiendas/${store.slug}`}
              className="mt-auto inline-flex items-center gap-1 pt-6 font-semibold text-ink transition-all hover:gap-2"
            >
              Ver tienda <Icon name="arrow-right" size={16} />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Flechas */}
        <button
          onClick={() => go(index - 1, -1)}
          aria-label="Tienda anterior"
          className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow-[var(--shadow-rest)] backdrop-blur transition-colors hover:bg-surface"
        >
          <Icon name="chevron-right" className="rotate-180" />
        </button>
        <button
          onClick={() => go(index + 1, 1)}
          aria-label="Tienda siguiente"
          className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow-[var(--shadow-rest)] backdrop-blur transition-colors hover:bg-surface"
        >
          <Icon name="chevron-right" />
        </button>
      </div>

      {/* Puntos indicadores */}
      <div className="mt-4 flex justify-center gap-2">
        {stores.map((s, i) => (
          <button
            key={s.slug}
            onClick={() => go(i, i > index ? 1 : -1)}
            aria-label={`Ir a ${s.name}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-brand' : 'w-2 bg-line hover:bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
