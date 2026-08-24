import { expect, test, type Page, type Route } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// A62-07 — LO QUE FALLA POR DENTRO NO SE CUENTA POR FUERA.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// Las dos pantallas de acceso traducían un único error —`Invalid login
// credentials`— y para CUALQUIER otro hacían `setError(signInError)`, es decir,
// pintaban el mensaje que venía del SDK. La reauditoría del 2026-08-23 vio así
// un `Failed to fetch` con la red caída, y un error de servidor llegando tal
// cual a la pantalla.
//
// Lo que se exige aquí es una propiedad, no un texto concreto del SDK:
//
//   1. el mensaje técnico NO aparece en pantalla;
//   2. aparece un mensaje genérico y seguro;
//   3. las credenciales incorrectas conservan su mensaje específico;
//   4. la cuenta sin permiso de agente conserva el suyo.
//
// POR QUÉ ESTO ES INTEGRACIÓN Y NO E2E DE NAVEGADOR
//
// Sin Supabase configurado, `/login` y `/agente/login` no pintan formulario
// sino su pantalla de «esto necesita Supabase», y el build de las suites de
// navegador corre a propósito sin credenciales. El fallo hay que provocarlo
// sobre la petición REAL de GoTrue, así que se prueba donde esa petición existe.
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
  await admin.from('agentes').delete().in('id', usuariosCreados)
  await admin.from('clientes').delete().in('id', usuariosCreados)
  await admin.from('visitantes').delete().in('auth_id', usuariosCreados)
  for (const uid of usuariosCreados) await admin.auth.admin.deleteUser(uid)
})

async function cuenta(etiqueta: string, comoAgente = false) {
  const email = `a62-07-${RUN}-${etiqueta}@example.test`
  const password = `A62-07-${RUN}-segura`
  const { data, error } = await servicio().auth.admin.createUser({ email, password, email_confirm: true })
  expect(error, 'la cuenta de prueba debe crearse').toBeNull()
  const uid = data.user!.id
  usuariosCreados.push(uid)
  if (comoAgente) {
    const { error: errorFicha } = await servicio().from('agentes').insert({ id: uid, email, nombre: 'Agente A62-07' })
    expect(errorFicha, 'la ficha de agente debe crearse').toBeNull()
  }
  return { email, password, uid }
}

/**
 * Un mensaje inconfundiblemente técnico. No se elige por reproducir lo que
 * devuelve una versión concreta del SDK —eso haría la prueba frágil—, sino
 * porque si algo así llega al DOM es que se está pintando el error de dentro.
 */
const TECNICO = 'relation "auth.users" does not exist'

/** Rompe la petición de contraseña de GoTrue, y sólo ésa. */
async function romperInicioSesion(page: Page, modo: 'servidor' | 'red') {
  await page.route('**/auth/v1/token**', (route: Route) => {
    if (!route.request().url().includes('grant_type=password')) return route.continue()
    if (modo === 'red') return route.abort('connectionrefused')
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ code: '42P01', message: TECNICO, hint: null, details: null }),
    })
  })
}

async function enviar(page: Page, email: string, password: string) {
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('form').first().getByRole('button').first().click()
}

const alerta = (page: Page) => page.getByRole('alert').first()

async function abrir(page: Page, ruta: string) {
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
  await page.goto(ruta)
}

// El texto genérico de cada superficie. El del cliente está traducido; el del
// panel es castellano, que es el contrato vigente de esa pantalla.
const GENERICO_CLIENTE = 'No se ha podido iniciar sesión. Inténtalo de nuevo.'
const GENERICO_AGENTE = 'No se ha podido iniciar sesión. Inténtalo de nuevo.'
const CREDENCIALES = 'Email o contraseña incorrectos.'

test.describe('los errores del acceso de cliente no cuentan la implementación', () => {
  test('un fallo de servidor no enseña el mensaje técnico', async ({ page }) => {
    const a = await cuenta('cliente-servidor')
    await abrir(page, './login')
    await romperInicioSesion(page, 'servidor')
    await enviar(page, a.email, a.password)

    await expect(alerta(page), 'algo se dice').toBeVisible()
    await expect(page.getByText(TECNICO), 'el mensaje técnico no llega a la pantalla').toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('42P01')
    await expect(alerta(page), 'se ofrece un mensaje genérico y accionable').toHaveText(GENERICO_CLIENTE)
  })

  test('la red caída no enseña «Failed to fetch»', async ({ page }) => {
    const a = await cuenta('cliente-red')
    await abrir(page, './login')
    await romperInicioSesion(page, 'red')
    await enviar(page, a.email, a.password)

    await expect(alerta(page)).toBeVisible()
    await expect(page.getByText(/Failed to fetch/i), 'el texto del SDK no llega').toHaveCount(0)
    await expect(alerta(page)).toHaveText(GENERICO_CLIENTE)
  })

  test('las credenciales incorrectas conservan su mensaje propio', async ({ page }) => {
    const a = await cuenta('cliente-credenciales')
    await abrir(page, './login')
    await enviar(page, a.email, 'esta-no-es-la-contrasena')

    await expect(alerta(page), 'no se degrada al genérico').toHaveText(CREDENCIALES)
  })
})

test.describe('los errores del acceso de agente no cuentan la implementación', () => {
  test('un fallo de servidor no enseña el mensaje técnico', async ({ page }) => {
    const a = await cuenta('agente-servidor', true)
    await abrir(page, './agente/login')
    await romperInicioSesion(page, 'servidor')
    await enviar(page, a.email, a.password)

    await expect(alerta(page)).toBeVisible()
    await expect(page.getByText(TECNICO), 'el mensaje técnico no llega a la pantalla').toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('42P01')
    await expect(alerta(page)).toHaveText(GENERICO_AGENTE)
  })

  test('la red caída no enseña «Failed to fetch»', async ({ page }) => {
    const a = await cuenta('agente-red', true)
    await abrir(page, './agente/login')
    await romperInicioSesion(page, 'red')
    await enviar(page, a.email, a.password)

    await expect(alerta(page)).toBeVisible()
    await expect(page.getByText(/Failed to fetch/i)).toHaveCount(0)
    await expect(alerta(page)).toHaveText(GENERICO_AGENTE)
  })

  test('las credenciales incorrectas conservan su mensaje propio', async ({ page }) => {
    const a = await cuenta('agente-credenciales', true)
    await abrir(page, './agente/login')
    await enviar(page, a.email, 'esta-no-es-la-contrasena')

    await expect(alerta(page)).toHaveText(CREDENCIALES)
  })

  test('una cuenta sin permiso de agente sigue diciendo exactamente eso', async ({ page }) => {
    // Cuenta real, contraseña correcta, pero sin ficha en `agentes`.
    const a = await cuenta('agente-sin-permiso')
    await abrir(page, './agente/login')
    await enviar(page, a.email, a.password)

    await expect(
      page.getByText(/Esta cuenta no tiene permiso de agente/),
      'un estado funcional, no un error genérico',
    ).toBeVisible()
  })
})

// ============================================================================
// A62-09 — LA APLICACIÓN TIENE SU PROPIO RELOJ.
//
// A62-07 decidió QUÉ se enseña cuando el error llega. Esto decide CUÁNTO se
// espera a que llegue. Reproducido antes de arreglarlo: reteniendo la petición
// de contraseña —sin responder ni abortar—, las dos pantallas se quedaban en
// «Entrando…», deshabilitadas y sin alerta, y **no se recuperaban solas**; sólo
// reaccionaban cuando la red respondía.
//
// LA PROPIEDAD QUE SE PROTEGE
//
// La interfaz sale del estado pendiente **mientras la ruta sigue retenida**.
// Eso es lo que distingue una cancelación propia de una liberación provocada
// por la prueba: aquí nadie suelta la petición hasta después de comprobarlo.
// ============================================================================

/** Techo de la ESPERA DEL TEST. No es el límite de la aplicación, que es menor. */
const TECHO_DEL_TEST = 13_000

/**
 * Deja el servidor RESPONDER y retiene su respuesta antes de entregarla.
 *
 * POR QUÉ NO BASTA CON DEJAR LA PETICIÓN MUDA
 *
 * Retener sin más, y abortar al soltar, demuestra que la interfaz se recupera
 * sola —que es lo primero—, pero deja sin probar el caso que de verdad da miedo:
 * que el servidor **sí** hubiera validado las credenciales y su `200` con
 * tokens llegara tarde, después de que el cliente ya se hubiera rendido. Con un
 * `abort` esa respuesta no existe nunca, así que la prueba afirmaba más de lo
 * que ejercitaba.
 *
 * Aquí el `route.fetch()` va **antes** de la barrera: GoTrue procesa el login de
 * verdad y su respuesta se queda en Playwright, mientras la petición de la
 * página sigue pendiente y el `AbortController` de producción corre su plazo.
 * Sólo cuando la prueba ha comprobado la recuperación se intenta entregarla.
 */
function retenerInicioSesion(page: Page) {
  let liberar: () => void = () => {}
  const retenida = new Promise<void>((resolve) => {
    liberar = resolve
  })
  let acabar: () => void = () => {}
  /** Se resuelve cuando el manejador ha terminado del todo: nada queda en vuelo. */
  const handlerTerminado = new Promise<void>((resolve) => {
    acabar = resolve
  })

  let interceptadas = 0
  let sueltas = 0
  let servidorRespondio = false
  let statusServidor: number | null = null
  let entregaTardia: 'entregada' | 'rechazada' | null = null

  const listo = page.route('**/auth/v1/token**', async (route) => {
    if (!route.request().url().includes('grant_type=password')) return route.continue()
    interceptadas += 1
    try {
      // El servidor valida las credenciales DE VERDAD y emite sus tokens…
      const respuesta = await route.fetch()
      servidorRespondio = true
      statusServidor = respuesta.status()

      // …y esa respuesta se queda aquí. El navegador sigue esperando.
      await retenida
      sueltas += 1

      // Entrega tardía. Que Playwright la acepte o la rechace por petición ya
      // cancelada son los dos desenlaces válidos: lo que no puede pasar es que
      // esos tokens inicien sesión.
      try {
        await route.fulfill({ response: respuesta })
        entregaTardia = 'entregada'
      } catch {
        entregaTardia = 'rechazada'
      }
    } finally {
      acabar()
    }
  })

  return {
    listo,
    handlerTerminado,
    liberar: () => liberar(),
    get interceptadas() {
      return interceptadas
    },
    get sueltas() {
      return sueltas
    },
    get servidorRespondio() {
      return servidorRespondio
    },
    get statusServidor() {
      return statusServidor
    },
    get entregaTardia() {
      return entregaTardia
    },
  }
}

/** Lo que se ve: botón, alerta, dirección y lo que quedó escrito. */
async function pantalla(page: Page) {
  return page.evaluate(() => {
    const boton = document.querySelector('button[type="submit"]')
    const aviso = document.querySelector('[role="alert"]')
    const email = document.querySelector('input[type="email"]') as HTMLInputElement | null
    const clave = document.querySelector('input[type="password"]') as HTMLInputElement | null
    return {
      boton: boton?.textContent?.trim() ?? null,
      deshabilitado: (boton as HTMLButtonElement | null)?.disabled ?? null,
      alerta: aviso?.textContent?.trim() ?? null,
      ruta: location.pathname,
      email: email?.value ?? null,
      clave: clave?.value ?? null,
      // Claves de sesión de supabase-js, por patrón: el `project-ref` no se
      // escribe a mano porque cambia con el entorno.
      sesiones: Object.keys(localStorage).filter((k) => /auth-token$/.test(k) || k === 'banana-agente-auth'),
    }
  })
}

for (const caso of [
  { etq: 'cliente', ruta: './login', reposo: 'Iniciar sesión', generico: GENERICO_CLIENTE, destino: /\/cuenta/ },
  { etq: 'agente', ruta: './agente/login', reposo: 'Entrar', generico: GENERICO_AGENTE, destino: /\/agente$/ },
] as const) {
  test(`A62-09 · ${caso.etq}: una petición colgada deja de esperarse por el límite propio`, async ({ page }) => {
    const a = await cuenta(`timeout-${caso.etq}`, caso.etq === 'agente')
    await abrir(page, caso.ruta)
    const retencion = retenerInicioSesion(page)
    await retencion.listo

    try {
      await enviar(page, a.email, a.password)

      // Primero, el estado pendiente: la petición está en vuelo y retenida.
      await expect(page.getByRole('button', { name: 'Entrando…' })).toBeDisabled()
      const pendiente = await pantalla(page)
      expect(pendiente.alerta, 'mientras espera no hay nada que decir').toBeNull()
      expect(retencion.interceptadas, 'el password grant se interceptó de verdad').toBe(1)

      // Y el servidor NO se quedó callado: validó las credenciales y emitió sus
      // tokens. Ese `200` está retenido, a un paso del navegador.
      await expect.poll(() => retencion.servidorRespondio, { message: 'el servidor llegó a responder' }).toBe(true)
      expect(retencion.statusServidor, 'y respondió que el login era bueno').toBe(200)

      // Y ahora lo que fallaba: que se recupere SOLA.
      await expect(page.getByRole('alert'), 'la aplicación deja de esperar por su cuenta').toBeVisible({
        timeout: TECHO_DEL_TEST,
      })

      const tras = await pantalla(page)
      expect(retencion.sueltas, 'la ruta seguía retenida: la recuperación no la causó el test').toBe(0)

      expect(tras.alerta, 'el copy seguro de A62-07, sin duplicar su lógica').toBe(caso.generico)
      expect(tras.alerta).not.toMatch(/Failed to fetch|AbortError|aborted|signal/i)
      expect(tras.boton, 'el botón vuelve a su texto de reposo').toBe(caso.reposo)
      expect(tras.deshabilitado, 'y se puede volver a intentar').toBe(false)
      expect(tras.email, 'el correo escrito no se pierde').toBe(a.email)
      expect(tras.clave, 'ni la contraseña').toBe(a.password)
      expect(tras.ruta, 'no se navega a ninguna parte').toContain(caso.etq === 'agente' ? '/agente/login' : '/login')
      expect(tras.sesiones, 'no hay sesión').toEqual([])

      // NADA DE SIGNED_IN TARDÍO
      //
      // Ahora sí: se intenta entregar el `200` que el servidor emitió ANTES del
      // plazo. Es el escenario que da miedo —credenciales buenas, tokens
      // válidos, sólo que tarde— y el que hay que descartar. Se espera a que el
      // manejador termine, en vez de a un reloj.
      retencion.liberar()
      await retencion.handlerTerminado
      expect(retencion.entregaTardia, 'la entrega tardía se intentó y se resolvió').not.toBeNull()

      const tarde = await pantalla(page)
      expect(tarde.sesiones, 'los tokens tardíos no inician sesión').toEqual([])
      expect(tarde.ruta, 'ni navega tarde').toBe(tras.ruta)
      await expect(page).not.toHaveURL(caso.destino)

      // Ventana de observación, no estabilizador: si `supabase-js` fuese a
      // reaccionar a esa respuesta lo haría aquí. La prueba ya sería correcta
      // sin ella; sirve para que la ausencia se afirme sobre algo mirado.
      await page.waitForTimeout(500)
      const masTarde = await pantalla(page)
      expect(masTarde.sesiones, 'tampoco un instante después').toEqual([])
      expect(masTarde.ruta, 'y sigue donde estaba').toBe(tras.ruta)
    } finally {
      retencion.liberar()
      await page.unroute('**/auth/v1/token**').catch(() => undefined)
    }
  })
}

test('A62-09 · una respuesta lenta pero válida sigue iniciando sesión', async ({ page }) => {
  // Medio segundo: muy por debajo del límite. Acercarse a él sólo alargaría la
  // suite sin proteger nada más.
  const a = await cuenta('timeout-lenta')
  await abrir(page, './login')
  await page.route('**/auth/v1/token**', async (route) => {
    if (!route.request().url().includes('grant_type=password')) return route.continue()
    const respuesta = await route.fetch()
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({ response: respuesta })
  })

  try {
    await enviar(page, a.email, a.password)
    await expect(page, 'lento no es lo mismo que fallido').toHaveURL(/\/cuenta/, { timeout: 20_000 })
    await expect(page.getByText(GENERICO_CLIENTE), 'y no se inventa un error').toHaveCount(0)
  } finally {
    await page.unroute('**/auth/v1/token**').catch(() => undefined)
  }
})
