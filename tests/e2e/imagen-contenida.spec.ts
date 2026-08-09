import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// Una foto de producto no puede salirse de su marco.
//
// `ProductImage` fija la proporción de la caja con `aspect-ratio` y recorta lo
// que sobre con `overflow-hidden`. La imagen de dentro lleva `h-full w-full`
// para caber justa… y no cabía: con `grid place-items-center`, la única fila se
// dimensiona por contenido, y al calcularla el `h-full` todavía no puede
// resolverse —depende de la fila que se está midiendo—. La imagen caía en su
// proporción nativa 1:1, la fila se quedaba con ese tamaño y entonces `h-full`
// resolvía contra LA FILA en vez de contra la caja.
//
// Sólo se ve con proporciones NO cuadradas, que es donde fila y caja discrepan.
// Y no sólo recorta: también DESCOLOCA, porque el sobrante se reparte desde el
// borde de la fila. Medido con el grid, en una caja de 320 de ancho:
//
//   16/10 → imagen 320x320 en caja 320x200 · sobra 120 px · 60 px hacia abajo
//   4/3   → imagen 320x320 en caja 320x240 · sobra  80 px · 40 px hacia abajo
//   3/4   → imagen 427x427 en caja 320x427 · sobra 107 px · 53 px a la derecha
//   9/16  → imagen 569x569 en caja 320x569 · sobra 249 px · 124 px a la derecha
//
// Con proporciones verticales el desbordamiento es HORIZONTAL. Hoy no hay
// ninguna en uso, pero el componente las admite y se medían igual de mal.
//
// POR QUÉ SE MIDE `offsetHeight` Y NO `getBoundingClientRect`
//
// Porque el segundo incluye los `transform`, y `AccessoryImage` aplica un
// `scale` que viene de los datos para encuadrar accesorios: ese recorte SÍ es
// deliberado. La primera versión de esta prueba los confundió y marcó un
// adaptador como fallo. `offsetWidth`/`offsetHeight` es el tamaño de
// maquetación, que es exactamente lo que este fallo estropeaba.
// ============================================================================

/** Un favorito y dos elementos del comparador, con datos reales del catálogo. */
const FAVORITOS = ['mac/macbook-air-m4']
const COMPARADOR = [
  {
    id: 'mac|macbook-air-m4|Medianoche',
    modelSlug: 'macbook-air-m4',
    family: 'mac',
    name: 'MacBook Air M4',
    color: 'Medianoche',
    capacity: '13" · 16 GB · 256 GB',
    price: 1119,
    specs: [{ label: 'Chip', value: 'Apple M4' }],
    kind: 'device' as const,
  },
  {
    id: 'mac|macbook-air-m4|Plata',
    modelSlug: 'macbook-air-m4',
    family: 'mac',
    name: 'MacBook Air M4',
    color: 'Plata',
    capacity: '13" · 16 GB · 512 GB',
    price: 1369,
    specs: [{ label: 'Chip', value: 'Apple M4' }],
    kind: 'device' as const,
  },
]

/**
 * Cuántas fotos NO cuadradas debe montar cada superficie.
 *
 * Es lo que convierte la espera en determinista y, sobre todo, lo que impide
 * que la prueba pase en vacío: sin este mínimo, una página que dejara de
 * renderizar sus productos —o un estado vacío— daría cero imágenes que revisar
 * y la prueba seguiría en verde sin comprobar nada. Comprobado: favoritos,
 * comparador y buscador daban EXACTAMENTE eso, cero, hasta sembrarles estado.
 */
const CASOS = [
  { nombre: 'portada de Tienda en la app', ruta: './tienda', nativa: true, ancho: 390, minimo: 1 },
  { nombre: 'portada web', ruta: './', nativa: false, ancho: 1280, minimo: 1 },
  { nombre: 'ficha de modelo', ruta: './mac/macbook-air-m4', nativa: false, ancho: 390, minimo: 4 },
  { nombre: 'favoritos', ruta: './favoritos', nativa: false, ancho: 390, minimo: 1 },
  { nombre: 'comparador', ruta: './comparar', nativa: false, ancho: 1280, minimo: 2 },
]

/** Las fotos con caja de proporción fija, que son las que pueden recortar. */
const CONTAR_NO_CUADRADAS = () =>
  [...document.querySelectorAll('img')].filter((im) => {
    const marco = im.parentElement
    if (!marco) return false
    const proporcion = getComputedStyle(marco).aspectRatio
    return !!proporcion && proporcion !== 'auto' && proporcion.replace(/\s/g, '') !== '1/1'
  })

async function sembrar(page: Page, nativa: boolean) {
  await page.addInitScript(
    ([esNativa, favoritos, comparador]) => {
      if (esNativa) {
        ;(window as unknown as { Capacitor: unknown }).Capacitor = {
          isNativePlatform: () => true,
          getPlatform: () => 'ios',
        }
      }
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
      // Favoritos y comparador arrancan vacíos, y sin esto sus páginas enseñan
      // el estado vacío: ninguna foto que medir.
      localStorage.setItem('banana:fav', JSON.stringify(favoritos))
      localStorage.setItem('banana:compare', JSON.stringify(comparador))
    },
    [nativa, FAVORITOS, COMPARADOR] as const,
  )
}

/** Espera a que estén montadas, en vez de a que pase un rato. */
async function esperarFotos(page: Page, minimo: number) {
  await page.waitForFunction(
    ([contar, m]) => new Function(`return (${contar})()`)().length >= m,
    [CONTAR_NO_CUADRADAS.toString(), minimo] as const,
    { timeout: 20_000 },
  )
}

async function desbordan(page: Page) {
  return page.evaluate(
    (contar) =>
      (new Function(`return (${contar})()`)() as HTMLImageElement[])
        .map((im) => {
          const marco = im.parentElement as HTMLElement
          const sobra = Math.max(im.offsetHeight - marco.clientHeight, im.offsetWidth - marco.clientWidth)
          if (sobra <= 1) return null
          return `${im.currentSrc.split('/').pop()} sobra ${Math.round(sobra)}px (${im.offsetWidth}x${im.offsetHeight} en ${marco.clientWidth}x${marco.clientHeight})`
        })
        .filter(Boolean),
    CONTAR_NO_CUADRADAS.toString(),
  )
}

for (const caso of CASOS) {
  test(`la foto cabe en su marco — ${caso.nombre} @all`, async ({ page }) => {
    await page.setViewportSize({ width: caso.ancho, height: 900 })
    await sembrar(page, caso.nativa)
    await page.goto(caso.ruta)

    await esperarFotos(page, caso.minimo)
    const fuera = await desbordan(page)
    expect(fuera, `${caso.nombre}: ${fuera.join(' · ')}`).toEqual([])
  })
}

test('la foto cabe en su marco — resultados del buscador @all', async ({ page }) => {
  // El buscador no se puede sembrar: sus resultados sólo existen después de
  // responder. Se responde, que es lo que hace cualquiera que llegue ahí.
  //
  // La ruta es `elige-tu-apple`. La primera versión de esta prueba apuntaba a
  // `elige-tu-mac`, que NO existe: el SPA servía otra cosa, no había ninguna
  // foto que medir y la prueba pasaba en vacío.
  await page.setViewportSize({ width: 1280, height: 900 })
  await sembrar(page, false)
  await page.goto('./elige-tu-apple')

  await page.getByRole('button', { name: 'Empezar' }).click()
  await page.getByRole('radio', { name: 'Mac' }).click()

  // El cuestionario se recorre respondiendo lo que falte, sin fijar cuántos
  // pasos tiene ni qué pregunta viene: así una pregunta nueva no rompe esta
  // prueba, que no viene a comprobar el asistente sino sus fotos. El primer
  // paso lleva DOS grupos —familia y uso—, de ahí que no baste con una
  // respuesta por pantalla.
  const avanzar = page.getByRole('button', { name: /^Siguiente|^Continuar/ })
  const recomendaciones = page.getByRole('button', { name: /Ver recomendaciones/ })

  for (let paso = 0; paso < 10; paso++) {
    if (await recomendaciones.isVisible().catch(() => false)) break
    for (let intento = 0; intento < 4; intento++) {
      if (await avanzar.isEnabled().catch(() => false)) break
      const pendiente = page.getByRole('radio', { checked: false }).first()
      if (!(await pendiente.isVisible().catch(() => false))) break
      await pendiente.click()
    }
    if (!(await avanzar.isEnabled().catch(() => false))) break
    await avanzar.click()
  }

  await expect(recomendaciones).toBeVisible()
  await recomendaciones.click()

  await esperarFotos(page, 1)
  const fuera = await desbordan(page)
  expect(fuera, `buscador: ${fuera.join(' · ')}`).toEqual([])
})
