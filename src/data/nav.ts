import { iphoneModels } from './products'

// Navegación principal (§2.2). Las familias abren mega-menú (§2.4);
// Servicios/Tiendas/Soporte son enlaces directos.
// En este prototipo, la familia desarrollada a fondo es iPhone (§8): el resto
// muestra en su mega-menú un aviso y un enlace a la familia desarrollada.

export interface MegaColumn {
  explore: { label: string; to: string }[]
  buy: { label: string; to: string }[]
  featured: { name: string; cta: string; to: string; tint: string }
}

export interface FamilyNav {
  slug: string
  name: string
  demo: boolean // true = aún no desarrollada en el prototipo
  mega: MegaColumn
}

const serviceLinks = [
  { label: 'Financiación', to: '/servicios#financiacion' },
  { label: 'Plan Renove', to: '/plan-renove' },
  { label: 'Seguro a todo riesgo', to: '/servicios#seguro' },
  { label: 'Accesorios', to: '/buscar?q=accesorios' },
]

const iphoneNav: FamilyNav = {
  slug: 'iphone',
  name: 'iPhone',
  demo: false,
  mega: {
    explore: [
      ...iphoneModels.map((m) => ({ label: m.name, to: `/iphone/${m.slug}` })),
      { label: 'Comparar modelos', to: '/comparar' },
    ],
    buy: serviceLinks,
    featured: { name: 'iPhone 17 Pro', cta: 'Ver la novedad', to: '/iphone/17-pro', tint: '#c8642a' },
  },
}

function demoFamily(slug: string, name: string, tint: string): FamilyNav {
  return {
    slug,
    name,
    demo: true,
    mega: {
      explore: [{ label: `Ver todo ${name}`, to: '/iphone' }],
      buy: serviceLinks,
      featured: { name, cta: 'Ver iPhone (desarrollado)', to: '/iphone', tint },
    },
  }
}

export const familiesNav: FamilyNav[] = [
  demoFamily('mac', 'Mac', '#8a8f98'),
  iphoneNav,
  demoFamily('ipad', 'iPad', '#5b7a9a'),
  demoFamily('apple-watch', 'Apple Watch', '#c0555a'),
  demoFamily('airpods', 'AirPods', '#4a4a4c'),
  demoFamily('accesorios', 'Accesorios', '#7fa08a'),
]

export const directLinks = [
  { label: 'Servicios', to: '/servicios' },
  { label: 'Tiendas', to: '/tiendas' },
  { label: 'Soporte', to: '/soporte' },
]
