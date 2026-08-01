import type { ClaveTexto } from '../lib/i18n'
import { families, modelsByFamily, variantPath } from './products'

// Navegación principal (§2.2). Las familias abren mega-menú (§2.4);
// Servicios/Tiendas/Soporte son enlaces directos.

export interface MegaColumn {
  explore: { label: string; to: string }[]
  buy: { label: string; to: string }[]
  featured: { name: string; cta: string; to: string; tint: string; image?: string; isNew?: boolean }
}

export interface FamilyNav {
  slug: string
  name: string
  demo: boolean // true = familia sin catálogo desarrollado en el prototipo
  mega: MegaColumn
}

const serviceLinks = [
  { label: 'Financiación', to: '/servicios#financiacion' },
  { label: 'Plan Renove', to: '/plan-renove' },
  { label: 'Seguro a todo riesgo', to: '/servicios#seguro' },
  { label: 'Todas las tiendas', to: '/tiendas' },
]

// Tinte del bloque "Destacado" por familia (decorativo, en negro y grises).
const tints: Record<string, string> = {
  mac: '#8a8f98',
  iphone: '#c8642a',
  ipad: '#5b7a9a',
  'apple-watch': '#c0555a',
  airpods: '#4a4a4c',
  accesorios: '#7fa08a',
}

function buildFamilyNav(slug: string, name: string): FamilyNav {
  const models = modelsByFamily[slug] ?? []
  const developed = models.length > 0
  if (!developed) {
    // Sin catálogo de modelos: para Accesorios enlazamos a la página real
    // `/accesorios`; para el resto (raros) se muestra un placeholder que
    // dirige al catálogo desarrollado por defecto.
    if (slug === 'accesorios') {
      return {
        slug,
        name,
        demo: false,
        mega: {
          explore: [
            { label: 'Ver todos los accesorios', to: '/accesorios' },
            { label: 'Carga y cables', to: '/accesorios' },
            { label: 'Fundas iPhone', to: '/accesorios' },
            { label: 'Accesorios iPad', to: '/accesorios' },
            { label: 'Accesorios Mac', to: '/accesorios' },
            { label: 'Accesorios Apple Watch', to: '/accesorios' },
            { label: 'AirTag', to: '/accesorios' },
          ],
          buy: serviceLinks,
          featured: {
            name: 'Accesorios Apple',
            cta: 'Ver el catálogo',
            to: '/accesorios',
            tint: tints[slug] ?? '#8a8f98',
          },
        },
      }
    }
    return {
      slug,
      name,
      demo: true,
      mega: {
        explore: [{ label: `Ver todo ${name}`, to: '/iphone' }],
        buy: serviceLinks,
        featured: { name, cta: 'Explorar el catálogo', to: '/iphone', tint: tints[slug] ?? '#8a8f98' },
      },
    }
  }
  const macOrder = [
    'macbook-neo',
    'macbook-air-m4',
    'macbook-air-m5',
    'macbook-pro-m4',
    'macbook-pro-m5',
    'imac-24-m4',
    'mac-studio',
    'mac-mini-m4',
  ]
  const ipadOrder = ['ipad-pro', 'ipad-air', 'ipad-mini', 'ipad-a16']
  const watchOrder = ['watch-ultra-3', 'watch-series-11', 'watch-se-3']
  const orderedModels =
    slug === 'mac'
      ? [...models].sort((a, b) => macOrder.indexOf(a.slug) - macOrder.indexOf(b.slug))
      : slug === 'ipad'
        ? [...models].sort((a, b) => ipadOrder.indexOf(a.slug) - ipadOrder.indexOf(b.slug))
        : slug === 'apple-watch'
          ? [...models].sort((a, b) => watchOrder.indexOf(a.slug) - watchOrder.indexOf(b.slug))
          : models
  const featured = orderedModels[0]
  return {
    slug,
    name,
    demo: false,
    mega: {
      explore: [
        ...orderedModels.map((m) => ({ label: m.name, to: variantPath(m) })),
        { label: `Comparar ${name}`, to: `/comparar?familia=${slug}` },
      ],
      buy: serviceLinks,
      featured: {
        name: featured.name,
        cta: 'Ver la novedad',
        to: variantPath(featured),
        tint: tints[slug] ?? '#8a8f98',
        image: featured.colors[0].image,
        isNew: featured.slug === 'macbook-neo',
      },
    },
  }
}

export const familiesNav: FamilyNav[] = families
  .filter((f) => f.slug !== 'accesorios')
  .map((f) => buildFamilyNav(f.slug, f.name))
  .concat(buildFamilyNav('accesorios', 'Accesorios'))

export const directLinks = [
  { label: 'Servicios', to: '/servicios' },
]

// Enlaces institucionales que aparecen en la barra superior (escritorio) y en
// el menú móvil como sección de servicios/ayuda.
// `label` es una clave de traducción, no texto: estos enlaces se ven en la
// barra superior y en el menú móvil, en todos los idiomas.
export const utilityLinks: { label: ClaveTexto; to: string; icon: string }[] = [
  { label: 'header.utility.finder', to: '/elige-tu-apple', icon: 'chat' },
  { label: 'header.utility.stores', to: '/tiendas', icon: 'store' },
  { label: 'header.utility.business', to: '/servicios', icon: 'package' },
  { label: 'header.utility.education', to: '/servicios', icon: 'graduation' },
  { label: 'header.utility.repair', to: '/servicio-tecnico', icon: 'wrench' },
  { label: 'header.utility.support', to: '/soporte', icon: 'info' },
]
