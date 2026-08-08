import { expect, test } from '@playwright/test'

// ============================================================================
// El distintivo de tienda se actualiza solo.
//
// El estado depende de la hora, así que calcularlo una vez al montar dejaría la
// pantalla mintiendo: quien abriera `/tiendas` a las 09:25 y la dejara abierta
// seguiría viendo «Cerrado» a las 09:35.
//
// El reloj lo controla la prueba con `page.clock`, así que no hay esperas
// reales: se salta de un lado a otro del umbral y se comprueba el texto.
// ============================================================================

const FIXTURE = '/pagina-banana/tests/e2e-prefs/tiendas-vivo-fixture.html'

// La tienda del fixture abre de 10:00 a 20:00 de lunes a viernes.
// 2026-01-12 es lunes. Canarias va en UTC en enero.
const distintivo = '[data-store-status]'

test('cerrado → abre pronto al cruzar los 30 minutos', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-12T09:25:00Z') })
  await page.goto(FIXTURE)

  await expect(page.locator(distintivo)).toHaveAttribute('data-store-status', 'cerrada')

  // Se guarda el nodo de antes: si React remontara el componente en vez de
  // volver a pintarlo, este quedaría desconectado del documento.
  const nodoAntes = await page.locator(distintivo).elementHandle()

  // Cinco minutos más: entra en la ventana de aviso.
  await page.clock.fastForward('05:00')
  await expect(page.locator(distintivo)).toHaveAttribute('data-store-status', 'abre-pronto')
  await expect(page.locator(distintivo)).toHaveText(/Abre pronto/)

  // Y lo ha hecho el MISMO nodo, sin desmontarse.
  expect(await nodoAntes!.evaluate((el) => el.isConnected), 'el distintivo se remontó').toBe(true)
  expect(await nodoAntes!.evaluate((el) => el.getAttribute('data-store-status'))).toBe('abre-pronto')
})

test('abre pronto → abierto ahora', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-12T09:45:00Z') })
  await page.goto(FIXTURE)
  await expect(page.locator(distintivo)).toHaveAttribute('data-store-status', 'abre-pronto')

  await page.clock.fastForward('15:00')
  await expect(page.locator(distintivo)).toHaveAttribute('data-store-status', 'abierta')
  await expect(page.locator(distintivo)).toHaveText(/Abierto ahora/)
})

test('abierto ahora → cierra pronto', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-12T19:25:00Z') })
  await page.goto(FIXTURE)
  await expect(page.locator(distintivo)).toHaveAttribute('data-store-status', 'abierta')

  await page.clock.fastForward('05:00')
  await expect(page.locator(distintivo)).toHaveAttribute('data-store-status', 'cierra-pronto')
  await expect(page.locator(distintivo)).toHaveText(/Cierra pronto/)
})

test('cierra pronto → cerrado', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-12T19:55:00Z') })
  await page.goto(FIXTURE)
  await expect(page.locator(distintivo)).toHaveAttribute('data-store-status', 'cierra-pronto')

  await page.clock.fastForward('05:00')
  await expect(page.locator(distintivo)).toHaveAttribute('data-store-status', 'cerrada')
  await expect(page.locator(distintivo)).toHaveText(/Cerrado/)
})

test('el aviso se lee, no sólo se ve', async ({ page }) => {
  // El color ámbar no puede ser la única señal: quien no lo distinga tiene que
  // poder leer en qué estado está.
  await page.clock.install({ time: new Date('2026-01-12T09:40:00Z') })
  await page.goto(FIXTURE)

  const badge = page.locator(distintivo)
  await expect(badge).toHaveText(/Abre pronto/)
  // Y el punto de color es decorativo para el lector de pantalla.
  await expect(badge.locator('span[aria-hidden="true"]')).toHaveCount(1)
})
