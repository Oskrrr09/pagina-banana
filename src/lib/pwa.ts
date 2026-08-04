import { useCallback, useEffect, useState } from 'react'

/**
 * Soporte de aplicación instalable (PWA) para el panel de agentes.
 *
 * Solo el panel se instala como app. La tienda va por otro camino
 * (aplicación nativa con Capacitor, ver `docs/02-decisiones.md`), así que el
 * `<link rel="manifest">` no está en `index.html`: lo inyecta `/agente` al
 * montarse, y así ninguna página pública ofrece instalar el panel interno.
 */

// ---------------------------------------------------------------- Service worker

/**
 * Registra el service worker generado en el build.
 *
 * Solo en producción a propósito: en desarrollo `dist/sw.js` no existe, y un
 * service worker cacheando entre recargas pelearía con el HMR de Vite y con
 * Playwright, que levanta el dev server.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  // Dentro de la app nativa (Capacitor) no hay `sw.js`: `npm run build:app` no
  // lo genera, porque los ficheros ya viajan dentro del binario y no hay nada
  // que cachear. Registrarlo solo produciría un error en consola.
  if ((window as { Capacitor?: unknown }).Capacitor) return

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error) => console.error('[pwa] no se pudo registrar el service worker', error))
  })
}

/** Avisa cuando hay una versión nueva esperando para activarse. */
export function useAppUpdate(): { updateReady: boolean; applyUpdate: () => void } {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let cancelled = false

    void navigator.serviceWorker.ready.then((registration) => {
      if (cancelled) return
      if (registration.waiting) setWaiting(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const nuevo = registration.installing
        if (!nuevo) return
        nuevo.addEventListener('statechange', () => {
          // `controller` presente = ya había una versión sirviendo, así que
          // esto es una actualización y no la primera instalación.
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(nuevo)
          }
        })
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  const applyUpdate = useCallback(() => {
    waiting?.postMessage('SKIP_WAITING')
    window.location.reload()
  }, [waiting])

  return { updateReady: waiting !== null, applyUpdate }
}

// ---------------------------------------------------------------- Manifest

/**
 * Declara la identidad de app instalable mientras el componente esté montado.
 *
 * Se inyecta y se retira por ruta porque `index.html` es único para toda la
 * SPA: si estas etiquetas estuvieran fijas allí, cualquier página de la tienda
 * ofrecería instalar el panel interno. Al desmontarse se limpian, así que
 * volver a la tienda deja el documento como estaba.
 *
 * `apple-touch-icon` entra aquí y no en `index.html` porque iOS no lee los
 * iconos del manifest: sin esta línea el panel se instalaría en un iPhone con
 * el icono amarillo de la tienda.
 */
export function useInstallableApp(options: {
  manifest: string
  appleIcon: string
  appleTitle: string
  themeColor: string
}): void {
  const { manifest, appleIcon, appleTitle, themeColor } = options

  useEffect(() => {
    function meta(name: string, content: string) {
      const el = document.createElement('meta')
      el.name = name
      el.content = content
      return el
    }
    function link(rel: string, href: string) {
      const el = document.createElement('link')
      el.rel = rel
      el.href = href
      return el
    }

    const added = [
      link('manifest', manifest),
      link('apple-touch-icon', appleIcon),
      meta('apple-mobile-web-app-capable', 'yes'),
      meta('apple-mobile-web-app-title', appleTitle),
      meta('apple-mobile-web-app-status-bar-style', 'default'),
    ]

    // El theme-color de la tienda ya existe en index.html; aquí se cambia al
    // amarillo de la cabecera del panel y se restaura al salir.
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const themeAnterior = themeMeta?.content ?? null
    if (themeMeta) themeMeta.content = themeColor

    for (const el of added) document.head.appendChild(el)

    return () => {
      for (const el of added) el.remove()
      if (themeMeta && themeAnterior !== null) themeMeta.content = themeAnterior
    }
  }, [manifest, appleIcon, appleTitle, themeColor])
}

// ---------------------------------------------------------------- Instalación

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallMode = 'prompt' | 'manual' | 'instalada' | 'no-disponible'

const DISMISS_KEY = 'banana:agente-install-dismissed'

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari en iOS no implementa display-mode; usa esta propiedad propia.
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/**
 * Instrucciones para los navegadores que no exponen `beforeinstallprompt`,
 * que es toda la familia de Safari. Sin esto, en un iPhone o en un Mac con
 * Safari la app simplemente no parecería instalable.
 */
export function manualInstallHint(): string {
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  if (iOS) return 'Pulsa Compartir y luego "Añadir a pantalla de inicio".'
  if (/Macintosh/.test(ua)) return 'En Safari, menú Archivo → "Añadir al Dock".'
  return 'Busca "Instalar" o "Añadir a la pantalla de inicio" en el menú del navegador.'
}

export function useInstallPrompt(): {
  mode: InstallMode
  hint: string
  install: () => Promise<void>
  dismissed: boolean
  dismiss: () => void
} {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [instalada, setInstalada] = useState(() => isStandalone())
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem(DISMISS_KEY) === '1')

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      // Sin esto, Chrome muestra su propia barra además de la nuestra.
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalada(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // El evento no se puede reutilizar; el navegador lo vuelve a emitir si
    // procede.
    setDeferred(null)
    if (outcome === 'dismissed') setDismissed(true)
  }, [deferred])

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }, [])

  const mode: InstallMode = instalada ? 'instalada' : deferred ? 'prompt' : 'manual'

  return { mode, hint: manualInstallHint(), install, dismissed, dismiss }
}

// ---------------------------------------------------------------- Conexión

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}

// ---------------------------------------------------------------- Badge del Dock

interface BadgeNavigator {
  setAppBadge?: (count?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

/**
 * Contador sobre el icono del Dock (o del lanzador) cuando la app está
 * instalada. En una pestaña normal el navegador lo ignora, así que no hace
 * falta condicionarlo.
 */
export function useAppBadge(count: number): void {
  useEffect(() => {
    const nav = navigator as Navigator & BadgeNavigator
    if (!nav.setAppBadge || !nav.clearAppBadge) return
    // Los dos devuelven promesa y rechazan si el navegador lo tiene
    // deshabilitado; no es un error que deba romper el panel.
    if (count > 0) void nav.setAppBadge(count).catch(() => {})
    else void nav.clearAppBadge().catch(() => {})
  }, [count])
}

// ---------------------------------------------------------------- Notificaciones

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'no-soportado'

export function useNotifications(): {
  permission: NotificationPermissionState
  request: () => Promise<void>
  notify: (title: string, body: string) => void
} {
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    'Notification' in window ? Notification.permission : 'no-soportado',
  )

  const request = useCallback(async () => {
    if (!('Notification' in window)) return
    // Se llama SIEMPRE desde un clic del agente: pedir permiso al cargar hace
    // que los navegadores lo bloqueen de plano y molesta.
    setPermission(await Notification.requestPermission())
  }, [])

  const notify = useCallback(
    (title: string, body: string) => {
      if (permission !== 'granted') return
      // Sin notificación si el agente ya está mirando el panel.
      if (document.visibilityState === 'visible') return
      try {
        new Notification(title, {
          body,
          icon: `${import.meta.env.BASE_URL}icons/agente-192.png`,
          // Agrupa: varios mensajes seguidos no apilan una torre de avisos.
          tag: 'banana-agente-mensaje',
        })
      } catch (error) {
        console.error('[pwa] no se pudo mostrar la notificación', error)
      }
    },
    [permission],
  )

  return { permission, request, notify }
}
