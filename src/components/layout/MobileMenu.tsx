import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import { familiesNav, directLinks } from '../../data/nav'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'

// Menú móvil (§4.3): overlay de pantalla completa.
// Cada familia se expande in situ (acordeón) sin cambiar de pantalla.
// El buscador vive en la barra de navegación como icono de lupa.
export function MobileMenu({
  open,
  onClose,
  returnFocusRef,
}: {
  open: boolean
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement>
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'))

      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      window.requestAnimationFrame(() => returnFocusRef.current?.focus())
    }
  }, [onClose, open, returnFocusRef])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          id="mobile-navigation-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex flex-col bg-surface xl:hidden"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Logo onClick={onClose} />
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Cerrar menú"
              className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-neutral"
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <nav aria-label="Navegación principal móvil">
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
                                    className="block py-2.5 pl-1 text-[15px] text-muted hover:text-ink"
                                  >
                                    {item.label}
                                  </Link>
                                </li>
                              ))}
                              {!fam.demo && (
                                <li>
                                  <Link
                                    to={`/${fam.slug}`}
                                    onClick={onClose}
                                    className="block py-2.5 pl-1 text-[15px] font-semibold text-ink hover:text-ink"
                                  >
                                    Ver todos
                                  </Link>
                                </li>
                              )}
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
                      className="block py-4 text-lg font-bold text-ink hover:text-ink"
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
