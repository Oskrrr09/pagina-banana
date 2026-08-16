import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// LA BARRA DE BANANA ES AMARILLA EN TODA LA APLICACIÓN.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// Antes el color de la cabecera dependía del contexto de la ruta: amarillo en
// Tienda y en Inicio, superficie clara en Mis productos y Cuenta, y —sin que
// nadie lo decidiera— también clara en soporte, tiendas, servicio técnico,
// login, registro y el 404, porque son `neutro`. El checkout tenía además su
// propio amarillo pálido. Recorrer la aplicación era ver la cabecera cambiar
// de color diez veces.
//
// Se comprueba el COLOR REAL calculado por el navegador, no la clase en el
// código: una clase puede estar puesta y quedar tapada, o el token puede
// cambiar de valor sin que nadie se entere.
//
// POR QUÉ ESTAS RUTAS Y NO OTRAS
//
// Una por cada combinación de layout y contexto, que es donde el contrato
// puede romperse de forma distinta. Añadir cada ficha del catálogo no probaría
// nada nuevo: comparten componente con la que ya está.
// ============================================================================

/** `--color-banana`, el amarillo canónico de marca. */
const BANANA = 'rgb(255, 206, 31)'

/** El amarillo pálido del flujo de pago, que NO puede volver a la cabecera. */
const CHECKOUT = 'rgb(247, 230, 169)'

const SUPERFICIES = [
  // Comercial: armazón de la app, contexto de catálogo y compra.
  { grupo: 'comercial', ruta: './' },
  { grupo: 'comercial', ruta: './tienda' },
  { grupo: 'comercial', ruta: './iphone' },
  { grupo: 'comercial', ruta: './iphone/17-pro/256gb-plata' },
  { grupo: 'comercial', ruta: './carrito' },
  // Personal: el grupo que estaba en blanco y motivó el cambio.
  { grupo: 'personal', ruta: './mis-productos' },
  { grupo: 'personal', ruta: './cuenta' },
  { grupo: 'personal', ruta: './login' },
  { grupo: 'personal', ruta: './registro' },
  // Neutro: nadie decidió que fueran blancas, lo eran por no estar en ninguna
  // de las dos listas de `appSections`.
  { grupo: 'neutro', ruta: './servicios' },
  { grupo: 'neutro', ruta: './tiendas' },
  { grupo: 'neutro', ruta: './soporte' },
  { grupo: 'neutro', ruta: './servicio-tecnico' },
  { grupo: 'neutro', ruta: './plan-renove' },
  { grupo: 'neutro', ruta: './esta-ruta-no-existe' },
] as const

async function comoApp(page: Page) {
  await page.addInitScript(() => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
}

/** Color de fondo de la cabecera de la app, la que lleva el hueco del notch. */
async function barra(page: Page) {
  const cabecera = page.locator('[data-app-topbar]')
  await expect(cabecera, 'toda pantalla de cliente monta la barra de la app').toHaveCount(1)
  return cabecera
}

test.describe('la barra de Banana es amarilla en la app', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  for (const { grupo, ruta } of SUPERFICIES) {
    test(`${grupo} · ${ruta}`, async ({ page }) => {
      await comoApp(page)
      await page.goto(ruta)

      const cabecera = await barra(page)
      const color = await cabecera.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(color, `la cabecera de ${ruta} debe ser el amarillo de marca`).toBe(BANANA)
    })
  }

  test('el hueco de la barra de estado lo reserva la propia cabecera amarilla', async ({ page }) => {
    // ARQUITECTURA, NO COSMÉTICA
    //
    // En el móvil, la franja de la barra de estado toma el color de quien
    // reserva su hueco. Si ese hueco lo reservara un elemento distinto del que
    // pinta el amarillo, en el dispositivo aparecería una banda de otro color
    // por encima de la barra — que es exactamente lo que pasaba en las
    // pantallas personales y neutras.
    //
    // Playwright no expone un `safe-area-inset-top` real —vale 0 en el
    // navegador—, así que no se mide la franja: se exige que el elemento que
    // la declara sea el MISMO que va en amarillo.
    await comoApp(page)
    for (const ruta of ['./', './cuenta', './soporte']) {
      await page.goto(ruta)
      const cabecera = await barra(page)
      const { color, reserva } = await cabecera.evaluate((el) => {
        const cs = getComputedStyle(el)
        return { color: cs.backgroundColor, reserva: el.getAttribute('style') ?? '' }
      })
      expect(color, ruta).toBe(BANANA)
      expect(reserva, `${ruta}: el hueco del notch se declara en la cabecera amarilla`).toContain('safe-area-inset-top')
    }
  })
})

test.describe('checkout', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  // El checkout vive en su propio layout, fuera del armazón de la app: no monta
  // `AppTopBar`, así que su cabecera es otra y hay que comprobarla aparte.
  for (const paso of ['1', '2', '3']) {
    test(`el paso ${paso} tiene la cabecera amarilla y conserva su fondo`, async ({ page }) => {
      await comoApp(page)
      await page.goto(`./checkout/${paso}`)

      const cabecera = page.locator('header').first()
      const color = await cabecera.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(color, `la cabecera del paso ${paso} debe ser el amarillo de marca`).toBe(BANANA)

      // Y NO se arregla pintando la pantalla entera: el flujo de pago conserva
      // su propio fondo. Sin esta mitad, cambiar `bg-neutral` por `bg-banana`
      // en el contenedor pasaría la prueba de arriba.
      const fondo = await page.evaluate(() => {
        const main = document.querySelector('main')
        return main ? getComputedStyle(main.parentElement!).backgroundColor : null
      })
      expect(fondo, 'el contenido del checkout no se vuelve amarillo').not.toBe(BANANA)

      const hueco = await cabecera.getAttribute('style')
      expect(hueco, 'la cabecera del checkout también reserva el hueco del notch').toContain('safe-area-inset-top')
    })
  }

  test('el amarillo pálido del pago no vuelve a la cabecera', async ({ page }) => {
    await comoApp(page)
    await page.goto('./checkout/1')
    const color = await page
      .locator('header')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(color, 'la cabecera no puede usar --color-checkout').not.toBe(CHECKOUT)
  })
})

test.describe('en la web la barra también es amarilla', () => {
  // La web usa otra cabecera —`Header`, con su barra de utilidades y su
  // navegación—, así que el contrato hay que comprobarlo también aquí.
  test.use({ viewport: { width: 1280, height: 800 } })

  for (const ruta of ['./', './cuenta', './soporte', './checkout/1']) {
    test(`${ruta} en escritorio`, async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
      await page.goto(ruta)

      // La barra de marca de la web es la que lleva el logotipo.
      const conLogo = page.locator('header').first()
      const amarillo = await conLogo.evaluate((el) => {
        const propio = getComputedStyle(el).backgroundColor
        if (propio === 'rgb(255, 206, 31)') return true
        return [...el.querySelectorAll('*')].some((n) => getComputedStyle(n).backgroundColor === 'rgb(255, 206, 31)')
      })
      expect(amarillo, `la cabecera de ${ruta} enseña el amarillo de marca`).toBe(true)
    })
  }
})
