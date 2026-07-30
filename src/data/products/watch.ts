// Familia Apple Watch del catálogo del prototipo.
// Añadir un modelo nuevo → ver `src/data/README.md`.
//
// El tamaño de caja se elige como parte de la capacidad (patrón MBP/iPad).

import type { Model } from '../types'
import { IMG, buildColors, type CapSpec } from './_shared'

const s11AlumCaps: CapSpec[] = [
  ['42 mm · GPS', 459], ['42 mm · GPS + Cellular', 559],
  ['46 mm · GPS', 489], ['46 mm · GPS + Cellular', 589],
]
const s11TitanCaps: CapSpec[] = [
  ['42 mm · GPS + Cellular', 799],
  ['46 mm · GPS + Cellular', 849, null, 'bajo-pedido', 'Recíbelo en 5-7 días'],
]

export const watchModels: Model[] = [
  {
    slug: 'watch-ultra-3',
    family: 'apple-watch',
    name: 'Apple Watch Ultra 3',
    tagline: 'Titanio aeronáutico, GPS de doble frecuencia y la mayor autonomía.',
    fromPrice: 909,
    financeFrom: { monthly: 38, months: 24 },
    colors: buildColors([
      { slug: 'natural-alpine', name: 'Titanio natural · Correa Alpine azul', hex: '#d0cec7', image: `${IMG}/watch-ultra-3-natural-alpine.webp`, caps: [['49 mm · GPS + Cellular', 909]] },
      { slug: 'natural-ocean', name: 'Titanio natural · Correa Ocean azul', hex: '#a9c3d6', image: `${IMG}/watch-ultra-3-natural-ocean.webp`, caps: [['49 mm · GPS + Cellular', 909]] },
      { slug: 'natural-milanese', name: 'Titanio natural · Milanese Loop', hex: '#c7c4bd', image: `${IMG}/watch-ultra-3-natural-milanese.webp`, caps: [['49 mm · GPS + Cellular', 909]] },
      { slug: 'negro-alpine', name: 'Titanio negro · Correa Alpine negra', hex: '#3a3a3c', image: `${IMG}/watch-ultra-3-black-alpine.webp`, caps: [['49 mm · GPS + Cellular', 909]] },
      { slug: 'negro-ocean', name: 'Titanio negro · Correa Ocean negra', hex: '#1c1c1e', image: `${IMG}/watch-ultra-3-black-ocean.webp`, caps: [['49 mm · GPS + Cellular', 909, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Caja', value: 'Titanio 49 mm' },
      { label: 'Pantalla', value: 'Retina LTPO3, 3000 nits' },
      { label: 'Chip', value: 'S11 SiP' },
      { label: 'Autonomía', value: 'Hasta 42 h (72 h en bajo consumo)' },
      { label: 'Resistencia', value: 'WR100 · EN13319 · MIL-STD-810H' },
      { label: 'Conectividad', value: 'GPS doble frecuencia · Cellular · Satélite' },
    ],
    highlights: ['Caja de titanio 49 mm', 'GPS de doble frecuencia', 'Hasta 42 h de batería', 'Mensajes vía satélite', 'Botón de acción configurable'],
  },
  {
    slug: 'watch-series-11',
    family: 'apple-watch',
    name: 'Apple Watch Series 11',
    tagline: 'La pantalla más grande y resistente, con nuevas funciones de salud.',
    fromPrice: 459,
    financeFrom: { monthly: 19, months: 24 },
    colors: buildColors([
      { slug: 'alum-jet-black', name: 'Aluminio negro azabache', hex: '#1c1c1e', image: `${IMG}/watch-s11-alum-jet-black.webp`, caps: s11AlumCaps },
      { slug: 'alum-rose-gold', name: 'Aluminio oro rosa', hex: '#dbb6b0', image: `${IMG}/watch-s11-alum-rose-gold.webp`, caps: s11AlumCaps },
      { slug: 'alum-silver', name: 'Aluminio plata', hex: '#e3e4e6', image: `${IMG}/watch-s11-alum-silver.webp`, caps: s11AlumCaps },
      { slug: 'alum-space-gray', name: 'Aluminio gris espacial', hex: '#8e8e93', image: `${IMG}/watch-s11-alum-space-gray.webp`, caps: s11AlumCaps },
      { slug: 'titan-natural', name: 'Titanio natural', hex: '#d0cec7', image: `${IMG}/watch-s11-titan-natural.webp`, caps: s11TitanCaps },
      { slug: 'titan-gold', name: 'Titanio oro', hex: '#c4a86e', image: `${IMG}/watch-s11-titan-gold.webp`, caps: s11TitanCaps },
      { slug: 'titan-slate', name: 'Titanio slate', hex: '#4a4a4c', image: `${IMG}/watch-s11-titan-slate.webp`, caps: s11TitanCaps },
    ]),
    specs: [
      { label: 'Caja', value: 'Aluminio o titanio (42 o 46 mm)' },
      { label: 'Pantalla', value: 'Retina LTPO3 siempre activa' },
      { label: 'Chip', value: 'S11 SiP' },
      { label: 'Salud', value: 'ECG, oxígeno en sangre, temperatura, apnea del sueño' },
      { label: 'Resistencia', value: 'WR50 · IP6X' },
      { label: 'Conectividad', value: 'GPS o GPS + Cellular' },
    ],
    highlights: ['Pantalla siempre activa', 'Chip S11', 'ECG y oxígeno en sangre', 'Detección de apnea del sueño', 'Aluminio o titanio'],
  },
  {
    slug: 'watch-se-3',
    family: 'apple-watch',
    name: 'Apple Watch SE 3',
    tagline: 'Lo esencial del Apple Watch, ahora más asequible.',
    fromPrice: 279,
    financeFrom: { monthly: 12, months: 24 },
    colors: buildColors([
      { slug: 'medianoche', name: 'Aluminio medianoche', hex: '#2c3138', image: `${IMG}/watch-se-3-midnight.webp`, caps: [
        ['40 mm · GPS', 279], ['40 mm · GPS + Cellular', 329],
        ['44 mm · GPS', 309], ['44 mm · GPS + Cellular', 359],
      ] },
      { slug: 'blanco-estrella', name: 'Aluminio blanco estrella', hex: '#ded8ca', image: `${IMG}/watch-se-3-starlight.webp`, caps: [
        ['40 mm · GPS', 279], ['40 mm · GPS + Cellular', 329],
        ['44 mm · GPS', 309], ['44 mm · GPS + Cellular', 359, null, 'bajo-pedido', 'Recíbelo en 5-7 días'],
      ] },
    ]),
    specs: [
      { label: 'Caja', value: 'Aluminio (40 o 44 mm)' },
      { label: 'Pantalla', value: 'Retina siempre activa' },
      { label: 'Chip', value: 'S10 SiP' },
      { label: 'Salud', value: 'Frecuencia cardiaca, detección de caídas' },
      { label: 'Resistencia', value: 'WR50' },
      { label: 'Conectividad', value: 'GPS o GPS + Cellular' },
    ],
    highlights: ['Modelo más asequible', 'Pantalla siempre activa', 'Chip S10', 'Detección de caídas', 'Tres colores'],
  },
]
