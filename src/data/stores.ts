import type { Store } from './types'

// Direcciones y horarios contrastados con las fichas oficiales de Banana
// Computer el 2026-07-26. Pueden variar en festivos; la interfaz no infiere un
// estado en tiempo real y enlaza siempre a la fuente.
const week = (weekday: string, sat: string, sun = 'Cerrado') => [
  { day: 'Lunes', time: weekday },
  { day: 'Martes', time: weekday },
  { day: 'Miércoles', time: weekday },
  { day: 'Jueves', time: weekday },
  { day: 'Viernes', time: weekday },
  { day: 'Sábado', time: sat },
  { day: 'Domingo', time: sun },
]

// Servicios universales (todas las tiendas los ofrecen), se muestran como nota
// general en vez de repetirlos en cada tienda.
export const UNIVERSAL_SERVICES = [
  'Click & Collect',
  'Parking gratuito',
  'Plan Renove',
  'Financiación presencial',
] as const

// Solo se listan/filtran los servicios que diferencian a unas tiendas de otras.
export const ALL_SERVICES = ['Servicio técnico'] as const
export const STORE_HOURS_NOTICE =
  'Horario consultado el 26/07/2026. Puede variar en festivos; confirma antes de desplazarte.'

export const stores: Store[] = [
  {
    slug: 'triana',
    name: 'Banana Triana',
    island: 'Gran Canaria',
    address: 'Calle Triana, 105 · 35002 Las Palmas de Gran Canaria',
    coords: { lat: 28.10665, lng: -15.41957 },
    hours: week('10:00–20:30', '10:30–14:30 · 17:00–20:00'),
    hoursSource: 'https://tienda.bananacomputer.com/tienda/triana-las-palmas-gc/',
    hoursVerifiedOn: '2026-07-26',
    services: [],
  },
  {
    slug: 'plaza-espana',
    name: 'Banana Plaza de España',
    island: 'Gran Canaria',
    address: 'Plaza de España, 9 · 35006 Las Palmas de Gran Canaria',
    coords: { lat: 28.10130, lng: -15.41230 },
    hours: week('10:00–20:30', '10:30–20:00'),
    hoursSource: 'https://tienda.bananacomputer.com/tienda/plaza-de-espana-las-palmas-gc/',
    hoursVerifiedOn: '2026-07-26',
    services: [],
  },
  {
    slug: 'castillo',
    name: 'Banana Castillo',
    island: 'Tenerife',
    address: 'Calle Castillo, 67 · 38003 Santa Cruz de Tenerife',
    coords: { lat: 28.46810, lng: -16.25130 },
    hours: week('10:00–20:30', '10:30–20:00'),
    hoursSource: 'https://tienda.bananacomputer.com/tienda/castillo-sc-tenerife/',
    hoursVerifiedOn: '2026-07-26',
    services: ['Servicio técnico'],
  },
  {
    slug: 'la-laguna',
    name: 'Banana La Laguna',
    island: 'Tenerife',
    address: 'Calle Obispo Rey Redondo, 41 · 38201 San Cristóbal de La Laguna',
    coords: { lat: 28.48861, lng: -16.31549 },
    hours: week('10:00–20:30', '10:30–20:00'),
    hoursSource: 'https://tienda.bananacomputer.com/tienda/la-laguna-sc-tenerife/',
    hoursVerifiedOn: '2026-07-26',
    services: [],
  },
  {
    slug: 'safari',
    name: 'Banana Safari',
    island: 'Tenerife',
    address: 'C.C. Safari, locales 10 y 11 · Av. Las Américas, 5 · 38660 Playa de las Américas',
    coords: { lat: 28.07960, lng: -16.73320 },
    hours: week('10:00–22:00', '10:00–22:00'),
    hoursSource: 'https://tienda.bananacomputer.com/tienda/safari-sc-tenerife/',
    hoursVerifiedOn: '2026-07-26',
    services: [],
  },
]

export const islands = ['Todas', 'Gran Canaria', 'Tenerife']

export function getStore(slug: string) {
  return stores.find((s) => s.slug === slug)
}

export function currentStoreDay(date = new Date()) {
  const weekday = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    timeZone: 'Atlantic/Canary',
  }).format(date)

  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

export function getTodayHours(store: Store, date = new Date()) {
  const today = currentStoreDay(date)
  return store.hours.find((entry) => entry.day === today)
}

// Convierte "HH:MM" en minutos desde medianoche. "24:00" → 1440.
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.trim().split(':').map(Number)
  return h * 60 + (m || 0)
}

// Devuelve `true` si en `date` (hora de Canarias) la tienda está abierta.
// Interpreta strings tipo "10:00–20:30" o "10:30–14:30 · 17:00–20:00" o
// cualquiera que contenga "Cerrado".
export function isOpenNow(store: Store, date = new Date()) {
  const entry = getTodayHours(store, date)
  if (!entry || /cerrado/i.test(entry.time)) return false

  const nowStr = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Atlantic/Canary',
  }).format(date)
  const now = toMinutes(nowStr)

  // Puede haber tramos separados por " · " (mediodía). El separador de rango
  // es un guion largo "–" o un guion normal "-".
  return entry.time.split('·').some((chunk) => {
    const [start, end] = chunk.split(/[–-]/).map((s) => s.trim())
    if (!start || !end) return false
    return now >= toMinutes(start) && now < toMinutes(end)
  })
}
