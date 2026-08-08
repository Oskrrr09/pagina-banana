import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// La web cabe en la ventana, sea cual sea el ancho.
//
// POR QUÉ NO BASTA CON `mobile-layout.spec.ts`
//
// Aquella prueba mide `documentElement.scrollWidth`, y el documento lleva
// `overflow-x: clip`: bajo `clip` nunca declara desbordamiento aunque su
// contenido se salga. Dos fallos reales han pasado ya por delante de ella —el
// cupón del carrito y el menú de Cuenta— sin que se enterara.
//
// Aquí se neutraliza la contención un instante para poder medir de verdad, y se
// barre un abanico de anchos en vez de dos: los fallos de encaje no aparecen
// sólo en el móvil más estrecho, sino en el punto en el que una rejilla cambia
// de columnas o alguien encoge la ventana del navegador.
//
// La tolerancia es de 2 px: los motores redondean el subpíxel de forma distinta
// y una aserción a cero sería intermitente sin cazar nada más.
// ============================================================================

const TOLERANCIA = 2

// De un iPhone SE a una ventana estrecha de escritorio. 600 y 900 están a
// propósito entre los cortes de Tailwind, que es donde suele romperse.
const ANCHOS = [320, 414, 600, 768, 900, 1024]

const RUTAS = [
  '/',
  '/iphone',
  '/iphone/17-pro',
  '/iphone/17-pro/256gb-plata',
  '/accesorios',
  '/buscar?q=airpods',
  '/comparar',
  '/carrito',
  '/favoritos',
  '/tiendas',
  '/soporte',
  '/plan-renove',
  '/elige-tu-apple',
  '/login',
  '/mis-productos',
  // El panel de agentes es parte de la web aunque no del catálogo, y sus
  // avisos a pantalla completa se salían por debajo de 414 px.
  '/agente',
  '/agente/login',
]

async function sinAvisos(page: Page) {
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
}

/** Desbordamiento horizontal real, con la contención apartada un instante. */
async function desbordamiento(page: Page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const guardado = [de.style.overflowX, document.body.style.overflowX]
    de.style.overflowX = 'visible'
    document.body.style.overflowX = 'visible'
    const medida = de.scrollWidth - de.clientWidth
    de.style.overflowX = guardado[0]
    document.body.style.overflowX = guardado[1]
    return medida
  })
}

for (const width of ANCHOS) {
  test(`ninguna ruta desborda a ${width} px @all`, async ({ page }) => {
    await sinAvisos(page)
    await page.setViewportSize({ width, height: 850 })

    for (const ruta of RUTAS) {
      await page.goto('.' + ruta)
      await page.waitForSelector('#root > *', { timeout: 15_000 }).catch(() => {})
      const desborde = await desbordamiento(page)
      expect(desborde, `${ruta} desborda ${desborde}px a ${width}px`).toBeLessThanOrEqual(TOLERANCIA)
    }
  })
}

// ============================================================================
// El indicador de tienda avisa antes de abrir y antes de cerrar.
//
// La lógica se prueba en `tests/unit/estado-tiendas.test.ts`; aquí sólo se
// comprueba que la pantalla la use y que el estado llegue al marcado, que es lo
// que el fixture no puede ver.
// ============================================================================

test('las tiendas enseñan su estado, y no sólo abierto o cerrado @all', async ({ page }) => {
  await sinAvisos(page)
  await page.goto('./tiendas')

  const distintivos = page.locator('[data-store-status]')
  await expect(distintivos.first()).toBeVisible()

  // Cada distintivo declara uno de los cuatro estados reales.
  const estados = await distintivos.evaluateAll((els) => els.map((e) => e.getAttribute('data-store-status')))
  expect(estados.length).toBeGreaterThan(0)
  for (const estado of estados) {
    expect(['abierta', 'cierra-pronto', 'abre-pronto', 'cerrada']).toContain(estado)
  }

  // Y el texto acompaña al color: quien no distingue el ámbar lo lee.
  const primero = distintivos.first()
  const estado = await primero.getAttribute('data-store-status')
  const textos: Record<string, RegExp> = {
    abierta: /Abierto ahora/,
    'cierra-pronto': /Cierra pronto/,
    'abre-pronto': /Abre pronto/,
    cerrada: /Cerrado/,
  }
  await expect(primero).toHaveText(textos[estado!])
})
