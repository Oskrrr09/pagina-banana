import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Cobertura de accesibilidad con axe-core.
//
// - Se ejecutan las etiquetas oficiales `wcag2a`, `wcag2aa` y `wcag21a`
//   (WCAG 2.1 nivel A/AA).
// - **No hay reglas globalmente desactivadas.** Cada excepción posible se
//   aplicaría con `.exclude()` o `.disableRules()` en una ruta concreta,
//   justificada y limitada, no en toda la suite.
// - Reglas y contraste se comprueban también sobre la guía interactiva
//   "Preparar mi dispositivo".

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a']

async function reduceMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

async function seedCartForCheckout(page: Page) {
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

async function analyze(page: Page, url: string) {
  await reduceMotion(page)
  if (url === '/checkout/1') await seedCartForCheckout(page)
  await page.goto('.' + url)
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
  const detail = results.violations
    .map(
      (v) =>
        `${v.id} (${v.impact ?? 'unknown'}): ${v.nodes.length} nodo(s) — ${v.help}\n` +
        v.nodes.slice(0, 3).map((n) => `  · ${n.target.join(' ')}`).join('\n'),
    )
    .join('\n')
  expect(results.violations, `Violaciones axe en ${url}:\n${detail}`).toEqual([])
}

test.describe('Accesibilidad automatizada con axe-core (sin reglas globales desactivadas)', () => {
  test('portada /', async ({ page }) => {
    await analyze(page, '/')
  })

  test('familia /iphone', async ({ page }) => {
    await analyze(page, '/iphone')
  })

  test('ficha de producto /iphone/17-pro/256gb-plata', async ({ page }) => {
    await analyze(page, '/iphone/17-pro/256gb-plata')
  })

  test('tiendas /tiendas', async ({ page }) => {
    await analyze(page, '/tiendas')
  })

  test('detalle de tienda /tiendas/castillo', async ({ page }) => {
    await analyze(page, '/tiendas/castillo')
  })

  test('soporte /soporte', async ({ page }) => {
    await analyze(page, '/soporte')
  })

  test('servicio técnico /servicio-tecnico', async ({ page }) => {
    await analyze(page, '/servicio-tecnico')
  })

  test('plan renove /plan-renove', async ({ page }) => {
    await analyze(page, '/plan-renove')
  })

  test('checkout paso 1 con carrito sembrado', async ({ page }) => {
    await analyze(page, '/checkout/1')
  })

  test('guía "Preparar mi dispositivo" abierta desde /soporte', async ({ page }) => {
    await reduceMotion(page)
    await page.goto('./soporte')
    await page
      .waitForLoadState('networkidle', { timeout: 10_000 })
      .catch(() => undefined)
    // Se abre desde el callout SAT (botón secundario) — el mismo diálogo se
    // reutiliza también desde el quick-link y desde la ficha SAT.
    await page.getByRole('button', { name: 'Preparar mi dispositivo' }).first().click()
    await expect(page.getByRole('dialog', { name: 'Preparar mi dispositivo' })).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .include('[role="dialog"]')
      .analyze()
    const detail = results.violations
      .map((v) => `${v.id}: ${v.help}`)
      .join('\n')
    expect(results.violations, `Violaciones axe en la guía:\n${detail}`).toEqual([])
  })
})
