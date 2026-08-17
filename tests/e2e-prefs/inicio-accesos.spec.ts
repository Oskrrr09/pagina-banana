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
  // El menú de apartados son ENLACES desde la PR #60: cada apartado tiene su
  // propia URL, así que un enlace es lo que es. La propiedad que esta línea
  // protege —que el apartado abierto queda marcado— no cambia.
  await expect(page.getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('aria-current', 'page')
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

// ---------------------------------------------------------------------------
// El aviso de reserva disponible.
//
// Es la única señal con estado real en el servidor que Inicio interrumpe para
// enseñar, y no se puede demostrar sin una reserva: en la suite E2E no hay
// Supabase. El fixture inyecta la carga de reservas por la prop
// `listarReservas`, que en producción vale `listMyReservations`.
// ---------------------------------------------------------------------------

const CON_RESERVAS = `${FIXTURE}?reservas=1`

test('una reserva disponible se avisa en Inicio, y una en espera no', async ({ page }) => {
  await page.goto(CON_RESERVAS)

  const avisos = page.locator('[aria-label="Avisos"]')
  await expect(avisos).toBeVisible()
  await expect(avisos.getByText('Tu reserva está lista')).toBeVisible()

  // Los datos son los de ESA reserva, no un texto genérico.
  await expect(avisos).toContainText('iPhone 17 Pro')
  await expect(avisos).toContainText('256 GB · Titanio natural')

  // Y la que está en espera no se convierte en aviso: si el filtro se aflojara,
  // aquí aparecerían dos.
  await expect(avisos.getByRole('listitem')).toHaveCount(1)
  await expect(avisos).not.toContainText('MacBook Air M5')
})

test('el aviso abre el apartado de reservas de la cuenta', async ({ page }) => {
  await page.goto(CON_RESERVAS)

  await page.locator('[aria-label="Avisos"]').getByRole('link').first().click()

  // El fixture usa MemoryRouter, así que la URL del navegador no cambia: lo que
  // demuestra el destino es lo que se pinta.
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible()
  // El menú de apartados son ENLACES desde la PR #60: cada apartado tiene su
  // propia URL, así que un enlace es lo que es. La propiedad que esta línea
  // protege —que el apartado abierto queda marcado— no cambia.
  await expect(page.getByRole('link', { name: 'Mis reservas' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { name: 'Datos personales' })).toHaveCount(0)
})
