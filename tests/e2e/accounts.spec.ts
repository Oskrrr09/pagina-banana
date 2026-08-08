import { test, expect } from '@playwright/test'

// Cuentas de cliente y reservas — Fase 2.
//
// Ojo con el alcance: en CI NO hay credenciales de Supabase, así que
// `supabaseEnabled` es false y no se puede probar un login real. En local
// sí las hay (.env.local), de modo que estas pruebas tienen que pasar en
// AMBOS entornos. Por eso comprueban el cableado — rutas, redirecciones y
// degradación — y no el backend.
//
// El flujo real (registro, login, reserva de punta a punta, revisión de
// descuentos) se verifica a mano en local contra Supabase; queda descrito
// en docs/00-estado-actual.md.

// Variantes fijadas en el catálogo demostrativo (src/data/products/iphone.ts):
//   1tb-azul  → 'agotado'
//   1tb-plata → 'bajo-pedido'
const AGOTADA = './iphone/17-pro/1tb-azul'
const BAJO_PEDIDO = './iphone/17-pro/1tb-plata'
const DISPONIBLE = './iphone/17-pro/256gb-plata'

test('el icono de cuenta lleva a /login cuando no hay sesión', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', /\/login$/)
})

test('/mis-productos existe como ruta propia y no enseña nada sin sesión', async ({ page }) => {
  // La pantalla se prueba con su fixture (tests/e2e-prefs/mis-productos.spec.ts).
  // Lo que se comprueba aquí es el cableado, que el fixture no toca: que la ruta
  // resuelve en la aplicación de verdad —y no se la come `/:family`— y que el
  // guardia de sesión aguanta.
  await page.goto('./mis-productos')

  await expect(page.getByRole('heading', { name: 'Mis productos' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver producto/ })).toHaveCount(0)

  const redirigido = /\/login/.test(page.url())
  if (!redirigido) {
    await expect(page.getByText('necesitan Supabase configurado')).toBeVisible()
  }
})

test('/cuenta nunca muestra datos de cuenta sin sesión', async ({ page }) => {
  await page.goto('./cuenta')
  // Con Supabase configurado rebota a /login; sin él, enseña el aviso de
  // configuración. Lo que no puede pasar en ninguno de los dos casos es
  // que se pinten las secciones privadas.
  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Mis reservas' })).toHaveCount(0)

  const redirigido = /\/login/.test(page.url())
  if (!redirigido) {
    await expect(page.getByText('necesitan Supabase configurado')).toBeVisible()
  }
})

test('una variante agotada ofrece reservar en vez de comprar', async ({ page }) => {
  await page.goto(AGOTADA)
  await expect(page.getByText('Esta variante está agotada.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reservar' }).first()).toBeVisible()
  // La compra directa no debe estar disponible.
  await expect(page.getByRole('button', { name: 'Comprar' })).toHaveCount(0)
})

test('una variante bajo pedido también se reserva', async ({ page }) => {
  await page.goto(BAJO_PEDIDO)
  await expect(page.getByText('Esta variante es bajo pedido.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reservar' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Comprar' })).toHaveCount(0)
})

test('una variante disponible mantiene el flujo de compra', async ({ page }) => {
  await page.goto(DISPONIBLE)
  await expect(page.getByRole('button', { name: 'Comprar' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reservar' })).toHaveCount(0)
})

test('reservar sin sesión manda a login y luego vuelve a la ficha', async ({ page }) => {
  await page.goto(AGOTADA)
  await page.getByRole('button', { name: 'Reservar' }).first().click()
  // El destino se conserva para volver tras iniciar sesión.
  await expect(page).toHaveURL(/\/login\?redirect=.*1tb-azul/)
})

test('reservar sin sesión no mete nada en el carrito', async ({ page }) => {
  await page.goto(AGOTADA)
  await page.getByRole('button', { name: 'Reservar' }).first().click()
  await expect(page).toHaveURL(/\/login/)
  const cart = await page.evaluate(() => localStorage.getItem('banana:cart'))
  expect(cart === null || cart === '[]').toBeTruthy()
})
