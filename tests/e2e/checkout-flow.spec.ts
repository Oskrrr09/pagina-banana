import { test, expect, type Page } from '@playwright/test'

// Suplantamos el carrito con una línea de iPhone para no depender del flujo
// completo de ficha (más estable ante cambios de UI y accesibilidad).
async function seedCart(page: Page) {
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

test('Recogida en tienda seleccionada en el carrito llega al checkout', async ({ page }) => {
  await seedCart(page)
  await page.goto('./carrito')
  await page.getByRole('button', { name: /Recogida en tienda/ }).click()
  await expect(page.getByRole('button', { name: /Recogida en tienda/ })).toHaveAttribute('aria-pressed', 'true')

  await page.goto('./checkout/1')
  await expect(page.getByRole('button', { name: /Recogida en tienda/ })).toHaveAttribute('aria-pressed', 'true')
})

test('cambiar entrega en el checkout se refleja al volver al carrito', async ({ page }) => {
  await seedCart(page)
  await page.goto('./checkout/1')
  await page.getByRole('button', { name: /Recogida en tienda/ }).click()
  await expect(page.getByRole('button', { name: /Recogida en tienda/ })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('./carrito')
  await expect(page.getByRole('button', { name: /Recogida en tienda/ })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: /Envío a domicilio/ }).click()
  await expect(page.getByRole('button', { name: /Envío a domicilio/ })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('./checkout/1')
  await expect(page.getByRole('button', { name: /Envío a domicilio/ })).toHaveAttribute('aria-pressed', 'true')
})

test('activar el seguro no cambia la cantidad y aparece separado en el resumen', async ({ page }) => {
  await seedCart(page)
  await page.goto('./checkout/1')
  await page.getByLabel('Nombre y apellidos').fill('Elena R.')
  await page.getByLabel('Email').fill('elena@example.test')
  await page.getByLabel('Dirección').fill('Calle Mayor 1')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/\/checkout\/2$/)

  // Marcar el seguro para la única línea del carrito
  const seguro = page.getByRole('checkbox', { name: /Seguro para iPhone 17 Pro/ })
  await seguro.check()
  await expect(seguro).toBeChecked()

  // La línea sigue siendo "1 ud." (no se duplica el producto)
  await expect(page.getByText(/1 ud\./)).toBeVisible()

  // Y aparece la fila "Seguro" separada del total de productos
  await expect(page.getByRole('term', { name: 'Seguro' }).or(page.getByText(/^Seguro$/))).toBeVisible()

  // Desactivar el seguro lo retira del resumen
  await seguro.uncheck()
  await expect(seguro).not.toBeChecked()
})
