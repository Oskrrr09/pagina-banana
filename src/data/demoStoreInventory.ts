// Inventario demostrativo por tienda × modelo. Los datos son
// **deterministas** (mismo modelo + tienda → mismo estado) y NO reflejan
// stock real. Toda vista debe etiquetar los valores como "Disponibilidad de
// ejemplo" o "Simulación de stock".
//
// Este módulo NO deriva stock de los horarios ni de la disponibilidad
// global. Es una tabla determinista aparte, pensada para demostrar el
// seguimiento de disponibilidad y las notificaciones internas.

import { stores } from './stores'
import { allModels } from './products'

export type InventoryState = 'disponible' | 'pocas-unidades' | 'no-disponible' | 'bajo-pedido'

export interface InventoryLabel {
  short: string
  long: string
}

export const INVENTORY_LABELS: Record<InventoryState, InventoryLabel> = {
  disponible: {
    short: 'Disponible',
    long: 'Disponibilidad de ejemplo — puede recogerse en tienda.',
  },
  'pocas-unidades': {
    short: 'Pocas unidades',
    long: 'Disponibilidad de ejemplo — quedan pocas unidades.',
  },
  'no-disponible': {
    short: 'No disponible',
    long: 'Simulación de stock — no hay unidades disponibles.',
  },
  'bajo-pedido': {
    short: 'Bajo pedido',
    long: 'Simulación de stock — se traería bajo pedido.',
  },
}

// Genera un estado determinista a partir de la concatenación (store × model).
// Simple hash 32-bit para elegir entre los 4 posibles estados.
function deterministicState(storeSlug: string, modelSlug: string): InventoryState {
  const seed = `${storeSlug}|${modelSlug}`
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const bucket = Math.abs(h) % 10
  // Distribución fija: 4/10 disponible, 3/10 pocas, 2/10 no-disponible,
  // 1/10 bajo-pedido. Reproducible y sin aleatoriedad en tiempo de ejecución.
  if (bucket < 4) return 'disponible'
  if (bucket < 7) return 'pocas-unidades'
  if (bucket < 9) return 'no-disponible'
  return 'bajo-pedido'
}

// Overrides temporales (viven en memoria de ejecución). Sirven para la
// simulación "Simular llegada a tienda" del centro de avisos: pinta la
// disponibilidad de un producto en una tienda concreta como "disponible"
// aunque el mapa determinista dijera otra cosa.
const overrides = new Map<string, InventoryState>()

function overrideKey(storeSlug: string, modelSlug: string) {
  return `${storeSlug}|${modelSlug}`
}

export function getInventoryState(storeSlug: string, modelSlug: string): InventoryState {
  const key = overrideKey(storeSlug, modelSlug)
  return overrides.get(key) ?? deterministicState(storeSlug, modelSlug)
}

export function setInventoryOverride(
  storeSlug: string,
  modelSlug: string,
  state: InventoryState,
) {
  overrides.set(overrideKey(storeSlug, modelSlug), state)
}

export function clearInventoryOverride(storeSlug: string, modelSlug: string) {
  overrides.delete(overrideKey(storeSlug, modelSlug))
}

// Utilidad para debugging / tests: enumera todos los pares con estado.
export function listInventory() {
  const rows: { store: string; model: string; state: InventoryState }[] = []
  for (const store of stores) {
    for (const model of allModels) {
      rows.push({
        store: store.slug,
        model: model.slug,
        state: getInventoryState(store.slug, model.slug),
      })
    }
  }
  return rows
}
