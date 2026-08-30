import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// DOS DEFECTOS QUE APARECIERON EN EL TELÉFONO, NO EN LOS TESTS.
//
// 1 · UNA FRANJA BLANCA SOBRE «SEGUÍAS MIRANDO»
//
// El Home nativo pinta su fondo gris en un contenedor sin borde ni relleno, y su
// primer bloque lleva `mt-4`. Sin un contexto de formato propio ese margen se
// colapsa **a través** del contenedor: el gris empezaba 16 px por debajo de la
// barra superior y en medio asomaba el blanco del `main`.
//
// 2 · EL HISTORIAL SE FILTRABA ENTRE CUENTAS
//
// «Seguías mirando» leía un almacén común a todo el dispositivo —correcto en un
// navegador, D-064— y además lo leía una sola vez al montar. En la app eso
// significaba que, tras cerrar sesión, la siguiente persona veía los productos
// que había mirado la anterior. Ver D-088.
//
// QUÉ SE COMPRUEBA
//
// El resultado, no la implementación: dónde empieza el fondo y qué productos se
// ven. Nada de clases de Tailwind — `flow-root` no es el contrato, «no hay
// franja» sí.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

/** Escribe el historial de una identidad antes de que arranque la aplicación. */
function conHistorial(page: Page, identidad: string | null, ids: string[]) {
  return page.addInitScript(
    ([ident, lista]) => {
      const clave = ident ? `banana:recientes:app:user:${ident}` : 'banana:recientes:app:anon'
      window.localStorage.setItem(clave, JSON.stringify(lista))
    },
    [identidad, ids] as const,
  )
}

/** Dónde empieza el primer bloque con contenido del Home, y qué hay antes. */
async function primerBloque(page: Page) {
  return page.evaluate(() => {
    const barra = document.querySelector('[data-app-topbar]')!.getBoundingClientRect()
    const fondo = document.querySelector('main > div')!.getBoundingClientRect()
    const seccion = document.querySelector('main section')!
    const s = getComputedStyle(seccion)
    return {
      titulo: seccion.querySelector('h2')?.textContent?.trim() ?? null,
      // Del contenedor gris a la barra: si esto no es 0, vuelve el blanco.
      huecoDelFondo: Math.round(fondo.top - barra.bottom),
      // Del PRIMER BLOQUE a la barra: si esto no es 0, se ve una franja del
      // color del fondo antes de que empiece el bloque.
      huecoDelBloque: Math.round(seccion.getBoundingClientRect().top - barra.bottom),
      // Una sección «banda» pinta su propio fondo; las demás son transparentes.
      esBanda: s.backgroundColor !== 'rgba(0, 0, 0, 0)',
      relleno: s.paddingTop,
    }
  })
}

test.describe('el Home nativo no deja una franja sobre el primer bloque', () => {
  // POR QUÉ NO BASTA CON MIRAR EL FONDO
  //
  // La primera versión de esta prueba medía dónde empieza el contenedor gris y
  // qué color hay bajo la barra. Eso dejó pasar el defecto siguiente: el
  // contenedor empezaba bien, pero el primer bloque llevaba 16 px de margen
  // **dentro** de él, así que la franja blanca se convirtió en una franja gris.
  // Se veía igual de mal en el teléfono y la prueba seguía verde.
  //
  // El contrato es la geometría del **primer bloque visible**, no la del fondo.
  for (const [ancho, alto] of [
    [320, 568],
    [390, 844],
  ] as const) {
    test(`a ${ancho} px, sin avisos ni recientes, la banda empieza pegada a la barra`, async ({ page }) => {
      // Escenario del defecto: sin sesión no hay avisos, y sin historial no hay
      // «Seguías mirando», así que «Oportunidades» —que es una banda de color—
      // queda la primera.
      await page.setViewportSize({ width: ancho, height: alto })
      await comoApp(page)
      await page.goto('./')

      const b = await primerBloque(page)
      expect(b.titulo, 'el primer bloque es Oportunidades').toBe('Oportunidades')
      expect(b.esBanda, 'y es una banda con fondo propio').toBe(true)
      expect(b.huecoDelFondo, 'el fondo del Home sigue pegado a la barra').toBe(0)
      expect(b.huecoDelBloque, 'y la banda también: sin franja de color por delante').toBe(0)
      // La respiración no desaparece, se queda dentro de la banda.
      expect(parseFloat(b.relleno), 'la banda conserva su relleno interno').toBeGreaterThan(0)
    })

    test(`a ${ancho} px, con recientes, «Seguías mirando» conserva su separación`, async ({ page }) => {
      // El caso contrario: una sección sin banda pinta su título directamente
      // sobre el gris, y ahí los 16 px sí hacen falta. Quitarlos a todas habría
      // pegado el título a la barra.
      await page.setViewportSize({ width: ancho, height: alto })
      await comoApp(page)
      await conHistorial(page, null, ['iphone/17-pro'])
      await page.goto('./')

      const b = await primerBloque(page)
      expect(b.titulo).toBe('Seguías mirando')
      expect(b.esBanda, 'no es una banda').toBe(false)
      expect(b.huecoDelFondo, 'el fondo sigue pegado a la barra').toBe(0)
      expect(b.huecoDelBloque, 'pero el título respira').toBeGreaterThan(0)
    })
  }
})

test.describe('«Seguías mirando» pertenece a quien ha iniciado sesión', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  const seccion = (page: Page) => page.locator('section').filter({ hasText: /Seguías mirando/ })

  test('sin cuenta se ve el historial anónimo, y sólo ése', async ({ page }) => {
    await comoApp(page)
    await conHistorial(page, null, ['iphone/17-pro'])
    // Historial de una cuenta que existe en el dispositivo pero no está activa.
    await conHistorial(page, 'usuario-a', ['mac/macbook-air-m4'])
    await page.goto('./')

    await expect(seccion(page)).toBeVisible()
    await expect(seccion(page).getByText(/iPhone 17 Pro/), 'lo anónimo se ve').toBeVisible()
    await expect(
      seccion(page).getByText(/MacBook Air/),
      'lo de una cuenta guardada no se filtra a quien no ha entrado',
    ).toHaveCount(0)
    // Y sólo hay un producto continuado: el suyo.
    expect(await seccion(page).locator('article, [data-product-card]').count()).toBe(1)
  })

  test('el historial de una cuenta no aparece sin esa sesión', async ({ page }) => {
    // Es el caso que se vio en el teléfono: A cierra sesión y lo suyo no puede
    // seguir en pantalla. Sin sesión, la app lee el espacio anónimo.
    await comoApp(page)
    await conHistorial(page, 'usuario-a', ['iphone/17-pro', 'mac/macbook-air-m4'])
    await page.goto('./')

    // La sección no se monta: sin historial propio no hay nada que continuar.
    // Se comprueba ahí y no en toda la página, porque «Oportunidades» enseña el
    // iPhone 17 Pro por estar rebajado, y eso es correcto: es un escaparate
    // público, no el historial de nadie.
    await expect(seccion(page), 'sin historial propio, la sección no se monta').toHaveCount(0)
  })

  test('dos cuentas del mismo dispositivo no se ven entre ellas', async ({ page }) => {
    await comoApp(page)
    await conHistorial(page, 'usuario-a', ['iphone/17-pro'])
    await conHistorial(page, 'usuario-b', ['mac/macbook-air-m4'])
    await page.goto('./')

    // Sin sesión activa no se continúa el historial de ninguno de los dos.
    await expect(seccion(page)).toHaveCount(0)

    // Y los espacios siguen guardados por separado, listos para cuando su dueño
    // vuelva a entrar.
    const espacios = await page.evaluate(() => ({
      a: window.localStorage.getItem('banana:recientes:app:user:usuario-a'),
      b: window.localStorage.getItem('banana:recientes:app:user:usuario-b'),
    }))
    expect(espacios.a).toContain('iphone/17-pro')
    expect(espacios.b).toContain('mac/macbook-air-m4')
    expect(espacios.a).not.toContain('macbook')
  })

  test('visitar un producto lo anota en el espacio de quien navega', async ({ page }) => {
    await comoApp(page)
    await page.goto('./iphone/17-pro/256gb-plata')
    await page.waitForLoadState('networkidle')

    const guardado = await page.evaluate(() => ({
      anonimo: window.localStorage.getItem('banana:recientes:app:anon'),
      // La clave del historial web no debe usarse en la app.
      web: window.localStorage.getItem('banana:recientes'),
    }))
    expect(guardado.anonimo, 'la app escribe en su propio espacio').toContain('iphone/17-pro')
    expect(guardado.web, 'y no en el del navegador').toBeNull()

    await page.goto('./')
    await expect(seccion(page).getByText(/iPhone 17 Pro/), 'y aparece en el Home').toBeVisible()
  })
})

test.describe('la web conserva su historial de dispositivo', () => {
  test('en el navegador se sigue guardando bajo la clave de siempre', async ({ page }) => {
    // D-064 sigue vigente para la web: allí el historial es del navegador y no
    // se separa por cuenta. Esta corrección no lo toca.
    await page.goto('./iphone/17-pro/256gb-plata')
    await page.waitForLoadState('networkidle')

    const guardado = await page.evaluate(() => ({
      web: window.localStorage.getItem('banana:recientes'),
      app: window.localStorage.getItem('banana:recientes:app:anon'),
    }))
    expect(guardado.web, 'la web escribe donde siempre').toContain('iphone/17-pro')
    expect(guardado.app, 'y no toca el almacén de la app').toBeNull()
  })
})
