// Datos y utilidades para el comparador esencial y (más adelante) el asistente
// "Encuentra tu Apple". Este módulo es la fuente única para:
//   - qué campos son "esenciales" de decisión en cada familia;
//   - cómo se mapea/normaliza un `model.specs` real al campo esencial;
//   - extractores utilizables como criterios numéricos comparables
//     (precio, capacidad inicial, peso, tamaño de pantalla).
//
// Reglas:
//   - No inventar especificaciones. Si un modelo no expone el dato, el campo
//     debe devolver `null` para que el comparador lo muestre como
//     "No especificado" o lo omita si toda la fila es vacía.
//   - Todo lo derivado del catálogo se considera demostrativo, igual que el
//     resto del prototipo.
//   - Este módulo es puro: sin efectos, sin estado, sin acceso a `window`.

import type { Model } from './types'

export type FamilySlug = 'iphone' | 'mac' | 'ipad' | 'apple-watch' | 'airpods'

// Campos esenciales por familia. El orden es el orden en que se pintan las
// filas del comparador cuando el usuario activa "Mostrar todas".
export const ESSENTIAL_FIELDS: Record<FamilySlug, readonly string[]> = {
  iphone: [
    'Precio',
    'Pantalla',
    'Tamaño de pantalla',
    'Chip',
    'Cámara principal',
    'Zoom',
    'Autonomía',
    'Peso',
    'Capacidad inicial',
    'Uso recomendado',
  ],
  mac: [
    'Precio',
    'Chip',
    'Pantalla',
    'Memoria',
    'Almacenamiento inicial',
    'Autonomía',
    'Peso',
    'Puertos',
    'Uso recomendado',
  ],
  ipad: [
    'Precio',
    'Pantalla',
    'Chip',
    'Apple Pencil',
    'Teclado compatible',
    'Almacenamiento inicial',
    'Peso',
    'Uso recomendado',
  ],
  'apple-watch': [
    'Precio',
    'Tamaño',
    'Autonomía',
    'GPS o Cellular',
    'Sensores principales',
    'Resistencia',
    'Uso recomendado',
  ],
  airpods: [
    'Precio',
    'Cancelación de ruido',
    'Autonomía',
    'Ajuste',
    'Controles',
    'Estuche o carga',
    'Uso recomendado',
  ],
}

// Alias que aceptamos como equivalentes al campo esencial. Nos permite mapear
// etiquetas reales de `model.specs` (que pueden variar por familia) a un mismo
// campo esencial. La comparación se hace en minúsculas y sin acentos.
const FIELD_ALIASES: Record<string, string[]> = {
  Precio: [],
  Pantalla: ['pantalla', 'display'],
  'Tamaño de pantalla': ['tamano de pantalla', 'tamano pantalla', 'tamano'],
  Chip: ['chip', 'procesador', 'inteligencia'],
  'Cámara principal': ['camara principal', 'camara', 'sistema de camaras'],
  Zoom: ['zoom'],
  Autonomía: ['autonomia', 'bateria', 'bateria estimada', 'duracion bateria'],
  Peso: ['peso', 'peso aproximado'],
  'Capacidad inicial': ['capacidad', 'almacenamiento', 'almacenamiento inicial'],
  Memoria: ['memoria', 'ram'],
  'Almacenamiento inicial': ['almacenamiento', 'almacenamiento inicial', 'capacidad'],
  Puertos: ['puertos', 'conectividad'],
  'Apple Pencil': ['apple pencil', 'pencil'],
  'Teclado compatible': ['teclado', 'teclado compatible', 'magic keyboard'],
  Tamaño: ['tamano', 'caja', 'talla'],
  'GPS o Cellular': ['conectividad', 'gps', 'cellular'],
  'Sensores principales': ['sensores', 'salud', 'sensores principales'],
  Resistencia: ['resistencia'],
  'Cancelación de ruido': ['cancelacion de ruido', 'cancelacion', 'noise cancelling'],
  Ajuste: ['ajuste', 'formato'],
  Controles: ['controles'],
  'Estuche o carga': ['estuche', 'carga', 'estuche o carga'],
  Formato: ['formato'],
  Sistema: ['sistema'],
  Inteligencia: ['inteligencia'],
  'Uso recomendado': ['uso recomendado'],
}

// Metadata *interna del prototipo* con orientación de uso recomendado. NO
// pretende ser un dato oficial: se etiqueta como demostrativo en el comparador
// y en el asistente. Cada modelo se anota por su slug (`model.slug`).
export interface ModelDecisionMeta {
  usoRecomendado?: string
}

const MODEL_META: Record<string, ModelDecisionMeta> = {
  // iPhone
  '17-pro-max': { usoRecomendado: 'Fotografía avanzada y máxima autonomía.' },
  '17-pro': { usoRecomendado: 'Uso pro compacto con cámaras avanzadas.' },
  air: { usoRecomendado: 'Diseño ligero para uso diario.' },
  '17': { usoRecomendado: 'Uso cotidiano con muy buena relación calidad-precio.' },

  // Mac
  'macbook-neo': { usoRecomendado: 'Portátil ligero para estudio y ofimática.' },
  'macbook-air-13-m5': { usoRecomendado: 'Portabilidad y uso diario.' },
  'macbook-air-15-m4': { usoRecomendado: 'Pantalla grande y ligereza para trabajo.' },
  'macbook-pro-14-m5': { usoRecomendado: 'Trabajo creativo exigente y portable.' },
  'macbook-pro-16-m4': { usoRecomendado: 'Máxima potencia en formato portátil.' },
  'imac-m4': { usoRecomendado: 'Ordenador de sobremesa con pantalla integrada.' },
  'mac-mini-m4': { usoRecomendado: 'Mac compacto para escritorio ampliable.' },
  'mac-studio-m4': { usoRecomendado: 'Estudio profesional exigente.' },

  // iPad
  'ipad-pro-11-6gen-2025': { usoRecomendado: 'Trabajo creativo y dibujo avanzado.' },
  'ipad-air-11-m4-3gen-2026': { usoRecomendado: 'Estudio, dibujo y edición ligera.' },
  'ipad-mini-7-2024': { usoRecomendado: 'Portabilidad extrema y lectura.' },
  'ipad-11-11gen-2025': { usoRecomendado: 'Uso diario y consumo multimedia.' },

  // Apple Watch
  'watch-ultra-3-2025': { usoRecomendado: 'Deporte y aventura con máxima autonomía.' },
  'watch-series-11': { usoRecomendado: 'Salud, deporte y uso cotidiano.' },
  'watch-serie-11': { usoRecomendado: 'Salud, deporte y uso cotidiano.' },
  'watch-se-3': { usoRecomendado: 'Iniciación al Apple Watch a mejor precio.' },
  'watch-serie-se-3g-gps': { usoRecomendado: 'Iniciación al Apple Watch a mejor precio.' },
  'watch-serie-11-gps': { usoRecomendado: 'Salud, deporte y uso cotidiano.' },

  // AirPods
  'airpods-pro-3': { usoRecomendado: 'Cancelación de ruido para viajes y trabajo.' },
  'airpods-max': { usoRecomendado: 'Audio premium para casa y música.' },
}

// -----------------------------------------------------------------------
// Utilidades de normalización de texto
// -----------------------------------------------------------------------

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function labelMatches(specLabel: string, essentialField: string): boolean {
  const s = normalize(specLabel)
  const e = normalize(essentialField)
  if (s === e) return true
  const aliases = FIELD_ALIASES[essentialField] ?? []
  return aliases.some((a) => normalize(a) === s)
}

// -----------------------------------------------------------------------
// Extractores por campo esencial
// -----------------------------------------------------------------------

export interface DecisionContext {
  model: Model
  capacity: string | null // opcional: capacidad seleccionada por el usuario
  color: string | null
}

/**
 * Devuelve el valor visible ("Chip M4", "48 MP", …) del campo esencial
 * indicado para un modelo. Devuelve `null` si el dato no existe en el
 * catálogo — nunca lo inventamos.
 */
export function getEssentialValue(ctx: DecisionContext, field: string): string | null {
  const { model } = ctx

  // Precio: capacidad seleccionada o precio inicial del modelo.
  if (field === 'Precio') {
    const price = resolvePrice(ctx)
    if (price == null) return null
    return `${formatEuros(price)}`
  }

  if (field === 'Capacidad inicial' || field === 'Almacenamiento inicial') {
    const first = model.colors[0]?.capacities[0]?.capacity
    return first ?? null
  }

  if (field === 'Uso recomendado') {
    const meta = MODEL_META[model.slug]
    return meta?.usoRecomendado ?? null
  }

  const match = model.specs.find((s) => labelMatches(s.label, field))
  return match?.value ?? null
}

/**
 * Devuelve el precio numérico "efectivo" del modelo en el contexto (o el
 * precio inicial si no hay capacidad seleccionada).
 */
export function resolvePrice(ctx: DecisionContext): number | null {
  const { model, capacity } = ctx
  if (capacity) {
    const cap = model.colors[0]?.capacities.find((c) => c.capacity === capacity)
    if (cap) return cap.price
  }
  return model.fromPrice ?? null
}

// Convierte texto tipo "199 g" o "1,55 kg" en gramos (número). Devuelve
// `null` si no hay algo numérico. Usado sólo para el resumen "más ligero".
export function parseWeightGrams(value: string | null | undefined): number | null {
  if (!value) return null
  const match = value.match(/([\d.,]+)\s*(kg|g)?/i)
  if (!match) return null
  const num = parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(num)) return null
  const unit = (match[2] || 'g').toLowerCase()
  return unit === 'kg' ? Math.round(num * 1000) : Math.round(num)
}

// Convierte texto tipo "6,3\"" o "42 mm" a un número comparable en pulgadas.
// Si viene en mm, convierte a pulgadas dividiendo entre 25.4. Devuelve null
// si no hay número.
export function parseScreenInches(value: string | null | undefined): number | null {
  if (!value) return null
  const inch = value.match(/([\d.,]+)\s*(?:"|pulg)/i)
  if (inch) return parseFloat(inch[1].replace(',', '.'))
  const mm = value.match(/([\d.,]+)\s*mm/i)
  if (mm) {
    const n = parseFloat(mm[1].replace(',', '.'))
    return Number.isFinite(n) ? n / 25.4 : null
  }
  return null
}

// Convierte "256GB" o "1TB" en gigas (número). Null si no procede.
export function parseCapacityGB(value: string | null | undefined): number | null {
  if (!value) return null
  const tb = value.match(/([\d.,]+)\s*TB/i)
  if (tb) return Math.round(parseFloat(tb[1].replace(',', '.')) * 1024)
  const gb = value.match(/([\d.,]+)\s*GB/i)
  if (gb) return Math.round(parseFloat(gb[1].replace(',', '.')))
  return null
}

// -----------------------------------------------------------------------
// Reducción del comparador
// -----------------------------------------------------------------------

export interface DecisionRow {
  field: string
  values: (string | null)[]
  allEqual: boolean
  someHasValue: boolean
}

/**
 * Calcula la tabla completa (campo → valores) para un conjunto de contextos.
 * Cuando `onlyDifferences` es true, se omiten filas donde todos los valores
 * tienen datos y son iguales entre sí; también se omiten filas totalmente
 * vacías (nadie tiene valor).
 */
export function buildDecisionRows(
  contexts: DecisionContext[],
  family: FamilySlug,
  { onlyDifferences }: { onlyDifferences: boolean },
): DecisionRow[] {
  const fields = ESSENTIAL_FIELDS[family] ?? []
  const rows: DecisionRow[] = fields.map((field) => {
    const values = contexts.map((ctx) => getEssentialValue(ctx, field))
    const nonNull = values.filter((v): v is string => v != null)
    const someHasValue = nonNull.length > 0
    const allEqual = nonNull.length > 0 && nonNull.every((v) => v === nonNull[0]) && nonNull.length === values.length
    return { field, values, allEqual, someHasValue }
  })

  return rows.filter((row) => {
    if (!row.someHasValue) return false
    if (onlyDifferences && row.allEqual) return false
    return true
  })
}

// -----------------------------------------------------------------------
// Resumen ("Más económico", "Más ligero"…)
// -----------------------------------------------------------------------

export interface DecisionSummary {
  cheapestSlug: string | null
  largestCapacitySlug: string | null
  lightestSlug: string | null
  largestScreenSlug: string | null
}

export function buildDecisionSummary(contexts: DecisionContext[]): DecisionSummary {
  const result: DecisionSummary = {
    cheapestSlug: null,
    largestCapacitySlug: null,
    lightestSlug: null,
    largestScreenSlug: null,
  }
  if (contexts.length < 2) return result

  // Cheapest
  let minPrice = Infinity
  for (const ctx of contexts) {
    const p = resolvePrice(ctx)
    if (p != null && p < minPrice) {
      minPrice = p
      result.cheapestSlug = ctx.model.slug
    }
  }

  // Largest capacity
  let maxCap = -Infinity
  for (const ctx of contexts) {
    const cap = parseCapacityGB(getEssentialValue(ctx, 'Capacidad inicial'))
    if (cap != null && cap > maxCap) {
      maxCap = cap
      result.largestCapacitySlug = ctx.model.slug
    }
  }

  // Lightest — solo si al menos dos tienen peso comparable
  const weights = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    grams: parseWeightGrams(getEssentialValue(ctx, 'Peso')),
  }))
  const weightsWithData = weights.filter((w) => w.grams != null) as { slug: string; grams: number }[]
  if (weightsWithData.length >= 2) {
    weightsWithData.sort((a, b) => a.grams - b.grams)
    result.lightestSlug = weightsWithData[0].slug
  }

  // Largest screen — solo si al menos dos tienen tamaño comparable
  const screens = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    inches: parseScreenInches(
      getEssentialValue(ctx, 'Tamaño de pantalla') ??
        getEssentialValue(ctx, 'Pantalla') ??
        getEssentialValue(ctx, 'Tamaño'),
    ),
  }))
  const screensWithData = screens.filter((s) => s.inches != null) as { slug: string; inches: number }[]
  if (screensWithData.length >= 2) {
    screensWithData.sort((a, b) => b.inches - a.inches)
    result.largestScreenSlug = screensWithData[0].slug
  }

  return result
}

// -----------------------------------------------------------------------
// Auxiliar interno de formato — deja el `€` al final, como el resto de la web
// -----------------------------------------------------------------------

function formatEuros(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}
