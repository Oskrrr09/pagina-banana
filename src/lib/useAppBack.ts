import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { destinoAtrasApp, puedeVolverEnHistorial } from './appBack'

/**
 * El comportamiento del control «Volver» de la aplicación nativa.
 *
 * Junta las dos mitades del problema: `destinoAtrasApp` dice si esta pantalla
 * lleva control y cuál es su sitio, y aquí se decide CÓMO se llega.
 *
 * - Con historial propio, manda el historial: se retrocede de verdad, así que
 *   el catálogo vuelve con sus filtros y la búsqueda con su término. Es
 *   también lo que hace el botón del sistema en Android, que sigue delegando
 *   en el historial del WebView: los dos caminos coinciden por construcción.
 * - Sin historial propio —enlace profundo o arranque en frío—, se va al sitio
 *   de la pantalla con `replace`, para no dejar detrás una entrada que
 *   devolvería justo a donde se acaba de salir.
 *
 * La lectura de `window.history.state` ocurre SÓLO aquí; la regla que la
 * interpreta es `puedeVolverEnHistorial`, que se prueba aparte.
 */
export function useAppBack(): { volver: () => void } | null {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const destino = destinoAtrasApp(pathname, search)

  const volver = useCallback(() => {
    if (destino === null) return
    if (puedeVolverEnHistorial(window.history.state)) navigate(-1)
    else navigate(destino, { replace: true })
  }, [destino, navigate])

  if (destino === null) return null
  return { volver }
}
