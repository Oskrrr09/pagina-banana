// Catálogo inicial de accesorios oficiales Apple (§4.5).
//
// Origen: `docs/catalogo-accesorios-apple.md`. Los datos son
// demostrativos: nombres y compatibilidad se toman de la ficha oficial
// de Apple España; el precio de referencia procede de Banana Computer o
// Apple España en la fecha `VERIFIED_ON`. El prototipo pinta siempre la
// etiqueta "Precio demostrativo" y "Disponibilidad pendiente de
// validación": ningún importe ni existencia se afirma como vigente.
//
// Este archivo NO participa en carrito, checkout, seguro, favoritos ni
// comparador. Sirve al catálogo de accesorios, al detalle, al buscador
// (`searchIndex.ts`) y a la sección "Accesorios compatibles" de las
// fichas de dispositivo.

import type { FamilySlug } from './productDecisionData'

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export type AccessoryCategory =
  | 'carga'
  | 'iphone'
  | 'ipad'
  | 'mac'
  | 'apple-watch'
  | 'airtag'

export const ACCESSORY_CATEGORIES: {
  slug: AccessoryCategory
  label: string
}[] = [
  { slug: 'carga', label: 'Carga y cables' },
  { slug: 'iphone', label: 'iPhone' },
  { slug: 'ipad', label: 'iPad' },
  { slug: 'mac', label: 'Mac' },
  { slug: 'apple-watch', label: 'Apple Watch' },
  { slug: 'airtag', label: 'AirTag' },
]

export interface AccessoryVariant {
  slug: string
  label: string
  image: string
  imageBg?: string
  price?: number
  swatch?: string
}

export interface AccessorySpec {
  label: string
  value: string
}

export interface AccessoryCompatibility {
  /** Familias completas cuando el accesorio funciona con toda la familia. */
  families?: FamilySlug[]
  /** Modelos exactos: cadenas `familia/slug` p. ej. `iphone/17-pro`. */
  models?: string[]
  /** Notas humanas cuando la compatibilidad requiere matices. */
  notes?: string[]
}

export interface Accessory {
  slug: string
  name: string
  brand: 'Apple'
  category: AccessoryCategory
  tagline: string
  description: string
  /** Precio de referencia observado. `null` cuando no hay dato verificable. */
  price: number | null
  previousPrice?: number | null
  priceLabel?: string
  image: string
  imageBg?: string
  gallery?: string[]
  variants: AccessoryVariant[]
  specs: AccessorySpec[]
  highlights: string[]
  compatibility: AccessoryCompatibility
  aliases: string[]
  keywords: string[]
  bananaSku?: string
  bananaSource?: string
  appleSource?: string
  verifiedOn: string
  availabilityLabel:
    | 'Producto mostrado públicamente por Banana'
    | 'Disponibilidad pendiente de validación'
    | 'Consulta disponibilidad en tienda'
  provisionalTags?: string[]
}

// -----------------------------------------------------------------------------
// Constantes de origen
// -----------------------------------------------------------------------------

export const VERIFIED_ON = '2026-07-30'

const IMG = `${import.meta.env.BASE_URL}img/accessories`

// -----------------------------------------------------------------------------
// Datos
// -----------------------------------------------------------------------------

export const appleAccessories: Accessory[] = [
  // ============================= CARGA Y CABLES ============================
  {
    slug: 'adaptador-corriente-usb-c-20w',
    name: 'Adaptador de corriente USB-C de 20 W',
    brand: 'Apple',
    category: 'carga',
    tagline: 'Carga rápida para iPhone, iPad y AirPods.',
    description:
      'Adaptador compacto de 20 W con puerto USB-C. Compatible con carga rápida ' +
      'en iPhone 12 o posterior con un cable USB-C a Lightning o USB-C a USB-C.',
    price: 25,
    priceLabel: 'desde',
    image: `${IMG}/apple-20w-usb-c-adapter.jpg`,
    variants: [
      {
        slug: 'unico',
        label: 'Único',
        image: `${IMG}/apple-20w-usb-c-adapter.jpg`,
      },
    ],
    specs: [
      { label: 'Potencia', value: '20 W' },
      { label: 'Conector', value: 'USB-C' },
      { label: 'Referencia Apple', value: 'MD3J4ZM/A' },
    ],
    highlights: [
      'Carga rápida compatible con iPhone y iPad',
      'Puerto USB-C',
      'Diseño compacto',
    ],
    compatibility: {
      families: ['iphone', 'ipad', 'airpods'],
      notes: [
        'La carga rápida requiere un cable USB-C compatible.',
        'Compatible con AirPods con estuche de carga USB-C o MagSafe.',
      ],
    },
    aliases: ['adaptador 20w', 'cargador iphone 20w', 'usb-c 20w'],
    keywords: ['cargador', 'charging', 'usb-c', 'iphone', 'ipad', 'adaptador'],
    appleSource:
      'https://www.apple.com/es/shop/product/md3j4zm/a/adaptador-de-corriente-usb-c-de-20-w',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Disponibilidad pendiente de validación',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'adaptador-corriente-usb-c-30w',
    name: 'Adaptador de corriente USB-C de 30 W',
    brand: 'Apple',
    category: 'carga',
    tagline: 'Ideal para MacBook Air, iPad y iPhone.',
    description:
      'Cargador de pared USB-C de 30 W con Power Delivery. Recomendado por ' +
      'Apple para MacBook Air, iPad y iPhone con cable USB-C compatible.',
    price: 45,
    image: `${IMG}/apple-30w-usb-c-adapter.svg`,
    imageBg: '#f5f5f7',
    variants: [
      {
        slug: 'unico',
        label: 'Único',
        image: `${IMG}/apple-30w-usb-c-adapter.svg`,
      },
    ],
    specs: [
      { label: 'Potencia', value: '30 W' },
      { label: 'Conector', value: 'USB-C' },
      { label: 'Referencia Apple', value: 'MW2G3ZM/A' },
    ],
    highlights: [
      'Power Delivery de 30 W',
      'Compatible con MacBook Air, iPad y iPhone',
      'Puerto USB-C',
    ],
    compatibility: {
      families: ['mac', 'ipad', 'iphone'],
      notes: [
        'La carga completa depende del cable y del modelo. Consulta la ficha ' +
          'oficial de Apple para más detalle.',
      ],
    },
    aliases: ['adaptador 30w', 'cargador macbook air', 'usb-c 30w'],
    keywords: ['cargador', 'adaptador', 'charging', 'usb-c', 'mac', 'macbook'],
    bananaSku: 'MW2G3ZM/A',
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-mac/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'cargador-magsafe',
    name: 'Cargador MagSafe',
    brand: 'Apple',
    category: 'carga',
    tagline: 'Carga inalámbrica magnética para iPhone.',
    description:
      'Cargador MagSafe de Apple con conector USB-C. Ofrece carga inalámbrica ' +
      'rápida y alineación magnética con iPhone 12 o posterior y con el estuche ' +
      'de carga MagSafe de AirPods.',
    price: 45,
    priceLabel: 'desde',
    image: `${IMG}/magsafe-charger-1m.jpg`,
    gallery: [
      `${IMG}/magsafe-charger-1m.jpg`,
      `${IMG}/magsafe-charger-2m.jpg`,
    ],
    variants: [
      {
        slug: '1m',
        label: 'Cable de 1 m',
        image: `${IMG}/magsafe-charger-1m.jpg`,
      },
      {
        slug: '2m',
        label: 'Cable de 2 m',
        image: `${IMG}/magsafe-charger-2m.jpg`,
      },
    ],
    specs: [
      { label: 'Conector', value: 'USB-C' },
      { label: 'Longitud del cable', value: '1 m / 2 m' },
      { label: 'Compatibilidad de carga', value: 'iPhone 12 o posterior; AirPods con estuche MagSafe' },
    ],
    highlights: [
      'Carga inalámbrica magnética',
      'Alineación automática con iPhone',
      'Puerto USB-C',
    ],
    compatibility: {
      families: ['iphone', 'airpods'],
      notes: [
        'La velocidad de carga rápida requiere un adaptador USB-C con Power ' +
          'Delivery de al menos 20 W.',
        'No compatible con la carga del Apple Watch.',
      ],
    },
    aliases: ['magsafe', 'cargador iphone', 'wireless charger'],
    keywords: ['magsafe', 'cargador', 'inalambrico', 'iphone', 'airpods', 'charging'],
    appleSource:
      'https://www.apple.com/es/shop/iphone/iphone-accessories/all-accessories/power-cables',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Disponibilidad pendiente de validación',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'cable-usb-c-trenzado-240w-2m',
    name: 'Cable de carga USB-C trenzado de 240 W (2 m)',
    brand: 'Apple',
    category: 'carga',
    tagline: 'Cable de carga trenzado de larga duración.',
    description:
      'Cable USB-C a USB-C trenzado con carga de hasta 240 W. Longitud de 2 m. ' +
      'Diseñado para cargar Mac, iPad y iPhone con USB-C.',
    price: 35,
    image: `${IMG}/usb-c-cable-240w-2m.svg`,
    imageBg: '#f5f5f7',
    variants: [
      {
        slug: 'unico',
        label: '2 metros',
        image: `${IMG}/usb-c-cable-240w-2m.svg`,
      },
    ],
    specs: [
      { label: 'Potencia máxima', value: '240 W' },
      { label: 'Longitud', value: '2 m' },
      { label: 'Conectores', value: 'USB-C a USB-C' },
      { label: 'Función', value: 'Cable de carga' },
    ],
    highlights: [
      'Trenzado resistente',
      'Hasta 240 W de carga',
      'Compatible con Mac, iPad y iPhone con USB-C',
    ],
    compatibility: {
      families: ['mac', 'ipad', 'iphone'],
      notes: [
        'Apple lo presenta como cable de carga. La velocidad de transferencia ' +
          'de datos no se destaca; consulta la ficha oficial si es un requisito.',
      ],
    },
    aliases: ['cable usb-c 2m', 'cable 240w', 'cable carga apple'],
    keywords: ['cable', 'usb-c', 'carga', 'trenzado', 'mac', 'ipad', 'iphone'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-mac/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'cable-thunderbolt-4-pro-1_8m',
    name: 'Cable Thunderbolt 4 Pro (USB-C) 1,8 m',
    brand: 'Apple',
    category: 'carga',
    tagline: 'Alto rendimiento para configuraciones profesionales.',
    description:
      'Cable Thunderbolt 4 Pro de Apple con conector USB-C. Longitud de 1,8 m. ' +
      'Diseñado para Mac y iPad Pro compatibles con Thunderbolt.',
    price: 149,
    image: `${IMG}/thunderbolt-4-pro-cable-1_8m.svg`,
    imageBg: '#f5f5f7',
    variants: [
      {
        slug: '1_8m',
        label: '1,8 m',
        image: `${IMG}/thunderbolt-4-pro-cable-1_8m.svg`,
      },
    ],
    specs: [
      { label: 'Estándar', value: 'Thunderbolt 4' },
      { label: 'Longitud', value: '1,8 m' },
      { label: 'Conectores', value: 'USB-C a USB-C' },
    ],
    highlights: [
      'Thunderbolt 4 con hasta 40 Gb/s',
      'Compatible con Mac y iPad Pro con Thunderbolt',
      'Construcción reforzada',
    ],
    compatibility: {
      families: ['mac', 'ipad'],
      notes: ['Requiere un puerto Thunderbolt en el equipo.'],
    },
    aliases: ['thunderbolt 4', 'cable tb4', 'thunderbolt pro'],
    keywords: ['cable', 'thunderbolt', 'tb4', 'usb-c', 'mac', 'ipad'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-mac/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },

  // ============================== IPHONE ===================================
  {
    slug: 'funda-silicona-magsafe-iphone-17',
    name: 'Funda de silicona con MagSafe para el iPhone 17',
    brand: 'Apple',
    category: 'iphone',
    tagline: 'Protección suave con alineación MagSafe.',
    description:
      'Funda de silicona con imanes MagSafe para el iPhone 17. Interior ' +
      'aterciopelado y ajuste preciso a los controles y cámaras.',
    price: 59,
    image: `${IMG}/iphone-17-silicone-case-guayaba.jpg`,
    variants: [
      {
        slug: 'guayaba',
        label: 'Guayaba intenso',
        image: `${IMG}/iphone-17-silicone-case-guayaba.jpg`,
        swatch: '#e94a5f',
      },
    ],
    specs: [
      { label: 'Material', value: 'Silicona con interior aterciopelado' },
      { label: 'Compatibilidad', value: 'iPhone 17 exclusivamente' },
      { label: 'Referencia Apple', value: 'MHVQ4ZM/A' },
    ],
    highlights: [
      'Alineación MagSafe',
      'Ajuste preciso al iPhone 17',
      'Interior de microfibra',
    ],
    compatibility: {
      models: ['iphone/17'],
      notes: [
        'Diseñada exclusivamente para iPhone 17. No compatible con Pro/Pro Max ni Air.',
      ],
    },
    aliases: [
      'funda iphone 17',
      'silicona iphone 17',
      'case iphone 17 magsafe',
    ],
    keywords: ['funda', 'case', 'silicona', 'magsafe', 'iphone', '17'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/fundas-iphone/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'funda-trenzado-tecnico-magsafe-iphone-17-pro',
    name: 'Funda de trenzado técnico con MagSafe para el iPhone 17 Pro',
    brand: 'Apple',
    category: 'iphone',
    tagline: 'Trenzado técnico con MagSafe.',
    description:
      'Funda de trenzado técnico con MagSafe para el iPhone 17 Pro. Tacto ' +
      'textil premium y ajuste preciso al iPhone 17 Pro exclusivamente.',
    price: 69,
    image: `${IMG}/iphone-17-pro-braided-technical-case-blue.jpg`,
    variants: [
      {
        slug: 'azul',
        label: 'Azul',
        image: `${IMG}/iphone-17-pro-braided-technical-case-blue.jpg`,
        swatch: '#4a6a8f',
      },
    ],
    specs: [
      { label: 'Material', value: 'Trenzado técnico' },
      { label: 'Compatibilidad', value: 'iPhone 17 Pro exclusivamente' },
      { label: 'Referencia Apple', value: 'MGF44ZM/A' },
    ],
    highlights: [
      'Trenzado técnico premium',
      'Alineación MagSafe',
      'Ajuste preciso al iPhone 17 Pro',
    ],
    compatibility: {
      models: ['iphone/17-pro'],
      notes: [
        'Diseñada exclusivamente para iPhone 17 Pro. No compatible con Pro Max, 17 ni Air.',
      ],
    },
    aliases: [
      'funda iphone 17 pro',
      'trenzado tecnico iphone 17 pro',
      'case iphone 17 pro',
    ],
    keywords: ['funda', 'case', 'trenzado', 'magsafe', 'iphone', '17 pro'],
    appleSource: 'https://www.apple.com/es/shop/product/mgf44zm/a/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'funda-magsafe-iphone-air',
    name: 'Funda con MagSafe para el iPhone Air',
    brand: 'Apple',
    category: 'iphone',
    tagline: 'Diseño delgado y transparente para iPhone Air.',
    description:
      'Funda con MagSafe diseñada exclusivamente para el iPhone Air. Perfil ' +
      'ultradelgado y alineación magnética precisa.',
    price: 59,
    image: `${IMG}/iphone-air-magsafe-case.svg`,
    imageBg: '#f5f5f7',
    variants: [
      {
        slug: 'escarcha',
        label: 'Escarcha',
        image: `${IMG}/iphone-air-magsafe-case.svg`,
        swatch: '#e8ecf1',
      },
    ],
    specs: [
      { label: 'Material', value: 'Policarbonato con MagSafe' },
      { label: 'Compatibilidad', value: 'iPhone Air exclusivamente' },
    ],
    highlights: [
      'Diseñada para iPhone Air',
      'Alineación MagSafe',
      'Perfil delgado',
    ],
    compatibility: {
      models: ['iphone/air'],
      notes: [
        'Exclusiva para iPhone Air. No compatible con iPhone 17, 17 Pro ni Pro Max.',
      ],
    },
    aliases: ['funda iphone air', 'case iphone air', 'iphone air magsafe'],
    keywords: ['funda', 'case', 'magsafe', 'iphone', 'air'],
    appleSource: 'https://www.apple.com/es/shop/product/mgh34zm/a/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'correa-crossbody',
    name: 'Correa Crossbody',
    brand: 'Apple',
    category: 'iphone',
    tagline: 'Correa cruzada para llevar el iPhone.',
    description:
      'Correa Crossbody de Apple para llevar el iPhone con estilo. Se une a la ' +
      'funda MagSafe compatible del iPhone.',
    price: 69,
    image: `${IMG}/iphone-crossbody-strap-guayaba.jpg`,
    variants: [
      {
        slug: 'guayaba',
        label: 'Guayaba intenso',
        image: `${IMG}/iphone-crossbody-strap-guayaba.jpg`,
        swatch: '#e94a5f',
      },
    ],
    specs: [
      { label: 'Uso', value: 'Cruzada al hombro' },
      { label: 'Compatibilidad', value: 'Fundas MagSafe del iPhone compatibles' },
      { label: 'Referencia Apple', value: 'MHYX4ZM/A' },
    ],
    highlights: [
      'Se combina con fundas MagSafe',
      'Tejido resistente',
      'Ajuste con imanes',
    ],
    compatibility: {
      families: ['iphone'],
      notes: [
        'Requiere una funda MagSafe compatible del iPhone. No es una funda por sí sola.',
      ],
    },
    aliases: ['crossbody', 'correa iphone', 'strap iphone'],
    keywords: ['correa', 'crossbody', 'iphone', 'magsafe'],
    appleSource: 'https://www.apple.com/es/shop/product/mhyx4zm/a/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },

  // =============================== IPAD ====================================
  {
    slug: 'apple-pencil-pro',
    name: 'Apple Pencil Pro',
    brand: 'Apple',
    category: 'ipad',
    tagline: 'Precisión profesional con nuevos gestos.',
    description:
      'Apple Pencil Pro con gestos avanzados como squeeze y hover, respuesta ' +
      'háptica y compatibilidad con Buscar. Compatible con iPad Pro (M4), ' +
      'iPad Air (M2/M3) y iPad Air 11"/13" (M4).',
    price: 149,
    image: `${IMG}/apple-pencil-pro.jpg`,
    variants: [
      { slug: 'unico', label: 'Único', image: `${IMG}/apple-pencil-pro.jpg` },
    ],
    specs: [
      { label: 'Gestos', value: 'Squeeze, hover, respuesta háptica' },
      { label: 'Buscar', value: 'Sí, integrado' },
      { label: 'Referencia Apple', value: 'MX2D3ZM/A' },
    ],
    highlights: [
      'Squeeze y hover para atajos rápidos',
      'Respuesta háptica',
      'Compatible con Buscar',
    ],
    compatibility: {
      models: [
        'ipad/ipad-pro',
        'ipad/ipad-air',
      ],
      notes: [
        'Requiere iPad Pro con chip M4/M5, iPad Air con chip M2/M3 o iPad Air 11"/13" (M4).',
        'No compatible con iPad estándar ni iPad mini de generaciones anteriores.',
      ],
    },
    aliases: ['apple pencil pro', 'pencil pro', 'lapiz apple pro'],
    keywords: ['pencil', 'apple pencil', 'lapiz', 'ipad', 'dibujo', 'stylus'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-ipad/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'apple-pencil-usb-c',
    name: 'Apple Pencil (USB-C)',
    brand: 'Apple',
    category: 'ipad',
    tagline: 'Escritura y dibujo sin nivel de presión.',
    description:
      'Apple Pencil con conector USB-C. Compatible con una amplia gama de ' +
      'iPad; no incluye sensibilidad a la presión, sí inclinación y baja latencia.',
    price: 89,
    image: `${IMG}/apple-pencil-usb-c.jpg`,
    variants: [
      { slug: 'unico', label: 'Único', image: `${IMG}/apple-pencil-usb-c.jpg` },
    ],
    specs: [
      { label: 'Conector', value: 'USB-C' },
      { label: 'Presión', value: 'Sin sensibilidad a la presión' },
      { label: 'Inclinación', value: 'Sí' },
      { label: 'Referencia Apple', value: 'MUWA3ZM/A' },
    ],
    highlights: [
      'Emparejamiento y carga USB-C',
      'Detección de inclinación',
      'Latencia reducida',
    ],
    compatibility: {
      models: [
        'ipad/ipad-pro',
        'ipad/ipad-air',
      ],
      notes: [
        'Compatible con iPad Pro M4, iPad Air M2/M3, iPad Air 11"/13" (M4), ' +
          'iPad (10ª/11ª generación) e iPad mini 6/7.',
        'Este lápiz no ofrece sensibilidad a la presión (sí inclinación).',
      ],
    },
    aliases: ['apple pencil usb-c', 'pencil usb-c', 'lapiz ipad'],
    keywords: ['pencil', 'apple pencil', 'lapiz', 'ipad', 'usb-c'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-ipad/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'puntas-apple-pencil-pack-4',
    name: 'Puntas para Apple Pencil (pack de 4)',
    brand: 'Apple',
    category: 'ipad',
    tagline: 'Repuesto de puntas para Apple Pencil.',
    description:
      'Pack de cuatro puntas de repuesto para Apple Pencil (1ª y 2ª generación).',
    price: 24.9,
    image: `${IMG}/apple-pencil-tips-4pack.jpg`,
    variants: [
      { slug: 'unico', label: 'Pack de 4', image: `${IMG}/apple-pencil-tips-4pack.jpg` },
    ],
    specs: [
      { label: 'Contenido', value: '4 puntas' },
      { label: 'Referencia Apple', value: 'MUF82ZM/A' },
    ],
    highlights: [
      'Repuesto oficial',
      'Compatibles con Apple Pencil 1ª y 2ª generación',
      'Pack de 4',
    ],
    compatibility: {
      notes: [
        'Compatibles con Apple Pencil (1ª generación) y Apple Pencil (2ª generación). ' +
          'Consulta la ficha oficial de Apple para compatibilidad con Apple Pencil Pro o USB-C.',
      ],
    },
    aliases: ['puntas pencil', 'tips pencil', 'punta apple pencil'],
    keywords: ['puntas', 'tips', 'pencil', 'apple pencil', 'repuesto'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-ipad/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'magic-keyboard-ipad-pro-11-m4',
    name: 'Magic Keyboard para el iPad Pro de 11" (M4)',
    brand: 'Apple',
    category: 'ipad',
    tagline: 'Teclado retroiluminado con trackpad para iPad Pro 11" (M4).',
    description:
      'Magic Keyboard rediseñado para el iPad Pro de 11 pulgadas con chip M4. ' +
      'Incluye fila de teclas de función, trackpad ampliado y conector USB-C ' +
      'de paso para la carga.',
    price: 349,
    image: `${IMG}/magic-keyboard-ipad-pro-11-m4.svg`,
    imageBg: '#f5f5f7',
    variants: [
      { slug: 'unico', label: 'Único', image: `${IMG}/magic-keyboard-ipad-pro-11-m4.svg` },
    ],
    specs: [
      { label: 'Trackpad', value: 'Trackpad ampliado con respuesta háptica' },
      { label: 'Teclas de función', value: 'Sí' },
      { label: 'Puerto', value: 'USB-C de paso para carga' },
    ],
    highlights: [
      'Trackpad ampliado',
      'Teclas de función',
      'USB-C de paso',
    ],
    compatibility: {
      models: ['ipad/ipad-pro'],
      notes: [
        'Diseñado específicamente para iPad Pro de 11 pulgadas con chip M4. ' +
          'No es compatible con iPad Pro de otras generaciones ni con iPad Air.',
      ],
    },
    aliases: ['magic keyboard ipad pro 11', 'teclado ipad pro m4'],
    keywords: ['magic keyboard', 'teclado', 'ipad', 'pro', 'm4'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-ipad/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },

  // ================================ MAC ====================================
  {
    slug: 'magic-keyboard-usb-c',
    name: 'Magic Keyboard (USB-C)',
    brand: 'Apple',
    category: 'mac',
    tagline: 'Teclado inalámbrico compacto con USB-C.',
    description:
      'Magic Keyboard clásico con conector USB-C para su carga. Diseño compacto, ' +
      'batería recargable y teclas cómodas para largas sesiones.',
    price: 119,
    image: `${IMG}/magic-keyboard-usb-c.jpg`,
    variants: [
      { slug: 'unico', label: 'Único', image: `${IMG}/magic-keyboard-usb-c.jpg` },
    ],
    specs: [
      { label: 'Conexión', value: 'Bluetooth' },
      { label: 'Puerto de carga', value: 'USB-C' },
      { label: 'Distribución', value: 'Español' },
    ],
    highlights: [
      'Batería recargable con USB-C',
      'Perfil delgado',
      'Compatible con Mac y iPad',
    ],
    compatibility: {
      families: ['mac', 'ipad'],
    },
    aliases: ['magic keyboard', 'teclado mac', 'apple keyboard'],
    keywords: ['magic keyboard', 'teclado', 'mac', 'usb-c'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-mac/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'magic-keyboard-touch-id-numeric-usb-c',
    name: 'Magic Keyboard con Touch ID y teclado numérico (USB-C)',
    brand: 'Apple',
    category: 'mac',
    tagline: 'Autenticación con huella y teclas numéricas.',
    description:
      'Magic Keyboard con Touch ID y teclado numérico integrado. Requiere un ' +
      'Mac con chip de Apple para utilizar Touch ID.',
    price: 229,
    image: `${IMG}/magic-keyboard-touch-id-numeric.jpg`,
    variants: [
      {
        slug: 'negro',
        label: 'Teclas negras',
        image: `${IMG}/magic-keyboard-touch-id-numeric.jpg`,
        swatch: '#1d1d1f',
        price: 229,
      },
    ],
    specs: [
      { label: 'Touch ID', value: 'Sí — requiere Mac con chip de Apple' },
      { label: 'Teclado numérico', value: 'Sí' },
      { label: 'Puerto de carga', value: 'USB-C' },
    ],
    highlights: [
      'Touch ID integrado',
      'Teclado numérico completo',
      'Batería recargable con USB-C',
    ],
    compatibility: {
      families: ['mac'],
      notes: [
        'Touch ID solo funciona con Mac con chip de Apple.',
        'Compatible con Mac con Bluetooth para el resto de teclas.',
      ],
    },
    aliases: [
      'magic keyboard touch id',
      'teclado touch id',
      'magic keyboard numerico',
    ],
    keywords: [
      'magic keyboard',
      'teclado',
      'touch id',
      'numerico',
      'mac',
      'usb-c',
    ],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-mac/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'magic-mouse-usb-c',
    name: 'Magic Mouse (USB-C)',
    brand: 'Apple',
    category: 'mac',
    tagline: 'Ratón inalámbrico con superficie Multi-Touch.',
    description:
      'Magic Mouse con superficie Multi-Touch y puerto USB-C para su carga. ' +
      'Ligero, con conexión Bluetooth y compatible con Mac.',
    price: 85,
    image: `${IMG}/magic-mouse.jpg`,
    variants: [
      {
        slug: 'blanco',
        label: 'Superficie Multi-Touch blanca',
        image: `${IMG}/magic-mouse.jpg`,
        swatch: '#f2f2f7',
        price: 85,
      },
      {
        slug: 'negro',
        label: 'Superficie Multi-Touch negra',
        image: `${IMG}/magic-mouse.jpg`,
        swatch: '#1d1d1f',
        price: 119,
      },
    ],
    specs: [
      { label: 'Conexión', value: 'Bluetooth' },
      { label: 'Puerto de carga', value: 'USB-C' },
      { label: 'Superficie', value: 'Multi-Touch' },
    ],
    highlights: [
      'Superficie Multi-Touch',
      'Batería recargable con USB-C',
      'Conexión Bluetooth',
    ],
    compatibility: {
      families: ['mac'],
    },
    aliases: ['magic mouse', 'raton apple', 'mouse mac'],
    keywords: ['magic mouse', 'raton', 'mouse', 'mac', 'usb-c'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-mac/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'magic-trackpad-usb-c',
    name: 'Magic Trackpad (USB-C)',
    brand: 'Apple',
    category: 'mac',
    tagline: 'Trackpad grande con Force Touch.',
    description:
      'Magic Trackpad con Force Touch, gestos Multi-Touch y puerto USB-C para su carga.',
    price: 139,
    image: `${IMG}/magic-trackpad.jpg`,
    variants: [
      {
        slug: 'blanco',
        label: 'Superficie Multi-Touch blanca',
        image: `${IMG}/magic-trackpad.jpg`,
        swatch: '#f2f2f7',
        price: 139,
      },
      {
        slug: 'negro',
        label: 'Superficie Multi-Touch negra',
        image: `${IMG}/magic-trackpad.jpg`,
        swatch: '#1d1d1f',
        price: 169,
      },
    ],
    specs: [
      { label: 'Conexión', value: 'Bluetooth' },
      { label: 'Puerto de carga', value: 'USB-C' },
      { label: 'Superficie', value: 'Multi-Touch con Force Touch' },
    ],
    highlights: [
      'Force Touch',
      'Gestos Multi-Touch amplios',
      'Batería recargable con USB-C',
    ],
    compatibility: {
      families: ['mac'],
    },
    aliases: ['magic trackpad', 'trackpad mac', 'trackpad apple'],
    keywords: ['magic trackpad', 'trackpad', 'mac', 'usb-c'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-mac/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },

  // ============================ APPLE WATCH ================================
  {
    slug: 'watch-fast-charge-cable-usb-c-1m',
    name: 'Cable de carga rápida magnética con conector USB-C para el Apple Watch (1 m)',
    brand: 'Apple',
    category: 'apple-watch',
    tagline: 'Carga rápida para Apple Watch Series 7 y posteriores.',
    description:
      'Cable magnético con conector USB-C de 1 m. La carga rápida es ' +
      'compatible con Apple Watch Series 7 o posterior y con todos los ' +
      'Apple Watch Ultra. En modelos previos carga a velocidad estándar.',
    price: 29,
    image: `${IMG}/watch-fast-charge-cable-usb-c-1m.jpg`,
    variants: [
      {
        slug: '1m',
        label: '1 m',
        image: `${IMG}/watch-fast-charge-cable-usb-c-1m.jpg`,
      },
    ],
    specs: [
      { label: 'Conector', value: 'USB-C' },
      { label: 'Longitud', value: '1 m' },
      { label: 'Referencia Apple', value: 'MT0H3TY/A' },
    ],
    highlights: [
      'Carga rápida en Series 7 o posterior y Ultra',
      'Conector USB-C',
      'Longitud de 1 m',
    ],
    compatibility: {
      families: ['apple-watch'],
      notes: [
        'Carga rápida: Apple Watch Series 7 o posterior y todos los Apple Watch Ultra.',
        'En modelos anteriores carga a velocidad estándar.',
      ],
    },
    aliases: ['cable watch', 'cargador apple watch', 'watch charger usb-c'],
    keywords: ['cable', 'cargador', 'apple watch', 'watch', 'usb-c', 'magnetico'],
    appleSource:
      'https://www.apple.com/es/shop/product/mt0h3ty/a/cable-de-carga-r%C3%A1pida-magn%C3%A9tica-con-conector-usb%E2%80%91c-para-el-apple-watch-1-m',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'correa-deportiva-watch-46mm',
    name: 'Correa deportiva 46 mm (talla M/L)',
    brand: 'Apple',
    category: 'apple-watch',
    tagline: 'Correa deportiva de silicona.',
    description:
      'Correa deportiva de silicona fluoroelastómero. Diseñada para cajas de ' +
      'Apple Watch de 46 mm, también compatible con cajas de 42/44/45/49 mm ' +
      'según la variante seleccionada.',
    price: 49,
    image: `${IMG}/watch-sport-band-46mm.svg`,
    imageBg: '#f5f5f7',
    variants: [
      {
        slug: 'guayaba',
        label: 'Guayaba intenso · 46 mm · M/L',
        image: `${IMG}/watch-sport-band-46mm.svg`,
        swatch: '#e94a5f',
      },
    ],
    specs: [
      { label: 'Material', value: 'Silicona fluoroelastómero' },
      { label: 'Talla', value: '46 mm · M/L' },
      { label: 'Cierre', value: 'Broche de pasador' },
    ],
    highlights: [
      'Talla M/L para muñeca mediana o grande',
      'Silicona resistente al sudor',
      'Broche de pasador clásico',
    ],
    compatibility: {
      families: ['apple-watch'],
      notes: [
        'Diseñada para cajas de 46 mm. Consulta la ficha oficial para saber ' +
          'con qué otras cajas es compatible cada talla.',
      ],
    },
    aliases: ['correa watch', 'correa apple watch', 'sport band'],
    keywords: ['correa', 'pulsera', 'apple watch', 'watch', 'sport'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-watch/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },

  // =============================== AIRTAG ==================================
  {
    slug: 'airtag-2gen',
    name: 'AirTag (2ª generación)',
    brand: 'Apple',
    category: 'airtag',
    tagline: 'Localizador con la red Buscar.',
    description:
      'AirTag de segunda generación. Se enlaza con iPhone o iPad para ' +
      'localizar llaves, mochila u otros objetos mediante la red Buscar.',
    price: 35,
    image: `${IMG}/airtag-single.svg`,
    imageBg: '#f5f5f7',
    variants: [
      { slug: 'unico', label: 'Individual', image: `${IMG}/airtag-single.svg` },
    ],
    specs: [
      { label: 'Batería', value: 'CR2032 reemplazable' },
      { label: 'Resistencia', value: 'IP67' },
      { label: 'Requisitos', value: 'iPhone o iPad con iOS/iPadOS reciente' },
    ],
    highlights: [
      'Red Buscar de Apple',
      'Batería reemplazable',
      'Resistente al agua IP67',
    ],
    compatibility: {
      families: ['iphone', 'ipad'],
    },
    aliases: ['airtag', 'localizador apple'],
    keywords: ['airtag', 'localizador', 'buscar', 'find my'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-iphone/airtag/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  {
    slug: 'airtag-2gen-pack-4',
    name: 'AirTag (2ª generación) — Pack de 4',
    brand: 'Apple',
    category: 'airtag',
    tagline: 'Cuatro AirTag para localizar varios objetos.',
    description:
      'Pack de cuatro AirTag de segunda generación. Ideal para localizar ' +
      'varios objetos a la vez con la red Buscar.',
    price: 119,
    image: `${IMG}/airtag-4pack.svg`,
    imageBg: '#f5f5f7',
    variants: [
      { slug: 'pack4', label: 'Pack de 4', image: `${IMG}/airtag-4pack.svg` },
    ],
    specs: [
      { label: 'Contenido', value: '4 AirTag' },
      { label: 'Batería', value: 'CR2032 reemplazable en cada unidad' },
      { label: 'Resistencia', value: 'IP67' },
    ],
    highlights: [
      'Cuatro localizadores en un pack',
      'Ahorra frente a comprarlos por separado',
      'Compatible con red Buscar',
    ],
    compatibility: {
      families: ['iphone', 'ipad'],
    },
    aliases: ['airtag pack', 'airtag 4', 'pack airtag'],
    keywords: ['airtag', 'pack', 'localizador', 'buscar'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-iphone/airtag/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
]

// -----------------------------------------------------------------------------
// Helpers
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
