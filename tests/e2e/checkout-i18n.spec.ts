import { expect, test, type Page } from '@playwright/test'
import { avanzar, llegarAlPaso } from './checkout-helpers'

// ============================================================================
// AUD-002 — EL CHECKOUT WEB HABLA EL IDIOMA DE QUIEN COMPRA.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// El checkout estaba traducido a medias: los `h1` de los pasos 1 y 3 salían en
// el idioma activo mientras el del paso 2 decía «Pago y extras», la validación
// respondía en castellano, y los precios y la fecha se formateaban siempre en
// `es-ES`. La reproducción encontró los MISMOS 21 residuos en inglés, alemán,
// francés e italiano: el fallo era estructural, no una traducción defectuosa.
//
// Se afirma el COPY ESPERADO, no la ausencia de palabras españolas. Una prueba
// que sólo comprobara que «Pago» no aparece seguiría pasando el día que se
// colara otro literal distinto.
//
// POR QUÉ AQUÍ Y NO EN idiomas.spec.ts
//
// Aquélla cubre el MECANISMO de detección y cambio de idioma. Esto cubre una
// pantalla concreta y su recorrido completo, que es otra cosa.
//
// LOS FORMATOS NO SE ESCRIBEN A MANO
//
// Lo que se espera de un precio o de una fecha se calcula con el mismo `Intl`
// que usa el navegador, no con una cadena copiada: así la prueba sigue siendo
// cierta cuando cambie la versión de ICU.
// ============================================================================

const PRODUCTO = 'iPhone 17 Pro'

/** El precio tal y como debe verlo ese locale, calculado, no transcrito. */
function euroEn(locale: string, valor: number) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: valor % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

const cuerpo = (page: Page) => page.locator('main')

/** Elige financiación, que es donde vive el simulador de cuotas. */
async function elegirFinanciacion(page: Page, rotulo: string) {
  await page.getByRole('button', { name: rotulo, exact: true }).click()
}

test.describe('el checkout en inglés', () => {
  test.use({ locale: 'en-GB' })

  test('paso 1: la pantalla y sus campos están en inglés', async ({ page }) => {
    await llegarAlPaso(page, 1)

    // Primero se demuestra que el idioma está activo de verdad: si esto ya
    // fallara, lo que se estaría midiendo sería la detección, no el checkout.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Delivery or collection')

    await expect(page.getByLabel('Full name')).toBeVisible()
    await expect(page.getByLabel('Address')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Home delivery' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collect in store' })).toBeVisible()

    // El aviso demostrativo se pintaba con la clave traducida Y, a
    // continuación, con el final de esa misma frase repetido como literal
    // castellano. Se leía dos veces, en los cinco idiomas.
    await expect(cuerpo(page), 'el aviso no arrastra el literal duplicado').not.toContainText(
      'los datos se guardan solo en tu navegador',
    )
    await expect(cuerpo(page)).toContainText('Nothing is charged or shipped; the data is stored only in your browser.')
  })

  test('paso 1: recogida en tienda rotula su selector en inglés', async ({ page }) => {
    await llegarAlPaso(page, 1)
    await page.getByRole('button', { name: 'Collect in store' }).click()
    await expect(page.getByLabel('Collection store')).toBeVisible()
  })

  test('la validación responde en inglés sin romper la relación campo-error', async ({ page }) => {
    await llegarAlPaso(page, 1)
    await page.locator('input[autocomplete="email"]').fill('esto-no-es-un-email')
    await avanzar(page)

    await expect(page, 'con errores no se avanza').toHaveURL(/\/checkout\/1$/)
    await expect(cuerpo(page)).toContainText('Enter your name.')
    await expect(cuerpo(page)).toContainText('Enter a valid email.')
    await expect(cuerpo(page)).toContainText('Enter the delivery address.')

    // A62-08: el error DESCRIBE el campo, no lo renombra. Se comprueba sobre el
    // DOM real, resolviendo `aria-describedby` como haría un lector.
    const semantica = await page.evaluate(() => {
      const campo = document.querySelector<HTMLInputElement>('input[autocomplete="name"]')!
      const ids = (campo.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
      return {
        invalido: campo.getAttribute('aria-invalid'),
        requerido: campo.required,
        descripcion: ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' '),
      }
    })
    expect(semantica.invalido, 'el campo se anuncia inválido').toBe('true')
    expect(semantica.requerido, 'y obligatorio').toBe(true)
    expect(semantica.descripcion, 'el error es la descripción del campo, traducida').toBe('Enter your name.')
  })

  test('paso 2: pago, financiación, seguro y extras están en inglés', async ({ page }) => {
    await llegarAlPaso(page, 2)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Payment and extras')
    await expect(cuerpo(page)).toContainText('Payment method')
    await expect(cuerpo(page)).toContainText('Demonstration payment')
    await expect(cuerpo(page)).toContainText('no real charges are made.')
    // Bizum es una marca: no se traduce, y debe seguir estando.
    await expect(cuerpo(page)).toContainText('Bizum')

    await elegirFinanciacion(page, 'Financing')
    await expect(cuerpo(page)).toContainText('Instalment simulator')
    await expect(cuerpo(page)).toContainText('Demonstration terms — pending confirmation with Banana Computer.')
    await expect(page.getByRole('button', { name: '12 months' })).toBeVisible()
    await expect(page.getByRole('button', { name: '36 months' })).toBeVisible()
    await expect(cuerpo(page)).toContainText('(indicative)')
    await expect(cuerpo(page)).toContainText('The agreement would be completed in store.')

    await expect(cuerpo(page), 'el seguro nombra el producto sin traducirlo').toContainText(`Insurance for ${PRODUCTO}`)
    await expect(cuerpo(page)).toContainText('/month* per unit')

    await expect(page.getByPlaceholder('Enter your code')).toBeVisible()
    await expect(cuerpo(page)).toContainText('Trade-in Plan note')
    await expect(cuerpo(page)).toContainText('View Plan Renove')

    await expect(cuerpo(page), 'el resumen rotula la entrega en inglés').toContainText('Delivery')
    await expect(cuerpo(page)).toContainText('Home delivery')
  })

  test('paso 2: los precios usan el formato del idioma activo', async ({ page }) => {
    await llegarAlPaso(page, 2)
    await expect(cuerpo(page), 'el total del producto en formato inglés').toContainText(euroEn('en-GB', 1229))
    await expect(cuerpo(page), 'y no en formato castellano').not.toContainText('1229 €')
  })

  test('paso 3: la confirmación completa está en inglés', async ({ page }) => {
    await llegarAlPaso(page, 3)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Order confirmed!')
    await expect(cuerpo(page)).toContainText('Order number:')
    await expect(cuerpo(page)).toContainText('Demonstration order')
    await expect(cuerpo(page)).toContainText('Order details')
    await expect(cuerpo(page)).toContainText('(demonstration)')
    await expect(cuerpo(page)).toContainText('demo · pending confirmation')
    await expect(cuerpo(page)).toContainText('No real email has been sent')
    await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to support' })).toBeVisible()

    // El identificador del pedido es un dato, no copy: sigue igual.
    await expect(page.getByText(/BC-([0-9A-F]{12}|\d{6})/)).toBeVisible()
  })

  test('paso 3: la fecha usa el locale activo, con la hora de Canarias', async ({ page }) => {
    await llegarAlPaso(page, 3)
    const esperada = new Date().toLocaleDateString('en-GB', { timeZone: 'Atlantic/Canary' })
    await expect(cuerpo(page), 'la fecha se lee como la lee un inglés').toContainText(esperada)
  })

  test('el nombre accesible de la imagen traduce el color', async ({ page }) => {
    await llegarAlPaso(page, 2)
    const imagen = cuerpo(page)
      .getByRole('img', { name: new RegExp(PRODUCTO) })
      .first()
    const alt = await imagen.getAttribute('alt')
    expect(alt, 'el color persistido no se cuela en castellano').not.toContain('Plata')
    expect(alt, 'el producto conserva su nombre propio').toContain(PRODUCTO)
  })
})

test.describe('el checkout en alemán', () => {
  test.use({ locale: 'de-DE' })

  test('el paso 2 y sus formatos son alemanes', async ({ page }) => {
    await llegarAlPaso(page, 2)
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zahlung und Extras')
    await expect(cuerpo(page), 'el precio usa el punto de millares alemán').toContainText(euroEn('de-DE', 1229))
    await expect(cuerpo(page)).not.toContainText('Pago y extras')
  })

  test('la fecha del paso 3 es alemana', async ({ page }) => {
    await llegarAlPaso(page, 3)
    const esperada = new Date().toLocaleDateString('de-DE', { timeZone: 'Atlantic/Canary' })
    await expect(cuerpo(page)).toContainText(esperada)
  })
})

test.describe('el checkout en francés', () => {
  test.use({ locale: 'fr-FR' })

  test('el paso 2 está en francés', async ({ page }) => {
    await llegarAlPaso(page, 2)
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paiement et extras')
    // Una frase interpolada, que es donde se rompen las traducciones a medias:
    // el nombre del producto es dato y el resto tiene que estar en francés.
    await expect(cuerpo(page)).toContainText(`Assurance pour ${PRODUCTO}`)
    await expect(cuerpo(page)).toContainText('/mois* par unité')
  })
})

test.describe('el checkout en italiano', () => {
  test.use({ locale: 'it-IT' })

  test('el paso 2 está en italiano', async ({ page }) => {
    await llegarAlPaso(page, 2)
    await expect(page.locator('html')).toHaveAttribute('lang', 'it')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pagamento ed extra')
    await expect(cuerpo(page)).toContainText(`Assicurazione per ${PRODUCTO}`)
    await expect(cuerpo(page)).toContainText('/mese* per unità')
  })
})

test.describe('la app nativa sigue en castellano', () => {
  // Aunque el navegador vaya en alemán y haya una elección previa guardada.
  // Mismo patrón que `idiomas.spec.ts`: no se añade otro detector de app.
  test.use({ locale: 'de-DE' })

  test('el checkout de la app no cambia de idioma', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:idioma', 'de')
    })
    await llegarAlPaso(page, 2)

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pago y extras')
    await expect(cuerpo(page), 'y sus precios siguen en formato castellano').toContainText(euroEn('es-ES', 1229))
  })
})
