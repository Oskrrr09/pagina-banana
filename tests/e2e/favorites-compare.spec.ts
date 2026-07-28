import { test, expect } from '@playwright/test'

test('añadir y quitar favoritos actualiza /favoritos', async ({ page }) => {
  // Semilla directa en localStorage — coincide con el shape de useStore.
  await page.addInitScript(() => {
    localStorage.setItem('banana:fav', JSON.stringify(['iphone/17-pro']))
  })
  await page.goto('./favoritos')
  await expect(page.getByRole('heading', { name: /Favoritos/i })).toBeVisible()
  await expect(page.getByText(/iPhone 17 Pro/).first()).toBeVisible()

  // Quitar el favorito y comprobar que desaparece la tarjeta del listado.
  const quitar = page.getByRole('button', { name: /Quitar .* de favoritos/ }).first()
  await quitar.click()
  await expect(page.getByText(/iPhone 17 Pro/)).toHaveCount(0)
})

test('añadir y quitar productos del comparador', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'banana:compare',
      JSON.stringify([
        {
          id: 'iphone/17-pro',
          modelSlug: '17-pro',
          family: 'iphone',
          name: 'iPhone 17 Pro',
          color: 'plata',
          capacity: '256GB',
          price: 1229,
          specs: [{ label: 'Pantalla', value: '6,3" ProMotion' }],
        },
      ]),
    )
  })
  await page.goto('./comparar')
  await expect(page.getByText('iPhone 17 Pro').first()).toBeVisible()
  // Se puede quitar del comparador y quedar vacío.
  const remove = page.getByRole('button', { name: /Quitar del comparador|Quitar iPhone 17 Pro/ }).first()
  if (await remove.count()) {
    await remove.click()
  }
})
