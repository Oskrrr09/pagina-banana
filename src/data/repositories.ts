// Repositorios de datos: capa fina de abstracción sobre los arrays
// locales del prototipo.
//
// ¿Por qué existe esto? Cuando Banana Computer conecte una API real
// (o un CMS), lo único que hay que hacer es escribir un
// `ApiProductRepository` que implemente `ProductRepository` y sustituir
// la instancia exportada abajo. La UI y los tests no cambian.
//
// La implementación por defecto (`InMemoryProductRepository` y
// `InMemoryAccessoryRepository`) simplemente envuelve las listas
// estáticas de `./products` y `./accessories`.
//
// Cómo se usa desde un componente:
//   import { productRepo, accessoryRepo } from '../data/repositories'
//   const model = productRepo.get('iphone', '17-pro')

import {
  allModels,
  families,
  getFamilyModels,
  getModel,
} from './products'
import type { Model, Family } from './types'

import {
  appleAccessories,
  getAccessory,
  getAccessoriesByCategory,
  getAccessoriesForFamily,
  getAccessoriesForModel,
} from './accessories'
import type { Accessory, AccessoryCategory } from './accessories'
import type { FamilySlug } from './productDecisionData'

// -----------------------------------------------------------------------------
// Interfaces
// -----------------------------------------------------------------------------

export interface ProductRepository {
  listFamilies(): Family[]
  listAll(): Model[]
  listByFamily(family: string): Model[]
  get(family: string, slug: string): Model | undefined
}

export interface AccessoryRepository {
  listAll(): Accessory[]
  listByCategory(category: AccessoryCategory): Accessory[]
  listForFamily(family: FamilySlug): Accessory[]
  listForModel(modelId: string): Accessory[]
  get(slug: string): Accessory | undefined
}

// -----------------------------------------------------------------------------
// Implementación por defecto (in-memory)
// -----------------------------------------------------------------------------

export class InMemoryProductRepository implements ProductRepository {
  listFamilies(): Family[] {
    return families
  }
  listAll(): Model[] {
    return allModels
  }
  listByFamily(family: string): Model[] {
    return getFamilyModels(family)
  }
  get(family: string, slug: string): Model | undefined {
    return getModel(family, slug)
  }
}

export class InMemoryAccessoryRepository implements AccessoryRepository {
  listAll(): Accessory[] {
    return appleAccessories
  }
  listByCategory(category: AccessoryCategory): Accessory[] {
    return getAccessoriesByCategory(category)
  }
  listForFamily(family: FamilySlug): Accessory[] {
    return getAccessoriesForFamily(family)
  }
  listForModel(modelId: string): Accessory[] {
    return getAccessoriesForModel(modelId)
  }
  get(slug: string): Accessory | undefined {
    return getAccessory(slug)
  }
}

// -----------------------------------------------------------------------------
// Instancias exportadas — punto de swap cuando exista API real
// -----------------------------------------------------------------------------

export const productRepo: ProductRepository = new InMemoryProductRepository()
export const accessoryRepo: AccessoryRepository = new InMemoryAccessoryRepository()
