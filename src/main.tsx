import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { IdiomaProvider } from './lib/i18n'
import { StoreProvider } from './lib/store'
import { CheckoutProvider } from './lib/checkoutState'
import { StorePreferenceProvider } from './lib/storePreference'
import { FavoriteAlertsProvider } from './lib/favoriteAlerts'
import { CustomerAuthProvider } from './lib/customerAuth'
import { AgentAuthProvider } from './lib/agentAuth'
import { App } from './App'
import { registerServiceWorker } from './lib/pwa'
// Tipografías de marca, empaquetadas con la aplicación.
//
// Antes venían de Google Fonts en tiempo de ejecución, y eso metía una
// dependencia externa en cada carga: en el CI post-merge de la PR #50 una de
// esas peticiones devolvió 404 —Manrope, woff2, desde `fonts.gstatic.com`— y
// dejó una prueba en intermitente. Ahora viajan en el bundle: sin red externa,
// sin CDN de terceros y sin sorpresas offline.
//
// Se cargan **exactamente los pesos que pedía el enlace anterior**, ni uno más:
// Inter 400/500/600/700 y Manrope 500/700/800. Añadir o quitar alguno
// cambiaría cómo se ve la aplicación, y eso es otra decisión.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
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
      <IdiomaProvider>
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
      </IdiomaProvider>
    </BrowserRouter>
  </StrictMode>,
)
