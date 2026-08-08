import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// El carrito en móvil no se desplaza de lado.
//
// POR QUÉ ESTA PRUEBA NO MIDE `documentElement.scrollWidth`
//
// El documento lleva `overflow-x: clip` (ver `index.css`), que es correcto —
// corta el rebote horizontal del WebView— pero convierte esa medida en ciega:
// bajo `clip` el documento nunca declara desbordamiento, aunque su contenido se
// salga. La prueba de `mobile-layout.spec.ts` mide justo eso y por eso el fallo
// del cupón pasaba por delante de ella sin despeinarse.
//
// Aquí se mide de las dos maneras que sí ven algo:
//
//  1. `#contenido`, que en la app es el contenedor que se desplaza de verdad.
//     Ahí `overflow-y: auto` hace que el eje horizontal pase a `auto` también,
//     así que un hijo demasiado ancho lo vuelve arrastrable. Es el síntoma que
//     se ve con el dedo.
//  2. El documento con la contención neutralizada un instante, que revela el
//     desbordamiento real en la web.
//
// La tolerancia es de 2 px: los motores redondean el subpíxel de forma
// distinta y una aserción a cero sería intermitente sin cazar nada más.
// ============================================================================

// SIN PUNTERO GRUESO, ESTA PRUEBA NO VE NADA
//
// El fallo depende de una regla que sólo se aplica en pantalla táctil: el suelo
// de 16 px que `index.css` le pone al texto de los campos para que iOS no
// amplíe la página al enfocarlos. Ese suelo es lo que engorda el ancho
// intrínseco del `<input>` del cupón hasta desbordar. En un `Desktop Chrome`
// —puntero fino— el campo se queda en 14 px, cabe, y la prueba pasaría estando
// el fallo presente. Comprobado: con el arreglo revertido, sin esto pasa.
//
// El proyecto `mobile` ya es táctil, pero se declara aquí para que la prueba
// sea cierta también donde se ejecute por defecto. Firefox y WebKit no la
// recogen: sólo corren `smoke-cross-browser`.
test.use({ isMobile: true, hasTouch: true })

const TOLERANCIA = 2

const DISPOSITIVO = {
  id: 'iphone/17-pro/plata/256GB',
  modelSlug: '17-pro',
  family: 'iphone',
  name: 'iPhone 17 Pro',
  color: 'Plata',
  colorSlug: 'plata',
  capacity: '256GB',
  price: 1229,
  previousPrice: 1446,
  qty: 2,
  insured: true,
  kind: 'device',
}

const ACCESORIO = {
  id: 'accessory:funda-ipad/negro',
  modelSlug: 'funda-ipad',
  family: 'accesorios',
  // Nombre largo a propósito: es lo que más aprieta la columna de la línea.
  name: 'Funda para iPad Pro 11" M4 con teclado Combo Touch de Logitech',
  color: '',
  capacity: '',
  price: 259.99,
  previousPrice: null,
  qty: 1,
  insured: false,
  kind: 'accessory',
}

async function conCarrito(page: Page, nativo: boolean) {
  await page.addInitScript(
    ([lineas, esApp]) => {
      if (esApp) (window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
      localStorage.setItem('banana:cart', JSON.stringify(lineas))
    },
    [[DISPOSITIVO, ACCESORIO], nativo] as const,
  )
}

/** Desbordamiento horizontal real, en píxeles. */
async function desbordamiento(page: Page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const guardado = [de.style.overflowX, document.body.style.overflowX]
    de.style.overflowX = 'visible'
    document.body.style.overflowX = 'visible'
    const documento = de.scrollWidth - de.clientWidth
    de.style.overflowX = guardado[0]
    document.body.style.overflowX = guardado[1]

    const contenido = document.querySelector('#contenido')
    return {
      documento,
      contenido: contenido ? contenido.scrollWidth - contenido.clientWidth : 0,
    }
  })
}

for (const nativo of [true, false]) {
  const donde = nativo ? 'la app' : 'la web móvil'

  test.describe(`el carrito en ${donde}`, () => {
    for (const width of [320, 390]) {
      test(`no se desplaza de lado a ${width} px @all`, async ({ page }) => {
        await conCarrito(page, nativo)
        await page.setViewportSize({ width, height: 800 })
        await page.goto('./carrito')
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        const alCargar = await desbordamiento(page)
        expect(alCargar.documento, 'el documento desborda al cargar').toBeLessThanOrEqual(TOLERANCIA)
        expect(alCargar.contenido, 'el contenedor desplazable desborda al cargar').toBeLessThanOrEqual(TOLERANCIA)

        // Y con el cupón abierto, que es lo que lo rompía: un `<input>` sin
        // `size` mide 20 caracteres de ancho intrínseco y no encogía.
        const cupon = page.getByRole('button', { name: /cupón/i })
        if (await cupon.count()) {
          await cupon.click()
          await expect(page.getByLabel('Código de cupón')).toBeVisible()

          const conCupon = await desbordamiento(page)
          expect(conCupon.documento, 'el documento desborda con el cupón abierto').toBeLessThanOrEqual(TOLERANCIA)
          expect(conCupon.contenido, 'el contenedor desborda con el cupón abierto').toBeLessThanOrEqual(TOLERANCIA)
        }
      })
    }

    test(`sigue siendo usable a 320 px en ${donde} @all`, async ({ page }) => {
      // De nada sirve que no desborde si por el camino se ha roto el carrito.
      await conCarrito(page, nativo)
      await page.setViewportSize({ width: 320, height: 800 })
      await page.goto('./carrito')

      // Totales y llamada a la acción visibles.
      await expect(page.getByRole('link', { name: /Tramitar|Finalizar|pedido/i }).first()).toBeVisible()

      // Aumentar y reducir cantidad.
      const mas = page.getByRole('button', { name: 'Aumentar cantidad' }).first()
      await mas.click()
      await expect(page.getByText('3', { exact: true }).first()).toBeVisible()

      const menos = page.getByRole('button', { name: 'Reducir cantidad' }).first()
      await menos.click()

      // Y quitar una línea.
      const lineasAntes = await page.locator('ul.divide-y > li').count()
      await page
        .getByRole('button', { name: /^Quitar / })
        .first()
        .click()
      await expect(page.locator('ul.divide-y > li')).toHaveCount(lineasAntes - 1)

      // Sin desbordar después de todo eso.
      const despues = await desbordamiento(page)
      expect(despues.documento).toBeLessThanOrEqual(TOLERANCIA)
      expect(despues.contenido).toBeLessThanOrEqual(TOLERANCIA)
    })
  })
}
