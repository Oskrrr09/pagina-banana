import { expect, test, type Page } from '@playwright/test'
import { MINIMO_CONVERSACION, MINIMO_LISTA } from '../../src/lib/panelDivisor'

// ============================================================================
// El divisor del panel de agentes.
//
// La lista era `w-80 shrink-0`: 320 px que no cedían nunca, así que en una
// ventana de 900 la conversación se quedaba con 580 y en una de 700 con 380.
// `tests/unit/panel-divisor.test.ts` cubre la aritmética de los límites; esto
// cubre que arrastrar y el teclado los apliquen de verdad.
// ============================================================================

const FIXTURE = '/pagina-banana/tests/e2e-agent/divisor-fixture.html'

async function anchoLista(page: Page) {
  return (await page.locator('[data-lista-conversaciones]').boundingBox())!.width
}

async function arrastrarHasta(page: Page, x: number) {
  const divisor = page.locator('[data-divisor-panel]')
  const caja = (await divisor.boundingBox())!
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
  await page.mouse.down()
  await page.mouse.move(x, caja.y + caja.height / 2, { steps: 8 })
  await page.mouse.up()
}

test.describe('escritorio', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('arrastrar el divisor cambia el ancho de la lista', async ({ page }) => {
    await page.goto(FIXTURE)
    const antes = await anchoLista(page)

    await arrastrarHasta(page, 600)
    const despues = await anchoLista(page)

    expect(despues).toBeGreaterThan(antes)
    expect(Math.round(despues)).toBeCloseTo(600, -1)
  })

  test('no se puede estrangular la lista', async ({ page }) => {
    await page.goto(FIXTURE)
    await arrastrarHasta(page, 20)
    expect(await anchoLista(page)).toBeGreaterThanOrEqual(MINIMO_LISTA - 1)
  })

  test('no se puede estrangular la conversación', async ({ page }) => {
    await page.goto(FIXTURE)
    await arrastrarHasta(page, 1270)

    const lista = await anchoLista(page)
    const conversacion = (await page.locator('[data-falsa-conversacion]').boundingBox())!.width
    expect(conversacion).toBeGreaterThanOrEqual(MINIMO_CONVERSACION - 1)
    expect(lista).toBeLessThanOrEqual(1280 * 0.55 + 1)
    // Y sigue viéndose y siendo utilizable, que es de lo que se trata.
    await expect(page.locator('[data-falsa-conversacion]')).toBeVisible()
  })

  test('se ajusta con el teclado y se anuncia', async ({ page }) => {
    await page.goto(FIXTURE)
    const divisor = page.locator('[data-divisor-panel]')

    await expect(divisor).toHaveAttribute('role', 'separator')
    await expect(divisor).toHaveAttribute('aria-orientation', 'vertical')

    await divisor.focus()
    const antes = await anchoLista(page)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    const despues = await anchoLista(page)

    expect(despues).toBeGreaterThan(antes)
    await expect(divisor).toHaveAttribute('aria-valuenow', String(Math.round(despues)))
  })

  test('el ancho sobrevive a recargar', async ({ page }) => {
    await page.goto(FIXTURE)
    await arrastrarHasta(page, 560)
    const elegido = await anchoLista(page)

    await page.reload()
    expect(Math.round(await anchoLista(page))).toBeCloseTo(Math.round(elegido), -1)
  })

  test('arrastrar no desborda el documento', async ({ page }) => {
    await page.goto(FIXTURE)
    await arrastrarHasta(page, 1270)
    const desborde = await page.evaluate(() => {
      const de = document.documentElement
      const g = [de.style.overflowX, document.body.style.overflowX]
      de.style.overflowX = 'visible'
      document.body.style.overflowX = 'visible'
      const m = de.scrollWidth - de.clientWidth
      de.style.overflowX = g[0]
      document.body.style.overflowX = g[1]
      return m
    })
    expect(desborde).toBeLessThanOrEqual(2)
  })
})

test.describe('móvil', () => {
  test.use({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true })

  test('no enseña dos paneles minúsculos: uno u otro', async ({ page }) => {
    await page.goto(FIXTURE)

    // Sin conversación abierta: sólo la lista, a pantalla completa.
    await expect(page.locator('[data-falsa-lista]')).toBeVisible()
    await expect(page.locator('[data-divisor-panel]')).not.toBeVisible()

    // Al elegir una, la conversación ocupa la pantalla y hay forma de volver.
    await page.getByRole('button', { name: 'Conversación de prueba' }).click()
    await expect(page.locator('[data-falsa-conversacion]')).toBeVisible()
    const volver = page.locator('[data-volver-a-lista]')
    await expect(volver).toBeVisible()

    const caja = (await volver.boundingBox())!
    expect(caja.height, 'el botón de volver tiene que poder pulsarse').toBeGreaterThanOrEqual(44)

    await volver.click()
    await expect(page.locator('[data-falsa-lista]')).toBeVisible()
  })
})
