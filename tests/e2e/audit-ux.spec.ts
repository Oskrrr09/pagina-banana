import { test, expect } from '@playwright/test'

// Pruebas de regresión de las mejoras implementadas tras la auditoría UX de
// la web oficial. Cada bloque se ejecuta contra las mismas URLs públicas y
// no manipula el carrito ni el flujo del seguro.

test.describe('Portada — H1 semántico único', () => {
  test('existe exactamente un H1 con el texto oficial y es visible', async ({ page }) => {
    await page.goto('./')
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText('Banana Computer — Apple en Canarias')
    await expect(h1).toBeVisible()
  })

  test('a 375 px de ancho la portada sigue sin scroll horizontal @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('./')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test.describe('Servicio Técnico Autorizado en /soporte', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./soporte')
  })

  test('banner "Sin cita previa" visible con texto exacto', async ({ page }) => {
    await expect(page.getByText('No necesitas cita previa').first()).toBeVisible()
    await expect(
      page.getByText(
        'No necesitas cita previa. Puedes acudir directamente durante el horario de apertura.',
        { exact: false },
      ),
    ).toBeVisible()
  })

  test('checklist de preparación con copia, Buscar y modo antirrobo', async ({ page }) => {
    const section = page.getByRole('heading', {
      name: 'Prepara tu dispositivo antes de entregarlo',
      level: 3,
    })
    await expect(section).toBeVisible()
    await expect(page.getByText('Realiza una copia de seguridad', { exact: false })).toBeVisible()
    await expect(
      page.getByText('Desactiva la función “Buscar”', { exact: false }),
    ).toBeVisible()
    await expect(
      page.getByText('Desactiva la Protección del dispositivo en caso de robo', { exact: false }),
    ).toBeVisible()
  })

  test('se explica que se puede dejar el dispositivo en cualquier tienda Banana', async ({ page }) => {
    await expect(
      page.getByText(
        'También puedes dejar el dispositivo en el resto de tiendas Banana',
        { exact: false },
      ),
    ).toBeVisible()
  })

  test('dispositivo en garantía: envío gratuito', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 3, name: 'Dispositivo en garantía' })
    await expect(heading).toBeVisible()
    // El párrafo hermano del heading contiene la afirmación de gratuidad.
    const container = heading.locator('..')
    await expect(container).toContainText('el envío al servicio técnico es gratuito')
  })

  test('dispositivo fuera de garantía: 35 €, descuento si acepta, no reembolsable si rechaza', async ({ page }) => {
    const fuera = page.locator('section#servicio-tecnico').getByText(/coste de/)
    await expect(fuera.first()).toContainText('35 €')
    await expect(
      page.getByText('esos 35 € se descontarán del precio final', { exact: false }),
    ).toBeVisible()
    await expect(
      page.getByText('el importe de 35 € no será reembolsable', { exact: false }),
    ).toBeVisible()
  })

  test('plazos orientativos: mínimo 3 días de traslado, aclaración y diagnóstico/reparación', async ({ page }) => {
    await expect(
      page.getByText(
        'el traslado suele tardar un mínimo de',
        { exact: false },
      ),
    ).toBeVisible()
    await expect(page.getByText(/3 días/).first()).toBeVisible()
    await expect(
      page.getByText(
        'Los 3 días corresponden únicamente al traslado orientativo al servicio técnico',
        { exact: false },
      ),
    ).toBeVisible()
    await expect(page.getByText(/diagnosticar el equipo/)).toBeVisible()
    await expect(page.getByText(/tiempo de reparación/)).toBeVisible()
  })

  test('no aparecen controles prohibidos (reserva de cita, calendario, contraseña)', async ({ page }) => {
    for (const forbidden of ['Reservar cita', 'Pedir cita', 'Seleccionar fecha', 'Elegir hora']) {
      await expect(page.getByRole('button', { name: forbidden })).toHaveCount(0)
      await expect(page.getByRole('link', { name: forbidden })).toHaveCount(0)
    }
    await expect(page.locator('input[type="password"]')).toHaveCount(0)
    await expect(page.locator('input[type="date"]')).toHaveCount(0)
    await expect(page.locator('input[type="time"]')).toHaveCount(0)
    await expect(page.locator('[role="calendar"], [role="grid"][aria-label*="calend" i]')).toHaveCount(0)
  })

  test('CTA hacia tiendas y horarios funciona', async ({ page }) => {
    const cta = page.getByRole('link', { name: /Consultar tiendas y horarios/ })
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', /\/tiendas$/)
  })

  test('no se prometen plazos totales garantizados', async ({ page }) => {
    const body = (await page.locator('section#servicio-tecnico').textContent()) ?? ''
    expect(body).not.toContain('plazo garantizado')
    expect(body).not.toContain('reparación garantizada')
    expect(body).not.toMatch(/en 3 días estará reparado/i)
    expect(body).not.toMatch(/diagnóstico en 3 días/i)
  })
})

test.describe('Plan Renove — timeline oficial con Foxway', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./plan-renove')
  })

  test('aparecen los cuatro pasos con Foxway', async ({ page }) => {
    for (const step of [
      'Estimación inicial',
      'Entrega del dispositivo',
      'Revisión y valoración final',
      'Compensación',
    ]) {
      await expect(page.getByRole('heading', { level: 3, name: step })).toBeVisible()
    }
    await expect(page.getByText(/Foxway/).first()).toBeVisible()
  })

  test('se explica que la estimación inicial puede cambiar', async ({ page }) => {
    await expect(
      page.getByText(
        'La valoración final puede ser diferente de la estimación inicial',
        { exact: false },
      ),
    ).toBeVisible()
  })

  test('no aparecen precios ni tasador propio', async ({ page }) => {
    // Ninguna cifra con símbolo € dentro de la timeline (los precios de la
    // paleta comercial viven en otros bloques del sitio, no aquí).
    const timeline = page.getByRole('list', { name: 'Pasos del Plan Renove con Foxway' })
    await expect(timeline).toBeVisible()
    const text = (await timeline.textContent()) ?? ''
    expect(text).not.toMatch(/\d+\s*€/)
    // Ningún botón que sugiera calcular oferta.
    for (const forbidden of ['Calcular oferta', 'Calcular tasación', 'Tasar ahora']) {
      await expect(page.getByRole('button', { name: forbidden })).toHaveCount(0)
    }
    // Ningún input dentro de la timeline.
    await expect(timeline.locator('input')).toHaveCount(0)
  })

  test('el CTA hacia tiendas sigue disponible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Ver tiendas y horarios/ })).toBeVisible()
  })

  test('no se han inyectado iframes externos', async ({ page }) => {
    await expect(page.locator('iframe')).toHaveCount(0)
  })
})
