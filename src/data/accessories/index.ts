// Barrel del catálogo de accesorios.
// Re-exporta tipos, helpers y la lista consolidada `appleAccessories`.
// Ningún consumidor externo tiene que cambiar sus imports: siguen
// funcionando `import { ... } from '../data/accessories'`.
//
// Cómo trabajar aquí → `src/data/README.md`.

import type { FamilySlug } from '../productDecisionData'
import type { Accessory, AccessoryCategory } from './_shared'
import { cargaAccessories } from './carga'
import { iphoneAccessories } from './iphone'
import { ipadAccessories } from './ipad'
import { macAccessories } from './mac'
import { watchAccessories } from './watch'
import { airtagAccessories } from './airtag'

// Re-export de tipos y constantes desde `_shared` (para no romper imports).
export type {
  Accessory,
  AccessoryCategory,
  AccessoryVariant,
  AccessoryImagePresentation,
  AccessorySpec,
  AccessoryCompatibility,
} from './_shared'
export { ACCESSORY_CATEGORIES, VERIFIED_ON } from './_shared'

// Re-export de los arrays por categoría (útil para tests y para futuras
// vistas específicas).
export {
  cargaAccessories,
  iphoneAccessories,
  ipadAccessories,
  macAccessories,
  watchAccessories,
  airtagAccessories,
}

// Lista consolidada. Su orden refleja la secuencia visual del catálogo
// en `/accesorios`: carga y cables → iPhone → iPad → Mac → Apple Watch → AirTag.
export const appleAccessories: Accessory[] = [
  ...cargaAccessories,
  ...iphoneAccessories,
  ...ipadAccessories,
  ...macAccessories,
  ...watchAccessories,
  ...airtagAccessories,
]

// -----------------------------------------------------------------------------
// Helpers de acceso
// -----------------------------------------------------------------------------

const _bySlug: Record<string, Accessory> = Object.create(null)
for (const a of appleAccessories) _bySlug[a.slug] = a

export function getAccessory(slug: string): Accessory | undefined {
  return _bySlug[slug]
}

export function getAccessoriesByCategory(category: AccessoryCategory): Accessory[] {
  return appleAccessories.filter((a) => a.category === category)
}

export function getAccessoriesForFamily(family: FamilySlug): Accessory[] {
  return appleAccessories.filter(
    (a) =>
      a.compatibility.families?.includes(family) ||
      a.compatibility.models?.some((m) => m.startsWith(`${family}/`)),
  )
}

/** `modelId` con formato `familia/slug` (p. ej. `iphone/17-pro`). */
export function getAccessoriesForModel(modelId: string): Accessory[] {
  const [family] = modelId.split('/')
  const exact = appleAccessories.filter((a) =>
    a.compatibility.models?.includes(modelId),
  )
  const familyLevel = appleAccessories.filter(
    (a) =>
      !a.compatibility.models?.includes(modelId) &&
      a.compatibility.families?.includes(family as FamilySlug),
  )
  return [...exact, ...familyLevel]
}

export function accessoryPath(slug: string): string {
  return `/accesorios/${slug}`
}
