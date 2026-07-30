// Accesorios AirTag del catálogo.
// Añadir uno nuevo → ver `src/data/README.md`.

import { IMG, VERIFIED_ON, type Accessory } from './_shared'

export const airtagAccessories: Accessory[] = [
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
    image: `${IMG}/airtag-single.jpg`,
    variants: [
      { slug: 'unico', label: 'Individual', image: `${IMG}/airtag-single.jpg` },
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
    compatibility: { families: ['iphone', 'ipad'] },
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
    image: `${IMG}/airtag-4pack.jpg`,
    variants: [
      { slug: 'pack4', label: 'Pack de 4', image: `${IMG}/airtag-4pack.jpg` },
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
    compatibility: { families: ['iphone', 'ipad'] },
    aliases: ['airtag pack', 'airtag 4', 'pack airtag'],
    keywords: ['airtag', 'pack', 'localizador', 'buscar'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-iphone/airtag/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
]
