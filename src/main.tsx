import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import { CheckoutProvider } from './lib/checkoutState'
import { StorePreferenceProvider } from './lib/storePreference'
import { FavoriteAlertsProvider } from './lib/favoriteAlerts'
import { CustomerAuthProvider } from './lib/customerAuth'
import { AgentAuthProvider } from './lib/agentAuth'
import { App } from './App'
import { registerServiceWorker } from './lib/pwa'
import './index.css'

// Service worker: da el arranque sin conexión que necesita el panel de
// agentes instalado como app. Solo se registra en producción.
registerServiceWorker()

// Los dos proveedores de sesión van lo más arriba posible: el Header, el
// checkout y el panel /agente los necesitan, y esas rutas usan layouts
// distintos (o ninguno), así que no valdría montarlos dentro de Layout.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CustomerAuthProvider>
        <AgentAuthProvider>
          <StoreProvider>
            <StorePreferenceProvider>
              <FavoriteAlertsProvider>
                <CheckoutProvider>
                  <App />
                </CheckoutProvider>
              </FavoriteAlertsProvider>
            </StorePreferenceProvider>
          </StoreProvider>
        </AgentAuthProvider>
      </CustomerAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
