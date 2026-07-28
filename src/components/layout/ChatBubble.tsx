import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'

// Chat provisional (§8): solo un aviso, sin conversación real ni backend.
// - Oculto en /checkout/* para no distraer del proceso de compra.
// - Panel accesible: role="dialog" + aria-modal, foco al primer control al
//   abrir, trampa de foco confinada entre los controles del panel, Escape
//   cierra y devuelve el foco al botón flotante.
// - Mientras está abierto, el contenido de fondo se marca como `inert` para
//   que no reciba foco ni interacción de puntero.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function ChatBubble() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  // Oculto durante el checkout (los tres pasos): /checkout/1|2|3.
  const inCheckout = location.pathname.startsWith('/checkout')

  const close = useCallback(() => {
    setOpen(false)
    // El foco vuelve al botón flotante que abrió el panel.
    buttonRef.current?.focus()
  }, [])

  // Foco inicial al abrir + trampa de Tab/Shift+Tab + Escape para cerrar.
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const focusFrame = window.requestAnimationFrame(() => {
      closeRef.current?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      // Si el foco escapa del panel por cualquier motivo, lo devolvemos al
      // primer/último control según la dirección del Tab.
      if (!panel.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
        return
      }
      if (event.shiftKey && active === first) {
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
    }
  }, [open, close])

  // Marca el resto del documento como `inert` mientras el panel está abierto
  // para que no reciba foco ni clics; se restaura al cerrar/desmontar.
  useEffect(() => {
    if (!open) return
    const wrapper = panelRef.current?.closest('[data-chat-root]')
    const siblings: Element[] = []
    if (wrapper?.parentElement) {
      for (const child of Array.from(wrapper.parentElement.children)) {
        if (child !== wrapper) siblings.push(child)
      }
    }
    for (const el of siblings) el.setAttribute('inert', '')
    return () => {
      for (const el of siblings) el.removeAttribute('inert')
    }
  }, [open])

  if (inCheckout) return null

  return (
    <div data-chat-root className="fixed bottom-6 right-4 z-[75] sm:right-6">
      {open && (
        <div
          ref={panelRef}
          id="chat-banana-preview"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-banana-title"
          className="mb-3 w-[min(19rem,calc(100vw-2rem))] rounded-[16px] border border-black/10 bg-surface p-4 shadow-raised"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id="chat-banana-title" className="font-bold text-ink">
                Chat con Banana
              </p>
              <p className="mt-1 text-sm text-muted">
                El chat estará disponible próximamente. Mientras tanto, puedes visitar nuestro centro
                de soporte.
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Cerrar información del chat"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-neutral hover:text-ink"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <Link
            to="/soporte"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex min-h-11 items-center font-semibold text-ink underline-offset-4 hover:underline"
          >
            Ir a soporte
          </Link>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? 'Ocultar chat' : 'Abrir información del chat'}
        aria-expanded={open}
        aria-controls="chat-banana-preview"
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto grid h-14 w-14 place-items-center rounded-full border border-black/10 bg-brand text-[#1d1d1f] shadow-raised transition-transform hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0"
      >
        <Icon name={open ? 'close' : 'chat'} size={25} />
      </button>
    </div>
  )
}
