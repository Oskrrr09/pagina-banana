import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CustomerAuthContext, type CustomerAuthState } from '../../src/lib/customerAuth'
import { IdiomaProvider } from '../../src/lib/i18n'
import { MyProductsPage } from '../../src/pages/MyProductsPage'

// Fixture de `/mis-productos`, montando la **pantalla de verdad**.
//
// Los pedidos no se inyectan aquí: la página los pide con `listMyOrders`, y la
// prueba intercepta esa llamada con `page.route`. Así se recorre también el
// camino de carga real —petición, error, lista vacía— en vez de saltárselo.
//
//   ?sesion=no   sin sesión, para comprobar el guardia de autenticación

const SESION_FALSA = {
  user: {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    email: 'elena@example.test',
    is_anonymous: false,
  },
} as unknown as Session

function Ruta() {
  const { pathname, search } = useLocation()
  return <span data-testid="ruta">{pathname + search}</span>
}

function Fixture() {
  const params = new URLSearchParams(window.location.search)
  const conSesion = params.get('sesion') !== 'no'

  const valor = useMemo<CustomerAuthState>(
    () => ({
      session: conSesion ? SESION_FALSA : null,
      cliente: null,
      loading: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null, needsEmailConfirmation: false }),
      signOut: async () => ({ error: null }),
      updateProfile: async () => ({ error: null }),
      refresh: async () => {},
    }),
    [conSesion],
  )

  return (
    <CustomerAuthContext.Provider value={valor}>
      {/* `IdiomaProvider` lee la ruta para decidir el idioma, así que va
          DENTRO del router y no al revés. */}
      <MemoryRouter initialEntries={['/mis-productos']}>
        <IdiomaProvider>
          <Ruta />
          <Routes>
            <Route path="/mis-productos" element={<MyProductsPage />} />
            <Route path="*" element={<p>fuera de la pantalla</p>} />
          </Routes>
        </IdiomaProvider>
      </MemoryRouter>
    </CustomerAuthContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
