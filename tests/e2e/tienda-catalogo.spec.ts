import { test, expect, type Locator, type Page } from '@playwright/test'

// ============================================================================
// Tienda y el catálogo de familia.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// 1. Tienda tiene identidad propia y **no repite Inicio**. Antes su `h1` era el
//    nombre del producto del hero, y enseñaba vistos recientes, tienda favorita
//    y una rejilla de categorías que ya viven en la barra superior.
// 2. El catálogo de una familia se alcanza **pronto**: filtros y rejilla sin dos
//    escaparates por delante.
// 3. Los filtros siguen viviendo en la URL, que es lo que hace que Atrás y un
//    enlace compartido recuperen lo que se estaba mirando.
// 4. El comparador se alcanza **desde la tarjeta**, y lo que entra en él es la
//    **misma variante** que la tarjeta enseña.
//
// Se simula el binario como en el resto de la suite.
// ============================================================================

async function comoApp(page: Page, recientes?: string[]) {
  await page.addInitScript((lista) => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    if (lista) localStorage.setItem('banana:recientes', JSON.stringify(lista))
  }, recientes)
}

test.describe('Tienda', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('tiene identidad propia y no usa un producto como encabezado', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tienda')
  })

  test('no repite lo que ya está en Inicio ni en la barra superior', async ({ page }) => {
    // Con historial sembrado: si «Vistos recientemente» volviera, aquí saldría.
    await comoApp(page, ['iphone/17-pro', 'mac/macbook-air-m5'])
    await page.goto('./tienda')

    const contenido = page.getByRole('main')
    await expect(
      contenido.getByRole('heading', { name: 'Continúa donde lo dejaste' }),
      'los vistos recientes son de Inicio',
    ).toHaveCount(0)
    await expect(contenido.getByRole('heading', { name: 'Tu tienda' }), 'la tienda favorita es de Inicio').toHaveCount(
      0,
    )
    await expect(
      contenido.getByRole('heading', { name: 'Compra por categoría' }),
      'las categorías viven en los chips de la barra',
    ).toHaveCount(0)

    // Y los chips siguen a un toque, que es lo que justifica retirar la rejilla:
    // si desaparecieran, Tienda se quedaría sin ninguna entrada a las familias.
    const chips = page.getByRole('navigation', { name: 'Categorías' })
    await expect(chips.getByRole('link', { name: 'iPhone', exact: true })).toBeVisible()
    await expect(chips.getByRole('link'), 'las seis familias del menú').toHaveCount(6)
  })

  test('no hay hero de producto', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    // La propiedad, no la clase: ninguna SECCIÓN de Tienda puede titularse con
    // el nombre de un modelo. Los `h3` de las tarjetas sí son nombres de
    // producto, y eso está bien: lo que no puede volver es el hero.
    await expect(page.locator('#app-hero-titulo')).toHaveCount(0)
    const secciones = await page.getByRole('main').getByRole('heading', { level: 2 }).allInnerTexts()
    const h1 = await page.getByRole('heading', { level: 1 }).innerText()
    expect([h1, ...secciones].some((h) => /iPhone \d|MacBook|iPad |Watch Series/i.test(h))).toBe(false)
  })
})

test.describe('catálogo de familia', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('el catálogo llega sin dos escaparates por delante', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    await expect(page.getByRole('heading', { level: 1, name: /Comprar un iPhone/ })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Ordenar' })).toBeVisible()

    // Lo que se retiró: el carrusel que repetía todos los modelos y el
    // escaparate gigante de ofertas.
    await expect(page.getByRole('navigation', { name: /Modelos de/ })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Ofertas destacadas en/ })).toHaveCount(0)

    // Los filtros tienen que entrar dentro de la primera pantalla y media.
    const orden = page.getByRole('combobox', { name: 'Ordenar' })
    const caja = await orden.boundingBox()
    expect(caja!.y, 'los filtros deben quedar cerca del principio del catálogo').toBeLessThan(844)
  })

  test('el filtro viaja en la URL y Atrás lo recupera', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('precio-asc')
    await expect(page).toHaveURL(/orden=precio-asc/)

    // Entrar en una ficha y volver: el orden sigue puesto.
    // El enlace de la primera tarjeta, no «un enlace que diga iPhone»: en la
    // página hay chips y botones que también lo dicen. Y la tarjeta tiene UN
    // solo enlace de producto —foto y nombre van dentro del mismo—, así que se
    // exige esa cardinalidad en vez de coger el primero de varios.
    const enlaceProducto = page.locator('[data-product-card]').first().getByRole('link')
    await expect(enlaceProducto, 'la tarjeta tiene un único enlace a su ficha').toHaveCount(1)
    await enlaceProducto.click()
    await expect(page).toHaveURL(/\/iphone\/[^/]+\//)
    await page.goBack()
    await expect(page).toHaveURL(/orden=precio-asc/)
    await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('precio-asc')
  })

  test('abrir una ficha que ya es canónica no reemplaza su entrada de historial', async ({ page }) => {
    // POR QUÉ EXISTE ESTA PRUEBA
    //
    // El CI post-merge de la PR #60 —run `32066518376`— dejó el caso de arriba
    // en FLAKY: tras `goBack()` la aplicación seguía en la ficha durante todo el
    // tiempo de espera. No fue que el filtro tardara en reaparecer; fue que no
    // se volvió.
    //
    // El mecanismo: `ProductCard` enlaza ya a la ruta canónica de la variante,
    // así que al pulsar se APILA esa entrada. Y `VariantPage`, al montar,
    // recalculaba `variantPath` y hacía `navigate(..., { replace: true })`
    // **aunque la URL ya fuera exactamente ésa**. Ese reemplazo no aporta
    // ningún estado nuevo y, al ejecutarse después del `click`, puede coincidir
    // con un `history.back()` inmediato.
    //
    // Esta prueba no depende de que la carrera ocurra: observa el mecanismo. Se
    // instrumenta `history.replaceState` sin impedirlo, y se exige que entrar en
    // una URL que YA es canónica no genere ningún reemplazo hacia sí misma.
    await page.addInitScript(() => {
      const w = window as unknown as { __reemplazos: string[] }
      w.__reemplazos = []
      const original = history.replaceState.bind(history)
      history.replaceState = ((estado: unknown, titulo: string, url?: string | URL | null) => {
        w.__reemplazos.push(String(url ?? location.pathname + location.search))
        return original(estado, titulo, url as string)
      }) as typeof history.replaceState
    })

    await comoApp(page)
    await page.goto('./iphone')
    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('precio-asc')
    await expect(page).toHaveURL(/orden=precio-asc/)

    // Los reemplazos del catálogo son deliberados —los filtros no deben apilar
    // una entrada por cada toque—, así que se descartan: lo que se mide es lo
    // que ocurre al entrar en la ficha.
    await page.evaluate(() => {
      ;(window as unknown as { __reemplazos: string[] }).__reemplazos = []
    })

    const enlaceProducto = page.locator('[data-product-card]').first().getByRole('link')
    await expect(enlaceProducto).toHaveCount(1)
    const destino = await enlaceProducto.getAttribute('href')
    await enlaceProducto.click()

    // Primero una señal semántica de que la ficha está montada y pintada…
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`${destino!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    // …y después dos fotogramas. Los efectos de React corren tras el pintado,
    // así que si el rótulo ya está en pantalla y han pasado dos `rAF`, el efecto
    // de la ficha ha tenido su oportunidad. No es una espera «a ver si pasa»:
    // es el punto a partir del cual el reemplazo, si existiera, ya se habría
    // registrado.
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    )

    const reemplazos = await page.evaluate(() => (window as unknown as { __reemplazos: string[] }).__reemplazos)
    const redundantes = reemplazos.filter((u) => u.endsWith(destino!))
    expect(
      redundantes,
      `entrar en ${destino} generó ${redundantes.length} reemplazo(s) de su propia entrada: ${JSON.stringify(reemplazos)}`,
    ).toHaveLength(0)
  })

  test('sin resultados ofrece salidas reales', async ({ page }) => {
    await comoApp(page)
    // Combinación imposible: el iPhone más barato pasa de 500 €.
    await page.goto('./iphone?precio=500')

    await expect(page.locator('[data-product-card]'), 'ningún producto cumple el filtro').toHaveCount(0)
    await expect(
      page.getByRole('region', { name: /coincide con los filtros/i }).getByRole('link', { name: 'Encuentra tu Apple' }),
    ).toBeVisible()

    // Dentro del propio estado vacío: la barra de filtros tiene su propio
    // «Limpiar», y aquí interesa el que se ofrece donde está mirando la persona.
    await page
      .getByRole('region', { name: /coincide con los filtros/i })
      .getByRole('button', { name: 'Limpiar filtros' })
      .click()
    await expect(page).not.toHaveURL(/precio=/)
    await expect(page.locator('[data-product-card]').first(), 'al limpiar vuelve el catálogo').toBeVisible()
  })
})

test.describe('comparador desde el catálogo', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  const botonComparar = (tarjeta: Locator) => tarjeta.getByRole('button', { name: /^Comparar / })
  const llamada = (page: Page) => page.getByRole('link', { name: /Ver el comparador/ })

  test('se añade desde la tarjeta y la llamada al comparador es UNA', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const primera = botonComparar(page.locator('[data-product-card]').first())
    await expect(primera).toBeVisible()
    await expect(primera).toHaveAttribute('aria-pressed', 'false')
    await expect(llamada(page), 'sin nada comparado no hay llamada').toHaveCount(0)

    await primera.click()
    await expect(primera, 'el botón refleja que ese modelo está en el comparador').toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(llamada(page), 'con uno comparado, una sola llamada').toHaveCount(1)

    // CARDINALIDAD DE LA LLAMADA
    //
    // Vivía dentro de `ProductCard`, así que con dos modelos comparados salían
    // dos enlaces idénticos y el test los tapaba con `.first()`. Es una sola
    // acción sobre una sola comparación: se exige que sea uno, con dos y con
    // tres. Nada de `.first()` aquí.
    await botonComparar(page.locator('[data-product-card]').nth(1)).click()
    await expect(llamada(page), 'con dos comparados sigue siendo una').toHaveCount(1)
    await expect(llamada(page)).toContainText('2')

    await botonComparar(page.locator('[data-product-card]').nth(2)).click()
    await expect(llamada(page), 'con tres comparados sigue siendo una').toHaveCount(1)
    await expect(llamada(page)).toContainText('3')

    await llamada(page).click()
    await expect(page).toHaveURL(/\/comparar\?familia=iphone/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('la llamada desaparece al quedarse en cero y no aparece en otra familia', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const primera = botonComparar(page.locator('[data-product-card]').first())
    await primera.click()
    await expect(llamada(page)).toHaveCount(1)

    // La comparación es de iPhone: en Mac no puede aparecer un resumen que
    // hable de modelos que no están en pantalla.
    await page.goto('./mac')
    await expect(llamada(page), 'la comparación guardada es de otra familia').toHaveCount(0)

    await page.goto('./iphone')
    await expect(llamada(page)).toHaveCount(1)
    await botonComparar(page.locator('[data-product-card]').first()).click()
    await expect(llamada(page), 'al quedarse en cero, desaparece').toHaveCount(0)
  })

  test('un comparador lleno de OTRA familia no bloquea el catálogo', async ({ page }) => {
    // EL BUG QUE ESTO VIGILA
    //
    // `toggleCompare` ya sabía qué hacer con una familia distinta: empezar una
    // comparación nueva. Pero la tarjeta deshabilitaba su botón con sólo mirar
    // `compare.length >= 3`, así que con tres iPhone guardados TODOS los
    // botones de /mac salían muertos y esa sustitución era inalcanzable.
    //
    // Se siembra por la interfaz, no escribiendo `localStorage` a mano: lo que
    // se comprueba es el store de verdad, con los items que él mismo genera.
    await comoApp(page)
    await page.goto('./iphone')
    for (const i of [0, 1, 2]) {
      await botonComparar(page.locator('[data-product-card]').nth(i)).click()
    }
    const iphones = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
    expect(iphones, 'el comparador queda lleno con tres iPhone').toHaveLength(3)
    expect(new Set(iphones.map((c: { family: string }) => c.family))).toEqual(new Set(['iphone']))

    await page.goto('./mac')
    const mac = page.locator('[data-product-card]').first()
    const boton = botonComparar(mac)
    await expect(boton, 'un comparador lleno de iPhone no deshabilita los Mac').not.toBeDisabled()

    // Qué Mac es, según lo que la tarjeta enseña.
    const destino = await mac.getByRole('link').getAttribute('href')
    const slugEsperado = destino!.split('/').filter(Boolean).at(-2)

    await boton.click()
    await expect(boton).toHaveAttribute('aria-pressed', 'true')

    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
    expect(guardado, 'la comparación anterior se sustituye entera').toHaveLength(1)
    expect(guardado[0].family).toBe('mac')
    expect(guardado[0].modelSlug).toBe(slugEsperado)
  })

  test('al comparador entra la MISMA variante que enseña la tarjeta', async ({ page }) => {
    await comoApp(page)
    // En Mac vive el caso que hace útil esta prueba: hay modelos cuya variante
    // rebajada NO es la de entrada —el MacBook Air M5 arranca en 1319 € y su
    // oferta está en la configuración de 1579 €—. Con iPhone la mutación de
    // «coge el precio del modelo» pasaría desapercibida.
    //
    // CÓMO SE COMPRUEBA QUE ES LA MISMA VARIANTE, Y NO SÓLO EL MISMO PRECIO
    //
    // La tarjeta enseña una foto, un precio y un enlace, y los tres tienen que
    // salir de la misma configuración. El enlace es la declaración de cuál es:
    // se sigue, y la ficha que abre dice en texto su color, su capacidad y su
    // precio. Contra esos tres se contrasta lo que el store guardó.
    //
    // Así una variante cambiada se detecta aunque algún número coincida por
    // azar: tendrían que coincidir los tres a la vez.
    await page.goto('./mac')

    const conOferta = page.locator('[data-product-card]').filter({ hasText: '%' })
    const cuantas = await conOferta.count()
    expect(cuantas, 'sin ofertas la prueba no comprueba nada').toBeGreaterThan(0)

    for (let i = 0; i < cuantas; i++) {
      const tarjeta = conOferta.nth(i)
      const nombre = (await tarjeta.locator('h3').innerText()).trim()
      const enlace = tarjeta.getByRole('link')
      await expect(enlace, 'la tarjeta tiene un único enlace a su ficha').toHaveCount(1)
      const destino = (await enlace.getAttribute('href'))!
      const precioEnTarjeta = ((await tarjeta.innerText()).replace(/\s+/g, ' ').match(/\d+(?:[.,]\d+)*\s?€/g) ?? [])[0]
      expect(precioEnTarjeta, 'la tarjeta con oferta enseña un precio').toBeTruthy()

      await botonComparar(tarjeta).click()
      const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
      const anadido = guardado[guardado.length - 1]

      // La ficha a la que apunta la tarjeta: la variante que declara enseñar.
      await page.goto(destino)
      const enLaFicha = (await page.getByRole('main').innerText()).replace(/\s+/g, ' ')

      expect(
        enLaFicha,
        `${nombre}: el comparador guardó el color «${anadido.color}», que no es el de la variante enlazada`,
      ).toContain(`Color: ${anadido.color}`)
      // La ficha reparte la configuración en dos rótulos —«Tamaño» y
      // «Capacidad»— y el store la guarda entera en un campo. Se comprueban las
      // dos mitades contra lo que la ficha dice, no contra una constante:
      // así un MacBook de 15" o de 512 GB en el comparador se vería.
      const rotulo = async (prefijo: string) => {
        const p = page.getByText(new RegExp(`^${prefijo}: `))
        if ((await p.count()) === 0) return null
        return (await p.innerText()).slice(prefijo.length + 2).trim()
      }
      const capacidadFicha = await rotulo('Capacidad')
      const tamanoFicha = await rotulo('Tamaño')
      expect(capacidadFicha, 'la ficha declara su capacidad').toBeTruthy()
      expect(
        anadido.capacity.endsWith(capacidadFicha!),
        `${nombre}: el comparador guardó «${anadido.capacity}» y la variante enlazada es «${capacidadFicha}»`,
      ).toBe(true)
      if (tamanoFicha) {
        expect(
          anadido.capacity.startsWith(tamanoFicha),
          `${nombre}: el comparador guardó «${anadido.capacity}» y la variante enlazada mide «${tamanoFicha}»`,
        ).toBe(true)
      }
      expect(
        enLaFicha,
        `${nombre}: el comparador guardó ${anadido.price}, y la tarjeta enseñaba ${precioEnTarjeta}`,
      ).toContain(precioEnTarjeta!)

      const euros = (t: string) => Number(t.replace(/[^\d,]/g, '').replace(',', '.'))
      expect(
        anadido.price,
        `${nombre}: el comparador recibió ${anadido.price} y la tarjeta enseñaba ${precioEnTarjeta}`,
      ).toBe(euros(precioEnTarjeta!))

      // Se retira para no toparse con el máximo de tres.
      await page.goto('./mac')
      await botonComparar(conOferta.nth(i)).click()
    }
  })

  test('volver a pulsar lo quita', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    const boton = botonComparar(page.locator('[data-product-card]').first())
    await boton.click()
    await expect(boton).toHaveAttribute('aria-pressed', 'true')
    await boton.click()
    await expect(boton).toHaveAttribute('aria-pressed', 'false')
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
    expect(guardado).toHaveLength(0)
  })
})

test.describe('encaje', () => {
  for (const ancho of [320, 390]) {
    test(`a ${ancho} px no hay desbordamiento horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 800 })
      await comoApp(page)

      for (const ruta of ['./tienda', './iphone']) {
        await page.goto(ruta)
        const desborde = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(desborde, `${ruta} a ${ancho} px`).toBe(0)
      }
    })
  }
})
