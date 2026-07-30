import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabaseEnabled } from '../lib/supabase'
import {
  useAgentConversation,
  useAgentInbox,
  type InboxItem,
} from '../lib/chatSession'

// Panel del agente — Fase 1
// - Sin auth: se asume que quien accede a /agente es un compañero de tienda.
// - Layout dos columnas: lista de conversaciones a la izquierda,
//   ventana de chat activa a la derecha.
// - Realtime: los mensajes nuevos aparecen sin refrescar.

const BANANA_BLUE = '#0768A9'
const BANANA_YELLOW = '#ffce1f'
const BANANITO_IMG = `${import.meta.env.BASE_URL}img/chat/bananito-square.png`

function shortId(id: string): string {
  return id.slice(0, 8)
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

export function AgentPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const inbox = useAgentInbox()

  // Selección automática de la conversación más reciente al cargar.
  useEffect(() => {
    if (selectedId) return
    if (inbox.items.length === 0) return
    setSelectedId(inbox.items[0].conversation.id)
  }, [inbox.items, selectedId])

  if (!supabaseEnabled) {
    return <SupabaseMissingScreen />
  }

  return (
    <div className="flex h-screen flex-col bg-neutral">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <InboxColumn
          items={inbox.items}
          status={inbox.status}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <ConversationColumn conversationId={selectedId} />
      </div>
    </div>
  )
}

function TopBar() {
  return (
    <header
      className="flex items-center gap-3 border-b border-line px-4 py-3"
      style={{ background: BANANA_YELLOW }}
    >
      <Link to="/" className="flex items-center gap-3 text-ink" aria-label="Ir a la web">
        <img
          src={`${import.meta.env.BASE_URL}img/logo-dark.svg`}
          alt="Banana Computer"
          className="h-6 w-auto"
        />
        <span className="text-sm font-semibold">Panel de agentes</span>
      </Link>
      <div className="ml-auto flex items-center gap-2 text-xs text-ink/70">
        <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
        Disponible · Oscar
      </div>
    </header>
  )
}

function InboxColumn({
  items,
  status,
  selectedId,
  onSelect,
}: {
  items: InboxItem[]
  status: 'loading' | 'ready' | 'demo' | 'error'
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Conversaciones</h2>
        <span className="text-xs text-ink/60">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {status === 'loading' && (
          <p className="p-4 text-sm text-ink/60">Cargando…</p>
        )}
        {status === 'error' && (
          <p className="p-4 text-sm text-danger">Error al cargar conversaciones.</p>
        )}
        {status === 'ready' && items.length === 0 && (
          <p className="p-4 text-sm text-ink/60">
            Aún no hay conversaciones. Abre la web como visitante y escribe algo desde
            la burbuja de Bananito.
          </p>
        )}
        <ul>
          {items.map(({ conversation, lastMessage }) => {
            const active = conversation.id === selectedId
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={
                    'flex w-full cursor-pointer items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors ' +
                    (active ? 'bg-brand-050' : 'hover:bg-neutral')
                  }
                >
                  <span
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full"
                    style={{ background: BANANA_BLUE }}
                  >
                    <img
                      src={BANANITO_IMG}
                      alt=""
                      className="h-7 w-7 object-contain"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">
                        Visitante {shortId(conversation.visitor_id)}
                      </p>
                      <span className="ml-auto shrink-0 text-[11px] text-ink/50">
                        {formatRelative(conversation.ultimo_mensaje_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink/60">
                      {lastMessage
                        ? `${lastMessage.autor === 'visitor' ? '' : lastMessage.autor === 'agent' ? 'Tú: ' : 'Bot: '}${lastMessage.texto}`
                        : 'Sin mensajes todavía'}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

function ConversationColumn({ conversationId }: { conversationId: string | null }) {
  const { messages, sendMessage, status } = useAgentConversation(conversationId)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const visitorLabel = useMemo(() => {
    if (!conversationId) return ''
    const visitorMsg = messages.find((m) => m.autor === 'visitor')
    return visitorMsg
      ? `Visitante ${shortId(conversationId)}`
      : `Visitante ${shortId(conversationId)}`
  }, [conversationId, messages])

  if (!conversationId) {
    return (
      <main className="grid flex-1 place-items-center bg-neutral p-8 text-center">
        <div>
          <p className="text-sm text-ink/70">
            Selecciona una conversación de la lista para empezar a responder.
          </p>
        </div>
      </main>
    )
  }

  const submit = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    await sendMessage(trimmed)
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-neutral">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-6 py-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full"
          style={{ background: BANANA_BLUE }}
        >
          <img src={BANANITO_IMG} alt="" className="h-7 w-7 object-contain" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{visitorLabel}</p>
          <p className="text-xs text-ink/60">Canal: web · Fase 1 sin identidad</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-6">
        {status === 'loading' && (
          <p className="text-center text-xs text-ink/60">Cargando historial…</p>
        )}
        {status === 'error' && (
          <p className="text-center text-xs text-danger">
            No se pudo cargar la conversación.
          </p>
        )}
        {messages.map((m) => {
          const side =
            m.autor === 'visitor' ? 'left' : m.autor === 'agent' ? 'right' : 'left'
          const isAgent = m.autor === 'agent'
          const isBot = m.autor === 'bot'
          return (
            <div
              key={m.id}
              className={side === 'right' ? 'flex justify-end' : 'flex items-end gap-2'}
            >
              {side === 'left' && (
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full"
                  style={{ background: isBot ? BANANA_BLUE : '#c9c9cf' }}
                >
                  {isBot ? (
                    <img src={BANANITO_IMG} alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold text-white">V</span>
                  )}
                </span>
              )}
              <div
                className={
                  'max-w-[70%] whitespace-pre-wrap break-words rounded-[16px] px-3.5 py-2 text-sm shadow-sm ' +
                  (isAgent
                    ? 'rounded-br-[4px] text-white'
                    : 'rounded-bl-[4px] bg-surface text-ink')
                }
                style={isAgent ? { background: BANANA_BLUE } : undefined}
              >
                {m.texto}
              </div>
            </div>
          )
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="flex items-center gap-2 border-t border-line bg-surface px-6 py-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Responde al visitante…"
          aria-label="Responder al visitante"
          className="flex-1 rounded-full border border-line bg-neutral px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: BANANA_BLUE }}
        >
          Enviar
        </button>
      </form>
    </main>
  )
}

function SupabaseMissingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-neutral p-8">
      <div className="max-w-lg space-y-3 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Panel de agentes</h1>
        <p className="text-sm text-ink/70">
          Este panel requiere Supabase configurado. Añade las variables
          <code className="mx-1 rounded bg-neutral px-1 text-xs">VITE_SUPABASE_URL</code>
          y
          <code className="mx-1 rounded bg-neutral px-1 text-xs">VITE_SUPABASE_ANON_KEY</code>
          en un archivo <code className="rounded bg-neutral px-1 text-xs">.env.local</code>
          y reinicia el servidor de desarrollo.
        </p>
        <p className="text-sm text-ink/70">
          El script SQL para crear las tablas está en
          <code className="ml-1 rounded bg-neutral px-1 text-xs">supabase/schema.sql</code>.
        </p>
      </div>
    </div>
  )
}
