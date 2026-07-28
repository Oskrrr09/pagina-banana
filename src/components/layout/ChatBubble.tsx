import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'

// Chat provisional (§8): sólo un aviso, sin conversación real ni backend.
// - No se muestra dentro de /checkout/* para no distraer del proceso de
//   compra ni superponerse con la CTA principal. En el checkout, `CheckoutHelp`
//   ofrece un enlace discreto al soporte.
// - Panel accesible: rol dialog + aria-modal, foco al primer elemento
//   interactivo al abrir, Escape cierra y devuelve foco al botón flotante.
export function ChatBubble() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLParagraphElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  // Oculto durante el checkout (los tres pasos): /checkout/1|2|3.
  const inCheckout = location.pathname.startsWith('/checkout')

  useEffect(() => {
    if (!open) return

    // Foco al abrir: el botón de cerrar es el primer control interactivo del
    // panel; leemos el título con aria-labelledby.
    const focusFrame = window.requestAnimationFrame(() => {
      closeRef.current?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Al cerrar (por click en fondo/navegación) devolvemos el foco al botón.
  useEffect(() => {
    if (!open) return
    return () => {
      buttonRef.current?.focus()
    }
  }, [open])

  if (inCheckout) return null

  return (
    <div className="fixed bottom-6 right-4 z-[75] sm:right-6">
      {open && (
        <div
          id="chat-banana-preview"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-banana-title"
          className="mb-3 w-[min(19rem,calc(100vw-2rem))] rounded-[16px] border border-black/10 bg-surface p-4 shadow-raised"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                id="chat-banana-title"
                ref={headingRef}
                className="font-bold text-ink"
                tabIndex={-1}
              >
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
              onClick={() => {
                setOpen(false)
                buttonRef.current?.focus()
              }}
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
        aria-label={open ? 'Cerrar información del chat' : 'Abrir información del chat'}
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
