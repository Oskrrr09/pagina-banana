import { Link, Outlet, useParams } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { Container } from '../ui/Container'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'

export function CheckoutLayout() {
  const t = useT()
  const { step } = useParams()
  const showCartLink = step !== '3'

  return (
    <div className="flex min-h-screen flex-col bg-neutral">
      <a
        href="#contenido-checkout"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[8px] focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
      >
        Saltar al contenido
      </a>

      {/* La cabecera va en amarillo Banana como la del resto de la aplicación.
          Antes usaba `--color-checkout`, el amarillo pálido del flujo de pago, y
          era la única pantalla de cliente con otra barra.

          El `paddingTop` reserva el hueco de la barra de estado en el móvil:
          este layout vive fuera del armazón de la app —no monta `AppTopBar`—,
          así que sin él la cabecera quedaría bajo el reloj. El FONDO de la
          página sigue siendo el suyo: aquí sólo cambia la barra. */}
      <header className="border-b border-black/10 bg-banana" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Container className="flex min-h-16 items-center justify-between gap-4 py-2">
          <Logo />
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden items-center gap-1.5 text-sm font-semibold text-ink sm:flex">
              <Icon name="shield" size={18} />
              {t('checkout.secure')}
            </span>
            {showCartLink && (
              <Link
                to="/carrito"
                className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-muted hover:text-ink"
              >
                <Icon name="chevron-right" size={16} className="rotate-180" />
                {t('checkout.backToCart')}
              </Link>
            )}
          </div>
        </Container>
      </header>

      <main id="contenido-checkout" className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
