import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CustomerAuthContext, type CustomerAuthState } from '../../src/lib/customerAuth'
import { IdiomaProvider } from '../../src/lib/i18n'
import { StoreProvider } from '../../src/lib/store'
import { StorePreferenceProvider } from '../../src/lib/storePreference'
import { ProfilePage } from '../../src/pages/ProfilePage'

// Fixture de la pantalla `/cuenta`, montando el **ProfilePage de verdad**.
//
// Lo que se prueba es el comportamiento nuevo al cerrar sesión: que espere la
// confirmación de Supabase antes de navegar, que avise si falla y que no
// aparente haber cerrado una sesión que sigue abierta.
//
// Montar `CustomerAuthProvider` exigiría un Supabase y una cuenta reales. En su
// lugar se inyecta el contexto directamente y se decide desde la URL qué
// devuelve `signOut()`. Nada de la lógica de la página se reproduce aquí: la
// página es la de producción, sin tocar.
//
//   ?resultado=ok        cierra bien
//   ?resultado=error     Supabase devuelve error
//   ?resultado=pendiente nunca resuelve, para ver el estado intermedio

const SESION_FALSA = {
  user: {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    email: 'elena@example.test',
    is_anonymous: false,
  },
} as unknown as Session

function Fixture() {
  const params = new URLSearchParams(window.location.search)
  const resultado = params.get('resultado') ?? 'ok'
  // `?apartado=` se reenvía a la ruta montada para poder probar el enlace
  // profundo de `/cuenta?apartado=pedidos` sin levantar Supabase.
  const apartado = params.get('apartado')
  const entradaInicial = apartado ? `/cuenta?apartado=${encodeURIComponent(apartado)}` : '/cuenta'
  const [cerrada, setCerrada] = useState(false)

  const valor = useMemo<CustomerAuthState>(
    () => ({
      session: cerrada ? null : SESION_FALSA,
      cliente: cerrada
        ? null
        : ({
            id: SESION_FALSA.user.id,
            email: 'elena@example.test',
            nombre: 'Elena R.',
          } as CustomerAuthState['cliente']),
      loading: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null, needsEmailConfirmation: false }),
      signOut: async () => {
        if (resultado === 'pendiente') {
          // Se queda colgada a propósito: así puede observarse el estado
          // mientras el cierre está en curso.
          await new Promise(() => {})
          return { error: null }
        }
        if (resultado === 'error') {
          return { error: 'Network request failed' }
        }
        // Como en Supabase: la sesión desaparece al confirmarse el cierre.
        setCerrada(true)
        return { error: null }
      },
      updateProfile: async () => ({ error: null }),
      refresh: async () => {},
    }),
    [cerrada, resultado],
  )

  return (
    <MemoryRouter initialEntries={[entradaInicial]}>
      <IdiomaProvider>
        <StoreProvider>
          <StorePreferenceProvider>
            <CustomerAuthContext.Provider value={valor}>
              <Sonda />
              <Routes>
                <Route path="/cuenta" element={<ProfilePage />} />
                {/* Los apartados tienen ruta propia desde la navegación
                    nativa. Sin ella la traducción de `?apartado=` no tendría a
                    dónde ir y el fixture mediría otra cosa que la aplicación. */}
                <Route path="/cuenta/:apartado" element={<ProfilePage />} />
                <Route path="/" element={<h1>Portada</h1>} />
                <Route path="/login" element={<h1>Acceso</h1>} />
              </Routes>
            </CustomerAuthContext.Provider>
          </StorePreferenceProvider>
        </StoreProvider>
      </IdiomaProvider>
    </MemoryRouter>
  )
}

/** Enseña la ruta actual y permite volver atrás, para comprobar `replace`. */
function Sonda() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  return (
    <div>
      <p data-testid="ruta">{pathname + search}</p>
      <button type="button" onClick={() => navigate(-1)}>
        Volver atrás
      </button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
