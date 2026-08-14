import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// La app nativa como tienda: portada comercial, historial de vistos y la barra
// de compra conviviendo con la navegación inferior.
//
// La portada comercial vive en `/tienda` desde la PR #41. Antes ocupaba `/`,
// que ahora es Inicio —mi relación con Banana—; lo que se prueba aquí no ha
// cambiado, sólo la dirección por la que se llega.
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

test.describe('portada de la tienda', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  // QUÉ CAMBIÓ AQUÍ, Y POR QUÉ
  //
  // La PR #56 retiró de Tienda el hero de producto, la rejilla «Compra por
  // categoría», los vistos recientes y la tienda favorita. Los tres últimos
  // porque ya viven en Inicio o en los chips de la barra; el hero porque ocupaba
  // media pantalla, convertía el nombre de un producto en el `h1` de la sección
  // y repetía Oportunidades.
  //
  // Los casos que exigían aquellas piezas no se borran: se reformulan a la
  // propiedad que de verdad protegían —que Tienda empieza por comercio y los
  // servicios quedan al final, y que desde Tienda se llega a una familia—. Lo
  // que era del historial pasa a Inicio, que es donde vive ahora, y lo cubre
  // `inicio-nativo.spec.ts`.

  test('empieza por producto, no por servicios corporativos', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    const oportunidades = page.getByRole('heading', { name: 'Oportunidades' })
    const servicios = page.getByRole('heading', { name: 'Servicios y ayuda' })
    await expect(oportunidades).toBeVisible()
    await expect(servicios).toBeVisible()

    const yProducto = (await oportunidades.boundingBox())!.y
    const yServicios = (await servicios.boundingBox())!.y
    expect(yServicios, 'los servicios van por debajo del producto').toBeGreaterThan(yProducto)
  })

  test('las tarjetas de oferta llevan a la ficha de su variante', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    await page.getByRole('list', { name: 'Oportunidades' }).getByRole('link').first().click()
    await expect(page).toHaveURL(/\/pagina-banana\/[a-z-]+\/[a-z0-9-]+\/[a-z0-9-]+/)
  })

  test('las categorías llevan a su familia', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    // Desde los chips de la barra, que es la única superficie de categorías
    // desde la #56.
    await page
      .getByRole('navigation', { name: 'Categorías' })
      .getByRole('link', { name: 'iPhone', exact: true })
      .click()
    await expect(page).toHaveURL(/\/pagina-banana\/iphone$/)
  })

  test('un historial corrupto no rompe la app', async ({ page }) => {
    // La propiedad sigue viva, pero el historial se pinta en Inicio.
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
      localStorage.setItem('banana:recientes', 'esto no es json')
    })
    await page.goto('./')

    await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Continúa donde lo dejaste' })).toHaveCount(0)
  })

  test('visitar una ficha la añade al historial', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone/17-pro/256gb-plata')
    await expect(page.getByRole('heading', { level: 1, name: 'iPhone 17 Pro' })).toBeVisible()

    // Se anota al resolverse la ficha, así que un enlace directo cuenta igual
    // que llegar pulsando una tarjeta.
    await expect.poll(() => page.evaluate(() => localStorage.getItem('banana:recientes'))).toContain('iphone/17-pro')

    // El historial se pinta en Inicio, que es donde el cliente lo retoma.
    await page.goto('./')
    const recientes = page.getByRole('list', { name: 'Continúa donde lo dejaste' })
    await expect(recientes.getByRole('link', { name: /iPhone 17 Pro/ })).toBeVisible()
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

test.describe('filtros del catálogo', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('AirPods tiene los mismos filtros que el resto de familias', async ({ page }) => {
    // Entraba por la página genérica y conservaba un filtro por tramos de
    // precio distinto, sin disponibilidad ni ordenación y sin estado en la URL.
    await comoApp(page)
    await page.goto('./airpods')

    await expect(page.getByRole('button', { name: /Filtrar/ })).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByText('Filtrar por precio'), 'el sistema antiguo debe haber desaparecido').toHaveCount(0)
  })

  test('Atrás desde una ficha devuelve el catálogo tal y como estaba', async ({ page }) => {
    // Lo que hay que demostrar es el recorrido real: filtro, entro a un
    // producto, vuelvo. Comprobar en cambio que Atrás borra los filtros no
    // probaría nada, porque los cambios de filtro se navegan con `replace` —a
    // propósito, para no meter una entrada de historial por cada toque— y ese
    // Atrás se limitaría a salir de la página.
    await comoApp(page)
    await page.goto('./airpods')

    await page.getByRole('button', { name: /Filtrar/ }).click()
    await page.getByRole('button', { name: 'Hasta 500 €' }).click()
    await page.getByRole('button', { name: /Ver \d+ modelos/ }).click()
    await page.getByRole('combobox').selectOption('precio-desc')

    await expect(page).toHaveURL(/\?precio=500&orden=precio-desc$/)
    await expect(page.getByRole('combobox')).toHaveValue('precio-desc')
    // 3 de los 4 AirPods bajan de 500 €; los Max, a 579 €, quedan fuera.
    await expect(page.getByText('3 de 4')).toBeVisible()

    // Se entra al primero de la rejilla, que con este orden es el más caro de
    // los que quedan.
    const primera = page.getByRole('link', { name: /AirPods Pro 3/ }).first()
    await primera.click()
    await expect(page.getByRole('heading', { level: 1, name: /AirPods Pro 3/ })).toBeVisible()

    await page.goBack()

    // La URL vuelve con los dos parámetros...
    await expect(page, 'Atrás recupera el catálogo que se estaba viendo').toHaveURL(/\?precio=500&orden=precio-desc$/)
    // ...y los controles vuelven a reflejarlos, que es lo que ve quien navega.
    await expect(page.getByRole('combobox')).toHaveValue('precio-desc')
    await expect(page.getByText('3 de 4'), 'el filtro de precio sigue aplicado').toBeVisible()
    await expect(page.getByRole('button', { name: /Filtrar 1/ }), 'el contador del botón sigue a 1').toBeVisible()
    await expect(page.getByRole('link', { name: /AirPods Max/ })).toHaveCount(0)
  })
})
