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

const PUBLIC_ROUTES = [
  '/',
  '/iphone',
  '/iphone/17-pro',
  '/iphone/17-pro/256gb-plata',
  '/accesorios',
  '/accesorios/adaptador-corriente-usb-c-20w',
  '/buscar?q=iphone',
  '/comparar',
  '/favoritos',
  '/carrito',
  '/servicios',
  '/plan-renove',
  '/tiendas',
  '/tiendas/castillo',
  '/soporte',
  '/servicio-tecnico',
  '/elige-tu-apple',
  '/login',
  '/registro',
] as const

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
  test.beforeEach(async ({ page }) => {
    // El aviso no modal de tienda favorita tiene su propia cobertura. Aquí
    // se desactiva para que no robe el foco justo después de cerrar el modal
    // que está verificando cada prueba.
    await page.addInitScript(() => {
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    })
  })

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

  // Sin credenciales de Supabase (el caso de CI) estas rutas enseñan su
  // aviso de configuración; con credenciales, el formulario. Ambas
  // variantes deben pasar axe.
  test('acceso /login', async ({ page }) => {
    await analyze(page, '/login')
  })

  test('registro /registro', async ({ page }) => {
    await analyze(page, '/registro')
  })

  test('accesorios /accesorios', async ({ page }) => {
    await analyze(page, '/accesorios')
  })

  test('ficha de accesorio', async ({ page }) => {
    await analyze(page, '/accesorios/adaptador-corriente-usb-c-20w')
  })

  test('perfil /cuenta en modo demostrativo', async ({ page }) => {
    await analyze(page, '/cuenta')
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

  test('selector de modelos abierto aísla el fondo y pasa axe', async ({ page }) => {
    await reduceMotion(page)
    await page.goto('./comparar')
    const opener = page.locator('[data-model-picker-trigger]').first()
    await opener.click()
    const dialog = page.getByRole('dialog', { name: /^Elegir modelo de/ })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeFocused()
    await expect
      .poll(() =>
        page.locator('header').first().evaluate((element) => Boolean(element.closest('[inert]'))),
      )
      .toBe(true)

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(results.violations, results.violations.map((v) => v.id).join(',')).toEqual([])

    await page.keyboard.press('Shift+Tab')
    await expect(dialog.locator('button:not([disabled])').last()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('menú móvil abierto pasa axe', async ({ page }) => {
    await reduceMotion(page)
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('./')
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    const dialog = page.getByRole('dialog', { name: 'Menú principal' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Cerrar menú' })).toBeFocused()
    await expect
      .poll(() => page.locator('main').evaluate((element) => Boolean(element.closest('[inert]'))))
      .toBe(true)
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(results.violations, results.violations.map((v) => v.id).join(',')).toEqual([])
  })

  test('chat abierto pasa axe', async ({ page }) => {
    await reduceMotion(page)
    await page.goto('./')
    await page.getByRole('button', { name: 'Abrir chat de Bananito' }).click()
    await expect(page.getByRole('dialog', { name: 'Chat de Bananito' })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(results.violations, results.violations.map((v) => v.id).join(',')).toEqual([])
  })
})

test('cada ruta pública tiene una sola región principal y supera la regla de landmark', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
  for (const route of PUBLIC_ROUTES) {
    await page.goto('.' + route)
    await expect(page.locator('main'), `${route} debe tener exactamente un main`).toHaveCount(1)
    const results = await new AxeBuilder({ page })
      .withRules(['landmark-no-duplicate-main'])
      .analyze()
    expect(
      results.violations,
      `Landmarks duplicados en ${route}: ${results.violations.map((v) => v.id).join(',')}`,
    ).toEqual([])
  }
})
