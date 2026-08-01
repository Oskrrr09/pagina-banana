import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { FavoriteStoreDialogs } from './FavoriteStoreDialogs'
import { ALTURA_TAB_BAR, AppTabBar } from './AppTabBar'
import { isNativeApp } from '../../lib/nativeApp'

// Layout general. Al cambiar de ruta, sube al inicio (salvo anclas #).
export function Layout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[8px] focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
      >
        Saltar al contenido
      </a>
      <Header />
      <main
        id="contenido"
        // Enfocable por código, fuera del recorrido de Tab: es el destino del
        // enlace "Saltar al contenido" y el sitio al que vuelve el foco
        // cuando se cierra el chat de la app y no queda un origen al que
        // regresar.
        tabIndex={-1}
        className="flex-1 outline-none"
        // En la app, el contenido termina por encima de la barra inferior.
        style={isNativeApp ? { paddingBottom: ALTURA_TAB_BAR } : undefined}
      >
        <Outlet />
      </main>
      {/* El pie de página es un mapa del sitio: en la web orienta, pero
          dentro de una app, donde la navegación vive abajo en la barra,
          sobra y alarga cada pantalla. */}
      {isNativeApp ? <AppTabBar /> : <Footer />}
      <FavoriteStoreDialogs />
    </div>
  )
}
