import { createRoot } from 'react-dom/client'
import { StorePreferenceProvider, useStorePreference } from '../../src/lib/storePreference'
import { FavoriteAlertsProvider, useFavoriteAlerts } from '../../src/lib/favoriteAlerts'
import { notificarCierreSesionCliente } from '../../src/lib/accountSession'

// Fixture aislado de los proveedores de preferencias de cuenta.
//
// Monta `StorePreferenceProvider` y `FavoriteAlertsProvider` de verdad, en un
// navegador de verdad y con el `localStorage` de verdad. Lo que NO monta es
// `CustomerAuthProvider`: iniciar sesión exige Supabase, y la suite E2E corre
// siempre en modo demostración. Se dispara el mismo aviso interno que emite
// `signOut()`, que es la costura exacta que se quiere probar.
//
// El botón de «cerrar sesión» también deja una marca al terminar: así la
// prueba puede comprobar que el cierre no se queda bloqueado cuando
// `localStorage` lanza.

const PRODUCTO = 'iphone/17-pro'
const TIENDA = 'triana'

function Panel() {
  const tienda = useStorePreference()
  const avisos = useFavoriteAlerts()

  return (
    <main>
      <h1>Preferencias de cuenta</h1>

      <p data-testid="favorite-slug">{tienda.favoriteSlug ?? 'ninguna'}</p>
      <p data-testid="prompt-dismissed">{tienda.promptDismissed ? 'si' : 'no'}</p>
      <p data-testid="alerts-count">{avisos.alerts.length}</p>
      <p data-testid="notifications-count">{avisos.notifications.length}</p>
      <p data-testid="unread-count">{avisos.unreadCount}</p>

      <button type="button" onClick={() => tienda.setFavorite(TIENDA)}>
        Elegir tienda favorita
      </button>
      <button type="button" onClick={() => avisos.setAlert(PRODUCTO, TIENDA)}>
        Activar aviso
      </button>
      <button type="button" onClick={() => avisos.simulateArrival(PRODUCTO, 'iPhone 17 Pro')}>
        Simular llegada
      </button>

      <button
        type="button"
        onClick={() => {
          // Lo mismo que hace `customerAuth.signOut()` tras cerrar la sesión
          // en Supabase.
          notificarCierreSesionCliente()
          document.body.setAttribute('data-cierre', 'completado')
        }}
      >
        Cerrar sesión
      </button>

      <button
        type="button"
        onClick={() => {
          // Reproduce un `localStorage` que rechaza los borrados: modo privado,
          // cuota agotada o permisos denegados.
          window.localStorage.removeItem = () => {
            throw new Error('localStorage no disponible')
          }
          document.body.setAttribute('data-storage', 'roto')
        }}
      >
        Romper almacenamiento
      </button>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StorePreferenceProvider>
    <FavoriteAlertsProvider>
      <Panel />
    </FavoriteAlertsProvider>
  </StorePreferenceProvider>,
)
