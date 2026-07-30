import { test, expect } from '@playwright/test'

test('el chat se abre desde el teclado y confina el foco con Tab', async ({ page }) => {
  // Evita que el aviso independiente de "tienda favorita" (aparece a los
  // 800ms y también gestiona foco/Escape) interfiera con este test.
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
  await page.goto('./')
  const trigger = page.getByRole('button', { name: 'Abrir chat de Bananito' })
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'Bananito' })
  await expect(dialog).toBeVisible()

  // El foco entra en el panel sobre el botón de cerrar (siempre disponible,
  // a diferencia del input que puede empezar deshabilitado mientras carga
  // la conversación). El botón "Enviar" empieza deshabilitado porque el
  // input está vacío, así que sólo hay dos elementos enfocables: cerrar e
  // input.
  const close = dialog.getByRole('button', { name: 'Cerrar chat' })
  const input = dialog.getByRole('textbox', { name: 'Escribe un mensaje para Bananito' })
  await expect(close).toBeFocused()
  await expect(input).toBeEnabled()

  // Tab desde el primero (cerrar) lleva al segundo (input).
  await page.keyboard.press('Tab')
  await expect(input).toBeFocused()

  // Otro Tab cicla de vuelta al primero (cerrar) — trampa de foco.
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()

  // Shift+Tab vuelve al último elemento (input).
  await page.keyboard.press('Shift+Tab')
  await expect(input).toBeFocused()

  // Escape cierra y devuelve el foco al botón que lo abrió.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Abrir chat de Bananito' })).toBeFocused()
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
  await expect(page.getByRole('button', { name: /chat de Bananito/i })).toHaveCount(0)
})
