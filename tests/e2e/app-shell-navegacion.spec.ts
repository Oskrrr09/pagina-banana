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
    await expect(pestañas).toHaveText(['Inicio', 'Tienda', 'Compras', 'Cuenta'])
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

    await page.locator('[data-app-tab-bar]').getByRole('link', { name: 'Compras' }).click()
    await expect(page).toHaveURL(/\/pagina-banana\/mis-productos/)

    await page.locator('[data-app-tab-bar]').getByRole('link', { name: 'Tienda' }).click()
    await expect(page).toHaveURL(/\/pagina-banana\/tienda$/)
  })

  test('la etiqueta más larga cabe entera a 320 px', async ({ page }) => {
    // La más larga no se abrevia. Con cuatro pestañas cada
    // una dispone de 80 px; el fallo que se vigila es que el texto se salga de
    // su pestaña, no que la barra desborde.
    await comoApp(page)
    await page.setViewportSize({ width: 320, height: 780 })
    await page.goto('./')

    const barra = page.locator('[data-app-tab-bar]')
    const cajaBarra = (await barra.boundingBox())!
    const compras = barra.getByRole('link', { name: 'Compras' })
    const cajaTexto = (await compras.locator('span').last().boundingBox())!

    expect(cajaTexto.width, 'la etiqueta no cabe en su pestaña').toBeLessThanOrEqual(cajaBarra.width / 4)
    await expect(compras).toHaveText('Compras')
  })

  test('marca la pestaña correcta, y ninguna cuando no toca', async ({ page }) => {
    await comoApp(page)
    const barra = page.locator('[data-app-tab-bar]')

    await page.goto('./iphone')
    await expect(barra.getByRole('link', { name: 'Tienda' })).toHaveAttribute('aria-current', 'page')

    await page.goto('./mis-productos')
    await expect(barra.getByRole('link', { name: 'Compras' })).toHaveAttribute('aria-current', 'page')

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

  test('el amarillo de Inicio y el de Tienda salen del mismo token', async ({ page }) => {
    // QUÉ CAMBIÓ AQUÍ
    //
    // Esta prueba exigía además que el área personal —Mis productos, Cuenta—
    // se quedara en superficie clara. **Esa regla ya no existe**: desde la PR
    // #58 la barra de Banana es amarilla en todas las pantallas de cliente,
    // porque el color no distinguía contextos, distinguía descuidos —soporte,
    // tiendas, login y el 404 estaban en blanco por ser `neutro`, sin que nadie
    // lo hubiera decidido—. El contrato nuevo, con sus quince superficies y el
    // checkout, vive en `tests/e2e/barra-banana.spec.ts`.
    //
    // Lo que sigue siendo cierto, y por eso se conserva: que el amarillo salga
    // de un único token y no de dos parecidos. Y lo de siempre: aquí no se
    // puede demostrar que en iOS llegue hasta el borde por detrás de la Dynamic
    // Island; `env(safe-area-inset-top)` vale cero en el navegador.
    await comoApp(page)

    await page.goto('./')
    const inicio = await page.locator('[data-app-topbar]').evaluate((el) => getComputedStyle(el).backgroundColor)
    await page.goto('./tienda')
    const tienda = await page.locator('[data-app-topbar]').evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(inicio, 'los dos amarillos deben salir del mismo token').toBe(tienda)
    expect(inicio, 'y ese token es el amarillo de marca').toBe(BANANA)
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

    // El `h1` de Inicio dejó de ser un «Hola» de 28 px en Inicio v2: ahora es la
    // identidad compacta —el nombre, o «Mi cuenta» si no lo hay—. Lo que esta
    // línea protege es que Inicio SIGA teniendo su encabezado propio y que no
    // sea el de una portada comercial.
    const encabezado = page.locator('#contenido').getByRole('heading', { level: 1 })
    await expect(encabezado).toBeVisible()
    await expect(encabezado, 'el saludo grande se retiró en Inicio v2').not.toHaveText(/^Hola/)

    const contenido = page.locator('#contenido')
    await expect(contenido.getByRole('link', { name: /Soporte/ })).toBeVisible()

    // QUÉ CAMBIÓ AQUÍ, Y POR QUÉ
    //
    // Antes esta prueba exigía además un enlace a «Mis compras» dentro del
    // contenido. Ese acceso **se retiró a propósito**: es una pestaña de la
    // barra inferior, y repetirlo en Inicio ocupaba media pantalla para no
    // llevar a ningún sitio nuevo. Que siga estando en la barra lo comprueba el
    // bloque de arriba de este mismo fichero, y que Inicio ya no lo duplique lo
    // vigila `inicio-nativo.spec.ts`.
    //
    // Lo que distingue a Inicio de Tienda no es que no enseñe producto —ahora
    // enseña lo que estabas viendo y las rebajas reales— sino que **no es la
    // portada comercial**: empieza por la persona y no tiene ni hero ni el
    // escaparate por categorías.
    await expect(page.locator('#app-hero-titulo')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Compra por categoría' })).toHaveCount(0)
  })

  test('Tienda sigue siendo la superficie comercial, y distinta de Inicio', async ({ page }) => {
    // La #56 retiró de Tienda el hero y la rejilla de categorías que esta
    // prueba usaba como seña de identidad: el hero porque convertía el nombre de
    // un producto en el encabezado de la sección, la rejilla porque las
    // categorías ya están a un toque en los chips de la barra.
    //
    // La propiedad que protegía sigue viva y es la del par de arriba: Inicio y
    // Tienda no son la misma pantalla. Se comprueba con lo que sí distingue hoy
    // a Tienda —encabezado propio y escaparate de producto— y con lo que Inicio
    // tiene y Tienda no.
    await comoApp(page)
    await page.goto('./tienda')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tienda')
    await expect(page.getByRole('heading', { name: 'Oportunidades' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seguías mirando' }), 'el carril personal es de Inicio').toHaveCount(
      0,
    )
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
