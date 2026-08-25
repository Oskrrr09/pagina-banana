import { expect, test, type Page, type Route } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// AUD-001 — CREAR CUENTA TAMPOCO CUENTA LO QUE FALLA POR DENTRO.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// A62-07 puso la frontera en las dos pantallas de acceso, pero el alta se
// quedó fuera: `RegisterPage` hacía `setFormError(result.error)` y `signUp`
// devuelve el `message` del SDK en sus cuatro caminos —`updateUser` de email,
// `refreshSession`, `updateUser` de contraseña y `auth.signUp`—. Con eso se
// leía en pantalla `Failed to fetch`, `{}` y `User already registered`.
//
// Se exige una propiedad, no un texto del SDK:
//
//   1. el mensaje técnico NO aparece en pantalla;
//   2. aparece un mensaje genérico y seguro;
//   3. el formulario queda utilizable y no se pierde lo escrito;
//   4. no se crea sesión ni se navega a ninguna parte.
//
// EL CASO DEL EMAIL YA REGISTRADO NO SE INTERCEPTA
//
// Es el único de los tres que puede provocarse de verdad: se crea una cuenta
// con la clave de servicio y luego se intenta registrar ese mismo email por la
// interfaz. Así la prueba observa lo que responde GoTrue con la configuración
// real del repositorio, no lo que nosotros creemos que responde. El email
// lleva el sello del run, así que no se reutiliza entre ejecuciones.
//
// POR QUÉ ESTO ES INTEGRACIÓN Y NO E2E DE NAVEGADOR
//
// Igual que en `login-errores-servidor.spec.ts`: sin Supabase configurado
// `/registro` no pinta formulario sino su pantalla de «esto necesita
// Supabase», y las suites de navegador corren a propósito sin credenciales.
// ============================================================================

const URL = process.env.VITE_SUPABASE_URL
const SERVICE = process.env.RLS_TEST_SERVICE_KEY
const configurado = Boolean(URL && SERVICE)

test.skip(
  !configurado,
  'Necesita el Supabase local del orquestador: npm run test:integration lo levanta y pasa las claves.',
)

function servicio(): SupabaseClient {
  return createClient(URL!, SERVICE!, { auth: { persistSession: false, autoRefreshToken: false } })
}

const RUN = `${Date.now()}-${Math.random().toString(16).slice(2)}`
const usuariosCreados: string[] = []

test.afterAll(async () => {
  if (!configurado || usuariosCreados.length === 0) return
  const admin = servicio()
  await admin.from('clientes').delete().in('id', usuariosCreados)
  await admin.from('visitantes').delete().in('auth_id', usuariosCreados)
  for (const uid of usuariosCreados) await admin.auth.admin.deleteUser(uid)
})

/** Un email nuevo para cada caso: dos ejecuciones no pueden pisarse. */
const emailDe = (etiqueta: string) => `aud-001-${RUN}-${etiqueta}@example.test`

const PASSWORD = `Aud-001-${RUN}-segura`

/** Deja una cuenta ya existente para el caso del alta duplicada. */
async function cuentaYaExistente(etiqueta: string) {
  const email = emailDe(etiqueta)
  const { data, error } = await servicio().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  expect(error, 'la cuenta previa debe crearse').toBeNull()
  usuariosCreados.push(data.user!.id)
  return email
}

/**
 * Un mensaje inconfundiblemente técnico. No reproduce el de una versión
 * concreta del SDK —eso haría la prueba frágil—: si algo así llega al DOM es
 * que se está pintando el error de dentro.
 */
const TECNICO = 'relation "auth.users" does not exist'

/** Rompe el alta de GoTrue, y sólo ésa. */
async function romperAlta(page: Page, modo: 'servidor' | 'red') {
  await page.route('**/auth/v1/signup**', (route: Route) => {
    if (modo === 'red') return route.abort('connectionrefused')
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ code: '42P01', message: TECNICO, hint: null, details: null }),
    })
  })
}

const alerta = (page: Page) => page.getByRole('alert').first()
const campoNombre = (page: Page) => page.locator('input[autocomplete="name"]')
const campoEmail = (page: Page) => page.locator('input[type="email"]')
const campoPassword = (page: Page) => page.locator('input[type="password"]')
const boton = (page: Page) => page.locator('form').first().getByRole('button').first()

async function abrirRegistro(page: Page) {
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
  await page.goto('./registro')
}

async function enviar(page: Page, email: string, nombre = 'Persona de prueba') {
  await campoNombre(page).fill(nombre)
  await campoEmail(page).fill(email)
  await campoPassword(page).fill(PASSWORD)
  await boton(page).click()
}

/** El genérico público del alta, en castellano. */
const GENERICO = 'No se ha podido crear la cuenta. Inténtalo de nuevo.'
/** El mismo, en inglés: lo que debe leer quien tiene el navegador en otro idioma. */
const GENERICO_EN = 'We couldn’t create your account. Please try again.'

/** Ni sesión guardada ni navegación: un alta fallida no deja rastro. */
async function noHaySesion(page: Page) {
  await expect(page, 'un alta fallida no mueve de /registro').toHaveURL(/\/registro$/)
  const sesiones = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => /auth-token$/.test(k) || k === 'banana-agente-auth'),
  )
  expect(sesiones, 'un alta fallida no puede dejar sesión iniciada').toEqual([])
}

/** El formulario vuelve a estar disponible y conserva lo que se escribió. */
async function siguenLosDatos(page: Page, email: string, nombre = 'Persona de prueba') {
  await expect(boton(page), 'el botón deja el estado «Creando cuenta…»').toBeEnabled()
  await expect(campoNombre(page), 'el nombre escrito no se pierde').toHaveValue(nombre)
  await expect(campoEmail(page), 'el email escrito no se pierde').toHaveValue(email)
  await expect(campoPassword(page), 'la contraseña escrita no se pierde').toHaveValue(PASSWORD)
}

test.describe('los errores del alta de cuenta no cuentan la implementación', () => {
  test('un fallo de servidor no enseña el mensaje técnico', async ({ page }) => {
    const email = emailDe('servidor')
    await abrirRegistro(page)
    await romperAlta(page, 'servidor')
    await enviar(page, email)

    await expect(alerta(page), 'algo se dice').toBeVisible()
    await expect(page.getByText(TECNICO), 'el mensaje técnico no llega a la pantalla').toHaveCount(0)
    await expect(page.locator('body'), 'ni el código del error').not.toContainText('42P01')
    await expect(alerta(page), 'se ofrece un mensaje genérico y accionable').toHaveText(GENERICO)
    await siguenLosDatos(page, email)
    await noHaySesion(page)
  })

  test('la red caída no enseña «Failed to fetch»', async ({ page }) => {
    const email = emailDe('red')
    await abrirRegistro(page)
    await romperAlta(page, 'red')
    await enviar(page, email)

    await expect(alerta(page)).toBeVisible()
    await expect(page.getByText(/Failed to fetch/i), 'el texto del SDK no llega').toHaveCount(0)
    await expect(alerta(page)).toHaveText(GENERICO)
    await siguenLosDatos(page, email)
    await noHaySesion(page)
  })

  test('un email ya registrado no confirma que esa cuenta existe', async ({ page }) => {
    const email = await cuentaYaExistente('duplicado')
    await abrirRegistro(page)
    await enviar(page, email)

    await expect(alerta(page), 'algo se dice').toBeVisible()
    // El corazón del caso: el copy no puede distinguirse del de cualquier otro
    // fallo, o la pantalla se convierte en un oráculo de qué emails tienen
    // cuenta. Que el canal siga abierto en la API es otro asunto; lo que aquí
    // se protege es que la interfaz no lo amplifique.
    await expect(alerta(page), 'no se distingue del resto de fallos').toHaveText(GENERICO)
    await expect(page.getByText(/already registered/i), 'el mensaje de GoTrue no llega').toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('user_already_exists')
    await siguenLosDatos(page, email)
    await noHaySesion(page)
  })
})

test.describe('con el navegador en inglés', () => {
  test.use({ locale: 'en-US' })

  test('el fallo del alta se lee traducido, no en castellano', async ({ page }) => {
    const email = emailDe('ingles')
    await abrirRegistro(page)
    await romperAlta(page, 'servidor')
    await enviar(page, email)

    await expect(alerta(page)).toBeVisible()
    await expect(alerta(page), 'el error sale en el idioma de la interfaz').toHaveText(GENERICO_EN)
    await expect(page.getByText(GENERICO), 'y no en castellano').toHaveCount(0)
    await expect(page.getByText(TECNICO)).toHaveCount(0)
  })
})
