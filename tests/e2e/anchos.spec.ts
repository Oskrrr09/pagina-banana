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
//
// QUÉ NO CUBRE
//
// `/cuenta` no está aquí: sin sesión no llega a pintar el formulario —rebota a
// identificarse o enseña el aviso de configuración— y sin formulario no hay
// nada que medir. Su encaje se prueba con sesión inyectada, hoja de estilos y
// `<meta viewport>` en `tests/e2e-prefs/cuenta-encaje.spec.ts`.
// ============================================================================

const TOLERANCIA = 2

// De un iPhone SE a una ventana estrecha de escritorio. 600 y 900 están a
// propósito entre los cortes de Tailwind, que es donde suele romperse.
const ANCHOS = [320, 414, 600, 768, 900, 1024]

/**
 * Cada ruta declara qué armazón debe haber montado.
 *
 * `web` — cabecera y `<main>`: el catálogo entero.
 * `panel` — el panel de agentes, que sin credenciales pinta un aviso a pantalla
 * completa sin cabecera. Es un estado legítimo, y por eso se declara en vez de
 * dejarlo pasar por omisión.
 */
const RUTAS: { path: string; armazon: 'web' | 'panel' }[] = [
  { path: '/', armazon: 'web' },
  { path: '/iphone', armazon: 'web' },
  { path: '/iphone/17-pro', armazon: 'web' },
  { path: '/iphone/17-pro/256gb-plata', armazon: 'web' },
  { path: '/accesorios', armazon: 'web' },
  { path: '/buscar?q=airpods', armazon: 'web' },
  { path: '/comparar', armazon: 'web' },
  { path: '/carrito', armazon: 'web' },
  { path: '/favoritos', armazon: 'web' },
  { path: '/tiendas', armazon: 'web' },
  { path: '/soporte', armazon: 'web' },
  { path: '/plan-renove', armazon: 'web' },
  { path: '/elige-tu-apple', armazon: 'web' },
  { path: '/login', armazon: 'web' },
  { path: '/mis-productos', armazon: 'web' },
  // El panel de agentes es parte de la web aunque no del catálogo, y sus
  // avisos a pantalla completa se salían por debajo de 414 px.
  { path: '/agente', armazon: 'panel' },
  { path: '/agente/login', armazon: 'panel' },
]

/**
 * Demuestra que la ruta llegó a montar algo real ANTES de medirla.
 *
 * POR QUÉ ESTO ES EL CORAZÓN DE LA PRUEBA
 *
 * Antes había un `await page.waitForSelector('#root > *').catch(() => {})`. Si
 * la ruta no montaba, la espera fallaba, el fallo se tragaba, y se medía una
 * página vacía: cero desbordamiento, aprobado. Una ruta rota se leía como una
 * ruta que cabe. Se comprueba, por tanto, en este orden:
 *
 * 1. el árbol tiene hijos —sin `catch`: si no monta, la prueba muere aquí—;
 * 2. la URL resolvió a la ruta pedida y no a otra cosa;
 * 3. hay elementos visibles de tamaño no nulo, y no una cáscara;
 * 4. el armazón declarado está presente.
 *
 * Los umbrales son deliberadamente bajos —5 elementos y 100 caracteres—: no
 * están para describir la página, están para distinguir «montó» de «no montó».
 * La ruta más escueta del barrido, `/agente/login`, tiene 8 elementos visibles
 * y 201 caracteres.
 */
async function montada(page: Page, ruta: { path: string; armazon: 'web' | 'panel' }) {
  await page.waitForSelector('#root > *', { timeout: 15_000 })

  const estado = await page.evaluate(() => {
    const root = document.querySelector('#root') as HTMLElement | null
    if (!root) return null
    const visibles = [...root.querySelectorAll('*')].filter((el) => {
      const caja = el.getBoundingClientRect()
      return caja.width > 0 && caja.height > 0
    }).length
    const main = document.querySelector('main') as HTMLElement | null
    const mainVisibles = main
      ? [...main.querySelectorAll('*')].filter((el) => {
          const caja = el.getBoundingClientRect()
          return caja.width > 0 && caja.height > 0
        }).length
      : 0
    return {
      visibles,
      texto: root.innerText.trim().length,
      header: !!document.querySelector('header'),
      main: !!main,
      mainVisibles,
      mainTexto: main ? main.innerText.trim().length : 0,
      pathname: location.pathname,
    }
  })

  expect(estado, `${ruta.path}: no existe #root`).not.toBeNull()
  expect(estado!.visibles, `${ruta.path}: montó una cáscara sin nada visible`).toBeGreaterThanOrEqual(5)
  expect(estado!.texto, `${ruta.path}: montó sin texto`).toBeGreaterThanOrEqual(100)

  // La ruta pedida, no otra: un `/algo` inexistente que cayera en el fallback
  // del SPA mediría una pantalla que no es la que se cree estar midiendo.
  const esperado = ('/pagina-banana' + ruta.path).split('?')[0]
  expect(estado!.pathname, `${ruta.path}: la URL resolvió a ${estado!.pathname}`).toBe(esperado)

  if (ruta.armazon === 'web') {
    expect(estado!.header, `${ruta.path}: sin cabecera`).toBe(true)
    expect(estado!.main, `${ruta.path}: sin <main>`).toBe(true)

    // Y con la PÁGINA dentro, no sólo el armazón. Si el componente de ruta
    // dejara de montar, la cabecera y el pie seguirían ahí y los umbrales
    // sobre `#root` no lo notarían: se mediría un `main` vacío y daría cero
    // desbordamiento. Los mínimos vienen de la ruta más escueta del barrido,
    // `/mis-productos`, con 4 elementos visibles y 93 caracteres.
    expect(estado!.mainVisibles, `${ruta.path}: <main> vacío — la página no montó`).toBeGreaterThanOrEqual(3)
    expect(estado!.mainTexto, `${ruta.path}: <main> sin texto — la página no montó`).toBeGreaterThanOrEqual(40)
  }
}

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
      await page.goto('.' + ruta.path)
      await montada(page, ruta)
      const desborde = await desbordamiento(page)
      expect(desborde, `${ruta.path} desborda ${desborde}px a ${width}px`).toBeLessThanOrEqual(TOLERANCIA)
    }
  })
}

// ============================================================================
// Y lo mismo dentro del binario.
//
// La web puede caber y la app no: tiene otro armazón —barra superior propia,
// barra inferior, y un `#contenido` que es quien se desplaza en vez del
// documento—. Dar por validada la app porque la web no desborda sería dar por
// buena una pantalla que nadie ha medido.
//
// Capacitor se simula igual que en el resto de la suite: inyecta
// `window.Capacitor` antes del bundle, y `addInitScript` corre en ese mismo
// momento, así que se recorre el mismo camino de código.
// ============================================================================

const RUTAS_APP: { path: string; armazon: 'web' | 'panel' }[] = [
  '/',
  '/tienda',
  '/mis-productos',
  '/cuenta',
  '/iphone',
  '/iphone/17-pro/256gb-plata',
  '/carrito',
  // Dentro del armazón nativo no hay `<header>` de la web: la cabecera es
  // `AppTopBar`. Se comprueba aparte, justo debajo.
].map((path) => ({ path, armazon: 'panel' }))

for (const width of [320, 414, 768]) {
  test(`en la app tampoco desborda a ${width} px @all`, async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    })
    await page.setViewportSize({ width, height: 850 })

    for (const ruta of RUTAS_APP) {
      await page.goto('.' + ruta.path)
      await montada(page, ruta)

      // El armazón nativo, comprobado y no supuesto. Las SIETE rutas del
      // barrido montan `#contenido` y barra superior —medido—, así que su
      // ausencia significa que la app no montó, nunca «esta pantalla no lo
      // usa». Antes se hacía `contenido ? medida : 0`, que convertía la
      // ausencia en un cero tranquilizador.
      const armazon = await page.evaluate(() => ({
        contenido: !!document.querySelector('#contenido'),
        topbar: !!document.querySelector('[data-app-topbar]'),
      }))
      expect(armazon.contenido, `app ${ruta.path}: sin #contenido — la app no montó`).toBe(true)
      expect(armazon.topbar, `app ${ruta.path}: sin barra superior — la app no montó`).toBe(true)

      // En la app el documento no se desplaza: lo hace `#contenido`. Se miran
      // los dos, porque el desbordamiento se puede quedar en cualquiera.
      const medida = await page.evaluate(() => {
        const de = document.documentElement
        const guardado = [de.style.overflowX, document.body.style.overflowX]
        de.style.overflowX = 'visible'
        document.body.style.overflowX = 'visible'
        const documento = de.scrollWidth - de.clientWidth
        de.style.overflowX = guardado[0]
        document.body.style.overflowX = guardado[1]
        const contenido = document.querySelector('#contenido')!
        return { documento, contenido: contenido.scrollWidth - contenido.clientWidth }
      })

      expect(medida.documento, `app ${ruta.path}: el documento desborda a ${width}px`).toBeLessThanOrEqual(TOLERANCIA)
      expect(medida.contenido, `app ${ruta.path}: el contenido desborda a ${width}px`).toBeLessThanOrEqual(TOLERANCIA)
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
