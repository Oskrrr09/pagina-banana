import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import { CheckoutProvider } from './lib/checkoutState'
import { StorePreferenceProvider } from './lib/storePreference'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <StoreProvider>
        <StorePreferenceProvider>
          <CheckoutProvider>
            <App />
          </CheckoutProvider>
        </StorePreferenceProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
)
