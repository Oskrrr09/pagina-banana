import { expect, test, type Page } from '@playwright/test'

async function seedBrowserState(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    localStorage.setItem('bananito:guest', JSON.stringify({ nombre: 'Elena R.', email: 'elena@example.test' }))
  })
}

async function seedCart(page: Page) {
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
}

test.beforeEach(async ({ page }) => {
  await seedBrowserState(page)
})

test('inicio, idioma y navegación profunda', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('main')).toBeVisible()

  await page.locator('[data-language-picker]').click()
  await page.getByRole('menuitemradio', { name: 'English' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.goto('./iphone/17-pro/256gb-plata')
  await expect(page.getByRole('heading', { level: 1, name: 'iPhone 17 Pro' })).toBeVisible()
  await expect(page).toHaveURL(/\/pagina-banana\/iphone\/17-pro\/256gb-plata$/)
})

test('carrito y primer paso de checkout', async ({ page }) => {
  await seedCart(page)
  await page.goto('./carrito')
  await expect(page.getByRole('heading', { level: 1, name: /Tu cesta/ })).toBeVisible()
  await expect(page.getByText('iPhone 17 Pro').first()).toBeVisible()

  await page.goto('./checkout/1')
  await expect(page).toHaveURL(/\/checkout\/1$/)
  await expect(page.getByLabel('Nombre y apellidos')).toBeVisible()
})

test('comparador selecciona un modelo', async ({ page }) => {
  await page.goto('./comparar')
  await page
    .getByRole('button', { name: /para el espacio 1$/ })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: /^Elegir modelo de/ })
  await dialog.getByRole('button', { name: /^Elegir iPhone 17$/ }).click()
  await expect(
    page.getByRole('group', { name: /^Modelos comparados/ }).getByText('iPhone 17', { exact: true }),
  ).toBeVisible()
})

test('chat abre, recibe foco y cierra con Escape', async ({ page }) => {
  await page.goto('./')
  const opener = page.getByRole('button', { name: 'Abrir chat de Bananito' })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: /Bananito/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cerrar chat' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('login degrada de forma segura sin backend', async ({ page }) => {
  await page.goto('./login')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('necesitan Supabase configurado')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toHaveCount(0)
})
