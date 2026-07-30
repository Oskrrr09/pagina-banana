// Accesorios para iPhone del catálogo.
// Añadir uno nuevo → ver `src/data/README.md`.

import { IMG, VERIFIED_ON, type Accessory } from './_shared'

export const iphoneAccessories: Accessory[] = [
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
    aliases: ['funda iphone 17', 'silicona iphone 17', 'case iphone 17 magsafe'],
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
    aliases: ['funda iphone 17 pro', 'trenzado tecnico iphone 17 pro', 'case iphone 17 pro'],
    keywords: ['funda', 'case', 'trenzado', 'magsafe', 'iphone', '17 pro'],
    appleSource: 'https://www.apple.com/es/shop/product/mgf44zm/a/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
  // Funda con MagSafe para el iPhone Air — RETIRADA temporalmente
  // (PR fix/accessory-images-round-2): la imagen que servía el CDN
  // público de Apple para el SKU MGH34 correspondía a una funda de
  // iPhone 16e (cámara con dos círculos pequeños), no al iPhone Air.
  // Volver a añadir cuando exista fotografía verificada.
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
]
