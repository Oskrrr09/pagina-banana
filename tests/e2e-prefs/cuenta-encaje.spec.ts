import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// `/cuenta` cabe en la pantalla.
//
// El fallo: el menú de apartados es un `flex` sin envolver, así que su ancho
// mínimo es la SUMA de sus siete chips —1088 px—. Cuelga de una celda de grid,
// que tiene `min-width: auto` y no baja de su contenido, de modo que la columna
// se estiraba a esa medida y arrastraba los campos fuera de la pantalla: 789 px
// de desbordamiento a 320. Y el `overflow-x-auto` del menú nunca llegaba a
// actuar —su scroll interno medía 0—, porque nadie le ponía un límite: en vez
// de desplazarse dentro de su caja, empujaba la página.
//
// POR QUÉ NO VIVE EN `tests/e2e/anchos.spec.ts`
//
// Aquella barre la web sin sesión, y `/cuenta` sin sesión no llega a pintar el
// formulario: rebota a identificarse o enseña el aviso de configuración. Sin
// formulario no hay nada que medir. Aquí se inyecta la sesión.
//
// Y no vive tampoco en `cuenta-fixture`: ese monta sin hoja de estilos y sin
// `<meta viewport>`, así que medía a 980 px y sin CSS. Con el fallo delante daba
// 0 px de desbordamiento. Ver `cuenta-layout-fixture.tsx`.
// ============================================================================

const FIXTURE = '/pagina-banana/tests/e2e-prefs/cuenta-layout-fixture.html'
const TOLERANCIA = 2

// 320 px es el ancho útil más estrecho que se sigue usando (iPhone SE), y es
// donde el fallo era mayor.
test.use({ viewport: { width: 320, height: 800 }, isMobile: true, hasTouch: true })

/** Desbordamiento real, con la contención del documento apartada un instante. */
async function desbordamiento(page: Page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const guardado = [de.style.overflowX, document.body.style.overflowX]
    de.style.overflowX = 'visible'
    document.body.style.overflowX = 'visible'
    const medida = de.scrollWidth - de.clientWidth
    de.style.overflowX = guardado[0]
    document.body.style.overflowX = guardado[1]
    return medida
  })
}

test('la pantalla no se desplaza de lado a 320 px', async ({ page }) => {
  await page.goto(FIXTURE)
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()

  // El fixture debe medir de verdad: sin `<meta viewport>` el navegador asume
  // 980 px y la prueba pasaría con el fallo delante.
  const ancho = await page.evaluate(() => document.documentElement.clientWidth)
  expect(ancho, 'el fixture no está midiendo a 320 px').toBe(320)

  expect(await desbordamiento(page)).toBeLessThanOrEqual(TOLERANCIA)
})

test('el menú de apartados se desplaza DENTRO de su caja', async ({ page }) => {
  await page.goto(FIXTURE)
  const menu = page.locator('nav[aria-label="Apartados de mi cuenta"] ul')
  await expect(menu).toBeVisible()

  const m = await menu.evaluate((el) => ({
    ancho: el.getBoundingClientRect().width,
    scrollInterno: el.scrollWidth - el.clientWidth,
  }))

  // Cabe en la pantalla…
  expect(m.ancho, 'el menú no debería ser más ancho que el viewport').toBeLessThanOrEqual(320)
  // …y sus siete chips se recorren desplazándolo, que es para lo que estaba
  // puesto el `overflow-x-auto`. Antes esto medía 0 y la página se estiraba.
  expect(m.scrollInterno, 'el menú debería tener scroll horizontal propio').toBeGreaterThan(100)
})

test('los campos del formulario quedan enteros dentro de la pantalla', async ({ page }) => {
  await page.goto(FIXTURE)

  const campos = page.locator('input.field')
  await expect(campos.first()).toBeVisible()

  const salidos = await campos.evaluateAll(
    (els, vw) =>
      els
        .map((el) => ({ etiqueta: el.getAttribute('name') ?? el.id, derecha: el.getBoundingClientRect().right }))
        .filter((c) => c.derecha > vw + 2),
    320,
  )

  expect(salidos, `campos cortados por la derecha: ${JSON.stringify(salidos)}`).toEqual([])
})
