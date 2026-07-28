import { test, expect } from '@playwright/test'

test('el input del buscador se sincroniza con el parámetro q', async ({ page }) => {
  await page.goto('./buscar?q=iPhone')
  await expect(page.getByTestId('search-input')).toHaveValue('iPhone')

  await page.goto('./buscar?q=Mac')
  await expect(page.getByTestId('search-input')).toHaveValue('Mac')
  await expect(page.getByText(/Resultados para/)).toContainText('Mac')
})

test('accesorios no envían todos al catálogo de iPhone', async ({ page }) => {
  await page.goto('./')
  const audio = page.getByRole('link', { name: /Audio y sonido/ }).first()
  const href = await audio.getAttribute('href')
  expect(href).toContain('/buscar?q=audio')
})
