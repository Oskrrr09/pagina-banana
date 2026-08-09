import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// La navegación de la web no se pisa a sí misma.
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
// Aquí se comparan los rectángulos de los hermanos de navegación y se falla si
// dos se intersecan. Es la comprobación que corresponde al fallo.
//
// Y se hace en los CINCO idiomas: los rótulos se traducen, y en francés la
// barra seguía solapando 63 px a 1024 px cuando en castellano ya cabía. Una
// corrección que sólo funcione en un idioma no es una corrección.
// ============================================================================

const ANCHOS = [640, 768, 900, 1024, 1100, 1280, 1440]
const IDIOMAS = ['es', 'en', 'de', 'fr', 'it'] as const

/** Rectángulos que se cruzan, con cuánto se cruzan. */
async function solapes(page: Page) {
  return page.evaluate(() => {
    const barra = document.querySelector('header div[class*="0768A9"]') as HTMLElement | null
    // Si la barra no se pinta a este ancho, no hay nada que comprobar: sus
    // accesos viven en el menú de hamburguesa.
    if (!barra || barra.getBoundingClientRect().width === 0) return { visible: false, cruces: [] as string[] }

    const fila = barra.querySelector(':scope > div')!
    const piezas = [...fila.querySelectorAll(':scope > a')].map((el) => ({
      nombre: (el as HTMLElement).innerText.trim().slice(0, 20),
      caja: el.getBoundingClientRect(),
    }))
    const absoluto = barra.querySelector(':scope > div.absolute')
    if (absoluto) piezas.push({ nombre: 'Elige tienda', caja: absoluto.getBoundingClientRect() })

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
    return { visible: true, cruces }
  })
}

for (const idioma of IDIOMAS) {
  test(`la barra de servicios no se pisa en ${idioma} @all`, async ({ page }) => {
    await page.addInitScript((i) => {
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
      localStorage.setItem('banana:idioma', i)
    }, idioma)

    for (const width of ANCHOS) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('./')
      await page.waitForSelector('header', { timeout: 15_000 })

      const r = await solapes(page)
      expect(r.cruces, `${idioma} a ${width}px: ${r.cruces.join(' · ')}`).toEqual([])
    }
  })
}

test('por debajo de xl, los accesos de la barra viven en el menú @all', async ({ page }) => {
  // La barra desaparece porque no cabe, no porque sus enlaces sobren. Si
  // desapareciera sin que el menú los recogiera, esto sería una pérdida de
  // acceso disfrazada de arreglo.
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
  await page.setViewportSize({ width: 1100, height: 800 })
  await page.goto('./')

  // Sigue en el DOM —`hidden xl:block`—, pero no se ve.
  await expect(page.locator('header div[class*="0768A9"]')).not.toBeVisible()

  const menu = page.getByRole('button', { name: /Abrir menú/i })
  await expect(menu).toBeVisible()
  await menu.click()

  const dialogo = page.getByRole('dialog')
  await expect(dialogo.getByRole('link', { name: /Servicio técnico/i })).toBeVisible()
  await expect(dialogo.getByText(/tienda/i).first()).toBeVisible()
})

test('en xl la barra vuelve y sigue sin pisarse @all', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('./')

  await expect(page.locator('header div[class*="0768A9"]')).toBeVisible()
  const r = await solapes(page)
  expect(r.cruces).toEqual([])
})
