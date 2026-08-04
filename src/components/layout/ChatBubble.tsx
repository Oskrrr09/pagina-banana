import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useVisitorChatSession } from '../../lib/chatSession'
import { useCustomerAuth } from '../../lib/customerAuth'
import type { DbMessage } from '../../lib/supabase'
import { isNativeApp } from '../../lib/nativeApp'
import { useChatOpenRequest } from '../../lib/chatLauncher'
import { ALTURA_TAB_BAR } from './AppTabBar'
import { useT } from '../../lib/i18n'
import { isolateModalBranch } from '../../lib/modalIsolation'

// Chat "Bananito" — burbuja del visitante.
// - Botón flotante circular con Bananito en azul del nav utilitario.
// - Al abrir, panel con cabecera amarilla, historial en tiempo real y input.
// - Conectado a Supabase: los mensajes viajan al backend y llegan al panel
//   /agente. Si no hay credenciales, cae al modo demo con canned replies.
// - Oculto en /checkout/* para no distraer del proceso de compra.
// - Accesible: role="dialog", trampa de foco, Escape cierra.

const BANANA_BLUE = '#0768A9'
const BANANA_YELLOW = '#ffce1f' // mismo amarillo del nav (--color-brand)
const CHAT_BG_PATTERN = `${import.meta.env.BASE_URL}img/chat/pattern-bananas.png`
const BANANITO_IMG = `${import.meta.env.BASE_URL}img/chat/bananito-square.png`

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// ============================================================
// Modo demo: mismas canned replies que antes de Supabase, para
// que un fork sin credenciales siga viendo el chat funcional.
// ============================================================
const CANNED_REPLIES: { keyword: RegExp; reply: string }[] = [
  {
    keyword: /iphone|móvil|movil|telefono|teléfono/i,
    reply:
      '¡Claro! ¿Buscas un modelo en concreto o te gustaría que te ayude a elegir uno según tu uso? Ahora mismo tenemos disponibles iPhone 17, 17 Pro, 17 Pro Max y iPhone Air.',
  },
  {
    keyword: /mac|macbook|portátil|portatil|ordenador/i,
    reply:
      'Tenemos MacBook Air (M4 y M5), MacBook Pro, iMac, Mac Studio y Mac mini. ¿Es más para estudiar, trabajar creativamente o para uso profesional exigente?',
  },
  {
    keyword: /accesorio|funda|cargador|cable|magsafe|correa|auriculares|airpods/i,
    reply:
      'Encantado. Tenemos accesorios oficiales Apple: cargadores MagSafe, adaptadores USB-C, fundas para iPhone 17, correas de Apple Watch, Apple Pencil, Magic Keyboard, AirTag y más. ¿Para qué dispositivo lo necesitas?',
  },
  {
    keyword: /tienda|horario|abierto|dirección|direccion|donde/i,
    reply:
      'Estamos en 5 tiendas en Canarias. Puedo enseñarte la más cercana si me dices en qué isla estás. También puedes verlas todas en la sección de Tiendas.',
  },
  {
    keyword: /precio|cuesta|coste|barato|oferta/i,
    reply:
      'Los precios que ves son demostrativos en este prototipo. En tienda te confirmamos el precio final, incluyendo posibles ofertas, Plan Renove o financiación. ¿Quieres que te pase con un compañero para consultar el precio real?',
  },
  {
    keyword: /gracias|thx|thanks/i,
    reply: '¡A ti! Si necesitas cualquier otra cosa aquí estoy. 🍌',
  },
  {
    keyword: /hola|buenas|hey/i,
    reply:
      '¡Hola! Soy Bananito, el asistente de Banana Computer. Puedo ayudarte a encontrar productos, comparar modelos, consultar accesorios o resolver dudas. ¿Qué necesitas?',
  },
]

const DEMO_FALLBACK =
  'Interesante pregunta. Déjame consultarlo — te paso con un compañero de tienda que te ayudará mejor. En unos segundos alguien te contestará.'

function fakeReplyFor(text: string): string {
  for (const { keyword, reply } of CANNED_REPLIES) {
    if (keyword.test(text)) return reply
  }
  return DEMO_FALLBACK
}

// UI-message: forma común para renderizar, sea de Supabase o del modo demo.
interface UIMessage {
  id: string
  side: 'left' | 'right' // izquierda = bot/agente, derecha = visitante
  text: string
}

function toUIMessage(m: DbMessage): UIMessage {
  return {
    id: m.id,
    side: m.autor === 'visitor' ? 'right' : 'left',
    text: m.texto,
  }
}

export function ChatBubble() {
  const t = useT()
  const [open, setOpen] = useState(false)

  // En la app nativa el chat se abre desde "Contacta con nosotros", no desde
  // una burbuja flotante; esto es lo que escucha esa petición.
  useChatOpenRequest(
    useCallback(() => {
      setOpen(true)
    }, []),
  )
  // `mounted` mantiene el panel en el DOM durante la animación de salida.
  // `visible` conmuta la clase CSS que dispara el transform/opacity.
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [input, setInput] = useState('')

  // Si hay cuenta iniciada, el agente verá nombre y teléfono en vez de un
  // identificador anónimo.
  const { session: customerSession, cliente } = useCustomerAuth()
  const identity = useMemo(
    () =>
      customerSession
        ? {
            clienteId: customerSession.user.id,
            nombre: cliente?.nombre ?? null,
            email: cliente?.email ?? customerSession.user.email ?? null,
            telefono: cliente?.telefono ?? null,
          }
        : null,
    [customerSession, cliente],
  )

  // Sesión de Supabase — se inicializa solo cuando el chat se abre.
  const session = useVisitorChatSession(open, identity)
  // La bienvenida se pinta aquí y no se guarda en la base: así sale en el
  // idioma activo en vez de quedar congelada en el idioma de quien abrió la
  // conversación, y ningún texto del navegador acaba almacenado como si lo
  // hubiera dicho el bot.
  const bienvenida: UIMessage = { id: 'welcome', side: 'left', text: t('chat.welcome') }
  const supabaseMessages: UIMessage[] = [
    bienvenida,
    ...session.messages.map(toUIMessage),
  ]

  // Estado del modo demo (fallback cuando no hay credenciales).
  const [demoMessages, setDemoMessages] = useState<UIMessage[]>([])
  const [botTyping, setBotTyping] = useState(false)

  const messages = session.demo ? [bienvenida, ...demoMessages] : supabaseMessages

  const buttonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const inCheckout = location.pathname.startsWith('/checkout')
  const inAgent = location.pathname.startsWith('/agente')

  const close = useCallback(() => {
    setOpen(false)
    // El foco NO se devuelve aquí: mientras el chat está abierto el resto del
    // documento está marcado como `inert`, así que enfocar cualquier cosa de
    // fuera sería una operación vacía. Se hace en un efecto, que corre
    // después de que se levante el `inert`.
    restoreFocusRef.current = true
  }, [])

  // Coreografía de montaje/animación:
  //  open=true  → montamos, y en el siguiente frame activamos `visible`.
  //  open=false → quitamos `visible` y desmontamos al terminar la transición.
  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = window.requestAnimationFrame(() => setVisible(true))
      return () => window.cancelAnimationFrame(raf)
    }
    setVisible(false)
  }, [open])

  // Foco al abrir, trampa de tab, Escape cierra.
  useEffect(() => {
    if (!open || !mounted) return
    const panel = panelRef.current
    if (!panel) return

    const focusFrame = window.requestAnimationFrame(() => {
      // El input puede estar deshabilitado mientras carga la conversación
      // de Supabase, así que el foco inicial va al botón de cerrar (siempre
      // disponible) en vez de al input.
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
  }, [open, mounted, close])

  // Marca el resto del documento como `inert` mientras el panel está abierto.
  useEffect(() => {
    if (!open || !mounted) return
    const wrapper = panelRef.current?.closest('[data-chat-root]')
    return isolateModalBranch(wrapper ?? null)
  }, [open, mounted])

  // Devolución del foco al cerrar. Va DESPUÉS del efecto que aplica `inert`:
  // React ejecuta primero todas las limpiezas y luego los efectos, así que
  // aquí el resto del documento ya vuelve a ser enfocable.
  useEffect(() => {
    if (open || !restoreFocusRef.current) return
    restoreFocusRef.current = false

    // En la web, de vuelta a la burbuja. En la app no existe, así que el
    // foco va al contenido principal.
    //
    // No se intenta volver a quien abrió el chat: en la app siempre es una
    // entrada del menú, y ese menú se cierra con una animación de salida, por
    // lo que sigue en el DOM y parece válido justo cuando ya está
    // desapareciendo. Devolverle el foco lo dejaría en `body` un instante
    // después. Además, el propio menú ya devuelve el foco a su botón al
    // desmontarse.
    const destino = buttonRef.current ?? document.getElementById('contenido')
    destino?.focus()
  }, [open])

  // Auto-scroll al final cuando llegan mensajes nuevos.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, botTyping])

  const submit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')

    if (session.demo) {
      // Modo demo: añadimos localmente + respuesta simulada con delay.
      const userMsg: UIMessage = {
        id: `u-${Date.now()}`,
        side: 'right',
        text: trimmed,
      }
      setDemoMessages((prev) => [...prev, userMsg])
      setBotTyping(true)
      const delay = 600 + Math.min(1400, trimmed.length * 25)
      window.setTimeout(() => {
        setDemoMessages((prev) => [
          ...prev,
          { id: `b-${Date.now()}`, side: 'left', text: fakeReplyFor(trimmed) },
        ])
        setBotTyping(false)
      }, delay)
      return
    }

    // Modo real: enviamos a Supabase. El propio insert vuelve por la
    // suscripción realtime, así que no hace falta añadir localmente.
    void session.sendMessage(trimmed)
  }, [input, session])

  if (inCheckout || inAgent) return null

  const showLoading = !session.demo && session.status === 'loading'
  const showError = !session.demo && session.status === 'error'

  return (
    <div
      data-chat-root
      className="fixed bottom-6 right-4 z-[75] sm:right-6"
      // En la app nativa la barra de navegación vive abajo: sin esto, la
      // burbuja quedaría justo encima o pisada por ella.
      style={isNativeApp ? { bottom: `calc(1.5rem + ${ALTURA_TAB_BAR})` } : undefined}
    >
      {mounted && (
        <div
          ref={panelRef}
          id="chat-bananito"
          role="dialog"
          aria-modal="true"
          aria-label={t('chat.dialogLabel')}
          onTransitionEnd={(e) => {
            if (e.target !== e.currentTarget) return
            if (!open) setMounted(false)
          }}
          className={
            'mb-3 flex h-[min(560px,calc(100vh-6rem))] w-[min(22rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-[20px] border border-black/10 bg-surface shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)] transition-[transform,opacity] duration-200 ease-out will-change-[transform,opacity] ' +
            (visible
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-2 scale-95 opacity-0')
          }
        >
          {/* Cabecera — amarillo del nav */}
          <header
            className="flex items-center gap-3 px-4 py-3 text-ink"
            style={{ background: BANANA_YELLOW }}
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full"
              style={{ background: BANANA_BLUE }}
            >
              <img
                src={BANANITO_IMG}
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p id="chat-bananito-title" className="font-semibold leading-tight">
                Bananito
              </p>
              <p className="flex items-center gap-1.5 text-xs text-ink/70">
                <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
                En línea · Asistente de Banana
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label={t('chat.close')}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-ink/70 transition-colors hover:bg-black/10 hover:text-ink"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          {/* Historial — fondo con patrón sutil de plátanos */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
            style={{
              backgroundColor: '#fdf6e0',
              backgroundImage: `url(${CHAT_BG_PATTERN})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '55% auto',
              backgroundPosition: 'top left',
            }}
          >
            {session.necesitaDatos ? (
              <GuestGate onSubmit={session.registrarDatos} />
            ) : (
              <>
                {showLoading && (
                  <p className="text-center text-xs text-ink/60">Cargando conversación…</p>
                )}
                {showError && (
                  <p className="text-center text-xs text-danger">
                    No se pudo conectar con el servidor. Recarga la página.
                  </p>
                )}
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {botTyping && <TypingIndicator />}
              </>
            )}
          </div>

          {/* Pie: valoración, aviso de cierre o campo de escritura */}
          {session.necesitaDatos ? null : session.cierre.cerrada ? (
            <ClosedFooter session={session} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="flex items-center gap-2 border-t border-line bg-surface px-3 py-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje…"
                aria-label="Escribe un mensaje para Bananito"
                disabled={showLoading || showError}
                className="flex-1 rounded-full border border-line bg-neutral px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30 disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label="Enviar mensaje"
                disabled={!input.trim() || showLoading || showError}
                className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                style={{ background: BANANA_BLUE }}
              >
                <Icon name="arrow-right" size={16} />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Botón flotante con Bananito. Dentro de la app nativa no se pinta:
          es un patrón de web, y ahí compite con la barra de navegación
          inferior. Allí el chat se abre desde el menú. */}
      {!isNativeApp && (
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? t('chat.hide') : t('chat.open')}
        aria-expanded={open}
        aria-controls="chat-bananito"
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="ml-auto grid h-16 w-16 cursor-pointer place-items-center overflow-hidden rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_14px_30px_-4px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-100"
        style={{ background: BANANA_BLUE }}
      >
        {open ? (
          <Icon name="close" size={26} className="text-white" />
        ) : (
          <img
            src={BANANITO_IMG}
            alt=""
            width={64}
            height={64}
            className="h-[54px] w-[54px] object-contain"
          />
        )}
      </button>
      )}
    </div>
  )
}

/**
 * Puerta de entrada para quien escribe sin cuenta: pedimos nombre y email
 * antes de abrir la conversación, para tener a quién avisar si cierra el
 * chat antes de que le contesten.
 */
function GuestGate({
  onSubmit,
}: {
  onSubmit: (nombre: string, email: string) => Promise<{ error: string | null }>
}) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setEnviando(true)
    const { error: err } = await onSubmit(nombre, email)
    setEnviando(false)
    setError(err)
  }

  return (
    <div className="rounded-[16px] bg-surface/95 p-4 shadow-sm">
      <p className="text-sm font-semibold text-ink">Antes de empezar</p>
      <p className="mt-1 text-xs text-ink/70">
        Déjanos cómo te llamas y tu email. Si cierras el chat antes de que te
        respondamos, así podemos avisarte.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2" noValidate>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink">Nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoComplete="name"
            className="w-full rounded-[10px] border border-line bg-neutral px-3 py-2 text-sm text-ink outline-none focus:border-ink/30"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-[10px] border border-line bg-neutral px-3 py-2 text-sm text-ink outline-none focus:border-ink/30"
          />
        </label>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: BANANA_BLUE }}
        >
          {enviando ? 'Abriendo chat…' : 'Empezar a chatear'}
        </button>
      </form>

      <p className="mt-3 text-[11px] leading-snug text-ink/50">
        Prototipo de demostración: los datos se guardan para enseñar el flujo,
        pero <strong>todavía no se envía ningún email</strong>. Si tienes cuenta,
        inicia sesión y no hará falta escribirlos.
      </p>
    </div>
  )
}

/**
 * Pie del chat cuando el agente ha cerrado la conversación. Si pidió
 * valoración, se muestra el formulario de estrellas; si no, solo el aviso.
 */
function ClosedFooter({ session }: { session: ReturnType<typeof useVisitorChatSession> }) {
  const { cierre, enviarValoracion, empezarNuevaConversacion } = session
  const [estrellas, setEstrellas] = useState(0)
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const pideValoracion = cierre.valoracionSolicitada && !cierre.valoracionEnviada

  if (cierre.valoracionEnviada) {
    return (
      <div className="border-t border-line bg-surface px-3 py-4 text-center">
        <p className="text-sm font-semibold text-ink">¡Gracias por tu valoración!</p>
        <p className="mt-1 text-xs text-ink/60">La conversación está cerrada.</p>
        <NuevaConversacionButton onClick={empezarNuevaConversacion} />
      </div>
    )
  }

  if (!pideValoracion) {
    return (
      <div className="border-t border-line bg-surface px-3 py-4 text-center">
        <p className="text-sm font-semibold text-ink">Chat cerrado</p>
        <p className="mt-1 text-xs text-ink/60">
          Un agente ha cerrado esta conversación.
        </p>
        <NuevaConversacionButton onClick={empezarNuevaConversacion} />
      </div>
    )
  }

  async function submitRating(event: React.FormEvent) {
    event.preventDefault()
    if (estrellas < 1) {
      setError('Elige de 1 a 5 estrellas.')
      return
    }
    setEnviando(true)
    const { error: err } = await enviarValoracion(estrellas, observacion)
    setEnviando(false)
    setError(err)
  }

  return (
    <form
      onSubmit={submitRating}
      className="border-t border-line bg-surface px-3 py-4"
      noValidate
    >
      <p className="text-sm font-semibold text-ink">¿Qué tal te hemos atendido?</p>

      <div
        role="radiogroup"
        aria-label="Puntuación de 1 a 5 estrellas"
        className="mt-2 flex gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={estrellas === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            onClick={() => {
              setEstrellas(n)
              setError(null)
            }}
            className={
              'cursor-pointer text-2xl leading-none transition-transform hover:scale-110 ' +
              (n <= estrellas ? 'text-[#f5b301]' : 'text-ink/25')
            }
          >
            <span aria-hidden>★</span>
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-ink">
          Observaciones (opcional)
        </span>
        <textarea
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-[10px] border border-line bg-neutral px-3 py-2 text-sm text-ink outline-none focus:border-ink/30"
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-3 w-full cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: BANANA_BLUE }}
      >
        {enviando ? 'Enviando…' : 'Enviar valoración'}
      </button>

      {/* También se puede pasar de valorar y escribir directamente. */}
      <NuevaConversacionButton onClick={empezarNuevaConversacion} />
    </form>
  )
}

/** Abre una conversación nueva sin recargar la página. */
function NuevaConversacionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 w-full cursor-pointer rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-neutral"
    >
      Escribir otra consulta
    </button>
  )
}

function MessageBubble({ message }: { message: UIMessage }) {
  if (message.side === 'left') {
    return (
      <div className="flex items-end gap-2">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full"
          style={{ background: BANANA_BLUE }}
        >
          <img
            src={BANANITO_IMG}
            alt=""
            width={28}
            height={28}
            className="h-6 w-6 object-contain"
          />
        </span>
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-[16px] rounded-bl-[4px] bg-surface px-3.5 py-2 text-sm text-ink shadow-sm">
          {message.text}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[80%] whitespace-pre-wrap break-words rounded-[16px] rounded-br-[4px] px-3.5 py-2 text-sm text-white shadow-sm"
        style={{ background: BANANA_BLUE }}
      >
        {message.text}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <span
        className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full"
        style={{ background: BANANA_BLUE }}
      >
        <img
          src={BANANITO_IMG}
          alt=""
          width={28}
          height={28}
          className="h-6 w-6 object-contain"
        />
      </span>
      <div className="rounded-[16px] rounded-bl-[4px] bg-surface px-4 py-3 shadow-sm">
        <span className="flex gap-1">
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: '160ms' }}
          />
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: '320ms' }}
          />
        </span>
      </div>
    </div>
  )
}
