import { test, expect } from '@playwright/test'

// ============================================================================
// Una foto de producto no puede salirse de su marco.
//
// `ProductImage` fija la proporción de la caja con `aspect-ratio` y recorta lo
// que sobre con `overflow-hidden`. La imagen de dentro lleva `h-full w-full`
// para caber justa… y no cabía: con `grid place-items-center`, la única fila se
// dimensiona por contenido, y al calcularla el `h-full` todavía no puede
// resolverse —depende de la fila que se está midiendo—. La imagen caía en su
// proporción nativa 1:1, la fila se quedaba con ese alto y entonces `h-full`
// resolvía contra LA FILA en vez de contra la caja.
//
// Sólo se veía con proporciones NO cuadradas, que es donde fila y caja
// discrepan. Medido antes del arreglo: el portátil de la portada de la app
// sobresalía 119 px de una caja de 197,5 y salía cortado por abajo; el iPhone
// de la portada web, 182; y cuatro colores de la ficha de modelo, 77 cada uno.
//
// Se mide `offsetWidth`/`offsetHeight` —tamaño de maquetación— y no
// `getBoundingClientRect`, que incluye los `transform`: `AccessoryImage` aplica
// un `scale` de datos para encuadrar, y ese recorte sí es deliberado.
// ============================================================================

const CASOS = [
  { nombre: 'portada de Tienda en la app', ruta: './tienda', nativa: true, ancho: 390 },
  { nombre: 'portada web', ruta: './', nativa: false, ancho: 1280 },
  { nombre: 'ficha de modelo', ruta: './mac/macbook-air-m4', nativa: false, ancho: 390 },
  { nombre: 'favoritos', ruta: './favoritos', nativa: false, ancho: 390 },
  { nombre: 'comparador', ruta: './comparar', nativa: false, ancho: 1280 },
  { nombre: 'buscador de Mac', ruta: './elige-tu-mac', nativa: false, ancho: 1280 },
]

for (const caso of CASOS) {
  test(`la foto cabe en su marco — ${caso.nombre} @all`, async ({ page }) => {
    await page.setViewportSize({ width: caso.ancho, height: 900 })
    await page.addInitScript((nativa) => {
      if (nativa) {
        ;(window as unknown as { Capacitor: unknown }).Capacitor = {
          isNativePlatform: () => true,
          getPlatform: () => 'ios',
        }
      }
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    }, caso.nativa)

    await page.goto(caso.ruta)
    await page.waitForTimeout(1200)

    const desbordan = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .map((im) => {
          const marco = im.parentElement as HTMLElement | null
          if (!marco) return null
          // Sólo las cajas con proporción fija, que son las que recortan.
          const proporcion = getComputedStyle(marco).aspectRatio
          if (!proporcion || proporcion === 'auto') return null
          const sobra = Math.max(im.offsetHeight - marco.clientHeight, im.offsetWidth - marco.clientWidth)
          if (sobra <= 1) return null
          return `${im.currentSrc.split('/').pop()} sobra ${Math.round(sobra)}px (${im.offsetWidth}x${im.offsetHeight} en ${marco.clientWidth}x${marco.clientHeight})`
        })
        .filter(Boolean),
    )

    expect(desbordan, `${caso.nombre}: ${desbordan.join(' · ')}`).toEqual([])
  })
}
