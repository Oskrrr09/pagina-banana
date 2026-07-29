import { test, expect, type Page } from '@playwright/test'

// Suite dedicada a la guía interactiva "Preparar mi dispositivo".
// Se prueba desde /soporte (donde vive el quick-link y el callout SAT).

async function openGuide(page: Page) {
  await page.goto('./soporte')
  // El callout SAT expone el botón "Preparar mi dispositivo" (el mismo
  // diálogo se abre también desde el quick-link).
  await page.getByRole('button', { name: 'Preparar mi dispositivo' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Preparar mi dispositivo' })).toBeVisible()
}

async function advance(page: Page) {
  await page.getByRole('button', { name: /^Siguiente/ }).click()
}

test.describe('DevicePreparationGuide — apertura y contenido', () => {
  test('el diálogo tiene nombre accesible y anuncia "Paso 1 de 4"', async ({ page }) => {
    await openGuide(page)
    await expect(page.getByRole('dialog', { name: 'Preparar mi dispositivo' })).toBeVisible()
    await expect(page.getByText('Paso 1 de 4')).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'Haz una copia de seguridad' })).toBeVisible()
  })

  test('"Siguiente" está desactivado hasta confirmar la copia; luego avanza', async ({ page }) => {
    await openGuide(page)
    const next = page.getByRole('button', { name: /^Siguiente/ })
    await expect(next).toBeDisabled()
    await page.getByRole('checkbox', { name: 'He realizado una copia de seguridad.' }).check()
    await expect(next).toBeEnabled()
    await next.click()
    await expect(page.getByText('Paso 2 de 4')).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'Desactiva la protección antirrobo' })).toBeVisible()
  })

  test('paso 2: aclaración sobre no disponibilidad universal + siguiente bloqueado', async ({ page }) => {
    await openGuide(page)
    await page.getByRole('checkbox', { name: 'He realizado una copia de seguridad.' }).check()
    await advance(page)
    await expect(
      page.getByText('Esta función no está disponible en todos los dispositivos', { exact: false }),
    ).toBeVisible()
    const next = page.getByRole('button', { name: /^Siguiente/ })
    await expect(next).toBeDisabled()
    await page
      .getByRole('checkbox', { name: /He revisado y desactivado esta protección cuando corresponde\./ })
      .check()
    await expect(next).toBeEnabled()
  })

  test('paso 3: menciona Buscar mi iPhone, iPad y Mac y no pide credenciales', async ({ page }) => {
    await openGuide(page)
    await page.getByRole('checkbox', { name: 'He realizado una copia de seguridad.' }).check()
    await advance(page)
    await page
      .getByRole('checkbox', { name: /He revisado y desactivado esta protección cuando corresponde\./ })
      .check()
    await advance(page)
    await expect(page.getByText('Paso 3 de 4')).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 3, name: 'Desactiva la función Buscar' }),
    ).toBeVisible()
    const dialog = page.getByRole('dialog', { name: 'Preparar mi dispositivo' })
    for (const dev of ['Buscar mi iPhone', 'Buscar mi iPad', 'Buscar mi Mac']) {
      await expect(dialog.getByText(dev)).toBeVisible()
    }
    await expect(dialog.locator('input[type="password"]')).toHaveCount(0)
    await expect(dialog.getByText(/Apple ID/i)).toHaveCount(0)
  })

  test('paso 4: resumen en orden y advertencia de no compartir credenciales', async ({ page }) => {
    await openGuide(page)
    await page.getByRole('checkbox', { name: 'He realizado una copia de seguridad.' }).check()
    await advance(page)
    await page
      .getByRole('checkbox', { name: /He revisado y desactivado esta protección cuando corresponde\./ })
      .check()
    await advance(page)
    await page.getByRole('checkbox', { name: 'He desactivado la función Buscar.' }).check()
    await advance(page)

    await expect(page.getByText('Paso 4 de 4')).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 3, name: 'Tu dispositivo está preparado' }),
    ).toBeVisible()

    const dialog = page.getByRole('dialog', { name: 'Preparar mi dispositivo' })
    const summary = (await dialog.textContent()) ?? ''
    const idxBackup = summary.indexOf('Copia de seguridad realizada')
    const idxAnti = summary.indexOf('Protección antirrobo revisada')
    const idxFind = summary.indexOf('Función Buscar desactivada')
    expect(idxBackup).toBeGreaterThanOrEqual(0)
    expect(idxAnti).toBeGreaterThan(idxBackup)
    expect(idxFind).toBeGreaterThan(idxAnti)

    await expect(
      dialog.getByText(
        'No compartas contraseñas, códigos de desbloqueo ni credenciales de Apple',
        { exact: false },
      ),
    ).toBeVisible()

    const cta = dialog.getByRole('link', { name: /Consultar tiendas y horarios/ })
    await expect(cta).toHaveAttribute('href', /\/tiendas$/)
  })

  test('"Anterior" regresa; Escape cierra y devuelve el foco al activador', async ({ page }) => {
    await openGuide(page)
    await page.getByRole('checkbox', { name: 'He realizado una copia de seguridad.' }).check()
    await advance(page)
    await page.getByRole('button', { name: 'Anterior' }).click()
    await expect(page.getByText('Paso 1 de 4')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Preparar mi dispositivo' })).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Preparar mi dispositivo' }).first(),
    ).toBeFocused()
  })

  test('trampa de foco: Tab y Shift+Tab no abandonan el diálogo', async ({ page }) => {
    await openGuide(page)
    const dialog = page.getByRole('dialog', { name: 'Preparar mi dispositivo' })
    // Recorremos ~10 tabs y comprobamos que el foco sigue dentro del panel.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const inside = await dialog.evaluate((el) => el.contains(document.activeElement))
      expect(inside).toBe(true)
    }
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Shift+Tab')
      const inside = await dialog.evaluate((el) => el.contains(document.activeElement))
      expect(inside).toBe(true)
    }
  })

  test('el botón "Cerrar guía" del pie cierra el diálogo desde el paso 4', async ({ page }) => {
    await openGuide(page)
    await page.getByRole('checkbox', { name: 'He realizado una copia de seguridad.' }).check()
    await advance(page)
    await page
      .getByRole('checkbox', { name: /He revisado y desactivado esta protección cuando corresponde\./ })
      .check()
    await advance(page)
    await page.getByRole('checkbox', { name: 'He desactivado la función Buscar.' }).check()
    await advance(page)
    await page.getByRole('button', { name: 'Cerrar guía' }).click()
    await expect(page.getByRole('dialog', { name: 'Preparar mi dispositivo' })).toHaveCount(0)
  })

  test('cerrar y volver a abrir reinicia el progreso; no escribe en localStorage/sessionStorage', async ({ page }) => {
    await openGuide(page)
    await page.getByRole('checkbox', { name: 'He realizado una copia de seguridad.' }).check()
    await advance(page)
    await expect(page.getByText('Paso 2 de 4')).toBeVisible()
    await page.keyboard.press('Escape')

    // Reabrimos y comprobamos que arranca de nuevo en el paso 1 sin marcas.
    await page.getByRole('button', { name: 'Preparar mi dispositivo' }).first().click()
    await expect(page.getByText('Paso 1 de 4')).toBeVisible()
    await expect(
      page.getByRole('checkbox', { name: 'He realizado una copia de seguridad.' }),
    ).not.toBeChecked()

    const storage = await page.evaluate(() => ({
      local: Object.keys(localStorage).filter((k) => /prepar|guide|sat/i.test(k)),
      session: Object.keys(sessionStorage).filter((k) => /prepar|guide|sat/i.test(k)),
    }))
    expect(storage.local).toEqual([])
    expect(storage.session).toEqual([])
  })

  test('no hay reserva de cita, calendario ni denominación "Iniciar reparación"', async ({ page }) => {
    await openGuide(page)
    for (const forbidden of ['Reservar cita', 'Pedir cita', 'Iniciar reparación']) {
      await expect(page.getByRole('button', { name: forbidden })).toHaveCount(0)
      await expect(page.getByRole('link', { name: forbidden })).toHaveCount(0)
    }
    const dialog = page.getByRole('dialog', { name: 'Preparar mi dispositivo' })
    await expect(dialog.locator('input[type="date"], input[type="time"]')).toHaveCount(0)
  })

  test('funciona a 375 px sin scroll horizontal @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await openGuide(page)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
