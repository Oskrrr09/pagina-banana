import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// LA TARJETA WEB VUELVE A SER LA DE ANTES DE LA ADAPTACIÓN NATIVA.
//
// QUÉ PASÓ
//
// `f3143d85` —«feat(app): Tienda deja el catálogo a un toque»— tocó la tarjeta
// de producto cuando todavía era una sola, compartida por la web y por la app.
// Su propio mensaje lo dice: «La tarjeta de producto gana el botón de comparar
// que antes solo existía en la ficha, y el favorito pasa de 36 a 44 px de
// lado.» Ninguna de las dos cosas se pidió para la web.
//
// Cuando después se separaron `ProductCardWeb` y `ProductCardApp`, la web nació
// conservando el estado de ESE momento, así que la frontera llegó tarde para
// estos dos detalles. Es lo único que la auditoría contra
// `5201a44f64185fc962c203d55bb468f77196c5ff` —el padre del primer commit
// nativo— encontró todavía presente.
//
// QUÉ SE RESTAURA, Y QUÉ NO
//
// Se restaura la COMPOSICIÓN: la tarjeta web termina en su distintivo de precio
// demostrativo, como entonces, y el favorito recupera su disco de 36 px a 20 px
// del borde.
//
// NO se restaura el tamaño del área pulsable. En la web móvil, 36 px es un
// objetivo táctil por debajo del mínimo, y perderlo sería una regresión de
// accesibilidad real y no una fidelidad. Por eso se separan las dos cosas: el
// disco que se ve mide 36, el área que responde mide 44. Sin `isNativeApp`, sin
// medir anchos en JS y sin media queries: el botón es la caja de 44 y el disco
// vive centrado dentro.
//
// EL COMPARADOR NO SE TOCA. Sólo deja de poder añadirse desde cada tarjeta del
// catálogo, que es exactamente el contrato anterior a la app. Sus entradas
// legítimas —la ficha de modelo, el selector de `/comparar` y los enlaces del
// listado— siguen ahí.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

const sinAvisoDeTienda = (page: Page) =>
  page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))

/** La geometría del favorito: lo que se ve y lo que responde al dedo. */
async function favorito(page: Page) {
  return page.evaluate(() => {
    const tarjeta = document.querySelector('[data-product-card-surface="web"]')
    const boton = tarjeta?.querySelector('button[aria-label*="favoritos"]') as HTMLElement | null
    const disco = boton?.querySelector('[data-fav-superficie]') as HTMLElement | null
    if (!tarjeta || !boton || !disco) return null
    const rt = tarjeta.getBoundingClientRect()
    const rb = boton.getBoundingClientRect()
    const rd = disco.getBoundingClientRect()
    return {
      // El área que responde al toque.
      pulsable: { ancho: Math.round(rb.width), alto: Math.round(rb.height) },
      // El disco que se ve, y a qué distancia queda del borde de la tarjeta.
      visual: { ancho: Math.round(rd.width), alto: Math.round(rd.height) },
      desdeArriba: Math.round(rd.top - rt.top),
      desdeLaDerecha: Math.round(rt.right - rd.right),
    }
  })
}

// ---------------------------------------------------------------------------
// WEB — la composición vuelve a la de antes
// ---------------------------------------------------------------------------

for (const familia of ['/iphone', '/mac'] as const) {
  test.describe(`la tarjeta web de ${familia}`, () => {
    test.use({ viewport: { width: 1280, height: 900 } })

    test('no ofrece añadir al comparador desde el catálogo', async ({ page }) => {
      await sinAvisoDeTienda(page)
      await page.goto(`.${familia}`)
      const tarjetas = page.locator('[data-product-card-surface="web"]')
      await expect(tarjetas.first()).toBeVisible()

      const dentro = await page.evaluate(() =>
        [...document.querySelectorAll('[data-product-card-surface="web"]')].map((c) => ({
          botones: [...c.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') ?? '').trim()),
          texto: (c as HTMLElement).innerText,
        })),
      )
      for (const c of dentro) {
        expect(
          c.botones.filter((b) => /omparar/i.test(b)),
          'ningún control de comparar dentro de la tarjeta',
        ).toEqual([])
        expect(c.texto, 'ni su rótulo').not.toMatch(/Añadir a comparar|En el comparador/)
        expect(c.texto, 'ni el aviso de comparador lleno').not.toMatch(/admite 3 modelos/)
      }
    })

    test('sigue llevando a la ficha, con su favorito, su precio y sus ofertas', async ({ page }) => {
      await sinAvisoDeTienda(page)
      await page.goto(`.${familia}`)
      const tarjeta = page.locator('[data-product-card-surface="web"]').first()

      await expect(tarjeta.locator('a[href]')).toHaveCount(1)
      await expect(tarjeta.getByRole('heading', { level: 3 })).toBeVisible()
      await expect(tarjeta.getByText(/€/)).not.toHaveCount(0)
      await expect(tarjeta.getByText(/PRECIO DEMOSTRATIVO/i)).toBeVisible()

      // El favorito sigue siendo un interruptor de verdad.
      const corazon = tarjeta.locator('button[aria-label*="favoritos"]')
      await expect(corazon).toHaveAttribute('aria-pressed', 'false')
      await corazon.click()
      await expect(corazon).toHaveAttribute('aria-pressed', 'true')
    })
  })
}

test.describe('el favorito de la tarjeta web', () => {
  for (const [ancho, alto] of [
    [1440, 900],
    [1280, 900],
    [390, 844],
    [320, 568],
  ] as const) {
    test(`a ${ancho} px se ve como antes y se puede pulsar`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: alto })
      await sinAvisoDeTienda(page)
      await page.goto('./iphone')
      await expect(page.locator('[data-product-card-surface="web"]').first()).toBeVisible()

      const f = (await favorito(page))!
      // Lo que se ve: el disco de 36 px, en el mismo sitio que antes de la app.
      //
      // 21 y no 20: el `absolute` se posiciona desde la caja de RELLENO, y la
      // tarjeta tiene 1 px de borde. Medido sobre el build de
      // `5201a44` —el padre del primer commit nativo— sale exactamente lo
      // mismo: disco 36×36 a 21 px del borde superior y del derecho, en 1440,
      // 1280, 390 y 320. La única diferencia buscada es el área pulsable.
      expect(f.visual, 'disco de 36×36').toEqual({ ancho: 36, alto: 36 })
      expect(f.desdeArriba, 'a la misma distancia del borde superior que antes').toBe(21)
      expect(f.desdeLaDerecha, 'y del derecho').toBe(21)
      // Lo que responde: el mínimo táctil, que no se sacrifica por fidelidad.
      expect(f.pulsable.ancho, 'área pulsable').toBeGreaterThanOrEqual(44)
      expect(f.pulsable.alto).toBeGreaterThanOrEqual(44)
    })
  }
})

// ---------------------------------------------------------------------------
// APP — no cambia nada
// ---------------------------------------------------------------------------

test.describe('la tarjeta nativa conserva lo suyo', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('sigue teniendo su control de comparar y añade de verdad', async ({ page }) => {
    await comoApp(page)
    await sinAvisoDeTienda(page)
    await page.goto('./iphone')

    const tarjeta = page.locator('[data-product-card-surface="app"]').first()
    await expect(tarjeta).toBeVisible()
    const comparar = tarjeta.locator('button[aria-label*="omparar"]')
    await expect(comparar, 'la app conserva su control de comparar').toHaveCount(1)

    await comparar.click()
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
    expect(guardado.length, 'y añade al comparador de verdad').toBe(1)
  })

  test('su favorito sigue con el tamaño nativo', async ({ page }) => {
    await comoApp(page)
    await sinAvisoDeTienda(page)
    await page.goto('./iphone')

    const caja = await page.evaluate(() => {
      const b = document
        .querySelector('[data-product-card-surface="app"]')
        ?.querySelector('button[aria-label*="favoritos"]') as HTMLElement | null
      if (!b) return null
      const r = b.getBoundingClientRect()
      return { ancho: Math.round(r.width), alto: Math.round(r.height) }
    })
    expect(caja).toEqual({ ancho: 44, alto: 44 })
  })
})

// ---------------------------------------------------------------------------
// EL COMPARADOR WEB SIGUE ENTERO
// ---------------------------------------------------------------------------

test.describe('quitar el control de la tarjeta no rompe el comparador web', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('la ficha de modelo sigue siendo una entrada válida', async ({ page }) => {
    // Es la entrada que ya existía antes de la app: `ModelPage` no ha cambiado
    // ni un commit desde `5201a44`.
    await sinAvisoDeTienda(page)
    await page.goto('./iphone/17-pro')
    const casillas = page.getByRole('checkbox', { name: /Añadir a comparar/ })
    expect(await casillas.count()).toBeGreaterThanOrEqual(2)

    await casillas.nth(0).check()
    await casillas.nth(1).check()
    await page.goto('./comparar')
    const cabecera = page.getByRole('group', { name: /^Modelos comparados/ })
    await expect(cabecera.getByText('iPhone 17 Pro', { exact: true })).toHaveCount(2)
  })

  test('el selector de `/comparar` sigue añadiendo, y respeta el máximo', async ({ page }) => {
    await sinAvisoDeTienda(page)
    await page.goto('./comparar')

    for (const modelo of ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17']) {
      await page.locator('[data-model-picker-trigger]').first().click()
      const dialogo = page.getByRole('dialog', { name: /modelo de/ })
      await dialogo.getByRole('button', { name: new RegExp(`^Elegir ${modelo}$`) }).click()
    }
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
    expect(guardado.length, 'tres, el máximo').toBe(3)
    await expect(page.locator('[data-model-picker-trigger]'), 'y no hay un cuarto hueco').toHaveCount(0)
  })

  test('una comparación ya guardada se abre igual, y respeta la familia única', async ({ page }) => {
    await sinAvisoDeTienda(page)
    await page.addInitScript(() =>
      localStorage.setItem('banana:compare', JSON.stringify([{ id: 'a', modelSlug: '17', family: 'iphone' }])),
    )
    await page.goto('./comparar')
    const cabecera = page.getByRole('group', { name: /^Modelos comparados/ })
    await expect(cabecera.getByText('iPhone 17', { exact: true })).toBeVisible()

    // Y el listado de familia conserva su enlace al comparador.
    await page.goto('./iphone')
    await expect(page.locator('a[href*="/comparar"]').first()).toBeVisible()
  })
})
