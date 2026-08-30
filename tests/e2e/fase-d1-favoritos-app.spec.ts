import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// FASE D1 — «FAVORITOS SE SIENTE DE APP».
//
// QUÉ CAMBIA, Y POR QUÉ
//
// El corazón está en todas las tarjetas del catálogo, que la Fase B ya dejó
// nativas. El sitio al que lleva, no: `/favoritos` devolvía composición web
// —medido en la auditoría posterior a la Fase C: 21 superficies con marco, 16
// de ellas dentro de otra, y 24 de 28 controles por debajo del mínimo táctil,
// con «Ver producto» y «Quitar» a 30 px—. Guardar un producto y volver a él
// tiene que ser una continuación de la app, no un salto a otro producto.
//
// EL CONTRATO NO ES «CERO BORDES»
//
// Cada grupo puede tener SU superficie: la lista de productos, la de avisos y
// la de notificaciones. Lo que no puede haber es la cadena
// superficie → tarjeta → caja interior → pastilla, que es lo que hoy convierte
// cada favorito en cuatro niveles de marco. Por eso los casos cuentan marcos
// ANIDADOS, no marcos.
//
// LA WEB NO CAMBIA
//
// D-086 sigue vigente. Sus casos comprueban que sigue IGUAL —su rejilla, su
// tarjeta con borde, su `<details>` de seguimiento y su `<select>` de tienda—,
// no que esté mejor. Y los cuatro casos históricos de `favorites-alerts` y los
// dos de `favorites-compare` recorren la web: si esta rama se colara allí,
// se pondrían rojos ellos solos.
//
// Se mide geometría, estilo computado y parentesco. Las clases no son el
// contrato.
// ============================================================================

const PRODUCTO = 'iPhone 17 Pro'
const OTRO = 'iPhone 17'
const TIENDA = 'Banana Triana'

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/** Favoritos sembrados antes de arrancar, con el id que usa el catálogo. */
function conFavoritos(page: Page, ids: string[] = ['iphone/17-pro', 'iphone/17']) {
  return page.addInitScript((lista) => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    localStorage.setItem('banana:fav', JSON.stringify(lista))
  }, ids)
}

/**
 * Cuenta superficies con marco y, sobre todo, cuántas viven DENTRO de otra.
 *
 * El anidamiento es la medida que importa: una superficie de grupo es
 * legítima; una tarjeta dentro de esa superficie con una caja dentro y una
 * pastilla dentro, no.
 */
async function superficies(page: Page, selector = 'main') {
  return page.evaluate((sel) => {
    const raiz = document.querySelector(sel)
    if (!raiz) return null
    // LA RAÍZ CUENTA COMO ANCESTRO.
    //
    // Con `querySelectorAll('*')` a secas, la superficie de grupo quedaba
    // fuera del conjunto y una tarjeta reintroducida DENTRO de ella no tenía
    // ningún ancestro con marco al que compararse: el caso se quedaba verde
    // con el defecto puesto. Es el mismo error de medición que la franja de la
    // Fase B2 —medir el contenedor en vez de lo que hay dentro—, y se cazó
    // porque la contraprueba no se puso roja.
    const conMarco = [raiz, ...raiz.querySelectorAll('*')].filter((e) => {
      const s = getComputedStyle(e)
      return parseFloat(s.borderTopWidth) > 0 && parseFloat(s.borderTopLeftRadius) >= 10
    })
    return {
      marcos: conMarco.length,
      anidados: conMarco.filter((e) => conMarco.some((o) => o !== e && o.contains(e))).length,
      profundidadMaxima: conMarco.reduce(
        (max, e) => Math.max(max, conMarco.filter((o) => o !== e && o.contains(e)).length),
        0,
      ),
    }
  }, selector)
}

/** Los objetivos táctiles de bloque: los que se pulsan, no los enlaces en línea. */
async function tactiles(page: Page) {
  return page.evaluate(() => {
    const chips = document.querySelector('[data-app-chips]')
    const controles = [...document.querySelectorAll('main a, main button, main input, main select')].filter((e) => {
      if (chips?.contains(e)) return false
      const r = e.getBoundingClientRect()
      if (r.height === 0) return false
      // Los enlaces dentro de un párrafo son texto, no botones: no se les
      // puede exigir 44 px sin romper la línea donde viven.
      return !getComputedStyle(e).display.includes('inline')
    })
    const pequenos = controles.filter((e) => e.getBoundingClientRect().height < 44)
    return {
      total: controles.length,
      pequenos: pequenos.length,
      cuales: pequenos.map((e) => ({
        texto: (e.getAttribute('aria-label') ?? e.textContent ?? e.tagName).trim().slice(0, 30),
        alto: Math.round(e.getBoundingClientRect().height),
      })),
    }
  })
}

/** Desplaza el contenido nativo hasta el final y mide qué queda tapado. */
async function alFinal(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ seDesplazo: boolean; enElTope: boolean; ultimo: string; libre: number }>((resolve) => {
        // EN LA APP EL SCROLL NO ES DEL DOCUMENTO, es de `main#contenido`.
        const main = document.querySelector('main') as HTMLElement
        main.scrollTop = main.scrollHeight
        setTimeout(() => {
          const tab = document.querySelector('[data-app-tab-bar]')!.getBoundingClientRect()
          const ultimo = [...document.querySelectorAll('main a, main button')].pop()!
          const r = ultimo.getBoundingClientRect()
          resolve({
            seDesplazo: main.scrollTop > 0,
            enElTope: Math.abs(main.scrollTop - (main.scrollHeight - main.clientHeight)) <= 1,
            ultimo: (ultimo.getAttribute('aria-label') ?? ultimo.textContent ?? '').trim().slice(0, 30),
            libre: Math.round(tab.top - r.bottom),
          })
        }, 350)
      }),
  )
}

// ---------------------------------------------------------------------------
// APP — composición
// ---------------------------------------------------------------------------

test.describe('la lista de favoritos nativa', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('no encierra la página en una tarjeta ni apila marcos dentro de marcos', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page)
    await page.goto('./favoritos')
    await expect(page.getByRole('heading', { name: 'Favoritos', level: 1 })).toBeVisible()

    const lista = page.locator('[data-fav-lista]')
    await expect(lista, 'la lista de favoritos tiene una superficie propia').toHaveCount(1)
    await expect(page.locator('[data-fav-item]'), 'con un elemento por producto guardado').toHaveCount(2)

    const s = (await superficies(page, '[data-fav-lista]'))!
    // Una superficie de grupo es legítima. Lo que no puede haber es la cadena
    // tarjeta → caja → pastilla dentro de ella.
    expect(s.anidados, 'ningún marco dentro de otro marco en la lista').toBe(0)

    const pagina = (await superficies(page))!
    expect(pagina.profundidadMaxima, 'como mucho un nivel de superficie en toda la pantalla').toBeLessThanOrEqual(1)
  })

  test('cada favorito enseña imagen, nombre y precio en una sola fila que lleva al producto', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page, ['iphone/17-pro'])
    await page.goto('./favoritos')

    const item = page.locator('[data-fav-item]').first()
    await expect(item.locator('img')).toBeVisible()
    await expect(item.getByRole('heading', { name: PRODUCTO })).toBeVisible()
    await expect(item.getByText(/desde .*€/)).toBeVisible()

    // Un solo enlace a la ficha: la fila entera. No una miniatura y además un
    // «Ver producto» de 30 px al lado.
    const enlaces = item.locator('a[href*="/iphone/17-pro/"]')
    await expect(enlaces, 'la fila es el único camino a la ficha').toHaveCount(1)
  })

  test('los avisos y las notificaciones se leen como listas, no como tarjetas repetidas', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page, ['iphone/17-pro'])
    await page.goto('./favoritos')
    await activarSeguimiento(page, PRODUCTO, TIENDA)

    const avisos = page.locator('[data-fav-avisos]')
    await expect(avisos).toHaveCount(1)
    expect((await superficies(page, '[data-fav-avisos]'))!.anidados, 'los avisos no anidan marcos').toBe(0)

    await avisos.getByRole('button', { name: /Simular llegada/ }).click()
    const notificaciones = page.locator('[data-fav-notificaciones]')
    await expect(notificaciones).toHaveCount(1)
    expect((await superficies(page, '[data-fav-notificaciones]'))!.anidados, 'ni las notificaciones').toBe(0)
  })

  test('el estado vacío es de app y ofrece salida al catálogo', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page, [])
    await page.goto('./favoritos')

    const vacio = page.locator('[data-fav-vacio]')
    await expect(vacio).toBeVisible()
    await expect(vacio).toContainText(/Aún no has guardado/)
    const borde = await vacio.evaluate((e) => getComputedStyle(e).borderTopStyle)
    expect(borde, 'sin el marco discontinuo de la web').not.toBe('dashed')
    await expect(vacio.getByRole('link', { name: /Explorar/ })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// APP — geometría en los tres anchos
// ---------------------------------------------------------------------------

for (const [ancho, alto] of [
  [320, 568],
  [390, 844],
  [430, 932],
] as const) {
  test.describe(`favoritos nativos a ${ancho} px`, () => {
    test.use({ viewport: { width: ancho, height: alto } })

    test('todo lo que se pulsa llega al dedo y nada desborda', async ({ page }) => {
      await comoApp(page)
      await conFavoritos(page)
      await page.goto('./favoritos')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const t = await tactiles(page)
      expect(t.pequenos, `controles por debajo de 44 px: ${JSON.stringify(t.cuales)}`).toBe(0)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, 'sin desbordamiento lateral').toBe(0)
    })

    test('la lista llega hasta el final sin quedar bajo la navegación', async ({ page }) => {
      await comoApp(page)
      await conFavoritos(page)
      await page.goto('./favoritos')
      await activarSeguimiento(page, PRODUCTO, TIENDA)

      const f = await alFinal(page)
      expect(f.seDesplazo, 'el contenedor se desplazó de verdad').toBe(true)
      expect(f.enElTope, 'y llegó al final').toBe(true)
      expect(f.libre, `«${f.ultimo}» queda por encima de la navegación`).toBeGreaterThanOrEqual(0)
    })

    test('gestionar el seguimiento despliega tiendas pulsables, sin selector de escritorio', async ({ page }) => {
      await comoApp(page)
      await conFavoritos(page, ['iphone/17-pro'])
      await page.goto('./favoritos')

      await expect(page.locator('main select'), 'la app no usa el selector de escritorio').toHaveCount(0)
      await page
        .locator('[data-fav-item]')
        .first()
        .getByRole('button', { name: /Seguir disponibilidad/ })
        .click()

      const opciones = page.locator('[data-fav-tiendas] button')
      await expect(opciones.first()).toBeVisible()
      const altos = await opciones.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))
      expect(Math.min(...altos), 'cada tienda es una fila pulsable').toBeGreaterThanOrEqual(44)
    })
  })
}

// ---------------------------------------------------------------------------
// APP — comportamiento: el dominio es el mismo, no una copia
// ---------------------------------------------------------------------------

/** Activa el seguimiento del producto en la tienda indicada, en la app. */
async function activarSeguimiento(page: Page, producto: string, tienda: string) {
  // `exact`: sin él, «iPhone 17» casa también con «iPhone 17 Pro» y el
  // localizador encuentra dos filas en vez de una.
  const item = page
    .locator('[data-fav-item]')
    .filter({ has: page.getByRole('heading', { name: producto, exact: true }) })
  await expect(item, `no se encontró la fila de ${producto}`).toHaveCount(1)
  await item.getByRole('button', { name: /Seguir disponibilidad/ }).click()
  const opcion = item.locator('[data-fav-tiendas]').getByRole('button', { name: new RegExp(tienda) })
  await expect(opcion, `dentro del desplegable hay una sola opción de ${tienda}`).toHaveCount(1)
  await opcion.click()
}

test.describe('favoritos nativos: el comportamiento no cambia', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('entrar en el producto y quitarlo de favoritos', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page)
    await page.goto('./favoritos')

    await page.locator('[data-fav-item]').first().locator('a').first().click()
    await expect(page, 'la fila lleva a la ficha').toHaveURL(/\/iphone\/17-pro\//)

    await page.goBack()
    await expect(page.locator('[data-fav-item]')).toHaveCount(2)
    await page.getByRole('button', { name: `Quitar ${PRODUCTO} de favoritos` }).click()
    await expect(page.locator('[data-fav-item]')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: OTRO })).toBeVisible()
  })

  test('activar, cambiar de tienda y desactivar el seguimiento', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page, ['iphone/17-pro'])
    await page.goto('./favoritos')

    await activarSeguimiento(page, PRODUCTO, TIENDA)
    await expect(page.locator('[data-fav-item]').first()).toContainText(/Siguiendo/)
    await expect(page.locator('[data-fav-avisos]')).toContainText(TIENDA)

    // Cambiar la tienda del aviso — el mismo `changeAlertStore` de la web.
    const aviso = page.locator('[data-fav-avisos] [data-fav-aviso]').first()
    await aviso.getByRole('button', { name: /Cambiar tienda/ }).click()
    await aviso
      .locator('[data-fav-tiendas]')
      .getByRole('button', { name: /Banana Castillo/ })
      .click()
    await expect(page.locator('[data-fav-avisos]')).toContainText('Banana Castillo')

    await aviso.getByRole('button', { name: /Desactivar/ }).click()
    await expect(page.locator('[data-fav-avisos]'), 'sin avisos, la sección desaparece').toHaveCount(0)
    await expect(page.locator('[data-fav-item]').first()).toContainText(/Seguir disponibilidad/)
  })

  test('elegir tienda de seguimiento sin tienda favorita la guarda como tal', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page, ['iphone/17-pro'])
    await page.goto('./favoritos')
    await activarSeguimiento(page, PRODUCTO, TIENDA)

    const guardada = await page.evaluate(() => localStorage.getItem('banana:favorite-store'))
    expect(guardada, 'la tienda elegida queda como favorita si no había ninguna').toContain('triana')
  })

  test('simular llegada crea la notificación, y se puede marcar leída', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page, ['iphone/17-pro'])
    await page.goto('./favoritos')
    await activarSeguimiento(page, PRODUCTO, TIENDA)

    await page
      .locator('[data-fav-avisos]')
      .getByRole('button', { name: /Simular llegada/ })
      .click()
    const notis = page.locator('[data-fav-notificaciones] [data-fav-notificacion]')
    await expect(notis).toHaveCount(1)
    await expect(notis.first()).toContainText(PRODUCTO)

    await notis
      .first()
      .getByRole('button', { name: /Marcar como leído/ })
      .click()
    await expect(notis.first().getByRole('button', { name: /Marcar como leído/ })).toHaveCount(0)
  })

  test('marcar todas como leídas', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page)
    await page.goto('./favoritos')
    await activarSeguimiento(page, PRODUCTO, TIENDA)
    await activarSeguimiento(page, OTRO, TIENDA)

    const avisos = page.locator('[data-fav-avisos]')
    await avisos
      .getByRole('button', { name: /Simular llegada/ })
      .first()
      .click()
    await avisos
      .getByRole('button', { name: /Simular llegada/ })
      .last()
      .click()
    await expect(page.locator('[data-fav-notificaciones] [data-fav-notificacion]')).toHaveCount(2)

    await page.getByRole('button', { name: /Marcar todas como leídas/ }).click()
    await expect(page.getByRole('button', { name: /Marcar como leído/ }), 'ninguna queda sin leer').toHaveCount(0)
  })

  test('quitar el último favorito deja el estado vacío', async ({ page }) => {
    await comoApp(page)
    await conFavoritos(page, ['iphone/17-pro'])
    await page.goto('./favoritos')

    await page.getByRole('button', { name: `Quitar ${PRODUCTO} de favoritos` }).click()
    await expect(page.locator('[data-fav-vacio]')).toBeVisible()
    await expect(page.locator('[data-fav-item]')).toHaveCount(0)
  })

  test('quitar un favorito con seguimiento activo no deja el aviso huérfano', async ({ page }) => {
    // CON DOS PRODUCTOS SEGUIDOS, NO CON UNO.
    //
    // Con uno solo, quitarlo deja la lista vacía y la sección de avisos
    // desaparece porque no se pinta el bloque entero: la comprobación pasaba
    // aunque el aviso siguiera vivo en almacenamiento. Siguiendo los dos y
    // quitando uno, la sección sigue en pantalla y puede decirse algo real
    // sobre lo que queda dentro.
    await comoApp(page)
    await conFavoritos(page)
    await page.goto('./favoritos')
    await activarSeguimiento(page, PRODUCTO, TIENDA)
    await activarSeguimiento(page, OTRO, TIENDA)
    await expect(page.locator('[data-fav-avisos] [data-fav-aviso]')).toHaveCount(2)

    await page.getByRole('button', { name: `Quitar ${PRODUCTO} de favoritos` }).click()
    const avisos = page.locator('[data-fav-avisos] [data-fav-aviso]')
    await expect(avisos, 'el aviso se va con el favorito').toHaveCount(1)
    await expect(avisos.first(), 'y el que queda es el del producto que sigue guardado').toContainText(OTRO)
    await expect(page.locator('[data-fav-avisos]')).not.toContainText(PRODUCTO)
  })
})

// ---------------------------------------------------------------------------
// LA WEB SIGUE IGUAL (D-086)
// ---------------------------------------------------------------------------

for (const ancho of [390, 1280] as const) {
  test.describe(`favoritos en la web a ${ancho} px`, () => {
    test.use({ viewport: { width: ancho, height: 900 } })

    test('conserva su rejilla, su tarjeta con marco y sus controles históricos', async ({ page }) => {
      // No es que esté mejor: es que D-086 congela la web.
      await conFavoritos(page, ['iphone/17-pro'])
      await page.goto('./favoritos')
      await expect(page.getByRole('heading', { name: 'Favoritos', level: 1 })).toBeVisible()

      // Sin la composición de la app.
      await expect(page.locator('[data-fav-lista]'), 'la web no monta la lista de la app').toHaveCount(0)
      await expect(page.locator('[data-fav-item]')).toHaveCount(0)

      const tarjeta = page
        .getByRole('listitem')
        .filter({ has: page.getByRole('heading', { level: 3 }) })
        .first()
      const caja = await tarjeta.evaluate((e) => {
        const s = getComputedStyle(e)
        return {
          borde: parseFloat(s.borderTopWidth),
          radio: parseFloat(s.borderTopLeftRadius),
          relleno: parseFloat(s.paddingTop),
        }
      })
      expect(caja.borde, 'la tarjeta conserva su marco').toBeGreaterThan(0)
      expect(caja.radio, 'y su radio').toBeGreaterThan(0)
      expect(caja.relleno, 'y su relleno').toBeGreaterThan(0)

      // Los controles históricos, tal cual: el `<details>` y el «Ver producto».
      await expect(tarjeta.locator('details').filter({ hasText: 'Seguir disponibilidad' })).toHaveCount(1)
      await expect(tarjeta.getByRole('link', { name: 'Ver producto' })).toHaveCount(1)
      await expect(tarjeta.getByRole('button', { name: /Quitar .* de favoritos/ })).toHaveCount(1)
    })

    test('conserva el selector de tienda del aviso y su composición', async ({ page }) => {
      await conFavoritos(page, ['iphone/17-pro'])
      await page.goto('./favoritos')

      const tarjeta = page
        .getByRole('listitem')
        .filter({ has: page.getByRole('heading', { level: 3 }) })
        .first()
      const seguimiento = tarjeta.locator('details').filter({ hasText: 'Seguir disponibilidad' })
      await seguimiento.getByText('Seguir disponibilidad').click()
      await seguimiento.getByRole('button', { name: new RegExp(TIENDA) }).click()

      // El `<select>` histórico sigue estando en la web y sólo en la web.
      await expect(page.getByRole('combobox', { name: 'Cambiar tienda del aviso' })).toHaveCount(1)
      await expect(page.getByRole('button', { name: /Simular llegada/ })).toHaveCount(1)
      await expect(page.locator('[data-fav-avisos]'), 'sin la lista de avisos de la app').toHaveCount(0)
    })

    test('el estado vacío conserva su marco discontinuo', async ({ page }) => {
      await conFavoritos(page, [])
      await page.goto('./favoritos')

      const vacio = page.getByText('Aún no has guardado ningún producto.').locator('..')
      expect(await vacio.evaluate((e) => getComputedStyle(e).borderTopStyle)).toBe('dashed')
      await expect(page.locator('[data-fav-vacio]')).toHaveCount(0)
    })
  })
}
