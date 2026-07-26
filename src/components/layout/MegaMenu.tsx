import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { FamilyNav } from '../../data/nav'
import { Placeholder } from '../ui/Placeholder'
import { Icon } from '../ui/Icon'

// Mega-menú de escritorio (§2.4 / §4.2): tres columnas Explorar / Comprar /
// Destacado. Se abre con hover (con retardo en el Header) y cierra con Escape.
// Micro-animación: el panel baja suavemente y sus enlaces aparecen en cascada
// (stagger) para dar una sensación orgánica sin distraer.
const panel = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.035, delayChildren: 0.04 },
  },
}
const item = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}

export function MegaMenu({ family, onNavigate }: { family: FamilyNav; onNavigate: () => void }) {
  return (
    <motion.div
      variants={panel}
      initial="hidden"
      animate="show"
      className="absolute left-0 right-0 top-full z-50 border-t border-line bg-surface shadow-[var(--shadow-raised)]"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_1fr_1.2fr] lg:px-8">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">Explorar</p>
          {family.demo && (
            <motion.p variants={item} className="mb-3 rounded-[8px] bg-neutral px-3 py-2 text-xs text-muted">
              En este prototipo, la familia desarrollada a fondo es iPhone.
            </motion.p>
          )}
          <ul className="space-y-1">
            {family.mega.explore.map((link) => (
              <motion.li key={link.label} variants={item}>
                <Link
                  to={link.to}
                  onClick={onNavigate}
                  className="flex items-center justify-between rounded-[8px] px-3 py-2 text-[15px] font-medium text-ink transition-colors hover:bg-neutral hover:text-ink"
                >
                  {link.label}
                  <Icon name="chevron-right" size={16} className="text-muted" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">Comprar</p>
          <ul className="space-y-1">
            {family.mega.buy.map((link) => (
              <motion.li key={link.label} variants={item}>
                <Link
                  to={link.to}
                  onClick={onNavigate}
                  className="block rounded-[8px] px-3 py-2 text-[15px] text-muted transition-colors hover:bg-neutral hover:text-ink"
                >
                  {link.label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div variants={item}>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">Destacado</p>
          <Link to={family.mega.featured.to} onClick={onNavigate} className="group block">
            <Placeholder label={family.mega.featured.name} tint={family.mega.featured.tint} ratio="16 / 10" />
            <p className="mt-3 font-display text-lg font-bold text-ink">{family.mega.featured.name}</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-ink transition-all group-hover:gap-2">
              {family.mega.featured.cta} <Icon name="arrow-right" size={16} />
            </p>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}
