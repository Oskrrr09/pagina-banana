import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { FamilyNav } from '../../data/nav'
import { Placeholder } from '../ui/Placeholder'
import { Icon } from '../ui/Icon'

// Mega-menú de escritorio (§2.4 / §4.2): tres columnas Explorar / Comprar /
// Destacado. Se abre con hover (con retardo en el Header) y cierra con Escape.
export function MegaMenu({ family, onNavigate }: { family: FamilyNav; onNavigate: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-0 right-0 top-full z-50 border-t border-line bg-surface shadow-[var(--shadow-raised)]"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_1fr_1.2fr] lg:px-8">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">Explorar</p>
            {family.demo && (
              <p className="mb-3 rounded-[8px] bg-neutral px-3 py-2 text-xs text-muted">
                En este prototipo, la familia desarrollada a fondo es iPhone.
              </p>
            )}
            <ul className="space-y-1">
              {family.mega.explore.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className="flex items-center justify-between rounded-[8px] px-3 py-2 text-[15px] font-medium text-ink transition-colors hover:bg-neutral hover:text-brand"
                  >
                    {item.label}
                    <Icon name="chevron-right" size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">Comprar</p>
            <ul className="space-y-1">
              {family.mega.buy.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className="block rounded-[8px] px-3 py-2 text-[15px] text-muted transition-colors hover:bg-neutral hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">Destacado</p>
            <Link to={family.mega.featured.to} onClick={onNavigate} className="group block">
              <Placeholder label={family.mega.featured.name} tint={family.mega.featured.tint} ratio="16 / 10" />
              <p className="mt-3 font-display text-lg font-bold text-ink">{family.mega.featured.name}</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-action group-hover:gap-2 transition-all">
                {family.mega.featured.cta} <Icon name="arrow-right" size={16} />
              </p>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
