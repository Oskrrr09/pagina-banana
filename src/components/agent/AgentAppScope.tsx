import { Outlet } from 'react-router-dom'
import { useInstallableApp } from '../../lib/pwa'

/**
 * Envoltorio de rutas que declara el panel como aplicación instalable.
 *
 * Va aquí y no dentro de `AgentPage` porque `/agente` redirige a
 * `/agente/login` mientras no hay sesión: si las etiquetas colgaran del panel,
 * desaparecerían justo en la pantalla desde la que el agente instalaría la
 * app. Este envoltorio cubre las dos rutas, igual que el `scope` del manifest.
 */
export function AgentAppScope() {
  useInstallableApp({
    manifest: `${import.meta.env.BASE_URL}manifest-agente.webmanifest`,
    appleIcon: `${import.meta.env.BASE_URL}icons/agente-apple-touch-180.png`,
    appleTitle: 'Banana Agente',
    // Amarillo de la cabecera del panel (--color-brand).
    themeColor: '#ffce1f',
  })

  return <Outlet />
}
