import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { CheckoutLayout } from './components/layout/CheckoutLayout'
import { ChatBubble } from './components/layout/ChatBubble'
import { Home } from './pages/Home'
import { FamilyPage } from './pages/FamilyPage'
import { ModelPage } from './pages/ModelPage'
import { VariantPage } from './pages/VariantPage'
import { SearchPage } from './pages/SearchPage'
import { ComparePage } from './pages/ComparePage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ServicesPage } from './pages/ServicesPage'
import { PlanRenovePage } from './pages/PlanRenovePage'
import { StoresPage } from './pages/StoresPage'
import { StoreDetailPage } from './pages/StoreDetailPage'
import { SupportPage } from './pages/SupportPage'
import { ServiceTechnicalPage } from './pages/ServiceTechnicalPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { AppleFinderPage } from './pages/AppleFinderPage'
import { AccessoriesPage } from './pages/AccessoriesPage'
import { AccessoryDetailPage } from './pages/AccessoryDetailPage'
import { AgentPage } from './pages/AgentPage'
import { AgentLoginPage } from './pages/AgentLoginPage'
import { AgentAppScope } from './components/agent/AgentAppScope'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFound } from './pages/NotFound'

// Rutas del apartado 9.1.
export function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          {/* Rutas estáticas antes de las dinámicas `/:family` para evitar
              que "accesorios" caiga en FamilyPage. */}
          <Route path="/accesorios" element={<AccessoriesPage />} />
          <Route path="/accesorios/:slug" element={<AccessoryDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/cuenta" element={<ProfilePage />} />
          <Route path="/:family" element={<FamilyPage />} />
          <Route path="/:family/:model" element={<ModelPage />} />
          <Route path="/:family/:model/:variant" element={<VariantPage />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/comparar" element={<ComparePage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/plan-renove" element={<PlanRenovePage />} />
          <Route path="/tiendas" element={<StoresPage />} />
          <Route path="/tiendas/:slug" element={<StoreDetailPage />} />
          <Route path="/soporte" element={<SupportPage />} />
          <Route path="/servicio-tecnico" element={<ServiceTechnicalPage />} />
          <Route path="/favoritos" element={<FavoritesPage />} />
          <Route path="/elige-tu-apple" element={<AppleFinderPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<CheckoutLayout />}>
          <Route path="/checkout/:step" element={<CheckoutPage />} />
        </Route>
        {/* Panel interno para agentes de tienda. Sin Layout público
            porque tiene su propia cabecera/estructura full-screen.
            AgentAppScope solo declara la identidad de app instalable; no
            pinta nada. */}
        <Route element={<AgentAppScope />}>
          <Route path="/agente" element={<AgentPage />} />
          <Route path="/agente/login" element={<AgentLoginPage />} />
        </Route>
      </Routes>
      <ChatBubble />
    </>
  )
}
