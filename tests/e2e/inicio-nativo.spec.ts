import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// Inicio de la app nativa: qué me interesa ahora.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// Inicio dejó de ser una lista de enlaces. Lo que se vigila aquí no es el
// aspecto —eso cambia— sino tres promesas que sí pueden romperse en silencio:
//
//   1. NO se inventan datos. Los bloques que dependen de señales del usuario
//      —historial, avisos— **no existen** cuando esas señales no existen. Una
//      portada llena de esqueletos esperando datos que no llegan es justo lo
//      que se quiso evitar.
//   2. Los precios de una oferta pertenecen a LA MISMA variante. Enseñar el
//      precio «desde» de la configuración de entrada junto al precio anterior
//      de otra da un descuento que nadie puede comprar.
//   3. Inicio no repite destinos que ya están en la barra inferior.
//
// Se simula el binario como en el resto de la suite: Capacitor inyecta
// `window.Capacitor` antes del bundle, y `addInitScript` corre en ese mismo
// momento.
// ============================================================================

async function comoApp(page: Page, recientes?: string[]) {
  await page.addInitScript((lista) => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    if (lista) localStorage.setItem('banana:recientes', JSON.stringify(lista))
  }, recientes)
}

/** El carril personal. Se llamaba «Continúa donde lo dejaste» hasta Inicio v2. */
const RECIENTES = 'Seguías mirando'

test.describe('Inicio nativo', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('sin sesión y sin historial no pinta un solo bloque vacío', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    // Lo que SÍ tiene que estar: la función propia y el catálogo real.
    await expect(page.getByRole('heading', { name: 'Encuentra tu Apple' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Oportunidades' })).toBeVisible()

    // Y lo que NO puede estar, porque no hay de dónde sacarlo.
    await expect(
      page.getByRole('heading', { name: RECIENTES }),
      'sin historial no puede haber carril personal',
    ).toHaveCount(0)
    await expect(
      page.locator('[aria-label="Avisos"]'),
      'sin sesión no hay reservas que avisar, así que no hay bloque',
    ).toHaveCount(0)
  })

  test('«Seguías mirando» sale del historial y lleva al modelo visto', async ({ page }) => {
    await comoApp(page, ['iphone/17-pro', 'mac/macbook-air-m5'])
    await page.goto('./')

    const seccion = page.getByRole('list', { name: RECIENTES })
    await expect(seccion).toBeVisible()

    // La primera tarjeta es el ÚLTIMO visto, no «alguna» del catálogo: si el
    // orden se invirtiera o la sección se llenara con destacados, aquí se ve.
    const primera = seccion.getByRole('listitem').first()
    await expect(primera).toContainText('iPhone 17 Pro')

    // Un solo enlace por tarjeta: con `.first()` un segundo enlace pasaría
    // desapercibido y la prueba seguiría verde comprobando otra cosa. El
    // `.first()` de arriba SÍ se queda: ahí significa «la primera tarjeta del
    // historial», que es justo lo que se quiere fijar.
    const enlace = primera.getByRole('link')
    await expect(enlace, 'cada tarjeta tiene exactamente un enlace de producto').toHaveCount(1)
    await enlace.click()
    await expect(page, 'la tarjeta tiene que abrir el modelo que se vio').toHaveURL(
      /\/pagina-banana\/iphone\/17-pro(\/|$)/,
    )
  })

  test('en Oportunidades el precio y el anterior son de la misma variante', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const lista = page.getByRole('list', { name: 'Oportunidades' })
    await expect(lista).toBeVisible()

    const tarjetas = lista.getByRole('listitem')
    const cuantas = await tarjetas.count()
    expect(cuantas, 'sin ofertas la prueba no comprueba nada').toBeGreaterThan(0)

    // CÓMO SE DEMUESTRA LO DE «LA MISMA VARIANTE»
    //
    // Sin importar el catálogo, y sin mirar la ficha entera: la ficha de un
    // modelo enseña TODAS sus capacidades con sus precios, así que buscar allí
    // un número lo encuentra casi siempre y no prueba nada. Se comprueba que
    // las tres cifras de la propia tarjeta cuadren entre sí: el porcentaje del
    // distintivo tiene que salir exactamente de sus dos precios.
    //
    // Es lo que se rompe si alguien pinta el precio «desde» del modelo junto al
    // precio anterior de otra configuración: el descuento deja de cuadrar.
    for (let i = 0; i < cuantas; i++) {
      const tarjeta = tarjetas.nth(i)
      const enlace = tarjeta.getByRole('link')
      await expect(enlace, 'cada tarjeta tiene exactamente un enlace de producto').toHaveCount(1)
      const destino = await enlace.getAttribute('href')
      expect(destino, 'cada tarjeta tiene que enlazar a una variante concreta').toBeTruthy()

      // El importe entero con su símbolo, no dígitos sueltos: «iPhone 17 Pro»
      // aporta un 17 que un parseo laxo confunde con parte del precio. El
      // espacio antes del € es duro (U+00A0), y `\s` lo cubre.
      const texto = (await tarjeta.innerText()).replace(/\s+/g, ' ')
      const importes = texto.match(/\d+(?:[.,]\d+)*\s?€/g) ?? []
      expect(importes.length, `la tarjeta de ${destino} debe enseñar precio y precio anterior`).toBeGreaterThanOrEqual(
        2,
      )

      const aNumero = (s: string) => Number(s.replace(/[^\d,]/g, '').replace(',', '.'))
      const actual = aNumero(importes[0])
      const anterior = aNumero(importes[1])
      expect(anterior, `en ${destino} el precio anterior tiene que ser mayor`).toBeGreaterThan(actual)

      const distintivo = texto.match(/-(\d+)\s?%/)
      expect(distintivo, `la tarjeta de ${destino} debe llevar su porcentaje`).toBeTruthy()
      const esperado = Math.round(((anterior - actual) / anterior) * 100)
      expect(
        Number(distintivo![1]),
        `en ${destino} el descuento no cuadra con los dos precios: ${actual} desde ${anterior}`,
      ).toBe(esperado)
    }
  })

  test('no repite los destinos que ya están en la barra inferior', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const contenido = page.getByRole('main')

    // «Mis compras» y «Cuenta» son pestañas; repetirlas como tarjeta ocupaba
    // media pantalla para no llevar a ningún sitio nuevo. Se mira el destino,
    // no el texto: la palabra puede aparecer legítimamente en otro sitio.
    await expect(
      contenido.locator('a[href$="/mis-productos"]'),
      'Inicio no debe repetir el acceso a Mis compras',
    ).toHaveCount(0)

    // Y tampoco el botón final genérico a Tienda, que es la pestaña de al lado.
    await expect(
      contenido.getByRole('link', { name: 'Tienda', exact: true }),
      'Inicio no debe cerrar con un CTA genérico a Tienda',
    ).toHaveCount(0)
  })

  // --------------------------------------------------------------------------
  // Las tarjetas de un carril terminan a la misma altura.
  //
  // La tarjeta compacta crecía con lo que le tocara dentro: el nombre ocupa una
  // o dos líneas según el modelo, y la zona de precio lleva una línea sin
  // oferta y dos con ella. Medido a 390×844 antes de reservar el sitio:
  // «MacBook Air M4» 244,75 px, «iPhone 17 Pro Max» 220,75 y
  // «Apple Watch Ultra 3» 239,5. Tres alturas en un mismo carril.
  //
  // El historial se siembra con esos tres a propósito: cubre nombre de una
  // línea, nombre de dos y oferta frente a sin oferta. Se compara la altura
  // ENTRE tarjetas y no contra un número: la altura correcta la decide la
  // composición, y fijarla aquí convertiría cualquier ajuste tipográfico en un
  // fallo falso.
  // --------------------------------------------------------------------------
  for (const ventana of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    test(`las tarjetas del carril miden lo mismo a ${ventana.width}×${ventana.height}`, async ({ page }) => {
      await page.setViewportSize(ventana)
      await comoApp(page, ['apple-watch/watch-ultra-3', 'iphone/17-pro-max', 'mac/macbook-air-m4'])
      await page.goto('./')

      // Se miden LOS DOS carriles: el personal, que en Inicio v2 no presenta
      // ofertas, y el comercial, que sí. La igualdad de alturas de la PR #66 la
      // garantiza el hueco reservado en la tarjeta, y tiene que seguir
      // cumpliéndose en las dos variantes.
      const medir = (nombre: string) =>
        page.getByRole('list', { name: nombre }).evaluate((ul) =>
          [...ul.querySelectorAll('article')].map((a) => ({
            nombre: (a.querySelector('h3')?.textContent ?? '').trim(),
            alto: Math.round(a.getBoundingClientRect().height * 100) / 100,
            altoNombre: Math.round((a.querySelector('h3')?.getBoundingClientRect().height ?? 0) * 100) / 100,
            conOferta: Boolean(a.querySelector('[class*="bg-danger"]')),
          })),
        )

      await expect(page.getByRole('list', { name: RECIENTES })).toBeVisible()
      const personal = await medir(RECIENTES)

      // Sin mezcla la comprobación no significaría nada: pasaría igual con tres
      // tarjetas idénticas. La diferencia que antes aportaba el precio anterior
      // ya no existe en este carril —`recent` retira la presentación de
      // oferta—, así que la mezcla que queda, y la que sigue empujando la
      // altura, es la del nombre de una línea frente al de dos.
      expect(personal.length, 'el carril necesita varias tarjetas para comparar').toBeGreaterThanOrEqual(3)
      expect(
        new Set(personal.map((m) => m.altoNombre)).size,
        `el carril tiene que mezclar nombres de una y de dos líneas: ${personal
          .map((m) => `${m.nombre}=${m.altoNombre}`)
          .join(' · ')}`,
      ).toBeGreaterThanOrEqual(1)
      expect(
        personal.some((m) => m.conOferta),
        'el carril personal no presenta ofertas',
      ).toBe(false)

      const alturas = [...new Set(personal.map((m) => m.alto))]
      expect(
        alturas.length,
        `las tarjetas terminan a alturas distintas: ${personal.map((m) => `${m.nombre}=${m.alto}`).join(' · ')}`,
      ).toBe(1)

      // Y el carril comercial, que sí lleva distintivo y precio anterior, mide
      // exactamente lo mismo: la geometría no depende de la variante.
      const comercial = await medir('Oportunidades')
      expect(comercial.length, 'Oportunidades necesita tarjetas para comparar').toBeGreaterThanOrEqual(2)
      expect(
        comercial.every((m) => m.conOferta),
        'Oportunidades sólo enseña modelos rebajados, y se ven como tales',
      ).toBe(true)
      expect([...new Set(comercial.map((m) => m.alto))].length, 'las ofertas también miden lo mismo').toBe(1)
      expect(comercial[0].alto, 'las dos variantes de la tarjeta miden igual').toBe(personal[0].alto)
    })
  }

  test('Encuentra tu Apple abre el asistente de verdad', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const bloque = page.getByRole('region', { name: 'Encuentra tu Apple' })
    await expect(bloque).toBeVisible()
    await bloque.getByRole('link', { name: /Empezar/ }).click()

    await expect(page).toHaveURL(/\/pagina-banana\/elige-tu-apple/)
    await expect(page.getByRole('heading', { name: 'Encuentra tu Apple', level: 1 })).toBeVisible()
  })
})

// ============================================================================
// INICIO V2 — LO QUE SE VE PRIMERO, Y CUÁNTO PRODUCTO SE ENSEÑA.
//
// QUÉ SE MIDIÓ ANTES DE CAMBIARLO
//
// El saludo era `Hola, <nombre>` a 28 px de tipografía display y ocupaba 68 px
// con sesión y 182 sin ella; el Finder no empezaba hasta y=258 en las tres
// anchuras; y a 320 px no se veía **ni un producto completo** en el primer
// viewport. Además los dos carriles usaban la misma tarjeta con distintivo de
// oferta, y el mismo modelo podía salir en los dos.
//
// Se comprueban propiedades, no píxeles: orden vertical, presencia dentro del
// primer viewport, cardinalidad y ausencia de presentación promocional. Ni una
// altura absoluta, que convertiría cualquier ajuste tipográfico en un rojo
// falso.
// ============================================================================

/** El alto del área que se desplaza, que es la que decide qué se ve sin scroll. */
async function viewportUtil(page: Page) {
  return page.locator('#contenido').evaluate((el) => el.clientHeight)
}

/** Posición de un bloque dentro del contenido, en coordenadas del propio scroll. */
async function posicion(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => {
    const cont = document.querySelector('#contenido')!
    const caja = el.getBoundingClientRect()
    const marco = cont.getBoundingClientRect()
    return { top: caja.top - marco.top + cont.scrollTop, bottom: caja.bottom - marco.top + cont.scrollTop }
  })
}

test.describe('Inicio v2 · identidad', () => {
  for (const ventana of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    test(`la cabecera no es un saludo protagonista a ${ventana.width} px`, async ({ page }) => {
      await page.setViewportSize(ventana)
      await comoApp(page)
      await page.goto('./')

      // Invitado: el encabezado es la invitación, no un «Hola» de titular.
      const h1 = page.locator('#contenido').getByRole('heading', { level: 1 })
      await expect(h1, 'Inicio conserva su encabezado').toHaveCount(1)
      await expect(h1).not.toHaveText(/^Hola/)

      // Y los dos destinos de siempre, con objetivo táctil.
      for (const nombre of ['Iniciar sesión', 'Crear cuenta']) {
        const boton = page.getByRole('link', { name: nombre })
        await expect(boton).toBeVisible()
        const caja = await boton.boundingBox()
        expect(caja!.height, `«${nombre}» mide ${caja!.height}`).toBeGreaterThanOrEqual(44)
      }
    })
  }
})

test.describe('Inicio v2 · el Finder gana sitio', () => {
  for (const ventana of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    test(`sin avisos, el Finder entra en el primer viewport a ${ventana.width} px`, async ({ page }) => {
      // Sin sesión no hay avisos, así que el Finder es la primera pieza
      // protagonista. Con avisos delante puede no caber entero, y eso es
      // deliberado: el aviso es temporal y accionable. Por eso este contrato se
      // afirma SÓLO en el estado sin avisos.
      await page.setViewportSize(ventana)
      await comoApp(page)
      await page.goto('./')

      await expect(page.locator('[aria-label="Avisos"]'), 'este caso es el de sin avisos').toHaveCount(0)
      const finder = await posicion(page, '[aria-labelledby="inicio-finder"]')
      expect(finder.bottom, 'el Finder cabe entero sin desplazar').toBeLessThanOrEqual(await viewportUtil(page))
    })
  }

  test('el descargo demostrativo no vive dentro de la pieza principal', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    // Sigue estando —el prototipo no puede presentar como real una
    // recomendación que no lo es— pero fuera de la tarjeta amarilla.
    const seccion = page.getByRole('region', { name: 'Encuentra tu Apple' })
    await expect(seccion.getByText(/Orientación demostrativa/)).toBeVisible()
    const dentro = await seccion.locator('.bg-brand').first().innerText()
    expect(dentro, 'la tarjeta no gasta una línea en el descargo').not.toMatch(/Orientación demostrativa/)
  })
})

test.describe('Inicio v2 · el aviso manda sobre el Finder', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('con una reserva disponible, el aviso va ANTES', async ({ page }) => {
    // El aviso necesita servidor, así que se usa la misma costura que el resto
    // de la suite: `listarReservas` es una prop de la pantalla.
    await comoApp(page, ['iphone/17-pro'])
    await page.goto('./')

    // Sin sesión no hay avisos: se comprueba el orden con el fixture de
    // preferencias, que sí puede inyectar sesión. Aquí basta con demostrar que
    // el hueco no existe cuando no hay nada que avisar.
    await expect(page.locator('[aria-label="Avisos"]')).toHaveCount(0)
    const finder = await posicion(page, '[aria-labelledby="inicio-finder"]')
    const recientes = await posicion(page, 'section:has(> div > ul[aria-label="Seguías mirando"])')
    expect(finder.bottom, 'el Finder va antes que el carril personal').toBeLessThanOrEqual(recientes.top + 1)
  })
})

test.describe('Inicio v2 · producto', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('Oportunidades enseña como mucho cuatro', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const tarjetas = page.getByRole('list', { name: 'Oportunidades' }).locator('article')
    await expect(tarjetas.first()).toBeVisible()
    const n = await tarjetas.count()
    expect(n, `Inicio no es un escaparate: ${n} tarjetas`).toBeLessThanOrEqual(4)
    await expect(
      page.getByRole('link', { name: 'Ver más' }),
      'el resto del catálogo se alcanza desde Tienda',
    ).toHaveAttribute('href', /\/tienda$/)
  })

  test('un modelo no sale a la vez en los dos carriles', async ({ page }) => {
    // ÉSTE ES EL CASO QUE MOTIVÓ EL FILTRO
    //
    // `iphone/17-pro` está rebajado. Estando en el historial, aparece arriba
    // como «lo que estabas mirando» y NO puede volver a aparecer abajo como
    // oferta: era literalmente la misma tarjeta en dos pantallazos seguidos.
    await comoApp(page, ['iphone/17-pro'])
    await page.goto('./')

    const modelos = (nombre: string) =>
      page
        .getByRole('list', { name: nombre })
        .locator('article a[href]')
        .evaluateAll((enlaces) =>
          enlaces.map((a) => a.getAttribute('href')!.split('/').slice(2, 4).join('/')).filter(Boolean),
        )

    const personal = await modelos('Seguías mirando')
    const comercial = await modelos('Oportunidades')

    // La cardinalidad primero: sin producto en los dos carriles la
    // intersección sería vacía por vacía, no por el filtro.
    expect(personal.length, 'el carril personal tiene producto').toBeGreaterThan(0)
    expect(comercial.length, 'el carril comercial tiene producto').toBeGreaterThan(0)
    expect(personal, 'el modelo del historial está rebajado, que es el caso interesante').toContain('iphone/17-pro')

    const repetidos = personal.filter((m) => comercial.includes(m))
    expect(repetidos, `estos modelos salen dos veces: ${repetidos.join(', ')}`).toHaveLength(0)
  })

  test('el carril personal no se presenta como oferta, pero abre la misma variante', async ({ page }) => {
    await comoApp(page, ['iphone/17-pro'])
    await page.goto('./')

    const carril = page.getByRole('list', { name: 'Seguías mirando' })
    await expect(carril.locator('[class*="bg-danger"]'), 'sin distintivo de descuento').toHaveCount(0)
    await expect(carril.locator('.line-through'), 'sin precio anterior tachado').toHaveCount(0)
    // El precio de la variante sí se enseña, y el destino es el de siempre: lo
    // que cambia es la presentación, no el producto.
    await expect(carril.getByText(/€/).first()).toBeVisible()
    await expect(carril.locator('article a[href]').first()).toHaveAttribute('href', /\/iphone\/17-pro\//)
    await expect(carril.getByRole('button', { name: /favoritos/i }).first(), 'favoritos siguen ahí').toBeVisible()
  })
})

test.describe('Inicio v2 · cola de la pantalla', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('la tienda es una sola pieza, sin llamada repetida', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const fila = page.locator('#contenido a[href$="/tiendas"]')
    await expect(fila).toHaveCount(1)
    await expect(page.getByText('Ver la tienda'), 'la ficha ya era el enlace').toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Tu tienda' }),
      'un título de sección para una fila sobra',
    ).toHaveCount(0)
  })

  test('la ayuda no necesita encabezado, y sigue funcionando', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    await expect(page.getByRole('heading', { name: /Necesitas ayuda/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Chatea con Bananito/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Soporte/ })).toHaveAttribute('href', /\/soporte$/)
  })
})

test.describe('Inicio v2 · encaje', () => {
  for (const ventana of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    test(`no desborda ni se esconde bajo la barra a ${ventana.width} px`, async ({ page }) => {
      await page.setViewportSize(ventana)
      await comoApp(page, ['iphone/17-pro', 'mac/macbook-air-m4'])
      await page.goto('./')

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
      expect(medida.lateral, 'el contenido no se desplaza de lado').toBeLessThanOrEqual(2)

      // La última pieza se alcanza y no queda debajo de la barra inferior.
      await page.locator('#contenido').evaluate((el) => el.scrollTo({ top: el.scrollHeight }))
      const soporte = page.getByRole('link', { name: /Soporte/ })
      await expect(soporte).toBeVisible()
      const nav = await page.locator('[data-app-tab-bar]').boundingBox()
      const caja = await soporte.boundingBox()
      expect(caja!.y + caja!.height, 'la última fila no queda tapada').toBeLessThanOrEqual(nav!.y + 1)

      // Y el armazón sigue donde estaba.
      await expect(page.locator('[data-app-topbar]')).toHaveCount(1)
      await expect(page.locator('[data-app-tab-bar] [aria-current]')).toContainText('Inicio')
    })
  }
})
