import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// FASE C1 — «COMPRAR SE SIENTE DE APP», EMPEZANDO POR EL CARRITO.
//
// QUÉ CAMBIA, Y POR QUÉ
//
// El CTA de compra vivía al final del resumen: para pulsarlo había que
// desplazarse hasta el fondo de una columna larga. En la app pasa a una barra
// anclada sobre la navegación, donde llega el pulgar. Y «Entrega o recogida»
// deja de envolver en una tarjeta dos opciones que ya son tarjetas.
//
// DÓNDE SE APOYA LA BARRA
//
// `AppTabBar` **no** es `fixed`: es el último hermano de la columna. Una barra
// en `bottom-0` quedaría detrás de ella —que además pinta con `z-50`— y su
// botón sería inalcanzable. Se sube `ALTURA_TAB_BAR`, que ya incluye el área
// segura. Es el mismo criterio que resolvió la barra de compra de la ficha.
//
// LA WEB NO CAMBIA
//
// D-086 sigue vigente. Los casos de web comprueban que **sigue igual**: su CTA
// dentro del resumen y su envoltorio de entrega con marco. No que esté mejor.
//
// Se mide geometría y estilo computado. Las clases no son el contrato.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/** Un carrito con una línea real, sembrado antes de que arranque la app. */
function conCarrito(page: Page) {
  return page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    localStorage.setItem(
      'banana:cart',
      JSON.stringify([
        {
          id: 'iphone/17-pro/plata/256GB',
          kind: 'device',
          family: 'iphone',
          modelSlug: '17-pro',
          name: 'iPhone 17 Pro',
          color: 'Plata',
          capacity: '256GB',
          price: 1229,
          qty: 1,
          insurance: false,
        },
      ]),
    )
  })
}

/** Geometría de la barra de compra, el CTA y la navegación inferior. */
async function geometria(page: Page) {
  return page.evaluate(() => {
    const barra = document.querySelector('[data-cart-bar]')
    const tab = document.querySelector('[data-app-tab-bar]')
    const ctas = [...document.querySelectorAll('a')].filter((a) => /Finalizar compra/.test(a.textContent ?? ''))
    const rb = barra?.getBoundingClientRect()
    const rt = tab?.getBoundingClientRect()
    const rc = ctas[0]?.getBoundingClientRect()
    return {
      hayBarra: !!barra,
      ctas: ctas.length,
      ctaEnLaBarra: barra ? barra.contains(ctas[0]) : false,
      ctaAncho: rc ? Math.round(rc.width) : 0,
      ctaAlto: rc ? Math.round(rc.height) : 0,
      anchoBarra: rb ? Math.round(rb.width) : 0,
      posicion: barra ? getComputedStyle(barra).position : null,
      // La barra debe terminar justo donde empieza la navegación: ni encima
      // —quedaría tapada— ni flotando por encima dejando un hueco.
      distanciaATabBar: rb && rt ? Math.round(rt.top - rb.bottom) : null,
      anchoViewport: document.documentElement.clientWidth,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

/** El envoltorio de «Entrega o recogida» y sus opciones. */
async function entrega(page: Page) {
  return page.evaluate(() => {
    const titulo = [...document.querySelectorAll('p')].find((e) => /Entrega o recogida/.test(e.textContent ?? ''))
    const caja = titulo?.parentElement
    const s = caja ? getComputedStyle(caja) : null
    const opciones = caja ? [...caja.querySelectorAll('button[aria-pressed]')] : []
    return {
      borde: s ? parseFloat(s.borderTopWidth) : null,
      radio: s ? parseFloat(s.borderTopLeftRadius) : null,
      relleno: s ? parseFloat(s.paddingTop) : null,
      opciones: opciones.length,
      // Las opciones conservan su propia superficie: eso no se toca.
      opcionConMarco: opciones.length > 0 ? parseFloat(getComputedStyle(opciones[0]).borderTopWidth) > 0 : false,
    }
  })
}

for (const [ancho, alto] of [
  [320, 568],
  [390, 844],
  [430, 932],
] as const) {
  test.describe(`el carrito nativo a ${ancho} px`, () => {
    test.use({ viewport: { width: ancho, height: alto } })

    test('la compra está donde llega el pulgar, sin pisar la navegación', async ({ page }) => {
      await comoApp(page)
      await conCarrito(page)
      await page.goto('./carrito')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const g = await geometria(page)
      expect(g.hayBarra, 'existe la barra de compra').toBe(true)
      expect(g.posicion, 'y está anclada').toBe('fixed')
      expect(g.ctas, 'una sola acción principal, no dos').toBe(1)
      expect(g.ctaEnLaBarra, 'y vive en la barra, no al final del resumen').toBe(true)

      expect(g.ctaAlto, 'alto táctil').toBeGreaterThanOrEqual(44)
      // Ancho útil: la barra ocupa el viewport y el botón casi todo su interior.
      expect(g.anchoBarra).toBe(g.anchoViewport)
      expect(g.ctaAncho, 'el botón ocupa el ancho útil').toBeGreaterThan(g.anchoViewport - 40)

      // Se apoya exactamente sobre la navegación: 0 px entre ambas.
      expect(g.distanciaATabBar, 'la barra termina donde empieza la tab bar').toBe(0)
      expect(g.overflowX, 'sin desbordamiento lateral').toBe(0)
    })

    test('el final de la página se puede leer por encima de la barra', async ({ page }) => {
      // Una barra fija que tape el último control deja trabajo sin terminar. Se
      // comprueba con el cross-sell, que es lo último que hay.
      await comoApp(page)
      await conCarrito(page)
      await page.goto('./carrito')

      // EN LA APP EL SCROLL NO ES DEL DOCUMENTO
      //
      // El armazón nativo deja la barra superior y la de pestañas fijas en la
      // columna, y lo que se desplaza es `main#contenido`. `window.scrollTo` no
      // mueve nada aquí —comprobado: `scrollY` se queda en 0—, así que el
      // desplazamiento tiene que hacerse sobre ese contenedor.
      await page.evaluate(() => {
        const c = document.querySelector('main')!
        c.scrollTop = c.scrollHeight
      })
      await page.waitForTimeout(300)

      const visible = await page.evaluate(() => {
        const barra = document.querySelector('[data-cart-bar]')!.getBoundingClientRect()
        // El último control **del carrito**: dentro de `main` y fuera de la
        // barra. Los enlaces de la navegación inferior viven después en el DOM
        // y están debajo por construcción; incluirlos mediría otra cosa.
        const ultimo = [...document.querySelectorAll('main a, main button')]
          .filter((e) => !e.closest('[data-cart-bar]'))
          .pop()!
        return {
          texto: (ultimo.textContent ?? '').trim().slice(0, 30),
          sobreLaBarra: ultimo.getBoundingClientRect().bottom <= barra.top + 1,
        }
      })
      expect(visible.sobreLaBarra, `«${visible.texto}» queda por encima del CTA`).toBe(true)
    })

    test('«Entrega o recogida» pierde la caja exterior, no las opciones', async ({ page }) => {
      await comoApp(page)
      await conCarrito(page)
      await page.goto('./carrito')

      const e = await entrega(page)
      expect(e.borde, 'sin marco alrededor').toBe(0)
      expect(e.radio, 'ni esquinas de tarjeta').toBe(0)
      expect(e.opciones, 'las dos opciones siguen ahí').toBe(2)
      expect(e.opcionConMarco, 'y conservan su propia superficie').toBe(true)
    })
  })
}

test.describe('el carrito nativo sigue funcionando igual', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('elegir recogida y volver a envío se anuncia correctamente', async ({ page }) => {
    await comoApp(page)
    await conCarrito(page)
    await page.goto('./carrito')

    const envio = page.getByRole('button', { name: /Envío a domicilio/ })
    const recogida = page.getByRole('button', { name: /Recogida en tienda/ })

    await expect(envio).toHaveAttribute('aria-pressed', 'true')
    await recogida.click()
    await expect(recogida).toHaveAttribute('aria-pressed', 'true')
    await expect(envio).toHaveAttribute('aria-pressed', 'false')
    await envio.click()
    await expect(envio).toHaveAttribute('aria-pressed', 'true')
  })

  test('el cupón abierto no desborda la pantalla', async ({ page }) => {
    await comoApp(page)
    await conCarrito(page)
    await page.goto('./carrito')

    await page.getByRole('button', { name: /cupón/ }).click()
    await expect(page.getByLabel('Código de cupón')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
      0,
    )
  })
})

test.describe('el carrito web conserva su composición', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('sin barra anclada, con el CTA en el resumen y la entrega enmarcada', async ({ page }) => {
    // No es que esté mejor: es que D-086 congela la web durante la Fase C.
    await page.goto('./carrito')
    await page.addInitScript(() => {})
    await conCarrito(page)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const g = await geometria(page)
    expect(g.hayBarra, 'la web no monta la barra de la app').toBe(false)
    expect(g.ctas, 'y conserva su único CTA').toBe(1)

    const e = await entrega(page)
    expect(e.borde, 'la web conserva el marco de entrega').toBeGreaterThan(0)
    expect(e.radio, 'y su radio').toBeGreaterThan(0)
    expect(e.relleno, 'y su relleno').toBeGreaterThan(0)
    expect(e.opciones).toBe(2)
  })
})
