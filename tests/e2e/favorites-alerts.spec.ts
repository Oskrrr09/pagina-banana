import { test, expect, type Page } from '@playwright/test'

// PR4: seguimiento de disponibilidad + centro de notificaciones + simulación
// de llegada a tienda.

async function addIphoneToFavoritesAndPickStore(page: Page) {
  // Añadir favorito desde el catálogo de iPhone.
  await page.goto('./iphone')
  await page.getByRole('button', { name: 'Añadir iPhone 17 Pro a favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Quitar iPhone 17 Pro de favoritos' })).toBeVisible()

  // Elegir tienda favorita desde el bottom sheet (se abre en la primera visita).
  const promptDialog = page.getByRole('dialog', { name: /¿Cuál es tu tienda Banana habitual\?/ })
  if (await promptDialog.count()) {
    await promptDialog.getByRole('button', { name: 'Elegir tienda', exact: true }).click()
    await promptDialog.getByRole('button', { name: /Banana Triana/ }).click()
  }
}

/**
 * Activa el seguimiento de disponibilidad de un producto en la tienda indicada.
 *
 * POR QUÉ ESTO NO PUEDE SER UNA BÚSQUEDA GLOBAL
 *
 * `page.getByRole('button', { name: /Banana Triana/ })` encontraba DOS botones
 * en cuanto Banana Triana era la tienda favorita: el chip de la barra azul de
 * utilidades —«Mi tienda: Banana Triana. Cambiar o quitar.», que sólo existe
 * desde `xl`— y la opción de dentro del selector. Playwright fallaba por
 * `strict mode violation`.
 *
 * Y era intermitente, no siempre rojo, porque la tienda favorita sólo quedaba
 * fijada si el diálogo de bienvenida llegaba a aparecer: sin ella la cabecera
 * dice «Elegir tienda favorita» y sólo había una coincidencia. Medido en el CI
 * post-merge de la PR #50, run 31593472053.
 *
 * Así que se busca por contexto: la tarjeta del producto, su `<details>` de
 * seguimiento, y dentro sólo puede haber un botón de esa tienda. Nada de
 * `.first()`, que taparía la ambigüedad en vez de resolverla.
 */
async function seguirDisponibilidadEn(page: Page, producto: string, tienda: string) {
  const tarjeta = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: producto, level: 3 }) })
  await expect(tarjeta, `no se encontró la tarjeta de ${producto}`).toHaveCount(1)

  const seguimiento = tarjeta.locator('details').filter({ hasText: 'Seguir disponibilidad' })
  await seguimiento.getByText('Seguir disponibilidad').click()

  const opcion = seguimiento.getByRole('button', { name: new RegExp(tienda) })
  // La comprobación que impide que vuelva la ambigüedad: dentro del selector
  // hay exactamente un botón de esa tienda.
  await expect(opcion, `dentro del seguimiento debe haber una sola opción de ${tienda}`).toHaveCount(1)
  await opcion.click()
}

test('activar seguimiento genera notificación al simular llegada + campana con contador', async ({ page }) => {
  await addIphoneToFavoritesAndPickStore(page)

  await page.goto('./favoritos')
  await expect(page.getByRole('heading', { name: 'iPhone 17 Pro', level: 3 })).toBeVisible()

  // Activa el seguimiento eligiendo Triana desde el details.
  await seguirDisponibilidadEn(page, 'iPhone 17 Pro', 'Banana Triana')
  await expect(page.getByText(/Siguiendo disponibilidad en Banana Triana/)).toBeVisible()

  // Simular llegada crea una notificación demostrativa.
  await page.getByRole('button', { name: /Simular llegada/ }).click()
  await expect(page.getByText(/Simulación: iPhone 17 Pro figura como disponible/)).toBeVisible()

  // Campana muestra el contador de no leídos.
  await expect(page.getByRole('button', { name: /Avisos \(1 sin leer\)/ })).toBeVisible()

  // Abre el panel y marca todas como leídas.
  await page.getByRole('button', { name: /Avisos \(1 sin leer\)/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Avisos' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Marcar todos como leídos' }).click()
  // Ya no hay contador.
  await expect(page.getByRole('button', { name: 'Avisos' })).toBeVisible()
})

test('quitar favorito con seguimiento activo también desactiva el aviso (sin huérfanos)', async ({ page }) => {
  await addIphoneToFavoritesAndPickStore(page)

  await page.goto('./favoritos')
  await seguirDisponibilidadEn(page, 'iPhone 17 Pro', 'Banana Triana')

  // Quita el favorito → alertas y notificaciones huérfanas se limpian.
  await page.getByRole('button', { name: 'Quitar iPhone 17 Pro de favoritos' }).click()
  await expect(page.getByText('Aún no has guardado ningún producto.')).toBeVisible()

  const orphan = await page.evaluate(() => {
    return {
      alerts: JSON.parse(localStorage.getItem('banana:favorite-alerts') || '[]'),
      notifications: JSON.parse(localStorage.getItem('banana:favorite-notifications') || '[]'),
    }
  })
  expect(orphan.alerts).toEqual([])
  expect(orphan.notifications).toEqual([])
})

test('en /favoritos no existe ningún input de email ni petición de red saliente', async ({ page }) => {
  await addIphoneToFavoritesAndPickStore(page)
  await page.goto('./favoritos')
  // Ninguna llamada externa.
  const requests: string[] = []
  page.on('request', (req) => {
    if (!req.url().startsWith('http://127.0.0.1')) requests.push(req.url())
  })
  await seguirDisponibilidadEn(page, 'iPhone 17 Pro', 'Banana Triana')
  await page.getByRole('button', { name: /Simular llegada/ }).click()
  // Nada de inputs email en toda la página.
  await expect(page.locator('input[type="email"]')).toHaveCount(0)
  expect(requests, `Peticiones inesperadas: ${requests.join(', ')}`).toEqual([])
})

test('con la tienda ya favorita, el seguimiento sigue eligiendo la opción correcta', async ({ page }) => {
  // EL ESTADO QUE PROVOCABA EL INTERMITENTE
  //
  // Con Banana Triana ya guardada como favorita, la barra de utilidades pinta
  // su chip —«Mi tienda: Banana Triana. Cambiar o quitar.»— y pasa a haber DOS
  // botones que casan con /Banana Triana/ en la página. Antes eso reventaba por
  // `strict mode violation`; ahora tiene que seguir funcionando porque la
  // búsqueda va acotada al selector.
  //
  // Se siembra el estado en vez de esperar a que el diálogo de bienvenida
  // aparezca: así el caso es determinista y no depende de por dónde ande la
  // aplicación.
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store', 'triana')
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })

  await page.goto('./iphone')
  await page.getByRole('button', { name: 'Añadir iPhone 17 Pro a favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Quitar iPhone 17 Pro de favoritos' })).toBeVisible()

  await page.goto('./favoritos')

  // La precondición que crea la ambigüedad: el chip de la cabecera existe.
  await expect(
    page.getByRole('button', { name: /Mi tienda: Banana Triana/ }),
    'este caso sólo prueba algo si el chip de la cabecera está presente',
  ).toHaveCount(1)

  // Y se sigue usando el MISMO helper que los demás casos: si alguien lo
  // devolviera a una búsqueda global, aquí habría dos coincidencias y su
  // comprobación de cardinalidad fallaría.
  await seguirDisponibilidadEn(page, 'iPhone 17 Pro', 'Banana Triana')

  await expect(page.getByText(/Siguiendo disponibilidad en Banana Triana/)).toBeVisible()
})
