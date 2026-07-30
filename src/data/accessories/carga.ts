// Categoría "Carga y cables" del catálogo de accesorios.
// Añadir un accesorio → ver `src/data/README.md`.

import { IMG, VERIFIED_ON, type Accessory } from './_shared'

export const cargaAccessories: Accessory[] = [
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
    imagePresentation: { scale: 1.1, padding: 'compact' },
    variants: [
      { slug: 'unico', label: 'Único', image: `${IMG}/apple-20w-usb-c-adapter.jpg` },
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
    image: `${IMG}/apple-30w-usb-c-adapter.jpg`,
    imagePresentation: { scale: 1.1, padding: 'compact' },
    variants: [
      { slug: 'unico', label: 'Único', image: `${IMG}/apple-30w-usb-c-adapter.jpg` },
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
      { slug: '1m', label: 'Cable de 1 m', image: `${IMG}/magsafe-charger-1m.jpg` },
      { slug: '2m', label: 'Cable de 2 m', image: `${IMG}/magsafe-charger-2m.jpg` },
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
    image: `${IMG}/usb-c-cable-240w-2m.jpg`,
    variants: [
      { slug: 'unico', label: '2 metros', image: `${IMG}/usb-c-cable-240w-2m.jpg` },
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
  // Cable Thunderbolt 4 Pro (USB-C) 1,8 m — RETIRADO temporalmente
  // (PR fix/accessory-images-round-2): no fue posible obtener una
  // fotografía oficial legítima desde el CDN público de Apple. Volver a
  // añadir cuando exista imagen verificada. Documentado en
  // docs/auditoria-visual-accesorios-round-2.md.
]
