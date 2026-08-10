import { createRoot } from 'react-dom/client'
import { AgentAuthProvider } from '../../src/lib/agentAuth'
import { ConversationColumn } from '../../src/pages/AgentPage'
import type { DbConversation } from '../../src/lib/supabase'

// ============================================================================
// `ConversationColumn` con y sin el objeto de la conversación.
//
// ALCANCE, PARA QUE NADIE LE PIDA MÁS DE LO QUE HACE
//
// Aquí NO hay bandeja, ni `useAgentInbox`, ni selección, ni Supabase: sólo la
// columna, con los datos que se le pasan por props. Sirve para fijar qué se
// pinta cuando la conversación **todavía no ha llegado**, que es una ventana
// real —la que hay entre salir de una bandeja y aparecer en la otra— y que
// antes se confundía con «abierta y sin asignar».
//
// El flujo completo de cerrar y reabrir se prueba contra Supabase real en
// `tests/integration/panel-agentes-cierre.spec.ts`, que es donde vivía el bug.
// ============================================================================

const CONVERSACION = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OTRO_AGENTE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

const CERRADA: DbConversation = {
  id: CONVERSACION,
  created_at: '2026-08-10T10:00:00.000Z',
  visitor_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  estado: 'cerrada',
  agente_id: OTRO_AGENTE,
  ultimo_mensaje_at: '2026-08-10T10:05:00.000Z',
  cerrada_at: '2026-08-10T10:06:00.000Z',
  valoracion_solicitada: true,
  valoracion_estrellas: null,
  valoracion_observacion: null,
  valoracion_at: null,
}

function Fixture() {
  const params = new URLSearchParams(window.location.search)
  // `sin-datos` es el caso que protege esta prueba: hay conversación
  // seleccionada, pero su objeto aún no está disponible.
  const conversacion = params.get('caso') === 'sin-datos' ? null : CERRADA

  return (
    <AgentAuthProvider>
      <ConversationColumn conversationId={CONVERSACION} conversation={conversacion} />
    </AgentAuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
