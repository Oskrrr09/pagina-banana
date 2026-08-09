import { expect, test, type Page } from '@playwright/test'
import { ANCHO_DIVISOR, MAXIMO_PROPORCION, MINIMO_CONVERSACION, MINIMO_LISTA } from '../../src/lib/panelDivisor'

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

    // 500 y no 600: con la ficha del visitante montada, el máximo real a 1280
    // es 546, y arrastrar más allá mediría el tope en vez del arrastre.
    await arrastrarHasta(page, 500)
    const despues = await anchoLista(page)

    expect(despues).toBeGreaterThan(antes)
    expect(Math.round(despues)).toBeCloseTo(500, -1)
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

// ============================================================================
// GEOMETRÍA COMPLETA: lista | divisor | conversación | ficha del visitante
//
// El bloqueante que estas pruebas vienen a fijar: `encajarAncho` medía el
// contenedor entero y repartía como si TODO lo que no era lista fuese
// conversación. No lo era. Faltaban por descontar los 9 px del divisor y los
// 288 de `VisitorColumn`, que en `xl` es una tercera columna de ancho fijo.
//
// Con el cálculo anterior, llevando la lista a su máximo:
//
//   1280 → lista 704 · conversación 1280-704-9-288 = 279 px  (mínimo: 360)
//   1440 → lista 792 · conversación 1440-792-9-288 = 351 px  (mínimo: 360)
//
// Y las pruebas seguían verdes porque el fixture montaba `visitante={null}`.
// De ahí que esto NO compruebe la función aritmética: mide los `boundingBox()`
// reales de los tres paneles con la ficha lateral puesta.
// ============================================================================

const ANCHO_VISITANTE = 288

async function cajas(page: Page) {
  const [lista, conversacion, visitante, bloque] = await Promise.all([
    page.locator('[data-lista-conversaciones]').boundingBox(),
    page.locator('[data-columna-conversacion]').boundingBox(),
    page.locator('[data-falso-visitante]').boundingBox(),
    page.locator('[data-bloque-conversacion]').boundingBox(),
  ])
  return {
    lista: lista!.width,
    conversacion: conversacion!.width,
    visitante: visitante!.width,
    bloque: bloque!.width,
  }
}

for (const ancho of [1280, 1440]) {
  test.describe(`layout completo a ${ancho}`, () => {
    test.use({ viewport: { width: ancho, height: 900 } })

    test(`la conversación conserva su mínimo con la lista al máximo a ${ancho}`, async ({ page }) => {
      await page.goto(FIXTURE)

      // Al máximo por las bravas: se arrastra mucho más allá del tope para que
      // sea el propio límite quien pare, no el gesto.
      await arrastrarHasta(page, ancho)
      const m = await cajas(page)

      // 1 · la ficha lateral sigue entera: el arreglo no la sacrifica.
      expect(m.visitante).toBe(ANCHO_VISITANTE)

      // 2 · el bloque medido es el ancho MENOS la ficha.
      expect(Math.round(m.bloque)).toBe(ancho - ANCHO_VISITANTE)

      // 3 · la lista respeta su tope proporcional sobre ese bloque.
      expect(m.lista).toBeLessThanOrEqual(Math.round(m.bloque * MAXIMO_PROPORCION) + 1)

      // 4 · y la conversación mide de verdad su mínimo. Es la aserción que
      //     fallaba: daba 279 y 351.
      expect(m.conversacion).toBeGreaterThanOrEqual(MINIMO_CONVERSACION)

      // 5 · las tres columnas y el divisor suman la ventana: nada desborda.
      expect(Math.round(m.lista + ANCHO_DIVISOR + m.conversacion + m.visitante)).toBe(ancho)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(ancho)
    })

    test(`el máximo anunciado es alcanzable a ${ancho}`, async ({ page }) => {
      await page.goto(FIXTURE)
      const divisor = page.locator('[data-divisor-panel]')

      // `aria-valuemax` no puede prometer un ancho que rompa la conversación:
      // quien navega con teclado llega a él con Fin y se lo encuentra.
      await divisor.focus()
      await page.keyboard.press('End')

      const maximo = Number(await divisor.getAttribute('aria-valuemax'))
      const ahora = Number(await divisor.getAttribute('aria-valuenow'))
      const m = await cajas(page)

      expect(ahora).toBe(maximo)
      expect(Math.round(m.lista)).toBe(maximo)
      expect(m.conversacion).toBeGreaterThanOrEqual(MINIMO_CONVERSACION)

      // Y el mínimo anunciado también se cumple, con Inicio.
      await page.keyboard.press('Home')
      expect(Number(await divisor.getAttribute('aria-valuemin'))).toBe(MINIMO_LISTA)
      expect(Number(await divisor.getAttribute('aria-valuenow'))).toBe(MINIMO_LISTA)
      expect(Math.round((await cajas(page)).lista)).toBe(MINIMO_LISTA)

      // Una flecha desde el mínimo mueve 20 px y no se sale por abajo.
      await page.keyboard.press('ArrowRight')
      expect(Number(await divisor.getAttribute('aria-valuenow'))).toBe(MINIMO_LISTA + 20)
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      expect(Number(await divisor.getAttribute('aria-valuenow'))).toBe(MINIMO_LISTA)
    })
  })
}

// ============================================================================
// Cambio de rama sin recargar.
//
// `PanelConversaciones` elige rama con `matchMedia` en vez de con clases `md:`,
// para no montar la lista dos veces. El precio es que el cambio de tamaño tiene
// que estar atendido: si la geometría se midiera sólo al montar, al pasar de
// móvil a escritorio el divisor aparecería con un contenedor de 0 px y no se
// podría arrastrar hasta recargar.
// ============================================================================

test.describe('cambio de tamaño en caliente', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('de 390 a 1280 el divisor aparece ya medido y arrastrable', async ({ page }) => {
    await page.goto(FIXTURE)
    await expect(page.locator('[data-divisor-panel]')).toHaveCount(0)

    await page.setViewportSize({ width: 1280, height: 900 })

    const divisor = page.locator('[data-divisor-panel]')
    await expect(divisor).toBeVisible()

    // Medido de verdad, no con el contenedor a cero.
    const maximo = Number(await divisor.getAttribute('aria-valuemax'))
    const ahora = Number(await divisor.getAttribute('aria-valuenow'))
    expect(maximo).toBeGreaterThan(MINIMO_LISTA)
    expect(ahora).toBeGreaterThanOrEqual(MINIMO_LISTA)
    expect(ahora).toBeLessThanOrEqual(maximo)

    // Y arrastrable en el acto, sin recargar.
    const antes = await anchoLista(page)
    await arrastrarHasta(page, 700)
    expect(await anchoLista(page)).toBeGreaterThan(antes)
    expect((await cajas(page)).conversacion).toBeGreaterThanOrEqual(MINIMO_CONVERSACION)
  })

  test('de 1280 a 390 sólo queda la rama móvil @all', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(FIXTURE)
    await expect(page.locator('[data-divisor-panel]')).toBeVisible()

    await page.setViewportSize({ width: 390, height: 800 })

    // Ni divisor oculto pero vivo, ni lista duplicada.
    await expect(page.locator('[data-divisor-panel]')).toHaveCount(0)
    await expect(page.locator('[data-lista-conversaciones]')).toHaveCount(0)
    await expect(page.locator('[data-falsa-lista]')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
})
