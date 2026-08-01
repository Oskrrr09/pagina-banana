import type { ClaveTexto } from '../lib/i18n'

// Tipos del catálogo. En el prototipo, los datos son de ejemplo (apartado 7):
// ningún precio, plazo o stock es real.

export type ProvisionalTag =
  | 'Contenido provisional'
  | 'Precio demostrativo'
  | 'Condiciones pendientes de validación'
  | 'Stock de ejemplo'

export type Availability = 'disponible' | 'bajo-pedido' | 'agotado'

export interface CapacityOption {
  capacity: string
  price: number
  previousPrice: number | null
  availability: Availability
  availabilityNote?: string
}

export interface ColorVariant {
  color: string // slug corto, p. ej. 'plata'
  name: string // nombre visible, p. ej. 'Plata'
  hex: string // muestra de color (decorativa; el nombre siempre en texto)
  image: string // foto real de producto (public/img/products/…)
  imageBg?: string // color de fondo de la imagen (cuando no es blanco/neutro)
  capacities: CapacityOption[]
}

export interface Model {
  slug: string
  family: string
  name: string
  tagline: string
  fromPrice: number
  financeFrom: { monthly: number; months: number }
  colors: ColorVariant[]
  specs: { label: string; value: string }[]
  highlights: string[]
}

export interface Family {
  /** Clave de traducción del nombre. Solo cuando el nombre no es una marca:
      "iPhone" o "Mac" no se traducen, "Accesorios" sí. */
  nameKey?: ClaveTexto
  /** Clave de traducción del reclamo. */
  taglineKey?: ClaveTexto
  slug: string
  name: string
  tagline: string
  fromPrice: number
}

export interface Store {
  slug: string
  name: string
  island: string
  address: string
  coords: { lat: number; lng: number }
  // Búsqueda que Google Maps resuelve al local real (ficha oficial). Los locales
  // Banana aparecen indexados como "Banana Computer Apple Premium Reseller"; el
  // nombre visible en la app es libre y puede diferir (p. ej. "Banana Triana").
  mapQuery: string
  hours: { day: string; time: string }[]
  hoursSource: string
  hoursVerifiedOn: string
  services: string[]
}
