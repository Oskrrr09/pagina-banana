import '../../src/index.css'

import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PanelConversaciones } from '../../src/pages/AgentPage'

// Fixture de la COMPOSICIÓN del panel de agentes.
//
// Monta `PanelConversaciones` con contenidos de mentira: lo que se prueba es el
// reparto del espacio —el divisor, sus límites y la rama móvil—, no la bandeja
// real, que necesitaría Supabase y una cuenta de agente.
//
// Trae hoja de estilos y `<meta viewport>` porque aquí se mide encaje, y sin
// ellos las medidas no valen.

function Fixture() {
  const [seleccion, setSeleccion] = useState<string | null>(null)

  return (
    <div className="flex h-screen flex-col">
      <PanelConversaciones
        selectedId={seleccion}
        onVolver={() => setSeleccion(null)}
        lista={
          <div data-falsa-lista className="flex-1 overflow-y-auto bg-surface p-3">
            <button type="button" onClick={() => setSeleccion('c1')} className="w-full p-2 text-left">
              Conversación de prueba
            </button>
          </div>
        }
        conversacion={
          <div data-falsa-conversacion className="min-w-0 flex-1 bg-neutral p-3">
            Conversación
          </div>
        }
        visitante={null}
      />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
