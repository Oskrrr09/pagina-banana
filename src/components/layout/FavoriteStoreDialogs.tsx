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
//
// EL AVISO OCUPA SITIO; NO SE PONE DELANTE
//
// La #53 arregló que la CAPA exterior —de ancho completo y transparente— se
// tragara los clicks a los lados del panel. Quedaba la otra mitad del mismo
// problema: el PANEL, que es opaco y mide 448 × 237, se colocaba encima del
// contenido. Medido en la primera visita, con `elementFromPoint` en el centro
// de cada interactivo: a 320 px se quedaba el CTA del asistente, y a 375 y 390
// dos tarjetas de producto con sus botones de favorito. Al final del documento
// había además interactivos que no se despejaban por mucho que se desplazara,
// porque el aviso viaja pegado al borde inferior de la ventana.
//
// El arreglo no toca los punteros: el panel tiene que seguir siendo pulsable, y
// dejarlo sin ellos habría inutilizado «Elegir tienda», «Ahora no» y cerrar.
// Lo que cambia es la GEOMETRÍA, y de forma distinta en cada sitio porque las
// dos superficies no se desplazan igual:
//
//   - EN LA APP la pantalla es una columna de altura fija en la que sólo se
//     desplaza el contenido. Ahí el aviso deja de flotar y pasa a ser un
//     hermano más entre el contenido y la barra de pestañas: el contenido se
//     encoge y no queda sitio físico donde uno pueda taparse con el otro. Es lo
//     mismo que ya se hizo con las dos barras, y por el mismo motivo de más:
//     en WKWebView los `position: fixed` se recolocan al TERMINAR el gesto, así
//     que arrastrando parecían despegarse (ver `src/index.css`).
//
//   - EN LA WEB manda el desplazamiento del documento y el aviso sigue siendo
//     una hoja pegada al borde inferior, que es lo que arregló la #53 y no se
//     toca. Lo que se añade es que la banda que ocupa quede RESERVADA: publica
//     su altura y el Layout la reserva por abajo, de modo que todo el contenido
//     se puede desplazar hasta salir de debajo. Sin eso, el final de la página
//     —enlaces del pie incluidos— se quedaba debajo sin salida posible.

/**
 * Variable donde el aviso publica cuánto ocupa, para que el Layout de la web
 * reserve esa banda por abajo. Vale 0 mientras no hay aviso.
 *
 * Es el contrato entre los dos: el que mide es quien sabe su alto, y el que
 * reserva no tiene por qué conocer su maquetación.
 */
export const VARIABLE_BANDA = '--alto-aviso-tienda'

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
  const bandaRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [showList, setShowList] = useState(false)

  // Publica cuánto ocupa la hoja para que el Layout reserve esa banda por
  // abajo. Sólo en la web: en la app el aviso ya ocupa su sitio en la columna
  // y no hay nada que reservar.
  //
  // Se mide en vez de escribirse a mano porque el alto real cambia —el texto se
  // reparte en más líneas al estrechar, y al pulsar «Elegir tienda» aparece la
  // lista de tiendas y crece de golpe—. Un número fijo se habría quedado corto
  // justo cuando más tapa.
  useEffect(() => {
    if (isNativeApp) return
    const banda = bandaRef.current
    if (!banda) return

    const publicar = () => {
      const alto = Math.ceil(banda.getBoundingClientRect().height)
      document.documentElement.style.setProperty(VARIABLE_BANDA, `${alto}px`)
    }
    publicar()

    const observador = new ResizeObserver(publicar)
    observador.observe(banda)
    return () => {
      observador.disconnect()
      document.documentElement.style.removeProperty(VARIABLE_BANDA)
    }
  }, [])

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
      ref={bandaRef}
      data-favorite-store-prompt
      className={
        isNativeApp
          ? // En la app es un hermano más de la columna: ocupa su banda entre el
            // contenido y la barra de pestañas. `shrink-0` para que la columna
            // le respete el alto en vez de aplastarlo cuando el contenido pide
            // sitio. No hace falta apartarse de la barra: está debajo.
            'shrink-0 flex justify-center px-4 pb-3 pt-2'
          : // En la web sigue siendo la hoja pegada al borde inferior.
            //
            // `pointer-events-none` porque esta capa ocupa todo el ancho de la
            // ventana y sólo se ve el panel del centro: sin esto, la banda
            // transparente de los lados se tragaba los clicks de la página que
            // hay debajo. Medido a 1280×720 en el asistente: el botón
            // «Continuar», a 199 px del panel, quedaba cubierto al 100 % y
            // `elementFromPoint` devolvía esta capa. El aviso nació como bottom
            // sheet **no bloqueante** y así vuelve a serlo; el panel recupera el
            // puntero con `pointer-events-auto`, que ya estaba puesto.
            'pointer-events-none fixed bottom-0 left-0 right-0 z-[70] flex justify-center px-4 pb-5 sm:pb-8'
      }
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
