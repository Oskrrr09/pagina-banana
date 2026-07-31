import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabaseEnabled, type AgentStatus, type DbCustomer } from '../lib/supabase'
import {
  assignConversation,
  useAgentConversation,
  useAgentInbox,
  useConversationVisitor,
  type InboxItem,
} from '../lib/chatSession'
import { useAgentAuth } from '../lib/agentAuth'
import {
  describeStatus,
  listPendingRequests,
  reviewRequest,
  signedProofUrl,
} from '../lib/educationalDiscount'

// Panel del agente — Fase 2
// - Con auth: solo entran cuentas dadas de alta en la tabla `agentes`.
//   Las cuentas son FICTICIAS; esto es una demostración.
// - Dos pestañas: conversaciones del chat y revisión de descuentos
//   educativos.
// - Layout tres columnas: lista de conversaciones, ventana de chat y
//   ficha del visitante.
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

type Tab = 'conversaciones' | 'descuentos'

export function AgentPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('conversaciones')
  const { session, agente, loading } = useAgentAuth()
  const inbox = useAgentInbox()

  // Selección automática de la conversación más reciente al cargar.
  useEffect(() => {
    if (selectedId) return
    if (inbox.items.length === 0) return
    setSelectedId(inbox.items[0].conversation.id)
  }, [inbox.items, selectedId])

  // Todos los hooks quedan por encima de cualquier return condicional
  // (Reglas de los Hooks), igual que en CheckoutPage.
  if (!supabaseEnabled) {
    return <SupabaseMissingScreen />
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral">
        <p className="text-sm text-ink/60">Comprobando acceso…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/agente/login" replace />
  }

  // Sesión válida pero la cuenta no está dada de alta como agente.
  if (!agente) {
    return <NotAnAgentScreen />
  }

  const selected = inbox.items.find((i) => i.conversation.id === selectedId)

  return (
    <div className="flex h-screen flex-col bg-neutral">
      <TopBar tab={tab} onTabChange={setTab} />
      {tab === 'conversaciones' ? (
        <div className="flex min-h-0 flex-1">
          <InboxColumn
            items={inbox.items}
            status={inbox.status}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <ConversationColumn
            conversationId={selectedId}
            assignedTo={selected?.conversation.agente_id ?? null}
          />
          <VisitorColumn conversationId={selectedId} />
        </div>
      ) : (
        <EducationalDiscountsPanel />
      )}
    </div>
  )
}

const ESTADOS: { value: AgentStatus; label: string; dot: string }[] = [
  { value: 'disponible', label: 'Disponible', dot: 'bg-green-600' },
  { value: 'ocupado', label: 'Ocupado', dot: 'bg-amber-500' },
  { value: 'ausente', label: 'Ausente', dot: 'bg-ink/40' },
]

function TopBar({ tab, onTabChange }: { tab: Tab; onTabChange: (t: Tab) => void }) {
  const { agente, signOut, setEstado } = useAgentAuth()
  const actual = ESTADOS.find((e) => e.value === agente?.estado) ?? ESTADOS[0]

  return (
    <header
      className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3"
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

      <nav aria-label="Secciones del panel" className="flex gap-1">
        <TabButton active={tab === 'conversaciones'} onClick={() => onTabChange('conversaciones')}>
          Conversaciones
        </TabButton>
        <TabButton active={tab === 'descuentos'} onClick={() => onTabChange('descuentos')}>
          Descuentos educativos
        </TabButton>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-ink/80">
          <span className={`inline-block h-2 w-2 rounded-full ${actual.dot}`} />
          <span className="sr-only">Tu estado</span>
          <select
            value={agente?.estado ?? 'disponible'}
            onChange={(e) => void setEstado(e.target.value as AgentStatus)}
            className="cursor-pointer rounded-full border border-ink/20 bg-surface px-2 py-1 text-xs text-ink"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs font-medium text-ink/80">{agente?.nombre}</span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="cursor-pointer rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink hover:bg-black/5"
        >
          Salir
        </button>
      </div>
    </header>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={
        'cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ' +
        (active ? 'bg-ink text-white' : 'text-ink/70 hover:bg-black/5')
      }
    >
      {children}
    </button>
  )
}

function NotAnAgentScreen() {
  const { signOut, session } = useAgentAuth()
  return (
    <div className="grid min-h-screen place-items-center bg-neutral p-8">
      <div className="max-w-lg space-y-3 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Sin permiso de agente</h1>
        <p className="text-sm text-ink/70">
          La cuenta <strong>{session?.user.email}</strong> ha iniciado sesión, pero no
          está dada de alta como agente. El alta se hace a mano desde el panel de
          Supabase; los pasos están en{' '}
          <code className="rounded bg-neutral px-1 text-xs">supabase/schema.sql</code>.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="cursor-pointer rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-black/5"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
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

function ConversationColumn({
  conversationId,
  assignedTo,
}: {
  conversationId: string | null
  assignedTo: string | null
}) {
  const { messages, sendMessage, status } = useAgentConversation(conversationId)
  const { agente } = useAgentAuth()
  const [input, setInput] = useState('')
  const [assigning, setAssigning] = useState(false)
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

  const mine = assignedTo != null && assignedTo === agente?.id
  const takenByOther = assignedTo != null && assignedTo !== agente?.id

  const toggleAssign = async () => {
    if (!conversationId || !agente) return
    setAssigning(true)
    await assignConversation(conversationId, mine ? null : agente.id)
    setAssigning(false)
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
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{visitorLabel}</p>
          <p className="text-xs text-ink/60">
            Canal: web ·{' '}
            {mine
              ? 'Asignada a ti'
              : takenByOther
                ? 'Asignada a otro agente'
                : 'Sin asignar'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggleAssign()}
          disabled={assigning || takenByOther}
          className="ml-auto shrink-0 cursor-pointer rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mine ? 'Soltar' : 'Asignarme'}
        </button>
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

function VisitorColumn({ conversationId }: { conversationId: string | null }) {
  const { visitor, otherConversations, status } = useConversationVisitor(conversationId)

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-line bg-surface xl:flex">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Ficha del visitante</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 text-sm">
        {!conversationId && (
          <p className="text-ink/60">Selecciona una conversación.</p>
        )}
        {conversationId && status === 'loading' && (
          <p className="text-ink/60">Cargando…</p>
        )}
        {conversationId && status === 'error' && (
          <p className="text-danger">No se pudo cargar la ficha.</p>
        )}
        {conversationId && status === 'ready' && (
          <>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-ink/60">Identificador</dt>
                <dd className="font-mono text-xs text-ink">
                  {visitor ? shortId(visitor.id) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink/60">Nombre</dt>
                <dd className="text-ink">{visitor?.nombre ?? 'No facilitado'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/60">Email</dt>
                <dd className="break-words text-ink">{visitor?.email ?? 'No facilitado'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/60">Primera visita</dt>
                <dd className="text-ink">
                  {visitor
                    ? new Date(visitor.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-line pt-4">
              <h3 className="text-xs font-semibold text-ink">
                Conversaciones anteriores ({otherConversations.length})
              </h3>
              {otherConversations.length === 0 ? (
                <p className="mt-2 text-xs text-ink/60">Es su primera conversación.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {otherConversations.map((c) => (
                    <li key={c.id} className="text-xs text-ink/70">
                      <span className="font-mono">{shortId(c.id)}</span> ·{' '}
                      {formatRelative(c.ultimo_mensaje_at ?? c.created_at)} ·{' '}
                      {c.estado}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-6 text-xs text-ink/50">
              El visitante del chat no se identifica con cuenta todavía, así que
              nombre y email solo aparecen si los ha escrito él.
            </p>
          </>
        )}
      </div>
    </aside>
  )
}

function EducationalDiscountsPanel() {
  const [requests, setRequests] = useState<DbCustomer[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setStatus('loading')
    const { requests: rows, error } = await listPendingRequests()
    if (error) {
      console.error('[descuentos] load error', error)
      setStatus('error')
      return
    }
    setRequests(rows)
    setStatus('ready')
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (
    cliente: DbCustomer,
    estado: 'aprobado' | 'rechazado',
  ) => {
    setBusyId(cliente.id)
    const { error } = await reviewRequest(cliente.id, estado, notes[cliente.id])
    setBusyId(null)
    if (error) {
      console.error('[descuentos] review error', error)
      return
    }
    await load()
  }

  const openProof = async (path: string) => {
    const url = await signedProofUrl(path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-lg font-bold text-ink">Descuentos educativos</h2>
        <p className="mt-1 text-sm text-ink/70">
          Solicitudes pendientes de revisar. La validación es manual: abre el
          justificante, comprueba que corresponde y decide.
        </p>

        {status === 'loading' && <p className="mt-6 text-sm text-ink/60">Cargando…</p>}
        {status === 'error' && (
          <p className="mt-6 text-sm text-danger">No se pudieron cargar las solicitudes.</p>
        )}
        {status === 'ready' && requests.length === 0 && (
          <p className="mt-6 rounded-[12px] border border-line bg-surface p-4 text-sm text-ink/60">
            No hay solicitudes pendientes.
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {requests.map((cliente) => (
            <li
              key={cliente.id}
              className="rounded-[16px] border border-line bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {cliente.nombre || 'Sin nombre'}
                  </p>
                  <p className="break-words text-sm text-ink/70">{cliente.email}</p>
                  <p className="mt-1 text-xs text-ink/60">
                    Subido {formatRelative(cliente.descuento_educativo_subido_at)}
                  </p>
                </div>
                {cliente.descuento_educativo_archivo && (
                  <button
                    type="button"
                    onClick={() => void openProof(cliente.descuento_educativo_archivo!)}
                    className="cursor-pointer rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-black/5"
                  >
                    Ver justificante
                  </button>
                )}
              </div>

              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-medium text-ink">
                  Nota para el cliente (opcional; obligatoria si rechazas)
                </span>
                <input
                  value={notes[cliente.id] ?? ''}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [cliente.id]: e.target.value }))
                  }
                  className="field"
                  placeholder="Ej.: el documento no muestra el curso académico."
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void decide(cliente, 'aprobado')}
                  disabled={busyId === cliente.id}
                  className="cursor-pointer rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => void decide(cliente, 'rechazado')}
                  disabled={busyId === cliente.id || !notes[cliente.id]?.trim()}
                  className="cursor-pointer rounded-full border border-danger px-4 py-2 text-xs font-semibold text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Rechazar
                </button>
                <span className="self-center text-xs text-ink/50">
                  Estado actual: {describeStatus(cliente.descuento_educativo_estado)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
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
