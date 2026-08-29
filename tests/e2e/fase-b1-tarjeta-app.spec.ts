import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// FASE B1 — «EL PRODUCTO RESPIRA» EN LA TARJETA NATIVA.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// La tarjeta del catálogo tenía tres marcos concéntricos, una descripción con
// dos líneas reservadas, un distintivo de «precio demostrativo» por producto y
// un botón de comparar del ancho completo. Medido a 320×568, ocupaba 510 px y
// **el precio no llegaba a verse**.
//
// B1 deja una sola superficie —la imagen—, con el nombre y el precio pegados
// debajo y las acciones como iconos encima de la foto.
//
// LO QUE SE COMPRUEBA, Y LO QUE NO
//
// Nada de clases de Tailwind: cambian con cualquier retoque y no son el
// contrato. Se comprueba el resultado —qué se ve, qué desapareció, qué sigue
// siendo alcanzable— y que **la web no se ha movido**, porque B1 es APP-only y
// la frontera de la PR #87 existe exactamente para eso.
//
// El contrato de Fase A —imagen ≥ 120 px y nombre ≥ 12 a 320— lo sigue
// guardando `producto-en-pantalla.spec.ts`; aquí se añade lo que B1 gana: que
// el precio entre también.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/** Geometría de la primera tarjeta dentro del área útil entre las dos barras. */
async function primeraTarjeta(page: Page) {
  return page.evaluate(() => {
    const barra = document.querySelector('[data-app-topbar]')?.getBoundingClientRect()
    const tab = document.querySelector('[data-app-tab-bar]')?.getBoundingClientRect()
    const top = barra ? barra.bottom : 0
    const bot = tab ? tab.top : window.innerHeight
    const c = document.querySelector('[data-product-card]')
    if (!c) return null
    const visible = (e: Element | null) => {
      if (!e) return 0
      const r = e.getBoundingClientRect()
      return Math.round(Math.max(0, Math.min(r.bottom, bot) - Math.max(r.top, top)))
    }
    const precio = [...c.querySelectorAll('span')].find(
      (e) => /€/.test(e.textContent ?? '') && !e.className.includes('line-through'),
    )
    return {
      imagen: visible(c.querySelector('img')),
      nombre: visible(c.querySelector('h3')),
      precio: visible(precio ?? null),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

test.describe('la tarjeta nativa a 320 px', () => {
  test.use({ viewport: { width: 320, height: 568 } })

  test('el producto, su nombre y su precio entran juntos en el primer viewport', async ({ page }) => {
    // Lo que B1 gana: antes el precio quedaba fuera de la pantalla —medido: 0 px
    // visibles— porque la tarjeta ocupaba 510. No se comprueba contra un número
    // exacto, que envejecería, sino contra el hecho: se ve.
    await comoApp(page)
    await page.goto('./iphone')

    const t = await primeraTarjeta(page)
    expect(t, 'hay una tarjeta de producto').not.toBeNull()
    expect(t!.imagen, 'la imagen conserva presencia, muy por encima del mínimo de 120').toBeGreaterThanOrEqual(180)
    expect(t!.nombre, 'el nombre se lee').toBeGreaterThanOrEqual(12)
    expect(t!.precio, 'y el precio entra con él, que es lo que B1 añade').toBeGreaterThan(0)
    expect(t!.overflowX, 'sin desbordamiento lateral').toBe(0)
  })
})

test.describe('lo que B1 retira de la tarjeta nativa', () => {
  test('sin descripción de marketing, sin distintivo «Oferta» y sin aviso por producto', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const tarjeta = page.locator('[data-product-card]').first()
    await expect(tarjeta).toBeVisible()

    await expect(
      tarjeta.getByText('La pantalla más grande y la mayor autonomía.'),
      'la descripción vive en la ficha, no en el catálogo',
    ).toHaveCount(0)

    // El aviso de precios no desaparece —es una salvaguarda de honestidad—:
    // deja de repetirse por tarjeta y se da una vez para todo el listado.
    await expect(page.getByText('Precio demostrativo'), 'ya no hay un distintivo por producto').toHaveCount(0)
    await expect(page.getByText(/Precios demostrativos/), 'pero el listado sigue avisando, una sola vez').toHaveCount(1)
  })

  test('la oferta deja el distintivo genérico y conserva el porcentaje', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const rebajada = page
      .locator('[data-product-card]')
      .filter({ has: page.locator('.line-through') })
      .first()
    await expect(rebajada).toBeVisible()
    await expect(rebajada.getByText('Oferta', { exact: true }), 'decía dos veces lo mismo').toHaveCount(0)
    await expect(rebajada.getByText(/^-\d+%$/), 'el porcentaje sí informa').toBeVisible()

    // Y lo anunciado sigue siendo comprable: precio actual menor que el
    // anterior, y el enlace abre esa misma variante.
    const datos = await rebajada.evaluate((c) => {
      const num = (sel: string) => Number((c.querySelector(sel)?.textContent ?? '').replace(/[^\d]/g, ''))
      return {
        anterior: num('.line-through'),
        actual: num('.text-danger:not(.line-through)'),
        destino: c.querySelector('a[href]')?.getAttribute('href') ?? '',
        enlaces: c.querySelectorAll('a[href]').length,
      }
    })
    expect(datos.actual).toBeLessThan(datos.anterior)
    expect(
      datos.destino
        .replace(/^\/pagina-banana/, '')
        .split('/')
        .filter(Boolean),
    ).toHaveLength(3)
    expect(datos.enlaces, 'un solo enlace por tarjeta').toBe(1)
  })
})

test.describe('las acciones siguen siendo alcanzables', () => {
  test('favorito y comparar son iconos, pero conservan rol, nombre y 44 px', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const tarjeta = page.locator('[data-product-card]').first()
    const favorito = tarjeta.getByRole('button', { name: /favoritos/ })
    const comparar = tarjeta.getByRole('button', { name: /^Comparar / })

    for (const [nombre, boton] of [
      ['favorito', favorito],
      ['comparar', comparar],
    ] as const) {
      await expect(boton, `${nombre} existe como botón`).toBeVisible()
      await expect(boton, `${nombre} anuncia su estado`).toHaveAttribute('aria-pressed', 'false')
      const caja = await boton.boundingBox()
      expect(caja!.width, `${nombre}: ancho táctil`).toBeGreaterThanOrEqual(44)
      expect(caja!.height, `${nombre}: alto táctil`).toBeGreaterThanOrEqual(44)
    }

    // Y siguen funcionando: comparar añade y quita, y el estado se anuncia.
    await comparar.click()
    await expect(comparar).toHaveAttribute('aria-pressed', 'true')
    await comparar.click()
    await expect(comparar).toHaveAttribute('aria-pressed', 'false')

    await favorito.click()
    await expect(favorito).toHaveAttribute('aria-pressed', 'true')
  })

  test('el límite de tres sigue siendo por familia', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const botones = page.getByRole('button', { name: /^Comparar / })
    for (let i = 0; i < 3; i++) await botones.nth(i).click()
    await expect(botones.nth(3), 'con tres guardados, el cuarto de la MISMA familia se bloquea').toBeDisabled()

    // Pero otra familia no queda inservible: el store sabe empezar una
    // comparación nueva.
    await page.goto('./mac')
    await expect(
      page.getByRole('button', { name: /^Comparar / }).first(),
      'el catálogo de otra familia sigue usable',
    ).toBeEnabled()
  })
})

test.describe('B1 no toca la web', () => {
  test('la tarjeta web conserva descripción, distintivo y botón de comparar', async ({ page }) => {
    await page.goto('./iphone')

    const tarjeta = page.locator('[data-product-card-surface="web"]').first()
    await expect(tarjeta).toBeVisible()
    await expect(tarjeta.getByText('La pantalla más grande y la mayor autonomía.')).toBeVisible()
    await expect(tarjeta.getByText('Precio demostrativo')).toBeVisible()
    // En la web sigue siendo un botón con texto, no un icono.
    await expect(tarjeta.getByRole('button', { name: /^Comparar / })).toContainText(/comparar/i)
    await expect(page.locator('[data-product-card-surface="app"]'), 'y ninguna tarjeta de app').toHaveCount(0)
  })
})
