import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

// Guía interactiva para preparar el dispositivo antes de entregarlo en el
// servicio técnico. Es un diálogo modal accesible con cuatro pasos y estado
// completamente local: no usa localStorage, sessionStorage, cookies, ni hace
// peticiones de red. Al cerrar, el progreso se reinicia.
//
// Objetivo: guiar en 3 confirmaciones (copia de seguridad → modo antirrobo →
// desactivar "Buscar") antes de mostrar el resumen final. No inicia una
// reparación, no crea una orden, no reserva una cita y no solicita
// credenciales.
type StepKey = 'backup' | 'antitheft' | 'find-my' | 'done'

const STEP_ORDER: StepKey[] = ['backup', 'antitheft', 'find-my', 'done']

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Controles del panel que el navegador puede enfocar de verdad.
 *
 * El selector por sí solo no basta: devuelve también elementos que están en
 * el DOM pero no son alcanzables (ocultos, o dentro de un subárbol `inert`).
 * Enfocar uno de esos es una operación vacía, y entonces el foco se queda
 * donde estaba —o se va fuera del diálogo.
 */
function focusablesDentro(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[inert]'),
  )
}

export function DevicePreparationGuide({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const initialFocusRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  const [step, setStep] = useState<StepKey>('backup')
  const [checked, setChecked] = useState<Record<Exclude<StepKey, 'done'>, boolean>>({
    backup: false,
    antitheft: false,
    'find-my': false,
  })

  const stepIndex = STEP_ORDER.indexOf(step)
  const stepNumber = stepIndex + 1
  const totalSteps = STEP_ORDER.length

  const reset = useCallback(() => {
    setStep('backup')
    setChecked({ backup: false, antitheft: false, 'find-my': false })
  }, [])

  const close = useCallback(() => {
    onClose()
  }, [onClose])

  // Guarda el elemento activo al abrir, para restaurar el foco al cerrar.
  useEffect(() => {
    if (open) {
      openerRef.current = (document.activeElement as HTMLElement | null) ?? null
    } else {
      // Reinicia el progreso al cerrar y devuelve el foco al elemento
      // que abrió el diálogo (si sigue en el DOM).
      reset()
      if (openerRef.current && document.body.contains(openerRef.current)) {
        openerRef.current.focus()
      }
      openerRef.current = null
    }
  }, [open, reset])

  // Trampa de foco + Escape + bloqueo de scroll de fondo + `inert` sobre el
  // resto del documento mientras está abierto (accesibilidad de fondo).
  useEffect(() => {
    if (!open) return

    // Foco inicial en el botón "Cerrar" (primer control interactivo).
    const focusFrame = window.requestAnimationFrame(() => {
      initialFocusRef.current?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = focusablesDentro(panel)
      if (focusables.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      // Se gobierna el recorrido **completo**, no solo los extremos.
      //
      // Antes solo se interceptaba al llegar al primero o al último y en
      // medio tabulaba el navegador. Eso obliga a que nuestra lista y el
      // orden de tabulación real coincidan exactamente, y basta una
      // discrepancia —un control que el navegador se salta, o uno que se
      // desactiva al cambiar de paso— para que un Shift+Tab salga del
      // diálogo sin que nadie lo impida. Fallaba así, de forma intermitente,
      // solo en el runner de Linux (QA-003).
      event.preventDefault()
      const active = document.activeElement as HTMLElement | null
      const actual = active ? focusables.indexOf(active) : -1
      const siguiente =
        actual === -1
          ? // El foco no está en ningún control del panel (por ejemplo en
            // `body` tras un re-render): se entra por el extremo que toque.
            event.shiftKey
            ? focusables.length - 1
            : 0
          : (actual + (event.shiftKey ? -1 : 1) + focusables.length) % focusables.length
      focusables[siguiente].focus()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Marca como inert el resto de hermanos del portal para que el fondo no
    // reciba interacción por teclado ni puntero.
    const root = panelRef.current?.closest('[data-preparation-root]')
    const siblings: Element[] = []
    if (root?.parentElement) {
      for (const child of Array.from(root.parentElement.children)) {
        if (child !== root) siblings.push(child)
      }
    }
    for (const el of siblings) el.setAttribute('inert', '')

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      for (const el of siblings) el.removeAttribute('inert')
    }
  }, [open, close])

  if (!open) return null

  const canAdvance =
    step === 'backup' ? checked.backup :
    step === 'antitheft' ? checked.antitheft :
    step === 'find-my' ? checked['find-my'] :
    true

  const goNext = () => {
    if (!canAdvance) return
    const next = STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)]
    setStep(next)
  }
  const goPrev = () => {
    const prev = STEP_ORDER[Math.max(stepIndex - 1, 0)]
    setStep(prev)
  }

  return (
    <div
      data-preparation-root
      className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center"
    >
      {/* Fondo: no cierra al hacer clic para no perder el progreso por
          accidente. La única salida es Escape o el botón "Cerrar guía". */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        // Enfocable por código pero fuera del recorrido de Tab (el selector
        // de focusables excluye `tabindex="-1"`). Es el sitio donde aterriza
        // el foco si el panel se queda sin ningún control enfocable.
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-surface shadow-[var(--shadow-raised)] outline-none sm:max-h-[80vh] sm:max-w-lg sm:rounded-[20px]"
      >
        {/* Cabecera fija */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 pb-4 pt-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Guía · Servicio técnico
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-bold text-ink">
              Preparar mi dispositivo
            </h2>
            <p id={descId} className="mt-1 text-sm text-muted">
              Guía paso a paso antes de entregar tu equipo. No inicia una reparación.
            </p>
          </div>
          <button
            ref={initialFocusRef}
            type="button"
            onClick={close}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-neutral hover:text-ink"
          >
            <Icon name="close" size={18} aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        {/* Progreso */}
        <div className="px-6 pt-4" aria-live="polite">
          <div className="flex items-center justify-between text-xs font-semibold text-ink">
            <span>Paso {stepNumber} de {totalSteps}</span>
            <span className="text-muted">{step === 'done' ? 'Resumen' : 'Preparación'}</span>
          </div>
          <ol
            aria-label="Progreso de la guía de preparación"
            className="mt-2 flex gap-1.5"
          >
            {STEP_ORDER.map((key, i) => {
              const active = i === stepIndex
              const done = i < stepIndex
              return (
                <li
                  key={key}
                  aria-current={active ? 'step' : undefined}
                  className={`h-1.5 flex-1 rounded-full ${
                    done ? 'bg-ink' : active ? 'bg-brand-700' : 'bg-line'
                  }`}
                />
              )
            })}
          </ol>
        </div>

        {/* Cuerpo con scroll interno */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'backup' && (
            <StepShell
              heading="Haz una copia de seguridad"
              body={
                <>
                  Antes de entregar el dispositivo, guarda una copia actualizada de tus datos.
                  El servicio técnico puede necesitar borrar o restaurar el equipo durante el
                  diagnóstico o la reparación.
                </>
              }
              confirmLabel="He realizado una copia de seguridad."
              checked={checked.backup}
              onCheckChange={(v) => setChecked((prev) => ({ ...prev, backup: v }))}
            />
          )}
          {step === 'antitheft' && (
            <StepShell
              heading="Desactiva la protección antirrobo"
              body={
                <>
                  Desactiva la Protección del dispositivo en caso de robo, el modo antirrobo o
                  la función equivalente cuando esté activada o disponible en tu dispositivo.
                  <span className="mt-2 block text-xs text-muted">
                    Esta función no está disponible en todos los dispositivos o versiones del
                    sistema. Cuando está activa, puede limitar algunas acciones necesarias
                    durante la revisión o reparación.
                  </span>
                </>
              }
              confirmLabel="He revisado y desactivado esta protección cuando corresponde."
              checked={checked.antitheft}
              onCheckChange={(v) => setChecked((prev) => ({ ...prev, antitheft: v }))}
            />
          )}
          {step === 'find-my' && (
            <StepShell
              heading="Desactiva la función Buscar"
              body={
                <>
                  Desactiva <strong className="font-semibold">Buscar mi iPhone</strong>,{' '}
                  <strong className="font-semibold">Buscar mi iPad</strong>,{' '}
                  <strong className="font-semibold">Buscar mi Mac</strong> o la opción
                  equivalente antes de entregar el dispositivo.
                  <span className="mt-2 block text-xs text-muted">
                    Esta función puede impedir que el servicio técnico revise, restaure o
                    gestione correctamente el equipo.
                  </span>
                </>
              }
              confirmLabel="He desactivado la función Buscar."
              checked={checked['find-my']}
              onCheckChange={(v) => setChecked((prev) => ({ ...prev, 'find-my': v }))}
            />
          )}
          {step === 'done' && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                Preparación completada
              </p>
              <h3 className="mt-1 text-xl font-bold text-ink">Tu dispositivo está preparado</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                <li className="flex items-start gap-2">
                  <Icon name="check" size={16} className="mt-0.5 text-available" aria-hidden="true" />
                  <span>Copia de seguridad realizada.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" size={16} className="mt-0.5 text-available" aria-hidden="true" />
                  <span>Protección antirrobo revisada y desactivada cuando corresponde.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" size={16} className="mt-0.5 text-available" aria-hidden="true" />
                  <span>Función Buscar desactivada.</span>
                </li>
              </ul>
              <div
                role="note"
                className="mt-4 rounded-[10px] border border-danger/40 bg-danger-050 p-3 text-sm text-ink"
              >
                <p className="flex items-center gap-2 font-semibold text-danger">
                  <Icon name="shield" size={16} aria-hidden="true" />
                  Aviso de seguridad
                </p>
                <p className="mt-1">
                  No compartas contraseñas, códigos de desbloqueo ni credenciales de Apple a
                  través de esta web.
                </p>
              </div>
              <div className="mt-4 rounded-[10px] border border-line bg-neutral p-3 text-xs text-ink">
                <p className="font-semibold text-ink">Al entregar tu dispositivo</p>
                <ul className="mt-1 space-y-1 text-muted">
                  <li>No necesitas cita previa.</li>
                  <li>Puedes entregarlo directamente o dejarlo en otra tienda Banana.</li>
                  <li>En garantía, el envío al servicio técnico es gratuito.</li>
                  <li>Fuera de garantía, el envío tiene un coste de 35 €.</li>
                  <li>Si aceptas la reparación, los 35 € se descuentan del precio final.</li>
                  <li>Si no la aceptas, los 35 € no son reembolsables.</li>
                  <li>El traslado suele tardar un mínimo de 3 días.</li>
                  <li>Diagnóstico y reparación requieren tiempo adicional.</li>
                </ul>
                <p className="mt-2">
                  <Link
                    to="/servicio-tecnico"
                    onClick={close}
                    className="font-semibold text-ink underline underline-offset-2"
                  >
                    Ver bloque completo de Servicio Técnico ›
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pie con navegación */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
              >
                Anterior
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {step === 'done' ? (
              <>
                <Link
                  to="/tiendas"
                  onClick={close}
                  className="inline-flex items-center gap-2 rounded-[10px] bg-action px-4 py-2 text-sm font-semibold text-ink hover:bg-action-600"
                >
                  Consultar tiendas y horarios
                  <Icon name="arrow-right" size={14} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
                >
                  Cerrar guía
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                aria-disabled={!canAdvance}
                className="inline-flex items-center gap-2 rounded-[10px] bg-action px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:bg-action-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Siguiente
                <Icon name="arrow-right" size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepShell({
  heading,
  body,
  confirmLabel,
  checked,
  onCheckChange,
}: {
  heading: string
  body: ReactNode
  confirmLabel: string
  checked: boolean
  onCheckChange: (v: boolean) => void
}) {
  return (
    <div>
      <h3 className="text-lg font-bold text-ink">{heading}</h3>
      <div className="mt-2 text-sm text-ink">{body}</div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-neutral p-3 text-sm text-ink hover:border-ink/30">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
        />
        <span>{confirmLabel}</span>
      </label>
    </div>
  )
}
