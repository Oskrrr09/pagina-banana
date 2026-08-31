import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// UNA FORMA INESPERADA EN `banana:compare` NO PUEDE TIRAR LA APLICACIÓN.
//
// QUÉ SE ROMPÍA, Y HASTA DÓNDE
//
// `usePersistent` envuelve `JSON.parse` en try/catch, así que la clave
// ausente y el JSON roto están cubiertos. Lo que no está cubierto es la FORMA
// de lo que sale del parseo, y el daño no se queda en el comparador: `Header`
// y `useTarjetaDeProducto` leen `compare.length`, así que con `null` guardado
// se quedaban en blanco la portada, el catálogo y el carrito, en app y en web.
// No hay `ErrorBoundary` en el proyecto: una excepción al pintar se lleva la
// aplicación entera, no sólo la página.
//
// Medido antes del arreglo:
//
//   null            → EN BLANCO en /, /iphone, /carrito y /comparar (app y web)
//   {"a":1}         → EN BLANCO en /comparar, /iphone y / (web)
//   ["iphone/17-pro"] → EN BLANCO en /comparar
//
// POR DÓNDE LLEGA UNA FORMA ASÍ
//
// Por la interfaz, por ninguna: la aplicación sólo escribe listas bien
// formadas. Por una evolución del esquema, una vuelta atrás a un bundle
// anterior o manipulación externa, sí. El coste de protegerlo es una guarda de
// forma al leer, y el fallo que evita es de los peores posibles.
//
// ESTO NO REDISEÑA EL COMPARADOR. Su composición no se toca: D2 no ha
// empezado.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/**
 * Deja en `banana:compare` un valor crudo, tal cual, antes de arrancar.
 *
 * SÓLO EN LA PRIMERA CARGA. `addInitScript` se ejecuta en CADA navegación,
 * recarga incluida: sin el cerrojo volvía a escribir el valor corrupto encima
 * de la selección que se acababa de hacer, y la comprobación de que la
 * comparación sobrevive a la recarga fallaba por culpa de la propia prueba.
 */
function conComparacionGuardada(page: Page, crudo: string) {
  return page.addInitScript((valor) => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    if (sessionStorage.getItem('sembrado-compare')) return
    sessionStorage.setItem('sembrado-compare', '1')
    localStorage.setItem('banana:compare', valor)
  }, crudo)
}

/** ¿Pintó algo, y sin excepciones sin controlar? */
async function pantalla(page: Page) {
  const errores: string[] = []
  page.on('pageerror', (e) => errores.push(e.message))
  return {
    errores,
    async estado() {
      return page.evaluate(() => ({
        vacia: document.body.innerText.trim().length === 0,
        hayContenido: Boolean(document.querySelector('main')),
      }))
    },
  }
}

const FORMAS = [
  ['null', 'null'],
  ['un objeto en vez de una lista', '{"a":1}'],
  ['una lista de cadenas', '["iphone/17-pro","iphone/17"]'],
  ['una lista con elementos nulos', '[null,null]'],
  ['un número', '42'],
] as const

// ---------------------------------------------------------------------------
// El daño real: cuatro pantallas, las dos plataformas
// ---------------------------------------------------------------------------

for (const modo of ['app', 'web'] as const) {
  for (const [etiqueta, crudo] of FORMAS) {
    test.describe(`con ${etiqueta} guardado · ${modo}`, () => {
      test.use({ viewport: { width: 390, height: 844 } })

      test('las pantallas siguen pintando y no hay excepción sin controlar', async ({ page }) => {
        if (modo === 'app') await comoApp(page)
        await conComparacionGuardada(page, crudo)
        const p = await pantalla(page)

        // Las cuatro que leen la lista, directa o indirectamente.
        for (const ruta of ['./', './iphone', './carrito', './comparar']) {
          await page.goto(ruta)
          const e = await p.estado()
          expect(e.vacia, `«${ruta}» se quedó en blanco con ${etiqueta}`).toBe(false)
          expect(e.hayContenido, `«${ruta}» no pintó contenido`).toBe(true)
        }

        expect(p.errores, `excepciones sin controlar: ${p.errores.join(' | ')}`).toEqual([])
      })

      test('el comparador queda como comparación vacía y se puede volver a usar', async ({ page }) => {
        if (modo === 'app') await comoApp(page)
        await conComparacionGuardada(page, crudo)
        await page.goto('./comparar')

        // Estado seguro: el comparador vacío, con sus huecos para elegir.
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.locator('[data-model-picker-trigger]').first()).toBeVisible()

        // Y se puede seguir comparando: se elige un modelo de verdad, por el
        // mismo camino que recorre `comparator.spec.ts`.
        await page.locator('[data-model-picker-trigger]').first().click()
        const dialogo = page.getByRole('dialog', { name: /^Elegir modelo de/ })
        await expect(dialogo).toBeVisible()
        await dialogo.getByRole('button', { name: /^Elegir iPhone 17 Pro$/ }).click()
        await expect(dialogo).toBeHidden()
        await expect(
          page.getByRole('group', { name: /^Modelos comparados/ }).getByText('iPhone 17 Pro', { exact: true }),
        ).toBeVisible()

        // Lo persistido vuelve a ser una lista utilizable.
        const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? 'null'))
        expect(Array.isArray(guardado), 'lo guardado vuelve a ser una lista').toBe(true)
        expect(guardado.length).toBe(1)
        expect(guardado[0]).toMatchObject({ modelSlug: '17-pro', family: 'iphone' })

        // Y sobrevive a la recarga.
        await page.reload()
        await expect(
          page.getByRole('group', { name: /^Modelos comparados/ }).getByText('iPhone 17 Pro', { exact: true }),
        ).toBeVisible()
      })
    })
  }
}

// ---------------------------------------------------------------------------
// Lo legítimo se conserva: la guarda no puede tirar comparaciones buenas
// ---------------------------------------------------------------------------

test.describe('una comparación guardada legítima no se toca', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  const DOS = JSON.stringify([
    {
      id: 'iphone/17-pro/Negro/256GB',
      modelSlug: '17-pro',
      family: 'iphone',
      name: 'iPhone 17 Pro',
      color: 'Negro',
      capacity: '256GB',
      price: 1229,
      specs: [],
    },
    {
      id: 'iphone/17/Negro/128GB',
      modelSlug: '17',
      family: 'iphone',
      name: 'iPhone 17',
      color: 'Negro',
      capacity: '128GB',
      price: 959,
      specs: [],
    },
  ])

  test('se abre con sus dos modelos y sus diferencias', async ({ page }) => {
    await comoApp(page)
    await conComparacionGuardada(page, DOS)
    await page.goto('./comparar')

    // Por nombre exacto y contando: «iPhone 17» es subcadena de «iPhone 17
    // Pro», así que una comprobación por texto suelto no distingue las dos
    // columnas.
    const nombres = await page.evaluate(() => {
      const grupo = [...document.querySelectorAll('[role="group"]')].find((g) =>
        /^Modelos comparados/.test(g.getAttribute('aria-label') ?? ''),
      )
      // El precio también va en negrita en la tarjeta; se descarta por el símbolo.
      return [...(grupo?.querySelectorAll('p.font-bold') ?? [])]
        .map((p) => (p.textContent ?? '').trim())
        .filter((texto) => !texto.includes('€'))
    })
    expect(nombres, 'las dos columnas guardadas siguen ahí').toEqual(['iPhone 17 Pro', 'iPhone 17'])
    await expect(page.getByRole('button', { name: 'Solo diferencias' })).toBeVisible()
    expect(await page.locator('tbody th[scope="row"]').count(), 'con filas de diferencias').toBeGreaterThan(0)
  })

  test('un elemento sin datos de presentación se conserva y se resuelve del catálogo', async ({ page }) => {
    // `name`, `color`, `precio` y `specs` no son imprescindibles: la tabla la
    // construye el catálogo a partir de `modelSlug`. Una guarda estricta los
    // habría tirado, y con ellos una comparación que hoy funciona.
    await comoApp(page)
    await conComparacionGuardada(
      page,
      JSON.stringify([{ id: 'iphone/17-pro/Negro/256GB', modelSlug: '17-pro', family: 'iphone' }]),
    )
    await page.goto('./comparar')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
    expect(guardado.length, 'no se descarta por no traer datos de presentación').toBe(1)
  })
})
