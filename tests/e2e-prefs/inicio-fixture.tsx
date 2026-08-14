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
import type { DbReservation } from '../../src/lib/supabase'

// Fixture de la Inicio nativa **con sesión**, junto a la cuenta de verdad.
//
// Sirve para lo que la suite E2E no puede: allí no hay Supabase, así que no hay
// sesión, y lo que dependa de ella no llega a pintarse. Aquí se inyecta el
// contexto y se montan las dos pantallas en el mismo router.
//
// La ruta inicial se toma del `hash` para poder entrar directamente en un
// apartado de la cuenta. Hizo falta cuando Inicio dejó de repetir los accesos
// que ya están en la barra inferior: el recorrido «pulsar en Inicio» dejó de
// existir, pero **la ruta sigue teniendo que abrir el apartado que promete**, y
// eso es lo que se conserva.
//
// Y las reservas se inyectan por la prop `listarReservas`, que en producción
// vale `listMyReservations`. Es la única forma de enseñar el aviso «Tu reserva
// está lista» sin Supabase; interceptar la red probaría una API imaginaria en
// vez de esta pantalla. Sólo se inyectan con `?reservas=1` para que el resto de
// casos siga viendo la Inicio de siempre.

const SESION_FALSA = {
  user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'elena@example.test', is_anonymous: false },
} as unknown as Session

/**
 * Dos reservas del mismo cliente, deliberadamente distintas: sólo una está
 * `disponible`, y la otra sirve para demostrar que un aviso no se fabrica con
 * cualquier reserva.
 */
const RESERVAS = [
  {
    id: 'r-disponible',
    created_at: '2026-08-01T10:00:00Z',
    cliente_id: SESION_FALSA.user.id,
    family: 'iphone',
    model_slug: '17-pro',
    variant_label: '256 GB · Titanio natural',
    model_name: 'iPhone 17 Pro',
    price: 1229,
    pagado_at: '2026-08-01T10:00:00Z',
    estado: 'disponible',
  },
  {
    id: 'r-en-espera',
    created_at: '2026-08-02T10:00:00Z',
    cliente_id: SESION_FALSA.user.id,
    family: 'mac',
    model_slug: 'macbook-air-m5',
    variant_label: '15" · 512 GB · Azul cielo',
    model_name: 'MacBook Air M5',
    price: 1579,
    pagado_at: '2026-08-02T10:00:00Z',
    estado: 'en-espera',
  },
] as DbReservation[]

async function reservasControladas() {
  return { items: RESERVAS.map((reservation) => ({ reservation, position: null })), error: null }
}

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
    <MemoryRouter initialEntries={[window.location.hash.slice(1) || '/']}>
      <IdiomaProvider>
        <StoreProvider>
          <StorePreferenceProvider>
            <CustomerAuthContext.Provider value={valor}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <AppCustomerHome
                      listarReservas={
                        new URLSearchParams(window.location.search).get('reservas') === '1'
                          ? reservasControladas
                          : undefined
                      }
                    />
                  }
                />
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
