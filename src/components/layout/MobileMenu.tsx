import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { familiesNav, directLinks } from '../../data/nav'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'

// Menú móvil (§4.3): overlay de pantalla completa. Buscador siempre arriba.
// Cada familia se expande in situ (acordeón) sin cambiar de pantalla.
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(q.trim())}`)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex flex-col bg-surface lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Logo onClick={onClose} />
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-neutral"
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form onSubmit={submitSearch} className="mb-2">
              <div className="flex items-center gap-2 rounded-full border border-line bg-neutral px-4 py-3">
                <Icon name="search" className="text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar…"
                  aria-label="Buscar"
                  className="w-full bg-transparent text-base outline-none placeholder:text-muted"
                />
              </div>
            </form>

            <nav>
              <ul>
                {familiesNav.map((fam) => {
                  const isOpen = expanded === fam.slug
                  return (
                    <li key={fam.slug} className="border-b border-line">
                      <button
                        onClick={() => setExpanded(isOpen ? null : fam.slug)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between py-4 text-left text-lg font-bold text-ink"
                      >
                        {fam.name}
                        <Icon
                          name="chevron-down"
                          className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <ul className="pb-3">
                              {fam.mega.explore.map((item) => (
                                <li key={item.label}>
                                  <Link
                                    to={item.to}
                                    onClick={onClose}
                                    className="block py-2.5 pl-1 text-[15px] text-muted hover:text-brand"
                                  >
                                    {item.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  )
                })}

                {directLinks.map((l) => (
                  <li key={l.to} className="border-b border-line">
                    <Link
                      to={l.to}
                      onClick={onClose}
                      className="block py-4 text-lg font-bold text-ink hover:text-brand"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="border-t border-line px-5 py-4 text-sm text-muted">
            <div className="flex items-center gap-5">
              <Link to="/favoritos" onClick={onClose} className="flex items-center gap-1.5 hover:text-ink">
                <Icon name="heart" size={18} /> Favoritos
              </Link>
              <button className="flex items-center gap-1.5 hover:text-ink">
                <Icon name="user" size={18} /> Cuenta
              </button>
              <button className="hover:text-ink">Idioma: ES</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
