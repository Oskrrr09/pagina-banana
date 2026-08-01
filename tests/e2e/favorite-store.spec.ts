import { test, expect, type Page } from '@playwright/test'

// Suite de la tienda favorita (PR3 del bloque diferencial).
// Cubre: prompt inicial, no bloqueo del sitio, "Ahora no", elegir tienda,
// persistencia, selector de cabecera, cambio y borrado, priorización en
// /tiendas y en el StorePicker.

// Playwright crea un contexto de navegador nuevo por cada test, así que el
// localStorage empieza vacío sin necesidad de `addInitScript` (que se
// dispararía en cada navegación borrando también el estado que la propia
// prueba acaba de crear).
async function ensureFreshVisit(_page: Page) {
  return
}

test('el bottom sheet aparece en la primera visita sin bloquear la navegación', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./')
  const prompt = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
  await expect(prompt).toBeVisible({ timeout: 5000 })
  // Aunque el prompt esté abierto, la portada sigue navegable.
  await expect(page.getByRole('link', { name: /Encuentra tu Apple/ }).first()).toBeVisible()
})

test('"Ahora no" cierra el prompt y no vuelve a aparecer en la sesión', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./')
  await page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ }).waitFor()
  await page.getByRole('button', { name: 'Ahora no' }).click()
  await expect(page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ }),
  ).toHaveCount(0)
})

test('elegir tienda persiste, actualiza cabecera y aparece primero en /tiendas', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./')
  const promptDialog = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
  await promptDialog.waitFor()
  await promptDialog.getByRole('button', { name: 'Elegir tienda', exact: true }).click()
  await promptDialog.getByRole('button', { name: /Banana Triana/ }).click()

  // Cabecera muestra "Mi tienda: X".
  await expect(page.getByRole('button', { name: /Mi tienda: Banana Triana/ })).toBeVisible()

  // Persiste tras recargar.
  await page.reload()
  await expect(page.getByRole('button', { name: /Mi tienda: Banana Triana/ })).toBeVisible()

  // En /tiendas la tienda favorita aparece con badge "Tu tienda".
  await page.goto('./tiendas')
  const heading = page
    .getByRole('heading', { name: 'Banana Triana', level: 2 })
    .first()
  await expect(heading).toBeVisible()
  await expect(page.getByText(/Tu tienda/).first()).toBeVisible()
})

test('desde el detalle se puede marcar y quitar la tienda favorita', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./tiendas/triana')
  await expect(
    page.getByRole('button', { name: /Marcar como mi tienda \(Banana Triana\)/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Marcar como mi tienda \(Banana Triana\)/ }).click()
  await expect(page.getByText(/Esta es tu tienda/)).toBeVisible()
  await page.getByRole('button', { name: /Quitar/ }).first().click()
  await expect(
    page.getByRole('button', { name: /Marcar como mi tienda \(Banana Triana\)/ }),
  ).toBeVisible()
})

test('no se guardan datos personales — sólo el slug elegido', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./')
  const promptDialog = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
  await promptDialog.waitFor()
  await promptDialog.getByRole('button', { name: 'Elegir tienda', exact: true }).click()
  await promptDialog.getByRole('button', { name: /Banana Triana/ }).click()

  const storage = await page.evaluate(() => ({
    fav: localStorage.getItem('banana:favorite-store'),
    prompt: localStorage.getItem('banana:favorite-store-prompt'),
    all: Object.keys(localStorage),
  }))
  expect(storage.fav).toBe('triana')
  expect(storage.prompt).toBe('dismissed')
  // Ninguna otra clave nueva creada por este flujo.
  expect(storage.all.some((k) => /email|coords|location|user/i.test(k))).toBe(false)
})

test('a 375 px el prompt de tienda favorita no genera scroll horizontal @mobile', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('./')
  await page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ }).waitFor()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('el prompt no aparece dentro del checkout', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.addInitScript(() => {
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
          qty: 1,
          insured: false,
        },
      ]),
    )
  })
  await page.goto('./checkout/1')
  // Esperamos un tiempo similar al que tarda el prompt en aparecer y
  // comprobamos que sigue sin estar.
  await page.waitForTimeout(1200)
  await expect(
    page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ }),
  ).toHaveCount(0)
})

test('el aviso no aparece encima de un diálogo modal ni le roba el foco', async ({ page }) => {
  // Regresión de A11Y-003. El aviso toma el foco al montarse, así que
  // apareciendo sobre un diálogo abierto se lo robaba a algo que la persona
  // estaba usando. Se manifestaba además como un fallo intermitente de la
  // trampa de foco de la guía en CI (QA-003): el temporizador de 800 ms caía
  // dentro del recorrido de tabulación del test.
  await page.goto('./soporte')

  await page.getByRole('button', { name: 'Preparar mi dispositivo' }).first().click()
  const guia = page.getByRole('dialog', { name: 'Preparar mi dispositivo' })
  await expect(guia).toBeVisible()

  // Bastante más que los 800 ms del temporizador.
  await page.waitForTimeout(2500)

  await expect(page.locator('[data-favorite-store-prompt]')).toHaveCount(0)
  const foco = await guia.evaluate((el) => el.contains(document.activeElement))
  expect(foco, 'la guía perdió el foco mientras estaba abierta').toBe(true)

  // Al cerrar la guía, el aviso sí puede aparecer: solo estaba esperando.
  await page.keyboard.press('Escape')
  await expect(guia).toBeHidden()
  await expect(page.locator('[data-favorite-store-prompt]')).toBeVisible({ timeout: 5000 })
})
