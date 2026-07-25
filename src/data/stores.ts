import type { Store } from './types'

// Tiendas de ejemplo. Horarios y servicios son demostrativos.
const week = (weekday: string, sat: string, sun = 'Cerrado') => [
  { day: 'Lunes', time: weekday },
  { day: 'Martes', time: weekday },
  { day: 'Miércoles', time: weekday },
  { day: 'Jueves', time: weekday },
  { day: 'Viernes', time: weekday },
  { day: 'Sábado', time: sat },
  { day: 'Domingo', time: sun },
]

export const ALL_SERVICES = [
  'Click & Collect',
  'Parking gratuito',
  'Plan Renove',
  'Servicio técnico',
  'Financiación presencial',
] as const

export const stores: Store[] = [
  {
    slug: 'triana',
    name: 'Banana Triana',
    island: 'Gran Canaria',
    address: 'Calle Triana, 100 · Las Palmas de Gran Canaria',
    openNow: true,
    hours: week('10:00–20:00', '10:00–14:00'),
    services: ['Click & Collect', 'Plan Renove', 'Servicio técnico', 'Financiación presencial'],
  },
  {
    slug: 'plaza-espana',
    name: 'Banana Plaza de España',
    island: 'Gran Canaria',
    address: 'Plaza de España, 5 · Las Palmas de Gran Canaria',
    openNow: true,
    hours: week('10:00–21:00', '10:00–20:00'),
    services: ['Click & Collect', 'Parking gratuito', 'Plan Renove', 'Servicio técnico', 'Financiación presencial'],
  },
  {
    slug: 'castillo',
    name: 'Banana Castillo',
    island: 'Tenerife',
    address: 'Av. de las Palmeras, 22 · Santa Cruz de Tenerife',
    openNow: false,
    hours: week('10:00–20:00', 'Cerrado'),
    services: ['Click & Collect', 'Servicio técnico', 'Financiación presencial'],
  },
  {
    slug: 'mesa-lopez',
    name: 'Banana Mesa y López',
    island: 'Gran Canaria',
    address: 'Av. Mesa y López, 18 · Las Palmas de Gran Canaria',
    openNow: true,
    hours: week('09:30–20:30', '10:00–14:00'),
    services: ['Click & Collect', 'Parking gratuito', 'Plan Renove'],
  },
  {
    slug: 'la-laguna',
    name: 'Banana La Laguna',
    island: 'Tenerife',
    address: 'Calle Herradores, 40 · San Cristóbal de La Laguna',
    openNow: false,
    hours: week('10:00–20:00', '10:00–14:00'),
    services: ['Click & Collect', 'Plan Renove', 'Servicio técnico'],
  },
]

export const islands = ['Todas', 'Gran Canaria', 'Tenerife']

export function getStore(slug: string) {
  return stores.find((s) => s.slug === slug)
}
