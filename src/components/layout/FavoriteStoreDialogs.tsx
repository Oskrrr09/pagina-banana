import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { stores, getTodayHours } from '../../data/stores'
import { StoreStatus } from '../store/StoreStatus'
import { useStorePreference } from '../../lib/storePreference'
import { isNativeApp } from '../../lib/nativeApp'
import { useT } from '../../lib/i18n'
import { ALTURA_TAB_BAR } from './AppTabBar'

// Componente global (montado en Layout) que orquesta:
//   - el bottom sheet inicial que pregunta la tienda favorita;
//   - un mensaje de confirmación discreto tras elegirla.
// Nunca se muestra dentro de /checkout/* para no interferir con la compra.
// El estado de "cerrado" persiste en banana:favorite-store-prompt.
export function FavoriteStoreDialogs() {
  const t = useT()
  const { favoriteSlug, favoriteStore, promptDismissed, setFavorite, dismissPrompt } = useStorePreference()
  const { pathname } = useLocation()

  const inCheckout = pathname.startsWith('/checkout')
  const [confirmationText, setConfirmationText] = useState<string | null>(null)

  const shouldShowPrompt = !inCheckout && !favoriteSlug && !promptDismissed
  const [dialogOpen, setDialogOpen] = useState(false)

  // Damos margen para que la primera vista se pinte antes de aparecer.
  //
  // Y **nunca convive con un diálogo modal abierto** (el menú de la app, la
  // guía de preparación, el chat de Bananito, cualquier `Modal`): este aviso
  // toma el foco al montarse, así que se lo robaría a algo que la persona
  // está usando. Era A11Y-003, y se manifestaba además como un fallo
  // intermitente de la trampa de foco de la guía en CI (QA-003).
  //
  // La presencia de modales se vigila de forma **continua**, no solo al
  // aparecer: comprobarlo una vez dejaba un hueco entre que se cierra un
  // diálogo y se abre el siguiente —pasar del menú al chat, en la app— por
  // el que el aviso se colaba encima del chat.
  useEffect(() => {
    if (!shouldShowPrompt) {
      setDialogOpen(false)
      return
    }

    const hayModal = () => Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'))

    // El margen inicial solo aplica a la primera aparición.
    let listo = false
    const evaluar = () => {
      if (listo) setDialogOpen(!hayModal())
    }

    const timer = window.setTimeout(() => {
      listo = true
      evaluar()
    }, 800)

    // Un observador en vez de un intervalo: reacciona en el mismo momento en
    // que se monta o desmonta un diálogo, sin dejarlo visible encima durante
    // el tiempo que tardase el siguiente tic.
    const observador = new MutationObserver(evaluar)
    observador.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearTimeout(timer)
      observador.disconnect()
    }
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
      {dialogOpen && <FavoriteStorePrompt onChoose={handleChoose} onLater={handleLater} />}
      {confirmationText && !dialogOpen && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-raised)]"
          style={isNativeApp ? { bottom: `calc(1.5rem + ${ALTURA_TAB_BAR})` } : undefined}
        >
          {confirmationText}
        </div>
      )}
      {/* Aria-live silencioso para lectores de pantalla mientras cargan páginas */}
      {favoriteStore && (
        <span aria-live="polite" className="sr-only">
          {t('favStore.current', { tienda: favoriteStore.name })}
        </span>
      )}
    </>
  )
}

function FavoriteStorePrompt({ onChoose, onLater }: { onChoose: (slug: string) => void; onLater: () => void }) {
  const t = useT()
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
      className="fixed bottom-0 left-0 right-0 z-[70] flex justify-center px-4 pb-5 sm:pb-8"
      // En la app hay una barra de navegación pegada abajo: sin esto el
      // aviso la taparía por completo.
      style={isNativeApp ? { paddingBottom: `calc(1.25rem + ${ALTURA_TAB_BAR})` } : undefined}
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t('favStore.kicker')}</p>
            <h2 id="fav-store-title" className="mt-1 text-lg font-bold text-ink">
              {t('favStore.title')}
            </h2>
            <p id="fav-store-desc" className="mt-1 text-sm text-muted">
              {t('favStore.desc')}
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
              {t('stores.choose')}
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
                        <StoreStatus store={store} className="!px-2 !text-[10px]" />
                      </span>
                      <span className="block text-xs text-muted">
                        {store.island} · {store.address}
                      </span>
                      <span className="mt-1 block text-xs text-muted">Hoy: {today?.time ?? 'Consulta horario'}</span>
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
