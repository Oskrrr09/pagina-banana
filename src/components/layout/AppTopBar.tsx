import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { familiesNav } from '../../data/nav'
import { Icon } from '../ui/Icon'
import { HeaderSearch } from '../search/HeaderSearch'

/**
 * Barra superior de la aplicación nativa.
 *
 * Sustituye por completo a la cabecera de la web: dentro de la app la
 * navegación vive abajo, así que arriba no hace falta ni logo ni menú, y ese
 * sitio se aprovecha para lo que más se usa en una tienda desde el móvil —
 * buscar— con unos accesos rápidos por familia debajo.
 *
 * El buscador es un botón con aspecto de campo, no un `<input>`: al pulsarlo
 * abre el mismo buscador a pantalla completa que ya usa la web en móvil, con
 * su autocompletado y su navegación por teclado. Así no hay dos motores de
 * búsqueda que mantener.
 */
export function AppTopBar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-banana"
        // El WebView llega al borde de la pantalla: sin esto la barra queda
        // debajo de la Dynamic Island y del reloj.
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2 px-4 pb-2 pt-2.5">
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar en Banana Computer"
            aria-haspopup="dialog"
            className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-surface px-4 text-left text-[15px] text-muted shadow-[var(--shadow-rest)]"
          >
            <Icon name="search" size={18} aria-hidden="true" className="shrink-0 text-ink/60" />
            <span>Buscar productos, accesorios…</span>
          </button>
        </div>

        {/* Filtros rápidos: las familias del catálogo. Se desplazan en
            horizontal dentro de su propia caja; el `clip` del documento evita
            que ese desplazamiento arrastre la página. */}
        <nav aria-label="Categorías" className="pb-2.5">
          <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4">
            {FILTROS.map((filtro) => {
              const activo = pathname === filtro.to
              return (
                <li key={filtro.to} className="shrink-0">
                  <Link
                    to={filtro.to}
                    aria-current={activo ? 'page' : undefined}
                    className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-[13px] font-semibold transition-colors ${
                      activo
                        ? 'bg-ink text-white'
                        : 'bg-white/55 text-ink hover:bg-white/80'
                    }`}
                  >
                    {filtro.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      {searchOpen && (
        <div
          role="dialog"
          aria-label="Buscar"
          aria-modal="true"
          className="fixed inset-0 z-[85] flex flex-col bg-surface"
        >
          <HeaderSearch
            mode="mobile"
            onClose={() => setSearchOpen(false)}
            restoreFocusTo={searchButtonRef}
          />
        </div>
      )}
    </>
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
