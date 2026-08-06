import { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AgentMessageComposer, ConversationActions } from '../../src/pages/AgentPage'

const AGENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function Fixture() {
  const params = new URLSearchParams(window.location.search)
  const rol = params.get('rol') === 'supervisor' ? 'supervisor' : 'agente'
  const owner = params.get('owner') ?? 'other'
  const [assignedTo, setAssignedTo] = useState<string | null>(
    owner === 'mine' ? AGENT_ID : owner === 'free' ? null : OTHER_ID,
  )
  const [estado, setEstado] = useState<'abierta' | 'cerrada'>(
    params.get('estado') === 'cerrada' ? 'cerrada' : 'abierta',
  )
  const [lastOperation, setLastOperation] = useState('ninguna')
  const [sentMessages, setSentMessages] = useState<string[]>([])
  const failuresLeft = useRef(params.get('failure') ? 1 : 0)

  const fail = async (operation: 'assign' | 'state' | 'send') => {
    await new Promise((resolve) => window.setTimeout(resolve, 40))
    if (params.get('failure') !== operation || failuresLeft.current === 0) return null
    failuresLeft.current -= 1
    if (params.get('throw') === '1') throw new Error(`Excepción al ${operation}`)
    return `Servidor rechazó ${operation}`
  }

  return (
    <main>
      <h1>Conversación de prueba</h1>
      <p data-testid="state">
        {estado} · {assignedTo ?? 'libre'}
      </p>
      <p data-testid="last-operation">{lastOperation}</p>
      <ConversationActions
        conversationId="cccccccc-cccc-4ccc-8ccc-cccccccccccc"
        estado={estado}
        assignedTo={assignedTo}
        agent={{ id: AGENT_ID, rol }}
        operations={{
          assign: async (_conversationId, agentId) => {
            const error = await fail('assign')
            if (!error) setAssignedTo(agentId)
            return { error }
          },
          changeState: async (_conversationId, next) => {
            const error = await fail('state')
            if (!error) setEstado(next)
            return { error }
          },
        }}
        onSuccess={setLastOperation}
      />
      <AgentMessageComposer
        canReply
        takenByOther={false}
        sendMessage={async (text) => {
          const error = await fail('send')
          if (!error) setSentMessages((current) => [...current, text])
          return { error }
        }}
      />
      <p data-testid="sent-count">{sentMessages.length}</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
