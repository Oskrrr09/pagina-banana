import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import { familiesNav, utilityLinks } from '../../data/nav'
import { isNativeApp } from '../../lib/nativeApp'
import { openChat } from '../../lib/chatLauncher'
import { useT } from '../../lib/i18n'
import { isolateModalBranch } from '../../lib/modalIsolation'
import { useStorePreference } from '../../lib/storePreference'
import { stores } from '../../data/stores'
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
  const t = useT()
  const [expanded, setExpanded] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const returnFocusTo = returnFocusRef.current
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    const restoreOutside = isolateModalBranch(dialogRef.current)

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
      restoreOutside()
      window.requestAnimationFrame(() => returnFocusTo?.focus())
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
          className="app-safe-area fixed inset-0 z-[90] flex flex-col bg-surface xl:hidden"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Logo onClick={onClose} />
            <button
              ref={closeButtonRef}
              type="button"
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
              </ul>
            </nav>

            <FavoriteStoreMobileBlock onClose={onClose} />

            {/* Contacta con nosotros — solo en la app.
                En la web el chat se abre desde su burbuja flotante; dentro de
                la app esa burbuja no existe (competiría con la barra de
                navegación inferior), así que el chat entra por aquí. */}
            {isNativeApp && (
              <div className="mt-6 rounded-[16px] border border-line p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">Contacta con nosotros</p>
                <ul className="grid gap-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        openChat()
                      }}
                      className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left text-[14px] font-medium text-ink hover:bg-neutral"
                    >
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full"
                        style={{ background: '#0768A9' }}
                      >
                        <img
                          src={`${import.meta.env.BASE_URL}img/chat/bananito-square.png`}
                          alt=""
                          width={32}
                          height={32}
                          className="h-6 w-6 object-contain"
                        />
                      </span>
                      <span>
                        Chatea con Bananito
                        <span className="block text-xs font-normal text-muted">Te responde una persona del equipo</span>
                      </span>
                    </button>
                  </li>
                  <li>
                    <Link
                      to="/soporte"
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-[10px] px-2 py-2.5 text-[14px] font-medium text-ink hover:bg-neutral"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral">
                        <Icon name="info" size={16} className="text-muted" />
                      </span>
                      Centro de ayuda
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {/* Servicios y ayuda — mismos enlaces que la barra superior de escritorio */}
            <div className="mt-6 rounded-[16px] bg-neutral p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">Servicios y ayuda</p>
              <ul className="grid grid-cols-2 gap-1">
                {utilityLinks.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      onClick={onClose}
                      className="flex items-center gap-2 rounded-[10px] px-2 py-2.5 text-[14px] font-medium text-ink hover:bg-surface"
                    >
                      <Icon name={l.icon} size={16} className="shrink-0 text-muted" />
                      <span className="truncate">{t(l.label)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-line px-5 py-4 text-sm text-muted">
            <div className="flex items-center gap-5">
              {/* En la app, Favoritos es una pestaña fija de la barra
                  inferior: repetirlo aquí solo ocupa sitio. En la web sí se
                  queda, porque en móvil este menú es la vía para llegar. */}
              {!isNativeApp && (
                <Link to="/favoritos" onClick={onClose} className="flex items-center gap-1.5 hover:text-ink">
                  <Icon name="heart" size={18} /> Favoritos
                </Link>
              )}
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

function FavoriteStoreMobileBlock({ onClose }: { onClose: () => void }) {
  const t = useT()
  const { favoriteStore, setFavorite, clearFavorite } = useStorePreference()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mt-6 rounded-[16px] bg-neutral p-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">Tu tienda</p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-[10px] bg-surface px-3 py-2.5 text-left text-sm font-semibold text-ink"
      >
        <span className="flex items-center gap-2">
          <Icon name="star" size={16} className="shrink-0 text-muted" />
          {favoriteStore ? t('header.myStoreIs', { tienda: favoriteStore.name }) : t('header.chooseStore')}
        </span>
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} className="text-muted" />
      </button>
      {expanded && (
        <ul className="mt-2 space-y-1">
          {stores.map((store) => {
            const active = favoriteStore?.slug === store.slug
            return (
              <li key={store.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setFavorite(store.slug)
                    setExpanded(false)
                    onClose()
                  }}
                  className={`flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm hover:bg-surface ${
                    active ? 'bg-brand-050 font-semibold' : ''
                  }`}
                >
                  <Icon name={active ? 'star' : 'store'} size={14} className="text-muted" />
                  <span>
                    {store.name}
                    <span className="ml-1 text-xs text-muted">{store.island}</span>
                  </span>
                </button>
              </li>
            )
          })}
          {favoriteStore && (
            <li>
              <button
                type="button"
                onClick={() => {
                  clearFavorite()
                  setExpanded(false)
                }}
                className="w-full rounded-[8px] px-3 py-2 text-left text-sm text-danger hover:bg-surface"
              >
                Quitar tienda favorita
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
