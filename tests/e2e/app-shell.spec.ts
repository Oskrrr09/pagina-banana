import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Interfaz de la aplicación nativa.
//
// Dentro del binario, Capacitor inyecta `window.Capacitor` antes de cargar el
// bundle. Aquí se simula con `addInitScript`, que corre en ese mismo momento,
// así que se ejerce exactamente el mismo camino de código.

async function comoApp(page: Page) {
  await page.addInitScript(() => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    // El aviso de tienda favorita taparía la barra inferior en las capturas
    // y en las comprobaciones de posición.
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
}

test.describe('interfaz de la app nativa', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('la navegación vive en una barra inferior, no en el pie', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    const barra = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(barra).toBeVisible()

    // El orden importa: es el que se acordó con Oscar. Cuatro destinos desde
    // la PR #41; el carrito subió a la barra de arriba y «Explorar» y
    // «Favoritos» dejaron de ocupar sitio permanente.
    const etiquetas = await barra.locator('li').allInnerTexts()
    expect(etiquetas.map((t) => t.trim())).toEqual(['Inicio', 'Tienda', 'Compras', 'Cuenta'])

    // El pie de página es un mapa del sitio; dentro de una app sobra.
    await expect(page.getByRole('contentinfo')).toHaveCount(0)
  })

  test('las dos barras enmarcan la pantalla y solo se desplaza el centro', async ({ page }) => {
    // Regresión de lo que Oscar vio en el iPhone: las barras "flotaban" al
    // arrastrar y el contenido se colaba por encima de la de búsqueda.
    //
    // Se mide en Tienda y no en Inicio: desde la PR #41, Inicio es corta a
    // propósito y no siempre da para desplazar.
    //
    // La causa era `position: fixed`: en WKWebView los elementos fijos se
    // recolocan al TERMINAR el gesto, no durante. La solución no es ajustar
    // el fixed, es que el documento no se desplace: las barras son hermanas
    // del contenido y solo se desplaza el contenido.
    await comoApp(page)
    await page.goto('./tienda')

    const alto = page.viewportSize()!.height
    const cabecera = page.getByRole('banner')
    const barraInferior = page.locator('[data-app-tab-bar]')

    // Ni una ni otra están fijas: no hace falta, y es lo que fallaba.
    await expect(cabecera).not.toHaveCSS('position', 'fixed')
    await expect(barraInferior).not.toHaveCSS('position', 'fixed')

    const arriba = (await cabecera.boundingBox())!
    const abajo = (await barraInferior.boundingBox())!
    expect(Math.round(arriba.y)).toBe(0)
    expect(Math.round(abajo.y + abajo.height)).toBe(alto)

    // El documento no se desplaza; el contenedor de contenido sí.
    const documentoFijo = await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)
    expect(documentoFijo, 'el documento no debería poder desplazarse').toBe(true)

    const hayQueDesplazar = await page.locator('#contenido').evaluate((el) => el.scrollHeight > el.clientHeight + 1)
    expect(hayQueDesplazar, 'el contenido debería tener scroll propio').toBe(true)

    // Y tras desplazar el contenido, las barras siguen exactamente donde
    // estaban: no hay nada que recolocar.
    await page.locator('#contenido').evaluate((el) => el.scrollTo({ top: 900 }))
    await page.waitForTimeout(300)
    const arribaDespues = (await cabecera.boundingBox())!
    const abajoDespues = (await barraInferior.boundingBox())!
    expect(Math.round(arribaDespues.y)).toBe(0)
    expect(Math.round(abajoDespues.y + abajoDespues.height)).toBe(alto)
    expect(await page.locator('#contenido').evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  })

  // La prueba del menú de «Explorar» se retiró con la PR #41: esa pestaña ya
  // no existe —abría un diálogo en vez de navegar— y las categorías viven
  // dentro de Tienda. `MobileMenu` sigue en la cabecera de la web, que es
  // quien lo usa ahora, y se cubre en la sección «la web no cambia».

  test('la pestaña activa refleja la ruta', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')
    const barra = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(barra.getByRole('link', { name: /^Inicio/ })).toHaveAttribute('aria-current', 'page')

    await barra.getByRole('link', { name: /^Tienda/ }).click()
    await expect(page).toHaveURL(/\/tienda$/)
    await expect(barra.getByRole('link', { name: /^Tienda/ })).toHaveAttribute('aria-current', 'page')
    await expect(barra.getByRole('link', { name: /^Inicio/ })).not.toHaveAttribute('aria-current', 'page')
  })

  test('el carrito lleva su contador y no se repite en la cabecera', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
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
            qty: 2,
            insured: false,
          },
        ]),
      )
    })
    await page.goto('./')

    // Desde la PR #41 el carrito vive ARRIBA, no abajo: salió de la barra
    // inferior para dejar sitio a «Compras». Sigue valiendo lo de no
    // repetir un mismo destino dos veces en pantalla, sólo que al revés.
    await expect(page.getByRole('banner').getByRole('link', { name: 'Carrito (2)' })).toBeVisible()

    const barra = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(barra.getByRole('link', { name: /Carrito/ })).toHaveCount(0)
  })

  test('sin sesión, la pestaña Cuenta lleva al acceso', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')
    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: /^Cuenta/ })
      .click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('el chat no flota, pero sigue teniendo puerta', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')

    // La burbuja flotante es un patrón de web y competiría con la barra
    // inferior: dentro de la app no existe.
    await expect(page.getByRole('button', { name: 'Abrir chat de Bananito' })).toHaveCount(0)

    // Se abría desde el menú de «Explorar». Al retirarse esa pestaña el acceso
    // pasó a Inicio: sin él, el chat se habría quedado sin ninguna puerta
    // dentro del binario.
    await page.getByRole('button', { name: /Chatea con Bananito/ }).click()
    await expect(page.getByRole('dialog', { name: /Bananito/ })).toBeVisible()
  })

  test('al cerrar el chat el foco no se pierde', async ({ page }) => {
    // En la web vuelve a la burbuja. Aquí no hay burbuja, y dejar el foco en
    // `body` obligaría a quien navega por teclado a empezar desde arriba.
    await comoApp(page)
    await page.goto('./')
    await page.getByRole('button', { name: /Chatea con Bananito/ }).click()

    const chat = page.getByRole('dialog', { name: 'Bananito' })
    await expect(chat).toBeVisible()
    await chat.getByRole('button', { name: 'Cerrar chat' }).click()
    await expect(chat).toBeHidden()

    const enBody = await page.evaluate(() => document.activeElement === document.body)
    expect(enBody, 'el foco se quedó en <body> al cerrar el chat').toBe(false)
  })

  test('el aviso de tienda favorita no se cuela al pasar del menú al chat', async ({ page }) => {
    // Regresión encontrada en el emulador, no en las pruebas: comprobar la
    // presencia de modales una sola vez dejaba un hueco entre que se cierra
    // el diálogo anterior y se monta el chat, y por ahí el aviso aparecía
    // encima. Sigue valiendo aunque el acceso ya no sea el menú sino Inicio.
    // A propósito NO se descarta el aviso en este caso.
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
    })
    await page.goto('./')

    await page.getByRole('button', { name: /Chatea con Bananito/ }).click()

    const chat = page.getByRole('dialog', { name: 'Bananito' })
    await expect(chat).toBeVisible()

    // Bastante más que los 800 ms del temporizador del aviso.
    await page.waitForTimeout(2500)
    await expect(page.locator('[data-favorite-store-prompt]')).toHaveCount(0)
    await expect(chat).toBeVisible()
  })

  test('arriba hay un buscador con filtros de categoría, no una cabecera de web', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    const cabecera = page.getByRole('banner')
    await expect(cabecera.getByRole('button', { name: 'Buscar en Banana Computer' })).toBeVisible()

    // Filtros rápidos por familia, con las categorías reales del catálogo.
    // Van dentro del contenido, no de la cabecera: ver la prueba siguiente.
    // Y sólo en Tienda: encima de «Compras» o de «Cuenta» no aparecen.
    const categorias = page.getByRole('navigation', { name: 'Categorías' })
    await expect(categorias.getByRole('link', { name: 'iPhone' })).toBeVisible()
    await expect(categorias.getByRole('link', { name: 'Accesorios' })).toBeVisible()

    // El menú y el mega-menú de la web no están arriba. Desde la PR #41
    // tampoco hay «Explorar» abajo: las categorías son estos chips, y sólo
    // salen aquí, en el contexto comercial.
    await expect(cabecera.getByRole('button', { name: 'Abrir menú' })).toHaveCount(0)
  })

  test('solo el buscador queda fijo: los filtros se esconden al bajar', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')

    const buscador = page.getByRole('button', { name: 'Buscar en Banana Computer' })
    const categorias = page.getByRole('navigation', { name: 'Categorías' })

    const buscadorAntes = (await buscador.boundingBox())!
    const filtrosAntes = (await categorias.boundingBox())!
    expect(filtrosAntes.y).toBeGreaterThan(buscadorAntes.y)

    await page.locator('#contenido').evaluate((el) => el.scrollTo({ top: 400 }))
    await page.waitForTimeout(300)

    // El buscador no se mueve.
    const buscadorDespues = (await buscador.boundingBox())!
    expect(Math.round(buscadorDespues.y)).toBe(Math.round(buscadorAntes.y))

    // Los filtros sí: se van hacia arriba y quedan fuera del contenedor,
    // recortados justo bajo la barra de búsqueda.
    const contenedor = (await page.locator('#contenido').boundingBox())!
    const filtrosDespues = await categorias.boundingBox()
    const escondidos = filtrosDespues === null || filtrosDespues.y + filtrosDespues.height <= contenedor.y + 1
    expect(escondidos, 'los filtros deberían haberse escondido bajo el buscador').toBe(true)
  })

  test('el buscador de arriba abre el mismo buscador a pantalla completa', async ({ page }) => {
    await comoApp(page)
    await page.goto('./')
    await page.getByRole('button', { name: 'Buscar en Banana Computer' }).click()

    const buscador = page.getByRole('dialog', { name: 'Buscar' })
    await expect(buscador).toBeVisible()
    await page.keyboard.type('airpods')
    // Mismo motor que /buscar: debe autocompletar.
    await expect(buscador.getByRole('option').first()).toBeVisible({ timeout: 5000 })
  })

  test('un filtro de categoría navega a su familia', async ({ page }) => {
    await comoApp(page)
    await page.goto('./tienda')
    await page.getByRole('navigation', { name: 'Categorías' }).getByRole('link', { name: 'iPhone' }).click()
    await expect(page).toHaveURL(/\/iphone$/)
  })

  test('la barra inferior no tiene fallos de accesibilidad', async ({ page }) => {
    await comoApp(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('./')
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a'])
      .include('[data-app-tab-bar]')
      .analyze()
    expect(resultado.violations).toEqual([])
  })
})

test.describe('la web no cambia', () => {
  test('en el navegador sigue habiendo pie de página y ninguna barra inferior', async ({ page }) => {
    await page.goto('./')
    await expect(page.locator('[data-app-tab-bar]')).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
})
