// Los estilos de verdad. Los demás fixtures montan sin CSS —les basta para
// comprobar comportamiento—, pero aquí lo que se mide es el encaje, y sin hoja
// de estilos no hay encaje que medir.
import '../../src/index.css'

import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CustomerAuthContext, type CustomerAuthState } from '../../src/lib/customerAuth'
import { IdiomaProvider } from '../../src/lib/i18n'
import { StoreProvider } from '../../src/lib/store'
import { StorePreferenceProvider } from '../../src/lib/storePreference'
import { ProfilePage } from '../../src/pages/ProfilePage'

// Fixture de ENCAJE de `/cuenta`.
//
// Existe aparte de `cuenta-fixture` porque son dos preguntas distintas: aquel
// comprueba comportamiento —el cierre de sesión, el apartado inicial— y este,
// que la pantalla quepa. Para lo segundo hacen falta dos cosas que aquel no
// tiene: la hoja de estilos y el `<meta viewport>`.
//
// Sin ellas, medir daba 0 px de desbordamiento con el fallo delante: se
// renderizaba sin estilos y a 980 px de ancho.

const SESION_FALSA = {
  user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'elena@example.test', is_anonymous: false },
} as unknown as Session

function Fixture() {
  const valor = useMemo<CustomerAuthState>(
    () => ({
      session: SESION_FALSA,
      cliente: {
        id: SESION_FALSA.user.id,
        email: 'elena@example.test',
        nombre: 'Elena Ramos',
        telefono: '600123456',
      } as CustomerAuthState['cliente'],
      loading: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null, needsEmailConfirmation: false }),
      signOut: async () => ({ error: null }),
      updateProfile: async () => ({ error: null }),
      refresh: async () => {},
    }),
    [],
  )

  return (
    <MemoryRouter initialEntries={['/cuenta']}>
      <IdiomaProvider>
        <StoreProvider>
          <StorePreferenceProvider>
            <CustomerAuthContext.Provider value={valor}>
              <Routes>
                <Route path="/cuenta" element={<ProfilePage />} />
                <Route path="*" element={<p>fuera del fixture</p>} />
              </Routes>
            </CustomerAuthContext.Provider>
          </StorePreferenceProvider>
        </StoreProvider>
      </IdiomaProvider>
    </MemoryRouter>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
