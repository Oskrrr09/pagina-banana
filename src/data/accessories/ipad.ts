// Accesorios para iPad del catálogo.
// Añadir uno nuevo → ver `src/data/README.md`.

import { IMG, VERIFIED_ON, type Accessory } from './_shared'

export const ipadAccessories: Accessory[] = [
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
      models: ['ipad/ipad-pro', 'ipad/ipad-air'],
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
      models: ['ipad/ipad-pro', 'ipad/ipad-air'],
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
    image: `${IMG}/magic-keyboard-ipad-pro-11-m4.jpg`,
    variants: [
      { slug: 'unico', label: 'Único', image: `${IMG}/magic-keyboard-ipad-pro-11-m4.jpg` },
    ],
    specs: [
      { label: 'Trackpad', value: 'Trackpad ampliado con respuesta háptica' },
      { label: 'Teclas de función', value: 'Sí' },
      { label: 'Puerto', value: 'USB-C de paso para carga' },
    ],
    highlights: ['Trackpad ampliado', 'Teclas de función', 'USB-C de paso'],
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
]
