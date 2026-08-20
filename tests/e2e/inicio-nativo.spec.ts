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

const CONTINUA = 'Continúa donde lo dejaste'

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
      page.getByRole('heading', { name: CONTINUA }),
      'sin historial no puede haber sección de continuar',
    ).toHaveCount(0)
    await expect(
      page.locator('[aria-label="Avisos"]'),
      'sin sesión no hay reservas que avisar, así que no hay bloque',
    ).toHaveCount(0)
  })

  test('«Continúa donde lo dejaste» sale del historial y lleva al modelo visto', async ({ page }) => {
    await comoApp(page, ['iphone/17-pro', 'mac/macbook-air-m5'])
    await page.goto('./')

    const seccion = page.getByRole('list', { name: CONTINUA })
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

      const carril = page.getByRole('list', { name: CONTINUA })
      await expect(carril).toBeVisible()

      const medidas = await carril.evaluate((ul) =>
        [...ul.querySelectorAll('article')].map((a) => ({
          nombre: (a.querySelector('h3')?.textContent ?? '').trim(),
          alto: Math.round(a.getBoundingClientRect().height * 100) / 100,
          conOferta: Boolean(a.querySelector('[class*="bg-danger"]')),
        })),
      )

      // Sin mezcla, la comprobación de abajo no significaría nada: pasaría
      // igual con tres tarjetas idénticas.
      expect(medidas.length, 'el carril necesita varias tarjetas para comparar').toBeGreaterThanOrEqual(3)
      expect(
        new Set(medidas.map((m) => m.conOferta)).size,
        'el carril tiene que mezclar una tarjeta con oferta y otra sin ella',
      ).toBe(2)

      const alturas = [...new Set(medidas.map((m) => m.alto))]
      expect(
        alturas.length,
        `las tarjetas terminan a alturas distintas: ${medidas.map((m) => `${m.nombre}=${m.alto}`).join(' · ')}`,
      ).toBe(1)
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
