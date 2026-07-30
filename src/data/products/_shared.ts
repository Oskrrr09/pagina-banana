// Helpers compartidos por las familias del catálogo de dispositivos.
// No exporta datos: solo tipos internos y funciones puras. Cada archivo
// de familia (`iphone.ts`, `mac.ts`, …) importa lo que necesita de aquí.

import type { CapacityOption, ColorVariant } from '../types'

export const IMG = `${import.meta.env.BASE_URL}img/products`

export const cap = (
  capacity: string,
  price: number,
  previousPrice: number | null,
  availability: CapacityOption['availability'] = 'disponible',
  availabilityNote?: string,
): CapacityOption => ({ capacity, price, previousPrice, availability, availabilityNote })

/**
 * Tupla compacta para declarar capacidades sin repetir claves.
 * `[capacity, price, previousPrice?, availability?, note?]`.
 */
export type CapSpec = [
  capacity: string,
  price: number,
  prev?: number | null,
  av?: CapacityOption['availability'],
  note?: string,
]

export interface ColorSpec {
  slug: string
  name: string
  hex: string
  image: string
  imageBg?: string
  caps: CapSpec[]
}

export function buildColors(specs: ColorSpec[]): ColorVariant[] {
  return specs.map((c) => ({
    color: c.slug,
    name: c.name,
    hex: c.hex,
    image: c.image,
    ...(c.imageBg ? { imageBg: c.imageBg } : {}),
    capacities: c.caps.map(([capacity, price, prev = null, av = 'disponible', note]) =>
      cap(capacity, price, prev, av, note),
    ),
  }))
}
