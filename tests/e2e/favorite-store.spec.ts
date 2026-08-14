import { test, expect, type Page } from '@playwright/test'

// Suite de la tienda favorita (PR3 del bloque diferencial).
// Cubre: prompt inicial, no bloqueo del sitio, "Ahora no", elegir tienda,
// persistencia, selector de cabecera, cambio y borrado, priorización en
// /tiendas y en el StorePicker.

// Playwright crea un contexto de navegador nuevo por cada test, así que el
// localStorage empieza vacío sin necesidad de `addInitScript` (que se
// dispararía en cada navegación borrando también el estado que la propia
// prueba acaba de crear).
async function ensureFreshVisit(_page: Page) {
  return
}

/**
 * Pulsa en el centro de una caja con el ratón del navegador.
 *
 * POR QUÉ NO `locator.click()` AQUÍ
 *
 * `locator.click()` comprueba la accionabilidad y, si el objetivo está tapado,
 * desplaza el documento hasta despejarlo. Eso es justo lo que enmascaraba este
 * fallo: la prueba pasaba porque Playwright rodeaba el obstáculo. Con
 * `page.mouse` se ejercita el hit-testing real del navegador, que es lo que
 * tiene delante una persona.
 */
async function pulsarConElRaton(page: Page, caja: { x: number; y: number; width: number; height: number }) {
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
  await page.mouse.down()
  await page.mouse.up()
}

test('el bottom sheet aparece en la primera visita sin bloquear la navegación', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./')
  const prompt = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
  await expect(prompt).toBeVisible({ timeout: 5000 })
  // Aunque el prompt esté abierto, la portada sigue navegable.
  await expect(page.getByRole('link', { name: /Encuentra tu Apple/ }).first()).toBeVisible()

  // «Sin bloquear» tiene que medirse, no declararse: que algo se vea no
  // significa que se pueda pulsar. La capa del aviso ocupa todo el ancho de la
  // ventana y sólo se ve el panel del centro, así que se comprueba un punto de
  // esa banda que quede FUERA del panel.
  const banda = await page.evaluate(() => {
    const capa = document.querySelector('[data-favorite-store-prompt]')!
    const panel = capa.querySelector('[role="dialog"]')!
    const c = capa.getBoundingClientRect()
    const p = panel.getBoundingClientRect()
    const x = Math.round((c.left + p.left) / 2)
    const y = Math.round(p.top + p.height / 2)
    const enElPunto = document.elementFromPoint(x, y)
    return {
      margenIzquierdo: Math.round(p.left - c.left),
      loRecibeElAviso: Boolean(enElPunto?.closest('[data-favorite-store-prompt]')),
    }
  })
  expect(banda.margenIzquierdo, 'el panel debe dejar banda transparente a su izquierda').toBeGreaterThan(20)
  expect(banda.loRecibeElAviso, 'la banda transparente del aviso no debe capturar el puntero').toBe(false)
})

test('"Ahora no" cierra el prompt y no vuelve a aparecer en la sesión', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./')
  await page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ }).waitFor()
  await page.getByRole('button', { name: 'Ahora no' }).click()
  await expect(page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })).toHaveCount(0)
})

test('elegir tienda persiste, actualiza cabecera y aparece primero en /tiendas', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./')
  const promptDialog = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
  await promptDialog.waitFor()
  await promptDialog.getByRole('button', { name: 'Elegir tienda', exact: true }).click()
  await promptDialog.getByRole('button', { name: /Banana Triana/ }).click()

  // Cabecera muestra "Mi tienda: X".
  await expect(page.getByRole('button', { name: /Mi tienda: Banana Triana/ })).toBeVisible()

  // Persiste tras recargar.
  await page.reload()
  await expect(page.getByRole('button', { name: /Mi tienda: Banana Triana/ })).toBeVisible()

  // En /tiendas la tienda favorita aparece con badge "Tu tienda".
  await page.goto('./tiendas')
  const heading = page.getByRole('heading', { name: 'Banana Triana', level: 2 }).first()
  await expect(heading).toBeVisible()
  await expect(page.getByText(/Tu tienda/).first()).toBeVisible()
})

test('desde el detalle se puede marcar y quitar la tienda favorita', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./tiendas/triana')
  await expect(page.getByRole('button', { name: /Marcar como mi tienda \(Banana Triana\)/ })).toBeVisible()
  await page.getByRole('button', { name: /Marcar como mi tienda \(Banana Triana\)/ }).click()
  await expect(page.getByText(/Esta es tu tienda/)).toBeVisible()
  await page
    .getByRole('button', { name: /Quitar/ })
    .first()
    .click()
  await expect(page.getByRole('button', { name: /Marcar como mi tienda \(Banana Triana\)/ })).toBeVisible()
})

test('no se guardan datos personales — sólo el slug elegido', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.goto('./')
  const promptDialog = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
  await promptDialog.waitFor()
  await promptDialog.getByRole('button', { name: 'Elegir tienda', exact: true }).click()
  await promptDialog.getByRole('button', { name: /Banana Triana/ }).click()

  const storage = await page.evaluate(() => ({
    fav: localStorage.getItem('banana:favorite-store'),
    prompt: localStorage.getItem('banana:favorite-store-prompt'),
    all: Object.keys(localStorage),
  }))
  expect(storage.fav).toBe('triana')
  expect(storage.prompt).toBe('dismissed')
  // Ninguna otra clave nueva creada por este flujo.
  expect(storage.all.some((k) => /email|coords|location|user/i.test(k))).toBe(false)
})

test('a 375 px el prompt de tienda favorita no genera scroll horizontal @mobile', async ({ page }) => {
  await ensureFreshVisit(page)
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('./')
  await page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ }).waitFor()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('el prompt no aparece dentro del checkout', async ({ page }) => {
  await ensureFreshVisit(page)
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
  // Esperamos un tiempo similar al que tarda el prompt en aparecer y
  // comprobamos que sigue sin estar.
  await page.waitForTimeout(1200)
  await expect(page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })).toHaveCount(0)
})

test('el aviso no aparece encima de un diálogo modal ni le roba el foco', async ({ page }) => {
  // Regresión de A11Y-003. El aviso toma el foco al montarse, así que
  // apareciendo sobre un diálogo abierto se lo robaba a algo que la persona
  // estaba usando. Se manifestaba además como un fallo intermitente de la
  // trampa de foco de la guía en CI (QA-003): el temporizador de 800 ms caía
  // dentro del recorrido de tabulación del test.
  await page.goto('./soporte')

  await page.getByRole('button', { name: 'Preparar mi dispositivo' }).first().click()
  const guia = page.getByRole('dialog', { name: 'Preparar mi dispositivo' })
  await expect(guia).toBeVisible()

  // Bastante más que los 800 ms del temporizador.
  await page.waitForTimeout(2500)

  await expect(page.locator('[data-favorite-store-prompt]')).toHaveCount(0)
  const foco = await guia.evaluate((el) => el.contains(document.activeElement))
  expect(foco, 'la guía perdió el foco mientras estaba abierta').toBe(true)

  // Al cerrar la guía, el aviso sí puede aparecer: solo estaba esperando.
  await page.keyboard.press('Escape')
  await expect(guia).toBeHidden()
  await expect(page.locator('[data-favorite-store-prompt]')).toBeVisible({ timeout: 5000 })
})

// ---------------------------------------------------------------------------
// El aviso no puede tragarse los clicks de la página que hay debajo.
//
// De dónde sale: investigando el intermitente histórico de
// `apple-finder.spec.ts` se midió que la capa del aviso —`fixed`, de ancho
// completo, 221 px de alto— cubría el botón «Continuar» del asistente **al
// 100 %** a 1280×720 y a 1366×768, aunque el panel visible quedase a 199 px de
// distancia. `document.elementFromPoint` devolvía la capa en los cinco puntos
// del botón, y una pulsación real no cambiaba de pregunta. El teclado, en
// cambio, sí podía enfocarlo: dos modos de entrada en contradicción.
//
// A 1440×900 no había solape, así que no se versiona como caso: no protegería
// nada.
// ---------------------------------------------------------------------------
for (const ventana of [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
]) {
  test(`con el aviso abierto se puede pulsar el CTA que queda debajo a ${ventana.width}×${ventana.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(ventana)
    await page.goto('./elige-tu-apple')
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.getByRole('radio', { name: 'iPhone' }).click()
    await page.getByRole('radio', { name: 'Fotografía y vídeo' }).click()
    await page.getByRole('button', { name: /^Siguiente/ }).click()
    await page.getByRole('radio', { name: 'Grande' }).click()
    await page.getByRole('button', { name: /^Siguiente/ }).click()
    await page.getByRole('radio', { name: 'Cámara' }).click()

    // El aviso aparece a los ~800 ms de la primera visita.
    const aviso = page.locator('[data-favorite-store-prompt]')
    await expect(aviso).toBeVisible({ timeout: 5000 })

    const cta = page.getByRole('button', { name: /Continuar|Siguiente/ })

    // Colocar el CTA dentro de la banda del aviso, que es donde se midió el
    // fallo. Se hace con la rueda del ratón —desplazamiento físico— en vez de
    // `window.scrollTo`, para no salirse de lo que haría una persona.
    const desplazamiento = await page.evaluate(() => {
      const boton = [...document.querySelectorAll('button')].find((b) =>
        /^Continuar|^Siguiente/.test((b.textContent || '').trim()),
      )!
      const capa = document.querySelector('[data-favorite-store-prompt]')!.getBoundingClientRect()
      // Objetivo: el centro del botón, a un tercio de la banda desde arriba.
      const destinoEnPantalla = capa.top + capa.height / 3
      const centroActual = boton.getBoundingClientRect().top + boton.getBoundingClientRect().height / 2
      return Math.round(centroActual - destinoEnPantalla)
    })
    await page.mouse.move(ventana.width / 2, 200)
    await page.mouse.wheel(0, desplazamiento)
    // Esperar a que el desplazamiento se asiente, sin tiempos fijos.
    await expect
      .poll(
        async () => {
          const a = await page.evaluate(() => Math.round(window.scrollY))
          await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          )
          const b = await page.evaluate(() => Math.round(window.scrollY))
          return a === b
        },
        { timeout: 5000 },
      )
      .toBe(true)

    const caja = await cta.boundingBox()
    expect(caja, 'sin caja del CTA no hay nada que medir').not.toBeNull()

    // La precondición que hace útil el caso: el CTA está dentro de la banda del
    // aviso y fuera del panel visible. Si dejara de solaparse, la prueba no
    // estaría comprobando nada y hay que saberlo.
    const situacion = await page.evaluate((c) => {
      const capa = document.querySelector('[data-favorite-store-prompt]')!
      const panel = capa.querySelector('[role="dialog"]')!
      const rc = capa.getBoundingClientRect()
      const rp = panel.getBoundingClientRect()
      const centro = { x: c!.x + c!.width / 2, y: c!.y + c!.height / 2 }
      const solapaLaCapa = centro.y >= rc.top && centro.y <= rc.bottom
      const solapaElPanel = centro.x >= rp.left && centro.x <= rp.right && solapaLaCapa
      return { solapaLaCapa, solapaElPanel }
    }, caja)
    expect(situacion.solapaLaCapa, 'el CTA debe caer dentro de la banda del aviso').toBe(true)
    expect(situacion.solapaElPanel, 'el CTA no debe caer bajo el panel visible').toBe(false)

    // Hit-testing real: quien recibe el punto es el botón o algo suyo.
    const alcanzable = await page.evaluate((c) => {
      const boton = [...document.querySelectorAll('button')].find((b) =>
        /^Continuar|^Siguiente/.test((b.textContent || '').trim()),
      )
      const enElPunto = document.elementFromPoint(c!.x + c!.width / 2, c!.y + c!.height / 2)
      return {
        esElCta: Boolean(boton && enElPunto && (enElPunto === boton || boton.contains(enElPunto))),
        recibe: enElPunto?.closest('[data-favorite-store-prompt]') ? 'el aviso' : (enElPunto?.tagName ?? 'nadie'),
      }
    }, caja)
    expect(alcanzable.esElCta, `el punto del CTA lo recibe ${alcanzable.recibe}`).toBe(true)

    // Y la pulsación real avanza de pregunta.
    await pulsarConElRaton(page, caja!)
    await expect(
      page.getByRole('heading', { name: /¿Qué presupuesto orientativo tienes/ }),
      'la pulsación física sobre el CTA debe avanzar a la pregunta de presupuesto',
    ).toBeVisible()

    // El arreglo contrario —dejar todo el aviso sin puntero— también pasaría
    // lo anterior, así que el panel tiene que seguir siendo pulsable.
    const cerrar = page.getByRole('button', { name: /Ahora no/i })
    const cajaCerrar = await cerrar.boundingBox()
    expect(cajaCerrar, 'sin caja del botón del panel no hay nada que medir').not.toBeNull()
    await pulsarConElRaton(page, cajaCerrar!)
    await expect(aviso, 'el panel del aviso debe seguir siendo interactivo').toHaveCount(0)
  })
}
