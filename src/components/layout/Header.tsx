import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { familiesNav, directLinks, utilityLinks } from '../../data/nav'
import { families, modelsByFamily, variantPath } from '../../data/products'
import { useStore } from '../../lib/store'
import { useStorePreference } from '../../lib/storePreference'
import { useFavoriteAlerts } from '../../lib/favoriteAlerts'
import { stores } from '../../data/stores'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'

// Sugerencias del overlay de búsqueda derivadas del catálogo real (§4.4):
// se generan a partir de `families` + `modelsByFamily` para que cualquier
// modelo añadido o retirado aparezca automáticamente sin tocar el Header.
interface SuggestionSection {
  label: string
  slug: string
  models: { name: string; to: string }[]
}

function buildSearchSuggestions(): SuggestionSection[] {
  return families
    .filter((fam) => (modelsByFamily[fam.slug]?.length ?? 0) > 0)
    .map((fam) => ({
      label: fam.name,
      slug: fam.slug,
      models: modelsByFamily[fam.slug].map((model) => ({
        name: model.name,
        to: variantPath(model),
      })),
    }))
}

// Cabecera fija (sticky) en escritorio y móvil.
// Integración visual: barra promocional oscura arriba, cabecera principal en
// glass amarillo semi-transparente con blur, y sombra que aparece al scrollear
// (sin borde duro), evitando que corte el hero de golpe.
export function Header() {
  const { cartCount, favorites, compare } = useStore()
  const searchSuggestions = useMemo(() => buildSearchSuggestions(), [])
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
        {/* Barra superior de servicios — sólo escritorio; en móvil viven en el
             menú. Cian claro (cielo Canarias); mantiene contraste AA con el
             texto blanco gracias a `text-shadow` cuando cae en la parte más
             clara del degradado. Enlaces centrados; "Mi tienda" a la derecha
             usando posicionamiento absoluto para que la lista principal
             quede alineada con el eje central del layout. */}
        {/* Cian brillante estilo "cielo" (#27E7F5). Con texto oscuro (`text-ink`)
             se cumple WCAG AA cómodamente (ratio ~11:1). Los enlaces mantienen
             el hover sutil con un negro translúcido para no perder legibilidad. */}
        <div className="relative hidden bg-[#27e7f5] text-ink sm:block">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-[13px] font-medium">
            {utilityLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-ink transition-colors hover:bg-black/10"
              >
                <Icon name={link.icon} size={14} /> {link.label}
              </Link>
            ))}
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <FavoriteStoreMenu />
          </div>
        </div>

        {/* Cabecera principal — amarillo totalmente opaco. Sombra al scrollear. */}
        <div
          className={`bg-banana transition-shadow duration-300 ${
            scrolled ? 'shadow-[0_6px_20px_-8px_rgba(0,0,0,0.18)]' : ''
          }`}
        >
        <div className="banana-header-bar relative mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Logo />

          {/* Escritorio: navegación absolutamente centrada respecto al mismo
              contenedor que la barra utilitaria superior, para que ambas
              queden alineadas en el mismo eje vertical independientemente
              del ancho del logo o de los accesos permanentes. */}
          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 xl:flex"
            aria-label="Principal"
          >
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
            <NotificationsBell />
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

          {/* Sugerencias por categoría — derivadas del catálogo real */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {searchSuggestions.map((section) => (
              <div key={section.slug} className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                  {section.label}
                </p>
                <div className="flex flex-col">
                  {section.models.map((model) => (
                    <Link
                      key={model.to}
                      to={model.to}
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

// Selector "Mi tienda" en la barra utilitaria. Sin tienda muestra
// "Elegir tienda"; con tienda muestra "Mi tienda: X" y despliega un menú
// accesible para cambiarla o quitarla. La lógica de persistencia vive en
// `useStorePreference`.
function FavoriteStoreMenu() {
  const { favoriteStore, setFavorite, clearFavorite } = useStorePreference()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onClickOutside(event: MouseEvent) {
      if (!menuRef.current || !buttonRef.current) return
      if (
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          favoriteStore
            ? `Mi tienda: ${favoriteStore.name}. Cambiar o quitar.`
            : 'Elegir tienda favorita'
        }
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-ink transition-colors hover:bg-black/10"
      >
        <Icon name="star" size={14} aria-hidden="true" />
        {favoriteStore ? `Mi tienda: ${favoriteStore.name}` : 'Elegir tienda'}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Selector de tienda favorita"
          className="absolute right-0 top-full z-30 mt-1 w-72 rounded-[12px] border border-line bg-surface p-2 text-left text-ink shadow-[var(--shadow-raised)]"
        >
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Tu tienda Banana
          </p>
          <ul className="mt-1 space-y-1">
            {stores.map((store) => {
              const active = favoriteStore?.slug === store.slug
              return (
                <li key={store.slug}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setFavorite(store.slug)
                      setOpen(false)
                      buttonRef.current?.focus()
                    }}
                    className={`flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-sm hover:bg-neutral ${
                      active ? 'bg-brand-050 font-semibold' : ''
                    }`}
                  >
                    <Icon
                      name={active ? 'star' : 'store'}
                      size={14}
                      aria-hidden="true"
                    />
                    <span>
                      {store.name}
                      <span className="ml-1 text-xs text-muted">{store.island}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {favoriteStore && (
            <>
              <hr className="my-2 border-line" />
              <button
                type="button"
                onClick={() => {
                  clearFavorite()
                  setOpen(false)
                  buttonRef.current?.focus()
                }}
                className="w-full rounded-[8px] px-2 py-1.5 text-left text-sm text-danger hover:bg-neutral"
              >
                Quitar tienda favorita
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationsBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useFavoriteAlerts()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const rafId = window.requestAnimationFrame(() => panelRef.current?.focus())
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    function onClick(event: MouseEvent) {
      if (!panelRef.current || !btnRef.current) return
      if (
        !panelRef.current.contains(event.target as Node) &&
        !btnRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      window.cancelAnimationFrame(rafId)
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Avisos (${unreadCount} sin leer)` : "Avisos"}
        className="relative hidden h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:grid"
      >
        <Icon name="info" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="notif-title"
          tabIndex={-1}
          className="absolute right-0 top-full z-30 mt-1 w-80 rounded-[12px] border border-line bg-surface p-3 text-left text-ink shadow-[var(--shadow-raised)] outline-none"
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <p id="notif-title" className="text-sm font-bold text-ink">
              Avisos
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-ink underline underline-offset-2"
              >
                Marcar todos como leídos
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-1 py-3 text-sm text-muted">
              No tienes avisos por ahora. Actívalos desde /favoritos.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className={`rounded-[8px] p-2 text-sm ${n.read ? "text-muted" : "bg-brand-050 text-ink"}`}>
                  <p className="font-semibold">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted">{new Date(n.createdAt).toLocaleString("es-ES")}</p>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="mt-1 text-xs font-semibold text-ink underline underline-offset-2"
                    >
                      Marcar como leído
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 border-t border-line pt-2">
            <Link
              to="/favoritos"
              onClick={() => setOpen(false)}
              className="block rounded-[8px] px-2 py-1.5 text-sm font-semibold text-ink hover:bg-neutral"
            >
              Ir a favoritos ›
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
