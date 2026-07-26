import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { Icon } from '../ui/Icon'

// Pie de página (§2.9): bloques temáticos. En móvil se colapsan en acordeón
// (aquí, con <details> nativo, accesible por teclado).
const blocks: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Contáctanos',
    links: [
      { label: 'Centro de soporte', to: '/soporte' },
      { label: 'Nuestras tiendas', to: '/tiendas' },
      { label: 'Chat y teléfono', to: '/soporte' },
    ],
  },
  {
    title: 'Más sobre Banana',
    links: [
      { label: 'Quiénes somos', to: '/servicios' },
      { label: 'Empresas', to: '/servicios' },
      { label: 'Blog', to: '/' },
    ],
  },
  {
    title: 'Ayuda y servicios',
    links: [
      { label: 'Financiación', to: '/servicios#financiacion' },
      { label: 'Envíos', to: '/servicios#envios' },
      { label: 'Plan Renove', to: '/plan-renove' },
      { label: 'Seguimiento de pedido', to: '/soporte' },
      { label: 'Servicio técnico', to: '/soporte' },
    ],
  },
  {
    title: 'Condiciones de compra',
    links: [
      { label: 'Ver todos los productos', to: '/buscar' },
      { label: 'Comparador', to: '/comparar' },
      { label: 'Educación', to: '/servicios' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line bg-neutral">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-2 md:grid-cols-4 md:gap-8">
          {blocks.map((b) => (
            <details key={b.title} className="group border-b border-line md:border-0" open>
              <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-bold text-ink md:cursor-default md:py-0 md:pb-4">
                {b.title}
                <Icon name="chevron-down" size={16} className="text-muted transition-transform group-open:rotate-180 md:hidden" />
              </summary>
              <ul className="space-y-2 pb-4 md:pb-0">
                {b.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-muted transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="text-xs leading-relaxed text-muted">
            Prototipo de demostración · Contenido de ejemplo, sin sistemas reales. Ningún precio o condición es
            definitivo.
          </p>
          <div className="flex items-center gap-3 text-muted">
            <button aria-label="Tienda favorita" className="text-sm hover:text-ink">
              Tienda favorita: Triana
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
