import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { euro } from '../../lib/format'
import { useIdioma } from '../../lib/i18n'
import type { ClaveTexto } from '../../lib/i18n'

// Carrusel principal (§4.1): rota 4 slides con autoplay pausable. Cada slide
// combina fondo específico + texto a la izquierda + imagen de producto a la
// derecha. Autoplay de 6 s, pausa en hover, control con puntos y flechas.

const IMG = `${import.meta.env.BASE_URL}img/products`

interface Slide {
  key: string
  /** Nombre de producto: igual en los cinco idiomas. */
  eyebrow: string
  titleKey: ClaveTexto
  /** Cifra desnuda: el «desde» y el símbolo los pone el idioma activo. */
  fromPrice: number
  ctaKey: ClaveTexto
  to: string
  image: string
  bg: string
  text: 'light' | 'dark'
}

const slides: Slide[] = [
  {
    key: 'iphone-17-pro',
    eyebrow: 'iPhone 17 Pro',
    titleKey: 'hero.iphone.title',
    fromPrice: 1229,
    ctaKey: 'hero.cta.buy',
    to: '/iphone/17-pro',
    image: `${IMG}/17pro-plata.webp`,
    bg: 'linear-gradient(135deg,#0a0a0c 0%,#1c1d20 55%,#2a2a2e 100%)',
    text: 'light',
  },
  {
    key: 'macbook-air-m5',
    eyebrow: 'MacBook Air M5',
    titleKey: 'hero.mac.title',
    fromPrice: 1319,
    ctaKey: 'hero.cta.discover',
    to: '/mac/macbook-air-m5',
    image: `${IMG}/macbook-air-medianoche.webp`,
    bg: 'linear-gradient(135deg,#dbe9f5 0%,#e5dff2 50%,#ffeed1 100%)',
    text: 'dark',
  },
  {
    key: 'ipad-pro',
    eyebrow: 'iPad Pro M5',
    titleKey: 'hero.ipad.title',
    fromPrice: 1229,
    ctaKey: 'hero.cta.viewIpadPro',
    to: '/ipad/ipad-pro',
    image: `${IMG}/ipad-pro-13-negro.webp`,
    bg: 'linear-gradient(135deg,#111 0%,#22222b 55%,#3a3a45 100%)',
    text: 'light',
  },
  {
    key: 'watch-ultra-3',
    eyebrow: 'Apple Watch Ultra 3',
    titleKey: 'hero.watch.title',
    fromPrice: 909,
    ctaKey: 'hero.cta.discover',
    to: '/apple-watch/watch-ultra-3',
    image: `${IMG}/watch-ultra-3-natural-alpine.webp`,
    bg: 'linear-gradient(135deg,#131413 0%,#25231e 50%,#3a3128 100%)',
    text: 'light',
  },
]

const AUTOPLAY_MS = 6000

export function HeroCarousel() {
  const { t, intl } = useIdioma()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (paused) return
    timer.current = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [index, paused])

  const goTo = (i: number) => setIndex((i + slides.length) % slides.length)

  const slide = slides[index]
  const light = slide.text === 'light'

  return (
    <section
      className="relative isolate overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: slide.bg }}
          className="w-full"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-5 py-10 md:min-h-[440px] md:grid-cols-2 md:gap-10 md:px-8 md:py-14 lg:min-h-[500px]">
            <div className={`z-10 ${light ? 'text-white' : 'text-ink'}`}>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className={`text-sm font-bold uppercase tracking-[0.18em] ${light ? 'text-banana' : 'text-ink/80'}`}
              >
                {slide.eyebrow}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl"
              >
                {t(slide.titleKey)}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className={`mt-4 text-lg font-semibold ${light ? 'text-white/85' : 'text-muted'}`}
              >
                {t('hero.from', { importe: euro(slide.fromPrice, intl) })}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="mt-6 flex flex-wrap gap-3"
              >
                <Link
                  to={slide.to}
                  className="inline-flex items-center gap-2 rounded-full bg-banana px-6 py-3 text-sm font-bold text-ink shadow-[var(--shadow-rest)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
                >
                  {t(slide.ctaKey)} <Icon name="arrow-right" size={16} />
                </Link>
                <Link
                  to={slide.to}
                  className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors ${
                    light ? 'border-white/40 text-white hover:bg-white/10' : 'border-ink/25 text-ink hover:bg-ink/5'
                  }`}
                >
                  {t('common.moreInfoShort')}
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-center justify-center"
            >
              <img
                src={slide.image}
                alt={slide.eyebrow}
                width={1080}
                height={1080}
                className="h-64 max-h-[420px] w-auto object-contain sm:h-80 md:h-[400px] lg:h-[440px]"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Flechas */}
      <button
        onClick={() => goTo(index - 1)}
        aria-label="Slide anterior"
        className={`absolute left-2 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full backdrop-blur transition-colors md:h-11 md:w-11 ${
          light ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-ink/10 text-ink hover:bg-ink/20'
        }`}
      >
        <Icon name="chevron-right" className="rotate-180" size={18} />
      </button>
      <button
        onClick={() => goTo(index + 1)}
        aria-label="Slide siguiente"
        className={`absolute right-2 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full backdrop-blur transition-colors md:h-11 md:w-11 ${
          light ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-ink/10 text-ink hover:bg-ink/20'
        }`}
      >
        <Icon name="chevron-right" size={18} />
      </button>

      {/* Puntos */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.key}
            onClick={() => goTo(i)}
            aria-label={`Ir al slide ${i + 1}: ${s.eyebrow}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index
                ? `w-8 ${light ? 'bg-white' : 'bg-ink'}`
                : `w-2 ${light ? 'bg-white/40 hover:bg-white/70' : 'bg-ink/30 hover:bg-ink/60'}`
            }`}
          />
        ))}
      </div>
    </section>
  )
}
