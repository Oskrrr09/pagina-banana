import { expect, test } from '@playwright/test'

// ============================================================================
// Los accesos de la Inicio nativa llevan a donde dicen.
//
// «Mis pedidos» apuntaba a `/cuenta` a secas, que abre «Datos personales»: la
// etiqueta prometía una cosa y la pantalla enseñaba otra. Se comprueba el
// recorrido entero —pulsar en Inicio, aterrizar en Cuenta, ver el apartado
// correcto— porque cada mitad por separado ya pasaba antes del arreglo.
// ============================================================================

const FIXTURE = '/pagina-banana/tests/e2e-prefs/inicio-fixture.html'

test('saluda por el nombre de pila cuando lo hay', async ({ page }) => {
  await page.goto(FIXTURE)
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, Elena' })).toBeVisible()
})

test('«Mis pedidos» abre Mis pedidos, no Datos personales', async ({ page }) => {
  await page.goto(FIXTURE)

  await page.getByRole('link', { name: /Mis pedidos/ }).click()

  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Datos personales' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mis pedidos' })).toHaveAttribute('aria-current', 'page')
})

test('«Mis compras» sigue llevando a su pantalla', async ({ page }) => {
  await page.goto(FIXTURE)
  await expect(page.getByRole('link', { name: /Mis compras/ })).toHaveAttribute('href', '/mis-productos')
})
