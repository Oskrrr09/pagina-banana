import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { Icon } from '../ui/Icon'

// Pie de página (§2.9): acordeones cerrados en móvil y columnas en escritorio.
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
  const [openBlocks, setOpenBlocks] = useState<string[]>([])

  function toggleBlock(title: string) {
    setOpenBlocks((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    )
  }

  return (
    <footer className="overflow-x-clip border-t border-line bg-neutral">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="md:hidden">
          {blocks.map((block, index) => {
            const isOpen = openBlocks.includes(block.title)
            const panelId = `footer-mobile-panel-${index}`

            return (
              <div key={block.title} className="border-b border-line">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleBlock(block.title)}
                  className="flex min-h-11 w-full items-center justify-between py-2 text-left text-sm font-bold text-ink"
                >
                  {block.title}
                  <Icon
                    name="chevron-down"
                    size={16}
                    className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div id={panelId} hidden={!isOpen}>
                  <FooterLinks links={block.links} className="pb-4" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="hidden grid-cols-4 gap-8 md:grid">
          {blocks.map((block, index) => (
            <section key={block.title} aria-labelledby={`footer-desktop-heading-${index}`}>
              <h2
                id={`footer-desktop-heading-${index}`}
                className="pb-4 text-sm font-bold text-ink"
              >
                {block.title}
              </h2>
              <FooterLinks links={block.links} />
            </section>
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

function FooterLinks({
  links,
  className = '',
}: {
  links: { label: string; to: string }[]
  className?: string
}) {
  return (
    <ul className={`min-w-0 space-y-2 ${className}`}>
      {links.map((link) => (
        <li key={link.label}>
          <Link
            to={link.to}
            className="break-words text-sm text-muted transition-colors hover:text-ink"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
