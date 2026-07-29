import type { CapacityOption, ColorVariant, Family, Model } from './types'

// ------------------------------------------------------------------
// Contenido de ejemplo (apartado 7). Editable, nunca fijo en el código
// de negocio. Todo precio/stock lleva su etiqueta correspondiente.
// Imágenes: recursos de producto publicados por distribuidores Apple y
// descargados a /public/img/products. Nada se presenta como catálogo oficial.
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
  { slug: 'mac', name: 'Mac', tagline: 'Potencia de sobremesa y portátil', fromPrice: 719 },
  { slug: 'iphone', name: 'iPhone', tagline: 'El iPhone que buscas, al mejor precio en Canarias', fromPrice: 959 },
  { slug: 'ipad', name: 'iPad', tagline: 'Versátil, ligero, para todo', fromPrice: 409 },
  { slug: 'apple-watch', name: 'Watch', tagline: 'Tu salud, en la muñeca', fromPrice: 279 },
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
  imageBg?: string
  caps: CapSpec[]
}

function buildColors(specs: ColorSpec[]): ColorVariant[] {
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
      slug: 'plata', name: 'Plata', hex: '#e3e4e6', image: `${IMG}/17pro-plata.webp`,
      caps: [['256GB', 1229, 1446], ['512GB', 1479], ['1TB', 1729, null, 'bajo-pedido', 'Recíbelo en 5-7 días']],
    },
    {
      slug: 'naranja', name: 'Naranja cósmico', hex: '#c8642a', image: `${IMG}/17pro-naranja.webp`,
      caps: [['256GB', 1229, 1446], ['512GB', 1479, null, 'bajo-pedido', 'Recíbelo en 5-7 días'], ['1TB', 1729]],
    },
    {
      slug: 'azul', name: 'Azul intenso', hex: '#2b3a52', image: `${IMG}/17pro-azul.webp`,
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
      { slug: 'plata', name: 'Plata', hex: '#e3e4e6', image: `${IMG}/17promax-plata.webp`, caps: [['256GB', 1479], ['512GB', 1729], ['1TB', 1979]] },
      { slug: 'naranja', name: 'Naranja cósmico', hex: '#c8642a', image: `${IMG}/17promax-naranja.webp`, caps: [['256GB', 1479], ['512GB', 1729], ['1TB', 1979, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'azul', name: 'Azul intenso', hex: '#2b3a52', image: `${IMG}/17promax-azul.webp`, caps: [['256GB', 1479], ['512GB', 1729], ['1TB', 1979]] },
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
      { slug: 'azul', name: 'Azul cielo', hex: '#a9c3d6', image: `${IMG}/air-azul.webp`, caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599]] },
      { slug: 'oro', name: 'Oro claro', hex: '#d8c9a3', image: `${IMG}/air-oro.webp`, caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599]] },
      { slug: 'blanco', name: 'Blanco nube', hex: '#ececea', image: `${IMG}/air-blanco.webp`, caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599]] },
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/air-negro.webp`, caps: [['256GB', 1099], ['512GB', 1349], ['1TB', 1599, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
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
      { slug: 'lavanda', name: 'Lavanda', hex: '#b7a7d6', image: `${IMG}/17-lavanda.webp`, caps: [['256GB', 959, 1099], ['512GB', 1209]] },
      { slug: 'salvia', name: 'Salvia', hex: '#a7b89a', image: `${IMG}/17-verde.webp`, caps: [['256GB', 959, 1099], ['512GB', 1209]] },
      { slug: 'azul', name: 'Azul niebla', hex: '#9db4c7', image: `${IMG}/17-azul.webp`, caps: [['256GB', 959, 1099], ['512GB', 1209]] },
      { slug: 'blanco', name: 'Blanco', hex: '#ececea', image: `${IMG}/17-blanco.webp`, caps: [['256GB', 959, 1099], ['512GB', 1209]] },
      { slug: 'negro', name: 'Negro', hex: '#2a2a2c', image: `${IMG}/17-negro.webp`, caps: [['256GB', 959, 1099], ['512GB', 1209, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: iphoneSpecs('A19', 'Super Retina XDR 6,3"'),
    highlights: ['Pantalla Super Retina XDR', 'Chip A19', 'Cámara avanzada de doble sistema', 'Batería para todo el día'],
  },
]

// =====================  Mac  =====================
const macSpecs = (chip: string, format: string, memory: string): Model['specs'] => [
  { label: 'Chip', value: chip },
  { label: 'Formato', value: format },
  { label: 'Memoria', value: memory },
  { label: 'Sistema', value: 'macOS' },
  { label: 'Inteligencia', value: 'Compatible con Apple Intelligence' },
]

export const macModels: Model[] = [
  {
    slug: 'macbook-neo',
    family: 'mac',
    name: 'MacBook Neo',
    tagline: 'Un Mac ligero y accesible para estudiar, crear y trabajar cada día.',
    fromPrice: 749,
    financeFrom: { monthly: 32, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/macbook-neo-plata.webp`, caps: [['8 GB · 256 GB', 749], ['8 GB · 512 GB', 999]] },
      { slug: 'citrico', name: 'Cítrico', hex: '#d0c875', image: `${IMG}/macbook-neo-citrico.webp`, caps: [['8 GB · 256 GB', 749], ['8 GB · 512 GB', 999]] },
      { slug: 'rosa-nube', name: 'Rosa nube', hex: '#e8bfc4', image: `${IMG}/macbook-neo-rosa-nube.webp`, caps: [['8 GB · 256 GB', 749], ['8 GB · 512 GB', 999]] },
      { slug: 'indigo', name: 'Índigo', hex: '#6b7ab8', image: `${IMG}/macbook-neo-indigo.webp`, caps: [['8 GB · 256 GB', 749], ['8 GB · 512 GB', 999]] },
    ]),
    specs: macSpecs('Apple Silicon', 'Portátil de 13"', '8 o 16 GB'),
    highlights: ['Diseño ligero', 'Pantalla de 13 pulgadas', 'Autonomía para todo el día', 'Touch ID', 'macOS'],
  },
  {
    slug: 'macbook-air-m4',
    family: 'mac',
    name: 'MacBook Air M4',
    tagline: 'Diseño ultrafino, gran autonomía y potencia M4 para todo el día.',
    fromPrice: 1119,
    financeFrom: { monthly: 47, months: 24 },
    colors: buildColors([
      { slug: 'medianoche', name: 'Medianoche', hex: '#2c3138', image: `${IMG}/macbook-air-medianoche.webp`, caps: [['13" · 16 GB · 256 GB', 1119, 1199], ['13" · 16 GB · 512 GB', 1369], ['15" · 16 GB · 256 GB', 1299, 1379], ['15" · 16 GB · 512 GB', 1549]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/macbook-air-plata.webp`, caps: [['13" · 16 GB · 256 GB', 1119, 1199], ['13" · 16 GB · 512 GB', 1369], ['15" · 16 GB · 256 GB', 1299, 1379], ['15" · 16 GB · 512 GB', 1549]] },
      { slug: 'blanco-estrella', name: 'Blanco estrella', hex: '#ded8ca', image: `${IMG}/macbook-air-blanco-estrella.webp`, caps: [['13" · 16 GB · 256 GB', 1119, 1199], ['13" · 16 GB · 512 GB', 1369], ['15" · 16 GB · 256 GB', 1299, 1379], ['15" · 16 GB · 512 GB', 1549]] },
      { slug: 'azul-cielo', name: 'Azul cielo', hex: '#a9c3d6', image: `${IMG}/macbook-air-skyblue.webp`, caps: [['13" · 16 GB · 256 GB', 1119, 1199], ['13" · 16 GB · 512 GB', 1369], ['15" · 16 GB · 256 GB', 1299, 1379], ['15" · 16 GB · 512 GB', 1549]] },
    ]),
    specs: macSpecs('Apple M4', 'Portátil de 13" o 15"', '16 GB'),
    highlights: ['Chip Apple M4', 'Dos tamaños', 'Diseño sin ventilador', 'Hasta 18 h de autonomía', 'MagSafe'],
  },
  {
    slug: 'macbook-pro-m4',
    family: 'mac',
    name: 'MacBook Pro M4',
    tagline: 'Rendimiento profesional M4 y pantalla Liquid Retina XDR.',
    fromPrice: 1699,
    financeFrom: { monthly: 71, months: 24 },
    colors: buildColors([
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/mac-mbp14-negro.webp`, caps: [['14" · 16 GB · 512 GB', 1699, 1899], ['16" · 24 GB · 512 GB', 2699]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/mac-mbp14-plata.webp`, caps: [['14" · 16 GB · 512 GB', 1699, 1899], ['16" · 24 GB · 512 GB', 2699]] },
    ]),
    specs: macSpecs('Apple M4', 'Portátil de 14" o 16"', 'Desde 16 GB'),
    highlights: ['Chip Apple M4', 'Pantalla Liquid Retina XDR', 'Hasta 24 h de batería', 'HDMI y SDXC', 'MagSafe'],
  },
  {
    slug: 'macbook-air-m5',
    family: 'mac',
    name: 'MacBook Air M5',
    tagline: 'El portátil fino y ligero de Apple, ahora superpotenciado con M5.',
    fromPrice: 1319,
    financeFrom: { monthly: 55, months: 24 },
    colors: buildColors([
      { slug: 'azul-cielo', name: 'Azul cielo', hex: '#a9c3d6', image: `${IMG}/macbook-air-skyblue.webp`, caps: [['13" · 16 GB · 512 GB', 1319], ['13" · 24 GB · 512 GB', 1579], ['15" · 16 GB · 512 GB', 1579, 1649], ['15" · 24 GB · 512 GB', 1849]] },
      { slug: 'medianoche', name: 'Medianoche', hex: '#2c3138', image: `${IMG}/macbook-air-medianoche.webp`, caps: [['13" · 16 GB · 512 GB', 1319], ['13" · 24 GB · 512 GB', 1579], ['15" · 16 GB · 512 GB', 1579, 1649], ['15" · 24 GB · 512 GB', 1849]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/macbook-air-plata.webp`, caps: [['13" · 16 GB · 512 GB', 1319], ['13" · 24 GB · 512 GB', 1579], ['15" · 16 GB · 512 GB', 1579, 1649], ['15" · 24 GB · 512 GB', 1849]] },
      { slug: 'blanco-estrella', name: 'Blanco estrella', hex: '#ded8ca', image: `${IMG}/macbook-air-blanco-estrella.webp`, caps: [['13" · 16 GB · 512 GB', 1319], ['13" · 24 GB · 512 GB', 1579], ['15" · 16 GB · 512 GB', 1579, 1649], ['15" · 24 GB · 512 GB', 1849]] },
    ]),
    specs: macSpecs('Apple M5', 'Portátil de 13" o 15"', '16 GB'),
    highlights: ['Chip Apple M5', 'Dos tamaños', 'Hasta 18 h de autonomía', 'Apple Intelligence', 'MagSafe'],
  },
  {
    slug: 'macbook-pro-m5',
    family: 'mac',
    name: 'MacBook Pro M5',
    tagline: 'Potencia profesional de nueva generación para los proyectos más exigentes.',
    fromPrice: 1839,
    financeFrom: { monthly: 77, months: 24 },
    colors: buildColors([
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/macbook-pro-m5-negro-16.webp`, caps: [['14" · 16 GB · 1 TB', 1839, 2119], ['16" · 24 GB · 1 TB', 2999]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/macbook-pro-m5-plata-14.webp`, caps: [['14" · 16 GB · 1 TB', 1839, 2119], ['16" · 24 GB · 1 TB', 2999]] },
    ]),
    specs: macSpecs('Apple M5', 'Portátil de 14" o 16"', 'Desde 16 GB'),
    highlights: ['Chip Apple M5', 'Pantalla Liquid Retina XDR', 'Rendimiento profesional', 'Thunderbolt', 'Hasta 24 h de batería'],
  },
  {
    slug: 'imac-24-m4',
    family: 'mac',
    name: 'iMac 24" M4',
    tagline: 'Todo en uno. Todo color. Una pantalla Retina 4,5K espectacular.',
    fromPrice: 1499,
    financeFrom: { monthly: 63, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/imac-24-m4-plata.webp`, imageBg: '#e8e8ec', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'azul', name: 'Azul', hex: '#7babcd', image: `${IMG}/imac-24-m4-azul.webp`, imageBg: '#bdd5e8', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'verde', name: 'Verde', hex: '#6aaa8a', image: `${IMG}/imac-24-m4-verde.webp`, imageBg: '#b4d4c4', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'rosa', name: 'Rosa', hex: '#e0929f', image: `${IMG}/imac-24-m4-rosa.webp`, imageBg: '#efc8cf', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'amarillo', name: 'Amarillo', hex: '#f5c842', image: `${IMG}/imac-24-m4-amarillo.webp`, imageBg: '#fae3a0', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'naranja', name: 'Naranja', hex: '#df7944', image: `${IMG}/imac-24-m4-naranja.webp`, imageBg: '#efbca1', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'morado', name: 'Morado', hex: '#9b86bd', image: `${IMG}/imac-24-m4-morado.webp`, imageBg: '#cdc2de', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: macSpecs('Apple M4', 'Todo en uno de 24"', 'Desde 16 GB'),
    highlights: ['Pantalla Retina 4,5K', 'Chip Apple M4', 'Diseño todo en uno', 'Cámara Center Stage', 'Seis altavoces'],
  },
  {
    slug: 'mac-studio',
    family: 'mac',
    name: 'Mac Studio',
    tagline: 'Potencia de estudio profesional en un diseño increíblemente compacto.',
    fromPrice: 2499,
    financeFrom: { monthly: 105, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/mac-studio-photo.webp`, caps: [['M4 Max · 36 GB · 512 GB', 2499], ['M3 Ultra · 96 GB · 1 TB', 4999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: macSpecs('M4 Max o M3 Ultra', 'Sobremesa compacto', 'Desde 36 GB'),
    highlights: ['M4 Max o M3 Ultra', 'Diseño compacto', 'Conectividad profesional', 'Hasta cinco pantallas', 'Alto rendimiento sostenido'],
  },
  {
    slug: 'mac-mini-m4',
    family: 'mac',
    name: 'Mac mini M4',
    tagline: 'Un pequeño gigante con M4 para aprovechar tu pantalla y accesorios.',
    fromPrice: 719,
    financeFrom: { monthly: 30, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/mac-mini-m4-photo.webp`, caps: [['16 GB · 256 GB', 719], ['16 GB · 512 GB', 949], ['M4 Pro · 24 GB · 512 GB', 1649]] },
    ]),
    specs: macSpecs('Apple M4 o M4 Pro', 'Sobremesa compacto', 'Desde 16 GB'),
    highlights: ['Chip M4 o M4 Pro', 'Diseño ultracompacto', 'Thunderbolt', 'HDMI', 'Gigabit Ethernet'],
  },
]

// =====================  iPad  =====================
// iPad Pro y Air unifican 11"+13" en un único producto: la pulgada se
// elige como parte de la capacidad, siguiendo el patrón de MacBook Pro.
const iPadProCaps: CapSpec[] = [
  ['11" · 256 GB', 1229], ['11" · 512 GB', 1479], ['11" · 1 TB', 1979], ['11" · 2 TB', 2479, null, 'bajo-pedido', 'Recíbelo en 5-7 días'],
  ['13" · 256 GB', 1599], ['13" · 512 GB', 1849], ['13" · 1 TB', 2349], ['13" · 2 TB', 2849, null, 'bajo-pedido', 'Recíbelo en 5-7 días'],
]
const iPadAirCaps: CapSpec[] = [
  ['11" · 128 GB', 719], ['11" · 256 GB', 869], ['11" · 512 GB', 1119], ['11" · 1 TB', 1619],
  ['13" · 128 GB', 969], ['13" · 256 GB', 1119], ['13" · 512 GB', 1369], ['13" · 1 TB', 1869],
]

export const ipadModels: Model[] = [
  {
    slug: 'ipad-pro',
    family: 'ipad',
    name: 'iPad Pro M5',
    tagline: 'Pantalla Ultra Retina XDR OLED y chip M5. Disponible en 11" y 13".',
    fromPrice: 1229,
    financeFrom: { monthly: 51, months: 24 },
    colors: buildColors([
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/ipad-pro-13-negro.webp`, caps: iPadProCaps },
      { slug: 'plata', name: 'Plata', hex: '#e3e4e6', image: `${IMG}/ipad-pro-13-plata.webp`, caps: iPadProCaps },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple M5' },
      { label: 'Pantalla', value: 'Ultra Retina XDR OLED (11" o 13")' },
      { label: 'Autenticación', value: 'Face ID' },
      { label: 'Conector', value: 'Thunderbolt / USB-4' },
      { label: 'Accesorios', value: 'Apple Pencil Pro' },
    ],
    highlights: ['Chip Apple M5', 'Ultra Retina XDR OLED', 'Dos tamaños: 11" y 13"', 'Face ID', 'Thunderbolt / USB-4'],
  },
  {
    slug: 'ipad-air',
    family: 'ipad',
    name: 'iPad Air M4',
    tagline: 'Ligero, potente y con muchísimo color. Disponible en 11" y 13".',
    fromPrice: 719,
    financeFrom: { monthly: 30, months: 24 },
    colors: buildColors([
      { slug: 'azul', name: 'Azul', hex: '#a9c3d6', image: `${IMG}/ipad-air-13-azul.webp`, caps: iPadAirCaps },
      { slug: 'purpura', name: 'Púrpura', hex: '#b7a7d6', image: `${IMG}/ipad-air-13-purpura.webp`, caps: iPadAirCaps },
      { slug: 'blanco', name: 'Blanco estrella', hex: '#ded9cf', image: `${IMG}/ipad-air-13-blanco.webp`, caps: iPadAirCaps },
      { slug: 'gris', name: 'Gris espacial', hex: '#8e8e93', image: `${IMG}/ipad-air-13-gris.webp`, caps: iPadAirCaps },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple M4' },
      { label: 'Pantalla', value: 'Liquid Retina (11" o 13")' },
      { label: 'Autenticación', value: 'Touch ID' },
      { label: 'Conector', value: 'USB-C' },
      { label: 'Accesorios', value: 'Apple Pencil Pro' },
    ],
    highlights: ['Chip Apple M4', 'Dos tamaños: 11" y 13"', 'Cuatro colores', 'Touch ID', 'Apple Pencil Pro'],
  },
  {
    slug: 'ipad-mini',
    family: 'ipad',
    name: 'iPad mini',
    tagline: 'Toda la potencia del iPad en un diseño superportátil de 8,3".',
    fromPrice: 609,
    financeFrom: { monthly: 25, months: 24 },
    colors: buildColors([
      { slug: 'azul', name: 'Azul', hex: '#a9c3d6', image: `${IMG}/ipad-mini-azul.webp`, caps: [['128 GB', 609], ['256 GB', 739], ['512 GB', 999]] },
      { slug: 'purpura', name: 'Púrpura', hex: '#b7a7d6', image: `${IMG}/ipad-mini-purpura.webp`, caps: [['128 GB', 609], ['256 GB', 739], ['512 GB', 999]] },
      { slug: 'blanco', name: 'Blanco estrella', hex: '#ded9cf', image: `${IMG}/ipad-mini-blanco.webp`, caps: [['128 GB', 609], ['256 GB', 739], ['512 GB', 999]] },
      { slug: 'gris', name: 'Gris espacial', hex: '#8e8e93', image: `${IMG}/ipad-mini-gris.webp`, caps: [['128 GB', 609], ['256 GB', 739], ['512 GB', 999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple A17 Pro' },
      { label: 'Pantalla', value: 'Liquid Retina 8,3"' },
      { label: 'Autenticación', value: 'Touch ID' },
      { label: 'Conector', value: 'USB-C' },
      { label: 'Accesorios', value: 'Apple Pencil Pro y USB-C' },
    ],
    highlights: ['Chip A17 Pro', 'Diseño ultracompacto', 'Apple Intelligence', 'Compatible con Apple Pencil Pro', 'Cuatro colores'],
  },
  {
    slug: 'ipad-a16',
    family: 'ipad',
    name: 'iPad A16',
    tagline: 'El iPad para el día a día, en cuatro colores vivos.',
    fromPrice: 409,
    financeFrom: { monthly: 17, months: 24 },
    colors: buildColors([
      { slug: 'azul', name: 'Azul', hex: '#8bb4d9', image: `${IMG}/ipad-11-azul.webp`, caps: [['128 GB', 409], ['256 GB', 539], ['512 GB', 799]] },
      { slug: 'rosa', name: 'Rosa', hex: '#dfb1c0', image: `${IMG}/ipad-11-rosa.webp`, caps: [['128 GB', 409], ['256 GB', 539], ['512 GB', 799]] },
      { slug: 'amarillo', name: 'Amarillo', hex: '#f0d879', image: `${IMG}/ipad-11-amarillo.webp`, caps: [['128 GB', 409], ['256 GB', 539], ['512 GB', 799]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/ipad-11-plata.webp`, caps: [['128 GB', 409], ['256 GB', 539], ['512 GB', 799, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple A16' },
      { label: 'Pantalla', value: 'Liquid Retina 11"' },
      { label: 'Autenticación', value: 'Touch ID' },
      { label: 'Conector', value: 'USB-C' },
      { label: 'Accesorios', value: 'Apple Pencil (USB-C)' },
    ],
    highlights: ['Chip Apple A16', 'Pantalla Liquid Retina 11"', 'Touch ID', 'Cuatro colores vivos', 'Ligero y sencillo'],
  },
]

// =====================  Apple Watch  =====================
// El tamaño de caja se elige como parte de la capacidad (patrón MBP/iPad).
const s11AlumCaps: CapSpec[] = [
  ['42 mm · GPS', 459], ['42 mm · GPS + Cellular', 559],
  ['46 mm · GPS', 489], ['46 mm · GPS + Cellular', 589],
]
const s11TitanCaps: CapSpec[] = [
  ['42 mm · GPS + Cellular', 799],
  ['46 mm · GPS + Cellular', 849, null, 'bajo-pedido', 'Recíbelo en 5-7 días'],
]

export const watchModels: Model[] = [
  {
    slug: 'watch-ultra-3',
    family: 'apple-watch',
    name: 'Apple Watch Ultra 3',
    tagline: 'Titanio aeronáutico, GPS de doble frecuencia y la mayor autonomía.',
    fromPrice: 909,
    financeFrom: { monthly: 38, months: 24 },
    colors: buildColors([
      { slug: 'natural-alpine', name: 'Titanio natural · Correa Alpine azul', hex: '#d0cec7', image: `${IMG}/watch-ultra-3-natural-alpine.webp`, caps: [['49 mm · GPS + Cellular', 909]] },
      { slug: 'natural-ocean', name: 'Titanio natural · Correa Ocean azul', hex: '#a9c3d6', image: `${IMG}/watch-ultra-3-natural-ocean.webp`, caps: [['49 mm · GPS + Cellular', 909]] },
      { slug: 'natural-milanese', name: 'Titanio natural · Milanese Loop', hex: '#c7c4bd', image: `${IMG}/watch-ultra-3-natural-milanese.webp`, caps: [['49 mm · GPS + Cellular', 909]] },
      { slug: 'negro-alpine', name: 'Titanio negro · Correa Alpine negra', hex: '#3a3a3c', image: `${IMG}/watch-ultra-3-black-alpine.webp`, caps: [['49 mm · GPS + Cellular', 909]] },
      { slug: 'negro-ocean', name: 'Titanio negro · Correa Ocean negra', hex: '#1c1c1e', image: `${IMG}/watch-ultra-3-black-ocean.webp`, caps: [['49 mm · GPS + Cellular', 909, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Caja', value: 'Titanio 49 mm' },
      { label: 'Pantalla', value: 'Retina LTPO3, 3000 nits' },
      { label: 'Chip', value: 'S11 SiP' },
      { label: 'Autonomía', value: 'Hasta 42 h (72 h en bajo consumo)' },
      { label: 'Resistencia', value: 'WR100 · EN13319 · MIL-STD-810H' },
      { label: 'Conectividad', value: 'GPS doble frecuencia · Cellular · Satélite' },
    ],
    highlights: ['Caja de titanio 49 mm', 'GPS de doble frecuencia', 'Hasta 42 h de batería', 'Mensajes vía satélite', 'Botón de acción configurable'],
  },
  {
    slug: 'watch-series-11',
    family: 'apple-watch',
    name: 'Apple Watch Series 11',
    tagline: 'La pantalla más grande y resistente, con nuevas funciones de salud.',
    fromPrice: 459,
    financeFrom: { monthly: 19, months: 24 },
    colors: buildColors([
      { slug: 'alum-jet-black', name: 'Aluminio negro azabache', hex: '#1c1c1e', image: `${IMG}/watch-s11-alum-jet-black.webp`, caps: s11AlumCaps },
      { slug: 'alum-rose-gold', name: 'Aluminio oro rosa', hex: '#dbb6b0', image: `${IMG}/watch-s11-alum-rose-gold.webp`, caps: s11AlumCaps },
      { slug: 'alum-silver', name: 'Aluminio plata', hex: '#e3e4e6', image: `${IMG}/watch-s11-alum-silver.webp`, caps: s11AlumCaps },
      { slug: 'alum-space-gray', name: 'Aluminio gris espacial', hex: '#8e8e93', image: `${IMG}/watch-s11-alum-space-gray.webp`, caps: s11AlumCaps },
      { slug: 'titan-natural', name: 'Titanio natural', hex: '#d0cec7', image: `${IMG}/watch-s11-titan-natural.webp`, caps: s11TitanCaps },
      { slug: 'titan-gold', name: 'Titanio oro', hex: '#c4a86e', image: `${IMG}/watch-s11-titan-gold.webp`, caps: s11TitanCaps },
      { slug: 'titan-slate', name: 'Titanio slate', hex: '#4a4a4c', image: `${IMG}/watch-s11-titan-slate.webp`, caps: s11TitanCaps },
    ]),
    specs: [
      { label: 'Caja', value: 'Aluminio o titanio (42 o 46 mm)' },
      { label: 'Pantalla', value: 'Retina LTPO3 siempre activa' },
      { label: 'Chip', value: 'S11 SiP' },
      { label: 'Salud', value: 'ECG, oxígeno en sangre, temperatura, apnea del sueño' },
      { label: 'Resistencia', value: 'WR50 · IP6X' },
      { label: 'Conectividad', value: 'GPS o GPS + Cellular' },
    ],
    highlights: ['Pantalla siempre activa', 'Chip S11', 'ECG y oxígeno en sangre', 'Detección de apnea del sueño', 'Aluminio o titanio'],
  },
  {
    slug: 'watch-se-3',
    family: 'apple-watch',
    name: 'Apple Watch SE 3',
    tagline: 'Lo esencial del Apple Watch, ahora más asequible.',
    fromPrice: 279,
    financeFrom: { monthly: 12, months: 24 },
    colors: buildColors([
      { slug: 'medianoche', name: 'Aluminio medianoche', hex: '#2c3138', image: `${IMG}/watch-se-3-midnight.webp`, caps: [
        ['40 mm · GPS', 279], ['40 mm · GPS + Cellular', 329],
        ['44 mm · GPS', 309], ['44 mm · GPS + Cellular', 359],
      ] },
      { slug: 'blanco-estrella', name: 'Aluminio blanco estrella', hex: '#ded8ca', image: `${IMG}/watch-se-3-starlight.webp`, caps: [
        ['40 mm · GPS', 279], ['40 mm · GPS + Cellular', 329],
        ['44 mm · GPS', 309], ['44 mm · GPS + Cellular', 359, null, 'bajo-pedido', 'Recíbelo en 5-7 días'],
      ] },
    ]),
    specs: [
      { label: 'Caja', value: 'Aluminio (40 o 44 mm)' },
      { label: 'Pantalla', value: 'Retina siempre activa' },
      { label: 'Chip', value: 'S10 SiP' },
      { label: 'Salud', value: 'Frecuencia cardiaca, detección de caídas' },
      { label: 'Resistencia', value: 'WR50' },
      { label: 'Conectividad', value: 'GPS o GPS + Cellular' },
    ],
    highlights: ['Modelo más asequible', 'Pantalla siempre activa', 'Chip S10', 'Detección de caídas', 'Tres colores'],
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
      { slug: 'blanco', name: 'Blanco', hex: '#ececec', image: `${IMG}/airpods-pro-hero.webp`, caps: [['USB-C', 279]] },
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
    slug: 'airpods-4-anc',
    family: 'airpods',
    name: 'AirPods 4 con Cancelación Activa de Ruido',
    tagline: 'Ajuste abierto con cancelación activa de ruido y Audio Espacial.',
    fromPrice: 199,
    financeFrom: { monthly: 8, months: 24 },
    // PNG 1080×1080 RGBA descargado desde el CDN de Apple
    // (as-images.apple.com/is/airpods-4-up-compare-202409, fmt=png-alpha).
    colors: buildColors([
      { slug: 'blanco', name: 'Blanco', hex: '#ececec', image: `${IMG}/airpods-4-anc.webp`, caps: [['USB-C', 199]] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple H2' },
      { label: 'Cancelación de ruido', value: 'Activa, en formato abierto' },
      { label: 'Audio', value: 'Espacial personalizado' },
      { label: 'Batería', value: 'Hasta 4 h (30 h con estuche)' },
      { label: 'Conector', value: 'USB-C' },
    ],
    highlights: ['Cancelación activa de ruido', 'Chip H2', 'Audio Espacial personalizado', 'Estuche USB-C con carga inalámbrica', 'Ajuste abierto'],
  },
  {
    slug: 'airpods-4',
    family: 'airpods',
    name: 'AirPods 4',
    tagline: 'La nueva generación con Chip H2 y Audio Espacial personalizado.',
    fromPrice: 149,
    financeFrom: { monthly: 6, months: 24 },
    // PNG 1080×1080 RGBA descargado desde el CDN de Apple
    // (as-images.apple.com/is/airpods-4-down-compare-202409, fmt=png-alpha).
    colors: buildColors([
      { slug: 'blanco', name: 'Blanco', hex: '#ececec', image: `${IMG}/airpods-4.webp`, caps: [['USB-C', 149]] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple H2' },
      { label: 'Cancelación de ruido', value: 'No incluye' },
      { label: 'Audio', value: 'Espacial personalizado' },
      { label: 'Batería', value: 'Hasta 5 h (30 h con estuche)' },
      { label: 'Conector', value: 'USB-C' },
    ],
    highlights: ['Chip H2', 'Audio Espacial personalizado', 'Ajuste rediseñado', 'Estuche USB-C', 'Formato abierto'],
  },
  {
    slug: 'airpods-max',
    family: 'airpods',
    name: 'AirPods Max',
    tagline: 'Sonido de altísima fidelidad en unos auriculares de diadema.',
    fromPrice: 579,
    financeFrom: { monthly: 24, months: 24 },
    colors: buildColors([
      { slug: 'medianoche', name: 'Medianoche', hex: '#2c2f36', image: `${IMG}/airpods-max-medianoche.webp`, caps: [['USB-C', 579]] },
      { slug: 'azul', name: 'Azul', hex: '#6d92ad', image: `${IMG}/airpods-max-azul.webp`, caps: [['USB-C', 579]] },
      { slug: 'purpura', name: 'Púrpura', hex: '#9b8bb4', image: `${IMG}/airpods-max-purpura.webp`, caps: [['USB-C', 579]] },
      { slug: 'naranja', name: 'Naranja', hex: '#e08a3c', image: `${IMG}/airpods-max-naranja.webp`, caps: [['USB-C', 579]] },
      { slug: 'blanco', name: 'Blanco estrella', hex: '#ece9e2', image: `${IMG}/airpods-max-blanco.webp`, caps: [['USB-C', 579, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
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

export function capacitySlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

// Familia por defecto en el prototipo
export const defaultFamilyModels = iphoneModels
