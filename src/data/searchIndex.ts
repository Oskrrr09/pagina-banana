// Índice del buscador (§4.4bis). El objetivo es que Header y /buscar usen
// exactamente el mismo motor y las mismas entradas.
//
// Fuentes automáticas:
//  - `families` (Apple + accesorios genéricos).
//  - `allModels` (dispositivos Apple reales del prototipo).
//  - `services` (servicios comerciales del prototipo).
//  - `supportTopics` (ayuda).
//
// Fuentes explícitas:
//  - `SEARCH_DEMO_ITEMS`: entradas demostrativas (marcas terceras, accesorios
//    Apple concretos, accesorios compatibles). NO participan en catálogo, ni
//    carrito, ni checkout, ni comparador. Se etiquetan siempre como
//    "Contenido demostrativo".
//
// La lógica de normalización, tokenización, sinónimos, fuzzy matching,
// intención y puntuación vive en `lib/catalogSearch.ts`. Este archivo se
// limita a describir los datos.

import { families, allModels, modelsByFamily, variantPath } from './products'
import { services, supportTopics } from './content'
import { appleAccessories, accessoryPath, type Accessory } from './accessories'

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export type SearchItemKind =
  | 'apple-family' // Familia Apple del catálogo (iPhone, Mac, iPad, Watch, AirPods).
  | 'apple-device' // Modelo Apple concreto (iPhone 17 Pro, MacBook Air M4, …).
  | 'apple-accessory' // Accesorio Apple (cable, adaptador, almohadillas, correa…).
  | 'related-product' // Producto relacionado de otra marca (Beats, Sony, Bose…).
  | 'compatible-accessory' // Accesorio compatible de terceros (funda, kit limpieza…).
  | 'service' // Servicio comercial (financiación, envíos, plan renove, seguro…).
  | 'help' // Pregunta/tema de soporte.

export type SearchItemSource = 'catalog' | 'demo' | 'content'

export interface SearchItem {
  id: string
  kind: SearchItemKind
  name: string
  /**
   * Descripción corta (opcional). No debe usarse como fuente principal para el
   * ranking: el buscador prefiere nombre, familia, alias y palabras clave.
   */
  description?: string
  /** Marca comercial (Apple, Beats, Sony, Bose, Genérica…). */
  brand?: string
  /**
   * Familia Apple a la que pertenece o con la que se relaciona (iphone, mac,
   * ipad, apple-watch, airpods, accesorios). Puede quedar vacío para servicios
   * o ayuda no vinculada a una familia concreta.
   */
  family?: string
  /**
   * Categoría semántica (smartphone, laptop, tablet, smartwatch, headphones,
   * airpods-case, charging, watch-band, ear-tips, sleeve, keyboard, pencil,
   * screen-protector, cleaning, magsafe, iphone-case, ipad-case…).
   */
  category?: string
  /** Alias equivalentes al nombre. Se comparan como si fueran el propio nombre. */
  aliases?: string[]
  /** Palabras clave adicionales para matching semántico. */
  keywords?: string[]
  /**
   * Familias Apple con las que este ítem se relaciona (dispositivos con los
   * que un accesorio Apple es compatible, marcas relacionadas para un
   * producto de terceros, etc.).
   */
  relatedTo?: string[]
  /**
   * Categorías Apple con las que el ítem es compatible (`headphones`,
   * `smartphone`, `smartwatch`…). Se usa para colocar accesorios en el orden
   * correcto cuando se busca un dispositivo.
   */
  compatibleWith?: string[]
  /**
   * Ruta interna donde este ítem tiene página real. Cuando falta, la UI
   * renderiza una tarjeta informativa sin enlace.
   */
  route?: string
  /** Imagen local opcional (rutas dentro de public/img). */
  image?: string
  /**
   * Marca demostrativa: `true` cuando el ítem existe únicamente para ilustrar
   * la estructura del buscador. En la UI se pinta como "Contenido demostrativo"
   * y nunca muestra precio, stock ni botón Comprar.
   */
  demo?: boolean
  /** Fuente de datos: 'catalog', 'demo' o 'content'. */
  source: SearchItemSource
}

// -----------------------------------------------------------------------------
// Diccionario de sinónimos y alias
// -----------------------------------------------------------------------------
//
// La normalización aplica minúsculas + sin tildes antes de mirar el diccionario.
// El motor usa `SEARCH_SYNONYMS` para reescribir tokens de la consulta a un
// vocabulario común. No se aplican transformaciones agresivas que puedan
// arruinar consultas legítimas.

export const SEARCH_SYNONYMS: Record<string, string> = {
  'air pods': 'airpods',
  airpod: 'airpods',
  airpodes: 'airpods',
  auriculares: 'headphones',
  cascos: 'headphones',
  earbuds: 'headphones',
  headphone: 'headphones',
  movil: 'iphone',
  telefono: 'iphone',
  smartphone: 'iphone',
  tablet: 'ipad',
  reloj: 'apple-watch',
  smartwatch: 'apple-watch',
  portatil: 'macbook',
  laptop: 'macbook',
  ordenador: 'mac',
  funda: 'case',
  carcasa: 'case',
  protector: 'case',
  cargador: 'charging',
  carga: 'charging',
  cable: 'cable',
  adaptador: 'adapter',
  correa: 'watch-band',
  pulsera: 'watch-band',
  almohadillas: 'ear-tips',
  reparacion: 'support',
  soporte: 'support',
}

// -----------------------------------------------------------------------------
// Vocabulario de intención
// -----------------------------------------------------------------------------

export const ACCESSORY_INTENT_WORDS = new Set([
  'funda', 'carcasa', 'protector', 'cable', 'cargador', 'adaptador', 'correa',
  'pulsera', 'almohadillas', 'estuche', 'limpieza', 'case', 'charging',
  'adapter', 'watch-band', 'ear-tips', 'magsafe', 'sleeve', 'hub', 'keyboard',
  'pencil', 'mouse', 'kit',
])

export const SERVICE_INTENT_WORDS = new Set([
  'reparacion', 'soporte', 'servicio', 'tecnico', 'financiacion', 'seguro',
  'tienda', 'envios', 'envio', 'renove', 'educativo',
])

// -----------------------------------------------------------------------------
// Datos demostrativos separados del catálogo real
// -----------------------------------------------------------------------------
//
// Todo lo que hay aquí es contenido demostrativo. NO se añade a `products.ts`,
// NO participa en checkout, carrito, comparador ni recomendador. La UI del
// buscador debe pintarlo con la etiqueta "Contenido demostrativo" y sin
// precios, stock, financiación ni CTA de compra.

export const SEARCH_DEMO_ITEMS: SearchItem[] = [
  // Productos relacionados (auriculares de otras marcas).
  {
    id: 'demo:beats-solo',
    kind: 'related-product',
    name: 'Auriculares Beats Solo',
    brand: 'Beats',
    category: 'headphones',
    aliases: ['beats solo', 'auriculares beats'],
    keywords: ['auriculares', 'cascos', 'over-ear', 'bluetooth'],
    relatedTo: ['airpods'],
    demo: true,
    source: 'demo',
  },
  {
    id: 'demo:sony-wh',
    kind: 'related-product',
    name: 'Auriculares Sony WH',
    brand: 'Sony',
    category: 'headphones',
    aliases: ['sony wh', 'auriculares sony'],
    keywords: ['auriculares', 'cascos', 'over-ear', 'bluetooth', 'cancelacion'],
    relatedTo: ['airpods'],
    demo: true,
    source: 'demo',
  },
  {
    id: 'demo:bose-qc',
    kind: 'related-product',
    name: 'Auriculares Bose QuietComfort',
    brand: 'Bose',
    category: 'headphones',
    aliases: ['bose', 'auriculares bose', 'quiet comfort'],
    keywords: ['auriculares', 'cascos', 'over-ear', 'bluetooth', 'cancelacion'],
    relatedTo: ['airpods'],
    demo: true,
    source: 'demo',
  },

  // Los accesorios oficiales Apple ya no viven como entradas demo aquí:
  // se generan automáticamente desde `appleAccessories` en `accessoriesToSearchItems`.

  // Accesorios compatibles (terceros).
  {
    id: 'demo:third-airpods-case',
    kind: 'compatible-accessory',
    name: 'Funda protectora para AirPods',
    brand: 'Genérica',
    family: 'accesorios',
    category: 'airpods-case',
    aliases: ['funda airpods', 'carcasa airpods'],
    keywords: ['funda', 'case', 'proteccion', 'silicona'],
    compatibleWith: ['airpods'],
    relatedTo: ['airpods'],
    demo: true,
    source: 'demo',
  },
  {
    id: 'demo:third-airpods-cleankit',
    kind: 'compatible-accessory',
    name: 'Kit de limpieza para auriculares',
    brand: 'Genérica',
    family: 'accesorios',
    category: 'cleaning',
    aliases: ['kit limpieza airpods', 'limpieza auriculares'],
    keywords: ['limpieza', 'cleaning', 'kit', 'brochas'],
    compatibleWith: ['airpods'],
    relatedTo: ['airpods'],
    demo: true,
    source: 'demo',
  },
  {
    id: 'demo:third-airpods-hardcase',
    kind: 'compatible-accessory',
    name: 'Estuche protector para AirPods',
    brand: 'Genérica',
    family: 'accesorios',
    category: 'airpods-case',
    aliases: ['estuche airpods', 'hard case airpods'],
    keywords: ['estuche', 'hard case', 'proteccion'],
    compatibleWith: ['airpods'],
    relatedTo: ['airpods'],
    demo: true,
    source: 'demo',
  },
  {
    id: 'demo:third-iphone-case',
    kind: 'compatible-accessory',
    name: 'Funda transparente para iPhone',
    brand: 'Genérica',
    family: 'accesorios',
    category: 'iphone-case',
    aliases: ['funda iphone', 'carcasa iphone'],
    keywords: ['funda', 'case', 'transparente', 'silicona'],
    compatibleWith: ['iphone'],
    relatedTo: ['iphone'],
    demo: true,
    source: 'demo',
  },
  {
    id: 'demo:third-iphone-screen',
    kind: 'compatible-accessory',
    name: 'Protector de pantalla para iPhone',
    brand: 'Genérica',
    family: 'accesorios',
    category: 'screen-protector',
    aliases: ['protector pantalla iphone', 'cristal templado iphone'],
    keywords: ['protector', 'pantalla', 'cristal', 'templado'],
    compatibleWith: ['iphone'],
    relatedTo: ['iphone'],
    demo: true,
    source: 'demo',
  },
  {
    id: 'demo:third-ipad-case',
    kind: 'compatible-accessory',
    name: 'Funda con soporte para iPad',
    brand: 'Genérica',
    family: 'accesorios',
    category: 'ipad-case',
    aliases: ['funda ipad', 'carcasa ipad'],
    keywords: ['funda', 'case', 'soporte', 'smart'],
    compatibleWith: ['ipad'],
    relatedTo: ['ipad'],
    demo: true,
    source: 'demo',
  },
  {
    id: 'demo:third-mac-sleeve',
    kind: 'compatible-accessory',
    name: 'Funda tipo sleeve para MacBook',
    brand: 'Genérica',
    family: 'accesorios',
    category: 'sleeve',
    aliases: ['funda macbook', 'sleeve macbook'],
    keywords: ['funda', 'sleeve', 'proteccion', 'macbook'],
    compatibleWith: ['mac'],
    relatedTo: ['mac'],
    demo: true,
    source: 'demo',
  },
]

// -----------------------------------------------------------------------------
// Familias Apple: entradas derivadas de `families`
// -----------------------------------------------------------------------------

const FAMILY_META: Record<
  string,
  { aliases: string[]; keywords: string[]; category: string }
> = {
  iphone: {
    aliases: ['iphone', 'iphones', 'iphon', 'iphone apple'],
    keywords: ['smartphone', 'movil', 'telefono', 'apple'],
    category: 'smartphone',
  },
  mac: {
    aliases: ['mac', 'macbook', 'macs', 'ordenador apple'],
    keywords: ['ordenador', 'laptop', 'portatil', 'sobremesa', 'apple'],
    category: 'laptop',
  },
  ipad: {
    aliases: ['ipad', 'tablet apple'],
    keywords: ['tablet', 'ipad', 'apple'],
    category: 'tablet',
  },
  'apple-watch': {
    aliases: ['apple watch', 'watch', 'reloj apple', 'smartwatch apple'],
    keywords: ['reloj', 'smartwatch', 'apple'],
    category: 'smartwatch',
  },
  airpods: {
    aliases: ['airpods', 'air pods', 'airpod', 'auriculares apple', 'cascos apple'],
    keywords: ['auriculares', 'cascos', 'earbuds', 'headphones', 'apple'],
    category: 'headphones',
  },
  accesorios: {
    aliases: ['accesorios', 'accesorio', 'complementos', 'complemento'],
    keywords: ['accesorios', 'complementos', 'accessories'],
    category: 'accessories',
  },
}

function familyItems(): SearchItem[] {
  return families.map((fam) => {
    const meta = FAMILY_META[fam.slug] ?? { aliases: [], keywords: [], category: fam.slug }
    return {
      id: `family:${fam.slug}`,
      kind: 'apple-family' as const,
      name: fam.name,
      description: fam.tagline,
      brand: 'Apple',
      family: fam.slug,
      category: meta.category,
      aliases: meta.aliases,
      keywords: meta.keywords,
      route: modelsByFamily[fam.slug]?.length ? `/${fam.slug}` : undefined,
      source: 'catalog' as const,
    }
  })
}

// -----------------------------------------------------------------------------
// Dispositivos Apple: entradas derivadas de `allModels`
// -----------------------------------------------------------------------------

const FAMILY_CATEGORY: Record<string, string> = {
  iphone: 'smartphone',
  mac: 'laptop',
  ipad: 'tablet',
  'apple-watch': 'smartwatch',
  airpods: 'headphones',
}

function deviceItems(): SearchItem[] {
  return allModels.map((model) => ({
    id: `device:${model.family}/${model.slug}`,
    kind: 'apple-device' as const,
    name: model.name,
    description: model.tagline,
    brand: 'Apple',
    family: model.family,
    category: FAMILY_CATEGORY[model.family] ?? model.family,
    aliases: [model.name, `${model.name} apple`],
    keywords: [model.family, ...(model.name.toLowerCase().split(/\s+/))],
    route: variantPath(model),
    image: model.colors[0]?.image,
    source: 'catalog' as const,
  }))
}

// -----------------------------------------------------------------------------
// Servicios y ayuda
// -----------------------------------------------------------------------------

function serviceItems(): SearchItem[] {
  return services.map((svc) => ({
    id: `service:${svc.slug}`,
    kind: 'service' as const,
    name: svc.name,
    description: svc.line,
    aliases: [svc.name.toLowerCase()],
    keywords: ['servicio', ...svc.name.toLowerCase().split(/\s+/)],
    route: svc.slug === 'plan-renove' ? '/plan-renove' : '/servicios',
    source: 'content' as const,
  }))
}

// -----------------------------------------------------------------------------
// Accesorios oficiales Apple (procedentes de `data/accessories.ts`)
// -----------------------------------------------------------------------------

function accessoryItems(): SearchItem[] {
  return appleAccessories.map((a: Accessory) => {
    const compatibleFamilies = new Set<string>()
    a.compatibility.families?.forEach((f) => compatibleFamilies.add(f))
    a.compatibility.models?.forEach((m) => compatibleFamilies.add(m.split('/')[0]))
    // Familia semántica del ítem: la del accesorio en el catálogo (iphone,
    // ipad, mac, apple-watch, airtag) o "accesorios" para carga y cables.
    const familyForSearch = a.category === 'carga' || a.category === 'airtag'
      ? 'accesorios'
      : a.category
    return {
      id: `accessory:${a.slug}`,
      kind: 'apple-accessory' as const,
      name: a.name,
      description: a.tagline,
      brand: 'Apple',
      family: familyForSearch,
      category: a.category,
      aliases: [...a.aliases, a.name.toLowerCase()],
      keywords: a.keywords,
      relatedTo: Array.from(compatibleFamilies),
      compatibleWith: Array.from(compatibleFamilies),
      route: accessoryPath(a.slug),
      image: a.image,
      demo: false,
      source: 'catalog' as const,
    }
  })
}

function helpItems(): SearchItem[] {
  return supportTopics.flatMap((topic) =>
    topic.items.map((item, idx) => ({
      id: `help:${topic.topic}-${idx}`,
      kind: 'help' as const,
      name: item.q,
      description: item.a,
      keywords: ['ayuda', 'faq', topic.topic.toLowerCase()],
      route: '/soporte',
      source: 'content' as const,
    })),
  )
}

// -----------------------------------------------------------------------------
// Índice completo
// -----------------------------------------------------------------------------

let _index: SearchItem[] | null = null

export function buildSearchIndex(): SearchItem[] {
  if (_index) return _index
  _index = [
    ...familyItems(),
    ...deviceItems(),
    ...accessoryItems(),
    ...SEARCH_DEMO_ITEMS,
    ...serviceItems(),
    ...helpItems(),
  ]
  return _index
}

/** Diccionario de categorías por familia — para colocar accesorios en el orden correcto. */
export const FAMILY_ACCESSORY_CATEGORIES: Record<string, string[]> = {
  iphone: ['iphone-case', 'charging', 'magsafe', 'screen-protector', 'cable', 'adapter'],
  mac: ['sleeve', 'mouse', 'keyboard', 'hub', 'charging', 'cable'],
  ipad: ['ipad-case', 'keyboard', 'pencil', 'charging', 'cable'],
  'apple-watch': ['watch-band', 'charging', 'screen-protector'],
  airpods: ['airpods-case', 'charging', 'ear-tips', 'cleaning', 'cable'],
}
