import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { familiesNav, directLinks, utilityLinks } from '../../data/nav'
import { useStore } from '../../lib/store'
import { useStorePreference } from '../../lib/storePreference'
import { useFavoriteAlerts } from '../../lib/favoriteAlerts'
import { useCustomerAuth } from '../../lib/customerAuth'
import { stores } from '../../data/stores'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'
import { HeaderSearch } from '../search/HeaderSearch'
import { isNativeApp } from '../../lib/nativeApp'
import { LanguagePicker } from './LanguagePicker'
import { useT, useCatalogo } from '../../lib/i18n'

// Cabecera fija (sticky) en escritorio y móvil.
// Integración visual: barra promocional oscura arriba, cabecera principal en
// glass amarillo semi-transparente con blur, y sombra que aparece al scrollear
// (sin borde duro), evitando que corte el hero de golpe.
export function Header() {
  const cat = useCatalogo()
  const { cartCount, favorites, compare } = useStore()
  const { session: customerSession } = useCustomerAuth()
  const t = useT()
  const [activeFamily, setActiveFamily] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const desktopSearchButtonRef = useRef<HTMLButtonElement>(null)
  const mobileSearchButtonRef = useRef<HTMLButtonElement>(null)
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
    return () => {
      document.body.style.overflow = prev
    }
  }, [searchOpen])

  function openMega(slug: string) {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setActiveFamily(slug)
  }
  function scheduleClose() {
    closeTimer.current = window.setTimeout(() => setActiveFamily(null), 120)
  }

  const closeMobileMenu = useCallback(() => setMobileOpen(false), [])

  const family = familiesNav.find((f) => f.slug === activeFamily)

  return (
    <>
      <header
        className={`sticky top-0 z-40 ${isNativeApp ? 'bg-banana' : ''}`}
        // En la app, el WebView llega hasta el borde de la pantalla
        // (`viewport-fit=cover`), así que sin esto la cabecera quedaría
        // debajo de la Dynamic Island y del reloj. El amarillo se extiende
        // por detrás de la barra de estado, que es como se ve bien.
        style={isNativeApp ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
      >
        {/* Barra superior de servicios — sólo escritorio; en móvil viven en el
             menú. Cian claro (cielo Canarias); mantiene contraste AA con el
             texto blanco gracias a `text-shadow` cuando cae en la parte más
             clara del degradado. Enlaces centrados; "Mi tienda" a la derecha
             usando posicionamiento absoluto para que la lista principal
             quede alineada con el eje central del layout. */}
        {/* Azul profundo (#0768A9). Con texto blanco se cumple WCAG AA
             (ratio ~5.2:1). El hover usa blanco translúcido para conservar
             legibilidad. */}
        {/* POR QUÉ `xl` Y NO `sm`.
             Esta barra aparecía desde 640 px, pero su contenido no cabe ahí: los
             enlaces van centrados en el flujo y «Elige tienda» está posicionado
             en absoluto, fuera de él, así que los primeros no saben que el
             segundo existe y se le meten debajo. Medido, solapaba de 640 a
             ~1000 px —hasta 89 px de «Soporte» sobre «Elige tienda»—, y en
             francés seguía solapando a 1024 y 1100.
             Sólo cabe limpia en los cinco idiomas a partir de 1280, que es
             además donde desaparece la hamburguesa (`xl:hidden`): por debajo,
             estos mismos enlaces y la tienda favorita viven en `MobileMenu`, así
             que no se pierde ningún acceso — sólo deja de haber dos sitios para
             lo mismo. */}
        {/* Los tres `data-*` son ganchos de prueba, sin efecto visual ni de
            comportamiento. El selector anterior era `div[class*="0768A9"]`:
            colgaba de un color escrito a mano, así que un cambio de tono —o el
            paso a un token— habría dejado la prueba midiendo cero piezas y, con
            ella, en verde. */}
        <div data-nav-utilidades className="relative hidden bg-[#0768A9] text-white xl:block">
          <div
            data-nav-utilidades-enlaces
            className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-[13px] font-medium"
          >
            {utilityLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white transition-colors hover:bg-white/15"
              >
                <Icon name={link.icon} size={14} /> {t(link.label)}
              </Link>
            ))}
          </div>
          <div data-nav-tienda className="absolute right-4 top-1/2 -translate-y-1/2">
            <FavoriteStoreMenu />
          </div>
        </div>

        {/* Cabecera principal — amarillo totalmente opaco. Sombra al scrollear. */}
        <div
          className={`bg-banana transition-shadow duration-300 ${
            scrolled ? 'shadow-[0_6px_20px_-8px_rgba(0,0,0,0.18)]' : ''
          }`}
        >
          <div
            // Sin `max-w-7xl`: la barra usa todo el ancho de la ventana, igual
            // que hace la de arriba con "Elegir tienda". Con el contenido
            // limitado a 1280px y centrado, en una pantalla ancha el selector
            // de idioma quedaba al borde del CONTENEDOR y dejaba una franja
            // amarilla vacía a su derecha.
            className="banana-header-bar relative flex h-16 w-full items-center py-0 pl-6 pr-4 sm:pl-10 sm:pr-6 lg:pl-[52px] lg:pr-8"
          >
            <Logo />

            {/* Escritorio: menú centrado respecto a la ventana, compartiendo eje
              con los enlaces de la barra utilitaria de arriba.
              Los enlaces van algo menos holgados que el resto de la cabecera
              para que a 1280px —el ancho al que aparece este menú, y el de un
              portátil corriente— siga quedando aire con los accesos de la
              derecha. Ver UI-001. */}
            <nav
              className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 xl:flex"
              aria-label="Principal"
            >
              {familiesNav.map((fam) => (
                <div key={fam.slug} onMouseEnter={() => openMega(fam.slug)} onMouseLeave={scheduleClose}>
                  <Link
                    to={fam.demo ? '/iphone' : `/${fam.slug}`}
                    className={`rounded-full px-2 py-2 text-sm font-medium text-ink transition-colors hover:bg-black/5 2xl:px-3 ${
                      activeFamily === fam.slug ? 'bg-black/5 font-semibold' : ''
                    }`}
                    onFocus={() => openMega(fam.slug)}
                  >
                    {cat(fam.name)}
                  </Link>
                </div>
              ))}
              {directLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-full px-2 py-2 text-sm font-medium text-ink transition-colors hover:bg-black/5 2xl:px-3"
                >
                  {t(l.label)}
                </Link>
              ))}
            </nav>

            {/* Accesos permanentes */}
            <div className="ml-auto flex items-center">
              {/* Los accesos van pegados como un bloque.
                Los botones miden 40px con un dibujo de 24 dentro, así que con
                `gap-0` aún quedaban 20px de aire entre iconos. `-space-x-2`
                los solapa lo justo para dejar 4px, que es lo que se ve como
                "juntos". La única separación de este grupo es la del selector
                de idioma. */}
              <div className="flex items-center -space-x-2">
                {/* Escritorio: lupa, favoritos, comparador, cuenta */}
                <button
                  ref={desktopSearchButtonRef}
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label={t('header.search')}
                  aria-expanded={searchOpen}
                  className="hidden h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:grid"
                >
                  <Icon name="search" />
                </button>
                <IconBadge
                  to="/favoritos"
                  icon="heart"
                  label={t('header.favorites')}
                  count={favorites.length}
                  desktopOnly
                />
                <IconBadge
                  to="/comparar"
                  icon="compare"
                  label={t('header.compare')}
                  count={compare.length}
                  desktopOnly
                />
                <NotificationsBell />
                <Link
                  to={customerSession ? '/cuenta' : '/login'}
                  aria-label={customerSession ? t('header.account') : t('header.signIn')}
                  className="hidden h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:grid"
                >
                  <Icon name="user" />
                </Link>

                {/* Móvil: lupa (antes del carrito) */}
                <button
                  ref={mobileSearchButtonRef}
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label={t('header.search')}
                  aria-expanded={searchOpen}
                  className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:hidden"
                >
                  <Icon name="search" />
                </button>

                {/* Carrito. En la app nativa no se repite aquí: vive en la barra
                inferior, y tener el mismo destino dos veces en pantalla
                confunde más que ayuda. */}
                {!isNativeApp && <IconBadge to="/carrito" icon="cart" label={t('header.cart')} count={cartCount} />}
              </div>

              {/* Selector de idioma — pegado al borde derecho y claramente
                separado del bloque de accesos, con una línea a media altura y
                el mismo aire a cada lado de ella. */}
              <span aria-hidden="true" className="mx-4 hidden h-5 w-px bg-ink/15 xl:block" />
              <LanguagePicker />

              {/* Móvil: botón de menú */}
              <button
                ref={mobileMenuButtonRef}
                onClick={() => setMobileOpen(true)}
                aria-label={t('header.openMenu')}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation-dialog"
                className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-black/5 xl:hidden"
              >
                <Icon name="menu" size={24} />
              </button>
            </div>
          </div>

          {/* Barra de búsqueda desplegable (solo escritorio xl+) — usa el
             mismo motor que /buscar y renderiza autocompletado agrupado con
             navegación por teclado. */}
          {searchOpen && (
            <div className="hidden border-t border-black/10 bg-surface xl:block">
              <HeaderSearch
                mode="desktop"
                onClose={() => setSearchOpen(false)}
                restoreFocusTo={desktopSearchButtonRef}
              />
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

      {/* Overlay de búsqueda en móvil — pantalla completa. Usa el mismo motor
           y componente que la barra desplegable de escritorio. */}
      {searchOpen && (
        <div
          role="dialog"
          aria-label={t('header.search')}
          aria-modal="true"
          className="fixed inset-0 z-[85] flex flex-col bg-surface xl:hidden"
        >
          <HeaderSearch mode="mobile" onClose={() => setSearchOpen(false)} restoreFocusTo={mobileSearchButtonRef} />
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
  const t = useT()
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
      if (!menuRef.current.contains(event.target as Node) && !buttonRef.current.contains(event.target as Node)) {
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
        aria-label={favoriteStore ? `Mi tienda: ${favoriteStore.name}. Cambiar o quitar.` : t('header.chooseStore')}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium text-white transition-colors hover:bg-white/15"
      >
        <Icon name="star" size={14} aria-hidden="true" />
        {favoriteStore ? t('header.myStoreIs', { tienda: favoriteStore.name }) : t('stores.choose')}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Selector de tienda favorita"
          className="absolute right-0 top-full z-30 mt-1 w-72 rounded-[12px] border border-line bg-surface p-2 text-left text-ink shadow-[var(--shadow-raised)]"
        >
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t('favStore.kicker')}
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
                    <Icon name={active ? 'star' : 'store'} size={14} aria-hidden="true" />
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
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    function onClick(event: MouseEvent) {
      if (!panelRef.current || !btnRef.current) return
      if (!panelRef.current.contains(event.target as Node) && !btnRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.cancelAnimationFrame(rafId)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
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
        aria-label={unreadCount > 0 ? `Avisos (${unreadCount} sin leer)` : 'Avisos'}
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
            <p className="px-1 py-3 text-sm text-muted">No tienes avisos por ahora. Actívalos desde /favoritos.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-[8px] p-2 text-sm ${n.read ? 'text-muted' : 'bg-brand-050 text-ink'}`}
                >
                  <p className="font-semibold">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted">{new Date(n.createdAt).toLocaleString('es-ES')}</p>
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
