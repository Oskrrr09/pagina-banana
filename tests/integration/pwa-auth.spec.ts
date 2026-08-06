import { expect, test } from '@playwright/test'

test('cerrar sesión no deja el perfil accesible sin conexión', async ({ page, context }) => {
  const marker = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const email = `pwa-${marker}@example.test`
  const password = `Pwa-${marker}-segura`

  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
  await page.goto('./registro')
  await page.getByLabel('Nombre y apellidos').fill('Perfil PWA ficticio')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page).toHaveURL(/\/cuenta$/, { timeout: 15_000 })
  await expect(page.getByText(email)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/pagina-banana\/$/)

  await context.setOffline(true)
  try {
    await page.goto('./cuenta')
    await expect(page.getByText(email)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toHaveCount(0)
    await expect(page).toHaveURL(/\/login\?redirect=/)
  } finally {
    await context.setOffline(false)
  }
})
