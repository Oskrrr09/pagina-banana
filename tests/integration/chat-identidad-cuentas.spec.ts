import { expect, test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// La frontera de identidad del chat, con cuentas reales.
//
// El compañero de esta prueba, `chat-anonimo-efimero.spec.ts`, cubre al
// invitado. Aquí se cubre lo que NO puede romperse al arreglarlo: que una
// cuenta permanente conserve su sesión y su chat, y que nadie herede la
// identidad de nadie al entrar, salir o cambiar de cuenta.
// ============================================================================

const URL_SUPABASE = process.env.VITE_SUPABASE_URL
const SERVICE = process.env.RLS_TEST_SERVICE_KEY
const CLAVE = 'prueba-chat-1234'

function admin() {
  return createClient(URL_SUPABASE!, SERVICE!, { auth: { persistSession: false } })
}

/** Cuenta permanente de verdad, creada por la API de administración. */
async function crearCuenta(sufijo: string) {
  const email = `chat-${sufijo}-${Date.now()}@example.test`
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password: CLAVE,
    email_confirm: true,
  })
  if (error) throw error
  return { email, id: data.user!.id }
}

/** `user.id` y si la sesión es anónima, leídos del token real del navegador. */
async function sesion(page: Page) {
  return page.evaluate(() => {
    const clave = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k))
    if (!clave) return { uid: null as string | null, anonima: null as boolean | null }
    try {
      const bruto = JSON.parse(localStorage.getItem(clave)!)
      const cuerpo = bruto.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(cuerpo))
      return { uid: (payload.sub as string) ?? null, anonima: (payload.is_anonymous as boolean) ?? null }
    } catch {
      return { uid: null, anonima: null }
    }
  })
}

async function entrar(page: Page, email: string) {
  await page.goto('./login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page
    .getByRole('button', { name: /Iniciar sesión|Entrar/i })
    .first()
    .click()
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 20_000 })
}

async function abrirChat(page: Page) {
  await page
    .getByRole('button', { name: /Abrir el chat|Chat/i })
    .first()
    .click()
}

async function escribir(page: Page, texto: string) {
  const campo = page.getByLabel('Escribe un mensaje para Bananito')
  await expect(campo).toBeVisible({ timeout: 20_000 })
  await campo.fill(texto)
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  await expect(page.getByText(texto)).toBeVisible({ timeout: 20_000 })
}

test.beforeEach(async ({ page }) => {
  test.skip(!URL_SUPABASE || !SERVICE, 'Necesita el Supabase local. Se ejecuta desde npm run test:integration.')
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
})

test('B · una cuenta permanente conserva su sesión y su chat al reiniciar', async ({ page }) => {
  const a = await crearCuenta('permanente')
  await entrar(page, a.email)

  const antes = await sesion(page)
  expect(antes.anonima, 'la sesión de una cuenta NO es anónima').not.toBe(true)
  expect(antes.uid, 'y es la de la cuenta creada').toBe(a.id)

  await abrirChat(page)
  await escribir(page, 'mensaje de la cuenta permanente')

  // ── NUEVA INICIALIZACIÓN ──
  await page.reload()
  await abrirChat(page)

  const despues = await sesion(page)
  // Éstas son las aserciones que detectarían que el arreglo cerró por error
  // una sesión permanente: no basta con «sigue habiendo sesión».
  expect(despues.uid, 'DEBE seguir siendo la misma cuenta, no otra ni ninguna').toBe(a.id)
  expect(despues.anonima, 'y NO puede haberse convertido en anónima').not.toBe(true)

  await expect(page.getByText('Antes de empezar'), 'a una cuenta no se le piden nombre ni correo').toHaveCount(0)
  await expect(page.getByText('mensaje de la cuenta permanente'), 'y conserva su chat').toBeVisible({
    timeout: 20_000,
  })
})

test('C · tras cerrar sesión, el siguiente visitante no hereda nada', async ({ page }) => {
  const a = await crearCuenta('logout')
  await entrar(page, a.email)
  await abrirChat(page)
  await escribir(page, 'mensaje privado de la cuenta que se va')

  await page.goto('./cuenta')
  await page
    .getByRole('button', { name: /Cerrar sesión/i })
    .first()
    .click()
  await expect(page.getByRole('button', { name: /Cerrar sesión/i })).toHaveCount(0, { timeout: 20_000 })

  await page.reload()
  await abrirChat(page)

  await expect(page.getByText('Antes de empezar'), 'el invitado siguiente debe identificarse').toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByText('mensaje privado de la cuenta que se va'), 'y no ve el chat de quien salió').toHaveCount(
    0,
  )

  const ahora = await sesion(page)
  expect(ahora.uid, 'no puede quedar actuando bajo la cuenta anterior').not.toBe(a.id)
})

test('D · un invitado que inicia sesión pasa a ser esa cuenta', async ({ page }) => {
  await page.goto('./')
  await abrirChat(page)
  await expect(page.getByText('Antes de empezar')).toBeVisible()
  await page.getByLabel('Nombre').fill('Invitado que luego entra')
  await page.getByLabel('Email').fill('invitado@example.test')
  await page
    .getByRole('button', { name: /Empezar|Continuar|Entrar/i })
    .first()
    .click()
  await escribir(page, 'mensaje escrito siendo invitado')

  const anonimo = await sesion(page)
  expect(anonimo.anonima).toBe(true)

  const a = await crearCuenta('desde-invitado')
  await entrar(page, a.email)

  const final = await sesion(page)
  expect(final.uid, 'la identidad final es la cuenta').toBe(a.id)
  expect(final.uid, 'y ya no es el visitante anónimo anterior').not.toBe(anonimo.uid)
  expect(final.anonima, 'ni una sesión anónima').not.toBe(true)
})

test('E · A cierra, B entra, y B no ve nada de A', async ({ page }) => {
  const a = await crearCuenta('cuenta-a')
  const b = await crearCuenta('cuenta-b')

  await entrar(page, a.email)
  await abrirChat(page)
  await escribir(page, 'secreto de la cuenta A')
  const sesionA = await sesion(page)

  await page.goto('./cuenta')
  await page
    .getByRole('button', { name: /Cerrar sesión/i })
    .first()
    .click()
  await expect(page.getByRole('button', { name: /Cerrar sesión/i })).toHaveCount(0, { timeout: 20_000 })

  await entrar(page, b.email)
  const sesionB = await sesion(page)
  expect(sesionB.uid, 'B es B').toBe(b.id)
  expect(sesionB.uid, 'y no A').not.toBe(sesionA.uid)

  await abrirChat(page)
  await expect(page.getByText('secreto de la cuenta A'), 'B no ve el chat de A en la interfaz').toHaveCount(0)

  // Y no es sólo la interfaz: desde la sesión de B, las políticas no dejan
  // leer los mensajes de A.
  const visibles = await page.evaluate(async (url) => {
    const clave = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k))
    const token = JSON.parse(localStorage.getItem(clave!)!).access_token
    const r = await fetch(`${url}/rest/v1/mensajes?select=cuerpo`, {
      headers: { Authorization: `Bearer ${token}`, apikey: token },
    })
    const filas = (await r.json()) as { cuerpo?: string }[]
    return Array.isArray(filas) ? filas.map((f) => f.cuerpo ?? '') : []
  }, URL_SUPABASE)
  expect(visibles, 'RLS: B no puede leer el mensaje de A').not.toContain('secreto de la cuenta A')
})

test('migración · quien actualiza con las claves antiguas empieza de cero', async ({ page }) => {
  // Estado de una instalación anterior: nombre y correo guardados, id de
  // conversación guardado y una sesión anónima viva.
  await page.goto('./')
  await abrirChat(page)
  await expect(page.getByText('Antes de empezar')).toBeVisible()
  await page.getByLabel('Nombre').fill('Instalación antigua')
  await page.getByLabel('Email').fill('antigua@example.test')
  await page
    .getByRole('button', { name: /Empezar|Continuar|Entrar/i })
    .first()
    .click()
  await escribir(page, 'mensaje de la instalación antigua')
  const viejo = await sesion(page)
  expect(viejo.uid, 'debe haber un uid anónimo de partida').not.toBeNull()

  // Se reponen a mano las dos claves que escribía la versión anterior.
  await page.evaluate(() => {
    localStorage.setItem(
      'bananito:guest',
      JSON.stringify({ nombre: 'Instalación antigua', email: 'antigua@example.test' }),
    )
    localStorage.setItem('bananito:conversation_id', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')
  })

  // Se observa la creación de identidad anónima DE ESTE navegador.
  //
  // Antes esto se medía contando `auth.admin.listUsers()` antes y después. Es
  // inválido: la instancia de Supabase es compartida por toda la suite y otras
  // pruebas crean cuentas mientras ésta corre, así que el contador medía el
  // ruido de las demás —en CI dio +2— y la prueba fallaba sin que este
  // navegador hubiera creado a nadie.
  //
  // `signInAnonymously()` se materializa, en `@supabase/auth-js` 2.111.0, como
  // un `POST` a `/auth/v1/signup` cuyo cuerpo NO lleva `email` ni `phone`
  // —comprobado en la implementación instalada—. Ése es el rasgo que lo
  // distingue de un registro normal, y es lo que se observa aquí. Sólo se
  // observa: no se intercepta ni se bloquea nada.
  const altasAnonimas: string[] = []
  page.on('request', (peticion) => {
    if (peticion.method() !== 'POST') return
    if (!new URL(peticion.url()).pathname.endsWith('/auth/v1/signup')) return
    const cuerpo = peticion.postData() ?? ''
    if (!cuerpo.includes('"email"') && !cuerpo.includes('"phone"')) altasAnonimas.push(peticion.url())
  })

  await page.reload()
  await abrirChat(page)
  await expect(page.getByText('Antes de empezar'), 'las claves antiguas no rehidratan identidad').toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByText('mensaje de la instalación antigua')).toHaveCount(0)

  const residuo = await page.evaluate(() => ({
    guest: localStorage.getItem('bananito:guest'),
    conv: localStorage.getItem('bananito:conversation_id'),
  }))
  expect(residuo.guest, 'la clave heredada se retira').toBeNull()
  expect(residuo.conv, 'y la vestigial también').toBeNull()

  const trasArrancar = await sesion(page)
  expect(trasArrancar.uid, 'el uid anónimo heredado ya no está activo').toBeNull()
  expect(
    altasAnonimas.length,
    `arrancar no puede crear identidad anónima; se observaron ${altasAnonimas.length} altas`,
  ).toBe(0)

  // Y sólo al identificarse aparece una identidad, distinta de la anterior.
  await page.getByLabel('Nombre').fill('Instalación nueva')
  await page.getByLabel('Email').fill('nueva@example.test')
  await page
    .getByRole('button', { name: /Empezar|Continuar|Entrar/i })
    .first()
    .click()
  await escribir(page, 'mensaje de la instalación nueva')

  const nuevo = await sesion(page)
  expect(nuevo.uid, 'y al chatear de nuevo, otro uid').not.toBe(viejo.uid)
  expect(altasAnonimas.length, 'la identidad se crea al identificarse, no al arrancar').toBeGreaterThan(0)
})
