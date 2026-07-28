import { test, expect } from '@playwright/test'

// Añade un iPhone al carrito visitando la variante directamente y usando la
// API expuesta por la app (localStorage). Es más estable que perseguir botones
// que dependen del scroll y de las cantidades.
async function seedCart(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const line = {
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
    }
    localStorage.setItem('banana:cart', JSON.stringify([line]))
  })
}

test('abrir /checkout/3 sin pedido redirige al carrito o catálogo', async ({ page }) => {
  await page.goto('./checkout/3')
  await expect(page).toHaveURL(/(\/carrito|\/iphone)$/)
})

test('abrir /checkout/2 sin completar el paso 1 redirige al paso 1', async ({ page }) => {
  await seedCart(page)
  await page.goto('./checkout/2')
  await expect(page).toHaveURL(/\/checkout\/1$/)
})

test('un pedido demostrativo completo genera número y sobrevive a recarga', async ({ page }) => {
  await seedCart(page)
  await page.goto('./checkout/1')

  await page.getByLabel('Nombre y apellidos').fill('Elena R.')
  await page.getByLabel('Email').fill('elena@example.test')
  await page.getByLabel('Dirección').fill('Calle Mayor 1')

  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/\/checkout\/2$/)

  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page).toHaveURL(/\/checkout\/3$/, { timeout: 5_000 })
  const idLocator = page.getByText(/BC-\d{6}/)
  await expect(idLocator).toBeVisible()
  const orderText = await idLocator.textContent()

  await page.reload()
  await expect(page).toHaveURL(/\/checkout\/3$/)
  await expect(page.getByText(orderText ?? 'BC-')).toBeVisible()
})

test('el chat flotante no aparece en el checkout', async ({ page }) => {
  await seedCart(page)
  await page.goto('./checkout/1')
  await expect(page.getByRole('button', { name: /información del chat/i })).toHaveCount(0)
})
