// Configuración central del prototipo.
// Este archivo consolida constantes que antes vivían dispersas por el
// código. Cambiar un valor legal, un precio de referencia o un límite
// del comparador debería tocar SOLO este archivo.
//
// NOTA: las constantes `INSURANCE_PRICE` y `MAX_COMPARE` siguen
// re-exportadas desde `src/lib/store.tsx` por compatibilidad de imports
// existentes; este archivo actúa como fuente semántica única de la que
// también podrían leer futuros consumidores.

// -----------------------------------------------------------------------------
// Precio del seguro demostrativo (§4.7).
// -----------------------------------------------------------------------------
export { INSURANCE_PRICE } from '../lib/store'

// -----------------------------------------------------------------------------
// Comparador
// -----------------------------------------------------------------------------
/** Nº máximo de dispositivos que se pueden comparar a la vez. */
export const MAX_COMPARE = 3

// -----------------------------------------------------------------------------
// Fechas de verificación
// -----------------------------------------------------------------------------
/**
 * Fecha en la que se auditó por última vez el catálogo de accesorios
 * contra Banana Computer y Apple España. Se muestra en la ficha de cada
 * accesorio como referencia de "desde cuándo consideramos vigente este
 * dato".
 */
export { VERIFIED_ON } from './accessories'

// -----------------------------------------------------------------------------
// Etiquetas legales / disclaimers reutilizables
// -----------------------------------------------------------------------------

/** Aviso que acompaña a cualquier precio del prototipo. */
export const PRICE_DEMO_LABEL = 'Precio demostrativo'

/** Aviso cuando la disponibilidad no está confirmada por Banana. */
export const AVAILABILITY_PENDING_LABEL = 'Disponibilidad pendiente de validación'

/** Aviso cuando el ítem existe públicamente en Banana pero no está reservado. */
export const AVAILABILITY_PUBLIC_LABEL = 'Producto mostrado públicamente por Banana'

// -----------------------------------------------------------------------------
// Marca / identidad
// -----------------------------------------------------------------------------
export const BRAND_NAME = 'Banana Computer'
export const BRAND_SHORT = 'Banana'
export const BRAND_REGION = 'Canarias'

// -----------------------------------------------------------------------------
// Rutas externas (para consumo en un solo sitio si cambian)
// -----------------------------------------------------------------------------
export const EXTERNAL = {
  bananaHome: 'https://tienda.bananacomputer.com/',
  appleSpainHome: 'https://www.apple.com/es/',
} as const
