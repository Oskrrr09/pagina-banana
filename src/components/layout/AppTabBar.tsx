import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useStore } from '../../lib/store'
import { useCustomerAuth } from '../../lib/customerAuth'

/**
 * Barra de navegación inferior de la aplicación nativa.
 *
 * Solo se monta dentro del binario (ver `src/lib/nativeApp.ts`). Quien
 * descarga una app de una tienda espera el pulgar en la parte de abajo y las
 * secciones principales siempre a la vista; una cabecera con mega-menú, que
 * es lo correcto en la web, dentro de una app se nota prestada.
 *
 * Cinco destinos, que es el máximo razonable a lo ancho de un móvil: las
 * secciones a las que se vuelve una y otra vez. El resto del catálogo sigue
 * llegándose por el menú de la cabecera y por la búsqueda.
 */

interface Tab {
  to: string
  icon: string
  label: string
  /** Cuenta que se pinta sobre el icono. */
  count?: number
}

export function AppTabBar() {
  const { cartCount, favorites } = useStore()
  const { session } = useCustomerAuth()
  const { pathname } = useLocation()

  const tabs: Tab[] = [
    { to: '/', icon: 'home', label: 'Inicio' },
    { to: '/buscar', icon: 'search', label: 'Buscar' },
    { to: '/favoritos', icon: 'heart', label: 'Favoritos', count: favorites.length },
    { to: '/carrito', icon: 'cart', label: 'Carrito', count: cartCount },
    // Sin sesión lleva al login; el destino cambia pero la pestaña es la
    // misma, así que se marca activa en ambas rutas.
    { to: session ? '/cuenta' : '/login', icon: 'user', label: 'Cuenta' },
  ]

  function esActiva(to: string): boolean {
    if (to === '/') return pathname === '/'
    if (to === '/cuenta' || to === '/login') {
      return pathname.startsWith('/cuenta') || pathname.startsWith('/login')
    }
    return pathname.startsWith(to)
  }

  return (
    <nav
      aria-label="Navegación principal"
      data-app-tab-bar
      // `env(safe-area-inset-bottom)` deja sitio al indicador de inicio del
      // iPhone y a la barra de gestos de Android. En un navegador normal vale
      // cero, así que no estorba.
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {tabs.map((tab) => {
          const activa = esActiva(tab.to)
          return (
            <li key={tab.label} className="flex-1">
              <Link
                to={tab.to}
                aria-current={activa ? 'page' : undefined}
                aria-label={
                  tab.count && tab.count > 0 ? `${tab.label} (${tab.count})` : tab.label
                }
                className="flex flex-col items-center gap-0.5 px-1 pb-1.5 pt-2"
              >
                <span
                  className={`relative grid h-7 w-12 place-items-center rounded-full transition-colors ${
                    activa ? 'bg-brand text-ink' : 'text-muted'
                  }`}
                >
                  <Icon name={tab.icon} size={20} aria-hidden="true" />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white"
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] leading-tight ${
                    activa ? 'font-bold text-ink' : 'font-medium text-muted'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Altura que la barra ocupa por abajo, para que el contenido y los elementos
 * flotantes no queden debajo. Se expone como clase utilitaria para no repetir
 * el número mágico en cada sitio.
 */
export const ALTURA_TAB_BAR = 'calc(4rem + env(safe-area-inset-bottom))'
