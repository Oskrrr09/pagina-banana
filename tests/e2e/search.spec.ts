import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Suite del buscador semántico y agrupado (§4.4bis). Cubre página /buscar,
// autocompletado del Header (escritorio y móvil) y accesibilidad axe.

async function search(page: Page, q: string) {
  await page.goto(`./buscar?q=${encodeURIComponent(q)}`)
}

async function sectionTexts(page: Page): Promise<string[]> {
  return await page.locator('h2').allTextContents()
}

// ---------------------------- /buscar --------------------------------------

test('input se sincroniza con el parámetro q', async ({ page }) => {
  await search(page, 'iPhone')
  await expect(page.getByTestId('search-input')).toHaveValue('iPhone')
  await search(page, 'Mac')
  await expect(page.getByTestId('search-input')).toHaveValue('Mac')
  await expect(page.getByText(/Resultados para/)).toContainText('Mac')
})

test('accesorios en la portada abren /buscar con el término correcto', async ({ page }) => {
  await page.goto('./')
  const audio = page.getByRole('link', { name: /Audio y sonido/ }).first()
  const href = await audio.getAttribute('href')
  expect(href).toContain('/buscar?q=audio')
})

test('AirPods: primero Dispositivos Apple, después relacionados, accesorios y ayuda', async ({ page }) => {
  await search(page, 'AirPods')
  const headings = await sectionTexts(page)
  const joined = headings.join('|')
  // Coincidencia principal debe existir para AirPods (familia exacta).
  expect(joined).toContain('Coincidencia principal')
  expect(joined).toContain('Dispositivos Apple')
  // Índices relativos: Dispositivos antes que Accesorios y Ayuda.
  const iDevices = headings.findIndex((h) => h.startsWith('Dispositivos Apple'))
  const iApple = headings.findIndex((h) => h.startsWith('Accesorios Apple'))
  const iCompat = headings.findIndex((h) => h.startsWith('Accesorios compatibles'))
  const iHelp = headings.findIndex((h) => h.startsWith('Ayuda'))
  if (iApple !== -1) expect(iDevices).toBeLessThan(iApple)
  if (iCompat !== -1) expect(iDevices).toBeLessThan(iCompat)
  if (iApple !== -1 && iCompat !== -1) expect(iApple).toBeLessThan(iCompat)
  if (iHelp !== -1) expect(iDevices).toBeLessThan(iHelp)
})

test('AirPods: sin IDs duplicados entre secciones', async ({ page }) => {
  await search(page, 'AirPods')
  // Cada tarjeta CompactSearchCard/ProductCard tiene texto único. Verificamos
  // que ningún nombre de item aparece más de una vez.
  const cards = await page.locator('h3, [class*="text-ink"][class*="font-semibold"]').allTextContents()
  // Filtramos strings poco informativos.
  const names = cards.filter((s) => s.length > 2 && s.length < 60)
  const dupes = names.filter((n, i) => names.indexOf(n) !== i)
  // Familia AirPods y modelo "AirPods Pro" NO son iguales — no debería haber
  // duplicados. Pero puede haber palabras compartidas. Toleramos duplicados
  // solo si vienen de encabezados de sección genéricos.
  expect(dupes.filter((d) => !['AirPods'].includes(d)).length).toBeLessThanOrEqual(0)
})

test('funda AirPods: intención accesorio → accesorios antes que dispositivos', async ({ page }) => {
  await search(page, 'funda AirPods')
  const headings = await sectionTexts(page)
  const iApple = headings.findIndex((h) => h.startsWith('Accesorios Apple'))
  const iCompat = headings.findIndex((h) => h.startsWith('Accesorios compatibles'))
  const iDevices = headings.findIndex((h) => h.startsWith('Dispositivos Apple'))
  // Al menos una de las dos secciones de accesorios debe existir y aparecer
  // antes que los dispositivos.
  const firstAcc = Math.min(...[iApple, iCompat].filter((n) => n !== -1))
  expect(firstAcc).toBeGreaterThanOrEqual(0)
  if (iDevices !== -1) expect(firstAcc).toBeLessThan(iDevices)
})

test('funda AirPods: contenido demostrativo etiquetado, sin CTA Comprar', async ({ page }) => {
  await search(page, 'funda AirPods')
  await expect(page.getByText('Contenido demostrativo').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Añadir al carrito/ })).toHaveCount(0)
})

test('cargador: accesorios Apple antes que compatibles', async ({ page }) => {
  await search(page, 'cargador')
  const headings = await sectionTexts(page)
  const iApple = headings.findIndex((h) => h.startsWith('Accesorios Apple'))
  const iCompat = headings.findIndex((h) => h.startsWith('Accesorios compatibles'))
  if (iApple !== -1 && iCompat !== -1) expect(iApple).toBeLessThan(iCompat)
  // No aparecen dispositivos aleatorios cuyo tagline mencione batería o carga.
  expect(headings.filter((h) => h.startsWith('Dispositivos Apple')).length).toBe(0)
})

test('cascos: aparecen AirPods como dispositivo y auriculares relacionados', async ({ page }) => {
  await search(page, 'cascos')
  const headings = await sectionTexts(page)
  expect(headings.some((h) => h.startsWith('Dispositivos Apple'))).toBe(true)
  expect(headings.some((h) => h.startsWith('Productos relacionados'))).toBe(true)
  await expect(page.getByText('AirPods').first()).toBeVisible()
})

test('air pods equivale a airpods', async ({ page }) => {
  await search(page, 'air pods')
  await expect(page.getByText(/Coincidencia principal|Dispositivos Apple/).first()).toBeVisible()
  await expect(page.getByText('AirPods').first()).toBeVisible()
})

test('airpds sugiere corrección y muestra AirPods', async ({ page }) => {
  await search(page, 'airpds')
  await expect(page.getByText(/Quizá querías decir/).first()).toBeVisible()
  await expect(page.getByText('AirPods').first()).toBeVisible()
})

test('consulta inexistente: estado vacío con categorías, asistente y soporte', async ({ page }) => {
  await search(page, 'zxqwvbn')
  await expect(page.getByText(/No hemos encontrado resultados/)).toBeVisible()
  // Los accesos a categorías aparecen tanto en el nav superior como en el
  // estado vacío. Verificamos que al menos hay 2 (nav + estado vacío).
  const iphoneLinks = page.getByRole('link', { name: 'iPhone', exact: true })
  expect(await iphoneLinks.count()).toBeGreaterThanOrEqual(2)
  await expect(page.getByRole('link', { name: /Prueba el asistente/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ir al centro de soporte/ })).toBeVisible()
})

test('URL: q se mantiene y recarga preserva la consulta', async ({ page }) => {
  await search(page, 'Mac')
  await expect(page).toHaveURL(/[?&]q=Mac/)
  await page.reload()
  await expect(page.getByTestId('search-input')).toHaveValue('Mac')
})

test('URL: back/forward sincronizan input y resultados', async ({ page }) => {
  await search(page, 'iPhone')
  await search(page, 'iPad')
  await page.goBack()
  await expect(page.getByTestId('search-input')).toHaveValue('iPhone')
  await page.goForward()
  await expect(page.getByTestId('search-input')).toHaveValue('iPad')
})

// ---------------------------- Header autocompletado -------------------------

async function openDesktopSearch(page: Page) {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('./')
  await page.getByRole('button', { name: 'Buscar', exact: true }).first().click()
}

test('Header escritorio: escribir muestra grupos, no todo el catálogo', async ({ page }) => {
  await openDesktopSearch(page)
  const input = page.locator('[data-testid="header-search-input"]:visible')
  await input.fill('AirPods')
  await expect(page.getByRole('listbox', { name: /Sugerencias/ })).toBeVisible()
  const listTexts = (await page.getByRole('listbox').textContent()) ?? ''
  expect(listTexts).toContain('Dispositivos Apple')
  // Cantidad razonable de sugerencias — no todo el catálogo.
  const options = await page.getByRole('option').count()
  expect(options).toBeGreaterThan(0)
  expect(options).toBeLessThanOrEqual(20)
})

test('Header escritorio: flecha abajo + Enter navega a la primera sugerencia', async ({ page }) => {
  await openDesktopSearch(page)
  const input = page.locator('[data-testid="header-search-input"]:visible')
  await input.fill('AirPods')
  await expect(page.getByRole('option').first()).toBeVisible()
  await input.press('ArrowDown')
  await input.press('Enter')
  // Puede navegar a /airpods o a /buscar; en cualquier caso salimos de "/"
  // vacío.
  await expect(page).not.toHaveURL(/\/$/)
})

test('Header escritorio: Escape cierra y devuelve el foco a la lupa', async ({ page }) => {
  await openDesktopSearch(page)
  const searchBtn = page.getByRole('button', { name: 'Buscar', exact: true }).first()
  const input = page.locator('[data-testid="header-search-input"]:visible')
  await input.fill('Mac')
  await input.press('Escape')
  await expect(page.locator('[data-testid="header-search-input"]:visible')).toHaveCount(0)
  await expect(searchBtn).toBeFocused()
})

test('Header escritorio: "Ver todos los resultados" navega a /buscar', async ({ page }) => {
  await openDesktopSearch(page)
  const input = page.locator('[data-testid="header-search-input"]:visible')
  await input.fill('iPhone')
  await page.getByRole('button', { name: /Ver todos los resultados/ }).click()
  await expect(page).toHaveURL(/\/buscar\?q=iPhone/)
})

test('Header móvil: overlay usa mismo motor y no genera scroll de fondo @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  await page.getByRole('button', { name: 'Buscar', exact: true }).first().click()
  const input = page.locator('[data-testid="header-search-input"]:visible')
  await input.fill('AirPods')
  await expect(page.getByRole('listbox', { name: /Sugerencias/ })).toBeVisible()
  // El body no debe generar scroll horizontal.
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflowX).toBeLessThanOrEqual(1)
})

// ---------------------------- Accesibilidad ---------------------------------

test('axe: /buscar?q=AirPods sin violaciones críticas', async ({ page }) => {
  await search(page, 'AirPods')
  const result = await new AxeBuilder({ page })
    .exclude('[aria-hidden="true"]')
    .analyze()
  expect(result.violations).toEqual([])
})

test('axe: /buscar sin resultados sin violaciones críticas', async ({ page }) => {
  await search(page, 'zxqwvbn')
  const result = await new AxeBuilder({ page })
    .exclude('[aria-hidden="true"]')
    .analyze()
  expect(result.violations).toEqual([])
})
