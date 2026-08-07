import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// La app nativa como tienda: portada comercial, historial de vistos y la barra
// de compra conviviendo con la navegación inferior.
//
// Se simula el binario igual que en `app-shell.spec.ts`: Capacitor inyecta
// `window.Capacitor` antes del bundle y `addInitScript` corre en ese mismo
// momento, así que se recorre el mismo camino de código.
// ============================================================================

async function comoApp(page: Page, recientes?: string[]) {
  await page.addInitScript((lista) => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    if (lista) localStorage.setItem('banana:recientes', JSON.stringify(lista))
  }, recientes)
}

test.describe('portada de la app', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('empieza por producto, no por servicios corporativos', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    // El primer encabezado de la portada es un producto del catálogo, y lleva
    // a su ficha. Es la diferencia con la portada web, que abre con marca.
    const hero = page.locator('#app-hero-titulo')
    await expect(hero).toBeVisible()

    const comprar = page.getByRole('link', { name: 'Comprar' }).first()
    await expect(comprar).toBeVisible()
    await comprar.click()
    await expect(page).toHaveURL(/\/pagina-banana\/[a-z-]+\/[a-z0-9-]+/)
  })

  test('los servicios quedan después del contenido comercial', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const categorias = page.getByRole('heading', { name: 'Compra por categoría' })
    const servicios = page.getByRole('heading', { name: 'Servicios y ayuda' })
    await expect(categorias).toBeVisible()

    const yCategorias = (await categorias.boundingBox())!.y
    const yServicios = (await servicios.boundingBox())!.y
    expect(yServicios, 'los servicios van por debajo del producto').toBeGreaterThan(yCategorias)
  })

  test('las categorías llevan a su familia', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    await page.getByRole('link', { name: 'iPhone', exact: true }).first().click()
    await expect(page).toHaveURL(/\/pagina-banana\/iphone$/)
  })

  test('sin historial no aparece la sección de recientes', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    await expect(page.getByRole('heading', { name: 'Continúa donde lo dejaste' })).toHaveCount(0)
  })

  test('con historial aparece y enlaza a la ficha', async ({ page }) => {
    await comoApp(page, ['iphone/17-pro'])
    await page.goto('./')

    await expect(page.getByRole('heading', { name: 'Continúa donde lo dejaste' })).toBeVisible()
    const lista = page.getByRole('list', { name: 'Continúa donde lo dejaste' })
    await expect(lista.getByRole('link').first()).toHaveAttribute('href', /\/iphone\/17-pro/)
  })

  test('un historial corrupto no rompe la portada', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
      localStorage.setItem('banana:recientes', 'esto no es json')
    })
    await page.goto('./')

    await expect(page.locator('#app-hero-titulo')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Continúa donde lo dejaste' })).toHaveCount(0)
  })

  test('visitar una ficha la añade al historial', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone/17-pro/256gb-plata')
    await expect(page.getByRole('heading', { level: 1, name: 'iPhone 17 Pro' })).toBeVisible()

    // Se anota al resolverse la ficha, así que un enlace directo cuenta igual
    // que llegar pulsando una tarjeta.
    await expect.poll(() => page.evaluate(() => localStorage.getItem('banana:recientes'))).toContain('iphone/17-pro')

    await page.goto('./')
    await expect(page.getByRole('heading', { name: 'Continúa donde lo dejaste' })).toBeVisible()
  })
})

test.describe('barra de compra y navegación inferior', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('en la app la barra de compra queda encima de la navegación, sin taparse', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone/17-pro/256gb-plata')

    // La barra aparece al pasar la caja de compra principal. En la app el que
    // se desplaza es `#contenido`, no la ventana (ver `Layout`), así que hay
    // que moverlo a él y no con la rueda del ratón.
    await page.locator('#contenido').evaluate((el) => el.scrollTo({ top: 3000 }))
    const barra = page.locator('[data-buy-bar]')
    await expect(barra).toBeVisible()

    const nav = page.locator('[data-app-tab-bar]')
    const topeNav = Math.round((await nav.boundingBox())!.y)

    // El borde inferior de la barra de compra no puede invadir la navegación.
    //
    // Se mide con `poll` y no de una vez porque la barra entra con una
    // animación de muelle: medir antes de que se asiente devuelve la posición
    // de salida, 80 px más abajo, y daría un fallo que no existe.
    await expect
      .poll(
        async () => {
          const caja = (await barra.boundingBox())!
          return Math.round(caja.y + caja.height)
        },
        { message: 'la barra de compra se solapa con la navegación inferior' },
      )
      .toBeLessThanOrEqual(topeNav + 1)
  })

  test('en el navegador móvil la barra sigue abajo del todo', async ({ page }) => {
    // Sin Capacitor: es la web móvil, donde no hay navegación inferior.
    await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
    await page.goto('./iphone/17-pro/256gb-plata')
    await page.mouse.wheel(0, 3000)

    const barra = page.locator('[data-buy-bar]')
    await expect(barra).toBeVisible()
    await expect(page.locator('[data-app-tab-bar]'), 'la web no tiene navegación inferior').toHaveCount(0)

    const caja = (await barra.boundingBox())!
    const alto = page.viewportSize()!.height
    expect(Math.round(caja.y + caja.height), 'debe quedar pegada al borde inferior').toBeGreaterThanOrEqual(alto - 2)
  })
})
