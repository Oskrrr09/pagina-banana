import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'

// Chat "Bananito" — prototipo visual, sin backend real todavía.
// - Botón flotante circular con Bananito en el color de la barra utilitaria (#0768A9).
// - Al abrir, panel con cabecera (Bananito + estado), historial de mensajes de
//   ejemplo y campo de entrada. Enviar añade un mensaje de usuario + una
//   respuesta simulada con delay para dar sensación de "está escribiendo".
// - Oculto en /checkout/* para no distraer del proceso de compra.
// - Accesible: role="dialog", foco al abrir en el input, trampa de foco,
//   Escape cierra y devuelve foco al botón.

const BANANA_BLUE = '#0768A9'
const BANANA_YELLOW = '#ffce1f' // mismo amarillo del nav (--color-brand)
const CHAT_BG_PATTERN = `${import.meta.env.BASE_URL}img/chat/pattern-bananas.png`

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const BANANITO_IMG = `${import.meta.env.BASE_URL}img/chat/bananito-square.png`

interface Message {
  id: string
  from: 'bot' | 'user'
  text: string
  ts: number
}

// Respuestas simuladas para el prototipo. Cuando se conecte la IA real,
// se sustituye este objeto por una llamada al backend.
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

const FALLBACK_REPLY =
  'Interesante pregunta. Déjame consultarlo — te paso con un compañero de tienda que te ayudará mejor. En unos segundos alguien te contestará.'

function fakeReplyFor(text: string): string {
  for (const { keyword, reply } of CANNED_REPLIES) {
    if (keyword.test(text)) return reply
  }
  return FALLBACK_REPLY
}

export function ChatBubble() {
  const [open, setOpen] = useState(false)
  // `mounted` mantiene el panel en el DOM durante la animación de salida.
  // `visible` conmuta la clase CSS que dispara el transform/opacity.
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      from: 'bot',
      text: '¡Hola! Soy Bananito 🍌 el asistente de Banana Computer. Puedo ayudarte con productos, accesorios, comparar modelos, tiendas o precios. ¿En qué te ayudo?',
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const inCheckout = location.pathname.startsWith('/checkout')

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  // Coreografía de montaje/animación:
  //  open=true  → montamos, y en el siguiente frame activamos `visible`
  //               para que la transición dispare desde el estado inicial.
  //  open=false → quitamos `visible` (se anima hacia fuera). El desmontaje
  //               ocurre en onTransitionEnd del panel.
  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = window.requestAnimationFrame(() => setVisible(true))
      return () => window.cancelAnimationFrame(raf)
    }
    setVisible(false)
  }, [open])

  // Foco al abrir, trampa de tab, escape cierra.
  // Depende de `mounted` porque el panel se monta un frame después de `open`.
  useEffect(() => {
    if (!open || !mounted) return
    const panel = panelRef.current
    if (!panel) return

    const focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
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
  }, [open, mounted])

  // Auto-scroll al final cuando llegan mensajes nuevos.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, botTyping])

  const sendMessage = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      from: 'user',
      text: trimmed,
      ts: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setBotTyping(true)
    // Respuesta simulada con pequeño delay para dar sensación de "escribiendo".
    const delay = 600 + Math.min(1400, trimmed.length * 25)
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          from: 'bot',
          text: fakeReplyFor(trimmed),
          ts: Date.now(),
        },
      ])
      setBotTyping(false)
    }, delay)
  }, [input])

  if (inCheckout) return null

  return (
    <div data-chat-root className="fixed bottom-6 right-4 z-[75] sm:right-6">
      {mounted && (
        <div
          ref={panelRef}
          id="chat-bananito"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-bananito-title"
          onTransitionEnd={(e) => {
            // Desmontar SOLO cuando termina la animación del propio panel
            // (no de sus hijos) y solo si estamos en fase de cierre.
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
              type="button"
              onClick={close}
              aria-label="Cerrar chat"
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
              backgroundColor: '#fdf6e0', // crema del fondo, por si hay bandas
              backgroundImage: `url(${CHAT_BG_PATTERN})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '55% auto',
              backgroundPosition: 'top left',
            }}
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {botTyping && <TypingIndicator />}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex items-center gap-2 border-t border-line bg-surface px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje…"
              aria-label="Escribe un mensaje para Bananito"
              className="flex-1 rounded-full border border-line bg-neutral px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
            <button
              type="submit"
              aria-label="Enviar mensaje"
              disabled={!input.trim()}
              className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: BANANA_BLUE }}
            >
              <Icon name="arrow-right" size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante con Bananito */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? 'Ocultar chat de Bananito' : 'Abrir chat de Bananito'}
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
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.from === 'bot'
  if (isBot) {
    return (
      <div className="flex items-end gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full" style={{ background: BANANA_BLUE }}>
          <img src={BANANITO_IMG} alt="" width={28} height={28} className="h-6 w-6 object-contain" />
        </span>
        <div
          className="max-w-[80%] rounded-[16px] rounded-bl-[4px] bg-surface px-3.5 py-2 text-sm text-ink shadow-sm"
        >
          {message.text}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[80%] rounded-[16px] rounded-br-[4px] px-3.5 py-2 text-sm text-white shadow-sm"
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
      <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full" style={{ background: BANANA_BLUE }}>
        <img src={BANANITO_IMG} alt="" width={28} height={28} className="h-6 w-6 object-contain" />
      </span>
      <div className="rounded-[16px] rounded-bl-[4px] bg-surface px-4 py-3 shadow-sm">
        <span className="flex gap-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-muted" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 animate-pulse rounded-full bg-muted" style={{ animationDelay: '160ms' }} />
          <span className="h-2 w-2 animate-pulse rounded-full bg-muted" style={{ animationDelay: '320ms' }} />
        </span>
      </div>
    </div>
  )
}
