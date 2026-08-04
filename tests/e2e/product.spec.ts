import { test, expect, type Page } from '@playwright/test'

// Cazamos errores de React en consola. Ignoramos advertencias conocidas de
// motion+React 18 (`fetchPriority` prop) que no son regresiones del prototipo
// y no bloquean el uso — sólo bloqueamos errores nuevos, especialmente los
// relativos a las reglas de hooks.
const IGNORED_ERROR = /fetchPriority|fetchpriority/i

function captureConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !IGNORED_ERROR.test(msg.text())) errors.push(msg.text())
  })
  page.on('pageerror', (err) => {
    if (!IGNORED_ERROR.test(err.message)) errors.push(err.message)
  })
  return errors
}

test('cambiar color y capacidad conserva /pagina-banana/ en la URL', async ({ page }) => {
  const errors = captureConsoleErrors(page)
  await page.goto('./iphone/17-pro/256gb-plata')

  // Cambio de color: la URL debe pasar a otro color pero mantener basename.
  await page.getByRole('button', { name: /Ver en Naranja cósmico/ }).click()
  await expect(page).toHaveURL(/\/pagina-banana\/iphone\/17-pro\/256gb-naranja$/)

  // Cambio de capacidad: mismo color, otra capacidad, mismo basename.
  await page
    .getByRole('button', { name: /^512GB/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/pagina-banana\/iphone\/17-pro\/512gb-naranja$/)

  expect(errors, `Errores de consola:\n${errors.join('\n')}`).toEqual([])
})

test('recargar una ruta profunda mantiene la misma variante', async ({ page }) => {
  await page.goto('./iphone/17-pro/512gb-plata')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('iPhone 17 Pro')
  await page.reload()
  await expect(page).toHaveURL(/\/pagina-banana\/iphone\/17-pro\/512gb-plata$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('iPhone 17 Pro')
})

test('Apple Watch Series 11: cambiar tamaño y GPS/Cellular preserva la selección', async ({ page }) => {
  const errors = captureConsoleErrors(page)
  await page.goto('./apple-watch/watch-series-11/42-mm-gps-alum-jet-black')

  // Cambiar el tamaño a 46 mm — la conectividad "GPS" debe preservarse.
  await page.getByRole('button', { name: /Pantalla de 46 mm/ }).click()
  await expect(page).toHaveURL(/\/apple-watch\/watch-series-11\/46-mm-gps-alum-jet-black$/)

  // Cambiar a la variante con Cellular manteniendo el tamaño. Las chips
  // muestran "GPS" y "GPS + Cellular" (el prefijo de tamaño se retira).
  await page.getByRole('button', { name: /^GPS \+ Cellular/ }).click()
  await expect(page).toHaveURL(/\/apple-watch\/watch-series-11\/46-mm-gps-cellular-alum-jet-black$/)

  // Volver a 42 mm: se conserva "GPS + Cellular".
  await page.getByRole('button', { name: /Pantalla de 42 mm/ }).click()
  await expect(page).toHaveURL(/\/apple-watch\/watch-series-11\/42-mm-gps-cellular-alum-jet-black$/)

  expect(errors, `Errores de consola:\n${errors.join('\n')}`).toEqual([])
})

test('navegar entre pasos del checkout no genera errores de hooks en consola', async ({ page }) => {
  const errors = captureConsoleErrors(page)
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
  await page.getByLabel('Nombre y apellidos').fill('Elena R.')
  await page.getByLabel('Email').fill('elena@example.test')
  await page.getByLabel('Dirección').fill('Calle Mayor 1')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/\/checkout\/2$/)
  // Volver al paso 1 y avanzar de nuevo — el orden de hooks debe mantenerse.
  await page.goBack()
  await expect(page).toHaveURL(/\/checkout\/1$/)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/\/checkout\/2$/)
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page).toHaveURL(/\/checkout\/3$/, { timeout: 5_000 })

  const hookError = errors.find((e) => /Rendered (more|fewer) hooks|Rules of Hooks/i.test(e))
  expect(hookError, `Error de hooks detectado: ${hookError}`).toBeUndefined()
})
