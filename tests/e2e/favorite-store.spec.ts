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

/**
 * Interactivos VISIBLES de la página cuyo punto de acción se lo queda el aviso.
 *
 * Devuelve además cuántos interactivos visibles hay en total, porque una lista
 * de secuestrados vacía sólo significa algo si había alguien a quien secuestrar:
 * sin ese contador, la comprobación pasaría igual en una página en blanco.
 *
 * Mide con `document.elementFromPoint`, que es el hit-testing de verdad del
 * navegador. Un elemento se considera secuestrado cuando su punto central —el
 * sitio al que va un dedo— lo recibe algo de dentro del aviso.
 */
async function radiografiaDelAviso(page: Page) {
  return page.evaluate(() => {
    const capa = document.querySelector('[data-favorite-store-prompt]')
    if (!capa) return null
    const panel = capa.querySelector('[role="dialog"]')!
    const rectPanel = panel.getBoundingClientRect()

    /**
     * El trozo del elemento que de verdad se ve.
     *
     * `getBoundingClientRect()` no basta: dentro de la app el contenido vive en
     * un `main` con `overflow-y-auto` y los carriles horizontales recortan a su
     * vez, así que una tarjeta desplazada fuera de su contenedor sigue
     * devolviendo un rectángulo dentro de la ventana aunque no se vea ni un
     * píxel de ella. Midiendo sin recortar, esas tarjetas invisibles contaban
     * como tapadas y el resultado no significaba nada.
     */
    function trozoVisible(el: Element) {
      const r = el.getBoundingClientRect()
      let { top, left, right, bottom } = r
      for (let padre = el.parentElement; padre; padre = padre.parentElement) {
        const estilo = getComputedStyle(padre)
        if (estilo.overflow === 'visible' && estilo.overflowX === 'visible' && estilo.overflowY === 'visible') continue
        const rp = padre.getBoundingClientRect()
        top = Math.max(top, rp.top)
        left = Math.max(left, rp.left)
        right = Math.min(right, rp.right)
        bottom = Math.min(bottom, rp.bottom)
      }
      top = Math.max(top, 0)
      left = Math.max(left, 0)
      right = Math.min(right, window.innerWidth)
      bottom = Math.min(bottom, window.innerHeight)
      return { top, left, right, bottom, ancho: right - left, alto: bottom - top }
    }

    const seleccionable = 'a[href], button, input, select, textarea, [role="button"], [role="radio"], [role="tab"]'
    const secuestrados: string[] = []
    let visibles = 0

    for (const el of document.querySelectorAll(seleccionable)) {
      if (capa.contains(el)) continue
      const estilo = getComputedStyle(el)
      if (estilo.visibility === 'hidden' || estilo.display === 'none') continue
      const trozo = trozoVisible(el)
      // Un par de píxeles de asomo no son un objetivo: nadie los toca.
      if (trozo.ancho <= 2 || trozo.alto <= 2) continue
      visibles++
      const x = trozo.left + trozo.ancho / 2
      const y = trozo.top + trozo.alto / 2
      const enElPunto = document.elementFromPoint(x, y)
      if (enElPunto?.closest('[data-favorite-store-prompt]')) {
        secuestrados.push(
          (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44),
        )
      }
    }

    const rectMain = document.querySelector('main')!.getBoundingClientRect()
    return {
      secuestrados,
      visibles,
      altoPanel: Math.round(rectPanel.height),
      topPanel: Math.round(rectPanel.top),
      fondoDelMain: Math.round(rectMain.bottom),
    }
  })
}

/** Simula el binario igual que el resto de la suite: Capacitor inyectado antes del bundle. */
async function simularApp(page: Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { Capacitor?: unknown }).Capacitor = {}
  })
}

/** Deja quieto el desplazamiento sin tiempos fijos. */
async function esperarAQueSeAsiente(page: Page) {
  await expect
    .poll(
      async () => {
        const antes = await page.evaluate(() =>
          Math.round(window.scrollY + (document.querySelector('main')?.scrollTop ?? 0)),
        )
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        const despues = await page.evaluate(() =>
          Math.round(window.scrollY + (document.querySelector('main')?.scrollTop ?? 0)),
        )
        return antes === despues
      },
      { timeout: 5000 },
    )
    .toBe(true)
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
// EL CONTRATO DE LA #53, REAPUNTADO POR LA #62
//
// De dónde salió: investigando el intermitente histórico de
// `apple-finder.spec.ts` se midió que la capa del aviso —`fixed`, de ancho
// completo, 221 px de alto— cubría el botón «Continuar» del asistente **al
// 100 %** a 1280×720 y a 1366×768, aunque el panel visible quedase a 199 px de
// distancia. `document.elementFromPoint` devolvía la capa en los cinco puntos
// del botón, y una pulsación real no cambiaba de pregunta. El teclado, en
// cambio, sí podía enfocarlo: dos modos de entrada en contradicción.
//
// Aquellos dos casos colocaban a propósito un CTA DEBAJO de la banda fija para
// demostrar que la zona transparente no capturaba el puntero. La #62 elimina
// por construcción esa superposición —el aviso ya no flota en ninguna de las
// dos superficies—, así que esa precondición ya no representa una situación
// posible y mantenerla habría exigido conservar el solape a propósito.
//
// Lo que se protege ahora es el CONTRATO, no la maqueta que lo originó:
//   - ningún punto visible de un interactivo ajeno lo recibe el aviso
//     (los casos de geometría de más abajo, en las dos superficies);
//   - una pulsación física sobre un control de la página funciona sin cerrar
//     antes el aviso;
//   - el propio aviso sigue respondiendo a pulsaciones físicas;
//   - no es modal: ni `aria-modal`, ni fondo que cubra la página, ni trampa de
//     foco.
// ---------------------------------------------------------------------------
for (const ventana of [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
]) {
  test(`el aviso responde a pulsaciones físicas sin volverse modal a ${ventana.width}×${ventana.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(ventana)
    await page.goto('./')
    const aviso = page.locator('[data-favorite-store-prompt]')
    await expect(aviso).toBeVisible({ timeout: 5000 })

    // NO ES MODAL: sin `aria-modal`, sin fondo que cubra la página y sin
    // atrapar el foco. Es lo que permite que la página siga siendo usable.
    const panel = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
    await expect(panel).toHaveAttribute('aria-modal', 'false')
    await expect(page.locator('[aria-modal="true"]')).toHaveCount(0)

    const tapa = await page.evaluate(() => {
      const capa = document.querySelector('[data-favorite-store-prompt]')!
      // ¿Algo del aviso cubre la ventana entera haciendo de fondo?
      return [...capa.querySelectorAll('*'), capa].some((el) => {
        const r = el.getBoundingClientRect()
        return r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9
      })
    })
    expect(tapa, 'el aviso no puede desplegar un fondo que cubra la página').toBe(false)

    // El foco arranca en el botón de cerrar; tabulando se puede salir del
    // aviso. Si estuviera atrapado, daría vueltas dentro para siempre.
    let salio = false
    for (let i = 0; i < 6 && !salio; i++) {
      await page.keyboard.press('Tab')
      salio = await page.evaluate(() => !document.activeElement?.closest('[data-favorite-store-prompt]'))
    }
    expect(salio, 'el foco tiene que poder salir del aviso con el tabulador').toBe(true)

    // Y EL AVISO SIGUE SIENDO PULSABLE: es el contrapeso del arreglo contrario
    // —dejarlo sin puntero— que también pasaría las pruebas de geometría.
    const elegir = page.getByRole('button', { name: 'Elegir tienda', exact: true })
    await pulsarConElRaton(page, (await elegir.boundingBox())!)
    const primera = panel.getByRole('button', { name: /Banana Triana/ })
    await expect(primera, 'la pulsación física sobre «Elegir tienda» debe abrir la lista').toBeVisible()

    await pulsarConElRaton(page, (await primera.boundingBox())!)
    await expect(aviso, 'elegir tienda con una pulsación física debe cerrar el aviso').toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('banana:favorite-store'))).toBe('triana')
  })
}

test('«Ahora no» responde a una pulsación física y no deja rastro personal', async ({ page }) => {
  await page.goto('./')
  const aviso = page.locator('[data-favorite-store-prompt]')
  await expect(aviso).toBeVisible({ timeout: 5000 })

  const ahoraNo = page.getByRole('button', { name: /Ahora no/i })
  await pulsarConElRaton(page, (await ahoraNo.boundingBox())!)
  await expect(aviso, 'el panel del aviso debe seguir siendo interactivo').toHaveCount(0)

  const guardado = await page.evaluate(() => ({
    prompt: localStorage.getItem('banana:favorite-store-prompt'),
    fav: localStorage.getItem('banana:favorite-store'),
  }))
  expect(guardado.prompt).toBe('dismissed')
  expect(guardado.fav).toBeNull()
})

// ---------------------------------------------------------------------------
// El PANEL VISIBLE tampoco puede colocarse encima del contenido.
//
// La #53 arregló la banda transparente de la capa exterior. Quedaba la otra
// mitad: el panel opaco, de 448 px de ancho y 237 de alto, se ponía delante de
// Inicio. Medido sobre `c0cce5c`, primera visita, `elementFromPoint` en el
// centro de cada interactivo:
//
//   app 320×568 · panel 248→484 (42 % del alto) · «Empezar» secuestrado
//   app 375×812 · panel 492→728 · «Ver más», dos tarjetas y sus dos favoritos
//   app 390×844 · panel 524→760 · dos tarjetas y sus dos favoritos
//
// En la web pasaba lo mismo en la PRIMERA VISTA, sin desplazar nada:
//
//   web  390×844 · panel 588→824 · los cuatro puntos del carrusel del hero
//   web 1280×800 · panel 580→768 · los cuatro puntos del carrusel del hero
//
// Y estaba comprobado que el toque se perdía: con el aviso abierto, pulsar el
// punto del tercer slide no cambiaba de slide; descartando el aviso, el mismo
// punto sí lo cambiaba.
//
// Y al final del documento había además interactivos que NO se despejaban por
// mucho que se desplazara, porque el aviso viajaba con el borde de la ventana:
//
//   web 1280×800 al fondo · «Plan Renove», «Seguimiento de pedido», «Servicio técnico»
//   web  320×568 al fondo · dos preguntas del acordeón
//   app  390×844 al fondo · «Soporte» y «Chatea con Bananito»
//
// La propiedad es una sola y vale para las dos superficies: con el aviso
// abierto, ningún interactivo VISIBLE tiene su punto de acción secuestrado. Se
// comprueba en la primera vista y también al final del documento, que era donde
// el fallo no tenía salida.
// ---------------------------------------------------------------------------
for (const ventana of [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
]) {
  test(`en la app el aviso no se pone delante de Inicio a ${ventana.width}×${ventana.height}`, async ({ page }) => {
    await simularApp(page)
    await page.setViewportSize(ventana)
    await page.goto('./')
    await expect(page.locator('[data-favorite-store-prompt]')).toBeVisible({ timeout: 5000 })
    await esperarAQueSeAsiente(page)

    const radiografia = await radiografiaDelAviso(page)
    expect(radiografia, 'sin aviso en pantalla no hay nada que medir').not.toBeNull()

    // Precondiciones. Sin ellas la comprobación de abajo pasaría también con el
    // aviso cerrado o con una portada vacía, que es justo lo que no queremos.
    expect(radiografia!.altoPanel, 'el aviso tiene que ocupar una banda real').toBeGreaterThan(120)
    expect(radiografia!.visibles, 'Inicio tiene que ofrecer interactivos a la vista').toBeGreaterThan(3)

    // La propiedad: el contenido termina donde empieza el aviso, así que no
    // queda sitio físico donde uno pueda taparse con el otro.
    expect(
      radiografia!.fondoDelMain,
      `el contenido llega hasta ${radiografia!.fondoDelMain} y el aviso empieza en ${radiografia!.topPanel}`,
    ).toBeLessThanOrEqual(radiografia!.topPanel + 1)

    expect(
      radiografia!.secuestrados,
      `el aviso se queda el punto de acción de: ${radiografia!.secuestrados.join(' · ')}`,
    ).toEqual([])
  })
}

test('en la app se puede pulsar el CTA de Inicio con el aviso abierto a 320×568', async ({ page }) => {
  await simularApp(page)
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('./')
  await expect(page.locator('[data-favorite-store-prompt]')).toBeVisible({ timeout: 5000 })

  // El CTA del asistente: el que se midió secuestrado a esta anchura.
  const cta = page.getByRole('link', { name: 'Empezar' })
  await cta.scrollIntoViewIfNeeded()
  await esperarAQueSeAsiente(page)

  const caja = await cta.boundingBox()
  expect(caja, 'sin caja del CTA no hay nada que medir').not.toBeNull()

  // Hit-testing real antes de tocar nada: quién recibe el punto central.
  const quienRecibe = await page.evaluate((c) => {
    const enElPunto = document.elementFromPoint(c!.x + c!.width / 2, c!.y + c!.height / 2)
    if (enElPunto?.closest('[data-favorite-store-prompt]')) return 'el aviso'
    return enElPunto?.closest('a[href]') ? 'el CTA' : (enElPunto?.tagName ?? 'nadie')
  }, caja)
  expect(quienRecibe, 'el punto del CTA no puede recibirlo el aviso').toBe('el CTA')

  // Y la pulsación física navega de verdad.
  await pulsarConElRaton(page, caja!)
  await expect(page).toHaveURL(/\/elige-tu-apple$/)

  // El contrapeso de siempre: dejar el aviso sin puntero también pasaría lo
  // anterior, así que su panel tiene que seguir respondiendo.
  const cerrar = page.getByRole('button', { name: /Ahora no/i })
  const cajaCerrar = await cerrar.boundingBox()
  expect(cajaCerrar, 'sin caja del botón del panel no hay nada que medir').not.toBeNull()
  await pulsarConElRaton(page, cajaCerrar!)
  await expect(page.locator('[data-favorite-store-prompt]')).toHaveCount(0)
})

for (const ventana of [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`en la web el aviso no se pone delante de Inicio a ${ventana.width}×${ventana.height}`, async ({ page }) => {
    await page.setViewportSize(ventana)
    await page.goto('./')
    await expect(page.locator('[data-favorite-store-prompt]')).toBeVisible({ timeout: 5000 })
    await esperarAQueSeAsiente(page)

    // PRIMERA VISTA, sin desplazar nada: es donde se perdían los toques sobre
    // los puntos del carrusel del hero.
    const arriba = await radiografiaDelAviso(page)
    expect(arriba, 'sin aviso en pantalla no hay nada que medir').not.toBeNull()
    expect(arriba!.altoPanel, 'el aviso tiene que ocupar una banda real').toBeGreaterThan(120)
    expect(arriba!.visibles, 'Inicio tiene que ofrecer interactivos a la vista').toBeGreaterThan(3)
    expect(
      arriba!.secuestrados,
      `en la primera vista el aviso se queda el punto de acción de: ${arriba!.secuestrados.join(' · ')}`,
    ).toEqual([])

    // Y al final del documento, que era el caso sin salida: ahí ya no queda
    // ningún desplazamiento que despeje lo que hubiera quedado debajo.
    await page.evaluate(() => {
      const raiz = document.scrollingElement ?? document.documentElement
      raiz.scrollTop = raiz.scrollHeight
    })
    await esperarAQueSeAsiente(page)

    const abajo = await radiografiaDelAviso(page)
    expect(abajo!.visibles, 'el final de la página tiene que ofrecer interactivos').toBeGreaterThan(0)
    expect(abajo!.secuestrados, `al final del documento el aviso se queda: ${abajo!.secuestrados.join(' · ')}`).toEqual(
      [],
    )
  })
}

test('en la web se puede pulsar un control de la página con el aviso abierto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  const aviso = page.locator('[data-favorite-store-prompt]')
  await expect(aviso).toBeVisible({ timeout: 5000 })

  // El punto del tercer slide: uno de los que se midieron secuestrados, y el
  // que se comprobó que no respondía a la pulsación.
  const punto = page.locator('[aria-label^="Ir al slide 3"]')
  await punto.scrollIntoViewIfNeeded()
  await esperarAQueSeAsiente(page)

  // El aviso sigue abierto y ya no viaja con la ventana: comprobamos que quien
  // recibe el punto es el control, no él.
  await expect(aviso, 'el aviso no puede haberse cerrado solo').toHaveCount(1)
  const caja = await punto.boundingBox()
  const quienRecibe = await page.evaluate((c) => {
    const enElPunto = document.elementFromPoint(c!.x + c!.width / 2, c!.y + c!.height / 2)
    if (enElPunto?.closest('[data-favorite-store-prompt]')) return 'el aviso'
    return enElPunto?.closest('[aria-label^="Ir al slide"]') ? 'el control' : (enElPunto?.tagName ?? 'nadie')
  }, caja)
  expect(quienRecibe, 'el punto del control no puede recibirlo el aviso').toBe('el control')

  // Y la pulsación física cambia de slide de verdad, sin cerrar antes el aviso.
  await pulsarConElRaton(page, caja!)
  await expect(punto, 'la pulsación física debe activar el tercer slide').toHaveAttribute('aria-current', 'true')
  await expect(aviso, 'el aviso sigue abierto: no se cierra al tocar fuera').toHaveCount(1)
})

// ---------------------------------------------------------------------------
// EL ESTADO EXPANDIDO, QUE ES DONDE EL AVISO PESA DE VERDAD
//
// Al pulsar «Elegir tienda» el panel pasa a llevar cinco fichas de tienda. Con
// el aviso ya integrado en la columna de la app, medido a 320×568 sin techo:
//
//   aviso  64→995 (931 px de alto)
//   main   64→64  (cero: el contenido desaparecía)
//   barra  995→1059, fuera de una ventana de 568
//
// Y no había forma de alcanzarla: en la app `html` y `body` llevan
// `overflow: hidden`, así que ningún gesto desplaza el documento. `body` tenía
// 1059 px de `scrollHeight` sobre 568 de `clientHeight` y aun así era
// inmovible; sólo un `scrollIntoView` por código llegaba, que es justo lo que un
// dedo no puede hacer.
//
// Por eso la lista se desplaza SOLA aquí: con la rueda encima de ella, nunca
// con `scrollIntoViewIfNeeded`, que enmascararía exactamente este fallo.
// ---------------------------------------------------------------------------
test('en la app la lista de tiendas expandida cabe y se recorre entera a 320×568', async ({ page }) => {
  await simularApp(page)
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('./')
  const aviso = page.locator('[data-favorite-store-prompt]')
  await expect(aviso).toBeVisible({ timeout: 5000 })

  await pulsarConElRaton(page, (await page.getByRole('button', { name: 'Elegir tienda', exact: true }).boundingBox())!)
  const fichas = page.locator('[data-favorite-store-prompt] li button')
  await expect(fichas).toHaveCount(5)
  await esperarAQueSeAsiente(page)

  const marco = await page.evaluate(() => {
    const caja = (sel: string) => {
      const r = document.querySelector(sel)!.getBoundingClientRect()
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) }
    }
    const barra = caja('[data-app-tab-bar]')
    const lista = document.querySelector('[data-favorite-store-prompt] ul')!
    const principal = document.querySelector('main')!
    return {
      ventana: window.innerHeight,
      barra,
      barraDentro: barra.top >= 0 && barra.bottom <= window.innerHeight,
      // El punto de la barra lo tiene que recibir la barra, no el aviso.
      barraAlcanzable: Boolean(
        document.elementFromPoint(window.innerWidth / 2, barra.top + 10)?.closest('[data-app-tab-bar]'),
      ),
      recorridoDeLaLista: lista.scrollHeight - lista.clientHeight,
      mainSigueSiendoElScroll: getComputedStyle(principal).overflowY === 'auto' && principal.clientHeight > 0,
      documentoQuieto:
        (document.scrollingElement ?? document.documentElement).scrollHeight - document.documentElement.clientHeight,
      desbordeHorizontal:
        (document.scrollingElement ?? document.documentElement).scrollWidth - document.documentElement.clientWidth,
    }
  })

  expect(
    marco.barraDentro,
    `la barra de pestañas quedó en ${marco.barra.top}→${marco.barra.bottom} de ${marco.ventana}`,
  ).toBe(true)
  expect(marco.barraAlcanzable, 'el punto de la barra de pestañas no puede recibirlo el aviso').toBe(true)
  expect(marco.recorridoDeLaLista, 'la lista tiene que poder desplazarse dentro de sí misma').toBeGreaterThan(0)
  expect(marco.mainSigueSiendoElScroll, 'main tiene que seguir siendo el scroll del contenido, con sitio').toBe(true)
  expect(marco.documentoQuieto, 'el documento nativo no se desplaza').toBe(0)
  expect(marco.desbordeHorizontal, 'sin scroll horizontal').toBeLessThanOrEqual(1)

  // La primera ficha se alcanza sin tocar nada.
  const primera = fichas.first()
  const cajaPrimera = await primera.boundingBox()
  const recibePrimera = await page.evaluate((c) => {
    const en = document.elementFromPoint(c!.x + c!.width / 2, c!.y + c!.height / 2)
    return Boolean(en?.closest('[data-favorite-store-prompt] li button'))
  }, cajaPrimera)
  expect(recibePrimera, 'la primera ficha tiene que estar a la vista y recibir su punto').toBe(true)

  // Y la última, desplazando la lista con la rueda: un gesto, no una llamada.
  const cajaLista = (await page.locator('[data-favorite-store-prompt] ul').boundingBox())!
  await page.mouse.move(cajaLista.x + cajaLista.width / 2, cajaLista.y + cajaLista.height / 2)
  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 200)
        const c = await fichas.last().boundingBox()
        if (!c) return false
        return page.evaluate((caja) => {
          const en = document.elementFromPoint(caja!.x + caja!.width / 2, caja!.y + caja!.height / 2)
          return Boolean(en?.closest('[data-favorite-store-prompt] li button'))
        }, c)
      },
      { timeout: 10_000 },
    )
    .toBe(true)

  await pulsarConElRaton(page, (await fichas.last().boundingBox())!)
  await expect(aviso, 'elegir la última tienda cierra el aviso').toHaveCount(0)
  const guardado = await page.evaluate(() => ({
    fav: localStorage.getItem('banana:favorite-store'),
    personales: Object.keys(localStorage).some((k) => /email|coords|location|user/i.test(k)),
  }))
  expect(guardado.fav, 'se guarda el slug de la última tienda').toBe('safari')
  expect(guardado.personales, 'no se guarda ningún dato personal').toBe(false)
})

test('en la app la lista expandida se cierra con Escape a 320×568', async ({ page }) => {
  await simularApp(page)
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('./')
  const aviso = page.locator('[data-favorite-store-prompt]')
  await expect(aviso).toBeVisible({ timeout: 5000 })

  await pulsarConElRaton(page, (await page.getByRole('button', { name: 'Elegir tienda', exact: true }).boundingBox())!)
  await expect(page.locator('[data-favorite-store-prompt] li button')).toHaveCount(5)

  await page.keyboard.press('Escape')
  await expect(aviso, 'Escape cierra el aviso también con la lista abierta').toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('banana:favorite-store'))).toBeNull()

  // La barra de pestañas sigue en su sitio después de cerrarse.
  const barra = await page.locator('[data-app-tab-bar]').boundingBox()
  expect(barra!.y + barra!.height, 'la barra vuelve a apoyarse en el borde inferior').toBeLessThanOrEqual(569)
})

// ---------------------------------------------------------------------------
// APARECER NO PUEDE MOVER A LA PERSONA DE SITIO
//
// Regresión de esta misma PR, encontrada al revisarla. `focus()` arrastra el
// elemento al viewport si está fuera. Mientras el aviso flotaba pegado a la
// ventana eso no podía pasar: siempre estaba en pantalla. Al pasar a ocupar su
// banda —en la web, antes de `main`— puede quedar muy por encima de lo que se
// está leyendo, y tomar el foco devolvía la página arriba del todo. Medido
// dejando que el desplazamiento se asiente, con `html { scroll-behavior:
// smooth }` animando además el tirón:
//
//   /  390×844 · scrollY 2100 → 0
//   / 1280×800 · scrollY 2100 → 0
//
// Lo que se comprueba aquí es lo que la persona nota: que lo que está mirando
// no se mueva. No se mira `scrollY` a secas porque el navegador lo ajusta a
// propósito al insertarse la banda por encima —anclaje de desplazamiento—, y
// ese ajuste es justo lo que mantiene la vista quieta.
// ---------------------------------------------------------------------------
for (const ventana of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`el aviso no mueve la página al aparecer con alguien desplazado a ${ventana.width}×${ventana.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(ventana)
    await page.goto('./')

    // Desplazarse ANTES de que aparezca, con la rueda: un gesto, no una llamada.
    await page.mouse.move(ventana.width / 2, ventana.height / 2)
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 300)
    await esperarAQueSeAsiente(page)

    // Se toma como referencia lo que hay en el centro de la pantalla: si al
    // aparecer el aviso eso sigue donde estaba, la persona no ha notado nada.
    const antes = await page.evaluate(
      ([w, h]) => {
        const referencia = document.elementFromPoint(w / 2, h / 2)!
        ;(window as unknown as { __referencia?: Element }).__referencia = referencia
        return {
          top: Math.round(referencia.getBoundingClientRect().top),
          // El contenido entero, que es lo que la banda empuja. Se mide aparte
          // porque la referencia del centro es la que toque, y en la portada
          // puede caer dentro de un bloque con animación de entrada: sus
          // décimas de píxel no son del aviso y no deben contaminar la cota.
          contenido: document.querySelector('main')!.getBoundingClientRect().top,
          y: Math.round(window.scrollY),
        }
      },
      [ventana.width, ventana.height],
    )
    expect(antes.y, 'la prueba necesita estar lejos del principio de la página').toBeGreaterThan(600)

    await expect(page.locator('[data-favorite-store-prompt]')).toBeVisible({ timeout: 5000 })
    await esperarAQueSeAsiente(page)

    const despues = await page.evaluate(() => {
      const referencia = (window as unknown as { __referencia: Element }).__referencia
      const caja = referencia.getBoundingClientRect()
      const banda = document.querySelector('[data-favorite-store-prompt]')!.getBoundingClientRect()
      const activo = document.activeElement
      return {
        top: Math.round(caja.top),
        contenido: document.querySelector('main')!.getBoundingClientRect().top,
        y: Math.round(window.scrollY),
        sigueEnPantalla: caja.bottom > 0 && caja.top < window.innerHeight,
        // La banda EXTERIOR, que es la que entra en el flujo y empuja: incluye
        // sus paddings. El panel de dentro mide menos y no serviría de cota.
        altoBanda: banda.height,
        focoEnElAviso: Boolean(activo?.closest('[data-favorite-store-prompt]')),
      }
    })

    // LO QUE SE EXIGE ES UNA PROPIEDAD, NO UN NÚMERO AFINADO
    //
    // Con el fallo, la referencia acababa a 2608 px de una ventana de 844: no
    // es que se moviera un poco, es que desaparecía de la pantalla.
    expect(
      despues.sigueEnPantalla,
      `lo que se estaba mirando salió de la pantalla: de ${antes.top} a ${despues.top} (scrollY ${antes.y} → ${despues.y})`,
    ).toBe(true)

    // Y el contenido no cede más sitio del que la propia banda acaba de ocupar.
    //
    // Cuánto se mueve depende de si el navegador aplica anclaje de
    // desplazamiento, y eso no es determinista: cuando lo aplica sube `scrollY`
    // el alto de la banda y no se ve moverse nada; cuando no lo aplica,
    // `scrollY` se queda quieto y el contenido baja justo una banda —256 px
    // medidos en CI con una banda de ~265—. Las dos cosas son correctas y en
    // ninguna se cede un píxel de más.
    //
    // La cota sale del alto real de la banda. Un cuarto de pantalla —lo que
    // había antes— era MÁS ESTRICTO que el propio mecanismo: 211 px de tope
    // contra una banda de 265, así que la prueba era intermitente por
    // construcción.
    const cedido = Math.abs(despues.contenido - antes.contenido)
    expect(
      cedido,
      `el contenido cedió ${cedido.toFixed(1)} px, más que la banda insertada (${despues.altoBanda.toFixed(1)} px), con scrollY ${antes.y} → ${despues.y}`,
    ).toBeLessThanOrEqual(despues.altoBanda + 1)

    expect(despues.focoEnElAviso, 'el aviso no puede reclamar el foco estando fuera de la vista').toBe(false)

    // Y sigue siendo alcanzable: está ahí arriba, esperando.
    await expect(page.locator('[data-favorite-store-prompt]')).toHaveCount(1)
  })
}

test('el aviso sí toma el foco cuando aparece a la vista', async ({ page }) => {
  // El contrapeso del caso anterior: quitar el foco del todo también lo pasaría.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await expect(page.locator('[data-favorite-store-prompt]')).toBeVisible({ timeout: 5000 })
  await esperarAQueSeAsiente(page)

  const estado = await page.evaluate(() => {
    const activo = document.activeElement
    const boton = document.querySelector('[data-favorite-store-prompt] button[aria-label^="Cerrar"]')!
    const caja = boton.getBoundingClientRect()
    return {
      focoEnElBoton: activo === boton,
      aLaVista: caja.bottom > 0 && caja.top < window.innerHeight,
      y: Math.round(window.scrollY),
    }
  })
  expect(estado.aLaVista, 'a esta altura el aviso tiene que estar a la vista').toBe(true)
  expect(estado.focoEnElBoton, 'estando a la vista, el aviso sí reclama el foco').toBe(true)
  expect(estado.y, 'y no ha hecho falta mover la página').toBe(0)
})

// ============================================================================
// EL AVISO APARECE, PERO NO LE QUITA EL FOCO A NADIE.
//
// A11Y-003 arregló que el aviso robara el foco a un diálogo abierto, y lo hizo
// vigilando `[role="dialog"][aria-modal="true"]`. Durante la búsqueda el aviso
// sí queda suspendido, aunque no por la superficie que se ve: la rama de
// escritorio —`xl:block`— NO lleva esa semántica. Con `searchOpen` activo,
// `Header` mantiene montada además la rama móvil, que sí es `aria-modal`; en
// escritorio está oculta con `xl:hidden` pero sigue en el DOM, y la guarda mira
// presencia y no visibilidad, así que basta para suspenderlo.
//
// El hueco está en el instante siguiente: al cerrar, ese nodo desaparece con el
// resto y el aviso puede montarse. Al cerrar el buscador con Escape:
//
//   0 ms   el buscador se desmonta, el foco cae en `body`
//   25 ms  el buscador lo devuelve a la lupa           ← correcto
//  ~700 ms el aviso se monta y se lo lleva a su «Cerrar» ← el defecto
//
// Medido cinco veces seguidas, siempre igual. En CI la restauración compite con
// ese autofoco y `search.spec.ts:347` fallaba de forma intermitente.
//
// La regla que se protege es de producto y no depende del buscador: un aviso no
// modal puede presentarse, pero no interrumpe a quien ya está en algo.
// ============================================================================
test.describe('el aviso no interrumpe a quien está usando la página', () => {
  test('no le quita el foco a la lupa después de cerrar el buscador', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await page.goto('./')

    const lupa = page.getByRole('button', { name: 'Buscar', exact: true }).first()
    await lupa.click()
    const input = page.locator('[data-testid="header-search-input"]:visible')
    await input.fill('AirPods')
    await expect(page.getByRole('option').first()).toBeVisible()
    await input.press('ArrowDown')
    await input.press('Escape')

    // El buscador hace su parte: devuelve el foco a quien lo abrió.
    await expect(lupa, 'el buscador restaura el foco al cerrarse').toBeFocused()

    // Y ahora llega el aviso. Se espera AL AVISO, no a un tiempo inventado.
    const aviso = page.locator('[data-favorite-store-prompt]')
    await expect(aviso, 'el aviso acaba apareciendo por su cuenta').toBeVisible({ timeout: 5000 })

    // Aparecer sí; interrumpir no.
    await expect(lupa, 'y aparecer no es motivo para quitarle el foco a nadie').toBeFocused()

    // Y si no lo tomó, tampoco lo mueve al marcharse. Se descarta con Escape
    // —que el propio aviso escucha— en vez de pulsando «Ahora no»: pulsar con
    // el ratón mueve el foco a ese botón, y entonces la comprobación hablaría
    // del ratón y no de lo que hace el aviso al desmontarse.
    await page.keyboard.press('Escape')
    await expect(aviso).toHaveCount(0)
    await expect(lupa, 'al marcharse no arrastra el foco de nadie').toBeFocused()
  })

  test('sí toma el foco cuando nadie está usando nada', async ({ page }) => {
    // El contrato de A11Y-003 que NO debe romperse: en una visita en la que
    // nadie ha interactuado, el aviso sigue pudiendo empezar enfocado.
    await page.setViewportSize({ width: 1366, height: 900 })
    await page.goto('./')

    const cerrar = page.getByRole('button', { name: 'Cerrar aviso de tienda favorita' })
    await expect(cerrar).toBeVisible({ timeout: 5000 })
    await expect(cerrar, 'sin nadie a quien interrumpir, el aviso se presenta').toBeFocused()
  })
})
