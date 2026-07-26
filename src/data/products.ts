import type { CapacityOption, ColorVariant, Family, Model } from './types'

// ------------------------------------------------------------------
// Contenido de ejemplo (apartado 7). Editable, nunca fijo en el código
// de negocio. Todo precio/stock lleva su etiqueta correspondiente.
// Imágenes: fotos reales del CDN de Banana (media.bananacomputer.com),
// descargadas a /public/img/products. Nada inventado.
// ------------------------------------------------------------------

const cap = (
  capacity: string,
  price: number,
  previousPrice: number | null,
  availability: CapacityOption['availability'] = 'disponible',
  availabilityNote?: string,
): CapacityOption => ({ capacity, price, previousPrice, availability, availabilityNote })

// Familias para la home y el mega-menú.
export const families: Family[] = [
  { slug: 'mac', name: 'Mac', tagline: 'Potencia de sobremesa y portátil', fromPrice: 1999 },
  { slug: 'iphone', name: 'iPhone', tagline: 'El iPhone que buscas, al mejor precio en Canarias', fromPrice: 959 },
  { slug: 'ipad', name: 'iPad', tagline: 'Versátil, ligero, para todo', fromPrice: 719 },
  { slug: 'apple-watch', name: 'Watch', tagline: 'Tu salud, en la muñeca', fromPrice: 459 },
  { slug: 'airpods', name: 'AirPods', tagline: 'Sonido sin cables', fromPrice: 279 },
  { slug: 'accesorios', name: 'Accesorios', tagline: 'Fundas, cargadores y más', fromPrice: 29 },
]

const IMG = `${import.meta.env.BASE_URL}img/products`

// Color: helper. `av` describe disponibilidad por capacidad.
type CapSpec = [capacity: string, price: number, prev?: number | null, av?: CapacityOption['availability'], note?: string]
interface ColorSpec {
  slug: string
  name: string
  hex: string
  image: string
  caps: CapSpec[]
}

function buildColors(specs: ColorSpec[]): ColorVariant[] {
  return specs.map((c) => ({
    color: c.slug,
    name: c.name,
    hex: c.hex,
    image: c.image,
    capacities: c.caps.map(([capacity, price, prev = null, av = 'disponible', note]) =>
      cap(capacity, price, prev, av, note),
    ),
  }))
}

// =====================  iPhone  =====================
const iphoneSpecs = (chip: string, screen: string, camera = 'Doble avanzado'): Model['specs'] => [
  { label: 'Pantalla', value: screen },
  { label: 'Chip', value: chip },
  { label: 'Sistema de cámaras', value: camera },
  { label: 'Conector', value: 'USB-C' },
  { label: 'Resistencia', value: 'IP68' },
]

const iphone17Pro: Model = {
  slug: '17-pro',
  family: 'iphone',
  name: 'iPhone 17 Pro',
  tagline: 'Titanio, A19 Pro y el sistema de cámaras más avanzado.',
  fromPrice: 1229,
  financeFrom: { monthly: 51, months: 24 },
  colors: buildColors([
    {
      slug: 'plata', name: 'Plata', hex: '#e3e4e6', image: `${IMG}/17pro-plata.png`,
      caps: [['256GB', 1229, 1446], ['512GB', 1479], ['1TB', 1729, null, 'bajo-pedido', 'Recíbelo en 5-7 días']],
    },
    {
      slug: 'naranja', name: 'Naranja cósmico', hex: '#c8642a', image: `${IMG}/17pro-naranja.png`,
      caps: [['256GB', 1229, 1446], ['512GB', 1479, null, 'bajo-pedido', 'Recíbelo en 5-7 días'], ['1TB', 1729]],
    },
    {
      slug: 'azul', name: 'Azul intenso', hex: '#2b3a52', image: `${IMG}/17pro-azul.png`,
      caps: [['256GB', 1229, 1446], ['512GB', 1479], ['1TB', 1729, null, 'agotado']],
    },
  ]),
  specs: iphoneSpecs('A19 Pro', 'Super Retina XDR 6,3"', 'Pro (triple)'),
  highlights: [
    'Pantalla Super Retina XDR',
    'Chip A19 Pro',
    'Sistema de cámaras Pro',
    'Batería para todo el día',
    'Diseño en titanio',
  ],
}

export const iphoneModels: Model[] = [
  {
    slug: '17-pro-max',
    family: 'iphone',
    name: 'iPhone 17 Pro Max',
    tagline: 'La pantalla más grande y la mayor autonomía.',
    fromPrice: 1479,
    financeFrom: { monthly: 61, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#e3e4e6', image: `${IMG}/17promax-plata.png`, caps: [['256GB', 1479], ['512GB', 1729], ['1TB', 1979]] },
      { slug: 'naranja', name: 'Naranja cósmico', hex: '#c8642a', image: `${IMG}/17promax-naranja.png`, caps: [['256GB', 1479], ['512GB', 1729], ['1TB', 1979, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'azul', name: 'Azul intenso', hex: '#2b3a52', image: `${IMG}/17promax-azul.png`, caps: [['256GB', 1479], ['512GB', 1729], ['1TB', 1979]] },
    ]),
    specs: iphoneSpecs('A19 Pro', 'Super Retina XDR 6,9"', 'Pro (triple)'),
    highlights: ['Pantalla Super Retina XDR', 'Chip A19 Pro', 'Sistema de cámaras Pro', 'Máxima autonomía', 'Diseño en titanio'],
  },
  iphone17Pro,
  {
    slug: 'air',
    family: 'iphone',
    name: 'iPhone Air',
    tagline: 'El iPhone más fino y ligero, con chip A19.',
    fromPrice: 1099,
    financeFrom: { monthly: 46, months: 24 },
    colors: buildColors([
      { slug: 'azul', name: 'Azul cielo', hex: '#a9c3d6', image: `${IMG}/air-azul.png`, caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599]] },
      { slug: 'oro', name: 'Oro claro', hex: '#d8c9a3', image: `${IMG}/air-oro.png`, caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599]] },
      { slug: 'blanco', name: 'Blanco nube', hex: '#ececea', image: `${IMG}/air-blanco.png`, caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599]] },
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/air-negro.png`, caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: iphoneSpecs('A19', 'Super Retina XDR 6,5"'),
    highlights: ['Pantalla Super Retina XDR', 'Chip A19', 'El más fino y ligero', 'Batería para todo el día'],
  },
  {
    slug: '17',
    family: 'iphone',
    name: 'iPhone 17',
    tagline: 'Subidón de color, con el chip A19.',
    fromPrice: 959,
    financeFrom: { monthly: 40, months: 24 },
    colors: buildColors([
      { slug: 'lavanda', name: 'Lavanda', hex: '#b7a7d6', image: `${IMG}/17-lavanda.png`, caps: [['256GB', 959, 1099], ['512GB', 1209]] },
      { slug: 'salvia', name: 'Salvia', hex: '#a7b89a', image: `${IMG}/17-verde.png`, caps: [['256GB', 959, 1099], ['512GB', 1209]] },
      { slug: 'azul', name: 'Azul niebla', hex: '#9db4c7', image: `${IMG}/17-azul.png`, caps: [['256GB', 959, 1099], ['512GB', 1209]] },
      { slug: 'blanco', name: 'Blanco', hex: '#ececea', image: `${IMG}/17-blanco.png`, caps: [['256GB', 959, 1099], ['512GB', 1209]] },
      { slug: 'negro', name: 'Negro', hex: '#2a2a2c', image: `${IMG}/17-negro.png`, caps: [['256GB', 959, 1099], ['512GB', 1209, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: iphoneSpecs('A19', 'Super Retina XDR 6,3"'),
    highlights: ['Pantalla Super Retina XDR', 'Chip A19', 'Cámara avanzada de doble sistema', 'Batería para todo el día'],
  },
]

// =====================  Mac  =====================
export const macModels: Model[] = [
  {
    slug: 'macbook-pro-14',
    family: 'mac',
    name: 'MacBook Pro 14"',
    tagline: 'El chip M5 lleva la potencia y la eficiencia a otro nivel.',
    fromPrice: 1999,
    financeFrom: { monthly: 83, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#e3e4e6', image: `${IMG}/mac-mbp14-plata.png`, caps: [['16 GB · 512 GB', 1999], ['24 GB · 1 TB', 2499], ['36 GB · 1 TB', 2999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/mac-mbp14-negro.png`, caps: [['16 GB · 512 GB', 1999], ['24 GB · 1 TB', 2499], ['36 GB · 1 TB', 2999]] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple M5' },
      { label: 'Pantalla', value: 'Liquid Retina XDR 14,2"' },
      { label: 'Memoria', value: 'Hasta 36 GB' },
      { label: 'Puertos', value: 'Thunderbolt 5, HDMI, SDXC' },
      { label: 'Batería', value: 'Hasta 24 h' },
    ],
    highlights: ['Chip Apple M5', 'Pantalla Liquid Retina XDR', 'Hasta 24 h de batería', 'Thunderbolt 5', 'Cámara Center Stage 12 Mpx'],
  },
]

// =====================  iPad  =====================
export const ipadModels: Model[] = [
  {
    slug: 'ipad-pro-11',
    family: 'ipad',
    name: 'iPad Pro 11" M5',
    tagline: 'La pantalla Ultra Retina XDR y el chip M5, en un iPad increíblemente fino.',
    fromPrice: 1229,
    financeFrom: { monthly: 51, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#e3e4e6', image: `${IMG}/ipad-pro-plata.png`, caps: [['256 GB', 1229], ['512 GB', 1479], ['1 TB', 1979]] },
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/ipad-pro-negro.png`, caps: [['256 GB', 1229], ['512 GB', 1479], ['1 TB', 1979, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple M5' },
      { label: 'Pantalla', value: 'Ultra Retina XDR OLED 11"' },
      { label: 'Autenticación', value: 'Face ID' },
      { label: 'Conector', value: 'Thunderbolt / USB-4' },
      { label: 'Accesorios', value: 'Apple Pencil Pro' },
    ],
    highlights: ['Chip Apple M5', 'Pantalla Ultra Retina XDR OLED', 'Face ID', 'Compatible con Apple Pencil Pro', 'Thunderbolt / USB-4'],
  },
  {
    slug: 'ipad-air-11',
    family: 'ipad',
    name: 'iPad Air 11" M4',
    tagline: 'Ligero, potente y con muchísimo color.',
    fromPrice: 719,
    financeFrom: { monthly: 30, months: 24 },
    colors: buildColors([
      { slug: 'azul', name: 'Azul', hex: '#a9c3d6', image: `${IMG}/ipad-air-azul.png`, caps: [['128 GB', 719], ['256 GB', 869], ['512 GB', 1119]] },
      { slug: 'purpura', name: 'Púrpura', hex: '#b7a7d6', image: `${IMG}/ipad-air-purpura.png`, caps: [['128 GB', 719], ['256 GB', 869], ['512 GB', 1119]] },
      { slug: 'gris', name: 'Gris espacial', hex: '#8e8e93', image: `${IMG}/ipad-air-gris.png`, caps: [['128 GB', 719], ['256 GB', 869], ['512 GB', 1119]] },
      { slug: 'blanco', name: 'Blanco estrella', hex: '#ded9cf', image: `${IMG}/ipad-air-blanco.png`, caps: [['128 GB', 719], ['256 GB', 869], ['512 GB', 1119, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple M4' },
      { label: 'Pantalla', value: 'Liquid Retina 11"' },
      { label: 'Autenticación', value: 'Touch ID' },
      { label: 'Conector', value: 'USB-C' },
      { label: 'Accesorios', value: 'Apple Pencil Pro' },
    ],
    highlights: ['Chip Apple M4', 'Pantalla Liquid Retina', 'Touch ID', 'Compatible con Apple Pencil Pro', 'Ligero y versátil'],
  },
]

// =====================  Apple Watch  =====================
export const watchModels: Model[] = [
  {
    slug: 'watch-series-11',
    family: 'apple-watch',
    name: 'Apple Watch Series 11',
    tagline: 'La pantalla más grande y resistente, con nuevas funciones de salud.',
    fromPrice: 459,
    financeFrom: { monthly: 19, months: 24 },
    colors: buildColors([
      { slug: 'negro', name: 'Aluminio negro azabache', hex: '#1c1c1e', image: `${IMG}/watch-s11-negro.png`, caps: [['42 mm', 459], ['46 mm', 489]] },
      { slug: 'rosa', name: 'Aluminio oro rosa', hex: '#dbb6b0', image: `${IMG}/watch-s11-rosa.png`, caps: [['42 mm', 459], ['46 mm', 489]] },
      { slug: 'plata', name: 'Aluminio plata', hex: '#e3e4e6', image: `${IMG}/watch-s11-plata.png`, caps: [['42 mm', 459], ['46 mm', 489]] },
      { slug: 'gris', name: 'Aluminio gris espacial', hex: '#8e8e93', image: `${IMG}/watch-s11-gris.png`, caps: [['42 mm', 459], ['46 mm', 489, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Pantalla', value: 'Retina LTPO3 siempre activa' },
      { label: 'Chip', value: 'S11 SiP' },
      { label: 'Salud', value: 'ECG, oxígeno en sangre, temperatura' },
      { label: 'Resistencia', value: 'WR50 · IP6X' },
      { label: 'Conectividad', value: 'GPS (opción Cellular)' },
    ],
    highlights: ['Pantalla siempre activa', 'Chip S11', 'ECG y oxígeno en sangre', 'Resistente al agua WR50', 'GPS'],
  },
  {
    slug: 'watch-ultra-3',
    family: 'apple-watch',
    name: 'Apple Watch Ultra 3',
    tagline: 'Titanio, GPS de doble frecuencia y la mayor autonomía.',
    fromPrice: 909,
    financeFrom: { monthly: 38, months: 24 },
    colors: buildColors([
      { slug: 'alpine', name: 'Titanio negro · Correa Alpine', hex: '#3a3a3c', image: `${IMG}/watch-ultra-alpine.png`, caps: [['49 mm', 909]] },
      { slug: 'ocean', name: 'Titanio negro · Correa Ocean', hex: '#2a2a2c', image: `${IMG}/watch-ultra-ocean.png`, caps: [['49 mm', 909]] },
    ]),
    specs: [
      { label: 'Pantalla', value: 'Retina LTPO3, 3000 nits' },
      { label: 'Chip', value: 'S11 SiP' },
      { label: 'Caja', value: 'Titanio 49 mm' },
      { label: 'Resistencia', value: 'WR100 · EN13319' },
      { label: 'Conectividad', value: 'GPS doble frecuencia · Cellular' },
    ],
    highlights: ['Caja de titanio', 'GPS de doble frecuencia', 'Hasta 42 h de batería', 'Resistencia WR100', 'Botón de acción'],
  },
]

// =====================  AirPods  =====================
export const airpodsModels: Model[] = [
  {
    slug: 'airpods-pro-3',
    family: 'airpods',
    name: 'AirPods Pro 3',
    tagline: 'La mejor cancelación de ruido, ahora con sensor de frecuencia cardiaca.',
    fromPrice: 279,
    financeFrom: { monthly: 12, months: 24 },
    colors: buildColors([
      { slug: 'blanco', name: 'Blanco', hex: '#ececec', image: `${IMG}/airpods-pro-hero.png`, caps: [['USB-C', 279]] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple H2' },
      { label: 'Cancelación de ruido', value: 'Activa, mejorada' },
      { label: 'Audio', value: 'Espacial personalizado' },
      { label: 'Salud', value: 'Sensor de frecuencia cardiaca' },
      { label: 'Batería', value: 'Hasta 8 h (30 h con estuche)' },
    ],
    highlights: ['Cancelación activa de ruido', 'Audio Espacial personalizado', 'Sensor de frecuencia cardiaca', 'Chip H2', 'Estuche USB-C'],
  },
  {
    slug: 'airpods-max',
    family: 'airpods',
    name: 'AirPods Max',
    tagline: 'Sonido de altísima fidelidad en unos auriculares de diadema.',
    fromPrice: 579,
    financeFrom: { monthly: 24, months: 24 },
    colors: buildColors([
      { slug: 'medianoche', name: 'Medianoche', hex: '#2c2f36', image: `${IMG}/airpods-max-medianoche.png`, caps: [['USB-C', 579]] },
      { slug: 'azul', name: 'Azul', hex: '#6d92ad', image: `${IMG}/airpods-max-azul.png`, caps: [['USB-C', 579]] },
      { slug: 'purpura', name: 'Púrpura', hex: '#9b8bb4', image: `${IMG}/airpods-max-purpura.png`, caps: [['USB-C', 579]] },
      { slug: 'naranja', name: 'Naranja', hex: '#e08a3c', image: `${IMG}/airpods-max-naranja.png`, caps: [['USB-C', 579]] },
      { slug: 'blanco', name: 'Blanco estrella', hex: '#ece9e2', image: `${IMG}/airpods-max-blanco.png`, caps: [['USB-C', 579, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple H1' },
      { label: 'Cancelación de ruido', value: 'Activa' },
      { label: 'Audio', value: 'Espacial con seguimiento de la cabeza' },
      { label: 'Batería', value: 'Hasta 20 h' },
      { label: 'Conector', value: 'USB-C' },
    ],
    highlights: ['Audio de alta fidelidad', 'Cancelación activa de ruido', 'Audio Espacial', 'Hasta 20 h de batería', 'Diadema de acero y aluminio'],
  },
]

// =====================  Registro por familia  =====================
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

// Familia por defecto en el prototipo
export const defaultFamilyModels = iphoneModels
