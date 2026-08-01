import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { stores, isOpenNow, getTodayHours } from '../../data/stores'
import { useStorePreference } from '../../lib/storePreference'

// Componente global (montado en Layout) que orquesta:
//   - el bottom sheet inicial que pregunta la tienda favorita;
//   - un mensaje de confirmación discreto tras elegirla.
// Nunca se muestra dentro de /checkout/* para no interferir con la compra.
// El estado de "cerrado" persiste en banana:favorite-store-prompt.
export function FavoriteStoreDialogs() {
  const { favoriteSlug, favoriteStore, promptDismissed, setFavorite, dismissPrompt } =
    useStorePreference()
  const { pathname } = useLocation()

  const inCheckout = pathname.startsWith('/checkout')
  const [confirmationText, setConfirmationText] = useState<string | null>(null)

  const shouldShowPrompt = !inCheckout && !favoriteSlug && !promptDismissed
  const [dialogOpen, setDialogOpen] = useState(false)

  // Damos margen para que la primera vista se pinte antes de aparecer.
  //
  // Y **nunca aparece encima de un diálogo modal abierto** (la guía de
  // preparación, el chat de Bananito, cualquier `Modal`): este aviso toma el
  // foco al montarse, así que se lo robaría a algo que la persona está usando
  // en ese momento. Era A11Y-003, y se manifestaba como un fallo intermitente
  // de la trampa de foco de la guía en CI (QA-003), donde el temporizador
  // caía justo dentro del recorrido de tabulación.
  //
  // Se reintenta en vez de descartarse: en cuanto se cierre el diálogo, el
  // aviso aparece.
  useEffect(() => {
    if (!shouldShowPrompt) {
      setDialogOpen(false)
      return
    }
    const timer = window.setInterval(() => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      setDialogOpen(true)
      window.clearInterval(timer)
    }, 800)
    return () => window.clearInterval(timer)
  }, [shouldShowPrompt])

  function handleChoose(slug: string) {
    setFavorite(slug)
    setDialogOpen(false)
    const store = stores.find((s) => s.slug === slug)
    if (store) {
      setConfirmationText(`Tienda favorita guardada: ${store.name}.`)
      window.setTimeout(() => setConfirmationText(null), 4000)
    }
  }

  function handleLater() {
    dismissPrompt()
    setDialogOpen(false)
  }

  return (
    <>
      {dialogOpen && (
        <FavoriteStorePrompt
          onChoose={handleChoose}
          onLater={handleLater}
        />
      )}
      {confirmationText && !dialogOpen && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-raised)]"
        >
          {confirmationText}
        </div>
      )}
      {/* Aria-live silencioso para lectores de pantalla mientras cargan páginas */}
      {favoriteStore && (
        <span aria-live="polite" className="sr-only">
          Tienda favorita: {favoriteStore.name}.
        </span>
      )}
    </>
  )
}

function FavoriteStorePrompt({
  onChoose,
  onLater,
}: {
  onChoose: (slug: string) => void
  onLater: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const focusFrame = window.requestAnimationFrame(() => closeBtnRef.current?.focus())

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onLater()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onLater])

  return (
    <div
      data-favorite-store-prompt
      className="fixed bottom-0 left-0 right-0 z-[85] flex justify-center px-4 pb-5 sm:pb-8"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="fav-store-title"
        aria-describedby="fav-store-desc"
        className="pointer-events-auto w-full max-w-md rounded-[16px] border border-line bg-surface p-5 shadow-[var(--shadow-raised)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Tu tienda Banana
            </p>
            <h2 id="fav-store-title" className="mt-1 text-lg font-bold text-ink">
              ¿Cuál es tu tienda Banana habitual?
            </h2>
            <p id="fav-store-desc" className="mt-1 text-sm text-muted">
              Podemos mostrarte primero sus horarios, servicios y disponibilidad de ejemplo.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onLater}
            aria-label="Cerrar aviso de tienda favorita"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-neutral hover:text-ink"
          >
            <Icon name="close" size={16} aria-hidden="true" />
          </button>
        </div>

        {!showList ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowList(true)}
              className="inline-flex items-center gap-2 rounded-[10px] bg-action px-4 py-2 text-sm font-semibold text-ink hover:bg-action-600"
            >
              Elegir tienda
            </button>
            <button
              type="button"
              onClick={onLater}
              className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
            >
              Ahora no
            </button>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {stores.map((store) => {
              const open = isOpenNow(store)
              const today = getTodayHours(store)
              return (
                <li key={store.slug}>
                  <button
                    type="button"
                    onClick={() => onChoose(store.slug)}
                    className="flex w-full items-start gap-3 rounded-[10px] border border-line bg-surface p-3 text-left text-sm text-ink hover:border-brand hover:bg-brand-050"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-050 text-ink">
                      <Icon name="store" size={16} aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">{store.name}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            open ? 'bg-[#e4f5ea] text-[#1f5b34]' : 'bg-[#fce8e8] text-[#8f2929]'
                          }`}
                        >
                          {open ? 'Abierto ahora' : 'Cerrado'}
                        </span>
                      </span>
                      <span className="block text-xs text-muted">
                        {store.island} · {store.address}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        Hoy: {today?.time ?? 'Consulta horario'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
