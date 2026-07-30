// Familia iPhone del catálogo del prototipo.
// Añadir un modelo nuevo → ver `src/data/README.md`.

import type { Model } from '../types'
import { IMG, buildColors } from './_shared'

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
