import { expect, test } from '@playwright/test'

// ============================================================================
// Inicio nativo con sesión, y la ruta de «Mis pedidos».
//
// QUÉ SE CONSERVA DE ANTES, Y POR QUÉ
//
// `/cuenta` a secas abre «Datos personales». Cuando Inicio ofrecía un acceso
// llamado «Mis pedidos» que apuntaba ahí, la etiqueta prometía una cosa y la
// pantalla enseñaba otra. Ese acceso ya no está en Inicio —es un destino de la
// barra inferior y de la propia Cuenta—, pero **la ruta con apartado sigue
// teniendo que abrir el apartado que dice**, así que la comprobación se queda:
// cambia por dónde se entra, no lo que se exige.
//
// QUÉ SE COMPRUEBA AHORA ADEMÁS
//
// Que con sesión iniciada Inicio tampoco repita esos destinos. La suite E2E no
// puede verlo: allí no hay Supabase y por tanto no hay sesión.
// ============================================================================

const FIXTURE = '/pagina-banana/tests/e2e-prefs/inicio-fixture.html'

test('saluda por el nombre de pila cuando lo hay', async ({ page }) => {
  await page.goto(FIXTURE)
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, Elena' })).toBeVisible()
})

test('la ruta con apartado abre Mis pedidos, no Datos personales', async ({ page }) => {
  await page.goto(`${FIXTURE}#/cuenta?apartado=pedidos`)

  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Datos personales' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mis pedidos' })).toHaveAttribute('aria-current', 'page')
})

test('con sesión, Inicio no repite los destinos de la barra inferior', async ({ page }) => {
  await page.goto(FIXTURE)

  // Se mira el destino, no el texto: «Mis compras» puede aparecer
  // legítimamente en otros sitios.
  await expect(page.locator('a[href$="/mis-productos"]')).toHaveCount(0)
  await expect(page.locator('a[href*="apartado=pedidos"]')).toHaveCount(0)

  // Y lo que sí tiene que seguir habiendo: la ayuda, que no está en la barra.
  await expect(page.getByRole('link', { name: /Soporte/ })).toBeVisible()
})
