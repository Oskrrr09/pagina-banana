import { families, modelsByFamily } from './products'

// Navegación principal (§2.2). Las familias abren mega-menú (§2.4);
// Servicios/Tiendas/Soporte son enlaces directos.

export interface MegaColumn {
  explore: { label: string; to: string }[]
  buy: { label: string; to: string }[]
  featured: { name: string; cta: string; to: string; tint: string }
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
    // Accesorios aún no tiene catálogo con fotos reales: enlaza a lo desarrollado.
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
  const featured = models[0]
  return {
    slug,
    name,
    demo: false,
    mega: {
      explore: [
        ...models.map((m) => ({ label: m.name, to: `/${slug}/${m.slug}` })),
        { label: `Comparar ${name}`, to: `/comparar?familia=${slug}` },
      ],
      buy: serviceLinks,
      featured: {
        name: featured.name,
        cta: 'Ver la novedad',
        to: `/${slug}/${featured.slug}`,
        tint: tints[slug] ?? '#8a8f98',
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
  { label: 'Tiendas', to: '/tiendas' },
  { label: 'Soporte', to: '/soporte' },
]
