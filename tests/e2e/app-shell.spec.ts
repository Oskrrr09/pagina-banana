import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Interfaz de la aplicación nativa.
//
// Dentro del binario, Capacitor inyecta `window.Capacitor` antes de cargar el
// bundle. Aquí se simula con `addInitScript`, que corre en ese mismo momento,
// así que se ejerce exactamente el mismo camino de código.

async function comoApp(page: Page) {
  await page.addInitScript(() => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    // El aviso de tienda favorita taparía la barra inferior en las capturas
    // y en las comprobaciones de posición.
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
}

test.describe('interfaz de la app nativa', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('la navegación vive en una barra inferior, no en el pie', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const barra = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(barra).toBeVisible()

    // El orden importa: es el que se acordó con Oscar.
    const etiquetas = await barra.locator('li').allInnerTexts()
    expect(etiquetas.map((t) => t.trim())).toEqual([
      'Inicio',
      'Favoritos',
      'Explorar',
      'Carrito',
      'Cuenta',
    ])

    // El pie de página es un mapa del sitio; dentro de una app sobra.
    await expect(page.getByRole('contentinfo')).toHaveCount(0)
  })

  test('la barra queda pegada abajo y el contenido no se esconde detrás', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const caja = await page.locator('[data-app-tab-bar]').boundingBox()
    expect(caja).not.toBeNull()
    const alto = page.viewportSize()!.height
    // Pegada al borde inferior de la ventana.
    expect(Math.round(caja!.y + caja!.height)).toBe(alto)

    // El contenido reserva sitio para ella: sin esto, el final de cada
    // pantalla quedaría debajo de la barra y sin poder alcanzarse.
    const relleno = await page
      .locator('#contenido')
      .evaluate((el) => getComputedStyle(el).paddingBottom)
    expect(parseFloat(relleno)).toBeGreaterThan(0)
  })

  test('la pestaña activa refleja la ruta', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')
    const barra = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(barra.getByRole('link', { name: /^Inicio/ })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await barra.getByRole('link', { name: /^Favoritos/ }).click()
    await expect(page).toHaveURL(/\/favoritos$/)
    await expect(barra.getByRole('link', { name: /^Favoritos/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(barra.getByRole('link', { name: /^Inicio/ })).not.toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('el carrito lleva su contador y no se repite en la cabecera', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
      localStorage.setItem(
        'banana:cart',
        JSON.stringify([
          {
            id: 'iphone/17-pro/plata/256GB',
            modelSlug: '17-pro',
            family: 'iphone',
            name: 'iPhone 17 Pro',
            color: 'Plata',
            capacity: '256GB',
            price: 1229,
            previousPrice: null,
            qty: 2,
            insured: false,
          },
        ]),
      )
    })
    await page.goto('./')

    const barra = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(barra.getByRole('link', { name: 'Carrito (2)' })).toBeVisible()

    // Un mismo destino dos veces en pantalla confunde: en la app el carrito
    // solo está abajo.
    await expect(page.getByRole('banner').getByRole('link', { name: /Carrito/ })).toHaveCount(0)
  })

  test('sin sesión, la pestaña Cuenta lleva al acceso', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')
    await page.getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: /^Cuenta/ })
      .click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('el chat no flota: se abre desde "Contacta con nosotros"', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    // La burbuja flotante es un patrón de web y competiría con la barra
    // inferior: dentro de la app no existe.
    await expect(page.getByRole('button', { name: 'Abrir chat de Bananito' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Explorar' }).click()
    const menu = page.getByRole('dialog', { name: 'Menú principal' })
    await expect(menu.getByText('Contacta con nosotros')).toBeVisible()

    await menu.getByRole('button', { name: /Chatea con Bananito/ }).click()

    // El menú se cierra y el chat queda abierto.
    await expect(menu).toBeHidden()
    await expect(page.getByRole('dialog', { name: 'Bananito' })).toBeVisible()
  })

  test('al cerrar el chat el foco no se pierde', async ({ page }) => {
    // En la web vuelve a la burbuja. Aquí no hay burbuja, y dejar el foco en
    // `body` obligaría a quien navega por teclado a empezar desde arriba.
    await comoApp(page)
    await page.goto('./')
    await page.getByRole('button', { name: 'Explorar' }).click()
    await page
      .getByRole('dialog', { name: 'Menú principal' })
      .getByRole('button', { name: /Chatea con Bananito/ })
      .click()

    const chat = page.getByRole('dialog', { name: 'Bananito' })
    await expect(chat).toBeVisible()
    await chat.getByRole('button', { name: 'Cerrar chat' }).click()
    await expect(chat).toBeHidden()

    const enBody = await page.evaluate(() => document.activeElement === document.body)
    expect(enBody, 'el foco se quedó en <body> al cerrar el chat').toBe(false)
  })

  test('el aviso de tienda favorita no se cuela al pasar del menú al chat', async ({ page }) => {
    // Regresión encontrada en el emulador, no en las pruebas: comprobar la
    // presencia de modales una sola vez dejaba un hueco entre que se cierra
    // el menú y se monta el chat, y por ahí el aviso aparecía encima.
    // A propósito NO se descarta el aviso en este caso.
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
    })
    await page.goto('./')

    await page.getByRole('button', { name: 'Explorar' }).click()
    await page
      .getByRole('dialog', { name: 'Menú principal' })
      .getByRole('button', { name: /Chatea con Bananito/ })
      .click()

    const chat = page.getByRole('dialog', { name: 'Bananito' })
    await expect(chat).toBeVisible()

    // Bastante más que los 800 ms del temporizador del aviso.
    await page.waitForTimeout(2500)
    await expect(page.locator('[data-favorite-store-prompt]')).toHaveCount(0)
    await expect(chat).toBeVisible()
  })

  test('arriba hay un buscador con filtros de categoría, no una cabecera de web', async ({
    page,
  }) => {
    await comoApp(page)
    await page.goto('./')

    const cabecera = page.getByRole('banner')
    await expect(
      cabecera.getByRole('button', { name: 'Buscar en Banana Computer' }),
    ).toBeVisible()

    // Filtros rápidos por familia, con las categorías reales del catálogo.
    const categorias = cabecera.getByRole('navigation', { name: 'Categorías' })
    await expect(categorias.getByRole('link', { name: 'iPhone' })).toBeVisible()
    await expect(categorias.getByRole('link', { name: 'Accesorios' })).toBeVisible()

    // El menú y el mega-menú de la web ya no están arriba: el menú lo abre
    // "Explorar", abajo.
    await expect(cabecera.getByRole('button', { name: 'Abrir menú' })).toHaveCount(0)
  })

  test('el buscador de arriba abre el mismo buscador a pantalla completa', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')
    await page.getByRole('button', { name: 'Buscar en Banana Computer' }).click()

    const buscador = page.getByRole('dialog', { name: 'Buscar' })
    await expect(buscador).toBeVisible()
    await page.keyboard.type('airpods')
    // Mismo motor que /buscar: debe autocompletar.
    await expect(buscador.getByRole('option').first()).toBeVisible({ timeout: 5000 })
  })

  test('un filtro de categoría navega a su familia', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')
    await page
      .getByRole('navigation', { name: 'Categorías' })
      .getByRole('link', { name: 'iPhone' })
      .click()
    await expect(page).toHaveURL(/\/iphone$/)
  })

  test('la barra inferior no tiene fallos de accesibilidad', async ({ page }) => {
    await comoApp(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('./')
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a'])
      .include('[data-app-tab-bar]')
      .analyze()
    expect(resultado.violations).toEqual([])
  })
})

test.describe('la web no cambia', () => {
  test('en el navegador sigue habiendo pie de página y ninguna barra inferior', async ({
    page,
  }) => {
    await page.goto('./')
    await expect(page.locator('[data-app-tab-bar]')).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
})
