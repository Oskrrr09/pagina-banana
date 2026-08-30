import { useEffect } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { isNativeApp } from '../../lib/nativeApp'
import { Container } from '../ui/Container'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'

export function CheckoutLayout() {
  const t = useT()
  const { step } = useParams()
  const showCartLink = step !== '3'

  // EN LA APP, AQUÍ TAMPOCO SE DESPLAZA EL DOCUMENTO
  //
  // El checkout sigue siendo un armazón aparte: no monta `AppTopBar` ni
  // `AppTabBar` y conserva su cabecera. Lo único que adopta del armazón
  // general es el MODELO DE SCROLL —raíz a la altura del viewport, cabecera
  // fuera del desplazamiento y un solo contenedor que se mueve—, porque su
  // CTA anclado sufriría si no el problema que documenta `index.css`: en
  // WKWebView un `position: fixed` sobre scroll de documento se recoloca al
  // TERMINAR el gesto, así que mientras arrastras parece despegarse.
  //
  // El marcador es PROPIO. Reutilizar `data-app-shell` diría que el checkout
  // pasó a formar parte del armazón general, y no es cierto.
  useEffect(() => {
    if (!isNativeApp) return
    document.documentElement.setAttribute('data-checkout-shell', '')
    return () => document.documentElement.removeAttribute('data-checkout-shell')
  }, [])

  return (
    <div className={isNativeApp ? 'flex h-[100dvh] flex-col bg-neutral' : 'flex min-h-screen flex-col bg-neutral'}>
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

      {/* En la app este es el ÚNICO elemento que se desplaza; la cabecera es
          hermana suya y se queda quieta porque nada la mueve. `overscroll-none`
          además de contener el gesto quita el rebote al llegar al tope, que es
          lo que separaba el contenido de la cabecera. En la web, el documento
          sigue siendo el que se desplaza: nada de esto se aplica. */}
      <main
        id="contenido-checkout"
        className={isNativeApp ? 'min-h-0 flex-1 overflow-y-auto overscroll-none' : 'flex-1'}
      >
        <Outlet />
      </main>
    </div>
  )
}
