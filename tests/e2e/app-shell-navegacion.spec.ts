import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// La navegación de la app nativa: cuatro pestañas, carrito arriba y chips sólo
// donde tienen sentido.
//
// `tests/unit/app-sections.test.ts` cubre la clasificación de rutas; esto cubre
// que el shell la use de verdad y que lo que salió de la barra siga alcanzable.
// ============================================================================

async function comoApp(page: Page, carrito?: unknown[]) {
  await page.addInitScript((lineas) => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    if (lineas) localStorage.setItem('banana:cart', JSON.stringify(lineas))
  }, carrito)
}

const LINEA = {
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

test.describe('barra inferior', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('tiene exactamente cuatro pestañas, en orden', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const pestañas = page.locator('[data-app-tab-bar] a')
    await expect(pestañas).toHaveCount(4)
    await expect(pestañas).toHaveText(['Inicio', 'Tienda', 'Mis compras', 'Cuenta'])
  })

  test('ya no hay pestaña de Carrito, Favoritos ni Explorar', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const barra = page.locator('[data-app-tab-bar]')
    for (const fuera of ['Carrito', 'Favoritos', 'Explorar']) {
      await expect(barra.getByText(fuera, { exact: true }), `«${fuera}» sigue en la barra`).toHaveCount(0)
    }
  })

  test('cada pestaña lleva a su destino', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    await page.locator('[data-app-tab-bar]').getByRole('link', { name: 'Mis compras' }).click()
    await expect(page).toHaveURL(/\/pagina-banana\/mis-productos/)

    await page.locator('[data-app-tab-bar]').getByRole('link', { name: 'Tienda' }).click()
    await expect(page).toHaveURL(/\/pagina-banana\/tienda$/)
  })

  test('la etiqueta más larga cabe entera a 320 px', async ({ page }) => {
    // «Mis compras» es la más larga y no se abrevia. Con cuatro pestañas cada
    // una dispone de 80 px; el fallo que se vigila es que el texto se salga de
    // su pestaña, no que la barra desborde.
    await comoApp(page)
    await page.setViewportSize({ width: 320, height: 780 })
    await page.goto('./')

    const barra = page.locator('[data-app-tab-bar]')
    const cajaBarra = (await barra.boundingBox())!
    const compras = barra.getByRole('link', { name: 'Mis compras' })
    const cajaTexto = (await compras.locator('span').last().boundingBox())!

    expect(cajaTexto.width, 'la etiqueta no cabe en su pestaña').toBeLessThanOrEqual(cajaBarra.width / 4)
    await expect(compras).toHaveText('Mis compras')
  })

  test('marca la pestaña correcta, y ninguna cuando no toca', async ({ page }) => {
    await comoApp(page)
    const barra = page.locator('[data-app-tab-bar]')

    await page.goto('./iphone')
    await expect(barra.getByRole('link', { name: 'Tienda' })).toHaveAttribute('aria-current', 'page')

    await page.goto('./mis-productos')
    await expect(barra.getByRole('link', { name: 'Mis compras' })).toHaveAttribute('aria-current', 'page')

    // Soporte no es ninguna de las cuatro: mejor ninguna marcada que mentir.
    await page.goto('./soporte')
    await expect(barra.locator('[aria-current="page"]')).toHaveCount(0)
  })
})

test.describe('barra superior', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('el carrito está arriba, con su contador', async ({ page }) => {
    await comoApp(page, [LINEA])
    await page.goto('./')

    const carrito = page.locator('[data-app-cart]')
    await expect(carrito).toBeVisible()
    await expect(page.locator('[data-app-cart-badge]')).toHaveText('2')

    // 44 px de lado: el mínimo táctil.
    const caja = (await carrito.boundingBox())!
    expect(caja.width).toBeGreaterThanOrEqual(44)
    expect(caja.height).toBeGreaterThanOrEqual(44)

    await carrito.click()
    await expect(page).toHaveURL(/\/pagina-banana\/carrito$/)
  })

  test('el carrito acompaña también fuera de la tienda', async ({ page }) => {
    // Salió de la barra inferior; si además desapareciera en media aplicación
    // se habría escondido, que es justo lo que no se quería.
    await comoApp(page, [LINEA])
    for (const ruta of ['./', './tienda', './mis-productos', './soporte']) {
      await page.goto(ruta)
      await expect(page.locator('[data-app-cart]'), ruta).toBeVisible()
    }
    // Dentro del propio carrito sobra.
    await page.goto('./carrito')
    await expect(page.locator('[data-app-cart]')).toHaveCount(0)
  })

  test('los chips de categoría sólo salen en el contexto comercial', async ({ page }) => {
    await comoApp(page)

    await page.goto('./tienda')
    await expect(page.locator('[data-app-chips]')).toBeVisible()

    for (const ruta of ['./mis-productos', './cuenta', './']) {
      await page.goto(ruta)
      await expect(page.locator('[data-app-chips]'), `${ruta} no debe llevar chips`).toHaveCount(0)
    }
  })

  test('la búsqueda sigue siendo la misma, con su foco', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const boton = page.getByRole('button', { name: 'Buscar en Banana Computer' })
    await boton.click()

    const dialogo = page.getByRole('dialog', { name: 'Buscar' })
    await expect(dialogo).toBeVisible()
    await expect(page.getByTestId('header-search-input')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialogo).toHaveCount(0)
    // El foco vuelve al botón que abrió, no al principio del documento.
    await expect(boton).toBeFocused()
  })
})

test.describe('Inicio y Tienda son dos cosas distintas', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('Inicio habla de mi relación con Banana, no del catálogo', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible()
    // Dentro del contenido, no en la barra: en la barra ya lo comprueba el
    // bloque de arriba, y aquí lo que importa es que Inicio ofrezca el acceso.
    const contenido = page.locator('#contenido')
    await expect(contenido.getByRole('link', { name: /Mis compras/ })).toBeVisible()
    await expect(contenido.getByRole('link', { name: /Soporte/ })).toBeVisible()
    // El hero comercial se mudó entero a /tienda.
    await expect(page.locator('#app-hero-titulo')).toHaveCount(0)
  })

  test('Tienda conserva la portada comercial de la PR #39', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    await expect(page.locator('#app-hero-titulo')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Compra por categoría' })).toBeVisible()
  })

  test('en la web, /tienda no duplica la portada', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
    await page.goto('./tienda')
    await expect(page).toHaveURL(/\/pagina-banana\/$/)
  })

  test('el checkout sigue fuera del shell de la app', async ({ page }) => {
    await comoApp(page, [LINEA])
    await page.goto('./checkout/1')

    await expect(page.locator('[data-app-tab-bar]')).toHaveCount(0)
    await expect(page.locator('[data-app-cart]')).toHaveCount(0)
  })
})

test.describe('Favoritos sigue alcanzable sin pestaña', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('desde la ficha de producto y por su ruta', async ({ page }) => {
    await comoApp(page)

    // El corazón de la ficha, que ya existía.
    await page.goto('./iphone/17-pro/256gb-plata')
    await expect(page.getByRole('button', { name: /favoritos/i }).first()).toBeVisible()

    // Y la página sigue existiendo.
    await page.goto('./favoritos')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
