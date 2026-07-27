import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { familiesNav, directLinks } from '../../data/nav'
import { useStore } from '../../lib/store'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'

// Cabecera fija (sticky) en escritorio y móvil (§2.8 / §5.5).
// Escritorio: buscador, favoritos, comparador, cuenta y carrito con contadores.
// Móvil: solo carrito y menú visibles; el resto vive en el menú.
export function Header() {
  const { cartCount, favorites, compare } = useStore()
  const [activeFamily, setActiveFamily] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const closeTimer = useRef<number | null>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Cierra menús al cambiar de ruta
  useEffect(() => {
    setActiveFamily(null)
    setMobileOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  // Escape cierra el mega-menú
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActiveFamily(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function openMega(slug: string) {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setActiveFamily(slug)
  }
  function scheduleClose() {
    closeTimer.current = window.setTimeout(() => setActiveFamily(null), 120)
  }

  const closeMobileMenu = useCallback(() => setMobileOpen(false), [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim()) navigate(`/buscar?q=${encodeURIComponent(q.trim())}`)
  }

  const family = familiesNav.find((f) => f.slug === activeFamily)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-banana">
        {/* Tres bloques a todo el ancho: logo a la izquierda (con margen), menú
            centrado y accesos (buscar/favoritos/carrito…) pegados a la derecha. */}
        <div className="banana-header-bar flex h-16 w-full items-center px-6 sm:px-8 lg:px-12">
          <Logo />

          {/* Escritorio: navegación centrada con mega-menú */}
          <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex" aria-label="Principal">
            {familiesNav.map((fam) => (
              <div key={fam.slug} onMouseEnter={() => openMega(fam.slug)} onMouseLeave={scheduleClose}>
                <Link
                  to={fam.demo ? '/iphone' : `/${fam.slug}`}
                  className={`rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-black/5 ${
                    activeFamily === fam.slug ? 'bg-black/5 font-semibold' : ''
                  }`}
                  onFocus={() => openMega(fam.slug)}
                >
                  {fam.name}
                </Link>
              </div>
            ))}
            {directLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-black/5"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Accesos permanentes */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
              aria-expanded={searchOpen}
              className="hidden h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:grid"
            >
              <Icon name="search" />
            </button>
            <IconBadge to="/favoritos" icon="heart" label="Favoritos" count={favorites.length} desktopOnly />
            <IconBadge to="/comparar" icon="compare" label="Comparador" count={compare.length} desktopOnly />
            <button
              aria-label="Cuenta"
              className="hidden h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:grid"
            >
              <Icon name="user" />
            </button>
            <IconBadge to="/carrito" icon="cart" label="Carrito" count={cartCount} />
            {/* Móvil: botón de menú (a la derecha, con el logo fijo a la izquierda) */}
            <button
              ref={mobileMenuButtonRef}
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation-dialog"
              className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:hidden"
            >
              <Icon name="menu" size={24} />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda desplegable (escritorio) */}
        {searchOpen && (
          <div className="border-t border-black/10 bg-surface">
            <form onSubmit={submitSearch} className="mx-auto w-full max-w-6xl px-5 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 rounded-full border border-line bg-neutral px-4 py-2.5">
                <Icon name="search" className="text-muted" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar productos, categorías, ayuda…"
                  aria-label="Buscar"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
                />
              </div>
            </form>
          </div>
        )}

        {/* Mega-menú */}
        {family && (
          <div onMouseEnter={() => openMega(family.slug)} onMouseLeave={scheduleClose}>
            <MegaMenu family={family} onNavigate={() => setActiveFamily(null)} />
          </div>
        )}
      </header>

      <MobileMenu open={mobileOpen} onClose={closeMobileMenu} returnFocusRef={mobileMenuButtonRef} />
    </>
  )
}

function IconBadge({
  to,
  icon,
  label,
  count,
  desktopOnly = false,
}: {
  to: string
  icon: string
  label: string
  count: number
  desktopOnly?: boolean
}) {
  return (
    <Link
      to={to}
      aria-label={count > 0 ? `${label} (${count})` : label}
      className={`relative grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 ${
        desktopOnly ? 'hidden xl:grid' : 'grid'
      }`}
    >
      <Icon name={icon} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}
