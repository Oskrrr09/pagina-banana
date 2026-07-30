// Accesorios para Mac del catálogo.
// Añadir uno nuevo → ver `src/data/README.md`.

import { IMG, VERIFIED_ON, type Accessory } from './_shared'

export const macAccessories: Accessory[] = [
  // Magic Keyboard (USB-C) básico — RETIRADO temporalmente
  // (PR fix/accessory-images-round-2): no fue posible obtener una
  // fotografía específica del modelo compacto sin Touch ID ni teclado
  // numérico. Volver a añadir cuando exista imagen verificada. Las
  // variantes con Touch ID + numérico (blanco y negro) permanecen.
  {
    slug: 'magic-keyboard-touch-id-numeric-usb-c',
    name: 'Magic Keyboard con Touch ID y teclado numérico (USB-C)',
    brand: 'Apple',
    category: 'mac',
    tagline: 'Autenticación con huella y teclas numéricas.',
    description:
      'Magic Keyboard con Touch ID y teclado numérico integrado. Requiere un ' +
      'Mac con chip de Apple para utilizar Touch ID.',
    price: 199,
    image: `${IMG}/magic-keyboard-touch-id-numeric-white.jpg`,
    variants: [
      {
        slug: 'blanco',
        label: 'Teclas blancas',
        image: `${IMG}/magic-keyboard-touch-id-numeric-white.jpg`,
        swatch: '#f2f2f7',
        price: 199,
      },
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
    keywords: ['magic keyboard', 'teclado', 'touch id', 'numerico', 'mac', 'usb-c'],
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
    image: `${IMG}/magic-mouse-white.jpg`,
    variants: [
      {
        slug: 'blanco',
        label: 'Superficie Multi-Touch blanca',
        image: `${IMG}/magic-mouse-white.jpg`,
        swatch: '#f2f2f7',
        price: 85,
      },
      {
        slug: 'negro',
        label: 'Superficie Multi-Touch negra',
        image: `${IMG}/magic-mouse-black.jpg`,
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
    compatibility: { families: ['mac'] },
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
    image: `${IMG}/magic-trackpad-white.jpg`,
    variants: [
      {
        slug: 'blanco',
        label: 'Superficie Multi-Touch blanca',
        image: `${IMG}/magic-trackpad-white.jpg`,
        swatch: '#f2f2f7',
        price: 139,
      },
      {
        slug: 'negro',
        label: 'Superficie Multi-Touch negra',
        image: `${IMG}/magic-trackpad-black.jpg`,
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
    compatibility: { families: ['mac'] },
    aliases: ['magic trackpad', 'trackpad mac', 'trackpad apple'],
    keywords: ['magic trackpad', 'trackpad', 'mac', 'usb-c'],
    bananaSource:
      'https://tienda.bananacomputer.com/accesorios-apple/accesorios-mac/',
    verifiedOn: VERIFIED_ON,
    availabilityLabel: 'Producto mostrado públicamente por Banana',
    provisionalTags: ['Precio demostrativo'],
  },
]
