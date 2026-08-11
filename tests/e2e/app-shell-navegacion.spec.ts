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

/** El amarillo de marca, el que lleva la barra de Tienda. */
const BANANA = 'rgb(255, 206, 31)'

test.describe('barra superior', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('en Tienda manda el buscador; en el área de cliente, la marca', async ({ page }) => {
    await comoApp(page)

    // Comercial: el campo grande ocupa casi todo el ancho.
    await page.goto('./tienda')
    await expect(page.locator('[data-app-topbar="comercial"]')).toBeVisible()
    await expect(page.locator('[data-app-topbar]')).toHaveCSS('background-color', BANANA)
    await expect(page.locator('[data-app-search="prominente"]')).toBeVisible()
    await expect(page.locator('[data-app-chips]')).toBeVisible()
    await expect(page.locator('[data-app-cart]')).toBeVisible()

    const cabecera = (await page.locator('[data-app-topbar]').boundingBox())!
    const campo = (await page.locator('[data-app-search="prominente"]').boundingBox())!
    expect(campo.width, 'el buscador debería dominar la barra').toBeGreaterThan(cabecera.width * 0.6)

    // Cliente: marca a la izquierda y dos botones compactos.
    //
    // El COLOR va aparte, en la prueba siguiente: Inicio comparte el amarillo
    // con Tienda pero no su composición, y mezclar las dos cosas aquí haría
    // que un cambio de color pareciera un cambio de disposición.
    for (const ruta of ['./', './mis-productos', './cuenta']) {
      await page.goto(ruta)
      await expect(page.locator('[data-app-topbar="cliente"]'), ruta).toBeVisible()
      await expect(page.locator('[data-app-search="compacto"]'), ruta).toBeVisible()
      await expect(page.locator('[data-app-search="prominente"]'), ruta).toHaveCount(0)
      await expect(page.locator('[data-app-chips]'), ruta).toHaveCount(0)
      await expect(page.getByRole('link', { name: /Banana Computer/ }).first(), ruta).toBeVisible()
      await expect(page.locator('[data-app-cart]'), ruta).toBeVisible()
    }
  })

  test('Inicio y Tienda llevan la superficie de marca; el área personal, la clara', async ({ page }) => {
    // LA REGLA DE COLOR, SUELTA DE LA COMPOSICIÓN
    //
    // Inicio comparte el amarillo con Tienda —es la puerta de entrada, y en la
    // app nativa esa superficie se continúa con la barra de estado— pero sigue
    // siendo contexto `cliente`: ni chips ni buscador grande. El área personal
    // sí se distingue por color.
    //
    // Lo que esta prueba NO puede demostrar: que en iOS el amarillo llegue
    // hasta el borde superior por detrás de la Dynamic Island. Aquí no hay
    // barra de estado y `env(safe-area-inset-top)` vale cero; eso se comprueba
    // en el simulador. Aquí se fija la decisión de CSS, que es la que un
    // cambio de código puede romper sin que nadie lo vea.
    await comoApp(page)

    for (const ruta of ['./', './tienda']) {
      await page.goto(ruta)
      await expect(page.locator('[data-app-topbar]'), `${ruta} debería llevar la marca`).toHaveCSS(
        'background-color',
        BANANA,
      )
    }

    for (const ruta of ['./mis-productos', './cuenta']) {
      await page.goto(ruta)
      await expect(page.locator('[data-app-topbar]'), `${ruta} debería quedarse en superficie clara`).not.toHaveCSS(
        'background-color',
        BANANA,
      )
    }

    // Y el amarillo de Inicio es el MISMO que el de Tienda, no uno parecido.
    await page.goto('./')
    const inicio = await page.locator('[data-app-topbar]').evaluate((el) => getComputedStyle(el).backgroundColor)
    await page.goto('./tienda')
    const tienda = await page.locator('[data-app-topbar]').evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(inicio, 'los dos amarillos deben salir del mismo token').toBe(tienda)
  })

  test('los dos buscadores abren el mismo diálogo y devuelven el foco a su botón', async ({ page }) => {
    await comoApp(page)

    for (const [ruta, selector] of [
      ['./tienda', '[data-app-search="prominente"]'],
      ['./mis-productos', '[data-app-search="compacto"]'],
    ] as const) {
      await page.goto(ruta)
      const boton = page.locator(selector)
      // 44 px de lado en las dos variantes.
      const caja = (await boton.boundingBox())!
      expect(caja.height, `${ruta}: alto táctil`).toBeGreaterThanOrEqual(44)
      expect(caja.width, `${ruta}: ancho táctil`).toBeGreaterThanOrEqual(44)

      await boton.click()
      const dialogo = page.getByRole('dialog', { name: 'Buscar' })
      await expect(dialogo, ruta).toBeVisible()
      await expect(page.getByTestId('header-search-input'), ruta).toBeFocused()

      await page.keyboard.press('Escape')
      await expect(dialogo, ruta).toHaveCount(0)
      // Y el foco vuelve al botón exacto que lo abrió, no a otro.
      await expect(boton, ruta).toBeFocused()
    }
  })

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

test.describe('accesos de Inicio', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  // El recorrido completo de «Mis pedidos» se prueba en
  // `tests/e2e-prefs/inicio-accesos.spec.ts`: ese acceso sólo se pinta con
  // sesión, y en esta suite no hay Supabase configurado.

  test('el acceso a Soporte lleva al centro de ayuda', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')
    await page
      .locator('#contenido')
      .getByRole('link', { name: /Soporte/ })
      .click()
    await expect(page).toHaveURL(/\/soporte$/)
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
