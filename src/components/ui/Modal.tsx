import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { isolateModalBranch } from '../../lib/modalIsolation'
import { Icon } from './Icon'

// Modal (§5.5): centrado en escritorio, panel deslizante desde abajo en móvil.
// Foco atrapado mientras está abierto (§9.3); cierra con Escape o botón,
// pero NO al tocar fuera si contiene datos del usuario (dismissable=false).

export function Modal({
  open,
  onClose,
  title,
  children,
  dismissable = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  dismissable?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prevActive = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusables = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ).filter((element) => element.getClientRects().length > 0 && !element.closest('[inert]'))
        if (focusables.length === 0) {
          e.preventDefault()
          panelRef.current?.focus()
          return
        }
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const current = document.activeElement as HTMLElement | null
        const index = current ? focusables.indexOf(current) : -1
        e.preventDefault()
        if (index === -1) (e.shiftKey ? last : first).focus()
        else focusables[(index + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const restoreOutside = isolateModalBranch(
      panelRef.current?.closest('[data-modal-root]') ?? null,
    )

    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      restoreOutside()
      if (prevActive && document.contains(prevActive)) prevActive.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-modal-root
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={dismissable ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ y: '4%', scale: 0.99 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '4%', scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-[20px] bg-surface p-6 shadow-[var(--shadow-raised)] outline-none sm:max-w-lg sm:rounded-[20px]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">{title}</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-neutral hover:text-ink"
              >
                <Icon name="close" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
