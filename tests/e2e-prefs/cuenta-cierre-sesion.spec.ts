import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// El cierre de sesión visto desde la pantalla `/cuenta`.
//
// `tests/unit/cerrar-sesion.test.ts` cubre la función; esto cubre al
// consumidor, que es donde estaba el segundo fallo: la página navegaba a la
// portada ANTES de saber si el cierre había funcionado, así que un fallo de
// Supabase dejaba a la persona fuera de su cuenta en apariencia y dentro en
// realidad.
//
// Se monta el `ProfilePage` de producción con el contexto de sesión inyectado;
// ver `cuenta-fixture.tsx`. Nada de la lógica de la página se reproduce aquí.
// ============================================================================

const FIXTURE = '/pagina-banana/tests/e2e-prefs/cuenta-fixture.html'

async function abrirCuenta(page: Page, resultado: 'ok' | 'error' | 'pendiente') {
  await page.goto(`${FIXTURE}?resultado=${resultado}`)
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()
  await expect(page.getByTestId('ruta')).toHaveText('/cuenta')
}

test('mientras el cierre está en curso, el botón se bloquea y no se navega', async ({ page }) => {
  await abrirCuenta(page, 'pendiente')

  const boton = page.getByRole('button', { name: /Cerrar sesión|Cerrando sesión/ })
  await boton.click()

  await expect(page.getByRole('button', { name: 'Cerrando sesión…' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cerrando sesión…' })).toBeDisabled()
  await expect(page.getByTestId('ruta'), 'no se puede navegar antes de saber si cerró').toHaveText('/cuenta')
  await expect(page.getByRole('alert'), 'todavía no hay nada que avisar').toHaveCount(0)
})

test('si Supabase devuelve error, se queda en /cuenta y lo dice', async ({ page }) => {
  await abrirCuenta(page, 'error')

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()

  // Sigue en su cuenta, no en la portada ni en el formulario de acceso.
  await expect(page.getByTestId('ruta')).toHaveText('/cuenta')
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()

  const aviso = page.getByRole('alert')
  await expect(aviso).toBeVisible()
  await expect(aviso, 'tiene que decir que la sesión sigue abierta').toContainText('Sigues dentro de tu cuenta')
  await expect(aviso, 'y por qué falló').toContainText('Network request failed')

  // La cuenta no se borra de la pantalla: los datos siguen ahí.
  await expect(page.getByText('elena@example.test')).toBeVisible()

  // Y se puede reintentar.
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeEnabled()
})

test('si el cierre se confirma, navega a la portada sin dejar aviso de error', async ({ page }) => {
  await abrirCuenta(page, 'ok')

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()

  await expect(page.getByTestId('ruta')).toHaveText('/')
  await expect(page.getByRole('heading', { name: 'Portada' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Acceso' }), 'no debe pasar por /login').toHaveCount(0)
})

test('el historial se reemplaza: volver atrás no devuelve a la cuenta', async ({ page }) => {
  await abrirCuenta(page, 'ok')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByTestId('ruta')).toHaveText('/')

  // Con `replace` la entrada de /cuenta desaparece del historial. Sin él, este
  // clic devolvería a una cuenta ya cerrada.
  await page.getByRole('button', { name: 'Volver atrás' }).click()

  await expect(page.getByTestId('ruta'), 'atrás no puede devolver a /cuenta').not.toHaveText('/cuenta')
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toHaveCount(0)
})

// ============================================================================
// El enlace profundo de `/cuenta?apartado=…`.
//
// «Mis pedidos» de Inicio apuntaba a `/cuenta` a secas, que abre «Datos
// personales»: la etiqueta prometía una cosa y la pantalla enseñaba otra.
// ============================================================================

const FIXTURE_CUENTA = '/pagina-banana/tests/e2e-prefs/cuenta-fixture.html'

test('sin parámetro se abre Datos personales, como siempre', async ({ page }) => {
  await page.goto(FIXTURE_CUENTA)
  await expect(page.getByRole('heading', { name: 'Datos personales' })).toBeVisible()
})

test('`?apartado=pedidos` abre Mis pedidos', async ({ page }) => {
  // La gramática antigua se traduce a `/cuenta/pedidos`; lo que esta prueba
  // protege —que el enlace de siempre siga abriendo lo que promete— no cambia.
  await page.goto(`${FIXTURE_CUENTA}?apartado=pedidos`)

  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Datos personales' })).toHaveCount(0)
  // Y el menú lo refleja, no sólo el contenido.
  // El menú de apartados son ENLACES desde la PR #60: cada apartado tiene su
  // propia URL, así que un enlace es lo que es. La propiedad que esta línea
  // protege —que el apartado abierto queda marcado— no cambia.
  await expect(page.getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('aria-current', 'page')
})

test('vale para cualquier apartado real', async ({ page }) => {
  await page.goto(`${FIXTURE_CUENTA}?apartado=reservas`)
  await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible()
})

test('un apartado inventado no rompe la cuenta', async ({ page }) => {
  // Llegar a la cuenta y no ver nada porque alguien escribió mal el parámetro
  // sería peor que abrir el apartado de siempre.
  await page.goto(`${FIXTURE_CUENTA}?apartado=loquesea`)
  await expect(page.getByRole('heading', { name: 'Datos personales' })).toBeVisible()
})
