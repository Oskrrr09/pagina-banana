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
    // El historial de la app vive en el espacio de su identidad, no en la clave
    // del navegador: sin sesión, el espacio anónimo (D-088). Antes se sembraba
    // en `banana:recientes`, que es la del historial web y la app ya no lee.
    if (lista) localStorage.setItem('banana:recientes:app:anon', JSON.stringify(lista))
  }, recientes)
}

/**
 * Cambia el orden del catálogo.
 *
 * Desde la Fase A el orden no es un `<select>` sino tres opciones dentro del
 * mismo panel que los filtros: se abre, se elige y se cierra. El estado sigue
 * viajando en la URL exactamente igual.
 */
async function ordenarPor(page: Page, etiqueta: string) {
  await page.getByRole('button', { name: /Ordenar/ }).click()
  // La hoja de orden se titula «Ordenar», no «Filtrar»: elegir cierra.
  await page.getByRole('dialog', { name: 'Ordenar' }).getByRole('button', { name: etiqueta, exact: true }).click()
}

type CatalogoReal = {
  allModels: { family: string; slug: string }[]
  tieneOferta: (model: never) => boolean
}

/**
 * Carga el catálogo y las ofertas del código de producción en el lado Node de
 * la prueba, para poder derivar el conjunto esperado en vez de escribirlo.
 */
async function conElCatalogoReal<T>(leer: (catalogo: CatalogoReal) => T): Promise<T> {
  const { createServer } = await import('vite')
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const productos = await vite.ssrLoadModule('/src/data/products/index.ts')
    const ofertas = await vite.ssrLoadModule('/src/lib/offers.ts')
    return leer({ allModels: productos.allModels, tieneOferta: ofertas.tieneOferta })
  } finally {
    await vite.close()
  }
}

test.describe('Tienda', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('tiene identidad propia y no usa un producto como encabezado', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tienda')
  })

  test('no repite lo personal de Inicio', async ({ page }) => {
    // POR QUÉ SE MIDE EL CARRIL Y NO UN TÍTULO
    //
    // Esta prueba buscaba el encabezado «Continúa donde lo dejaste» para
    // demostrar que Tienda no tiene recientes. Inicio v2 renombró ese carril a
    // «Seguías mirando», así que la aserción pasó a comprobar la ausencia de un
    // texto que ya no existe en ninguna parte: si el carril reapareciera en
    // Tienda, seguiría verde.
    //
    // Ahora se comprueba la lista por su nombre accesible —que es el contrato
    // visible— y, además, que Tienda no monte NINGÚN carril de producto que no
    // sea el de ofertas. Eso protege la propiedad aunque vuelvan a renombrarlo.
    await comoApp(page, ['iphone/17-pro', 'mac/macbook-air-m5'])
    await page.goto('./tienda')

    const contenido = page.getByRole('main')
    await expect(
      contenido.getByRole('list', { name: 'Seguías mirando' }),
      'el historial de vistos es de Inicio',
    ).toHaveCount(0)
    const carriles = await contenido
      .getByRole('list')
      .evaluateAll((listas) =>
        listas.map((l) => l.getAttribute('aria-label')).filter((etiqueta): etiqueta is string => Boolean(etiqueta)),
      )
    // Desde la Fase A, «Explorar» también es un carril —las seis familias con
    // su fotografía, en vez de seis cajas con chevron—. La propiedad que esta
    // prueba protege no cambia: Tienda no monta NADA personal. Se sigue
    // exigiendo la lista completa y exacta, no un `toContain`, para que un
    // carril nuevo tenga que pasar por aquí.
    expect(carriles, 'Tienda monta el de ofertas y el de familias, y nada personal').toEqual([
      'Oportunidades',
      'Explorar',
    ])

    await expect(contenido.getByRole('heading', { name: 'Tu tienda' }), 'la tienda favorita es de Inicio').toHaveCount(
      0,
    )
  })

  test('ofrece entrada propia a las seis familias, sin depender de los chips', async ({ page }) => {
    // QUÉ CAMBIÓ, Y POR QUÉ
    //
    // Hasta Tienda v2 esta prueba exigía que NO hubiera navegación de
    // categorías en el contenido, porque «las familias ya viven en los chips».
    // Medido sobre `main`: los chips ocupan 474 px y a 320 px sólo se ven
    // CUATRO de las seis —«Accesorios» no aparece nunca sin arrastrar—, miden
    // 32 px de alto, y se recortan bajo el buscador al bajar. No eran una
    // entrada suficiente.
    //
    // La propiedad nueva es que Tienda lleve a las seis familias **desde su
    // propio contenido**. Los chips siguen existiendo y no se tocan.
    await comoApp(page)
    await page.goto('./tienda')

    // Se ancla a la sección por su nombre accesible: los chips de la barra
    // también viven dentro de `<main>`, así que buscar ahí encontraría doce
    // enlaces y la prueba no distinguiría una navegación de la otra.
    const explorar = page.getByRole('region', { name: 'Explorar' })
    await expect(explorar.getByRole('link'), 'las seis familias, dentro del contenido').toHaveCount(6)

    for (const [nombre, destino] of [
      ['Mac', '/mac'],
      ['iPhone', '/iphone'],
      ['iPad', '/ipad'],
      ['Watch', '/apple-watch'],
      ['AirPods', '/airpods'],
      ['Accesorios', '/accesorios'],
    ]) {
      // El nombre accesible del enlace ya no es sólo el rótulo: la pieza lleva
      // la fotografía de un producto real de esa familia, así que el nombre
      // incluye también su texto alternativo. Se busca por rótulo contenido y
      // se sigue exigiendo el destino exacto.
      const enlace = explorar.getByRole('link', { name: new RegExp(nombre) })
      await expect(enlace, nombre).toHaveAttribute('href', new RegExp(`${destino}$`))
      const caja = await enlace.boundingBox()
      expect(caja!.height, `«${nombre}» mide ${caja!.height} px de alto`).toBeGreaterThanOrEqual(44)
    }
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

// ============================================================================
// TIENDA V2 — LA PUERTA AL CATÁLOGO.
//
// QUÉ SE MIDIÓ ANTES DE CAMBIARLA
//
// Tienda enseñaba 6 ofertas de un catálogo de 23 modelos, cuatro de ellas Mac,
// así que iPad, Watch, AirPods y Accesorios no aparecían en toda la pantalla.
// Con historial real la intersección de producto con Inicio era **6 de 6**. Y
// la única entrada a las familias eran los chips del armazón, de los que a 320
// px sólo se ven cuatro.
//
// Lo que estas pruebas protegen es la FUNCIÓN de la pantalla, no su aspecto.
// ============================================================================
test.describe('Tienda v2', () => {
  test('Tienda enseña TODAS las ofertas reales del catálogo', async ({ page }) => {
    // DE DÓNDE SALE EL CONJUNTO ESPERADO
    //
    // Del código de producción, no de un número escrito a mano y no de Inicio.
    // `allModels.filter(tieneOferta)` es la misma definición que usa la
    // pantalla, así que el día que cambien los precios el esperado cambia solo
    // y esta prueba sigue diciendo la verdad.
    //
    // No se pueden importar esos módulos directamente: `src/data/products`
    // depende de `import.meta.env.BASE_URL`, que sólo existe cuando compila
    // Vite; en el Node de Playwright revienta con «Cannot read properties of
    // undefined (reading 'BASE_URL')». Se cargan por eso con el cargador SSR de
    // Vite, que sí define ese entorno. Va en modo middleware: no abre puerto ni
    // interfiere con el servidor de la suite, y la página se sigue midiendo
    // contra el artefacto de siempre.
    const ofertasEsperadas = await conElCatalogoReal(({ allModels, tieneOferta }) =>
      allModels.filter(tieneOferta).map((m) => `${m.family}/${m.slug}`),
    )
    expect(ofertasEsperadas.length, 'el catálogo tiene alguna oferta que enseñar').toBeGreaterThan(0)

    await comoApp(page)
    await page.goto('./tienda')

    const carril = page.getByRole('list', { name: 'Oportunidades' })
    const renderizadas = await carril
      .locator('article a[href]')
      .evaluateAll((enlaces) => enlaces.map((a) => a.getAttribute('href')!.split('/').slice(2, 4).join('/')))

    // Conjuntos exactos: ni una de menos —truncada— ni una de más —inventada—.
    expect(renderizadas.slice().sort(), 'Tienda es el conjunto, no una muestra').toEqual(
      ofertasEsperadas.slice().sort(),
    )
    expect(new Set(renderizadas).size, 'sin repetir ninguna').toBe(renderizadas.length)

    // Y todas se presentan como la oferta que son: precio anterior y distintivo.
    await expect(carril.locator('[class*="bg-danger"]')).toHaveCount(ofertasEsperadas.length)
    await expect(carril.locator('.line-through')).toHaveCount(ofertasEsperadas.length)

    await expect(page.getByRole('link', { name: /Ver (todas|más)/ }), 'no hay nada más que ver').toHaveCount(0)
  })

  test('la ayuda para elegir es secundaria y va después del producto', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    const ayuda = page.getByRole('link', { name: /Encuentra tu Apple/ })
    await expect(ayuda).toHaveAttribute('href', /\/elige-tu-apple$/)

    const caja = (await ayuda.boundingBox())!
    expect(caja.height, 'objetivo táctil').toBeGreaterThanOrEqual(44)
    // Secundaria: una fila, no la pieza amarilla a sangre que es en Inicio.
    expect(caja.height, 'no es un hero').toBeLessThan(140)

    // DESPUÉS DEL PRODUCTO, NO DESPUÉS DE SU TÍTULO
    //
    // Comparar contra el `h2` dejaba pasar la regresión que importa: título de
    // Oportunidades, ayuda, y las tarjetas debajo. Lo que se protege es que la
    // ayuda empiece cuando el carril ya ha terminado de pintarse.
    const carril = (await page.getByRole('list', { name: 'Oportunidades' }).boundingBox())!
    expect(caja.y, 'va después del carril entero, no de su título').toBeGreaterThanOrEqual(carril.y + carril.height)
  })

  test('los servicios son tres, y comerciales', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    const servicios = page.getByRole('region', { name: 'Servicios' })
    const enlaces = servicios.getByRole('link')
    await expect(enlaces, 'tres accesos, no cinco').toHaveCount(3)

    for (const [nombre, destino] of [
      ['Plan Renove', '/plan-renove'],
      ['Comprar en tienda', '/tiendas'],
      ['Servicio técnico', '/servicio-tecnico'],
    ]) {
      const enlace = servicios.getByRole('link', { name: nombre, exact: true })
      await expect(enlace, nombre).toHaveAttribute('href', new RegExp(`${destino}$`))
      expect((await enlace.boundingBox())!.height, `«${nombre}»`).toBeGreaterThanOrEqual(44)
    }

    // Los dos que se van: el índice genérico y el soporte, que ya tiene sitio
    // propio en Inicio. Las rutas siguen existiendo; dejan de repetirse aquí.
    await expect(servicios.getByRole('link', { name: /Soporte|Ayuda y servicios/ })).toHaveCount(0)
    await expect(page.getByRole('main').locator('a[href$="/servicios"]')).toHaveCount(0)
  })

  for (const ventana of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    test(`el catálogo se alcanza sin arrastrar de lado a ${ventana.width} px`, async ({ page }) => {
      await page.setViewportSize(ventana)
      await comoApp(page)
      await page.goto('./tienda')

      const explorar = page.getByRole('region', { name: 'Explorar' })
      const enlaces = explorar.getByRole('link')
      await expect(enlaces).toHaveCount(6)

      // QUÉ CAMBIÓ, Y QUÉ SE SIGUE EXIGIENDO
      //
      // Las seis familias estaban en una rejilla 2×3 y cabían sin desplazar.
      // Desde la Fase A son un carril con la fotografía de un producto real de
      // cada una: el producto pasa delante, y las familias se descubren
      // desplazando, igual que los chips de la barra.
      //
      // Lo que NO se relaja: siguen siendo seis, siguen midiendo lo bastante
      // para el dedo, y **todas tienen que poder alcanzarse**. Eso último se
      // comprueba desplazando el carril hasta el final y verificando que la
      // última entra entera en pantalla; si alguna quedara inalcanzable, esto
      // falla.
      const lista = explorar.getByRole('list')
      for (let i = 0; i < 6; i++) {
        const caja = (await enlaces.nth(i).boundingBox())!
        const nombre = (await enlaces.nth(i).innerText()).trim()
        expect(caja.height, `«${nombre}» mide ${caja.height}`).toBeGreaterThanOrEqual(44)
      }

      await lista.evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })
      const ultima = (await enlaces.nth(5).boundingBox())!
      const marco = (await explorar.boundingBox())!
      expect(ultima.x, 'la sexta familia se alcanza desplazando').toBeGreaterThanOrEqual(marco.x - 2)
      expect(ultima.x + ultima.width, 'y entra entera en pantalla').toBeLessThanOrEqual(marco.x + marco.width + 2)

      const medida = await page.evaluate(() => {
        const de = document.documentElement
        const guardado = de.style.overflowX
        de.style.overflowX = 'visible'
        const documento = de.scrollWidth - de.clientWidth
        de.style.overflowX = guardado
        const cont = document.querySelector('#contenido')!
        return { documento, lateral: cont.scrollWidth - cont.clientWidth }
      })
      expect(medida.documento, 'el documento no desborda').toBeLessThanOrEqual(2)
      expect(medida.lateral, 'sólo el carril de producto se desplaza de lado').toBeLessThanOrEqual(2)

      // Y el armazón sigue donde estaba.
      await expect(page.locator('[data-app-topbar]')).toHaveCount(1)
      await expect(page.locator('[data-app-tab-bar] [aria-current]')).toContainText('Tienda')
    })
  }
})

test.describe('catálogo de familia', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('el catálogo llega sin dos escaparates por delante', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    // El `h1` sigue nombrando la familia; lo que se fue es el hero que lo
    // envolvía —eyebrow, subtítulo y botón grande— y que empujaba el catálogo
    // fuera del primer viewport.
    await expect(page.getByRole('heading', { level: 1, name: 'iPhone' })).toBeVisible()
    // Ordenar sigue alcanzable de un toque; ya no como `<select>` de
    // formulario, sino dentro del mismo panel que los filtros.
    await expect(page.getByRole('button', { name: /Ordenar/ })).toBeVisible()

    // Lo que se retiró: el carrusel que repetía todos los modelos y el
    // escaparate gigante de ofertas.
    await expect(page.getByRole('navigation', { name: /Modelos de/ })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Ofertas destacadas en/ })).toHaveCount(0)

    // Los controles ya no tienen que entrar «en la primera pantalla y media»:
    // desde la Fase A entran en la PRIMERA, y por delante del producto sólo
    // queda el título. Se exige más que antes, no menos.
    const caja = (await page.getByRole('button', { name: /Ordenar/ }).boundingBox())!
    expect(caja.y, 'los controles del catálogo entran en el primer viewport').toBeLessThan(400)
  })

  test('Filtrar y Ordenar abren cada uno lo suyo', async ({ page }) => {
    // POR QUÉ ESTA PRUEBA
    //
    // Los dos controles reutilizan el mismo `Modal` —no hace falta escribir otra
    // hoja para que atrape el foco y cierre con Escape—, y en la primera versión
    // de la Fase A eso se notaba mal: pulsar «Ordenar» abría una hoja titulada
    // «Filtrar». Funcionaba, pero se leía como un error.
    //
    // Se comprueba el NOMBRE ACCESIBLE de cada hoja, no que exista un diálogo.
    await comoApp(page)
    await page.goto('./iphone')

    await page.getByRole('button', { name: /Filtrar/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filtrar' }), 'Filtrar abre Filtrar').toBeVisible()
    await expect(page.getByRole('dialog').getByText('Precio máximo')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByRole('button', { name: /Ordenar/ }).click()
    const orden = page.getByRole('dialog', { name: 'Ordenar' })
    await expect(orden, 'Ordenar abre Ordenar').toBeVisible()
    for (const opcion of ['Orden del catálogo', 'Precio: de menor a mayor', 'Precio: de mayor a menor']) {
      await expect(orden.getByRole('button', { name: opcion, exact: true })).toBeVisible()
    }
    await expect(orden.getByText('Precio máximo'), 'la hoja de orden no trae los filtros').toHaveCount(0)

    // Elegir cierra la hoja y escribe el estado en la URL.
    await orden.getByRole('button', { name: 'Precio: de menor a mayor', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(/orden=precio-asc/)
  })

  test('el filtro viaja en la URL y Atrás lo recupera', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    await ordenarPor(page, 'Precio: de menor a mayor')
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
    // El estado se lee de la URL y se refleja en el control: el rótulo del
    // botón dice por qué está ordenado.
    await expect(page.getByRole('button', { name: /Ordenar/ })).toContainText('Precio')
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
    await ordenarPor(page, 'Precio: de menor a mayor')
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
