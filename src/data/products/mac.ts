// Familia Mac del catálogo del prototipo.
// Añadir un modelo nuevo → ver `src/data/README.md`.

import type { Model } from '../types'
import { IMG, buildColors } from './_shared'

const macSpecs = (chip: string, format: string, memory: string): Model['specs'] => [
  { label: 'Chip', value: chip },
  { label: 'Formato', value: format },
  { label: 'Memoria', value: memory },
  { label: 'Sistema', value: 'macOS' },
  { label: 'Inteligencia', value: 'Compatible con Apple Intelligence' },
]

export const macModels: Model[] = [
  {
    slug: 'macbook-neo',
    family: 'mac',
    name: 'MacBook Neo',
    tagline: 'Un Mac ligero y accesible para estudiar, crear y trabajar cada día.',
    fromPrice: 749,
    financeFrom: { monthly: 32, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/macbook-neo-plata.webp`, caps: [['8 GB · 256 GB', 749], ['8 GB · 512 GB', 999]] },
      { slug: 'citrico', name: 'Cítrico', hex: '#d0c875', image: `${IMG}/macbook-neo-citrico.webp`, caps: [['8 GB · 256 GB', 749], ['8 GB · 512 GB', 999]] },
      { slug: 'rosa-nube', name: 'Rosa nube', hex: '#e8bfc4', image: `${IMG}/macbook-neo-rosa-nube.webp`, caps: [['8 GB · 256 GB', 749], ['8 GB · 512 GB', 999]] },
      { slug: 'indigo', name: 'Índigo', hex: '#6b7ab8', image: `${IMG}/macbook-neo-indigo.webp`, caps: [['8 GB · 256 GB', 749], ['8 GB · 512 GB', 999]] },
    ]),
    specs: macSpecs('Apple Silicon', 'Portátil de 13"', '8 o 16 GB'),
    highlights: ['Diseño ligero', 'Pantalla de 13 pulgadas', 'Autonomía para todo el día', 'Touch ID', 'macOS'],
  },
  {
    slug: 'macbook-air-m4',
    family: 'mac',
    name: 'MacBook Air M4',
    tagline: 'Diseño ultrafino, gran autonomía y potencia M4 para todo el día.',
    fromPrice: 1119,
    financeFrom: { monthly: 47, months: 24 },
    colors: buildColors([
      { slug: 'medianoche', name: 'Medianoche', hex: '#2c3138', image: `${IMG}/macbook-air-medianoche.webp`, caps: [['13" · 16 GB · 256 GB', 1119, 1199], ['13" · 16 GB · 512 GB', 1369], ['15" · 16 GB · 256 GB', 1299, 1379], ['15" · 16 GB · 512 GB', 1549]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/macbook-air-plata.webp`, caps: [['13" · 16 GB · 256 GB', 1119, 1199], ['13" · 16 GB · 512 GB', 1369], ['15" · 16 GB · 256 GB', 1299, 1379], ['15" · 16 GB · 512 GB', 1549]] },
      { slug: 'blanco-estrella', name: 'Blanco estrella', hex: '#ded8ca', image: `${IMG}/macbook-air-blanco-estrella.webp`, caps: [['13" · 16 GB · 256 GB', 1119, 1199], ['13" · 16 GB · 512 GB', 1369], ['15" · 16 GB · 256 GB', 1299, 1379], ['15" · 16 GB · 512 GB', 1549]] },
      { slug: 'azul-cielo', name: 'Azul cielo', hex: '#a9c3d6', image: `${IMG}/macbook-air-skyblue.webp`, caps: [['13" · 16 GB · 256 GB', 1119, 1199], ['13" · 16 GB · 512 GB', 1369], ['15" · 16 GB · 256 GB', 1299, 1379], ['15" · 16 GB · 512 GB', 1549]] },
    ]),
    specs: macSpecs('Apple M4', 'Portátil de 13" o 15"', '16 GB'),
    highlights: ['Chip Apple M4', 'Dos tamaños', 'Diseño sin ventilador', 'Hasta 18 h de autonomía', 'MagSafe'],
  },
  {
    slug: 'macbook-pro-m4',
    family: 'mac',
    name: 'MacBook Pro M4',
    tagline: 'Rendimiento profesional M4 y pantalla Liquid Retina XDR.',
    fromPrice: 1699,
    financeFrom: { monthly: 71, months: 24 },
    colors: buildColors([
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/mac-mbp14-negro.webp`, caps: [['14" · 16 GB · 512 GB', 1699, 1899], ['16" · 24 GB · 512 GB', 2699]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/mac-mbp14-plata.webp`, caps: [['14" · 16 GB · 512 GB', 1699, 1899], ['16" · 24 GB · 512 GB', 2699]] },
    ]),
    specs: macSpecs('Apple M4', 'Portátil de 14" o 16"', 'Desde 16 GB'),
    highlights: ['Chip Apple M4', 'Pantalla Liquid Retina XDR', 'Hasta 24 h de batería', 'HDMI y SDXC', 'MagSafe'],
  },
  {
    slug: 'macbook-air-m5',
    family: 'mac',
    name: 'MacBook Air M5',
    tagline: 'El portátil fino y ligero de Apple, ahora superpotenciado con M5.',
    fromPrice: 1319,
    financeFrom: { monthly: 55, months: 24 },
    colors: buildColors([
      { slug: 'azul-cielo', name: 'Azul cielo', hex: '#a9c3d6', image: `${IMG}/macbook-air-skyblue.webp`, caps: [['13" · 16 GB · 512 GB', 1319], ['13" · 24 GB · 512 GB', 1579], ['15" · 16 GB · 512 GB', 1579, 1649], ['15" · 24 GB · 512 GB', 1849]] },
      { slug: 'medianoche', name: 'Medianoche', hex: '#2c3138', image: `${IMG}/macbook-air-medianoche.webp`, caps: [['13" · 16 GB · 512 GB', 1319], ['13" · 24 GB · 512 GB', 1579], ['15" · 16 GB · 512 GB', 1579, 1649], ['15" · 24 GB · 512 GB', 1849]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/macbook-air-plata.webp`, caps: [['13" · 16 GB · 512 GB', 1319], ['13" · 24 GB · 512 GB', 1579], ['15" · 16 GB · 512 GB', 1579, 1649], ['15" · 24 GB · 512 GB', 1849]] },
      { slug: 'blanco-estrella', name: 'Blanco estrella', hex: '#ded8ca', image: `${IMG}/macbook-air-blanco-estrella.webp`, caps: [['13" · 16 GB · 512 GB', 1319], ['13" · 24 GB · 512 GB', 1579], ['15" · 16 GB · 512 GB', 1579, 1649], ['15" · 24 GB · 512 GB', 1849]] },
    ]),
    specs: macSpecs('Apple M5', 'Portátil de 13" o 15"', '16 GB'),
    highlights: ['Chip Apple M5', 'Dos tamaños', 'Hasta 18 h de autonomía', 'Apple Intelligence', 'MagSafe'],
  },
  {
    slug: 'macbook-pro-m5',
    family: 'mac',
    name: 'MacBook Pro M5',
    tagline: 'Potencia profesional de nueva generación para los proyectos más exigentes.',
    fromPrice: 1839,
    financeFrom: { monthly: 77, months: 24 },
    colors: buildColors([
      { slug: 'negro', name: 'Negro espacial', hex: '#2a2a2c', image: `${IMG}/macbook-pro-m5-negro-16.webp`, caps: [['14" · 16 GB · 1 TB', 1839, 2119], ['16" · 24 GB · 1 TB', 2999]] },
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/macbook-pro-m5-plata-14.webp`, caps: [['14" · 16 GB · 1 TB', 1839, 2119], ['16" · 24 GB · 1 TB', 2999]] },
    ]),
    specs: macSpecs('Apple M5', 'Portátil de 14" o 16"', 'Desde 16 GB'),
    highlights: ['Chip Apple M5', 'Pantalla Liquid Retina XDR', 'Rendimiento profesional', 'Thunderbolt', 'Hasta 24 h de batería'],
  },
  {
    slug: 'imac-24-m4',
    family: 'mac',
    name: 'iMac 24" M4',
    tagline: 'Todo en uno. Todo color. Una pantalla Retina 4,5K espectacular.',
    fromPrice: 1499,
    financeFrom: { monthly: 63, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/imac-24-m4-plata.webp`, imageBg: '#e8e8ec', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'azul', name: 'Azul', hex: '#7babcd', image: `${IMG}/imac-24-m4-azul.webp`, imageBg: '#bdd5e8', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'verde', name: 'Verde', hex: '#6aaa8a', image: `${IMG}/imac-24-m4-verde.webp`, imageBg: '#b4d4c4', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'rosa', name: 'Rosa', hex: '#e0929f', image: `${IMG}/imac-24-m4-rosa.webp`, imageBg: '#efc8cf', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'amarillo', name: 'Amarillo', hex: '#f5c842', image: `${IMG}/imac-24-m4-amarillo.webp`, imageBg: '#fae3a0', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'naranja', name: 'Naranja', hex: '#df7944', image: `${IMG}/imac-24-m4-naranja.webp`, imageBg: '#efbca1', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
      { slug: 'morado', name: 'Morado', hex: '#9b86bd', image: `${IMG}/imac-24-m4-morado.webp`, imageBg: '#cdc2de', caps: [['16 GB · 256 GB', 1499], ['16 GB · 512 GB', 1749], ['24 GB · 512 GB', 1999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: macSpecs('Apple M4', 'Todo en uno de 24"', 'Desde 16 GB'),
    highlights: ['Pantalla Retina 4,5K', 'Chip Apple M4', 'Diseño todo en uno', 'Cámara Center Stage', 'Seis altavoces'],
  },
  {
    slug: 'mac-studio',
    family: 'mac',
    name: 'Mac Studio',
    tagline: 'Potencia de estudio profesional en un diseño increíblemente compacto.',
    fromPrice: 2499,
    financeFrom: { monthly: 105, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/mac-studio-photo.webp`, caps: [['M4 Max · 36 GB · 512 GB', 2499], ['M3 Ultra · 96 GB · 1 TB', 4999, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: macSpecs('M4 Max o M3 Ultra', 'Sobremesa compacto', 'Desde 36 GB'),
    highlights: ['M4 Max o M3 Ultra', 'Diseño compacto', 'Conectividad profesional', 'Hasta cinco pantallas', 'Alto rendimiento sostenido'],
  },
  {
    slug: 'mac-mini-m4',
    family: 'mac',
    name: 'Mac mini M4',
    tagline: 'Un pequeño gigante con M4 para aprovechar tu pantalla y accesorios.',
    fromPrice: 719,
    financeFrom: { monthly: 30, months: 24 },
    colors: buildColors([
      { slug: 'plata', name: 'Plata', hex: '#d8d9dc', image: `${IMG}/mac-mini-m4-photo.webp`, caps: [['16 GB · 256 GB', 719], ['16 GB · 512 GB', 949], ['M4 Pro · 24 GB · 512 GB', 1649]] },
    ]),
    specs: macSpecs('Apple M4 o M4 Pro', 'Sobremesa compacto', 'Desde 16 GB'),
    highlights: ['Chip M4 o M4 Pro', 'Diseño ultracompacto', 'Thunderbolt', 'HDMI', 'Gigabit Ethernet'],
  },
]
