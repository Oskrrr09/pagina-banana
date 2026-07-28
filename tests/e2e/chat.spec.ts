import { test, expect } from '@playwright/test'

test('el chat se abre desde el teclado y confina el foco con Tab', async ({ page }) => {
  await page.goto('./')
  const trigger = page.getByRole('button', { name: 'Abrir información del chat' })
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'Chat con Banana' })
  await expect(dialog).toBeVisible()

  // El foco entra en el panel (botón de cerrar como primer elemento).
  const close = dialog.getByRole('button', { name: 'Cerrar información del chat' })
  await expect(close).toBeFocused()

  // Tab lleva al enlace "Ir a soporte".
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('link', { name: 'Ir a soporte' })).toBeFocused()

  // Otro Tab cicla al primer elemento (cerrar) — trampa de foco.
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()

  // Shift+Tab vuelve al último elemento.
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('link', { name: 'Ir a soporte' })).toBeFocused()

  // Escape cierra y devuelve el foco al botón que lo abrió.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Abrir información del chat' })).toBeFocused()
})

test('el chat sigue oculto en /checkout/*', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('banana:cart', JSON.stringify([
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
    ]))
  })
  await page.goto('./checkout/1')
  await expect(page.getByRole('button', { name: /información del chat/i })).toHaveCount(0)
})
