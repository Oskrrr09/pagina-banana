import '../../src/index.css'

import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { IdiomaProvider } from '../../src/lib/i18n'
import { StoreStatus } from '../../src/components/store/StoreStatus'
import type { Store } from '../../src/data/types'

// Fixture del distintivo de estado de una tienda.
//
// Sirve para comprobar que se actualiza SOLO al cruzar un umbral, con la
// pantalla abierta y sin desmontar el componente. El reloj lo controla la
// prueba con `page.clock`; aquí no hay nada que lo simule.
//
// La tienda es de mentira y con horario fijo: lo que se prueba es el paso del
// tiempo, no el catálogo real, que cambiaría el resultado según el día.

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const

const TIENDA = {
  slug: 'prueba',
  name: 'Banana Prueba',
  hours: [
    ...DIAS.map((day) => ({ day, time: '10:00–20:00' })),
    { day: 'Sábado', time: '10:00–14:00' },
    { day: 'Domingo', time: 'Cerrado' },
  ],
} as unknown as Store

function Fixture() {
  return (
    <MemoryRouter initialEntries={['/tiendas']}>
      <IdiomaProvider>
        <div style={{ padding: 16 }}>
          <StoreStatus store={TIENDA} />
        </div>
      </IdiomaProvider>
    </MemoryRouter>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
