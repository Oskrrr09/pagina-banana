import { expect, test, type Page } from '@playwright/test'
import { avanzar, llegarAlPaso, rellenarPaso1, sembrarCarrito } from './checkout-helpers'

// ============================================================================
// FASE C2 — «COMPRAR SE SIENTE DE APP», AHORA EL CHECKOUT.
//
// QUÉ CAMBIA, Y POR QUÉ
//
// El checkout era el formulario web dentro de un WebView: el paso entero vivía
// en una tarjeta sobre fondo gris y la acción principal era un botón de 140 px
// alineado a la derecha que, a 320, empezaba a 836 px de una página de 1331.
// Había que recorrer dos pantallas para poder pagar. En la app la tarjeta
// exterior desaparece y el CTA se ancla abajo, a ancho útil.
//
// LO QUE ESTA SUITE PROTEGE DE VERDAD: LA ARQUITECTURA
//
// Anclar una barra no basta con ponerle `fixed`. En WKWebView un `position:
// fixed` sobre scroll de DOCUMENTO se recoloca al terminar el gesto y parece
// despegarse —está documentado en `index.css`, y es el motivo de que el
// armazón nativo deje el documento quieto—. Así que el checkout adopta el
// mismo MODELO DE SCROLL: raíz a la altura del viewport, cabecera fuera del
// desplazamiento y un único contenedor que se mueve.
//
// Un navegador de escritorio pintaría igual de bien las dos cosas. Por eso los
// casos de scroll no miran la foto: miran QUIÉN se desplaza. Si el documento
// vuelve a ser el que scrollea, se ponen rojos aunque la barra siga en su
// sitio.
//
// PERO EL CHECKOUT NO SE HA MUDADO AL ARMAZÓN GENERAL
//
// Sigue sin `AppTopBar`, sin `AppTabBar` y sin el carrito de la barra, y su
// marca es propia: `data-checkout-shell`, no `data-app-shell`. Comparte el
// modelo de scroll, no el significado. Eso también se comprueba.
//
// LA WEB NO CAMBIA (D-086)
//
// Sus casos verifican que sigue IGUAL: tarjeta con marco, `data-checkout-nav`
// dentro de ella, CTA pequeño y en flujo, y el documento desplazándose. No que
// esté mejor.
//
// Se mide geometría, estilo computado y parentesco. Las clases no son el
// contrato.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/** Quién es el dueño del scroll, y con qué marcas. */
async function armazon(page: Page) {
  return page.evaluate(() => {
    const raiz = document.documentElement
    const main = document.querySelector('#contenido-checkout') as HTMLElement | null
    return {
      marcaCheckout: raiz.hasAttribute('data-checkout-shell'),
      marcaArmazonGeneral: raiz.hasAttribute('data-app-shell'),
      topBar: document.querySelectorAll('[data-app-topbar]').length,
      tabBar: document.querySelectorAll('[data-app-tab-bar]').length,
      carritoDeLaBarra: document.querySelectorAll('[data-app-cart]').length,
      documentoSeDesplaza: raiz.scrollHeight > raiz.clientHeight,
      contenidoSeDesplaza: main ? main.scrollHeight > main.clientHeight : null,
      alturaDeLaRaiz: main?.parentElement ? Math.round(main.parentElement.getBoundingClientRect().height) : null,
      alturaDelViewport: raiz.clientHeight,
    }
  })
}

/** La barra anclada del CTA y su botón. */
async function barra(page: Page) {
  return page.evaluate(() => {
    const b = document.querySelector('[data-checkout-bar]')
    const nav = document.querySelector('[data-checkout-nav]')
    const boton = b?.querySelector('button')
    const rb = b?.getBoundingClientRect()
    const rc = boton?.getBoundingClientRect()
    const raiz = document.documentElement
    return {
      existe: !!b,
      posicion: b ? getComputedStyle(b).position : null,
      // El CTA principal es uno y sólo uno en toda la pantalla.
      botonesPrincipales: document.querySelectorAll('[data-checkout-bar] button, [data-checkout-nav] button').length,
      ctaEnLaBarra: b && boton ? b.contains(boton) : false,
      ctaAncho: rc ? Math.round(rc.width) : 0,
      ctaAlto: rc ? Math.round(rc.height) : 0,
      barraAncho: rb ? Math.round(rb.width) : 0,
      // Anclada al borde inferior de la pantalla: debajo no hay nada.
      distanciaAlBorde: rb ? Math.round(raiz.clientHeight - rb.bottom) : null,
      anchoViewport: raiz.clientWidth,
      overflowX: raiz.scrollWidth - raiz.clientWidth,
      // «Atrás» no se convierte en una segunda acción fija.
      atrasEnLaBarra: b ? b.querySelectorAll('a').length : null,
      botonesEnLaFila: nav ? nav.querySelectorAll('button').length : null,
    }
  })
}

/** La tarjeta que envuelve el paso completo: primer hijo de la rejilla. */
async function cardExterior(page: Page) {
  return page.evaluate(() => {
    const rejilla = [...document.querySelectorAll('#contenido-checkout div')].find(
      (d) => getComputedStyle(d).display === 'grid',
    )
    const card = rejilla?.firstElementChild
    const s = card ? getComputedStyle(card) : null
    const nav = document.querySelector('[data-checkout-nav]')
    return {
      borde: s ? parseFloat(s.borderTopWidth) : null,
      radio: s ? parseFloat(s.borderTopLeftRadius) : null,
      relleno: s ? parseFloat(s.paddingTop) : null,
      fondo: s ? s.backgroundColor : null,
      // En la web la fila de avance vive DENTRO de esa tarjeta.
      navDentroDeLaCard: card && nav ? card.contains(nav) : null,
    }
  })
}

/**
 * Baja hasta el final del contenido y mide qué queda por encima de la barra.
 *
 * EL SCROLL NO ES DEL DOCUMENTO: es de `#contenido-checkout`. Es el mismo error
 * que costó dos intentos en C1 —allí el contenedor era `main#contenido`— y por
 * eso se comprueba además que el desplazamiento se movió de verdad.
 */
async function alFinal(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{
        seDesplazo: boolean
        enElTope: boolean
        ultimoBloque: number
        barraTop: number
        libre: number
      }>((listo) => {
        const main = document.querySelector('#contenido-checkout') as HTMLElement
        main.scrollTop = main.scrollHeight
        setTimeout(() => {
          const b = document.querySelector('[data-checkout-bar]')!.getBoundingClientRect()
          // El último bloque de contenido real del paso es el resumen del
          // pedido: va después de la fila de «Atrás» y es lo que queda abajo.
          const aside = document.querySelector('#contenido-checkout aside')!.getBoundingClientRect()
          listo({
            seDesplazo: main.scrollTop > 0,
            enElTope: Math.abs(main.scrollTop - (main.scrollHeight - main.clientHeight)) <= 1,
            ultimoBloque: Math.round(aside.bottom),
            barraTop: Math.round(b.top),
            libre: Math.round(b.top - aside.bottom),
          })
        }, 350)
      }),
  )
}

// ---------------------------------------------------------------------------
// EL MODELO DE SCROLL — la parte que protege la arquitectura
// ---------------------------------------------------------------------------

test.describe('el checkout nativo desplaza su contenido, no el documento', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('el documento está quieto y quien se mueve es #contenido-checkout', async ({ page }) => {
    await comoApp(page)
    await llegarAlPaso(page, 1)

    const a = await armazon(page)
    expect(a.marcaCheckout, 'el checkout marca el documento con su propia marca').toBe(true)
    expect(a.documentoSeDesplaza, 'y así el documento deja de desplazarse').toBe(false)
    expect(a.contenidoSeDesplaza, 'el que se desplaza es el contenedor de contenido').toBe(true)
    // La raíz ocupa la pantalla: es lo que permite que el contenido tenga tope.
    expect(a.alturaDeLaRaiz).toBe(a.alturaDelViewport)

    // Y se mueve de verdad. Un contenedor que "podría" desplazarse pero no
    // responde a `scrollTo` dejaría pasar exactamente el defecto que se busca.
    const movido = await page.evaluate(() => {
      const main = document.querySelector('#contenido-checkout') as HTMLElement
      const antes = main.scrollTop
      main.scrollTo({ top: 240 })
      return { antes, despues: Math.round(main.scrollTop), ventana: Math.round(window.scrollY) }
    })
    expect(movido.antes).toBe(0)
    expect(movido.despues, 'scrollTo sobre el contenedor mueve el checkout').toBeGreaterThan(0)
    expect(movido.ventana, 'y la ventana sigue sin moverse porque no es la que scrollea').toBe(0)
  })

  test('sigue fuera del armazón general de la app, no se ha mudado a él', async ({ page }) => {
    await comoApp(page)
    await llegarAlPaso(page, 1)

    const a = await armazon(page)
    expect(a.topBar, 'sin barra superior de la app').toBe(0)
    expect(a.tabBar, 'sin navegación inferior').toBe(0)
    expect(a.carritoDeLaBarra, 'sin el carrito de la barra').toBe(0)
    // Compartir el modelo de scroll no es ser el armazón general: la marca de
    // aquél afirma cosas —barra, pestañas, chips— que aquí son falsas.
    expect(a.marcaArmazonGeneral, 'no usa la marca del armazón general').toBe(false)
    expect(a.marcaCheckout, 'usa la suya').toBe(true)
  })

  test('la marca se retira al salir del checkout', async ({ page }) => {
    await comoApp(page)
    await llegarAlPaso(page, 1)
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-checkout-shell'))).toBe(true)

    await page.goto('./carrito')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const fuera = await page.evaluate(() => ({
      checkout: document.documentElement.hasAttribute('data-checkout-shell'),
      armazon: document.documentElement.hasAttribute('data-app-shell'),
    }))
    expect(fuera.checkout, 'fuera del checkout su marca no queda pegada al documento').toBe(false)
    expect(fuera.armazon, 'y el armazón general recupera la suya').toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PASOS 1 Y 2 — composición y CTA, en los tres anchos
// ---------------------------------------------------------------------------

for (const [ancho, alto] of [
  [320, 568],
  [390, 844],
  [430, 932],
] as const) {
  test.describe(`el checkout nativo a ${ancho} px`, () => {
    test.use({ viewport: { width: ancho, height: alto } })

    test('el paso 1 pierde la tarjeta y su acción se ancla abajo', async ({ page }) => {
      await comoApp(page)
      await llegarAlPaso(page, 1)

      const c = await cardExterior(page)
      expect(c.borde, 'el paso ya no vive dentro de una tarjeta').toBe(0)
      expect(c.radio, 'ni conserva sus esquinas').toBe(0)
      expect(c.relleno, 'ni su relleno de caja').toBe(0)

      // Los campos siguen enteros: quitar el marco no es quitar el formulario.
      await expect(page.locator('input[autocomplete="name"]')).toBeVisible()
      await expect(page.locator('input[autocomplete="email"]')).toBeVisible()
      await expect(page.locator('input[autocomplete="street-address"]')).toBeVisible()

      const b = await barra(page)
      expect(b.existe, 'existe la barra de acción').toBe(true)
      expect(b.posicion, 'y está anclada').toBe('fixed')
      expect(b.botonesPrincipales, 'una sola acción principal, no dos').toBe(1)
      expect(b.ctaEnLaBarra, 'que vive en la barra, no en el flujo').toBe(true)
      expect(b.atrasEnLaBarra, '«Atrás» no se cuela en la barra como segunda acción').toBe(0)

      expect(b.ctaAlto, 'alto táctil').toBeGreaterThanOrEqual(44)
      expect(b.barraAncho).toBe(b.anchoViewport)
      expect(b.ctaAncho, 'el botón ocupa el ancho útil').toBeGreaterThan(b.anchoViewport - 40)
      // Apoyada en el borde inferior: aquí no hay tab bar debajo que esquivar.
      expect(b.distanciaAlBorde, 'la barra llega al borde de la pantalla').toBe(0)
      expect(b.overflowX, 'sin desbordamiento lateral').toBe(0)
    })

    test('el final del paso 1 se lee por encima de la barra', async ({ page }) => {
      await comoApp(page)
      await llegarAlPaso(page, 1)

      const f = await alFinal(page)
      expect(f.seDesplazo, 'el contenedor se desplazó de verdad').toBe(true)
      expect(f.enElTope, 'y llegó hasta el final').toBe(true)
      expect(f.libre, `el último bloque queda ${f.libre} px por encima del CTA`).toBeGreaterThanOrEqual(0)
    })

    test('el paso 2 conserva sus bloques y una sola confirmación anclada', async ({ page }) => {
      await comoApp(page)
      await llegarAlPaso(page, 2)

      const c = await cardExterior(page)
      expect(c.borde, 'tampoco aquí hay tarjeta envolviendo el paso').toBe(0)
      expect(c.relleno).toBe(0)

      // Lo de dentro sigue teniendo jerarquía: no se ha aplanado el paso.
      await expect(page.getByRole('button', { name: 'Financiación' })).toBeVisible()
      await expect(page.locator('p:text-is("Extras")')).toBeVisible()
      await expect(page.getByText(/Seguro para/)).toBeVisible()
      await expect(page.getByPlaceholder('Introduce tu código')).toBeVisible()
      await expect(page.locator('a[href$="/plan-renove"]')).toBeVisible()
      await expect(page.getByRole('link', { name: /Atrás/ }), '«Atrás» sigue en el flujo').toBeVisible()

      const b = await barra(page)
      expect(b.botonesPrincipales, 'un único «Confirmar pedido»').toBe(1)
      expect(b.botonesEnLaFila, 'y no queda otro en la fila de «Atrás»').toBe(0)
      expect(b.posicion).toBe('fixed')
      expect(b.ctaAlto).toBeGreaterThanOrEqual(44)
      expect(b.ctaAncho).toBeGreaterThan(b.anchoViewport - 40)
      expect(b.distanciaAlBorde).toBe(0)
      expect(b.overflowX).toBe(0)
      await expect(page.locator('[data-checkout-bar] button')).toHaveText('Confirmar pedido')
    })

    test('con la financiación abierta el paso 2 sigue llegando a su final', async ({ page }) => {
      // Abrir el simulador alarga la página: es el caso que más estira el
      // contenido y el que antes descubriría una compensación corta.
      await comoApp(page)
      await llegarAlPaso(page, 2)
      await page.getByRole('button', { name: 'Financiación' }).click()
      await expect(page.getByText('Simulador de cuotas')).toBeVisible()

      const f = await alFinal(page)
      expect(f.seDesplazo).toBe(true)
      expect(f.enElTope).toBe(true)
      expect(f.libre, `el último bloque queda ${f.libre} px por encima del CTA`).toBeGreaterThanOrEqual(0)
    })
  })
}

// ---------------------------------------------------------------------------
// COMPORTAMIENTO — el flujo real no cambia
// ---------------------------------------------------------------------------

test.describe('el checkout nativo sigue funcionando igual', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('el error de validación se ve y no queda tapado por la barra', async ({ page }) => {
    await comoApp(page)
    await sembrarCarrito(page)
    await page.goto('./checkout/1')
    await page.locator('input[autocomplete="email"]').fill('elena@example.test')
    await page.locator('input[autocomplete="street-address"]').fill('Calle Mayor 1')
    await avanzar(page)

    await expect(page, 'sin nombre no se pasa de paso').toHaveURL(/\/checkout\/1$/)
    const error = page.getByText('Introduce tu nombre.')
    await expect(error).toBeVisible()
    const tapado = await page.evaluate(() => {
      const b = document.querySelector('[data-checkout-bar]')!.getBoundingClientRect()
      const e = [...document.querySelectorAll('p')]
        .find((p) => /Introduce tu nombre\./.test(p.textContent ?? ''))!
        .getBoundingClientRect()
      return e.bottom > b.top
    })
    expect(tapado, 'el mensaje no cae debajo de la barra').toBe(false)
  })

  test('«Continuar» desde la barra avanza al paso 2', async ({ page }) => {
    await comoApp(page)
    await sembrarCarrito(page)
    await page.goto('./checkout/1')
    await rellenarPaso1(page)
    await page.locator('[data-checkout-bar] button').click()
    await expect(page).toHaveURL(/\/checkout\/2$/)
  })

  test('el paso 3 se alcanza por el flujo real, sin barra y sin tarjeta', async ({ page }) => {
    await comoApp(page)
    // `llegarAlPaso` recorre el flujo entero: rellena, avanza y confirma. El
    // pedido del paso 3 es real —lo crea `confirmOrder`—, no un molde.
    await llegarAlPaso(page, 3)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¡Pedido confirmado!')
    await expect(page.getByText(/BC-([0-9A-F]{12}|\d{6})/), 'con su número de pedido').toBeVisible()

    const b = await barra(page)
    expect(b.existe, 'la confirmación no monta una barra de Continuar/Confirmar').toBe(false)
    expect(b.botonesPrincipales).toBe(0)

    const c = await cardExterior(page)
    expect(c.borde, 'y también pierde la tarjeta exterior').toBe(0)

    const a = await armazon(page)
    expect(a.tabBar, 'sigue sin navegación inferior').toBe(0)
    expect(a.marcaCheckout, 'y sigue siendo su propio armazón').toBe(true)

    // Sin sesión: la compra de invitado llega a la confirmación igual.
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
    // El resumen se puede recorrer entero.
    await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// LA WEB SIGUE IGUAL (D-086)
// ---------------------------------------------------------------------------

for (const ancho of [320, 390] as const) {
  test.describe(`el checkout web conserva su composición a ${ancho} px`, () => {
    test.use({ viewport: { width: ancho, height: 844 } })

    test('tarjeta con marco, CTA en flujo y el documento desplazándose', async ({ page }) => {
      // No es que esté mejor: es que D-086 congela la web durante la Fase C.
      await llegarAlPaso(page, 2)

      const a = await armazon(page)
      expect(a.marcaCheckout, 'la web no lleva la marca del armazón del checkout').toBe(false)
      expect(a.documentoSeDesplaza, 'y sigue siendo el documento el que se desplaza').toBe(true)
      expect(a.contenidoSeDesplaza, 'el contenedor no tiene scroll propio').toBe(false)

      const c = await cardExterior(page)
      expect(c.borde, 'la tarjeta del paso conserva su marco').toBe(1)
      expect(c.radio, 'su radio').toBe(12)
      expect(c.relleno, 'y su relleno').toBe(24)
      expect(c.fondo, 'sobre fondo propio, no transparente').not.toBe('rgba(0, 0, 0, 0)')
      expect(c.navDentroDeLaCard, 'con la fila de avance dentro de ella').toBe(true)

      const b = await barra(page)
      expect(b.existe, 'sin barra anclada de la app').toBe(false)
      expect(b.botonesPrincipales, 'su CTA sigue en la fila').toBe(1)
      expect(b.botonesEnLaFila).toBe(1)

      const cta = await page.evaluate(() => {
        const fila = document.querySelector('[data-checkout-nav]')!
        const boton = fila.querySelector('button')!
        const rf = fila.getBoundingClientRect()
        const rb = boton.getBoundingClientRect()
        return {
          posicion: getComputedStyle(boton).position,
          ancho: Math.round(rb.width),
          anchoDeLaFila: Math.round(rf.width),
          // Alineado a la derecha de su fila: es la composición histórica.
          holguraDerecha: Math.round(rf.right - rb.right),
        }
      })
      expect(cta.posicion, 'el botón de la web no es fijo').not.toBe('fixed')
      expect(cta.ancho, 'y no ocupa la fila entera como el de la app').toBeLessThan(cta.anchoDeLaFila - 20)
      expect(cta.holguraDerecha, 'sigue pegado a la derecha').toBeLessThanOrEqual(1)
    })
  })
}
