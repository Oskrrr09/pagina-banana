import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// Tienda y el catálogo de familia.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// 1. Tienda tiene identidad propia y **no repite Inicio**. Antes su `h1` era el
//    nombre del producto del hero, y enseñaba vistos recientes, tienda favorita
//    y una rejilla de categorías que ya viven en la barra superior.
// 2. El catálogo de una familia se alcanza **pronto**: filtros y rejilla sin dos
//    escaparates por delante.
// 3. Los filtros siguen viviendo en la URL, que es lo que hace que Atrás y un
//    enlace compartido recuperen lo que se estaba mirando.
// 4. El comparador se alcanza **desde la tarjeta**, y lo que entra en él es la
//    **misma variante** que la tarjeta enseña.
//
// Se simula el binario como en el resto de la suite.
// ============================================================================

async function comoApp(page: Page, recientes?: string[]) {
  await page.addInitScript((lista) => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    if (lista) localStorage.setItem('banana:recientes', JSON.stringify(lista))
  }, recientes)
}

test.describe('Tienda', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('tiene identidad propia y no usa un producto como encabezado', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tienda')
  })

  test('no repite lo que ya está en Inicio ni en la barra superior', async ({ page }) => {
    // Con historial sembrado: si «Vistos recientemente» volviera, aquí saldría.
    await comoApp(page, ['iphone/17-pro', 'mac/macbook-air-m5'])
    await page.goto('./tienda')

    const contenido = page.getByRole('main')
    await expect(
      contenido.getByRole('heading', { name: 'Continúa donde lo dejaste' }),
      'los vistos recientes son de Inicio',
    ).toHaveCount(0)
    await expect(contenido.getByRole('heading', { name: 'Tu tienda' }), 'la tienda favorita es de Inicio').toHaveCount(
      0,
    )
    await expect(
      contenido.getByRole('heading', { name: 'Compra por categoría' }),
      'las categorías viven en los chips de la barra',
    ).toHaveCount(0)

    // Y los chips siguen a un toque, que es lo que justifica retirar la rejilla:
    // si desaparecieran, Tienda se quedaría sin ninguna entrada a las familias.
    const chips = page.getByRole('navigation', { name: 'Categorías' })
    await expect(chips.getByRole('link', { name: 'iPhone', exact: true })).toBeVisible()
    await expect(chips.getByRole('link'), 'las seis familias del menú').toHaveCount(6)
  })

  test('no hay hero de producto', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    // La propiedad, no la clase: ninguna SECCIÓN de Tienda puede titularse con
    // el nombre de un modelo. Los `h3` de las tarjetas sí son nombres de
    // producto, y eso está bien: lo que no puede volver es el hero.
    await expect(page.locator('#app-hero-titulo')).toHaveCount(0)
    const secciones = await page.getByRole('main').getByRole('heading', { level: 2 }).allInnerTexts()
    const h1 = await page.getByRole('heading', { level: 1 }).innerText()
    expect([h1, ...secciones].some((h) => /iPhone \d|MacBook|iPad |Watch Series/i.test(h))).toBe(false)
  })
})

test.describe('catálogo de familia', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('el catálogo llega sin dos escaparates por delante', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    await expect(page.getByRole('heading', { level: 1, name: /Comprar un iPhone/ })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Ordenar' })).toBeVisible()

    // Lo que se retiró: el carrusel que repetía todos los modelos y el
    // escaparate gigante de ofertas.
    await expect(page.getByRole('navigation', { name: /Modelos de/ })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Ofertas destacadas en/ })).toHaveCount(0)

    // Los filtros tienen que entrar dentro de la primera pantalla y media.
    const orden = page.getByRole('combobox', { name: 'Ordenar' })
    const caja = await orden.boundingBox()
    expect(caja!.y, 'los filtros deben quedar cerca del principio del catálogo').toBeLessThan(844)
  })

  test('el filtro viaja en la URL y Atrás lo recupera', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('precio-asc')
    await expect(page).toHaveURL(/orden=precio-asc/)

    // Entrar en una ficha y volver: el orden sigue puesto.
    // El enlace de la primera tarjeta, no «un enlace que diga iPhone»: en la
    // página hay chips y botones que también lo dicen.
    await page.locator('[data-product-card]').first().getByRole('link').first().click()
    await expect(page).toHaveURL(/\/iphone\/[^/]+\//)
    await page.goBack()
    await expect(page).toHaveURL(/orden=precio-asc/)
    await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('precio-asc')
  })

  test('sin resultados ofrece salidas reales', async ({ page }) => {
    await comoApp(page)
    // Combinación imposible: el iPhone más barato pasa de 500 €.
    await page.goto('./iphone?precio=500')

    await expect(page.locator('[data-product-card]'), 'ningún producto cumple el filtro').toHaveCount(0)
    await expect(
      page.getByRole('region', { name: /coincide con los filtros/i }).getByRole('link', { name: 'Encuentra tu Apple' }),
    ).toBeVisible()

    // Dentro del propio estado vacío: la barra de filtros tiene su propio
    // «Limpiar», y aquí interesa el que se ofrece donde está mirando la persona.
    await page
      .getByRole('region', { name: /coincide con los filtros/i })
      .getByRole('button', { name: 'Limpiar filtros' })
      .click()
    await expect(page).not.toHaveURL(/precio=/)
    await expect(page.locator('[data-product-card]').first(), 'al limpiar vuelve el catálogo').toBeVisible()
  })
})

test.describe('comparador desde el catálogo', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('se añade desde la tarjeta y se llega al comparador', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const primera = page
      .locator('[data-product-card]')
      .first()
      .getByRole('button', { name: /^Comparar / })
    await expect(primera).toBeVisible()
    await expect(primera).toHaveAttribute('aria-pressed', 'false')

    await primera.click()
    await expect(primera, 'el botón refleja que ese modelo está en el comparador').toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // Con dos, aparece la llamada para abrirlo.
    await page
      .locator('[data-product-card]')
      .nth(1)
      .getByRole('button', { name: /^Comparar / })
      .click()
    const abrir = page.getByRole('link', { name: /Ver el comparador/ }).first()
    await expect(abrir).toBeVisible()
    await abrir.click()
    await expect(page).toHaveURL(/\/comparar\?familia=iphone/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('al comparador entra la MISMA variante que enseña la tarjeta', async ({ page }) => {
    await comoApp(page)
    // En Mac vive el caso que hace útil esta prueba: hay modelos cuya variante
    // rebajada NO es la de entrada —el MacBook Air M5 arranca en 1319 € y su
    // oferta está en la configuración de 1579 €—. Con iPhone la mutación de
    // «coge el precio desde del modelo» pasaría desapercibida.
    await page.goto('./mac')

    const conOferta = page.locator('[data-product-card]').filter({ hasText: '%' })
    const cuantas = await conOferta.count()
    expect(cuantas, 'sin ofertas la prueba no comprueba nada').toBeGreaterThan(0)

    const euros = (s: string) => Number(s.replace(/[^\d,]/g, '').replace(',', '.'))

    for (let i = 0; i < cuantas; i++) {
      const tarjeta = conOferta.nth(i)
      const texto = (await tarjeta.innerText()).replace(/\s+/g, ' ')
      const precio = (texto.match(/\d+(?:[.,]\d+)*\s?€/g) ?? [])[0]
      expect(precio, 'la tarjeta con oferta enseña un precio').toBeTruthy()

      await tarjeta.getByRole('button', { name: /^Comparar / }).click()
      const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
      const anadido = guardado[guardado.length - 1]

      expect(
        anadido.price,
        `el comparador recibió ${anadido.price} y la tarjeta enseñaba ${precio}: no es la misma variante`,
      ).toBe(euros(precio!))

      // Se retira para no toparse con el máximo de tres.
      await tarjeta.getByRole('button', { name: /^Comparar / }).click()
    }
  })

  test('volver a pulsar lo quita', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const boton = page
      .locator('[data-product-card]')
      .first()
      .getByRole('button', { name: /^Comparar / })
    await boton.click()
    await expect(boton).toHaveAttribute('aria-pressed', 'true')
    await boton.click()
    await expect(boton).toHaveAttribute('aria-pressed', 'false')
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
    expect(guardado).toHaveLength(0)
  })
})

test.describe('encaje', () => {
  for (const ancho of [320, 390]) {
    test(`a ${ancho} px no hay desbordamiento horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 800 })
      await comoApp(page)

      for (const ruta of ['./tienda', './iphone']) {
        await page.goto(ruta)
        const desborde = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(desborde, `${ruta} a ${ancho} px`).toBe(0)
      }
    })
  }
})
