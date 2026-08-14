import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { isNativeApp } from './lib/nativeApp'
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
import { MyProductsPage } from './pages/MyProductsPage'
import { StorePage } from './pages/StorePage'
import { NotFound } from './pages/NotFound'

// Rutas del apartado 9.1.
export function App() {
  // Fin del arranque nativo.
  //
  // `index.html` marca el documento con `data-native-boot` para que nazca en
  // amarillo y no se vea un fotograma blanco antes de la cabecera. En cuanto
  // React monta, el marcador sobra: a partir de aquí el fondo de cada pantalla
  // lo decide la propia pantalla, y dejarlo puesto teñiría de amarillo lo que
  // hay debajo de Cuenta, Mis compras o el checkout.
  //
  // Va en `App` y no en `Layout` porque el checkout monta `CheckoutLayout`, y
  // el marcador tiene que retirarse igual. `useEffect` y no `useLayoutEffect`:
  // se quita después de que el primer árbol haya tenido ocasión de pintarse.
  // Y con él se retira la pantalla de arranque nativa, que se configura sin
  // ocultado automático (`launchAutoHide: false`). Van juntas a propósito: la
  // nativa cubre desde que se abre la app hasta que el documento pinta, y el
  // marcador cubre desde ahí hasta que React monta. Retirarlas en el mismo
  // punto es lo que hace que el logotipo no parpadee entre una y otra.
  //
  // Se espera a un fotograma: `useEffect` corre tras el commit, pero el
  // navegador todavía no ha pintado. Sin esto, la pantalla se va un instante
  // antes de que haya Home debajo.
  // El plugin se carga en diferido y SÓLO dentro del binario. Importarlo
  // arriba mete `@capacitor/core` en el bundle de la web, y ese módulo define
  // `window.Capacitor` en el navegador: con eso, `registerServiceWorker` se
  // rinde —cree estar en la app— y la web se queda sin service worker.
  // Medido: tres pruebas de `pwa.spec.ts` en rojo. `isNativeApp` mira esa
  // misma variable, así que el estropicio no acababa ahí.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.documentElement.removeAttribute('data-native-boot')
      if (!isNativeApp) return
      void import('@capacitor/splash-screen').then(({ SplashScreen }) => SplashScreen.hide())
    })
    return () => cancelAnimationFrame(frame)
  }, [])

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
          <Route path="/mis-productos" element={<MyProductsPage />} />
          <Route path="/tienda" element={<StorePage />} />
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
