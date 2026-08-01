// Barrel del catálogo de dispositivos.
// Re-exporta lo que antes vivía en `src/data/products.ts` para que ningún
// consumidor tenga que cambiar sus imports. Añadir/quitar familias solo
// requiere tocar este archivo (más el fichero de la familia).
//
// Cómo trabajar aquí → `src/data/README.md`.

import type { Family, Model } from '../types'
import { iphoneModels } from './iphone'
import { macModels } from './mac'
import { ipadModels } from './ipad'
import { watchModels } from './watch'
import { airpodsModels } from './airpods'

// Familias para la home y el mega-menú.
export const families: Family[] = [
  { slug: 'mac', name: 'Mac', tagline: 'Potencia de sobremesa y portátil', taglineKey: 'family.mac.tagline', fromPrice: 719 },
  { slug: 'iphone', name: 'iPhone', tagline: 'El iPhone que buscas, al mejor precio en Canarias', taglineKey: 'family.iphone.tagline', fromPrice: 959 },
  { slug: 'ipad', name: 'iPad', tagline: 'Versátil, ligero, para todo', taglineKey: 'family.ipad.tagline', fromPrice: 409 },
  { slug: 'apple-watch', name: 'Watch', tagline: 'Tu salud, en la muñeca', taglineKey: 'family.watch.tagline', fromPrice: 279 },
  { slug: 'airpods', name: 'AirPods', tagline: 'Sonido sin cables', taglineKey: 'family.airpods.tagline', fromPrice: 279 },
  { slug: 'accesorios', name: 'Accesorios', tagline: 'Fundas, cargadores y más', taglineKey: 'family.accessories.tagline', nameKey: 'family.accessories.name', fromPrice: 29 },
]

// Re-export de los arrays por familia (compat con imports actuales).
export { iphoneModels, macModels, ipadModels, watchModels, airpodsModels }

// Registro consolidado.
export const modelsByFamily: Record<string, Model[]> = {
  iphone: iphoneModels,
  mac: macModels,
  ipad: ipadModels,
  'apple-watch': watchModels,
  airpods: airpodsModels,
}

// Familias con página de catálogo desarrollada (tienen productos reales).
export const developedFamilies = Object.keys(modelsByFamily)

export const allModels: Model[] = Object.values(modelsByFamily).flat()

export function familyInfo(slug: string): Family | undefined {
  return families.find((f) => f.slug === slug)
}

export function getFamilyModels(family: string): Model[] {
  return modelsByFamily[family] ?? []
}

export function getModel(family: string, slug: string): Model | undefined {
  return getFamilyModels(family).find((m) => m.slug === slug)
}

export function capacitySlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function variantPath(
  model: Model,
  color = model.colors[0],
  capacity = color.capacities[0],
): string {
  return `/${model.family}/${model.slug}/${capacitySlug(capacity.capacity)}-${color.color}`
}

export function getVariant(model: Model, colorSlug: string) {
  return model.colors.find((c) => c.color === colorSlug) ?? model.colors[0]
}

// Índice modelo+color → imagen, para miniaturas donde solo tenemos el nombre
// del color (carrito, comparador, checkout).
const imageByModelColor: Record<string, string> = {}
const colorHexByName: Record<string, string> = {}
allModels.forEach((m) =>
  m.colors.forEach((c) => {
    imageByModelColor[`${m.slug}|${c.name}`] = c.image
    colorHexByName[c.name] = c.hex
  }),
)

export function productImage(modelSlug: string, colorName: string): string | undefined {
  return imageByModelColor[`${modelSlug}|${colorName}`]
}

export function colorHex(name: string): string {
  return colorHexByName[name] ?? '#c9c9cf'
}

export function isProModel(slug: string): boolean {
  return slug.includes('pro')
}

// Familia por defecto en el prototipo.
export const defaultFamilyModels = iphoneModels
