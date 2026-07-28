import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { familiesNav, directLinks, utilityLinks } from '../../data/nav'
import { useStore } from '../../lib/store'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'

// Sugerencias de búsqueda organizadas por familia de producto.
const SEARCH_SUGGESTIONS = [
  {
    label: 'iPhone',
    slug: 'iphone',
    models: [
      { name: 'iPhone 17 Pro', slug: '17-pro' },
      { name: 'iPhone 17 Pro Max', slug: '17-pro-max' },
      { name: 'iPhone Air', slug: 'air' },
      { name: 'iPhone 17', slug: '17' },
    ],
  },
  {
    label: 'Mac',
    slug: 'mac',
    models: [
      { name: 'MacBook Air M5', slug: 'macbook-air-m5' },
      { name: 'MacBook Pro M5', slug: 'macbook-pro-m5' },
      { name: 'MacBook Air M4', slug: 'macbook-air-m4' },
      { name: 'iMac 24" M4', slug: 'imac-24-m4' },
    ],
  },
  {
    label: 'iPad',
    slug: 'ipad',
    models: [
      { name: 'iPad Pro M5', slug: 'ipad-pro' },
      { name: 'iPad Air M4', slug: 'ipad-air' },
      { name: 'iPad mini', slug: 'ipad-mini' },
      { name: 'iPad A16', slug: 'ipad-a16' },
    ],
  },
  {
    label: 'Apple Watch',
    slug: 'apple-watch',
    models: [
      { name: 'Apple Watch Ultra 3', slug: 'watch-ultra-3' },
      { name: 'Apple Watch Series 11', slug: 'watch-series-11' },
      { name: 'Apple Watch SE 3', slug: 'watch-se-3' },
    ],
  },
  {
    label: 'AirPods',
    slug: 'airpods',
    models: [
      { name: 'AirPods Pro 3', slug: 'airpods-pro-3' },
      { name: 'AirPods Max', slug: 'airpods-max' },
    ],
  },
]

// Cabecera fija (sticky) en escritorio y móvil.
// Integración visual: barra promocional oscura arriba, cabecera principal en
// glass amarillo semi-transparente con blur, y sombra que aparece al scrollear
// (sin borde duro), evitando que corte el hero de golpe.
export function Header() {
  const { cartCount, favorites, compare } = useStore()
  const [activeFamily, setActiveFamily] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setActiveFamily(null)
    setMobileOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveFamily(null)
        setSearchOpen(false)
        setQ('')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Bloquea el scroll de fondo mientras el overlay de búsqueda está activo en móvil.
  useEffect(() => {
    if (!searchOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [searchOpen])

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
      <header className="sticky top-0 z-40">
        {/* Barra superior de servicios — sólo escritorio; en móvil viven en el menú */}
        <div className="hidden bg-[#7ba9b8] text-white sm:block">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-[13px] font-medium">
            {utilityLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-ink/80 transition-colors hover:bg-white/40 hover:text-ink"
              >
                <Icon name={link.icon} size={14} /> {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Cabecera principal — amarillo casi opaco (más barato que backdrop-blur
             en scroll) con sombra al scrollear */}
        <div
          className={`bg-banana/[0.97] transition-shadow duration-300 ${
            scrolled ? 'shadow-[0_6px_20px_-8px_rgba(0,0,0,0.18)]' : ''
          }`}
        >
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
            {/* Escritorio: lupa, favoritos, comparador, cuenta */}
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

            {/* Móvil: lupa (antes del carrito) */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
              aria-expanded={searchOpen}
              className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:hidden"
            >
              <Icon name="search" />
            </button>

            {/* Carrito (siempre visible) */}
            <IconBadge to="/carrito" icon="cart" label="Carrito" count={cartCount} />

            {/* Móvil: botón de menú */}
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

        {/* Barra de búsqueda desplegable (solo escritorio xl+) */}
        {searchOpen && (
          <div className="hidden border-t border-black/10 bg-surface xl:block">
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
        </div>
      </header>

      {/* Overlay de búsqueda en móvil — pantalla completa con sugerencias */}
      {searchOpen && (
        <div
          role="dialog"
          aria-label="Buscar"
          aria-modal="true"
          className="fixed inset-0 z-[85] flex flex-col bg-surface xl:hidden"
        >
          {/* Barra superior: cerrar + input + enviar */}
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-4">
            <button
              onClick={() => { setSearchOpen(false); setQ('') }}
              aria-label="Cerrar búsqueda"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral"
            >
              <Icon name="chevron-right" className="rotate-180" />
            </button>
            <form onSubmit={submitSearch} className="flex flex-1 items-center gap-2 rounded-full border border-line bg-neutral px-4 py-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="¿Qué estás buscando?"
                aria-label="Buscar"
                className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
              />
            </form>
            <button
              onClick={() => { if (q.trim()) navigate(`/buscar?q=${encodeURIComponent(q.trim())}`) }}
              aria-label="Buscar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-neutral hover:text-ink"
            >
              <Icon name="search" />
            </button>
          </div>

          {/* Sugerencias por categoría */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {SEARCH_SUGGESTIONS.map((section) => (
              <div key={section.slug} className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                  {section.label}
                </p>
                <div className="flex flex-col">
                  {section.models.map((model) => (
                    <Link
                      key={model.slug}
                      to={`/${section.slug}/${model.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink hover:bg-neutral"
                    >
                      <Icon name="search" size={15} className="shrink-0 text-muted" />
                      {model.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
