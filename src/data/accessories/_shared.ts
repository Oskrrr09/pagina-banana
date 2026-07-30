// Tipos y helpers compartidos por el catálogo de accesorios.
// Cada categoría vive en su propio archivo (`carga.ts`, `iphone.ts`, …)
// e importa lo que necesita de aquí. Los consumidores externos siguen
// importando de `../accessories` (barrel `index.ts`) sin cambios.

import type { FamilySlug } from '../productDecisionData'

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export type AccessoryCategory =
  | 'carga'
  | 'iphone'
  | 'ipad'
  | 'mac'
  | 'apple-watch'
  | 'airtag'

export const ACCESSORY_CATEGORIES: {
  slug: AccessoryCategory
  label: string
}[] = [
  { slug: 'carga', label: 'Carga y cables' },
  { slug: 'iphone', label: 'iPhone' },
  { slug: 'ipad', label: 'iPad' },
  { slug: 'mac', label: 'Mac' },
  { slug: 'apple-watch', label: 'Apple Watch' },
  { slug: 'airtag', label: 'AirTag' },
]

export interface AccessoryVariant {
  slug: string
  label: string
  image: string
  imageBg?: string
  price?: number
  swatch?: string
}

/**
 * Configuración visual opcional del asset. Permite ajustar encuadre y
 * escala sin escribir clases Tailwind arbitrarias en los datos. Los
 * valores son tipados y cerrados; el componente traduce a estilo.
 */
export interface AccessoryImagePresentation {
  /** Cómo encaja la imagen en el contenedor. Por defecto `contain`. */
  fit?: 'contain' | 'cover'
  /**
   * Escala visual del producto. `1.0` = tamaño natural del asset dentro
   * del contenedor; `>1` amplía (útil para adaptadores o AirTag pequeños);
   * `<1` reduce (útil para cables largos).
   */
  scale?: 0.85 | 0.9 | 1 | 1.05 | 1.1 | 1.15 | 1.2
  /** Alineación vertical dentro del contenedor. */
  position?: 'top' | 'center' | 'bottom'
  /** Padding interno reservado. `compact` para cables/adaptadores. */
  padding?: 'none' | 'compact' | 'default'
  /** Fondo del contenedor. */
  background?: 'neutral' | 'white' | 'transparent'
}

export interface AccessorySpec {
  label: string
  value: string
}

export interface AccessoryCompatibility {
  /** Familias completas cuando el accesorio funciona con toda la familia. */
  families?: FamilySlug[]
  /** Modelos exactos: cadenas `familia/slug` p. ej. `iphone/17-pro`. */
  models?: string[]
  /** Notas humanas cuando la compatibilidad requiere matices. */
  notes?: string[]
}

export interface Accessory {
  slug: string
  name: string
  brand: 'Apple'
  category: AccessoryCategory
  tagline: string
  description: string
  /** Precio de referencia observado. `null` cuando no hay dato verificable. */
  price: number | null
  previousPrice?: number | null
  priceLabel?: string
  image: string
  imageBg?: string
  imagePresentation?: AccessoryImagePresentation
  gallery?: string[]
  variants: AccessoryVariant[]
  specs: AccessorySpec[]
  highlights: string[]
  compatibility: AccessoryCompatibility
  aliases: string[]
  keywords: string[]
  bananaSku?: string
  bananaSource?: string
  appleSource?: string
  verifiedOn: string
  availabilityLabel:
    | 'Producto mostrado públicamente por Banana'
    | 'Disponibilidad pendiente de validación'
    | 'Consulta disponibilidad en tienda'
  provisionalTags?: string[]
}

// -----------------------------------------------------------------------------
// Constantes de origen
// -----------------------------------------------------------------------------

export const VERIFIED_ON = '2026-07-30'

/** Prefijo canónico para las imágenes de accesorios servidas desde /public. */
export const IMG = `${import.meta.env.BASE_URL}img/accessories`
