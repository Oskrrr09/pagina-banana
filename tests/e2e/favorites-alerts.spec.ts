import { test, expect, type Page } from '@playwright/test'

// PR4: seguimiento de disponibilidad + centro de notificaciones + simulación
// de llegada a tienda.

async function addIphoneToFavoritesAndPickStore(page: Page) {
  // Añadir favorito desde el catálogo de iPhone.
  await page.goto('./iphone')
  await page.getByRole('button', { name: 'Añadir iPhone 17 Pro a favoritos' }).click()
  await expect(
    page.getByRole('button', { name: 'Quitar iPhone 17 Pro de favoritos' }),
  ).toBeVisible()

  // Elegir tienda favorita desde el bottom sheet (se abre en la primera visita).
  const promptDialog = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
  if (await promptDialog.count()) {
    await promptDialog.getByRole('button', { name: 'Elegir tienda', exact: true }).click()
    await promptDialog.getByRole('button', { name: /Banana Triana/ }).click()
  }
}

test('activar seguimiento genera notificación al simular llegada + campana con contador', async ({ page }) => {
  await addIphoneToFavoritesAndPickStore(page)

  await page.goto('./favoritos')
  await expect(page.getByRole('heading', { name: 'iPhone 17 Pro', level: 3 })).toBeVisible()

  // Activa el seguimiento eligiendo Triana desde el details.
  await page.getByText('Seguir disponibilidad').first().click()
  await page.getByRole('button', { name: /Banana Triana/ }).click()
  await expect(page.getByText(/Siguiendo disponibilidad en Banana Triana/)).toBeVisible()

  // Simular llegada crea una notificación demostrativa.
  await page.getByRole('button', { name: /Simular llegada/ }).click()
  await expect(
    page.getByText(/Simulación: iPhone 17 Pro figura como disponible/),
  ).toBeVisible()

  // Campana muestra el contador de no leídos.
  await expect(page.getByRole('button', { name: /Avisos \(1 sin leer\)/ })).toBeVisible()

  // Abre el panel y marca todas como leídas.
  await page.getByRole('button', { name: /Avisos \(1 sin leer\)/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Avisos' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Marcar todos como leídos' }).click()
  // Ya no hay contador.
  await expect(page.getByRole('button', { name: 'Avisos' })).toBeVisible()
})

test('quitar favorito con seguimiento activo también desactiva el aviso (sin huérfanos)', async ({ page }) => {
  await addIphoneToFavoritesAndPickStore(page)

  await page.goto('./favoritos')
  await page.getByText('Seguir disponibilidad').first().click()
  await page.getByRole('button', { name: /Banana Triana/ }).click()

  // Quita el favorito → alertas y notificaciones huérfanas se limpian.
  await page.getByRole('button', { name: 'Quitar iPhone 17 Pro de favoritos' }).click()
  await expect(page.getByText('Aún no has guardado ningún producto.')).toBeVisible()

  const orphan = await page.evaluate(() => {
    return {
      alerts: JSON.parse(localStorage.getItem('banana:favorite-alerts') || '[]'),
      notifications: JSON.parse(
        localStorage.getItem('banana:favorite-notifications') || '[]',
      ),
    }
  })
  expect(orphan.alerts).toEqual([])
  expect(orphan.notifications).toEqual([])
})

test('en /favoritos no existe ningún input de email ni petición de red saliente', async ({ page }) => {
  await addIphoneToFavoritesAndPickStore(page)
  await page.goto('./favoritos')
  // Ninguna llamada externa.
  const requests: string[] = []
  page.on('request', (req) => {
    if (!req.url().startsWith('http://127.0.0.1')) requests.push(req.url())
  })
  await page.getByText('Seguir disponibilidad').first().click()
  await page.getByRole('button', { name: /Banana Triana/ }).click()
  await page.getByRole('button', { name: /Simular llegada/ }).click()
  // Nada de inputs email en toda la página.
  await expect(page.locator('input[type="email"]')).toHaveCount(0)
  expect(requests, `Peticiones inesperadas: ${requests.join(', ')}`).toEqual([])
})
