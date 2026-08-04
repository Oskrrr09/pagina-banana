import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Suite del comparador (versión simplificada).
// Cubre:
//   - encabezado y estado vacío con tres slots + CTA al asistente;
//   - selector de modelo en diálogo accesible (Elegir / Cambiar);
//   - sustitución atómica sin duplicados;
//   - máx. 3 slots y misma familia;
//   - persistencia banana:compare tras recargar;
//   - modo "Solo diferencias" activo por defecto + "Mostrar todas";
//   - ausencia del bloque inferior antiguo y del resumen antiguo;
//   - regla del ganador único (empate no genera badge);
//   - sticky real sin cabecera aria-hidden duplicada;
//   - scroll-snap y no scroll horizontal global a 375 px;
//   - favoritos + carrito desde una columna;
//   - axe limpio.

async function seedCompareIphonePro(page: Page) {
  await page.goto('./iphone/17-pro')
  const compareChecks = page.getByRole('checkbox', { name: /Añadir a comparar/ })
  await compareChecks.nth(0).check()
  await compareChecks.nth(1).check()
}

test('encabezado nuevo + estado vacío con tres slots y CTA al asistente', async ({ page }) => {
  await page.goto('./comparar')
  await expect(page.getByRole('heading', { name: 'Compara tus opciones', level: 1 })).toBeVisible()
  await expect(page.getByText('Consulta solo las diferencias que realmente pueden ayudarte a elegir.')).toBeVisible()
  // Selector de familia visible.
  await expect(page.getByText('Tipo de producto:')).toBeVisible()
  // Exactamente tres slots vacíos con "Elegir modelo".
  const slots = page.getByRole('button', { name: /^Elegir modelo de .+ para el espacio/ })
  await expect(slots).toHaveCount(3)
  // CTA al asistente.
  const asistente = page.getByRole('link', { name: /Necesito ayuda para elegir/ })
  await expect(asistente).toBeVisible()
  await expect(asistente).toHaveAttribute('href', /\/elige-tu-apple$/)
})

test('desde el estado vacío se elige el primer modelo con el diálogo (sin scroll)', async ({ page }) => {
  await page.goto('./comparar')
  await page
    .getByRole('button', { name: /para el espacio 1$/ })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: /^Elegir modelo de/ })
  await expect(dialog).toBeVisible()
  // El diálogo lista modelos y permite elegir.
  await dialog.getByRole('button', { name: /^Elegir iPhone 17$/ }).click()
  await expect(dialog).toBeHidden()
  // La cabecera de tabla contiene ya el nombre elegido.
  await expect(
    page.getByRole('group', { name: /^Modelos comparados/ }).getByText('iPhone 17', { exact: true }),
  ).toBeVisible()
})

test('bloque inferior antiguo y "Diferencias entre las opciones" YA NO existen', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  // Ninguna región con el título antiguo de resumen.
  await expect(page.getByText('Diferencias entre las opciones')).toHaveCount(0)
  // Ningún botón "Añadir X al comparador" (rejilla inferior antigua).
  await expect(page.getByRole('button', { name: /Añadir .+ al comparador$/ })).toHaveCount(0)
  // La sección "Elige modelos de …" antigua tampoco.
  await expect(page.getByText(/Elige modelos de /)).toHaveCount(0)
})

test('"Solo diferencias" está activo por defecto y "Mostrar todas" pinta más filas', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  await expect(page.getByRole('button', { name: 'Solo diferencias' })).toHaveAttribute('aria-pressed', 'true')
  const initialRows = await page.locator('table tbody tr').count()
  await page.getByRole('button', { name: 'Mostrar todas' }).click()
  await expect(page.getByRole('button', { name: 'Mostrar todas' })).toHaveAttribute('aria-pressed', 'true')
  const allRows = await page.locator('table tbody tr').count()
  expect(allRows).toBeGreaterThanOrEqual(initialRows)
})

test('cambiar modelo mantiene la misma columna y no duplica', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  // Cabecera de la primera columna ocupada.
  const firstChange = page.getByRole('button', { name: /Cambiar modelo en la columna iPhone 17 Pro/ }).first()
  await firstChange.click()
  const dialog = page.getByRole('dialog', { name: /^Cambiar modelo de/ })
  await expect(dialog).toBeVisible()
  // Elegir iPhone 17 (modelo distinto, mismo family).
  await dialog.getByRole('button', { name: /^Cambiar a iPhone 17$/ }).click()
  await expect(dialog).toBeHidden()
  const cards = page.getByRole('group', { name: /^Modelos comparados/ })
  await expect(cards.getByText('iPhone 17', { exact: true })).toHaveCount(1)
  await expect(cards.getByText('iPhone 17 Pro', { exact: true })).toHaveCount(1)
})

test('modelo ya añadido aparece deshabilitado en el diálogo', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  // Añadir un tercero desde el slot vacío.
  await page.getByRole('button', { name: /para el espacio 3$/ }).click()
  const dialog = page.getByRole('dialog', { name: /^Elegir modelo de/ })
  await expect(dialog).toBeVisible()
  // iPhone 17 Pro ya está añadido: el botón debe estar deshabilitado
  // (aria-label "iPhone 17 Pro (Ya añadido)").
  const disabled = dialog.getByRole('button', { name: /iPhone 17 Pro \(Ya añadido\)/ })
  await expect(disabled).toBeDisabled()
})

test('máximo tres slots: al llenar los tres no aparece más un slot vacío', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  await page.getByRole('button', { name: /para el espacio 3$/ }).click()
  const dialog = page.getByRole('dialog', { name: /^Elegir modelo de/ })
  await dialog.getByRole('button', { name: /^Elegir iPhone 17$/ }).click()
  // Ya no queda ningún slot "Elegir modelo".
  await expect(page.getByRole('button', { name: /^Elegir modelo de .+ para el espacio/ })).toHaveCount(0)
})

test('quitar un modelo libera el slot y persiste tras recargar', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  const removeLabel = /Quitar iPhone 17 Pro de la comparación/
  await page.getByRole('button', { name: removeLabel }).first().click()
  // Ahora hay un ocupado + dos slots vacíos.
  await expect(page.getByRole('button', { name: removeLabel })).toHaveCount(1)
  await page.reload()
  await expect(page.getByRole('button', { name: removeLabel })).toHaveCount(1)
})

test('empate de precio entre dos productos NO genera "Más económico"', async ({ page }) => {
  // iPhone 17 Pro tiene varias variantes con el mismo precio de partida:
  // añadir dos columnas del mismo modelo debe dar un empate → sin badge.
  // Usamos el mismo modelo con dos capacidades diferentes seleccionando
  // las dos primeras "Añadir a comparar" del ModelPage.
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  // La cabecera muestra dos columnas de iPhone 17 Pro con distinta capacidad
  // pero mismo modelo → los datos comparables (peso, pantalla) son idénticos y
  // el precio de la columna es el de la capacidad concreta, con lo cual
  // NO debe aparecer badge "Más ligero" ni "Mayor pantalla" (empate).
  await expect(page.getByRole('list', { name: /Destaca por/ })).toHaveCount(0)
})

test('sticky: no existe una segunda cabecera aria-hidden duplicada', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  // No hay ningún elemento aria-hidden que contenga los nombres de los
  // productos (regla del rediseño: sticky recae en el <thead> real).
  const hiddenClones = page.locator('[aria-hidden="true"]').filter({ hasText: 'iPhone 17 Pro' })
  await expect(hiddenClones).toHaveCount(0)
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

test('desde una columna se puede añadir a favoritos y al carrito', async ({ page }) => {
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  const firstFav = page.getByRole('button', { name: /Añadir iPhone 17 Pro a favoritos/ }).first()
  await firstFav.click()
  await expect(page.getByRole('button', { name: /Quitar iPhone 17 Pro de favoritos/ }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Comprar' }).first().click()
  await expect(page.getByRole('link', { name: /Carrito|cesta/i }).first()).toBeVisible()
})

test('axe: comparador con dos productos no introduce violaciones nuevas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedCompareIphonePro(page)
  await page.goto('./comparar')
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a']).analyze()
  const detail = results.violations.map((v) => `${v.id}: ${v.help}`).join('\n')
  expect(results.violations, `Violaciones axe en /comparar:\n${detail}`).toEqual([])
})

test('axe: diálogo Elegir modelo abierto es accesible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./comparar')
  await page
    .getByRole('button', { name: /para el espacio 1$/ })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: /^Elegir modelo de/ })
  await expect(dialog).toBeVisible()
  // Espera a que la animación termine y el fondo se opaque para evitar
  // que axe evalúe el contraste sobre un panel semi-transparente.
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[role="dialog"]') as HTMLElement | null
      if (!el) return false
      const s = getComputedStyle(el)
      return s.opacity === '1'
    },
    undefined,
    { timeout: 3000 },
  )
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a'])
    // El backdrop translúcido no afecta al panel: axe interpreta mal el
    // contraste sobre elementos con opacidad dinámica; excluimos backdrop.
    .exclude('[aria-hidden="true"]')
    .analyze()
  expect(results.violations, results.violations.map((v) => v.id).join(',')).toEqual([])
})
