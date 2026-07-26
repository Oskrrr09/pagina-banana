import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

export function ChatBubble() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <div className="fixed bottom-24 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open && (
        <div
          id="chat-banana-preview"
          role="dialog"
          aria-labelledby="chat-banana-title"
          className="mb-3 w-[min(19rem,calc(100vw-2rem))] rounded-[16px] border border-black/10 bg-surface p-4 shadow-raised"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id="chat-banana-title" className="font-bold text-ink">
                Chat con Banana
              </p>
              <p className="mt-1 text-sm text-muted">
                El chat estará disponible próximamente. Mientras tanto, puedes visitar nuestro centro de soporte.
              </p>
            </div>
            <button
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
        onClick={() => setOpen((value) => !value)}
        className="ml-auto grid h-14 w-14 place-items-center rounded-full border border-black/10 bg-brand text-[#1d1d1f] shadow-raised transition-transform hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0"
      >
        <Icon name={open ? 'close' : 'chat'} size={25} />
      </button>
    </div>
  )
}
