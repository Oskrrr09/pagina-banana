import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// La navegación de la web no se pisa a sí misma — y existe donde debe existir.
//
// POR QUÉ NO BASTA CON MEDIR DESBORDAMIENTO
//
// La barra azul de servicios no desbordaba el documento: sus enlaces van
// centrados dentro del flujo y «Elige tienda» está posicionado en absoluto,
// fuera de él. El resultado no era una página más ancha, era una página en la
// que dos cosas ocupaban el mismo sitio — hasta 89 px de «Soporte» por debajo
// de «Elige tienda»—. `anchos.spec.ts` no podía verlo, y no es su culpa: sin
// overflow no hay nada que medir.
//
// POR QUÉ ESTA PRUEBA SE REESCRIBIÓ
//
// La primera versión sólo comprobaba «no hay cruces». Con la barra ausente hay
// cero cruces, así que **pasaba con la funcionalidad entera desaparecida**:
// medido en la auditoría, ocultándola a todos los anchos, cinco de sus siete
// pruebas seguían en verde. Y como la única que exigía verla no fijaba idioma,
// una regresión que la hiciera desaparecer sólo en francés —justo el idioma que
// motivó el arreglo, porque era el que seguía solapando a 1024— no la habría
// detectado nadie.
//
// De ahí la forma de ahora: **cada ancho declara qué debe existir**, y la
// medida de solapes sólo se hace después de haberlo comprobado. La ausencia es
// un fallo, no un aprobado.
// ============================================================================

/** Anchos donde la barra NO debe verse: no cabe, y sus accesos van al menú. */
const ANCHOS_SIN_BARRA = [640, 768, 900, 1024, 1100]

/** Anchos donde la barra SÍ debe verse, con todo dentro y sin pisarse. */
const ANCHOS_CON_BARRA = [1280, 1440]

const IDIOMAS = ['es', 'en', 'de', 'fr', 'it'] as const

/** Cuántos enlaces lleva la barra de utilidades. Si cambia, hay que saberlo. */
const ENLACES_ESPERADOS = 6

const BARRA = '[data-nav-utilidades]'
const ENLACES = '[data-nav-utilidades-enlaces] > a'
const TIENDA = '[data-nav-tienda]'
const HAMBURGUESA = '[aria-controls="mobile-navigation-dialog"]'

async function abrirEn(page: Page, idioma: string, width: number) {
  await page.addInitScript((i) => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    localStorage.setItem('banana:idioma', i)
  }, idioma)
  await page.setViewportSize({ width, height: 800 })
  await page.goto('./')
  await page.waitForSelector('header')
}

/**
 * Rectángulos de las piezas de la barra que se cruzan, con cuánto se cruzan.
 *
 * Devuelve también CUÁNTAS piezas ha medido. Sin ese dato, un selector que
 * dejara de encajar daría cero piezas, cero cruces y un aprobado: es
 * exactamente el fallo que esta prueba viene a impedir.
 */
async function solapes(page: Page) {
  return page.evaluate(
    ([selEnlaces, selTienda]) => {
      const piezas = [...document.querySelectorAll(selEnlaces)].map((el) => ({
        nombre: (el as HTMLElement).innerText.trim().slice(0, 20),
        caja: el.getBoundingClientRect(),
      }))
      const tienda = document.querySelector(selTienda)
      if (tienda) piezas.push({ nombre: 'Elige tienda', caja: tienda.getBoundingClientRect() })

      const cruces: string[] = []
      for (let i = 0; i < piezas.length; i++) {
        for (let j = i + 1; j < piezas.length; j++) {
          const a = piezas[i].caja
          const b = piezas[j].caja
          const x = Math.min(a.right, b.right) - Math.max(a.left, b.left)
          const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
          if (x > 0.5 && y > 0.5) cruces.push(`${piezas[i].nombre} ↔ ${piezas[j].nombre} (${Math.round(x)}px)`)
        }
      }
      return { medidas: piezas.length, cruces }
    },
    [ENLACES, TIENDA] as const,
  )
}

for (const idioma of IDIOMAS) {
  test(`la barra de servicios está y no se pisa en ${idioma} @all`, async ({ page }) => {
    for (const width of ANCHOS_CON_BARRA) {
      await abrirEn(page, idioma, width)

      // 1 · Existe y se ve. Ausencia = fallo, nunca «sin solapes».
      const barra = page.locator(BARRA)
      await expect(barra, `${idioma} a ${width}px: la barra debería verse`).toBeVisible()

      // 2 · Con dimensiones reales.
      const caja = await barra.boundingBox()
      expect(caja, `${idioma} a ${width}px: la barra no tiene caja`).not.toBeNull()
      expect(caja!.width, `${idioma} a ${width}px: barra de ancho cero`).toBeGreaterThan(0)
      expect(caja!.height, `${idioma} a ${width}px: barra de alto cero`).toBeGreaterThan(0)

      // 3 · Con sus piezas dentro: los enlaces y el acceso a tienda.
      await expect(page.locator(ENLACES), `${idioma} a ${width}px: faltan enlaces`).toHaveCount(ENLACES_ESPERADOS)
      await expect(page.locator(TIENDA), `${idioma} a ${width}px: falta «Elige tienda»`).toBeVisible()

      // 4 · Y sólo entonces, si se pisan.
      const r = await solapes(page)
      expect(r.medidas, `${idioma} a ${width}px: no se midió ninguna pieza`).toBe(ENLACES_ESPERADOS + 1)
      expect(r.cruces, `${idioma} a ${width}px: ${r.cruces.join(' · ')}`).toEqual([])
    }
  })

  test(`por debajo de xl la barra cede el sitio al menú en ${idioma} @all`, async ({ page }) => {
    for (const width of ANCHOS_SIN_BARRA) {
      await abrirEn(page, idioma, width)

      // La barra desaparece porque no cabe…
      await expect(page.locator(BARRA), `${idioma} a ${width}px: la barra no debería verse`).not.toBeVisible()

      // …pero sus accesos no. La hamburguesa está, y el menú los tiene: si
      // desapareciera sin que el menú los recogiera, esto sería una pérdida de
      // acceso disfrazada de arreglo, y en verde.
      const menu = page.locator(HAMBURGUESA)
      await expect(menu, `${idioma} a ${width}px: sin hamburguesa`).toBeVisible()
    }

    // El menú se abre una vez por idioma —es el mismo a los cinco anchos— y se
    // comprueba que trae enlaces de verdad. Que sean LOS de la barra se
    // verifica aparte, comparando destinos reales.
    await page.locator(HAMBURGUESA).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()
    const enlacesDelMenu = await dialogo.locator('a[href]').count()
    expect(enlacesDelMenu, `${idioma}: el menú se abre vacío`).toBeGreaterThan(0)
  })
}

test('los destinos de la barra siguen alcanzables desde el menú @all', async ({ page }) => {
  // Se leen los destinos reales en `xl` y se comprueba que el menú de por
  // debajo los ofrece todos. Así «los accesos viven en el menú» deja de ser un
  // comentario y pasa a estar comprobado.
  await abrirEn(page, 'es', 1280)
  await expect(page.locator(BARRA)).toBeVisible()
  const destinos = await page
    .locator(ENLACES)
    .evaluateAll((els) => els.map((a) => (a as HTMLAnchorElement).getAttribute('href')))
  expect(destinos.length).toBe(ENLACES_ESPERADOS)

  await abrirEn(page, 'es', 1100)
  await expect(page.locator(BARRA)).not.toBeVisible()
  await page.locator(HAMBURGUESA).click()
  const dialogo = page.getByRole('dialog')
  await expect(dialogo).toBeVisible()

  const enMenu = await dialogo
    .locator('a[href]')
    .evaluateAll((els) => els.map((a) => (a as HTMLAnchorElement).getAttribute('href')))
  const perdidos = destinos.filter((d) => !enMenu.includes(d!))
  expect(perdidos, `destinos que la barra ofrece y el menú no: ${perdidos.join(' · ')}`).toEqual([])
})
