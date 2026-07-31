import { Icon } from '../ui/Icon'
import {
  useAppUpdate,
  useInstallPrompt,
  useOnlineStatus,
  type NotificationPermissionState,
} from '../../lib/pwa'

/**
 * Tira de estado de la app instalable, justo bajo la cabecera del panel.
 *
 * Muestra **como mucho un aviso a la vez**, por orden de urgencia: sin
 * conexión → versión nueva → invitación a instalar → permiso de avisos.
 * Apilar barras empujaría la bandeja hacia abajo y en un panel que se usa a
 * pantalla completa eso molesta más de lo que informa.
 *
 * Ninguno roba el foco (ver `04-problemas-pendientes`, A11Y-003): son avisos,
 * no diálogos, y el agente llega a ellos tabulando cuando quiere.
 */
export function AgentAppBar({
  notificaciones,
  onPedirNotificaciones,
}: {
  notificaciones: NotificationPermissionState
  onPedirNotificaciones: () => void
}) {
  const online = useOnlineStatus()
  const { updateReady, applyUpdate } = useAppUpdate()
  const { mode, hint, install, dismissed, dismiss } = useInstallPrompt()

  if (!online) {
    return (
      <Bar tone="alerta" live>
        <span className="font-semibold">Sin conexión.</span>{' '}
        <span>
          El panel sigue abierto, pero no entran mensajes nuevos ni se envían
          respuestas hasta que vuelva.
        </span>
      </Bar>
    )
  }

  if (updateReady) {
    return (
      <Bar tone="oscura">
        <span>Hay una versión nueva del panel.</span>
        <button
          type="button"
          onClick={applyUpdate}
          className="ml-auto shrink-0 rounded-[8px] bg-brand px-3 py-1 text-xs font-bold text-ink hover:bg-brand-600"
        >
          Actualizar
        </button>
      </Bar>
    )
  }

  if (mode !== 'instalada' && !dismissed) {
    return (
      <Bar tone="marca">
        <span>
          <span className="font-semibold">Instala el panel como aplicación</span> para
          tenerlo en el Dock, con el contador de conversaciones sin leer.
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {mode === 'prompt' ? (
            <button
              type="button"
              onClick={() => void install()}
              className="rounded-[8px] bg-ink px-3 py-1 text-xs font-bold text-white hover:bg-ink/85"
            >
              Instalar
            </button>
          ) : (
            // Safari no expone `beforeinstallprompt`: aquí solo cabe explicar
            // dónde está la opción en ese navegador.
            <span className="text-xs text-ink/70">{hint}</span>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="No volver a proponer instalar la aplicación"
            className="grid h-7 w-7 place-items-center rounded-full text-ink/60 hover:bg-ink/10 hover:text-ink"
          >
            <Icon name="close" size={14} aria-hidden="true" />
          </button>
        </span>
      </Bar>
    )
  }

  if (mode === 'instalada' && notificaciones === 'default') {
    return (
      <Bar tone="marca">
        <span>Activa los avisos para enterarte de un mensaje nuevo con el panel de fondo.</span>
        <button
          type="button"
          onClick={onPedirNotificaciones}
          className="ml-auto shrink-0 rounded-[8px] bg-ink px-3 py-1 text-xs font-bold text-white hover:bg-ink/85"
        >
          Activar avisos
        </button>
      </Bar>
    )
  }

  return null
}

/**
 * Versión compacta para la tarjeta de acceso.
 *
 * Instalar antes de entrar es el momento natural —es cuando el agente tiene
 * la URL delante— pero allí no cabe una barra a todo lo ancho.
 */
export function InstallAppNote() {
  const { mode, hint, install, dismissed } = useInstallPrompt()

  if (mode === 'instalada' || dismissed) return null

  return (
    <div className="mt-6 rounded-[10px] border border-line bg-brand-050 p-3">
      <p className="text-xs font-semibold text-ink">Ten el panel a mano</p>
      {mode === 'prompt' ? (
        <>
          <p className="mt-1 text-xs text-muted">
            Instálalo como aplicación y lo abres desde el Dock, con aviso de
            mensajes nuevos.
          </p>
          <button
            type="button"
            onClick={() => void install()}
            className="mt-2 rounded-[8px] bg-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-ink/85"
          >
            Instalar aplicación
          </button>
        </>
      ) : (
        <p className="mt-1 text-xs text-muted">
          Puedes instalarlo como aplicación. {hint}
        </p>
      )}
    </div>
  )
}

const TONOS = {
  alerta: 'bg-danger-050 text-ink border-danger/30',
  oscura: 'bg-ink text-white border-ink',
  marca: 'bg-brand-050 text-ink border-line',
} as const

function Bar({
  tone,
  live,
  children,
}: {
  tone: keyof typeof TONOS
  live?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      {...(live ? { role: 'status' } : {})}
      data-agent-app-bar
      className={`flex flex-wrap items-center gap-2 border-b px-4 py-2 text-xs ${TONOS[tone]}`}
    >
      {children}
    </div>
  )
}
