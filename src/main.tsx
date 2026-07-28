import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import { CheckoutProvider } from './lib/checkoutState'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <StoreProvider>
        <CheckoutProvider>
          <App />
        </CheckoutProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
)
