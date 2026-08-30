import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// FASE B2 — «EL PRODUCTO RESPIRA» EN LA FICHA NATIVA.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// B2 son tres cambios concretos, y sólo tres:
//
//   1. la galería pierde el marco y adopta el radio del sistema nativo;
//   2. el favorito deja de meterse entre el nombre y el precio;
//   3. los accesorios sugeridos usan el tratamiento real del catálogo.
//
// Los tres se aplican **sólo en la app**. `VariantPage` sigue siendo una sola
// página compartida: no hay `VariantPageApp`, ni `ProductHeroApp`, ni nada
// duplicado. Lo que diverge son tres nodos de presentación.
//
// POR QUÉ LA WEB SE QUEDA COMO ESTÁ, AUNQUE TENGA LOS MISMOS DEFECTOS
//
// La auditoría previa demostró que los tres problemas existen igual en la web
// estrecha —el favorito se interpone también a 390 px de navegador—. Aun así no
// se tocan: D-086 congela la composición web durante la Fase B. Que se pueda
// arreglar no significa que se arregle aquí; sería otra decisión.
//
// Por eso los casos de web comprueban que **sigue igual**, no que esté bien.
//
// NO SE COMPRUEBAN CLASES
//
// Se mide geometría y estilo computado: qué borde tiene, qué radio, dónde cae
// cada cosa. Las clases cambian con cualquier retoque y no son el contrato.
// ============================================================================

const RUTA = './iphone/17-pro/256gb-plata'
const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/** La superficie que envuelve la fotografía principal de la ficha. */
async function galeria(page: Page) {
  return page.evaluate(() => {
    const g = [...document.querySelectorAll('div')].find(
      (e) =>
        e.querySelector('img') && getComputedStyle(e).overflow === 'hidden' && e.getBoundingClientRect().width > 200,
    )
    if (!g) return null
    const s = getComputedStyle(g)
    const img = g.querySelector('img')!
    const ri = img.getBoundingClientRect()
    return {
      anchoBorde: parseFloat(s.borderTopWidth),
      radio: parseFloat(s.borderTopLeftRadius),
      imagenAncho: Math.round(ri.width),
      imagenAlto: Math.round(ri.height),
      ajuste: getComputedStyle(img).objectFit,
      cargada: img.complete && img.naturalWidth > 0,
    }
  })
}

/** Posición relativa de nombre, precio y favorito en el bloque de compra. */
async function identidad(page: Page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1')!
    const precio = [...document.querySelectorAll('span')].find(
      (e) => /€/.test(e.textContent ?? '') && parseFloat(getComputedStyle(e).fontSize) >= 24,
    )!
    const fav = [...document.querySelectorAll('button')].find((x) =>
      /favoritos/i.test(x.getAttribute('aria-label') ?? ''),
    )!
    const rn = h1.getBoundingClientRect()
    const rp = precio.getBoundingClientRect()
    const rf = fav.getBoundingClientRect()
    return {
      huecoNombrePrecio: Math.round(rp.top - rn.bottom),
      // ¿el favorito ocupa la banda vertical que separa el nombre del precio?
      favoritoEnMedio: rf.top >= rn.bottom - 2 && rf.bottom <= rp.top + 2,
      favorito: { ancho: Math.round(rf.width), alto: Math.round(rf.height) },
    }
  })
}

test.describe('la galería de la ficha', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('en la app pierde el marco y toma el radio del sistema', async ({ page }) => {
    // El borde era `1px solid #e3e3e6` alrededor de un fondo casi blanco:
    // dibujaba un contorno sin separar la foto de nada. Y el radio de 20 px no
    // pertenecía a ningún sistema; la tarjeta nativa de B1 usa 16.
    await comoApp(page)
    await page.goto(RUTA)

    const g = await galeria(page)
    expect(g, 'la ficha tiene galería').not.toBeNull()
    expect(g!.anchoBorde, 'sin marco').toBe(0)
    expect(g!.radio, 'el radio del sistema nativo').toBe(16)
    expect(g!.cargada, 'la fotografía carga').toBe(true)
    expect(g!.ajuste, 'y sigue contenida, sin recortar el producto').toBe('contain')
    expect(g!.imagenAncho, 'la foto conserva presencia').toBeGreaterThan(200)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
      0,
    )
  })

  test('en el navegador se queda exactamente como estaba', async ({ page }) => {
    // No porque esté mejor, sino porque D-086 congela la web durante la Fase B.
    await page.goto(RUTA)

    const g = await galeria(page)
    expect(g!.anchoBorde, 'la web conserva su marco de 1 px').toBe(1)
    expect(g!.radio, 'y su radio de 20').toBe(20)
  })
})

test.describe('el nombre y el precio de la ficha', () => {
  for (const ancho of [320, 390]) {
    test(`en la app, a ${ancho} px, el favorito no los separa`, async ({ page }) => {
      // La fila es `flex-wrap`: en pantalla ancha el favorito va junto al
      // título, pero al no caber bajaba y aterrizaba justo entre el nombre y el
      // precio. Medido antes de B2: el hueco pasaba de 18 a 66 px.
      await page.setViewportSize({ width: ancho, height: ancho === 320 ? 568 : 844 })
      await comoApp(page)
      await page.goto(RUTA)

      const i = await identidad(page)
      expect(i.favoritoEnMedio, 'el favorito no se interpone').toBe(false)
      expect(i.huecoNombrePrecio, 'nombre y precio se leen como un bloque').toBeLessThan(40)
      expect(i.huecoNombrePrecio, 'y no quedan pegados de forma ilegible').toBeGreaterThan(0)
    })
  }

  test('en el navegador estrecho sigue como estaba, con el mismo defecto', async ({ page }) => {
    // Deliberado: la web tiene el mismo problema y B2 no lo arregla. Este caso
    // existe para que el día que se decida arreglarlo se vea que era una
    // decisión, no un olvido.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(RUTA)

    const i = await identidad(page)
    expect(i.favoritoEnMedio, 'la web conserva su composición actual').toBe(true)
  })
})

test.describe('el favorito de la ficha nativa', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('es un icono, pero sigue siendo el mismo control', async ({ page }) => {
    await comoApp(page)
    await page.goto(RUTA)

    const fav = page.getByRole('button', { name: /favoritos/ })
    await expect(fav).toBeVisible()
    await expect(fav, 'anuncia su estado').toHaveAttribute('aria-pressed', 'false')

    const caja = await fav.boundingBox()
    expect(caja!.width, 'ancho táctil').toBeGreaterThanOrEqual(44)
    expect(caja!.height, 'alto táctil').toBeGreaterThanOrEqual(44)

    // Añade y quita: la lógica no se ha reimplementado.
    await fav.click()
    await expect(fav).toHaveAttribute('aria-pressed', 'true')
    await fav.click()
    await expect(fav).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('los accesorios sugeridos', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  /** Tratamiento de la primera tarjeta de accesorio de una pantalla. */
  const tratamiento = (page: Page, selector: string) =>
    page.evaluate((sel) => {
      const t = document.querySelector<HTMLElement>(sel)
      if (!t) return null
      const s = getComputedStyle(t)
      const img = t.querySelector('img')
      return {
        radio: s.borderTopLeftRadius,
        borde: s.borderTopWidth,
        fondo: s.backgroundColor,
        altoMinimo: s.minHeight,
        // Estructura: la tarjeta del catálogo lleva un h3 y su precio dentro.
        titulo: t.querySelector('h3')?.tagName ?? null,
        proporcionImagen: img ? getComputedStyle(img.parentElement!).aspectRatio : null,
      }
    }, selector)

  test('en la app son las mismas tarjetas del catálogo, no una imitación', async ({ page }) => {
    // El requisito de B2 es que el tratamiento sea el del catálogo. Se cumple
    // reutilizando `AccessoryCard` —la fuente real, la que ya usan `/accesorios`
    // y la búsqueda—, no copiando sus clases: una copia se rompe al primer
    // retoque y esta comprobación lo detectaría.
    await comoApp(page)

    await page.goto('./accesorios')
    const enCatalogo = await tratamiento(page, 'main div[class*="rounded"]:has(h3):has(img)')
    expect(enCatalogo, 'hay tarjetas en el catálogo').not.toBeNull()

    await page.goto(RUTA)
    const seccion = page.locator('section:has(#variant-cross-sell)')
    await expect(seccion, 'la ficha sugiere accesorios').toBeVisible()
    const enFicha = await tratamiento(page, 'section:has(#variant-cross-sell) div[class*="rounded"]:has(h3):has(img)')

    expect(enFicha, 'la ficha nativa monta la tarjeta del catálogo').not.toBeNull()
    expect(enFicha, 'y con el mismo tratamiento').toEqual(enCatalogo)
  })

  test('en el navegador se conserva la tarjeta compacta anterior', async ({ page }) => {
    await page.goto(RUTA)

    const seccion = page.locator('section:has(#variant-cross-sell)')
    await expect(seccion).toBeVisible()
    // La web no recibe la tarjeta del catálogo: sigue con su enlace compacto,
    // sin `h3` y con su propio marco.
    await expect(
      seccion.locator('h3'),
      'la web mantiene su cross-sell, sin los encabezados de la tarjeta de catálogo',
    ).toHaveCount(0)
    await expect(seccion.getByRole('link'), 'y sigue enlazando a los accesorios').not.toHaveCount(0)
  })
})
