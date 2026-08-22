import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// La app nativa como tienda: portada comercial, historial de vistos y la barra
// de compra conviviendo con la navegación inferior.
//
// La portada comercial vive en `/tienda` desde la PR #41. Antes ocupaba `/`,
// que ahora es Inicio —mi relación con Banana—; lo que se prueba aquí no ha
// cambiado, sólo la dirección por la que se llega.
//
// Se simula el binario igual que en `app-shell.spec.ts`: Capacitor inyecta
// `window.Capacitor` antes del bundle y `addInitScript` corre en ese mismo
// momento, así que se recorre el mismo camino de código.
// ============================================================================

async function comoApp(page: Page, recientes?: string[]) {
  await page.addInitScript((lista) => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    if (lista) localStorage.setItem('banana:recientes', JSON.stringify(lista))
  }, recientes)
}

test.describe('portada de la tienda', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  // QUÉ CAMBIÓ AQUÍ, Y POR QUÉ
  //
  // La PR #56 retiró de Tienda el hero de producto, la rejilla «Compra por
  // categoría», los vistos recientes y la tienda favorita. Los tres últimos
  // porque ya viven en Inicio o en los chips de la barra; el hero porque ocupaba
  // media pantalla, convertía el nombre de un producto en el `h1` de la sección
  // y repetía Oportunidades.
  //
  // Los casos que exigían aquellas piezas no se borran: se reformulan a la
  // propiedad que de verdad protegían —que Tienda empieza por comercio y los
  // servicios quedan al final, y que desde Tienda se llega a una familia—. Lo
  // que era del historial pasa a Inicio, que es donde vive ahora, y lo cubre
  // `inicio-nativo.spec.ts`.

  test('empieza por producto, no por servicios corporativos', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    const oportunidades = page.getByRole('heading', { name: 'Oportunidades' })
    const servicios = page.getByRole('heading', { name: 'Servicios y ayuda' })
    await expect(oportunidades).toBeVisible()
    await expect(servicios).toBeVisible()

    const yProducto = (await oportunidades.boundingBox())!.y
    const yServicios = (await servicios.boundingBox())!.y
    expect(yServicios, 'los servicios van por debajo del producto').toBeGreaterThan(yProducto)
  })

  test('las tarjetas de oferta llevan a la ficha de su variante', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    await page.getByRole('list', { name: 'Oportunidades' }).getByRole('link').first().click()
    await expect(page).toHaveURL(/\/pagina-banana\/[a-z-]+\/[a-z0-9-]+\/[a-z0-9-]+/)
  })

  test('las categorías llevan a su familia', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    // Desde los chips de la barra, que es la única superficie de categorías
    // desde la #56.
    await page
      .getByRole('navigation', { name: 'Categorías' })
      .getByRole('link', { name: 'iPhone', exact: true })
      .click()
    await expect(page).toHaveURL(/\/pagina-banana\/iphone$/)
  })

  test('un historial corrupto no rompe la app', async ({ page }) => {
    // La propiedad sigue viva, pero el historial se pinta en Inicio.
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
      localStorage.setItem('banana:recientes', 'esto no es json')
    })
    await page.goto('./')

    await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Continúa donde lo dejaste' })).toHaveCount(0)
  })

  test('visitar una ficha la añade al historial', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone/17-pro/256gb-plata')
    await expect(page.getByRole('heading', { level: 1, name: 'iPhone 17 Pro' })).toBeVisible()

    // Se anota al resolverse la ficha, así que un enlace directo cuenta igual
    // que llegar pulsando una tarjeta.
    await expect.poll(() => page.evaluate(() => localStorage.getItem('banana:recientes'))).toContain('iphone/17-pro')

    // El historial se pinta en Inicio, que es donde el cliente lo retoma.
    await page.goto('./')
    const recientes = page.getByRole('list', { name: 'Continúa donde lo dejaste' })
    await expect(recientes.getByRole('link', { name: /iPhone 17 Pro/ })).toBeVisible()
  })
})

test.describe('barra de compra y navegación inferior', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('en la app la barra de compra queda encima de la navegación, sin taparse', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone/17-pro/256gb-plata')

    // La barra aparece al pasar la caja de compra principal. En la app el que
    // se desplaza es `#contenido`, no la ventana (ver `Layout`), así que hay
    // que moverlo a él y no con la rueda del ratón.
    await page.locator('#contenido').evaluate((el) => el.scrollTo({ top: 3000 }))
    const barra = page.locator('[data-buy-bar]')
    await expect(barra).toBeVisible()

    const nav = page.locator('[data-app-tab-bar]')
    const topeNav = Math.round((await nav.boundingBox())!.y)

    // El borde inferior de la barra de compra no puede invadir la navegación.
    //
    // Se mide con `poll` y no de una vez porque la barra entra con una
    // animación de muelle: medir antes de que se asiente devuelve la posición
    // de salida, 80 px más abajo, y daría un fallo que no existe.
    await expect
      .poll(
        async () => {
          const caja = (await barra.boundingBox())!
          return Math.round(caja.y + caja.height)
        },
        { message: 'la barra de compra se solapa con la navegación inferior' },
      )
      .toBeLessThanOrEqual(topeNav + 1)
  })

  test('en el navegador móvil la barra sigue abajo del todo', async ({ page }) => {
    // Sin Capacitor: es la web móvil, donde no hay navegación inferior.
    await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
    await page.goto('./iphone/17-pro/256gb-plata')
    await page.mouse.wheel(0, 3000)

    const barra = page.locator('[data-buy-bar]')
    await expect(barra).toBeVisible()
    await expect(page.locator('[data-app-tab-bar]'), 'la web no tiene navegación inferior').toHaveCount(0)

    const caja = (await barra.boundingBox())!
    const alto = page.viewportSize()!.height
    expect(Math.round(caja.y + caja.height), 'debe quedar pegada al borde inferior').toBeGreaterThanOrEqual(alto - 2)
  })
})

// ============================================================================
// La barra de compra CABE en la pantalla, y se mide LA BARRA.
//
// POR QUÉ NO SIRVE LO QUE YA HABÍA
//
// `anchos.spec.ts` mide `documentElement` y `#contenido`. Esta barra es
// `position: fixed`: no cuelga de `#contenido` y el armazón la recorta, así que
// las dos medidas siguen valiendo lo mismo que el viewport mientras «Comprar»
// se sale por la derecha. Medido en `main` (`2a69349f`) a 320×568:
// `documentElement` 320/320, `#contenido` 320/320 y la barra 339/320. Un fallo
// visible que las dos comprobaciones habituales aprueban.
//
// De ahí UI-002. Aquí se mide la barra y sus hijos, que es donde está.
//
// QUÉ SE AFIRMA, Y POR QUÉ ASÍ
//
// Contratos relativos, nunca posiciones ni anchos de diseño: un `x === 208`
// convertiría cualquier retoque tipográfico en un rojo falso. Se comprueba que
// la barra no desborda, que cada hijo queda dentro de ella, que no se pisan
// entre sí y que conservan el objetivo táctil. La tolerancia de 2 px es la
// misma que usa `anchos.spec.ts`, y por el mismo motivo: el subpíxel.
// ============================================================================

const TOLERANCIA_CTA = 2
const OBJETIVO_TACTIL = 44

/** Deja la barra de compra a la vista y esperada a que el muelle se asiente. */
async function barraDeCompra(page: Page) {
  // En la app el que se desplaza es `#contenido`, no la ventana.
  await page.locator('#contenido').evaluate((el) => el.scrollTo({ top: 4000 }))
  const barra = page.locator('[data-buy-bar]')
  await expect(barra).toBeVisible()
  // Entra con una animación de muelle; medir antes de que pare devuelve la
  // posición de salida. Se espera a que la caja deje de moverse.
  let previa = ''
  await expect
    .poll(async () => {
      const caja = JSON.stringify(await barra.boundingBox())
      const quieta = caja === previa
      previa = caja
      return quieta
    })
    .toBe(true)
  return barra
}

/** Geometría real de la barra y de sus hijos directos. */
async function geometriaCta(page: Page) {
  return page.evaluate(() => {
    const barra = document.querySelector('[data-buy-bar]') as HTMLElement
    const fila = barra.firstElementChild as HTMLElement
    const caja = barra.getBoundingClientRect()
    const hijos = [...fila.children].map((el) => {
      const c = el.getBoundingClientRect()
      return {
        nombre:
          (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim() || el.getAttribute('aria-label') || el.tagName,
        interactivo: el.tagName === 'BUTTON' || !!el.querySelector('button'),
        left: c.left,
        right: c.right,
        height: c.height,
      }
    })
    return {
      exceso: barra.scrollWidth - barra.clientWidth,
      left: caja.left,
      right: caja.right,
      hijos,
      viewport: window.innerWidth,
    }
  })
}

/** Las tres afirmaciones de UI-002, aplicadas a un estado concreto. */
function laCtaCabe(geo: Awaited<ReturnType<typeof geometriaCta>>, contexto: string) {
  expect(geo.exceso, `${contexto}: la barra de compra desborda ${geo.exceso}px`).toBeLessThanOrEqual(TOLERANCIA_CTA)
  expect(geo.right, `${contexto}: la barra se sale del viewport`).toBeLessThanOrEqual(geo.viewport + TOLERANCIA_CTA)

  let anterior: (typeof geo.hijos)[number] | null = null
  for (const hijo of geo.hijos) {
    expect(hijo.left, `${contexto}: "${hijo.nombre}" empieza fuera de la barra`).toBeGreaterThanOrEqual(
      geo.left - TOLERANCIA_CTA,
    )
    expect(hijo.right, `${contexto}: "${hijo.nombre}" termina fuera de la barra`).toBeLessThanOrEqual(
      geo.right + TOLERANCIA_CTA,
    )
    if (anterior) {
      expect(hijo.left, `${contexto}: "${hijo.nombre}" se pisa con "${anterior.nombre}"`).toBeGreaterThanOrEqual(
        anterior.right - TOLERANCIA_CTA,
      )
    }
    if (hijo.interactivo) {
      expect(hijo.height, `${contexto}: "${hijo.nombre}" baja del objetivo táctil`).toBeGreaterThanOrEqual(
        OBJETIVO_TACTIL,
      )
    }
    anterior = hijo
  }
}

test.describe('la barra de compra cabe en la pantalla', () => {
  // 320 es el móvil más estrecho que se soporta; 390 es el iPhone de
  // referencia. El defecto sólo aparecía en el primero, pero el segundo no
  // tenía ni un píxel de sobra, así que se vigilan los dos.
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    test.describe(`a ${viewport.width}×${viewport.height}`, () => {
      test.use({ viewport })

      // El estado que rompía: precio + «Al carrito» + «Comprar». La oferta se
      // elige a propósito porque añade la línea del precio anterior.
      test('con «Al carrito» y «Comprar» @all', async ({ page }) => {
        await comoApp(page)
        await page.goto('./iphone/17-pro/256gb-plata')
        await barraDeCompra(page)
        laCtaCabe(await geometriaCta(page), `${viewport.width}px · Al carrito + Comprar`)
      })

      // Mismo estado sin oferta: demuestra que el precio anterior no era la
      // causa, y que la solución no depende de que exista.
      test('sin precio anterior @all', async ({ page }) => {
        await comoApp(page)
        await page.goto('./iphone/17-pro/512gb-plata')
        await barraDeCompra(page)
        laCtaCabe(await geometriaCta(page), `${viewport.width}px · sin oferta`)
      })

      // Con el producto ya en el carrito, «Al carrito» deja paso al control de
      // cantidad, que no encoge. Cabía por 3,6 px: entra aquí para que ninguna
      // corrección del estado anterior se lo lleve por delante.
      test('con el control de cantidad @all', async ({ page }) => {
        await comoApp(page)
        await page.goto('./iphone/17-pro/256gb-plata')
        await page.getByRole('button', { name: 'Añadir al carrito' }).first().click()
        await barraDeCompra(page)
        laCtaCabe(await geometriaCta(page), `${viewport.width}px · control de cantidad`)
      })

      // Una variante agotada no se compra, se reserva: un solo botón.
      test('con «Reservar» @all', async ({ page }) => {
        await comoApp(page)
        await page.goto('./iphone/17-pro/1tb-azul')
        await barraDeCompra(page)
        laCtaCabe(await geometriaCta(page), `${viewport.width}px · Reservar`)
      })

      // Y en el navegador móvil, que monta LA MISMA barra.
      //
      // UI-002 se anotó como defecto exclusivo de la aplicación —«fuera del
      // binario esa barra fija no se monta»—, y no era cierto: la barra es
      // `lg:hidden`, no `isNativeApp`, y lo único que cambia entre los dos
      // armazones es de qué se cuelga por abajo (D-066). Medido sobre `main`
      // (`2a69349f`) a 320 px sin Capacitor: 339/320, los mismos 19 px y el
      // mismo «Comprar» cortado. Se vigilan los dos.
      test('también en el navegador móvil @all', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
        await page.goto('./iphone/17-pro/256gb-plata')
        // Aquí el que se desplaza es el documento, no `#contenido`.
        await page.mouse.wheel(0, 4000)
        const barra = page.locator('[data-buy-bar]')
        await expect(barra).toBeVisible()
        await expect(page.locator('[data-app-tab-bar]'), 'esto es la web').toHaveCount(0)
        laCtaCabe(await geometriaCta(page), `${viewport.width}px · web móvil`)
      })
    })
  }
})

test.describe('filtros del catálogo', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('AirPods tiene los mismos filtros que el resto de familias', async ({ page }) => {
    // Entraba por la página genérica y conservaba un filtro por tramos de
    // precio distinto, sin disponibilidad ni ordenación y sin estado en la URL.
    await comoApp(page)
    await page.goto('./airpods')

    await expect(page.getByRole('button', { name: /Filtrar/ })).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByText('Filtrar por precio'), 'el sistema antiguo debe haber desaparecido').toHaveCount(0)
  })

  test('Atrás desde una ficha devuelve el catálogo tal y como estaba', async ({ page }) => {
    // Lo que hay que demostrar es el recorrido real: filtro, entro a un
    // producto, vuelvo. Comprobar en cambio que Atrás borra los filtros no
    // probaría nada, porque los cambios de filtro se navegan con `replace` —a
    // propósito, para no meter una entrada de historial por cada toque— y ese
    // Atrás se limitaría a salir de la página.
    await comoApp(page)
    await page.goto('./airpods')

    await page.getByRole('button', { name: /Filtrar/ }).click()
    await page.getByRole('button', { name: 'Hasta 500 €' }).click()
    await page.getByRole('button', { name: /Ver \d+ modelos/ }).click()
    await page.getByRole('combobox').selectOption('precio-desc')

    await expect(page).toHaveURL(/\?precio=500&orden=precio-desc$/)
    await expect(page.getByRole('combobox')).toHaveValue('precio-desc')
    // 3 de los 4 AirPods bajan de 500 €; los Max, a 579 €, quedan fuera.
    await expect(page.getByText('3 de 4')).toBeVisible()

    // Se entra al primero de la rejilla, que con este orden es el más caro de
    // los que quedan.
    const primera = page.getByRole('link', { name: /AirPods Pro 3/ }).first()
    await primera.click()
    await expect(page.getByRole('heading', { level: 1, name: /AirPods Pro 3/ })).toBeVisible()

    await page.goBack()

    // La URL vuelve con los dos parámetros...
    await expect(page, 'Atrás recupera el catálogo que se estaba viendo').toHaveURL(/\?precio=500&orden=precio-desc$/)
    // ...y los controles vuelven a reflejarlos, que es lo que ve quien navega.
    await expect(page.getByRole('combobox')).toHaveValue('precio-desc')
    await expect(page.getByText('3 de 4'), 'el filtro de precio sigue aplicado').toBeVisible()
    await expect(page.getByRole('button', { name: /Filtrar 1/ }), 'el contador del botón sigue a 1').toBeVisible()
    await expect(page.getByRole('link', { name: /AirPods Max/ })).toHaveCount(0)
  })
})
