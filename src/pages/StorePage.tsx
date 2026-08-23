import { Navigate } from 'react-router-dom'
import { AppHome } from '../components/home/app/AppHome'
import { isNativeApp } from '../lib/nativeApp'

/**
 * `/tienda` — la puerta al catálogo, dentro de la aplicación nativa.
 *
 * Enseña las seis familias, las ofertas reales del catálogo, la ayuda para
 * elegir y los servicios que afectan a una compra. Inicio (`/`) se ocupa de lo
 * personal —lo que estabas mirando, lo que requiere atención—, y por eso las
 * dos pantallas dejaron de competir por lo mismo.
 *
 * (El comentario anterior describía la portada de la PR #39 —con hero,
 * destacados, tienda favorita e historial de vistos—, piezas que la #56 ya
 * había retirado.)
 *
 * En la web esta ruta no existe: la portada comercial de la web es `/`, y
 * mandar ahí a quien llegue por un enlace evita tener dos portadas que dicen lo
 * mismo con distinta dirección.
 */
export function StorePage() {
  if (!isNativeApp) return <Navigate to="/" replace />
  return <AppHome />
}
