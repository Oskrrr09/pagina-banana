import { useRef, useState, type RefObject } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { familiesNav } from '../../data/nav'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { HeaderSearch } from '../search/HeaderSearch'
import { useStore } from '../../lib/store'
import { useT } from '../../lib/i18n'
import { contextoDe, muestraCarrito, muestraChipsDeCategoria } from '../../lib/appSections'

/**
 * Barra superior de la aplicación nativa.
 *
 * Sustituye por completo a la cabecera de la web: dentro de la app la
 * navegación vive abajo, así que arriba no hace falta ni menú ni mega-menú.
 *
 * DOS VARIANTES, PORQUE SON DOS MUNDOS
 *
 * En **Tienda** manda el buscador: es lo que más se usa para comprar desde el
 * móvil, y ocupa casi todo el ancho. En **Inicio**, **Mis compras** y **Cuenta**
 * ese mismo campo enorme hacía que la pantalla siguiera pareciendo una tienda
 * aunque el contenido fuera del cliente. Ahí la barra se reduce a la marca y a
 * dos botones compactos, y la diferencia se entiende antes de leer nada.
 *
 * Lo que **no** cambia entre las dos: el buscador es el mismo `HeaderSearch`, en
 * el mismo diálogo, con su foco y su Escape; y el carrito es el mismo, con el
 * mismo contador. Sólo cambia el tamaño del botón que los abre.
 *
 * Cuál toca lo decide `contextoDe`, en `lib/appSections.ts`, que es también
 * quien decide la pestaña activa y los chips: una sola fuente para las tres.
 */
export function AppTopBar() {
  const [searchOpen, setSearchOpen] = useState(false)
  // Un único `ref` para el disparador, porque sólo se pinta uno de los dos: así
  // el foco vuelve por construcción al botón que abrió, sea cual sea.
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  const comercial = contextoDe(pathname) === 'comercial'

  return (
    <>
      <header
        // Ni `fixed` ni `sticky`: es el primer hermano de una columna que
        // ocupa la pantalla, y quien se desplaza es el contenido de en medio.
        // En iOS los elementos fijos se recolocan al terminar el gesto, no
        // durante, y por eso parecían despegarse al arrastrar.
        // EL COLOR SEPARA LOS DOS MUNDOS, Y SE QUEDA ASÍ
        //
        // Amarillo Banana en Tienda; claro en Inicio, Mis compras y Cuenta. Es
        // lo que hacía la PR #41 y lo que se conserva tras verlo en el
        // simulador: con las dos variantes en amarillo, la distinción dejaba de
        // ser cromática y se sostenía sólo en la composición —buscador grande y
        // chips frente a marca y dos botones—, que es una señal más débil y que
        // además se pierde al bajar, cuando los chips se esconden.
        //
        // La barra inferior sí es azul en toda la app: ésa no distingue
        // contextos, los enmarca.
        className={`z-40 shrink-0 ${comercial ? 'bg-banana' : 'border-b border-line bg-surface'}`}
        data-app-topbar={comercial ? 'comercial' : 'cliente'}
        // El WebView llega al borde de la pantalla: sin esto la barra queda
        // debajo de la Dynamic Island y del reloj.
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2 px-4 pb-2.5 pt-2.5">
          {comercial ? (
            <BuscadorProminente onOpen={() => setSearchOpen(true)} botonRef={searchButtonRef} />
          ) : (
            <>
              <Logo />
              <span className="flex-1" />
              <BuscadorCompacto onOpen={() => setSearchOpen(true)} botonRef={searchButtonRef} />
            </>
          )}

          {muestraCarrito(pathname) && <BotonCarrito />}
        </div>
      </header>

      {searchOpen && (
        <div
          role="dialog"
          aria-label="Buscar"
          aria-modal="true"
          className="app-safe-area fixed inset-0 z-[85] flex flex-col bg-surface"
        >
          <HeaderSearch mode="mobile" onClose={() => setSearchOpen(false)} restoreFocusTo={searchButtonRef} />
        </div>
      )}
    </>
  )
}

/**
 * El buscador de Tienda: un botón con aspecto de campo.
 *
 * No es un `<input>`: al pulsarlo abre el buscador a pantalla completa que ya
 * usa la web en móvil, con su autocompletado y su navegación por teclado. Así
 * no hay dos motores de búsqueda que mantener.
 */
function BuscadorProminente({ onOpen, botonRef }: { onOpen: () => void; botonRef: RefObject<HTMLButtonElement> }) {
  return (
    <button
      ref={botonRef}
      type="button"
      onClick={onOpen}
      aria-label="Buscar en Banana Computer"
      aria-haspopup="dialog"
      data-app-search="prominente"
      // `min-w-0`: el campo es quien cede el ancho cuando el carrito entra a
      // su lado, no al revés.
      className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface px-4 text-left text-[15px] text-muted shadow-[var(--shadow-rest)]"
    >
      <Icon name="search" size={18} aria-hidden="true" className="shrink-0 text-ink/60" />
      <span className="truncate">Buscar productos, accesorios…</span>
    </button>
  )
}

/** El mismo buscador, reducido a su icono. Abre exactamente el mismo diálogo. */
function BuscadorCompacto({ onOpen, botonRef }: { onOpen: () => void; botonRef: RefObject<HTMLButtonElement> }) {
  return (
    <button
      ref={botonRef}
      type="button"
      onClick={onOpen}
      aria-label="Buscar en Banana Computer"
      aria-haspopup="dialog"
      data-app-search="compacto"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink"
    >
      <Icon name="search" size={22} aria-hidden="true" />
    </button>
  )
}

/** El carrito, idéntico en las dos variantes. */
function BotonCarrito() {
  const { cartCount } = useStore()
  const t = useT()

  return (
    <Link
      to="/carrito"
      data-app-cart
      // 44 px de lado, el mínimo táctil, aunque el icono mida 22.
      aria-label={cartCount > 0 ? t('appnav.cartWithCount', { total: cartCount }) : t('appnav.cart')}
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink"
    >
      <Icon name="cart" size={22} aria-hidden="true" />
      {cartCount > 0 && (
        <span
          aria-hidden="true"
          data-app-cart-badge
          className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white"
        >
          {cartCount}
        </span>
      )}
    </Link>
  )
}

/**
 * Filtros rápidos por categoría.
 *
 * Van DENTRO del contenedor que se desplaza, no en la cabecera: así se
 * esconden bajo la barra de búsqueda al bajar y el amarillo se encoge hasta
 * dejar solo el buscador, que es lo único que conviene tener siempre a mano.
 * Llevan su propio fondo amarillo para que, mientras están a la vista, se lean
 * como continuación de la cabecera.
 *
 * SÓLO EN EL CONTEXTO COMERCIAL
 *
 * Encima de «Mis compras» o de «Cuenta» no aparecen. Son una herramienta para
 * elegir qué comprar, y ahí no ayudan a nada: invitan a irse justo cuando
 * alguien ha entrado a mirar lo suyo. La decisión de qué ruta es comercial no
 * se toma aquí, se consulta en `lib/appSections.ts`.
 */
export function AppCategoryChips() {
  const { pathname } = useLocation()

  if (!muestraChipsDeCategoria(pathname)) return null

  return (
    <nav aria-label="Categorías" data-app-chips className="bg-banana pb-2.5">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4">
        {FILTROS.map((filtro) => {
          const activo = pathname === filtro.to
          return (
            <li key={filtro.to} className="shrink-0">
              <Link
                to={filtro.to}
                aria-current={activo ? 'page' : undefined}
                className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-[13px] font-semibold transition-colors ${
                  activo ? 'bg-ink text-white' : 'bg-white/55 text-ink hover:bg-white/80'
                }`}
              >
                {filtro.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// Las familias reales del catálogo, en el orden del menú. No se inventan
// filtros de "ofertas" o "novedades": no hay detrás ningún dato que los
// sostenga (ver la regla de contenido demostrativo en docs/01-contexto).
const FILTROS: { label: string; to: string }[] = familiesNav.map((familia) => ({
  label: familia.name,
  // Las familias marcadas como demostrativas no tienen catálogo propio y en
  // el resto de la web caen a /iphone; se respeta ese mismo destino.
  to: familia.demo ? '/iphone' : `/${familia.slug}`,
}))
