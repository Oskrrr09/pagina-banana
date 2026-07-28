import { test, expect } from '@playwright/test'

test('portada carga con el hero y las categorías', async ({ page }) => {
  await page.goto('./')
  await expect(page).toHaveTitle(/Banana/i)
  await expect(page.getByRole('link', { name: /Comprar|Descubrir|Ver iPad Pro/i }).first()).toBeVisible()
  // La franja de confianza aparece con "5 tiendas".
  await expect(page.getByText(/5 tiendas en Canarias/)).toBeVisible()
})

test('enlaces de accesorios llevan a /buscar con su término', async ({ page }) => {
  await page.goto('./')
  const fundas = page.getByRole('link', { name: /Fundas iPhone/ }).first()
  await expect(fundas).toHaveAttribute('href', /\/buscar\?q=fundas/)
})

test('a 375 px de ancho no hay scroll horizontal @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('./')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
