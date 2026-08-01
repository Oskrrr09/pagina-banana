import { test, expect, type Page } from '@playwright/test'

// Encuadre en móvil, en la web y en la app.
//
// Oscar describió el síntoma como "hay momentos en los que se desplaza y
// descuadra lateralmente". No pasaba al cargar —el documento lleva
// `overflow-x: clip`— sino **al tocar un campo**: iOS amplía la página cuando
// el texto del campo mide menos de 16px, y una vez ampliada se puede arrastrar
// de lado. Estas pruebas fijan las dos mitades del arreglo.

const RUTAS = [
  '/',
  '/iphone',
  '/iphone/17-pro',
  '/accesorios',
  '/buscar?q=airpods',
  '/comparar',
  '/carrito',
  '/favoritos',
  '/tiendas',
  '/soporte',
  '/elige-tu-apple',
  '/login',
]

async function sinAvisos(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
}

test.describe('sin desbordamiento horizontal', () => {
  // 320px es el ancho útil más estrecho que se sigue usando (iPhone SE).
  for (const width of [320, 390]) {
    test(`ninguna ruta desborda a ${width}px @all`, async ({ page }) => {
      await sinAvisos(page)
      await page.setViewportSize({ width, height: 780 })

      for (const ruta of RUTAS) {
        await page.goto('.' + ruta)
        const desborde = await page.evaluate(() => {
          const de = document.documentElement
          return de.scrollWidth - de.clientWidth
        })
        expect(desborde, `${ruta} desborda ${desborde}px`).toBeLessThanOrEqual(1)
      }
    })
  }

  test('en la app tampoco desborda, con los filtros de categoría @all', async ({ page }) => {
    // Los filtros de la barra superior son una tira que se desplaza en
    // horizontal y se sale del borde a propósito: hay que comprobar que ese
    // desplazamiento se queda dentro de su caja.
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    })
    await page.setViewportSize({ width: 320, height: 780 })

    for (const ruta of ['/', '/iphone', '/carrito', '/favoritos']) {
      await page.goto('.' + ruta)
      // Empujamos la tira de filtros hasta el final.
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('*')) {
          if (el.scrollWidth > el.clientWidth + 4) el.scrollLeft = el.scrollWidth
        }
      })
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(desborde, `${ruta} desborda ${desborde}px en la app`).toBeLessThanOrEqual(1)
    }
  })

  test('los carruseles se desplazan solos, sin arrastrar la página @all', async ({ page }) => {
    await sinAvisos(page)
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto('./')

    // Empujamos todo contenedor con scroll horizontal hasta el final.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        if (el.scrollWidth > el.clientWidth + 4) el.scrollLeft = el.scrollWidth
      }
    })

    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(desborde).toBeLessThanOrEqual(1)
  })
})

test.describe('los campos no provocan zoom en iOS', () => {
  // Con `isMobile` el navegador informa `pointer: coarse`, que es la condición
  // bajo la que se aplica el suelo de 16px.
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  async function medirCampos(page: Page) {
    return page.evaluate(() =>
      [...document.querySelectorAll('input, textarea, select')]
        .filter((el) => {
          const tipo = (el as HTMLInputElement).type
          return tipo !== 'checkbox' && tipo !== 'radio' && el.getClientRects().length > 0
        })
        .map((el) => ({
          descripcion:
            el.getAttribute('aria-label') ??
            el.getAttribute('placeholder') ??
            el.getAttribute('name') ??
            el.tagName.toLowerCase(),
          tamano: parseFloat(getComputedStyle(el).fontSize),
        })),
    )
  }

  test('el buscador de la cabecera está a 16px o más', async ({ page }) => {
    await sinAvisos(page)
    await page.goto('./')
    await page.getByRole('button', { name: 'Buscar' }).first().click()

    const campos = await medirCampos(page)
    expect(campos.length).toBeGreaterThan(0)
    for (const campo of campos) {
      expect(campo.tamano, `"${campo.descripcion}" mide ${campo.tamano}px`).toBeGreaterThanOrEqual(
        16,
      )
    }
  })

  test('el campo del chat está a 16px o más', async ({ page }) => {
    await sinAvisos(page)
    await page.goto('./')
    await page.getByRole('button', { name: 'Abrir chat de Bananito' }).click()
    await expect(page.getByRole('dialog', { name: 'Bananito' })).toBeVisible()

    const campos = await medirCampos(page)
    for (const campo of campos) {
      expect(campo.tamano, `"${campo.descripcion}" mide ${campo.tamano}px`).toBeGreaterThanOrEqual(
        16,
      )
    }
  })

  test('los formularios de cuenta están a 16px o más', async ({ page }) => {
    await sinAvisos(page)
    for (const ruta of ['./login', './registro']) {
      await page.goto(ruta)
      const campos = await medirCampos(page)
      for (const campo of campos) {
        expect(
          campo.tamano,
          `${ruta} — "${campo.descripcion}" mide ${campo.tamano}px`,
        ).toBeGreaterThanOrEqual(16)
      }
    }
  })
})
