// Accesorios para Apple Watch del catálogo.
// Añadir uno nuevo → ver `src/data/README.md`.

import { IMG, VERIFIED_ON, type Accessory } from './_shared'

export const watchAccessories: Accessory[] = [
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
      { slug: '1m', label: '1 m', image: `${IMG}/watch-fast-charge-cable-usb-c-1m.jpg` },
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
    image: `${IMG}/watch-sport-band-46mm-guayaba.jpg`,
    variants: [
      {
        slug: 'guayaba',
        label: 'Guayaba intenso · 46 mm · M/L',
        image: `${IMG}/watch-sport-band-46mm-guayaba.jpg`,
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
]
