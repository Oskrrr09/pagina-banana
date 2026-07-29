// Datos y utilidades del comparador esencial y del futuro asistente
// "Encuentra tu Apple". Este módulo es la fuente única para:
//   - qué campos son "esenciales" de decisión en cada familia;
//   - qué datos específicos por modelo se muestran en cada fila;
//   - utilidades numéricas para comparar precio, capacidad, peso o pantalla.
//
// Reglas de contenido:
//   - `MODEL_META` recoge datos por `model.slug` — chip, cámara, autonomía,
//     peso, materiales, etc. — con la misma etiqueta demostrativa que el
//     resto del prototipo. No sustituye a `model.specs`, que sigue siendo
//     válido: el comparador consulta primero `MODEL_META[slug]` y, si no
//     hay dato, cae a `model.specs`.
//   - Si un campo no existe ni en `MODEL_META` ni en `model.specs`, se
//     devuelve `null` para que la celda muestre "No especificado" y las
//     filas totalmente vacías se omitan.
//   - Nunca se inventan valores en el punto de uso (extractores puros).

import type { Model } from './types'

export type FamilySlug = 'iphone' | 'mac' | 'ipad' | 'apple-watch' | 'airpods'

// Campos esenciales por familia (orden de fila cuando "Mostrar todas").
// Se han elegido pensando en las decisiones más habituales del usuario.
export const ESSENTIAL_FIELDS: Record<FamilySlug, readonly string[]> = {
  iphone: [
    'Precio',
    'Pantalla',
    'Chip',
    'Cámara principal',
    'Zoom óptico',
    'Selfie',
    'Autonomía de vídeo',
    'Peso',
    'Materiales',
    'Resistencia',
    'Puerto',
    'Capacidad inicial',
    'Uso recomendado',
  ],
  mac: [
    'Precio',
    'Chip',
    'CPU / GPU',
    'Memoria unificada',
    'Almacenamiento inicial',
    'Pantalla',
    'Autonomía',
    'Peso',
    'Puertos',
    'Cámara',
    'Uso recomendado',
  ],
  ipad: [
    'Precio',
    'Pantalla',
    'Chip',
    'Apple Pencil',
    'Teclado compatible',
    'Cámara trasera',
    'Almacenamiento inicial',
    'Peso',
    'Autonomía',
    'Uso recomendado',
  ],
  'apple-watch': [
    'Precio',
    'Tamaño de caja',
    'Materiales',
    'Autonomía',
    'Conectividad',
    'Sensores principales',
    'Resistencia',
    'Chip',
    'Uso recomendado',
  ],
  airpods: [
    'Precio',
    'Cancelación de ruido',
    'Chip',
    'Autonomía',
    'Autonomía con estuche',
    'Ajuste',
    'Controles',
    'Resistencia',
    'Uso recomendado',
  ],
}

// Alias que aceptamos como equivalentes al campo esencial. Nos permite mapear
// etiquetas reales de `model.specs` (que pueden variar por familia) a un mismo
// campo esencial. La comparación se hace en minúsculas y sin acentos.
const FIELD_ALIASES: Record<string, string[]> = {
  Precio: [],
  Pantalla: ['pantalla', 'display', 'tamano de pantalla', 'tamano pantalla'],
  Chip: ['chip', 'procesador'],
  'Cámara principal': ['camara principal', 'camaras', 'sistema de camaras', 'camara'],
  'Zoom óptico': ['zoom optico', 'zoom'],
  Selfie: ['selfie', 'camara frontal', 'frontal'],
  'Autonomía de vídeo': [
    'autonomia de video',
    'autonomia de vídeo',
    'autonomia video',
    'bateria',
    'bateria estimada',
  ],
  Autonomía: ['autonomia', 'bateria', 'bateria estimada', 'duracion bateria'],
  'Autonomía con estuche': ['autonomia con estuche', 'autonomia estuche'],
  Peso: ['peso', 'peso aproximado'],
  Materiales: ['materiales', 'material', 'acabado', 'caja'],
  Resistencia: ['resistencia', 'certificacion', 'ip'],
  Puerto: ['puerto', 'usb', 'usb-c', 'lightning'],
  'Capacidad inicial': ['capacidad', 'almacenamiento', 'almacenamiento inicial'],
  'CPU / GPU': ['cpu', 'gpu', 'cpu y gpu', 'nucleos'],
  'Memoria unificada': ['memoria', 'memoria unificada', 'ram'],
  'Almacenamiento inicial': ['almacenamiento', 'almacenamiento inicial', 'capacidad'],
  Puertos: ['puertos', 'conectividad'],
  Cámara: ['camara', 'webcam', 'facetime hd'],
  'Apple Pencil': ['apple pencil', 'pencil'],
  'Teclado compatible': ['teclado', 'teclado compatible', 'magic keyboard'],
  'Cámara trasera': ['camara trasera', 'trasera', 'camara principal'],
  'Tamaño de caja': ['tamano de caja', 'tamano', 'caja', 'talla'],
  Conectividad: ['conectividad', 'gps', 'cellular'],
  'Sensores principales': ['sensores', 'salud', 'sensores principales'],
  'Cancelación de ruido': ['cancelacion de ruido', 'cancelacion', 'noise cancelling'],
  Ajuste: ['ajuste', 'formato'],
  Controles: ['controles'],
  Formato: ['formato'],
  Sistema: ['sistema'],
  Inteligencia: ['inteligencia'],
  'Uso recomendado': ['uso recomendado', 'uso'],
}

// -----------------------------------------------------------------------
// Metadata detallada por modelo (orientación demostrativa del prototipo).
// -----------------------------------------------------------------------
//
// Los datos reflejan lo que el prototipo comunica de cada producto y en
// muchos casos coinciden con la comunicación pública de Apple, pero se
// mantienen bajo la misma etiqueta demostrativa que precios y stock. Si en
// una futura integración Banana Computer confirma cifras oficiales, este
// mapa es el único punto a actualizar.

export interface ModelDecisionMeta {
  usoRecomendado?: string
  fields?: Record<string, string>
}

const MODEL_META: Record<string, ModelDecisionMeta> = {
  // -------------------- iPhone --------------------
  '17-pro-max': {
    usoRecomendado: 'Fotografía profesional y máxima autonomía.',
    fields: {
      Pantalla: 'Super Retina XDR 6,9"',
      Chip: 'A19 Pro',
      'Cámara principal': '48 MP Fusion + 48 MP UW + 48 MP tele',
      'Zoom óptico': 'Hasta 5x · digital 25x',
      Selfie: '18 MP TrueDepth',
      'Autonomía de vídeo': 'Hasta 33 h reproducción',
      Peso: '227 g',
      Materiales: 'Titanio',
      Resistencia: 'IP68',
      Puerto: 'USB-C',
    },
  },
  '17-pro': {
    usoRecomendado: 'Uso pro compacto con cámaras avanzadas.',
    fields: {
      Pantalla: 'Super Retina XDR 6,3"',
      Chip: 'A19 Pro',
      'Cámara principal': '48 MP Fusion + 48 MP UW + 48 MP tele',
      'Zoom óptico': 'Hasta 4x · digital 20x',
      Selfie: '18 MP TrueDepth',
      'Autonomía de vídeo': 'Hasta 27 h reproducción',
      Peso: '199 g',
      Materiales: 'Titanio',
      Resistencia: 'IP68',
      Puerto: 'USB-C',
    },
  },
  air: {
    usoRecomendado: 'Diseño ligero y batería equilibrada para uso diario.',
    fields: {
      Pantalla: 'Super Retina XDR 6,5"',
      Chip: 'A19',
      'Cámara principal': '48 MP Fusion',
      'Zoom óptico': 'Hasta 2x',
      Selfie: '12 MP TrueDepth',
      'Autonomía de vídeo': 'Hasta 22 h reproducción',
      Peso: '165 g',
      Materiales: 'Titanio',
      Resistencia: 'IP68',
      Puerto: 'USB-C',
    },
  },
  '17': {
    usoRecomendado: 'Uso cotidiano con muy buena relación calidad-precio.',
    fields: {
      Pantalla: 'Super Retina XDR 6,3"',
      Chip: 'A19',
      'Cámara principal': '48 MP Fusion',
      'Zoom óptico': 'Hasta 2x',
      Selfie: '12 MP TrueDepth',
      'Autonomía de vídeo': 'Hasta 22 h reproducción',
      Peso: '170 g',
      Materiales: 'Aluminio y vidrio',
      Resistencia: 'IP68',
      Puerto: 'USB-C',
    },
  },

  // -------------------- Mac --------------------
  'macbook-neo': {
    usoRecomendado: 'Portátil ligero para estudio y ofimática.',
    fields: {
      Chip: 'Apple M-series',
      'CPU / GPU': '8 núcleos CPU · 8 núcleos GPU',
      'Memoria unificada': 'Desde 8 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: '13" Retina',
      Autonomía: 'Hasta 18 h',
      Peso: 'Aprox. 1,2 kg',
      Puertos: '2 · Thunderbolt / USB-C',
      Cámara: 'FaceTime HD',
    },
  },
  'macbook-air-13-m5': {
    usoRecomendado: 'Portabilidad y uso diario.',
    fields: {
      Chip: 'M5',
      'CPU / GPU': '10 núcleos CPU · 10 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: 'Liquid Retina 13,6"',
      Autonomía: 'Hasta 18 h',
      Peso: '1,24 kg',
      Puertos: 'MagSafe + 2 Thunderbolt / USB 4',
      Cámara: '12 MP Center Stage',
    },
  },
  'macbook-air-15-m4': {
    usoRecomendado: 'Pantalla grande y ligereza para trabajo.',
    fields: {
      Chip: 'M4',
      'CPU / GPU': '10 núcleos CPU · 10 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: 'Liquid Retina 15,3"',
      Autonomía: 'Hasta 18 h',
      Peso: '1,51 kg',
      Puertos: 'MagSafe + 2 Thunderbolt / USB 4',
      Cámara: '12 MP Center Stage',
    },
  },
  'macbook-pro-14-m5': {
    usoRecomendado: 'Trabajo creativo exigente y portable.',
    fields: {
      Chip: 'M5 Pro',
      'CPU / GPU': 'Hasta 12 núcleos CPU · 18 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '512 GB',
      Pantalla: 'Liquid Retina XDR 14,2"',
      Autonomía: 'Hasta 22 h',
      Peso: '1,55 kg',
      Puertos: 'MagSafe 3 · 3 Thunderbolt 5 · HDMI · SDXC',
      Cámara: '12 MP Center Stage',
    },
  },
  'macbook-pro-16-m4': {
    usoRecomendado: 'Máxima potencia en formato portátil.',
    fields: {
      Chip: 'M4 Pro',
      'CPU / GPU': 'Hasta 14 núcleos CPU · 20 núcleos GPU',
      'Memoria unificada': 'Desde 24 GB',
      'Almacenamiento inicial': '512 GB',
      Pantalla: 'Liquid Retina XDR 16,2"',
      Autonomía: 'Hasta 24 h',
      Peso: '2,14 kg',
      Puertos: 'MagSafe 3 · 3 Thunderbolt 5 · HDMI · SDXC',
      Cámara: '12 MP Center Stage',
    },
  },
  'imac-m4': {
    usoRecomendado: 'Ordenador de sobremesa con pantalla integrada.',
    fields: {
      Chip: 'M4',
      'CPU / GPU': '8-10 núcleos CPU · 8-10 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: '24" Retina 4,5K',
      Autonomía: 'Sobremesa · alimentación por cable',
      Peso: 'Aprox. 4,4 kg',
      Puertos: '2-4 Thunderbolt / USB 4',
      Cámara: '12 MP Center Stage',
    },
  },
  'mac-mini-m4': {
    usoRecomendado: 'Mac compacto para escritorio ampliable.',
    fields: {
      Chip: 'M4 / M4 Pro',
      'CPU / GPU': 'Hasta 12 núcleos CPU · 16 núcleos GPU',
      'Memoria unificada': 'Desde 16 GB',
      'Almacenamiento inicial': '256 GB',
      Pantalla: 'Sin pantalla integrada',
      Autonomía: 'Sobremesa · alimentación por cable',
      Peso: 'Aprox. 0,67 kg',
      Puertos: '3 Thunderbolt · HDMI · 2 USB-C · Ethernet',
      Cámara: 'No incluida',
    },
  },
  'mac-studio-m4': {
    usoRecomendado: 'Estudio profesional exigente.',
    fields: {
      Chip: 'M4 Max / M4 Ultra',
      'CPU / GPU': 'Hasta 32 núcleos CPU · 80 núcleos GPU',
      'Memoria unificada': 'Desde 36 GB',
      'Almacenamiento inicial': '512 GB',
      Pantalla: 'Sin pantalla integrada',
      Autonomía: 'Sobremesa · alimentación por cable',
      Peso: 'Aprox. 2,7 kg',
      Puertos: '4 Thunderbolt 5 · 2 USB-A · HDMI · Ethernet',
      Cámara: 'No incluida',
    },
  },

  // -------------------- iPad --------------------
  'ipad-pro-11-6gen-2025': {
    usoRecomendado: 'Trabajo creativo y dibujo avanzado.',
    fields: {
      Pantalla: 'Ultra Retina XDR OLED 11" o 13"',
      Chip: 'M5',
      'Apple Pencil': 'Apple Pencil Pro',
      'Teclado compatible': 'Magic Keyboard para iPad Pro',
      'Cámara trasera': '12 MP con LiDAR',
      'Almacenamiento inicial': '256 GB',
      Peso: 'Desde 444 g',
      Autonomía: 'Hasta 10 h',
    },
  },
  'ipad-air-11-m4-3gen-2026': {
    usoRecomendado: 'Estudio, dibujo y edición ligera.',
    fields: {
      Pantalla: 'Liquid Retina 11" o 13"',
      Chip: 'M4',
      'Apple Pencil': 'Apple Pencil Pro / USB-C',
      'Teclado compatible': 'Magic Keyboard para iPad Air',
      'Cámara trasera': '12 MP gran angular',
      'Almacenamiento inicial': '128 GB',
      Peso: 'Desde 460 g',
      Autonomía: 'Hasta 10 h',
    },
  },
  'ipad-mini-7-2024': {
    usoRecomendado: 'Portabilidad extrema y lectura.',
    fields: {
      Pantalla: 'Liquid Retina 8,3"',
      Chip: 'A17 Pro',
      'Apple Pencil': 'Apple Pencil Pro / USB-C',
      'Teclado compatible': 'No compatible con Magic Keyboard',
      'Cámara trasera': '12 MP gran angular',
      'Almacenamiento inicial': '128 GB',
      Peso: '293 g',
      Autonomía: 'Hasta 10 h',
    },
  },
  'ipad-11-11gen-2025': {
    usoRecomendado: 'Uso diario y consumo multimedia.',
    fields: {
      Pantalla: 'Liquid Retina 11"',
      Chip: 'A16',
      'Apple Pencil': 'Apple Pencil (USB-C)',
      'Teclado compatible': 'Magic Keyboard Folio',
      'Cámara trasera': '12 MP gran angular',
      'Almacenamiento inicial': '128 GB',
      Peso: '477 g',
      Autonomía: 'Hasta 10 h',
    },
  },

  // -------------------- Apple Watch --------------------
  'watch-ultra-3-2025': {
    usoRecomendado: 'Deporte extremo, buceo y aventura con máxima autonomía.',
    fields: {
      'Tamaño de caja': '49 mm',
      Materiales: 'Titanio',
      Autonomía: 'Hasta 42 h · modo de bajo consumo',
      Conectividad: 'GPS + Cellular',
      'Sensores principales': 'ECG · SpO2 · temperatura · profundidad',
      Resistencia: 'WR100 · IP6X · normas de submarinismo',
      Chip: 'S11 SiP',
    },
  },
  'watch-serie-11-gps': {
    usoRecomendado: 'Salud, deporte y uso cotidiano.',
    fields: {
      'Tamaño de caja': '42 o 46 mm',
      Materiales: 'Aluminio o titanio',
      Autonomía: 'Hasta 24 h · 36 h en bajo consumo',
      Conectividad: 'GPS · opción GPS + Cellular',
      'Sensores principales': 'ECG · SpO2 · temperatura · apnea del sueño',
      Resistencia: 'WR50 · IP6X',
      Chip: 'S11 SiP',
    },
  },
  'watch-series-11': {
    usoRecomendado: 'Salud, deporte y uso cotidiano.',
    fields: {
      'Tamaño de caja': '42 o 46 mm',
      Materiales: 'Aluminio o titanio',
      Autonomía: 'Hasta 24 h · 36 h en bajo consumo',
      Conectividad: 'GPS · opción GPS + Cellular',
      'Sensores principales': 'ECG · SpO2 · temperatura · apnea del sueño',
      Resistencia: 'WR50 · IP6X',
      Chip: 'S11 SiP',
    },
  },
  'watch-serie-se-3g-gps': {
    usoRecomendado: 'Iniciación al Apple Watch a mejor precio.',
    fields: {
      'Tamaño de caja': '40 o 44 mm',
      Materiales: 'Aluminio',
      Autonomía: 'Hasta 18 h',
      Conectividad: 'GPS · opción GPS + Cellular',
      'Sensores principales': 'Frecuencia cardiaca · caídas · choques',
      Resistencia: 'WR50',
      Chip: 'S8 SiP',
    },
  },
  'watch-se-3': {
    usoRecomendado: 'Iniciación al Apple Watch a mejor precio.',
    fields: {
      'Tamaño de caja': '40 o 44 mm',
      Materiales: 'Aluminio',
      Autonomía: 'Hasta 18 h',
      Conectividad: 'GPS · opción GPS + Cellular',
      'Sensores principales': 'Frecuencia cardiaca · caídas · choques',
      Resistencia: 'WR50',
      Chip: 'S8 SiP',
    },
  },

  // -------------------- AirPods --------------------
  'airpods-pro-3': {
    usoRecomendado: 'Cancelación de ruido para viajes y trabajo.',
    fields: {
      'Cancelación de ruido': 'Activa adaptativa · modo Transparencia',
      Chip: 'H2',
      Autonomía: 'Hasta 6 h con ANC · 8 h sin ANC',
      'Autonomía con estuche': 'Hasta 30 h',
      Ajuste: 'Intraural con almohadillas de silicona',
      Controles: 'Sensor táctil · control de volumen',
      Resistencia: 'IP54 (auriculares y estuche)',
    },
  },
  'airpods-max': {
    usoRecomendado: 'Audio premium para casa y música.',
    fields: {
      'Cancelación de ruido': 'Activa · modo Transparencia',
      Chip: 'H1',
      Autonomía: 'Hasta 20 h con ANC',
      'Autonomía con estuche': 'Estuche Smart Case incluido',
      Ajuste: 'Circumaurales · almohadillas de espuma',
      Controles: 'Digital Crown · botón de control de ruido',
      Resistencia: 'Sin certificación IP',
    },
  },
}

// -----------------------------------------------------------------------
// Normalización de texto
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
// Extractores
// -----------------------------------------------------------------------

export interface DecisionContext {
  model: Model
  capacity: string | null
  color: string | null
}

/**
 * Valor visible ("Chip M4", "48 MP", …) del campo esencial pedido:
 *   1. Precio y capacidad inicial → cálculo directo desde el catálogo.
 *   2. `MODEL_META[slug].fields[field]` (datos específicos por modelo).
 *   3. `model.specs` mediante alias normalizados.
 *   4. `null` cuando el dato no existe (nunca se inventa).
 */
export function getEssentialValue(ctx: DecisionContext, field: string): string | null {
  const { model } = ctx

  if (field === 'Precio') {
    const price = resolvePrice(ctx)
    if (price == null) return null
    return formatEuros(price)
  }

  if (field === 'Capacidad inicial' || field === 'Almacenamiento inicial') {
    const meta = MODEL_META[model.slug]?.fields?.[field]
    if (meta) return meta
    const first = model.colors[0]?.capacities[0]?.capacity
    return first ?? null
  }

  if (field === 'Uso recomendado') {
    return MODEL_META[model.slug]?.usoRecomendado ?? null
  }

  const meta = MODEL_META[model.slug]?.fields?.[field]
  if (meta) return meta

  const match = model.specs.find((s) => labelMatches(s.label, field))
  return match?.value ?? null
}

/** Precio numérico del modelo en el contexto (usa `fromPrice` si no hay capacidad). */
export function resolvePrice(ctx: DecisionContext): number | null {
  const { model, capacity } = ctx
  if (capacity) {
    const cap = model.colors[0]?.capacities.find((c) => c.capacity === capacity)
    if (cap) return cap.price
  }
  return model.fromPrice ?? null
}

// "199 g" o "1,55 kg" → gramos
export function parseWeightGrams(value: string | null | undefined): number | null {
  if (!value) return null
  const match = value.match(/([\d.,]+)\s*(kg|g)?/i)
  if (!match) return null
  const num = parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(num)) return null
  const unit = (match[2] || 'g').toLowerCase()
  return unit === 'kg' ? Math.round(num * 1000) : Math.round(num)
}

// '6,3"' o '42 mm' → pulgadas
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

// "256 GB" o "1 TB" → GB
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
    const allEqual =
      nonNull.length > 0 &&
      nonNull.every((v) => v === nonNull[0]) &&
      nonNull.length === values.length
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

  let minPrice = Infinity
  for (const ctx of contexts) {
    const p = resolvePrice(ctx)
    if (p != null && p < minPrice) {
      minPrice = p
      result.cheapestSlug = ctx.model.slug
    }
  }

  let maxCap = -Infinity
  for (const ctx of contexts) {
    const cap = parseCapacityGB(
      getEssentialValue(ctx, 'Capacidad inicial') ??
        getEssentialValue(ctx, 'Almacenamiento inicial'),
    )
    if (cap != null && cap > maxCap) {
      maxCap = cap
      result.largestCapacitySlug = ctx.model.slug
    }
  }

  const weights = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    grams: parseWeightGrams(getEssentialValue(ctx, 'Peso')),
  }))
  const weightsWithData = weights.filter((w) => w.grams != null) as { slug: string; grams: number }[]
  if (weightsWithData.length >= 2) {
    weightsWithData.sort((a, b) => a.grams - b.grams)
    result.lightestSlug = weightsWithData[0].slug
  }

  const screens = contexts.map((ctx) => ({
    slug: ctx.model.slug,
    inches: parseScreenInches(
      getEssentialValue(ctx, 'Pantalla') ?? getEssentialValue(ctx, 'Tamaño de caja'),
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

function formatEuros(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}
