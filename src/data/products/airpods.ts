// Familia AirPods del catálogo del prototipo.
// Añadir un modelo nuevo → ver `src/data/README.md`.

import type { Model } from '../types'
import { IMG, buildColors } from './_shared'

export const airpodsModels: Model[] = [
  {
    slug: 'airpods-pro-3',
    family: 'airpods',
    name: 'AirPods Pro 3',
    tagline: 'La mejor cancelación de ruido, ahora con sensor de frecuencia cardiaca.',
    fromPrice: 279,
    financeFrom: { monthly: 12, months: 24 },
    colors: buildColors([
      { slug: 'blanco', name: 'Blanco', hex: '#ececec', image: `${IMG}/airpods-pro-hero.webp`, caps: [['USB-C', 279]] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple H2' },
      { label: 'Cancelación de ruido', value: 'Activa, mejorada' },
      { label: 'Audio', value: 'Espacial personalizado' },
      { label: 'Salud', value: 'Sensor de frecuencia cardiaca' },
      { label: 'Batería', value: 'Hasta 8 h (30 h con estuche)' },
    ],
    highlights: ['Cancelación activa de ruido', 'Audio Espacial personalizado', 'Sensor de frecuencia cardiaca', 'Chip H2', 'Estuche USB-C'],
  },
  {
    slug: 'airpods-4-anc',
    family: 'airpods',
    name: 'AirPods 4 con Cancelación Activa de Ruido',
    tagline: 'Ajuste abierto con cancelación activa de ruido y Audio Espacial.',
    fromPrice: 199,
    financeFrom: { monthly: 8, months: 24 },
    // PNG 1080×1080 RGBA descargado desde el CDN de Apple
    // (as-images.apple.com/is/airpods-4-up-compare-202409, fmt=png-alpha).
    colors: buildColors([
      { slug: 'blanco', name: 'Blanco', hex: '#ececec', image: `${IMG}/airpods-4-anc.webp`, caps: [['USB-C', 199]] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple H2' },
      { label: 'Cancelación de ruido', value: 'Activa, en formato abierto' },
      { label: 'Audio', value: 'Espacial personalizado' },
      { label: 'Batería', value: 'Hasta 4 h (30 h con estuche)' },
      { label: 'Conector', value: 'USB-C' },
    ],
    highlights: ['Cancelación activa de ruido', 'Chip H2', 'Audio Espacial personalizado', 'Estuche USB-C con carga inalámbrica', 'Ajuste abierto'],
  },
  {
    slug: 'airpods-4',
    family: 'airpods',
    name: 'AirPods 4',
    tagline: 'La nueva generación con Chip H2 y Audio Espacial personalizado.',
    fromPrice: 149,
    financeFrom: { monthly: 6, months: 24 },
    // PNG 1080×1080 RGBA descargado desde el CDN de Apple
    // (as-images.apple.com/is/airpods-4-down-compare-202409, fmt=png-alpha).
    colors: buildColors([
      { slug: 'blanco', name: 'Blanco', hex: '#ececec', image: `${IMG}/airpods-4.webp`, caps: [['USB-C', 149]] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple H2' },
      { label: 'Cancelación de ruido', value: 'No incluye' },
      { label: 'Audio', value: 'Espacial personalizado' },
      { label: 'Batería', value: 'Hasta 5 h (30 h con estuche)' },
      { label: 'Conector', value: 'USB-C' },
    ],
    highlights: ['Chip H2', 'Audio Espacial personalizado', 'Ajuste rediseñado', 'Estuche USB-C', 'Formato abierto'],
  },
  {
    slug: 'airpods-max',
    family: 'airpods',
    name: 'AirPods Max',
    tagline: 'Sonido de altísima fidelidad en unos auriculares de diadema.',
    fromPrice: 579,
    financeFrom: { monthly: 24, months: 24 },
    colors: buildColors([
      { slug: 'medianoche', name: 'Medianoche', hex: '#2c2f36', image: `${IMG}/airpods-max-medianoche.webp`, caps: [['USB-C', 579]] },
      { slug: 'azul', name: 'Azul', hex: '#6d92ad', image: `${IMG}/airpods-max-azul.webp`, caps: [['USB-C', 579]] },
      { slug: 'purpura', name: 'Púrpura', hex: '#9b8bb4', image: `${IMG}/airpods-max-purpura.webp`, caps: [['USB-C', 579]] },
      { slug: 'naranja', name: 'Naranja', hex: '#e08a3c', image: `${IMG}/airpods-max-naranja.webp`, caps: [['USB-C', 579]] },
      { slug: 'blanco', name: 'Blanco estrella', hex: '#ece9e2', image: `${IMG}/airpods-max-blanco.webp`, caps: [['USB-C', 579, null, 'bajo-pedido', 'Recíbelo en 5-7 días']] },
    ]),
    specs: [
      { label: 'Chip', value: 'Apple H1' },
      { label: 'Cancelación de ruido', value: 'Activa' },
      { label: 'Audio', value: 'Espacial con seguimiento de la cabeza' },
      { label: 'Batería', value: 'Hasta 20 h' },
      { label: 'Conector', value: 'USB-C' },
    ],
    highlights: ['Audio de alta fidelidad', 'Cancelación activa de ruido', 'Audio Espacial', 'Hasta 20 h de batería', 'Diadema de acero y aluminio'],
  },
]
