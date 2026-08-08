import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CustomerAuthContext, type CustomerAuthState } from '../../src/lib/customerAuth'
import { IdiomaProvider } from '../../src/lib/i18n'
import { StoreProvider } from '../../src/lib/store'
import { StorePreferenceProvider } from '../../src/lib/storePreference'
import { AppCustomerHome } from '../../src/components/home/app/AppCustomerHome'
import { ProfilePage } from '../../src/pages/ProfilePage'

// Fixture de la Inicio nativa **con sesión**, junto a la cuenta de verdad.
//
// Sirve para lo que la suite E2E no puede: allí no hay Supabase, así que no hay
// sesión, y los accesos que dependen de ella —«Mis pedidos»— no llegan a
// pintarse. Aquí se inyecta el contexto y se montan las dos pantallas en el
// mismo router, de modo que el clic navegue de verdad y se pueda comprobar
// dónde aterriza.

const SESION_FALSA = {
  user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'elena@example.test', is_anonymous: false },
} as unknown as Session

function Fixture() {
  const valor = useMemo<CustomerAuthState>(
    () => ({
      session: SESION_FALSA,
      cliente: { id: SESION_FALSA.user.id, nombre: 'Elena Ramos' } as CustomerAuthState['cliente'],
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
    <MemoryRouter initialEntries={['/']}>
      <IdiomaProvider>
        <StoreProvider>
          <StorePreferenceProvider>
            <CustomerAuthContext.Provider value={valor}>
              <Routes>
                <Route path="/" element={<AppCustomerHome />} />
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
