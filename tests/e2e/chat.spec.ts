import { test, expect } from '@playwright/test'

test('el chat se abre desde el teclado y confina el foco con Tab', async ({ page }) => {
  await page.addInitScript(() => {
    // Evita que el aviso independiente de "tienda favorita" (aparece a los
    // 800ms y también gestiona foco/Escape) interfiera con este test.
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    // Con Supabase configurado (en local) el chat pide nombre y email antes
    // de abrir la conversación. Los sembramos para que este test mida
    // siempre lo mismo, haya credenciales o no.
    localStorage.setItem('bananito:guest', JSON.stringify({ nombre: 'Elena R.', email: 'elena@example.test' }))
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
  await page.goto('./checkout/1')
  await expect(page.getByRole('button', { name: /chat de Bananito/i })).toHaveCount(0)
})

test('sin sesión ni datos previos, el chat pide nombre y email antes de empezar', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    localStorage.removeItem('bananito:guest')
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Abrir chat de Bananito' }).click()

  const dialog = page.getByRole('dialog', { name: 'Bananito' })
  await expect(dialog).toBeVisible()

  // Sin credenciales de Supabase (el caso de CI) no hay backend al que
  // identificarse, así que el chat arranca en modo demo directamente.
  const gate = dialog.getByText('Antes de empezar')
  if ((await gate.count()) === 0) {
    await expect(dialog.getByRole('textbox', { name: 'Escribe un mensaje para Bananito' })).toBeVisible()
    return
  }

  // Con backend: no se puede escribir hasta dar los datos.
  await expect(dialog.getByRole('textbox', { name: 'Escribe un mensaje para Bananito' })).toHaveCount(0)

  // Un email inválido no deja pasar.
  await dialog.getByLabel('Nombre').fill('Elena R.')
  await dialog.getByLabel('Email').fill('no-es-un-email')
  await dialog.getByRole('button', { name: 'Empezar a chatear' }).click()
  await expect(dialog.getByText('Escribe un email válido.')).toBeVisible()

  // Con datos correctos se guarda y aparece el campo de mensaje.
  await dialog.getByLabel('Email').fill('elena@example.test')
  await dialog.getByRole('button', { name: 'Empezar a chatear' }).click()
  await expect(dialog.getByRole('textbox', { name: 'Escribe un mensaje para Bananito' })).toBeVisible({
    timeout: 10_000,
  })

  const guardado = await page.evaluate(() => localStorage.getItem('bananito:guest'))
  expect(guardado).toContain('elena@example.test')
})
