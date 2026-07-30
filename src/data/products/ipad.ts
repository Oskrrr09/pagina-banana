// Familia iPad del catálogo del prototipo.
// Añadir un modelo nuevo → ver `src/data/README.md`.
//
// iPad Pro y Air unifican 11"+13" en un único producto: la pulgada se
// elige como parte de la capacidad, siguiendo el patrón de MacBook Pro.

import type { Model } from '../types'
import { IMG, buildColors, type CapSpec } from './_shared'

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
