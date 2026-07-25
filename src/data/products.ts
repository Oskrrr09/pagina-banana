import type { CapacityOption, ColorVariant, Family, Model } from './types'

// ------------------------------------------------------------------
// Contenido de ejemplo (apartado 7). Editable, nunca fijo en el código
// de negocio. Todo precio/stock lleva su etiqueta correspondiente.
// ------------------------------------------------------------------

const cap = (
  capacity: string,
  price: number,
  previousPrice: number | null,
  availability: CapacityOption['availability'] = 'disponible',
  availabilityNote?: string,
): CapacityOption => ({ capacity, price, previousPrice, availability, availabilityNote })

// Familias para la home y el mega-menú. En este prototipo solo iPhone
// tiene página de familia desarrollada (ver apartado 8).
export const families: Family[] = [
  { slug: 'mac', name: 'Mac', tagline: 'Potencia de sobremesa y portátil', fromPrice: 1499 },
  { slug: 'iphone', name: 'iPhone', tagline: 'El iPhone que buscas, al mejor precio en Canarias', fromPrice: 719 },
  { slug: 'ipad', name: 'iPad', tagline: 'Versátil, ligero, para todo', fromPrice: 409 },
  { slug: 'apple-watch', name: 'Apple Watch', tagline: 'Tu salud, en la muñeca', fromPrice: 259 },
  { slug: 'airpods', name: 'AirPods', tagline: 'Sonido sin cables', fromPrice: 149 },
  { slug: 'accesorios', name: 'Accesorios', tagline: 'Fundas, cargadores y más', fromPrice: 29 },
]

const iphoneSpecs = (chip: string, screen: string): Model['specs'] => [
  { label: 'Pantalla', value: screen },
  { label: 'Chip', value: chip },
  { label: 'Sistema de cámaras', value: 'Pro' },
  { label: 'Conector', value: 'USB-C' },
  { label: 'Resistencia', value: 'IP68' },
]

// --- iPhone 17 Pro (modelo con detalle completo, ejemplo del §7) ---
const iphone17Pro: Model = {
  slug: '17-pro',
  family: 'iphone',
  name: 'iPhone 17 Pro',
  tagline: 'Titanio, A19 Pro y el sistema de cámaras más avanzado.',
  fromPrice: 1229,
  financeFrom: { monthly: 51, months: 24 },
  colors: [
    {
      color: 'plata',
      name: 'Plata',
      hex: '#e3e4e6',
      capacities: [
        cap('256GB', 1229, 1303, 'disponible'),
        cap('512GB', 1479, null, 'disponible'),
        cap('1TB', 1729, null, 'bajo-pedido', 'Recíbelo en 5-7 días'),
      ],
    },
    {
      color: 'naranja',
      name: 'Naranja cósmico',
      hex: '#c8642a',
      capacities: [
        cap('256GB', 1229, 1303, 'disponible'),
        cap('512GB', 1479, null, 'bajo-pedido', 'Recíbelo en 5-7 días'),
        cap('1TB', 1729, null, 'disponible'),
      ],
    },
    {
      color: 'azul',
      name: 'Azul oscuro',
      hex: '#2b3a52',
      capacities: [
        cap('256GB', 1229, 1303, 'disponible'),
        cap('512GB', 1479, null, 'disponible'),
        cap('1TB', 1729, null, 'agotado'),
      ],
    },
  ],
  specs: iphoneSpecs('A19 Pro', 'Super Retina XDR 6,3"'),
  highlights: [
    'Pantalla Super Retina XDR',
    'Chip A19 Pro',
    'Sistema de cámaras Pro',
    'Batería para todo el día',
    'Diseño en titanio',
  ],
}

// Helper para modelos con menos detalle (las pestañas del §4.6 siguen funcionando)
const simpleModel = (
  slug: string,
  name: string,
  tagline: string,
  base: number,
  chip: string,
  screen: string,
  colors: { color: string; name: string; hex: string }[],
  caps: [string, number][],
): Model => ({
  slug,
  family: 'iphone',
  name,
  tagline,
  fromPrice: base,
  financeFrom: { monthly: Math.round((base / 24) * 100) / 100 || Math.round(base / 24), months: 24 },
  colors: colors.map((c, ci) => ({
    color: c.color,
    name: c.name,
    hex: c.hex,
    capacities: caps.map(([capacity, price], i) =>
      cap(
        capacity,
        price,
        null,
        ci === colors.length - 1 && i === caps.length - 1 ? 'bajo-pedido' : 'disponible',
        ci === colors.length - 1 && i === caps.length - 1 ? 'Recíbelo en 5-7 días' : undefined,
      ),
    ),
  })) as ColorVariant[],
  specs: iphoneSpecs(chip, screen),
  highlights: ['Pantalla Super Retina XDR', `Chip ${chip}`, 'Cámara avanzada', 'Batería para todo el día'],
})

export const iphoneModels: Model[] = [
  simpleModel(
    '17-pro-max',
    'iPhone 17 Pro Max',
    'La pantalla más grande y la mayor autonomía.',
    1479,
    'A19 Pro',
    'Super Retina XDR 6,9"',
    [
      { color: 'plata', name: 'Plata', hex: '#e3e4e6' },
      { color: 'naranja', name: 'Naranja cósmico', hex: '#c8642a' },
      { color: 'azul', name: 'Azul oscuro', hex: '#2b3a52' },
    ],
    [['256GB', 1479], ['512GB', 1729], ['1TB', 1979]],
  ),
  iphone17Pro,
  simpleModel(
    'air',
    'iPhone Air',
    'El iPhone más fino y ligero.',
    1099,
    'A19',
    'Super Retina XDR 6,5"',
    [
      { color: 'negro', name: 'Negro espacial', hex: '#2a2a2c' },
      { color: 'blanco', name: 'Blanco estelar', hex: '#ececea' },
    ],
    [['256GB', 1099], ['512GB', 1349]],
  ),
  simpleModel(
    '17',
    'iPhone 17',
    'Todo lo que necesitas, con el chip A19.',
    959,
    'A19',
    'Super Retina XDR 6,1"',
    [
      { color: 'negro', name: 'Negro', hex: '#2a2a2c' },
      { color: 'azul', name: 'Azul', hex: '#4a6b8a' },
      { color: 'verde', name: 'Verde', hex: '#7fa08a' },
    ],
    [['128GB', 959], ['256GB', 1089], ['512GB', 1339]],
  ),
  simpleModel(
    '17e',
    'iPhone 17e',
    'La puerta de entrada al ecosistema, sin renunciar a lo esencial.',
    719,
    'A18',
    'Super Retina XDR 6,1"',
    [
      { color: 'negro', name: 'Negro', hex: '#2a2a2c' },
      { color: 'blanco', name: 'Blanco', hex: '#ececea' },
    ],
    [['128GB', 719], ['256GB', 849]],
  ),
  simpleModel(
    '16',
    'iPhone 16',
    'La generación anterior, a un precio aún mejor.',
    809,
    'A18',
    'Super Retina XDR 6,1"',
    [
      { color: 'negro', name: 'Negro', hex: '#2a2a2c' },
      { color: 'azul', name: 'Azul ultramar', hex: '#3e5b8a' },
    ],
    [['128GB', 809], ['256GB', 939]],
  ),
]

export function getModel(family: string, slug: string): Model | undefined {
  if (family !== 'iphone') return undefined
  return iphoneModels.find((m) => m.slug === slug)
}

export function getVariant(model: Model, colorSlug: string) {
  return model.colors.find((c) => c.color === colorSlug) ?? model.colors[0]
}

// Familia por defecto en el prototipo
export const defaultFamilyModels = iphoneModels
