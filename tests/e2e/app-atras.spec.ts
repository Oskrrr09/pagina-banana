import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// El control «Volver» de la aplicación nativa.
//
// En iPhone no hay retroceso del sistema, así que las pantallas secundarias
// llevan el suyo en `AppTopBar`. Dos comportamientos, no uno:
//
//   - con historial propio, retrocede de verdad —el catálogo vuelve con sus
//     filtros, la búsqueda con su término—;
//   - abierta en frío, va al sitio de la pantalla, que decide `appBack`.
//
// El mapa completo de destinos se prueba sin navegador en
// `tests/unit/app-back.test.ts`. Aquí se prueba que el shell lo use de verdad.
// ============================================================================

async function comoApp(page: Page) {
  await page.addInitScript(() => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
}

const volver = (page: Page) => page.getByRole('button', { name: 'Volver' })

test.describe('quién lleva el control', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('las raíces de la barra no lo llevan', async ({ page }) => {
    await comoApp(page)

    // `/cuenta` y `/mis-productos` se comprueban por lo que se PINTA, no por
    // la URL: sin credenciales de Supabase la pantalla se queda donde está, y
    // con ellas el guardia manda a `/login`. Ninguna de las dos lleva control,
    // así que la prueba vale en los dos entornos.
    for (const ruta of ['./', './tienda', './mis-productos', './cuenta', './login']) {
      await page.goto(ruta)
      await expect(page.locator('[data-app-topbar]'), ruta).toBeVisible()
      await expect(volver(page), `${ruta} no debe llevar Volver`).toHaveCount(0)
    }
  })

  test('las secundarias sí, en los dos contextos de la barra', async ({ page }) => {
    await comoApp(page)

    // Comercial —buscador grande— y cliente/neutro —barra compacta—.
    for (const [ruta, contexto] of [
      ['./iphone', 'comercial'],
      ['./favoritos', 'comercial'],
      ['./soporte', 'cliente'],
      ['./tiendas', 'cliente'],
    ] as const) {
      await page.goto(ruta)
      await expect(page.locator(`[data-app-topbar="${contexto}"]`), ruta).toBeVisible()
      await expect(volver(page), `${ruta} debe llevar Volver`).toBeVisible()
    }
  })
})

test.describe('con historial propio manda el historial', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('desde el catálogo a una ficha y vuelta, con el filtro puesto', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone?orden=precio-asc')
    await expect(page.getByRole('button', { name: /Ordenar/ })).toContainText('Precio')

    // Se entra por donde se entra de verdad: pulsando la tarjeta. Navegar a la
    // ficha por URL probaría otro caso —el de entrada directa— con el nombre
    // de éste.
    const ficha = page.locator('[data-product-card]').first().getByRole('link')
    await expect(ficha, 'la tarjeta tiene un único enlace a su ficha').toHaveCount(1)
    await ficha.click()
    await expect(page).toHaveURL(/\/iphone\/[^/]+\//)

    await volver(page).click()

    await expect(page, 'Volver devuelve el catálogo que se estaba viendo').toHaveURL(/\/iphone\?orden=precio-asc$/)
    await expect(page.getByRole('button', { name: /Ordenar/ })).toContainText('Precio')
  })

  test('desde una búsqueda a un resultado y vuelta, con la consulta intacta', async ({ page }) => {
    await comoApp(page)
    await page.goto('./buscar?q=iPhone')

    const resultado = page.locator('[data-product-card]').first().getByRole('link')
    await expect(resultado).toHaveCount(1)
    await resultado.click()
    await expect(page).toHaveURL(/\/iphone\//)

    await volver(page).click()

    await expect(page).toHaveURL(/\/buscar\?q=iPhone$/)
    await expect(page.getByTestId('search-input')).toHaveValue('iPhone')
  })
})

test.describe('abierta en frío va al sitio de la pantalla', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  // La primera navegación de cada prueba ES la pantalla secundaria: pasar
  // antes por Inicio dejaría historial detrás y estaríamos midiendo el caso
  // anterior con otro nombre.
  const casos: [string, RegExp][] = [
    ['./iphone/17-pro/256gb-plata', /\/iphone$/],
    ['./tiendas/triana', /\/tiendas$/],
    ['./favoritos', /\/tienda$/],
  ]

  for (const [entrada, destino] of casos) {
    test(`${entrada} vuelve a su contenedor`, async ({ page }) => {
      await comoApp(page)
      await page.goto(entrada)
      const partida = page.url()

      await volver(page).click()

      await expect(page).toHaveURL(destino)
      // Y las tres cosas que no deben pasar: salir de Banana, acabar en la
      // página en blanco del navegador o quedarse sin respuesta.
      expect(page.url()).toContain('/pagina-banana/')
      expect(page.url()).not.toContain('about:blank')
      expect(page.url()).not.toBe(partida)
      await expect(page.locator('[data-app-tab-bar]')).toBeVisible()
    })
  }

  test('en frío no se retrocede aunque una redirección haya cambiado la entrada', async ({ page }) => {
    await comoApp(page)
    // Un accesorio inexistente: `AccessoryDetailPage` hace `Navigate replace`
    // a `/accesorios`. Ese reemplazo le da a la entrada una `location.key`
    // nueva sin que haya aparecido nada detrás, que es justo el caso en el que
    // fiarse de la clave daría un falso «sí hay historial».
    await page.goto('./accesorios/no-existe-este-accesorio')
    await expect(page).toHaveURL(/\/accesorios$/)

    await volver(page).click()

    // Si se hubiera retrocedido, saldríamos de la aplicación.
    await expect(page).toHaveURL(/\/tienda$/)
    await expect(page.locator('[data-app-tab-bar]')).toBeVisible()
  })
})

test.describe('geometría y accesibilidad', () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    test.describe(`a ${viewport.width}×${viewport.height}`, () => {
      test.use({ viewport })

      test('el control cabe, es alcanzable y no desborda la barra', async ({ page }) => {
        await comoApp(page)

        for (const [ruta, buscador] of [
          ['./iphone', '[data-app-search="prominente"]'],
          ['./soporte', '[data-app-search="compacto"]'],
        ] as const) {
          const boton = volver(page)
          await page.goto(ruta)
          await expect(boton, ruta).toBeVisible()

          // Objetivo táctil: la recomendación es 44, y no se recorta para que
          // quepa nada.
          const caja = (await boton.boundingBox())!
          expect(caja.width, `${ruta} ancho del objetivo`).toBeGreaterThanOrEqual(44)
          expect(caja.height, `${ruta} alto del objetivo`).toBeGreaterThanOrEqual(44)

          // Es el primero de la fila: nada de la barra queda a su izquierda.
          const cajaBuscador = (await page.locator(buscador).boundingBox())!
          const cajaCarrito = (await page.locator('[data-app-cart]').boundingBox())!
          expect(caja.x, `${ruta} Volver va primero`).toBeLessThan(cajaBuscador.x)
          expect(caja.x + caja.width, `${ruta} no se solapa con el buscador`).toBeLessThanOrEqual(cajaBuscador.x)
          expect(cajaBuscador.x + cajaBuscador.width, `${ruta} el buscador no pisa el carrito`).toBeLessThanOrEqual(
            cajaCarrito.x + 1,
          )

          // El carrito conserva su objetivo y entra entero en la pantalla.
          expect(cajaCarrito.width, `${ruta} objetivo del carrito`).toBeGreaterThanOrEqual(44)
          expect(cajaCarrito.x + cajaCarrito.width, `${ruta} el carrito entra en la pantalla`).toBeLessThanOrEqual(
            viewport.width,
          )

          // Y la barra no genera desplazamiento horizontal en ninguna parte.
          const desborda = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
          expect(desborda, `${ruta} no debe desbordar a lo ancho`).toBe(false)

          // La barra inferior sigue entera.
          await expect(page.locator('[data-app-tab-bar] a'), ruta).toHaveCount(4)
        }
      })
    })
  }

  test('se activa con el teclado', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tiendas/triana')

    await volver(page).focus()
    await expect(volver(page)).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/tiendas$/)
  })
})

test.describe('la web no lo lleva', () => {
  test('fuera del binario la cabecera es la de siempre', async ({ page }) => {
    // Sin `comoApp`: no hay `window.Capacitor`, así que se monta `Header` y no
    // `AppTopBar`. El control es del armazón nativo y no debe aparecer aquí.
    await page.goto('./iphone')

    await expect(page.locator('[data-app-topbar]')).toHaveCount(0)
    await expect(volver(page)).toHaveCount(0)
  })
})
