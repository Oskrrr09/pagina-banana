import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useStore } from '../../lib/store'
import { useCustomerAuth } from '../../lib/customerAuth'
import { MobileMenu } from './MobileMenu'

/**
 * Barra de navegación inferior de la aplicación nativa.
 *
 * Solo se monta dentro del binario (ver `src/lib/nativeApp.ts`). Quien
 * descarga una app de una tienda espera el pulgar en la parte de abajo y las
 * secciones principales siempre a la vista; una cabecera con mega-menú, que
 * es lo correcto en la web, dentro de una app se nota prestada.
 *
 * Cinco destinos, que es el máximo razonable a lo ancho de un móvil.
 * "Explorar" no es una ruta: es el menú de categorías, que en la web abre el
 * botón de hamburguesa de la cabecera. Dentro de la app esa cabecera no
 * existe (ver `AppTopBar`), así que el menú entra por aquí.
 */

export function AppTabBar() {
  const { cartCount, favorites } = useStore()
  const { session } = useCustomerAuth()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const cuentaTo = session ? '/cuenta' : '/login'

  function esActiva(to: string): boolean {
    if (to === '/') return pathname === '/'
    if (to === '/cuenta' || to === '/login') {
      return pathname.startsWith('/cuenta') || pathname.startsWith('/login')
    }
    return pathname.startsWith(to)
  }

  return (
    <>
      <nav
        aria-label="Navegación principal"
        data-app-tab-bar
        // `env(safe-area-inset-bottom)` deja sitio al indicador de inicio del
        // iPhone y a la barra de gestos de Android. En un navegador normal
        // vale cero, así que no estorba.
        //
        // No es `fixed`: es el último hermano de la columna que ocupa la
        // pantalla. Ver el comentario de `AppTopBar`.
        // La altura sale de la constante, no de la suma de sus paddings: así
        // el hueco que dejan otros elementos y lo que la barra ocupa de verdad
        // son el mismo número por construcción.
        style={{ minHeight: ALTURA_TAB_BAR }}
        className="z-50 shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-lg items-stretch">
          <Tab to="/" icon="home" label="Inicio" activa={esActiva('/')} />
          <Tab
            to="/favoritos"
            icon="heart"
            label="Favoritos"
            count={favorites.length}
            activa={esActiva('/favoritos')}
          />
          <Tab
            icon="menu"
            label="Explorar"
            activa={menuOpen}
            botonRef={menuButtonRef}
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          />
          <Tab to="/carrito" icon="cart" label="Carrito" count={cartCount} activa={esActiva('/carrito')} />
          <Tab to={cuentaTo} icon="user" label="Cuenta" activa={esActiva(cuentaTo)} />
        </ul>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} returnFocusRef={menuButtonRef} />
    </>
  )
}

/**
 * Una pestaña. Es un enlace cuando lleva a una ruta y un botón cuando abre
 * algo —"Explorar" abre el menú—, porque un enlace que no navega miente al
 * lector de pantalla y al menú contextual del navegador.
 */
function Tab({
  to,
  icon,
  label,
  count,
  activa,
  onClick,
  botonRef,
  ...aria
}: {
  to?: string
  icon: string
  label: string
  count?: number
  activa: boolean
  onClick?: () => void
  botonRef?: React.RefObject<HTMLButtonElement>
  'aria-expanded'?: boolean
  'aria-haspopup'?: 'dialog'
}) {
  const etiqueta = count && count > 0 ? `${label} (${count})` : label

  const contenido = (
    <>
      <span
        className={`relative grid h-7 w-12 place-items-center rounded-full transition-colors ${
          activa ? 'bg-brand text-ink' : 'text-muted'
        }`}
      >
        <Icon name={icon} size={20} aria-hidden="true" />
        {count !== undefined && count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white"
          >
            {count}
          </span>
        )}
      </span>
      <span className={`text-[11px] leading-tight ${activa ? 'font-bold text-ink' : 'font-medium text-muted'}`}>
        {label}
      </span>
    </>
  )

  const clases = 'flex w-full flex-col items-center gap-0.5 px-1 pb-1.5 pt-2'

  return (
    <li className="flex-1">
      {to ? (
        <Link to={to} aria-current={activa ? 'page' : undefined} aria-label={etiqueta} className={clases}>
          {contenido}
        </Link>
      ) : (
        <button ref={botonRef} type="button" onClick={onClick} aria-label={etiqueta} className={clases} {...aria}>
          {contenido}
        </button>
      )}
    </li>
  )
}

/**
 * Altura que ocupa la barra, área segura del dispositivo incluida.
 *
 * Es la ÚNICA fuente: la propia barra se dimensiona con ella —ver el
 * `minHeight` de su `<nav>`— y quien tenga que apartarse por abajo la usa
 * también. Antes este valor era un literal escrito aparte que se parecía a la
 * altura real por casualidad: la barra medía 58,75 px por sus paddings y su
 * icono, y la constante decía 64. Nada fallaba a la vista, pero cualquier
 * cambio de padding habría separado las dos cifras sin que nadie se enterara.
 */
export const ALTURA_TAB_BAR = 'calc(4rem + env(safe-area-inset-bottom))'
