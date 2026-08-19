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
// EL AVISO OCUPA SITIO; NO SE PONE DELANTE DE NADA
//
// La #53 arregló que la CAPA exterior —de ancho completo y transparente— se
// tragara los clicks a los lados del panel, y la dejó `pointer-events-none`.
// Quedaba la otra mitad del mismo problema: el PANEL, que es opaco y mide
// 448 × 237, seguía colocándose delante del contenido. Medido en la primera
// visita, con `elementFromPoint` en el centro de cada interactivo visible:
//
//   app  320×568 · el CTA «Empezar» del asistente
//   app  375×812 · «Ver más», dos tarjetas de producto y sus dos favoritos
//   app  390×844 · dos tarjetas de producto y sus dos favoritos
//   web  390×844 · los cuatro puntos del carrusel del hero
//   web 1280×800 · los cuatro puntos del carrusel del hero
//
// Y estaba comprobado que el toque se perdía: con el aviso abierto, pulsar el
// punto del tercer slide no cambiaba de slide; descartando el aviso, el mismo
// punto sí cambiaba.
//
// EL ARREGLO NO TOCA LOS PUNTEROS
//
// El panel tiene que seguir siendo pulsable: dejarlo sin puntero habría
// inutilizado «Elegir tienda», «Ahora no», cerrar y la lista de tiendas, que es
// el arreglo contrario al problema. Lo que cambia es la GEOMETRÍA: el aviso
// deja de flotar y pasa a ocupar su propia banda, así que no queda sitio
// físico donde uno pueda taparse con el otro.
//
//   - EN LA APP es un hermano de la columna, entre el contenido y la barra de
//     pestañas. Es lo mismo que ya se hizo con las dos barras, y por el motivo
//     de más de que en WKWebView los `position: fixed` se recolocan al TERMINAR
//     el gesto, así que arrastrando parecían despegarse (ver `src/index.css`).
//
//   - EN LA WEB es una banda entre la cabecera y el contenido, como
//     `TranslationNotice`, que es el patrón que la web ya usa para avisar sin
//     bloquear. Se probó a dejarlo flotando y reservar su alto por abajo: eso
//     sólo evitaba que el FINAL del documento quedara atrapado, y a media
//     página el panel seguía comiéndose los toques.
//
// CAMBIO OBSERVABLE QUE ESTO TRAE
//
// Al aparecer, el aviso ya no se superpone: empuja. En la web el contenido baja
// lo que mide la banda, y en la app el contenido disponible se encoge. Es la
// contrapartida de que nada quede debajo, y es deliberada.
//
// Esta geometría deja sin objeto la superposición que originó la #53 —ya no hay
// banda fija delante del contenido—, pero su contrato funcional sigue vivo y
// probado: el aviso nunca captura el puntero de nada que no sea suyo.

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

  // EL FOCO SÓLO SE TOMA SI EL AVISO ESTÁ A LA VISTA
  //
  // `focus()` arrastra el elemento al viewport si está fuera. Mientras el aviso
  // flotaba pegado a la ventana eso no podía pasar: siempre estaba en pantalla.
  // Al pasar a ocupar su banda —en la web, antes de `main`— sí puede quedar muy
  // por encima de lo que la persona está leyendo, y entonces tomar el foco se
  // la lleva de vuelta arriba. Medido con la rueda, dejando que el
  // desplazamiento se asiente:
  //
  //   /  390×844 · scrollY 2100 → 0
  //   / 1280×800 · scrollY 2100 → 0
  //
  // Y con `html { scroll-behavior: smooth }` el tirón además se anima, así que
  // se ve como si la página se moviera sola.
  //
  // Se comprobó también el caso en que el aviso sale con retraso porque estaba
  // esperando a que se cerrase un modal. Allí la página sí se mueve, pero no por
  // esto: medido con el aviso descartado de antemano —sin aviso ninguno— el
  // salto es el mismo al píxel y el foco acaba igual en el botón que abrió la
  // guía. Es su propia restauración de foco, y no se toca aquí.
  //
  // No se arregla con `preventScroll`: eso dejaría el foco en un botón que no
  // se ve, que es peor para quien navega con teclado. Lo que se corrige es la
  // decisión: el aviso reclama el foco cuando está delante de la persona, y no
  // cuando está fuera de su vista. Ahí se queda quieto y espera; sigue siendo
  // alcanzable con el tabulador y sigue cerrándose con Escape.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    // Sólo se devuelve el foco si antes se llegó a tomar. Devolverlo sin
    // haberlo tomado movería a la persona desde donde esté ahora.
    let tomado = false
    const focusFrame = window.requestAnimationFrame(() => {
      const boton = closeBtnRef.current
      if (!boton) return
      const caja = boton.getBoundingClientRect()
      const aLaVista = caja.bottom > 0 && caja.top < window.innerHeight
      if (!aLaVista) return
      boton.focus()
      tomado = true
    })

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
      if (tomado) previous?.focus?.()
    }
  }, [onLater])

  return (
    <div
      data-favorite-store-prompt
      // `pointer-events-none` en la banda y `pointer-events-auto` en el panel:
      // es el contrato que fijó la #53 y no se toca. La banda ocupa todo el
      // ancho y sólo se ve el panel del centro, así que sus lados transparentes
      // no pueden capturar nada. Ya no hay contenido debajo que proteger, pero
      // el invariante se conserva porque no cuesta nada y sigue probado.
      className={
        isNativeApp
          ? // Hermano de la columna, entre el contenido y la barra de pestañas.
            // `shrink-0` para que la columna le respete el alto en vez de
            // aplastarlo cuando el contenido pide sitio.
            //
            // EL TECHO NO ES DECORATIVO
            //
            // Al pulsar «Elegir tienda» el panel pasa a tener cinco fichas de
            // tienda. Medido a 320×568 sin techo: el aviso crecía a 931 px,
            // `main` se quedaba en 0 y la barra de pestañas terminaba en
            // 995→1059, fuera de una ventana de 568. Y no había forma de
            // alcanzarla: en la app `html` y `body` llevan `overflow: hidden`,
            // así que ningún gesto desplaza el documento.
            //
            // Con el techo, lo que crece es la lista, que se desplaza dentro de
            // sí misma. La barra de pestañas no se mueve nunca y `main` conserva
            // sitio.
            'pointer-events-none flex max-h-[55dvh] min-h-0 shrink-0 justify-center px-4 pb-3 pt-2'
          : // Banda entre la cabecera y el contenido. No lleva techo: aquí manda
            // el desplazamiento del documento, así que una lista larga alarga la
            // página y se alcanza desplazándose, como cualquier otra cosa.
            'pointer-events-none flex justify-center px-4 pb-4 pt-3'
      }
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="fav-store-title"
        aria-describedby="fav-store-desc"
        // `flex flex-col` con `max-h-full`: el encabezado manda su alto y la
        // lista se queda con lo que sobra. Sin esto el techo de la banda
        // recortaría el panel por abajo en vez de darle scroll a la lista.
        className="pointer-events-auto flex max-h-full w-full max-w-md flex-col rounded-[16px] border border-line bg-surface p-5 shadow-[var(--shadow-raised)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
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
          <div className="mt-4 flex shrink-0 flex-wrap gap-2">
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
          // La lista es lo único que crece, así que es lo único que se
          // desplaza. `min-h-0` porque un hijo flexible no se encoge por
          // debajo de su contenido sin él, y `overscroll-contain` para que al
          // llegar al final el gesto no siga arrastrando lo de detrás.
          <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
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
