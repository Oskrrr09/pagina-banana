import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// LA PÁGINA DE FAMILIA NO ES LA MISMA EN WEB Y EN LA APP.
//
// QUÉ REGRESIÓN PROTEGE ESTA SUITE
//
// `f3143d85` se llamaba «feat(app): Tienda deja el catálogo a un toque» y era,
// de verdad, una mejora para la app: en `/iphone` los filtros aparecían en
// y=2.238, casi tres pantallas por debajo, porque delante había un carrusel de
// modelos y un escaparate de ofertas.
//
// Pero `FamilyPage` la montaban las dos plataformas. Al simplificarla «para la
// app» **desapareció también de la web** el carrusel de modelos, el escaparate
// de Oportunidades con su degradado y el encabezado del catálogo completo. En
// escritorio quedó una pantalla de móvil estirada a 1440 px.
//
// La PR #85 (Fase A) no causó la desaparición —ya no estaban—, pero siguió
// modificando la misma composición compartida, que es justamente el patrón que
// hay que cortar.
//
// LA REGLA QUE SE PROTEGE AQUÍ
//
// Web y app son experiencias visuales distintas. Comparten datos, tipos,
// precios, lógica de filtros y estado; **no comparten composición visual**. Si
// tocar una plataforma puede cambiar la otra por accidente, la frontera está
// mal puesta.
//
// POR QUÉ NO SE COMPRUEBAN CLASES NI PÍXELES
//
// Las clases de Tailwind cambian con cualquier retoque y no dicen nada de la
// arquitectura. Se comprueba lo que sí es contrato: qué secciones existen, en
// qué orden y qué plataforma las monta. `data-familia-seccion` expresa
// intención arquitectónica —qué es este bloque—, no cómo se ve.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/** Orden de aparición en el DOM de las secciones de una familia. */
async function seccionesEnOrden(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-familia-seccion]')].map((s) => s.getAttribute('data-familia-seccion')),
  )
}

test.describe('la web de familia conserva su escaparate', () => {
  test('/iphone monta carrusel, Oportunidades y catálogo, en ese orden', async ({ page }) => {
    await page.goto('./iphone')

    // 1 — El carrusel de modelos. Se localiza por rol y nombre accesible, no
    //     por clase: es una navegación entre los modelos de la familia.
    const modelos = page.getByRole('navigation', { name: /iPhone/ })
    await expect(modelos, 'la web abre con el carrusel de modelos').toBeVisible()
    for (const nombre of ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17']) {
      await expect(modelos.getByRole('link', { name: new RegExp(nombre) }).first()).toBeVisible()
    }

    // 2 — Oportunidades, con su tratamiento propio.
    const oportunidades = page.locator('[data-familia-seccion="oportunidades"]')
    await expect(oportunidades, 'la web enseña un escaparate de ofertas').toBeVisible()
    // Sólo lo rebajado, no el catálogo entero: iPhone 17 Pro y iPhone 17 tienen
    // precio anterior; el Pro Max y el Air, no.
    await expect(oportunidades.getByRole('link', { name: /iPhone 17 Pro\b/ })).toBeVisible()
    await expect(
      oportunidades.getByRole('link', { name: /iPhone 17 Pro Max/ }),
      'no se cuela un modelo sin oferta',
    ).toHaveCount(0)
    // El degradado es parte de la identidad de la sección, así que se comprueba
    // que existe un fondo de degradado —no un color concreto—.
    await expect
      .poll(() => oportunidades.evaluate((s) => getComputedStyle(s).backgroundImage.includes('gradient')))
      .toBe(true)

    // 3 — El catálogo completo, con su encabezado.
    const catalogo = page.locator('[data-familia-seccion="catalogo"]')
    await expect(catalogo).toBeVisible()
    // Nivel 2: el encabezado de la sección, no los `h3` de cada tarjeta.
    await expect(catalogo.getByRole('heading', { level: 2, name: /iPhone/ })).toBeVisible()
    await expect(catalogo.locator('[data-product-card]'), 'el catálogo sigue completo').toHaveCount(4)

    // 4 — Y en este orden.
    expect(await seccionesEnOrden(page)).toEqual(['modelos', 'oportunidades', 'catalogo'])
  })

  test('/mac lo hace igual: no es un caso especial de iPhone', async ({ page }) => {
    await page.goto('./mac')

    await expect(page.getByRole('navigation', { name: /Mac/ })).toBeVisible()
    await expect(page.locator('[data-familia-seccion="oportunidades"]')).toBeVisible()
    expect(await seccionesEnOrden(page)).toEqual(['modelos', 'oportunidades', 'catalogo'])
  })

  test('los filtros de la web enseñan el orden sin abrir una hoja', async ({ page }) => {
    await page.goto('./iphone')

    // La web recupera su presentación: el orden es un control de formulario a la
    // vista y el recuento se lee. En la app eso ocupaba una tercera pieza por
    // delante del producto y se convirtió en dos botones; aquí sobra sitio.
    await expect(page.getByLabel(/Ordenar/)).toBeVisible()
    await expect(page.getByText(/\d+ de \d+/).first()).toBeVisible()
  })
})

test.describe('la app de familia conserva la Fase A', () => {
  test('/iphone nativo no monta nada del escaparate web', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone')

    expect(await seccionesEnOrden(page), 'la app monta su propia composición').toEqual([])
    await expect(page.locator('[data-familia-seccion="oportunidades"]')).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: /Modelos de/ })).toHaveCount(0)

    // Y sigue teniendo lo suyo: los dos controles compactos, cada uno con su
    // panel. El contrato de que el producto entra en el primer viewport lo
    // guarda `producto-en-pantalla.spec.ts`.
    await page.getByRole('button', { name: /Filtrar/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filtrar' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: /Ordenar/ }).click()
    await expect(page.getByRole('dialog', { name: 'Ordenar' })).toBeVisible()
  })
})
