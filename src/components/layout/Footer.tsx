import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { Icon } from '../ui/Icon'
import { useT } from '../../lib/i18n'
import type { ClaveTexto } from '../../lib/i18n'

// Pie de página (§2.9): acordeones cerrados en móvil y columnas en escritorio.
//
// Los rótulos son claves de traducción, no texto: el pie se ve en todas las
// páginas y es de lo primero que mira quien navega en otro idioma.
const blocks: { title: ClaveTexto; links: { label: ClaveTexto; to: string }[] }[] = [
  {
    title: 'footer.contact',
    links: [
      { label: 'footer.supportCenter', to: '/soporte' },
      { label: 'footer.ourStores', to: '/tiendas' },
      { label: 'footer.chatAndPhone', to: '/soporte' },
    ],
  },
  {
    title: 'footer.aboutBanana',
    links: [
      { label: 'footer.aboutUs', to: '/servicios' },
      { label: 'footer.business', to: '/servicios' },
      { label: 'footer.blog', to: '/' },
    ],
  },
  {
    title: 'footer.helpAndServices',
    links: [
      { label: 'footer.financing', to: '/servicios#financiacion' },
      { label: 'footer.shipping', to: '/servicios#envios' },
      { label: 'footer.tradeIn', to: '/plan-renove' },
      { label: 'footer.orderTracking', to: '/soporte' },
      { label: 'footer.repairService', to: '/soporte' },
    ],
  },
  {
    title: 'footer.purchaseTerms',
    links: [
      { label: 'footer.allProducts', to: '/buscar' },
      { label: 'footer.compare', to: '/comparar' },
      { label: 'footer.education', to: '/servicios' },
    ],
  },
]

export function Footer() {
  const t = useT()
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
                  {t(block.title)}
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
                {t(block.title)}
              </h2>
              <FooterLinks links={block.links} />
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="text-xs leading-relaxed text-muted">
            {t('footer.demoNotice')}
          </p>
          <div className="flex items-center gap-3 text-muted">
            <button aria-label={t('favStore.aria')} className="text-sm hover:text-ink">
              {t('favStore.current', { tienda: 'Triana' })}
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
  links: { label: ClaveTexto; to: string }[]
  className?: string
}) {
  const t = useT()
  return (
    <ul className={`min-w-0 space-y-2 ${className}`}>
      {links.map((link) => (
        <li key={link.label}>
          <Link
            to={link.to}
            className="break-words text-sm text-muted transition-colors hover:text-ink"
          >
            {t(link.label)}
          </Link>
        </li>
      ))}
    </ul>
  )
}
