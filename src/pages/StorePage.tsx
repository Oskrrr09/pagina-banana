import { Navigate } from 'react-router-dom'
import { AppHome } from '../components/home/app/AppHome'
import { isNativeApp } from '../lib/nativeApp'

/**
 * `/tienda` — la portada comercial de la aplicación nativa.
 *
 * Es exactamente la portada que construyó la PR #39: hero, oportunidades,
 * categorías, destacados, tienda favorita, servicios y el historial de vistos.
 * Ese trabajo no se tira; sólo cambia por dónde se entra.
 *
 * Antes vivía en `/` porque la app no tenía otro sitio donde ponerla. Ahora `/`
 * es Inicio —mi relación con Banana— y el comercio tiene pestaña propia, que es
 * lo que permite que las dos cosas dejen de competir por la misma pantalla.
 *
 * En la web esta ruta no existe: la portada comercial de la web es `/`, y
 * mandar ahí a quien llegue por un enlace evita tener dos portadas que dicen lo
 * mismo con distinta dirección.
 */
export function StorePage() {
  if (!isNativeApp) return <Navigate to="/" replace />
  return <AppHome />
}
