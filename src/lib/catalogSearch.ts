// Motor determinista del buscador (§4.4bis).
//
// Objetivo: dada una consulta, devolver resultados agrupados por sección,
// priorizando coincidencias exactas y respetando la intención (dispositivo /
// accesorio / servicio / ayuda). No usa IA, backend ni dependencias externas.
//
// La misma función `searchCatalog` se usa desde el Header (autocompletado) y
// desde `/buscar` (SearchPage). El índice se construye una única vez.

import {
  ACCESSORY_INTENT_WORDS,
  FAMILY_ACCESSORY_CATEGORIES,
  SEARCH_SYNONYMS,
  SERVICE_INTENT_WORDS,
  buildSearchIndex,
  type SearchItem,
  type SearchItemKind,
} from '../data/searchIndex'

// -----------------------------------------------------------------------------
// Normalización y tokenización
// -----------------------------------------------------------------------------

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[–—]/g, '-') // guiones largos → guión ASCII
    .replace(/[^a-z0-9\s\-]/g, ' ') // limpia puntuación (mantiene letras, dígitos, espacio, guion)
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeSearchText(query)
  if (!normalized) return []
  // Aplicamos multi-word synonyms antes de tokenizar (p. ej. "air pods").
  let expanded = normalized
  for (const [from, to] of Object.entries(SEARCH_SYNONYMS)) {
    if (from.includes(' ')) {
      expanded = expanded.split(from).join(to)
    }
  }
  const tokens = expanded.split(' ').filter(Boolean)
  return tokens.map((tok) => SEARCH_SYNONYMS[tok] ?? tok)
}

// -----------------------------------------------------------------------------
// Fuzzy matching — Levenshtein propio, pequeño, sin dependencias
// -----------------------------------------------------------------------------

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev: number[] = new Array(b.length + 1)
  const curr: number[] = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

/**
 * Devuelve la distancia máxima permitida para considerar dos palabras similares.
 * - Palabras muy cortas (<= 4): no se permite fuzzy.
 * - 5..7: distancia 1.
 * - >= 8: distancia 2.
 */
export function fuzzyThreshold(length: number): number {
  if (length <= 4) return 0
  if (length <= 7) return 1
  return 2
}

// -----------------------------------------------------------------------------
// Intención
// -----------------------------------------------------------------------------

export type SearchIntent = 'device' | 'accessory' | 'service' | 'help' | 'generic'

export function inferSearchIntent(query: string): SearchIntent {
  const tokens = tokenizeSearchQuery(query)
  if (tokens.length === 0) return 'generic'
  for (const tok of tokens) {
    if (ACCESSORY_INTENT_WORDS.has(tok)) return 'accessory'
  }
  for (const tok of tokens) {
    if (SERVICE_INTENT_WORDS.has(tok)) return 'service'
  }
  return 'device'
}

// -----------------------------------------------------------------------------
// Scoring
// -----------------------------------------------------------------------------
//
// Invariantes:
//   - Coincidencia exacta con el nombre > cualquier coincidencia parcial.
//   - En intención accessory, un accesorio exacto puede superar al dispositivo.
//   - En intención device, el dispositivo exacto siempre gana.
//   - Ayuda no desplaza a un producto exacto.
//   - Servicios no desplazan a una coincidencia exacta de catálogo.
//   - Accesorio Apple > accesorio de terceros con relevancia equivalente.
//   - Empates NO se resuelven alfabéticamente.

const SCORE_EXACT_NAME = 1000
const SCORE_EXACT_ALIAS = 950
const SCORE_STARTS_WITH_NAME = 700
const SCORE_ALL_TOKENS_IN_NAME = 500
const SCORE_EXACT_FAMILY_OR_CATEGORY = 400
const SCORE_KEYWORD_STRONG = 250
const SCORE_RELATED_BY_CATEGORY = 160
const SCORE_COMPATIBLE_ACCESSORY = 120
const SCORE_DESCRIPTION_ONLY = 60
const SCORE_HELP_ONLY = 30
const SCORE_FUZZY_PENALTY = 40

/** Puntuación base para un ítem dado una consulta ya tokenizada + normalizada. */
export interface ScoreContext {
  normalizedQuery: string
  tokens: string[]
  intent: SearchIntent
}

export function buildScoreContext(query: string): ScoreContext {
  return {
    normalizedQuery: normalizeSearchText(query),
    tokens: tokenizeSearchQuery(query),
    intent: inferSearchIntent(query),
  }
}

function tokensMatch(text: string, tokens: string[]): {
  starts: boolean
  allIn: boolean
  someIn: boolean
} {
  const normText = normalizeSearchText(text)
  const wordSet = new Set(normText.split(' '))
  let allIn = tokens.length > 0
  let someIn = false
  for (const tok of tokens) {
    if (wordSet.has(tok) || normText.includes(tok)) {
      someIn = true
    } else {
      allIn = false
    }
  }
  return {
    starts: normText.startsWith(tokens.join(' ')),
    allIn,
    someIn,
  }
}

function tokensFuzzyMatchWord(word: string, tokens: string[]): boolean {
  for (const tok of tokens) {
    if (tok.length < 5) continue
    const dist = levenshtein(tok, word)
    if (dist <= fuzzyThreshold(Math.max(tok.length, word.length))) {
      return true
    }
  }
  return false
}

export function scoreSearchItem(item: SearchItem, ctx: ScoreContext): number {
  const { normalizedQuery, tokens } = ctx
  if (!normalizedQuery || tokens.length === 0) return 0

  let score = 0
  const nameNorm = normalizeSearchText(item.name)
  const aliasesNorm = (item.aliases ?? []).map(normalizeSearchText)

  // 1. Coincidencia exacta con nombre o alias.
  if (nameNorm === normalizedQuery) {
    score = Math.max(score, SCORE_EXACT_NAME)
  } else if (aliasesNorm.includes(normalizedQuery)) {
    score = Math.max(score, SCORE_EXACT_ALIAS)
  }

  // 1b. Coincidencia exacta con la consulta tokenizada (soporta "air pods" → "airpods").
  const tokenJoined = tokens.join(' ')
  if (score < SCORE_EXACT_ALIAS && (nameNorm === tokenJoined || aliasesNorm.includes(tokenJoined))) {
    score = Math.max(score, SCORE_EXACT_ALIAS)
  }

  const nameMatch = tokensMatch(item.name, tokens)
  const anyAliasMatch = (item.aliases ?? []).map((a) => tokensMatch(a, tokens))

  // 2. Empieza por la consulta.
  if (score < SCORE_STARTS_WITH_NAME && nameMatch.starts) {
    score = Math.max(score, SCORE_STARTS_WITH_NAME)
  }

  // 3. Todos los tokens en el nombre.
  if (score < SCORE_ALL_TOKENS_IN_NAME && (nameMatch.allIn || anyAliasMatch.some((m) => m.allIn))) {
    score = Math.max(score, SCORE_ALL_TOKENS_IN_NAME)
  }

  // 4. Coincidencia con familia/categoría.
  if (item.family && tokens.includes(normalizeSearchText(item.family))) {
    score = Math.max(score, SCORE_EXACT_FAMILY_OR_CATEGORY)
  }
  if (item.category && tokens.includes(normalizeSearchText(item.category))) {
    score = Math.max(score, SCORE_EXACT_FAMILY_OR_CATEGORY)
  }

  // 5. Palabras clave.
  const kwSet = new Set((item.keywords ?? []).map(normalizeSearchText))
  const strongKw = tokens.filter((t) => kwSet.has(t)).length
  if (strongKw > 0) {
    score = Math.max(score, SCORE_KEYWORD_STRONG + strongKw * 10)
  }

  // 6. Producto relacionado por categoría (misma category que un dispositivo).
  if (item.kind === 'related-product' && item.category) {
    const catNorm = normalizeSearchText(item.category)
    if (tokens.includes(catNorm)) {
      score = Math.max(score, SCORE_RELATED_BY_CATEGORY)
    }
  }

  // 7. Accesorio compatible con familia buscada.
  const wantsFamily = tokens.find((t) => ['iphone', 'mac', 'macbook', 'ipad', 'apple-watch', 'airpods'].includes(t))
  if (wantsFamily && item.compatibleWith?.includes(wantsFamily === 'macbook' ? 'mac' : wantsFamily)) {
    score = Math.max(score, SCORE_COMPATIBLE_ACCESSORY + (item.brand === 'Apple' ? 20 : 0))
  }

  // 8. Coincidencia solo en descripción.
  if (score === 0 && item.description) {
    const descNorm = normalizeSearchText(item.description)
    let hit = 0
    for (const t of tokens) if (descNorm.includes(t)) hit++
    if (hit === tokens.length) score = Math.max(score, SCORE_DESCRIPTION_ONLY)
  }

  // 9. Fuzzy suave sobre nombre/alias (solo si aún no hay coincidencia fuerte).
  if (score < SCORE_ALL_TOKENS_IN_NAME) {
    const words = new Set([...nameNorm.split(' '), ...aliasesNorm.flatMap((a) => a.split(' '))])
    for (const w of words) {
      if (tokensFuzzyMatchWord(w, tokens)) {
        score = Math.max(score, SCORE_ALL_TOKENS_IN_NAME - SCORE_FUZZY_PENALTY)
        break
      }
    }
  }

  // 10. Intento por intención — la ayuda no debe desplazar a productos.
  if (item.kind === 'help' && score < SCORE_KEYWORD_STRONG) {
    score = Math.min(score, SCORE_HELP_ONLY)
  }

  return score
}

// -----------------------------------------------------------------------------
// Corrección ortográfica ("Quizá querías decir…")
// -----------------------------------------------------------------------------

const KNOWN_TERMS = [
  'airpods', 'iphone', 'ipad', 'mac', 'macbook', 'apple', 'watch',
  'auriculares', 'cascos', 'funda', 'cargador', 'cable', 'adaptador', 'correa',
  'magsafe', 'beats', 'sony', 'bose',
]

/**
 * Devuelve la sugerencia canónica cuando la consulta parece un typo cercano de
 * un término conocido, o `null` si no hay corrección clara.
 */
export function suggestCorrection(query: string): string | null {
  const tokens = tokenizeSearchQuery(query)
  if (tokens.length === 0) return null
  const first = tokens[0]
  if (first.length < 5) return null

  // Si el token ya es un término conocido no hay corrección.
  if (KNOWN_TERMS.includes(first)) return null

  const threshold = fuzzyThreshold(first.length)
  let best: { term: string; dist: number } | null = null
  for (const term of KNOWN_TERMS) {
    const dist = levenshtein(first, term)
    if (dist <= threshold && (best === null || dist < best.dist)) {
      best = { term, dist }
    }
  }
  if (!best) return null
  return best.term === 'airpods' ? 'AirPods' : best.term
}

// -----------------------------------------------------------------------------
// Ordenación y agrupación
// -----------------------------------------------------------------------------

interface Scored {
  item: SearchItem
  score: number
  originalIndex: number
}

const SECTION_PRIORITY_FOR_DEVICE: SearchItemKind[] = [
  'apple-family',
  'apple-device',
  'related-product',
  'apple-accessory',
  'compatible-accessory',
  'service',
  'help',
]

const SECTION_PRIORITY_FOR_ACCESSORY: SearchItemKind[] = [
  'apple-accessory',
  'compatible-accessory',
  'apple-device',
  'apple-family',
  'related-product',
  'service',
  'help',
]

function sectionRank(kind: SearchItemKind, intent: SearchIntent): number {
  const table =
    intent === 'accessory'
      ? SECTION_PRIORITY_FOR_ACCESSORY
      : SECTION_PRIORITY_FOR_DEVICE
  const idx = table.indexOf(kind)
  return idx === -1 ? table.length : idx
}

function compareScored(a: Scored, b: Scored, intent: SearchIntent): number {
  if (a.score !== b.score) return b.score - a.score
  // Desempate: sección según intención.
  const ra = sectionRank(a.item.kind, intent)
  const rb = sectionRank(b.item.kind, intent)
  if (ra !== rb) return ra - rb
  // Apple gana a genérica.
  const brandA = a.item.brand === 'Apple' ? 0 : 1
  const brandB = b.item.brand === 'Apple' ? 0 : 1
  if (brandA !== brandB) return brandA - brandB
  // Orden estable original.
  return a.originalIndex - b.originalIndex
}

// -----------------------------------------------------------------------------
// Resultado
// -----------------------------------------------------------------------------

export interface SearchResults {
  query: string
  correction: string | null
  intent: SearchIntent
  exactMatch: SearchItem | null
  appleDevices: SearchItem[]
  relatedProducts: SearchItem[]
  appleAccessories: SearchItem[]
  compatibleAccessories: SearchItem[]
  services: SearchItem[]
  help: SearchItem[]
  total: number
}

export function emptySearchResults(query: string): SearchResults {
  return {
    query,
    correction: null,
    intent: 'generic',
    exactMatch: null,
    appleDevices: [],
    relatedProducts: [],
    appleAccessories: [],
    compatibleAccessories: [],
    services: [],
    help: [],
    total: 0,
  }
}

export function searchCatalog(query: string): SearchResults {
  const q = query.trim()
  if (!q) return emptySearchResults('')

  const ctx = buildScoreContext(q)
  const index = buildSearchIndex()

  const scored: Scored[] = []
  index.forEach((item, i) => {
    const score = scoreSearchItem(item, ctx)
    if (score > 0) scored.push({ item, score, originalIndex: i })
  })

  scored.sort((a, b) => compareScored(a, b, ctx.intent))

  // exactMatch: primer resultado si es coincidencia exacta con el nombre o alias.
  const first = scored[0]
  const isExact = first && first.score >= SCORE_EXACT_ALIAS
  const exactMatch = isExact ? first.item : null
  const exactId = exactMatch?.id ?? null

  const seen = new Set<string>()
  if (exactId) seen.add(exactId)

  const bucket = (kind: SearchItemKind): SearchItem[] =>
    scored
      .filter((s) => s.item.kind === kind && !seen.has(s.item.id))
      .map((s) => {
        seen.add(s.item.id)
        return s.item
      })

  // Familia + dispositivos van juntos en "Dispositivos Apple". Metemos primero
  // familia (si aplica) y después dispositivos. Ambos comparten sección visual.
  const familyItems = bucket('apple-family')
  const deviceItems = bucket('apple-device')
  const appleDevices = [...familyItems, ...deviceItems]

  const results: SearchResults = {
    query: q,
    correction: exactMatch ? null : suggestCorrection(q),
    intent: ctx.intent,
    exactMatch,
    appleDevices,
    relatedProducts: bucket('related-product'),
    appleAccessories: bucket('apple-accessory'),
    compatibleAccessories: bucket('compatible-accessory'),
    services: bucket('service'),
    help: bucket('help'),
    total: 0,
  }

  results.total =
    (exactMatch ? 1 : 0) +
    results.appleDevices.length +
    results.relatedProducts.length +
    results.appleAccessories.length +
    results.compatibleAccessories.length +
    results.services.length +
    results.help.length

  // Reordena la sección principal según intención cuando hay coincidencia
  // exacta de accesorio: la coincidencia exacta ya está en `exactMatch`,
  // el resto de accesorios debe ir antes que los dispositivos.
  return results
}

/**
 * Recorta cada sección al límite indicado y devuelve un nuevo resultado.
 * Útil para el autocompletado del Header, que muestra un panel compacto.
 */
export function limitSearchResults(
  results: SearchResults,
  limits: {
    appleDevices?: number
    relatedProducts?: number
    appleAccessories?: number
    compatibleAccessories?: number
    services?: number
    help?: number
  },
): SearchResults {
  const clone: SearchResults = { ...results }
  if (limits.appleDevices != null) {
    clone.appleDevices = results.appleDevices.slice(0, limits.appleDevices)
  }
  if (limits.relatedProducts != null) {
    clone.relatedProducts = results.relatedProducts.slice(0, limits.relatedProducts)
  }
  if (limits.appleAccessories != null) {
    clone.appleAccessories = results.appleAccessories.slice(0, limits.appleAccessories)
  }
  if (limits.compatibleAccessories != null) {
    clone.compatibleAccessories = results.compatibleAccessories.slice(0, limits.compatibleAccessories)
  }
  if (limits.services != null) {
    clone.services = results.services.slice(0, limits.services)
  }
  if (limits.help != null) {
    clone.help = results.help.slice(0, limits.help)
  }
  clone.total =
    (clone.exactMatch ? 1 : 0) +
    clone.appleDevices.length +
    clone.relatedProducts.length +
    clone.appleAccessories.length +
    clone.compatibleAccessories.length +
    clone.services.length +
    clone.help.length
  return clone
}

// Re-export mínimo para tests puros. Consumidores externos usan `searchCatalog`
// como punto de entrada; el resto solo se expone para poder validarlo.
export { FAMILY_ACCESSORY_CATEGORIES }
