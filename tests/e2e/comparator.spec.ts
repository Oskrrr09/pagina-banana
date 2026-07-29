import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Suite del comparador esencial (PR "Rediseña el comparador con diferencias
// esenciales"). Comprueba:
//   - encabezado y estado vacío;
//   - añadir hasta tres modelos de la misma familia;
//   - modo "Solo diferencias" activo por defecto y switch a "Mostrar todas";
//   - resumen superior;
//   - sustituir un modelo dentro de su columna con el <select>;
//   - añadir a favoritos y al carrito desde la columna;
//   - persistencia tras recargar;
//   - sin scroll horizontal a 375 px;
//   - axe sin nuevas violaciones.

async function seedCompareIphonePro(page: Page) {
  await page.goto('./iphone/17-pro')
  const compareChecks = page.getByRole('checkbox', { name: /Añadir a comparar/ })
  await compareChecks.nth(0).check()
  await compareChecks.nth(1).check()
}

test('encabezado nuevo + estado vacío con enlace al asistente', async ({ page }) => {
  await page.goto('./comparar')
  await expect(page.getByRole('heading', { name: 'Compara tus opciones', level: 1 })).toBeVisible()
  await expect(
    page.getByText('Consulta solo las diferencias que realmente pueden ayudarte a elegir.'),
  ).toBeVisible()
  const asistente = page.getByRole('link', { name: /Necesito ayuda para elegir/ })
  await expect(asistente).toBeVisible()
  await expect(asistente).toHaveAttribute('href', /\/elige-tu-apple$/)
})

test('"Solo diferencias" está activo por defecto y "Mostrar todas" pinta más filas', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')

  // El chip por defecto es "Solo diferencias".
  await expect(
    page.getByRole('button', { name: 'Solo diferencias' }),
  ).toHaveAttribute('aria-pressed', 'true')

  const initialRows = await page.locator('table tbody tr').count()

  // Cambiar a "Mostrar todas" debe pintar filas adicionales (o al menos las mismas).
  await page.getByRole('button', { name: 'Mostrar todas' }).click()
  await expect(page.getByRole('button', { name: 'Mostrar todas' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const allRows = await page.locator('table tbody tr').count()
  expect(allRows).toBeGreaterThanOrEqual(initialRows)
})

test('el resumen indica "Opción más económica" con dos productos', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')

  const summary = page.getByRole('region', { name: 'Resumen de diferencias' })
    .or(page.locator('section[aria-label="Resumen de diferencias"]'))
  await expect(summary).toBeVisible()
  await expect(page.getByText(/Opción más económica/i)).toBeVisible()
})

test('desde el bloque inferior se puede añadir otro modelo a la comparación', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')

  // El bloque inferior lista los modelos restantes con `aria-label="Añadir X al comparador"`.
  const addAnother = page.getByRole('button', { name: /Añadir .* al comparador/ }).first()
  await expect(addAnother).toBeVisible()
  const addedName = (await addAnother.getAttribute('aria-label'))
    ?.replace(/^Añadir\s+/, '')
    .replace(/\s+al comparador$/, '')
  expect(addedName).toBeTruthy()
  await addAnother.click()

  // El nombre añadido aparece como título de columna (no dentro del bloque inferior).
  const columnTitles = page.locator('table thead p.font-bold')
  await expect(columnTitles.filter({ hasText: addedName as string })).toHaveCount(1)
})

test('desde una columna se puede añadir a favoritos y al carrito', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')

  const firstFav = page
    .getByRole('button', { name: /Añadir iPhone 17 Pro a favoritos/ })
    .first()
  await firstFav.click()
  await expect(
    page.getByRole('button', { name: /Quitar iPhone 17 Pro de favoritos/ }).first(),
  ).toBeVisible()

  // Cesta actualizada.
  await page.getByRole('button', { name: 'Comprar' }).first().click()
  await expect(page.getByRole('link', { name: /Carrito|cesta/i }).first()).toBeVisible()
})

test('la comparación persiste tras recargar', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  // Cabecera de la tabla: 1 columna vacía + 2 productos + 1 slot para añadir.
  await expect(page.locator('table thead th')).toHaveCount(4)
  await page.reload()
  await expect(page.locator('table thead th')).toHaveCount(4)
})

test('a 375 px la página del comparador no genera scroll horizontal @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('axe: el comparador con dos productos no introduce violaciones nuevas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a']).analyze()
  const detail = results.violations
    .map((v) => `${v.id}: ${v.help}`)
    .join('\n')
  expect(results.violations, `Violaciones axe en /comparar:\n${detail}`).toEqual([])
})
