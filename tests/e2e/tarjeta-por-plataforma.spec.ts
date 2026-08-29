import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// CADA PLATAFORMA MONTA SU PROPIA TARJETA DE PRODUCTO.
//
// QUÉ ACOPLAMIENTO PROTEGE ESTA SUITE
//
// `ProductCard` era una sola composición montada por la web y por la app. Con
// eso, cualquier retoque pensado para el catálogo nativo —altura, marco,
// imagen, precio, distintivos, espaciado, interacción táctil— cambiaba también
// la web sin que nadie lo pidiera.
//
// Es exactamente el fallo que `FamilyPage` tenía antes de la PR #86: un cambio
// «para la app» que se llevó por delante el escaparate de la web. D-085 lo
// prohíbe, y esta suite lo hace comprobable.
//
// POR QUÉ UN MARCADOR Y NO CLASES DE TAILWIND
//
// Las dos tarjetas son hoy visualmente idénticas —esta separación no rediseña
// nada—, así que no hay ninguna diferencia visual que comprobar: comprobarla
// sería, además, atarse a clases que cambian con cualquier retoque. Lo que sí
// es contrato es **qué composición está montada**, y eso lo dice
// `data-product-card-surface`, que es semántica de arquitectura, no estilo.
//
// La prueba de fuego es `/buscar`: es la única página de catálogo que montan
// las dos plataformas, así que es donde el acoplamiento podría sobrevivir si
// sólo se hubiera arreglado `FamilyPage`.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/** Qué composiciones de tarjeta hay montadas en la pantalla. */
async function superficies(page: Page) {
  return page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll('[data-product-card-surface]')].map((e) =>
        e.getAttribute('data-product-card-surface'),
      ),
    ),
  ])
}

test.describe('el catálogo de familia usa la tarjeta de su plataforma', () => {
  test('la web monta tarjetas web, y ninguna de la app', async ({ page }) => {
    await page.goto('./iphone')

    const tarjetas = page.locator('[data-product-card]')
    await expect(tarjetas.first()).toBeVisible()
    expect(await superficies(page)).toEqual(['web'])
    await expect(page.locator('[data-product-card-surface="app"]'), 'la web no monta la tarjeta nativa').toHaveCount(0)
    // Todas, no sólo la primera: basta con que una se cuele para que el
    // acoplamiento haya vuelto.
    await expect(page.locator('[data-product-card-surface="web"]')).toHaveCount(await tarjetas.count())
  })

  test('la app monta tarjetas de app, y ninguna de la web', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const tarjetas = page.locator('[data-product-card]')
    await expect(tarjetas.first()).toBeVisible()
    expect(await superficies(page)).toEqual(['app'])
    await expect(page.locator('[data-product-card-surface="web"]'), 'la app no monta la tarjeta web').toHaveCount(0)
    await expect(page.locator('[data-product-card-surface="app"]')).toHaveCount(await tarjetas.count())
  })
})

test.describe('la búsqueda es una sola página y elige la tarjeta que toca', () => {
  // `/buscar` no se parte en dos composiciones porque es la misma pantalla en
  // las dos plataformas —se abre desde el pie en la web y desde el buscador de
  // `AppTopBar` en la app—. Lo que cambia es qué tarjeta usa, y esa decisión se
  // toma una sola vez en la frontera de la página.

  test('en el navegador, los dispositivos usan la tarjeta web', async ({ page }) => {
    await page.goto('./buscar?q=iPhone')

    await expect(page.locator('[data-product-card]').first()).toBeVisible()
    expect(await superficies(page)).toEqual(['web'])
    await expect(page.locator('[data-product-card-surface="app"]')).toHaveCount(0)
  })

  test('en la app, la misma búsqueda usa la tarjeta de app', async ({ page }) => {
    await comoApp(page)
    await page.goto('./buscar?q=iPhone')

    await expect(page.locator('[data-product-card]').first()).toBeVisible()
    expect(await superficies(page), 'la búsqueda nativa seguiría a la Fase B').toEqual(['app'])
    await expect(page.locator('[data-product-card-surface="web"]')).toHaveCount(0)
    // Y es de verdad la app: su armazón está montado.
    await expect(page.locator('[data-app-tab-bar]')).toHaveCount(1)
  })
})

test.describe('separar la presentación no separa el comportamiento', () => {
  // Variante enseñada, oferta, destino, favorito y comparación viven una sola
  // vez en `useTarjetaDeProducto`. Si alguien los duplicara por tarjeta, las dos
  // plataformas podrían empezar a anunciar cosas distintas del mismo producto.
  // Aquí se comprueba que ambas coinciden en lo que importa.
  for (const [plataforma, nativo] of [
    ['web', false],
    ['app', true],
  ] as const) {
    test(`la tarjeta ${plataforma} anuncia y abre la misma variante`, async ({ page }) => {
      if (nativo) await comoApp(page)
      await page.goto('./iphone')

      const rebajada = page
        .locator('[data-product-card]')
        .filter({ has: page.locator('.line-through') })
        .first()
      await expect(rebajada).toBeVisible()

      const datos = await rebajada.evaluate((c) => {
        const num = (sel: string) => Number((c.querySelector(sel)?.textContent ?? '').replace(/[^\d]/g, ''))
        return {
          anterior: num('.line-through'),
          actual: num('.text-danger:not(.line-through)'),
          destino: c.querySelector('a[href]')?.getAttribute('href') ?? '',
          favorito: c.querySelector('button[aria-pressed]')?.getAttribute('aria-pressed'),
        }
      })

      expect(datos.actual, 'el precio anunciado es menor que el anterior').toBeLessThan(datos.anterior)
      // Familia/modelo/variante: abre la configuración que enseña, no la de
      // entrada del modelo.
      expect(
        datos.destino
          .replace(/^\/pagina-banana/, '')
          .split('/')
          .filter(Boolean),
      ).toHaveLength(3)
      expect(datos.favorito, 'el favorito arranca sin marcar y con estado accesible').toBe('false')
    })
  }
})
