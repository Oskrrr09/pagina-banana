import { expect, test, type Page, type Route } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// AUD-001 — EL JUSTIFICANTE, EN LA PANTALLA DE VERDAD.
//
// QUÉ AÑADE ESTO A LA PRUEBA UNITARIA
//
// `tests/unit/justificante-errores.test.ts` fija que la capa devuelve
// categorías. Aquí se comprueba lo que de verdad importaba del hallazgo: qué
// LEE quien sube el archivo. Son dos contratos opuestos en la misma pantalla:
//
//   - formato y tamaño SIGUEN siendo específicos —son accionables—;
//   - Storage y el RPC se cuentan con un genérico, sin su `message`.
//
// Y una tercera cosa que sólo se ve aquí: los dos mensajes de dominio ahora
// están traducidos. Antes viajaban en castellano desde `src/lib`, así que una
// cuenta en inglés los leía en español.
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
  for (const uid of usuariosCreados) await admin.auth.admin.deleteUser(uid)
})

/** Se registra por la interfaz: la sesión es la de un cliente de verdad. */
async function registrarse(page: Page, etiqueta: string) {
  const email = `justificante-${RUN}-${etiqueta}@example.test`
  const password = `Justificante-${RUN}-segura`
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
  await page.goto('./registro')
  // Por atributos y no por etiqueta: una de las pruebas corre en inglés y los
  // rótulos cambian, pero el formulario es el mismo.
  await page.locator('input[autocomplete="name"]').fill('Cliente de prueba')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('form').first().getByRole('button').first().click()
  await expect(page).toHaveURL(/\/cuenta$/, { timeout: 15_000 })

  const { data } = await servicio().auth.admin.listUsers()
  const uid = data.users.find((u) => u.email === email)?.id
  expect(uid, 'la cuenta recién creada debe existir en Auth').toBeTruthy()
  usuariosCreados.push(uid!)
  return { uid: uid!, email }
}

const MAX = 5 * 1024 * 1024

/**
 * Donde la sección cuenta lo que ha pasado. Se localiza por su papel y no por
 * el texto: así la prueba falla enseñando lo que hay, en vez de no encontrar
 * nada cuando el mensaje no es el esperado.
 */
const aviso = (page: Page) => page.getByRole('status').filter({ hasText: /\S/ })

/**
 * Elige un archivo en la pantalla real del descuento educativo.
 *
 * Espera a que el email de la cuenta esté pintado antes de tocar el input.
 * `onFileChange` se va sin hacer nada si todavía no hay `session`, y el
 * contexto de cliente se resuelve después del primer render: sin esta espera
 * el archivo se elige en el vacío y la prueba mide una pantalla que no ha
 * llegado a intentar nada.
 */
async function subir(page: Page, email: string, nombre: string, tipo: string, bytes: number) {
  await page.goto('./cuenta/descuento')
  await expect(page.getByText(email), 'la cuenta debe estar cargada antes de subir').toBeVisible({ timeout: 15_000 })
  await page.locator('input[type="file"]').setInputFiles({ name: nombre, mimeType: tipo, buffer: Buffer.alloc(bytes) })
}

const PDF = { nombre: 'matricula.pdf', tipo: 'application/pdf' }

/** Un mensaje inconfundiblemente técnico para cada frontera. */
const TECNICO_STORAGE = 'new row violates row-level security policy for table "objects"'
const TECNICO_RPC = 'permission denied for function registrar_mi_justificante'

async function romperStorage(page: Page) {
  await page.route('**/storage/v1/object/**', (route: Route) =>
    route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: TECNICO_STORAGE }) }),
  )
}

async function romperRegistro(page: Page) {
  await page.route('**/rest/v1/rpc/registrar_mi_justificante*', (route: Route) =>
    route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: '42501', message: TECNICO_RPC, hint: null, details: null }),
    }),
  )
}

const GENERICO = 'No se ha podido subir el justificante. Inténtalo de nuevo.'

test.describe('lo que se puede contar de una subida y lo que no', () => {
  test('un formato no admitido se explica: es asunto de quien sube', async ({ page }) => {
    const { email } = await registrarse(page, 'formato')
    await subir(page, email, 'virus.exe', 'application/x-msdownload', 10)

    await expect(aviso(page), 'el motivo real es accionable y se dice').toHaveText(
      'Formato no admitido. Sube un PDF, JPG o PNG.',
    )
  })

  test('un archivo demasiado grande se explica con su límite', async ({ page }) => {
    const { email } = await registrarse(page, 'tamano')
    await subir(page, email, PDF.nombre, PDF.tipo, MAX + 1)

    await expect(aviso(page)).toHaveText('El archivo supera los 5 MB.')
  })

  test('un fallo de Storage no enseña lo que dijo Storage', async ({ page }) => {
    const { email } = await registrarse(page, 'storage')
    await romperStorage(page)
    await subir(page, email, PDF.nombre, PDF.tipo, 1024)

    await expect(aviso(page), 'algo se dice').toBeVisible()
    await expect(page.getByText(TECNICO_STORAGE), 'el mensaje de Storage no llega').toHaveCount(0)
    await expect(page.locator('body'), 'ni el nombre de la tabla interna').not.toContainText('row-level security')
    await expect(aviso(page)).toHaveText(GENERICO)
  })

  test('un fallo al registrar la solicitud no enseña el nombre de la función', async ({ page }) => {
    const { uid, email } = await registrarse(page, 'rpc')
    await romperRegistro(page)
    await subir(page, email, PDF.nombre, PDF.tipo, 1024)

    await expect(aviso(page), 'algo se dice').toBeVisible()
    await expect(page.getByText(TECNICO_RPC), 'el mensaje del RPC no llega').toHaveCount(0)
    await expect(page.locator('body'), 'ni el nombre de la función').not.toContainText('registrar_mi_justificante')
    await expect(page.locator('body'), 'ni la ruta interna del archivo').not.toContainText(`${uid}/justificante`)
    await expect(aviso(page)).toHaveText(GENERICO)

    // La solicitud no consta: un fallo al registrar no puede dejarla a medias.
    const { data } = await servicio().from('clientes').select('descuento_educativo_estado').eq('id', uid).maybeSingle()
    expect(data?.descuento_educativo_estado, 'la solicitud no quedó registrada').toBeNull()
  })
})

test.describe('con la cuenta en inglés', () => {
  test.use({ locale: 'en-US' })

  test('los motivos de dominio también se leen traducidos', async ({ page }) => {
    const { email } = await registrarse(page, 'ingles')
    await subir(page, email, 'virus.exe', 'application/x-msdownload', 10)

    await expect(
      page.getByText('Unsupported format. Upload a PDF, JPG or PNG.'),
      'el motivo sale en el idioma de la interfaz',
    ).toBeVisible()
    await expect(page.getByText('Formato no admitido. Sube un PDF, JPG o PNG.'), 'y no en castellano').toHaveCount(0)
  })
})
