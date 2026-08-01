import { test, expect, type Page } from '@playwright/test'

// Idiomas de la tienda.
//
// Canarias vende a mucho visitante extranjero, de ahí los cinco idiomas. Las
// traducciones son demostrativas y así se avisa en pantalla; estas pruebas
// fijan tanto el cambio de idioma como ese aviso.

async function sinAvisoDeTienda(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
}

async function elegirIdioma(page: Page, etiqueta: string) {
  // Por el marcador y no por la etiqueta: la etiqueta accesible del botón
  // está traducida, así que cambia con el propio idioma.
  await page.locator('[data-language-picker]').click()
  await page.getByRole('menuitemradio', { name: etiqueta }).click()
}

test.describe('selector de idioma', () => {
  // El navegador de las pruebas viene en inglés y la detección automática
  // haría su trabajo, así que aquí se fija el idioma del navegador para medir
  // el selector y no la detección. La detección tiene su propia prueba.
  test.use({ locale: 'es-ES' })

  test('arranca en castellano y cambia toda la interfaz', async ({ page }) => {
    await sinAvisoDeTienda(page)
    await page.goto('./')

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('contentinfo')).toContainText('Contáctanos')

    await elegirIdioma(page, 'Deutsch')

    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    await expect(page.getByRole('contentinfo')).toContainText('Kontakt')
    // La barra superior también, no solo el pie.
    await expect(page.getByRole('link', { name: 'Filialen' }).first()).toBeVisible()
  })

  test('el idioma elegido se recuerda al volver', async ({ page }) => {
    await sinAvisoDeTienda(page)
    await page.goto('./')
    await elegirIdioma(page, 'Français')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.getByRole('contentinfo')).toContainText('Contactez-nous')
  })

  test('los cinco idiomas traducen el pie, sin dejar claves en crudo', async ({ page }) => {
    await sinAvisoDeTienda(page)
    await page.goto('./')

    const esperado: [string, string][] = [
      ['Español', 'Ayuda y servicios'],
      ['English', 'Help and services'],
      ['Deutsch', 'Hilfe und Services'],
      ['Français', 'Aide et services'],
      ['Italiano', 'Aiuto e servizi'],
    ]

    for (const [idioma, rotulo] of esperado) {
      await elegirIdioma(page, idioma)
      const pie = page.getByRole('contentinfo')
      await expect(pie).toContainText(rotulo)
      // Una clave sin traducir se vería tal cual, con su punto.
      await expect(pie).not.toContainText('footer.helpAndServices')
    }
  })

  test('el euro sigue siendo el euro en todos los idiomas', async ({ page }) => {
    // El idioma cambia el formato del número, no la divisa: en Canarias se
    // paga en euros se mire desde donde se mire.
    await sinAvisoDeTienda(page)
    await page.goto('./iphone')

    for (const idioma of ['Español', 'English', 'Deutsch']) {
      await elegirIdioma(page, idioma)
      await expect(page.getByText(/€/).first()).toBeVisible()
      await expect(page.getByText(/[$£]/)).toHaveCount(0)
    }
  })
})

test.describe('aviso de traducción demostrativa', () => {
  // Idioma del navegador fijado, si no la detección abriría en inglés y el
  // aviso ya estaría puesto antes de empezar.
  test.use({ locale: 'es-ES' })

  test('solo aparece fuera del castellano, y permite volver', async ({ page }) => {
    await sinAvisoDeTienda(page)
    await page.goto('./')

    await expect(page.locator('[data-translation-notice]')).toHaveCount(0)

    await elegirIdioma(page, 'Italiano')
    await expect(page.locator('[data-translation-notice]')).toContainText('Traduzione dimostrativa')

    // El enlace devuelve al castellano, que es la versión que vale.
    await page.getByRole('button', { name: 'Vedi in spagnolo' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.locator('[data-translation-notice]')).toHaveCount(0)
  })

  test('se puede descartar y no vuelve', async ({ page }) => {
    await sinAvisoDeTienda(page)
    await page.goto('./')
    await elegirIdioma(page, 'English')

    await expect(page.locator('[data-translation-notice]')).toContainText('Demonstration translation')
    await page.getByRole('button', { name: 'Got it' }).click()
    await expect(page.locator('[data-translation-notice]')).toHaveCount(0)

    await page.reload()
    await expect(page.locator('[data-translation-notice]')).toHaveCount(0)
  })
})

test.describe('detección automática', () => {
  test.use({ locale: 'de-DE' })

  test('un navegador en alemán abre la tienda en alemán', async ({ page }) => {
    await sinAvisoDeTienda(page)
    await page.goto('./')
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    await expect(page.locator('[data-translation-notice]')).toContainText('Demonstrative Übersetzung')
  })

  test('un idioma que no ofrecemos cae al castellano', async ({ page, browser }) => {
    await page.goto('./')
    const url = page.url()

    const contexto = await browser.newContext({ locale: 'ja-JP' })
    const japones = await contexto.newPage()
    await japones.addInitScript(() =>
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed'),
    )
    await japones.goto(url)
    await expect(japones.locator('html')).toHaveAttribute('lang', 'es')
    await contexto.close()
  })
})

test('en la app no hay selector de idioma y todo va en castellano', async ({ page }) => {
  // Quien se descarga la app de una tienda de Canarias vive aquí; el visitante
  // extranjero entra por la web. Ofrecer un idioma sin poder cambiarlo sería
  // peor que no ofrecerlo.
  await page.addInitScript(() => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    // Aunque el navegador estuviera en alemán y hubiera una elección previa.
    localStorage.setItem('banana:idioma', 'de')
  })
  await page.goto('./')

  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.locator('[data-language-picker]')).toHaveCount(0)
  await expect(page.getByText(/Demonstrative Übersetzung/)).toHaveCount(0)
})
