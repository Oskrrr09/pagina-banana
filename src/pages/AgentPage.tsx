import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabaseEnabled, type AgentStatus, type DbAgent, type DbConversation, type DbCustomer } from '../lib/supabase'
import {
  assignConversation,
  setConversationState,
  useAgentConversation,
  useAgentInbox,
  useAgentNames,
  useConversationVisitor,
  visitorDisplayName,
  type InboxItem,
} from '../lib/chatSession'
import { useAgentAuth } from '../lib/agentAuth'
import { describeStatus, listPendingRequests, reviewRequest, signedProofUrl } from '../lib/educationalDiscount'
import { useAppBadge, useNotifications } from '../lib/pwa'
import { useNewMessageAlert, useUnreadConversations } from '../lib/agentUnread'
import { AgentAppBar } from '../components/agent/AgentAppBar'

// Panel del agente — Fase 2
// - Con auth: solo entran cuentas dadas de alta en la tabla `agentes`.
//   Las cuentas son FICTICIAS; esto es una demostración.
// - Dos pestañas: conversaciones del chat y revisión de descuentos
//   educativos.
// - Layout tres columnas: lista de conversaciones, ventana de chat y
//   ficha del visitante.
// - Realtime: los mensajes nuevos aparecen sin refrescar.

const BANANA_BLUE = '#0768A9'
// Versión pastel del azul del nav, para las respuestas automáticas de
// Bananito: mismo tono, mucha menos saturación, así se distinguen de un
// vistazo de lo que ha escrito una persona sin salirse de la paleta.
const BANANA_BLUE_PASTEL = '#cfe4f5'
const BANANA_YELLOW = '#ffce1f'
const BANANITO_IMG = `${import.meta.env.BASE_URL}img/chat/bananito-square.png`
const CHAT_BG_PATTERN = `${import.meta.env.BASE_URL}img/chat/pattern-bananas.png`

// Mismo fondo que la burbuja de la web. Allí el patrón mide el 55% de un
// panel de ~352px, así que aquí lo fijamos en píxeles para que se vea a la
// misma escala aunque esta columna sea mucho más ancha.
const CHAT_BACKGROUND = {
  backgroundColor: '#fdf6e0',
  backgroundImage: `url(${CHAT_BG_PATTERN})`,
  backgroundRepeat: 'repeat',
  backgroundSize: '190px auto',
  backgroundPosition: 'top left',
} as const

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
  const [bandeja, setBandeja] = useState<Bandeja>('abierta')
  const { session, agente, loading } = useAgentAuth()
  const inbox = useAgentInbox(bandeja)

  // Selección automática de la conversación más reciente al cargar.
  useEffect(() => {
    if (selectedId) return
    if (inbox.items.length === 0) return
    setSelectedId(inbox.items[0].conversation.id)
  }, [inbox.items, selectedId])

  // --- Panel como aplicación instalable ---------------------------------
  // Las etiquetas de manifest e iconos las declara AgentAppScope, que
  // envuelve también a /agente/login.
  const { unreadIds, count: sinLeer } = useUnreadConversations(inbox.items, selectedId)
  // El contador del Dock solo tiene sentido con la bandeja de abiertas; al
  // mirar el archivo se conserva el último valor en vez de caer a cero.
  const [badge, setBadge] = useState(0)
  useEffect(() => {
    if (bandeja === 'abierta') setBadge(sinLeer)
  }, [bandeja, sinLeer])
  useAppBadge(badge)

  const { permission, request: pedirNotificaciones, notify } = useNotifications()
  useNewMessageAlert(inbox.items, (item) => {
    notify(
      `${visitorDisplayName(item.visitor, item.conversation.visitor_id)} ha escrito`,
      item.lastMessage?.texto ?? 'Mensaje nuevo en el chat',
    )
  })

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
      <TopBar tab={tab} onTabChange={setTab} sinLeer={badge} />
      <AgentAppBar notificaciones={permission} onPedirNotificaciones={() => void pedirNotificaciones()} />
      {tab === 'conversaciones' ? (
        <div className="flex min-h-0 flex-1">
          <InboxColumn
            items={inbox.items}
            status={inbox.status}
            selectedId={selectedId}
            onSelect={setSelectedId}
            unreadIds={unreadIds}
            bandeja={bandeja}
            onBandejaChange={(next) => {
              setBandeja(next)
              // La conversación abierta puede no estar en la otra bandeja.
              setSelectedId(null)
            }}
          />
          <ConversationColumn conversationId={selectedId} conversation={selected?.conversation ?? null} />
          <VisitorColumn conversationId={selectedId} />
        </div>
      ) : (
        <EducationalDiscountsPanel />
      )}
    </div>
  )
}

type Bandeja = 'abierta' | 'cerrada'

const ESTADOS: { value: AgentStatus; label: string; dot: string }[] = [
  { value: 'disponible', label: 'Disponible', dot: 'bg-green-600' },
  { value: 'ocupado', label: 'Ocupado', dot: 'bg-amber-500' },
  { value: 'ausente', label: 'Ausente', dot: 'bg-ink/40' },
]

function TopBar({ tab, onTabChange, sinLeer }: { tab: Tab; onTabChange: (t: Tab) => void; sinLeer: number }) {
  const { agente, signOut, setEstado } = useAgentAuth()
  const actual = ESTADOS.find((e) => e.value === agente?.estado) ?? ESTADOS[0]

  return (
    <header
      className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3"
      style={{ background: BANANA_YELLOW }}
    >
      <Link to="/" className="flex items-center gap-3 text-ink" aria-label="Ir a la web">
        <img src={`${import.meta.env.BASE_URL}img/logo-dark.svg`} alt="Banana Computer" className="h-6 w-auto" />
        <span className="text-sm font-semibold">Panel de agentes</span>
      </Link>

      <nav aria-label="Secciones del panel" className="flex gap-1">
        <TabButton active={tab === 'conversaciones'} onClick={() => onTabChange('conversaciones')}>
          Conversaciones
          {sinLeer > 0 && (
            <>
              <span
                aria-hidden="true"
                className="ml-1.5 inline-grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
              >
                {sinLeer}
              </span>
              <span className="sr-only">({sinLeer} sin leer)</span>
            </>
          )}
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

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
      <div className="w-full min-w-0 max-w-lg space-y-3 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Sin permiso de agente</h1>
        <p className="text-sm text-ink/70">
          La cuenta <strong>{session?.user.email}</strong> ha iniciado sesión, pero no está dada de alta como agente. El
          alta se hace a mano desde el panel de Supabase; los pasos están en{' '}
          <code className="break-all rounded bg-neutral px-1 text-xs">supabase/schema.sql</code>.
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
  unreadIds,
  bandeja,
  onBandejaChange,
}: {
  items: InboxItem[]
  status: 'loading' | 'ready' | 'demo' | 'error'
  selectedId: string | null
  onSelect: (id: string) => void
  unreadIds: Set<string>
  bandeja: Bandeja
  onBandejaChange: (next: Bandeja) => void
}) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Conversaciones</h2>
        <span className="text-xs text-ink/60">{items.length}</span>
      </div>

      <div role="tablist" aria-label="Bandeja de conversaciones" className="flex gap-1 border-b border-line px-3 py-2">
        <BandejaTab active={bandeja === 'abierta'} onClick={() => onBandejaChange('abierta')}>
          Abiertas
        </BandejaTab>
        <BandejaTab active={bandeja === 'cerrada'} onClick={() => onBandejaChange('cerrada')}>
          Archivadas
        </BandejaTab>
      </div>

      <div className="flex-1 overflow-y-auto">
        {status === 'loading' && <p className="p-4 text-sm text-ink/60">Cargando…</p>}
        {status === 'error' && <p className="p-4 text-sm text-danger">Error al cargar conversaciones.</p>}
        {status === 'ready' && items.length === 0 && (
          <p className="p-4 text-sm text-ink/60">
            {bandeja === 'abierta'
              ? 'No hay conversaciones abiertas. Abre la web como visitante y escribe algo desde la burbuja de Bananito.'
              : 'No hay conversaciones archivadas todavía.'}
          </p>
        )}
        <ul>
          {items.map(({ conversation, lastMessage, visitor }) => {
            const active = conversation.id === selectedId
            const sinLeer = unreadIds.has(conversation.id)
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
                    <img src={BANANITO_IMG} alt="" className="h-7 w-7 object-contain" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={'truncate text-sm text-ink ' + (sinLeer ? 'font-bold' : 'font-medium')}>
                        {visitorDisplayName(visitor, conversation.visitor_id)}
                      </p>
                      {sinLeer && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-danger"
                          // El punto es decorativo: quien use lector de
                          // pantalla necesita la palabra, no el color.
                          aria-hidden="true"
                        />
                      )}
                      {sinLeer && <span className="sr-only">Sin leer.</span>}
                      <span className="ml-auto shrink-0 text-[11px] text-ink/50">
                        {formatRelative(conversation.ultimo_mensaje_at)}
                      </span>
                    </div>
                    <p className={'mt-0.5 truncate text-xs ' + (sinLeer ? 'font-semibold text-ink' : 'text-ink/60')}>
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

function BandejaTab({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        'flex-1 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ' +
        (active ? 'bg-ink text-white' : 'text-ink/70 hover:bg-neutral')
      }
    >
      {children}
    </button>
  )
}

function ConversationColumn({
  conversationId,
  conversation,
}: {
  conversationId: string | null
  conversation: DbConversation | null
}) {
  const assignedTo = conversation?.agente_id ?? null
  const estado = conversation?.estado ?? 'abierta'
  const { messages, sendMessage, status } = useAgentConversation(conversationId)
  const { visitor } = useConversationVisitor(conversationId)
  const agentNames = useAgentNames()
  const { agente } = useAgentAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  // Nombre si lo tenemos (de la cuenta o del formulario de invitado); si
  // no, un identificador corto para poder distinguir conversaciones.
  const visitorLabel = conversationId ? visitorDisplayName(visitor, conversation?.visitor_id ?? conversationId) : ''

  if (!conversationId) {
    return (
      <main className="grid flex-1 place-items-center bg-neutral p-8 text-center">
        <div>
          <p className="text-sm text-ink/70">Selecciona una conversación de la lista para empezar a responder.</p>
        </div>
      </main>
    )
  }

  const mine = assignedTo != null && assignedTo === agente?.id
  const takenByOther = assignedTo != null && assignedTo !== agente?.id
  const cerrada = estado === 'cerrada'
  // Un supervisor puede gestionar estado y asignación de otros, pero no
  // responder firmando dentro de una conversación ajena. Para responder debe
  // liberarla y asumirla explícitamente; así se conserva la autoría real.
  const puedeResponder = !cerrada && !takenByOther

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
          <p className="truncate text-sm font-semibold text-ink">
            {visitorLabel}
            {visitor?.cliente_id && (
              <span className="ml-2 rounded-full bg-available-050 px-2 py-0.5 text-[10px] font-semibold text-available">
                Registrado
              </span>
            )}
          </p>
          {visitor?.telefono && (
            <p className="truncate text-xs text-ink/70">
              <a href={`tel:${visitor.telefono}`} className="hover:underline">
                {visitor.telefono}
              </a>
            </p>
          )}
          <p className="text-xs text-ink/60">
            Canal: web · {mine ? 'Asignada a ti' : takenByOther ? 'Asignada a otro agente' : 'Sin asignar'}
            {cerrada && ' · Archivada'}
          </p>
        </div>
        <ConversationActions conversationId={conversationId} estado={estado} assignedTo={assignedTo} agent={agente} />
      </header>

      {/* Valoración recibida */}
      {conversation?.valoracion_estrellas != null && (
        <div className="border-b border-line bg-surface px-6 py-3">
          <p className="text-xs font-semibold text-ink">
            Valoración del cliente:{' '}
            <span className="text-[#f5b301]" aria-hidden>
              {'★'.repeat(conversation.valoracion_estrellas)}
              {'☆'.repeat(5 - conversation.valoracion_estrellas)}
            </span>{' '}
            <span className="font-normal text-ink/70">({conversation.valoracion_estrellas} de 5)</span>
          </p>
          {conversation.valoracion_observacion && (
            <p className="mt-1 text-sm text-ink/80">“{conversation.valoracion_observacion}”</p>
          )}
        </div>
      )}
      {cerrada && conversation?.valoracion_solicitada && conversation.valoracion_estrellas == null && (
        <div className="border-b border-line bg-surface px-6 py-2 text-xs text-ink/60">
          Valoración pedida al cliente · pendiente de respuesta
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-6" style={CHAT_BACKGROUND}>
        {status === 'loading' && <p className="text-center text-xs text-ink/60">Cargando historial…</p>}
        {status === 'error' && <p className="text-center text-xs text-danger">No se pudo cargar la conversación.</p>}
        {messages.map((m) => {
          // Aquí manda el punto de vista del AGENTE, al revés que en la
          // burbuja de la web: todo lo que sale de Banana (agente y también
          // Bananito, que responde en su nombre) va a la derecha en azul del
          // nav; el cliente va a la izquierda.
          const isAgent = m.autor === 'agent'
          const isBot = m.autor === 'bot'
          const deBanana = isAgent || isBot

          const autorNombre = isAgent
            ? m.agente_id
              ? (agentNames[m.agente_id] ?? 'Agente')
              : 'Agente'
            : isBot
              ? 'Bananito · automático'
              : visitorDisplayName(visitor)

          return (
            <div key={m.id} className={deBanana ? 'flex justify-end' : 'flex items-end gap-2'}>
              {!deBanana && (
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#c9c9cf]"
                  aria-hidden
                >
                  <span className="text-[10px] font-bold text-white">{visitorDisplayName(visitor).charAt(0)}</span>
                </span>
              )}
              <div className={'max-w-[70%] ' + (deBanana ? 'text-right' : '')}>
                <p className="mb-0.5 px-1 text-[11px] font-medium text-ink/60">{autorNombre}</p>
                <div
                  className={
                    'inline-block whitespace-pre-wrap break-words rounded-[16px] px-3.5 py-2 text-left text-sm shadow-sm ' +
                    (deBanana ? 'rounded-br-[4px]' : 'rounded-bl-[4px] bg-surface text-ink') +
                    // Sobre el azul pastel del bot el texto blanco no se
                    // leería, así que ahí va en tinta.
                    (deBanana ? (isBot ? ' text-ink' : ' text-white') : '')
                  }
                  style={deBanana ? { background: isBot ? BANANA_BLUE_PASTEL : BANANA_BLUE } : undefined}
                >
                  {m.texto}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {cerrada ? (
        <div className="border-t border-line bg-surface px-6 py-4 text-sm text-ink/60">
          Conversación archivada. Reábrela para poder responder; si el visitante vuelve a escribir se le abrirá una
          conversación nueva.
        </div>
      ) : (
        <AgentMessageComposer canReply={puedeResponder} takenByOther={takenByOther} sendMessage={sendMessage} />
      )}
    </main>
  )
}

export function AgentMessageComposer({
  canReply,
  takenByOther,
  sendMessage,
}: {
  canReply: boolean
  takenByOther: boolean
  sendMessage: (text: string) => Promise<{ error: string | null }>
}) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setNotice(null)
    setSending(true)
    try {
      const { error } = await sendMessage(trimmed)
      if (error) {
        setNotice(error)
        return
      }
      setInput('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="flex items-center gap-2 border-t border-line bg-surface px-6 py-4"
    >
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Responde al visitante…"
        aria-label="Responder al visitante"
        disabled={!canReply || sending}
        className="flex-1 rounded-full border border-line bg-neutral px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
      />
      <button
        type="submit"
        disabled={!input.trim() || !canReply || sending}
        className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: BANANA_BLUE }}
      >
        {sending ? 'Enviando…' : 'Enviar'}
      </button>
      {!canReply && takenByOther && (
        <p className="text-xs text-ink/60">Libera la asignación y asígnatela antes de responder.</p>
      )}
      {notice && (
        <p role="alert" className="text-xs font-medium text-[#b3261e]">
          {notice}
        </p>
      )}
    </form>
  )
}

type ConversationOperation = 'assign' | 'release' | 'close' | 'reopen'

interface ConversationActionOperations {
  assign: typeof assignConversation
  changeState: typeof setConversationState
}

const DEFAULT_CONVERSATION_OPERATIONS: ConversationActionOperations = {
  assign: assignConversation,
  changeState: setConversationState,
}

function readableError(error: unknown): string {
  return error instanceof Error ? error.message : 'La operación no se pudo completar.'
}

/**
 * Acciones observables de una conversación. La autorización sigue en SQL;
 * aquí se evita ofrecer operaciones que el rol actual no puede completar y se
 * conserva siempre el error devuelto por el servidor.
 */
export function ConversationActions({
  conversationId,
  estado,
  assignedTo,
  agent,
  operations = DEFAULT_CONVERSATION_OPERATIONS,
  onSuccess,
}: {
  conversationId: string
  estado: DbConversation['estado']
  assignedTo: string | null
  agent: Pick<DbAgent, 'id' | 'rol'> | null
  operations?: ConversationActionOperations
  onSuccess?: (operation: ConversationOperation) => void
}) {
  const [assigning, setAssigning] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const mine = assignedTo != null && assignedTo === agent?.id
  const takenByOther = assignedTo != null && assignedTo !== agent?.id
  const esSupervisor = agent?.rol === 'supervisor'
  const cerrada = estado === 'cerrada'
  const assignmentOperation: 'assign' | 'release' | null = cerrada
    ? null
    : mine || (takenByOther && esSupervisor)
      ? 'release'
      : assignedTo == null
        ? 'assign'
        : null
  const assignmentLabel = mine
    ? 'Soltar'
    : takenByOther
      ? esSupervisor
        ? 'Liberar asignación'
        : 'Asignada a otro agente'
      : 'Asignarme'
  const canChangeState = Boolean(agent && (mine || esSupervisor))
  const stateDisabledReason = canChangeState
    ? undefined
    : takenByOther
      ? 'Solo el agente asignado o un supervisor puede gestionar esta conversación.'
      : 'Asígnate la conversación antes de cerrarla.'

  const toggleAssign = async () => {
    if (!agent || !assignmentOperation) return
    setAviso(null)
    setAssigning(true)
    try {
      const { error } = await operations.assign(conversationId, assignmentOperation === 'assign' ? agent.id : null)
      if (error) {
        setAviso(error)
        return
      }
      onSuccess?.(assignmentOperation)
    } catch (error) {
      setAviso(readableError(error))
    } finally {
      setAssigning(false)
    }
  }

  // Reabrir es inmediato; cerrar pasa por el diálogo de valoración.
  const toggleState = async () => {
    if (!canChangeState) return
    setAviso(null)
    if (!cerrada) {
      setCloseDialog(true)
      return
    }
    setClosing(true)
    try {
      const { error } = await operations.changeState(conversationId, 'abierta')
      if (error) {
        setAviso(error)
        return
      }
      onSuccess?.('reopen')
    } catch (error) {
      setAviso(readableError(error))
    } finally {
      setClosing(false)
    }
  }

  const confirmClose = async (requestRating: boolean) => {
    setAviso(null)
    setClosing(true)
    try {
      const { error } = await operations.changeState(conversationId, 'cerrada', {
        pedirValoracion: requestRating,
      })
      if (error) {
        setAviso(error)
        return
      }
      setCloseDialog(false)
      onSuccess?.('close')
    } catch (error) {
      setAviso(readableError(error))
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
      {!cerrada && (
        <button
          type="button"
          onClick={() => void toggleAssign()}
          disabled={assigning || assignmentOperation == null}
          title={
            assignmentOperation == null
              ? 'Solo el agente asignado o un supervisor puede liberar esta asignación.'
              : undefined
          }
          className="cursor-pointer rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {assigning ? 'Guardando…' : assignmentLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => void toggleState()}
        disabled={closing || !canChangeState}
        title={stateDisabledReason}
        className="cursor-pointer rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {closing ? 'Guardando…' : cerrada ? 'Reabrir' : 'Cerrar'}
      </button>
      {aviso && !closeDialog && (
        <p role="alert" className="w-full text-right text-xs font-medium text-[#b3261e]">
          {aviso}
        </p>
      )}
      {closeDialog && (
        <ConfirmDialog title="Cerrar conversación" onCancel={() => setCloseDialog(false)} busy={closing}>
          <p className="text-sm text-ink/80">
            ¿Quieres pedirle al cliente que valore la atención? Verá un formulario de estrellas la próxima vez que abra
            el chat.
          </p>
          {aviso && (
            <p role="alert" className="mt-3 text-sm font-medium text-[#b3261e]">
              {aviso}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void confirmClose(true)}
              disabled={closing}
              className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Cerrar y pedir valoración
            </button>
            <button
              type="button"
              onClick={() => void confirmClose(false)}
              disabled={closing}
              className="cursor-pointer rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-black/5 disabled:opacity-50"
            >
              Cerrar sin pedirla
            </button>
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}

/**
 * Diálogo de confirmación del panel. Escape cancela y el foco entra en el
 * cuadro, para no dejar al teclado detrás del overlay.
 */
function ConfirmDialog({
  title,
  children,
  onCancel,
  busy,
}: {
  title: string
  children: React.ReactNode
  onCancel: () => void
  busy: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('button')?.focus()
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      previo?.focus?.()
    }
  }, [onCancel, busy])

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-[16px] border border-line bg-surface p-5 shadow-[var(--shadow-raised)]"
      >
        <h2 className="font-semibold text-ink">{title}</h2>
        <div className="mt-2">{children}</div>
      </div>
    </div>
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
        {!conversationId && <p className="text-ink/60">Selecciona una conversación.</p>}
        {conversationId && status === 'loading' && <p className="text-ink/60">Cargando…</p>}
        {conversationId && status === 'error' && <p className="text-danger">No se pudo cargar la ficha.</p>}
        {conversationId && status === 'ready' && (
          <>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-ink/60">Cuenta</dt>
                <dd className="text-ink">
                  {visitor?.cliente_id ? (
                    <span className="rounded-full bg-available-050 px-2 py-0.5 text-xs font-semibold text-available">
                      Cliente registrado
                    </span>
                  ) : (
                    <span className="text-ink/70">Visitante sin cuenta</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink/60">Identificador</dt>
                <dd className="font-mono text-xs text-ink">{visitor ? shortId(visitor.id) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/60">Nombre</dt>
                <dd className="text-ink">{visitor?.nombre?.trim() ? visitorDisplayName(visitor) : 'No facilitado'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/60">Teléfono</dt>
                <dd className="text-ink">
                  {visitor?.telefono ? (
                    <a href={`tel:${visitor.telefono}`} className="hover:underline">
                      {visitor.telefono}
                    </a>
                  ) : (
                    'No facilitado'
                  )}
                </dd>
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
                      {formatRelative(c.ultimo_mensaje_at ?? c.created_at)} · {c.estado}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!visitor?.cliente_id && (
              <p className="mt-6 text-xs text-ink/50">
                Este visitante escribió sin iniciar sesión, así que solo sabemos lo que él mismo haya contado.
              </p>
            )}
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

  const decide = async (cliente: DbCustomer, estado: 'aprobado' | 'rechazado') => {
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
          Solicitudes pendientes de revisar. La validación es manual: abre el justificante, comprueba que corresponde y
          decide.
        </p>

        {status === 'loading' && <p className="mt-6 text-sm text-ink/60">Cargando…</p>}
        {status === 'error' && <p className="mt-6 text-sm text-danger">No se pudieron cargar las solicitudes.</p>}
        {status === 'ready' && requests.length === 0 && (
          <p className="mt-6 rounded-[12px] border border-line bg-surface p-4 text-sm text-ink/60">
            No hay solicitudes pendientes.
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {requests.map((cliente) => (
            <li key={cliente.id} className="rounded-[16px] border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{cliente.nombre || 'Sin nombre'}</p>
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
                  onChange={(e) => setNotes((prev) => ({ ...prev, [cliente.id]: e.target.value }))}
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
      <div className="w-full min-w-0 max-w-lg space-y-3 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Panel de agentes</h1>
        <p className="text-sm text-ink/70">
          Este panel requiere Supabase configurado. Añade las variables
          <code className="mx-1 break-all rounded bg-neutral px-1 text-xs">VITE_SUPABASE_URL</code>y
          <code className="mx-1 break-all rounded bg-neutral px-1 text-xs">VITE_SUPABASE_ANON_KEY</code>
          en un archivo <code className="break-all rounded bg-neutral px-1 text-xs">.env.local</code>y reinicia el
          servidor de desarrollo.
        </p>
        <p className="text-sm text-ink/70">
          El script SQL para crear las tablas está en
          <code className="ml-1 rounded bg-neutral px-1 text-xs">supabase/schema.sql</code>.
        </p>
      </div>
    </div>
  )
}
