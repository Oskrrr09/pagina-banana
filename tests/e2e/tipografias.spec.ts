import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// Las tipografías no dependen de ningún servicio externo.
//
// POR QUÉ EXISTE ESTA PRUEBA
//
// La aplicación cargaba Inter y Manrope desde Google Fonts en cada visita. En
// el CI post-merge de la PR #50 una de esas peticiones devolvió **404**
// —Manrope, `woff2`, desde `fonts.gstatic.com`, a unos 228 ms del `goto`— y
// dejó `product.spec.ts` en intermitente. La tentación entonces era ampliar el
// filtro de errores de consola para tragarse los 404; eso habría escondido
// también imágenes, scripts y API rotas de verdad.
//
// Se quitó la dependencia en vez de taparla. Esta prueba vigila esa propiedad.
//
// QUÉ SE MIDE, Y POR QUÉ ASÍ
//
// No se comprueba que `index.html` no contenga cierta cadena: eso daría verde
// si las fuentes volvieran por un `@import` de CSS, por un módulo, por un
// componente o por cualquier otro camino. Se **observan las peticiones reales**
// del navegador en varias rutas, que es la propiedad que de verdad importa.
//
// `page.on('request')` sólo observa; no se intercepta nada, para que el
// artefacto se comporte exactamente como en producción.
// ============================================================================

/** Los servicios de los que NO queremos depender en tiempo de ejecución. */
const SERVICIOS_DE_FUENTES = ['fonts.googleapis.com', 'fonts.gstatic.com']

/** Rutas que entre las tres ejercitan las dos familias. */
const RUTAS = [
  './', // portada: titulares en Manrope y cuerpo en Inter
  './apple-watch/watch-series-11/42-mm-gps-alum-jet-black', // la ficha donde apareció el 404
  './tienda',
]

function observarPeticiones(page: Page) {
  const externas: string[] = []
  page.on('request', (peticion) => {
    const host = new URL(peticion.url()).hostname
    if (SERVICIOS_DE_FUENTES.includes(host)) externas.push(peticion.url())
  })
  return externas
}

test('ninguna ruta pide fuentes a un servicio externo', async ({ page }) => {
  const externas = observarPeticiones(page)

  for (const ruta of RUTAS) {
    await page.goto(ruta)
    // Esperar a que las fuentes terminen de resolverse: si algo fuera a
    // pedirse fuera, es aquí donde ocurriría.
    await page.evaluate(() => document.fonts.ready)
  }

  expect(externas, `peticiones a servicios de fuentes: ${externas.join(' · ')}`).toEqual([])
})

test('Inter y Manrope se aplican desde el propio artefacto', async ({ page }) => {
  // El contrapeso de la prueba anterior: sin esto, quitar las fuentes del todo
  // —y quedarse en `system-ui`— también daría cero peticiones externas y
  // parecería un acierto.
  const externas = observarPeticiones(page)

  await page.goto('./')
  await page.evaluate(() => document.fonts.ready)

  const tipografias = await page.evaluate(() => {
    const familias = new Set<string>()
    document.fonts.forEach((f) => familias.add(f.family.replace(/["']/g, '')))
    const cuerpo = getComputedStyle(document.body).fontFamily
    const titular = document.querySelector('h1, h2, h3')
    return {
      cargadas: [...familias],
      cuerpo,
      titular: titular ? getComputedStyle(titular).fontFamily : null,
      // `check` responde si el navegador puede pintar ya con esa combinación.
      interDisponible: document.fonts.check('400 16px Inter'),
      manropeDisponible: document.fonts.check('700 16px Manrope'),
    }
  })

  expect(tipografias.cargadas, 'Inter debe venir en el artefacto').toContain('Inter')
  expect(tipografias.cargadas, 'Manrope debe venir en el artefacto').toContain('Manrope')
  expect(tipografias.interDisponible, 'Inter debe poder pintarse').toBe(true)
  expect(tipografias.manropeDisponible, 'Manrope debe poder pintarse').toBe(true)
  expect(tipografias.cuerpo, 'el cuerpo sigue en Inter').toContain('Inter')
  expect(tipografias.titular, 'los titulares siguen en Manrope').toContain('Manrope')

  // Y sigue sin salir nadie a la red por ellas.
  expect(externas, `peticiones a servicios de fuentes: ${externas.join(' · ')}`).toEqual([])
})
