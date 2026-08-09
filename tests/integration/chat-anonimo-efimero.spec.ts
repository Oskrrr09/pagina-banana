import { expect, test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// La identidad del chat sin cuenta es EFÍMERA.
//
// Antes un visitante era «un navegador»: nombre y correo vivían en
// `localStorage` y la sesión anónima de Supabase persistía con ellos. Medido
// con Supabase real, quien cerraba y volvía a abrir sin cuenta seguía siendo la
// misma persona —mismo `auth.uid`, misma conversación, su historial a la
// vista—.
//
// Y NO BASTABA CON BORRAR LAS CLAVES. Los experimentos de diagnóstico dieron:
//
//   se borra                 ¿pide datos?  ¿mismo uid?  ¿misma conversación?
//   bananito:guest              sí            SÍ              SÍ
//   conversation_id             no            SÍ              SÍ
//   guest + conversation_id     sí            SÍ              no
//   sólo la sesión anónima      no            no              no
//   las tres                    sí            no              no
//
// Es decir: la sesión anónima persistida es quien sostiene la identidad. Por
// eso esta prueba no mira claves, mira **comportamiento y `auth.uid`**.
// ============================================================================

const URL_SUPABASE = process.env.VITE_SUPABASE_URL
const SERVICE = process.env.RLS_TEST_SERVICE_KEY

/** `auth.uid` y conversación actuales, leídos del token real del navegador. */
async function identidad(page: Page) {
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

async function abrirChat(page: Page) {
  await page
    .getByRole('button', { name: /Abrir el chat|Chat/i })
    .first()
    .click()
}

async function identificarse(page: Page, nombre: string, email: string) {
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByLabel('Email').fill(email)
  await page
    .getByRole('button', { name: /Empezar|Continuar|Entrar/i })
    .first()
    .click()
  await expect(page.getByLabel('Escribe un mensaje para Bananito')).toBeVisible({ timeout: 20_000 })
}

async function escribir(page: Page, texto: string) {
  await page.getByLabel('Escribe un mensaje para Bananito').fill(texto)
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  await expect(page.getByText(texto)).toBeVisible({ timeout: 20_000 })
}

test('el invitado no sobrevive a una nueva inicialización', async ({ page }) => {
  test.skip(!URL_SUPABASE || !SERVICE, 'Necesita el Supabase local. Se ejecuta desde npm run test:integration.')
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))

  // ── PRIMERA EJECUCIÓN ──
  await page.goto('./')
  await abrirChat(page)
  await expect(page.getByText('Antes de empezar'), 'la primera vez pide los datos').toBeVisible()
  await identificarse(page, 'Visitante A', 'a@example.test')
  await escribir(page, 'mensaje privado del visitante A')

  const a = await identidad(page)
  expect(a.uid, 'debería haber una sesión').not.toBeNull()
  expect(a.anonima, 'y debería ser anónima').toBe(true)

  // ── NUEVA INICIALIZACIÓN ──
  await page.reload()
  await abrirChat(page)

  await expect(page.getByText('Antes de empezar'), 'DEBE volver a pedir nombre y correo').toBeVisible({
    timeout: 20_000,
  })
  await expect(
    page.getByText('mensaje privado del visitante A'),
    'no puede reaparecer la conversación anterior',
  ).toHaveCount(0)

  // ── SEGUNDO CHAT: identidad nueva de verdad ──
  await identificarse(page, 'Visitante B', 'b@example.test')
  await escribir(page, 'mensaje del visitante B')

  const b = await identidad(page)
  expect(b.anonima, 'la nueva también es anónima').toBe(true)
  expect(b.uid, 'el uid anónimo DEBE ser otro').not.toBe(a.uid)

  // Y la frontera también en el SERVIDOR: la conversación de A sigue existiendo
  // —no se borra histórico— pero pertenece a otro visitante que no es B.
  const admin = createClient(URL_SUPABASE!, SERVICE!, { auth: { persistSession: false } })
  const { data: visitantes } = await admin.from('visitantes').select('id, auth_id')
  const visitanteA = visitantes?.find((v) => v.auth_id === a.uid)
  const visitanteB = visitantes?.find((v) => v.auth_id === b.uid)
  expect(visitanteA, 'la ficha de A sigue en el servidor, no se borra histórico').toBeTruthy()
  expect(visitanteB, 'y B tiene la suya propia').toBeTruthy()
  expect(visitanteB!.id, 'B no puede ser el mismo visitante que A').not.toBe(visitanteA!.id)
})

test('quien abre la aplicación sin usar el chat no crea ninguna identidad', async ({ page }) => {
  test.skip(!URL_SUPABASE || !SERVICE, 'Necesita el Supabase local.')
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))

  // Cada `signInAnonymously()` crea un usuario real en Supabase, así que abrir
  // o recargar la web no puede dar de alta a nadie.
  //
  // Se comprueba sobre ESTE navegador y no contando usuarios en el servidor: la
  // instancia de Supabase es compartida por toda la suite y otras pruebas crean
  // cuentas mientras ésta corre, así que un recuento global mide el ruido de
  // las demás. Lo detectó el CI, donde daba +1 y +3 sin que esta prueba hubiera
  // tocado el chat. Que no exista sesión aquí es la evidencia exacta de que no
  // se ha llamado a `signInAnonymously()`.
  await page.goto('./')
  await page.reload()
  await page.goto('./tiendas')

  const sesion = await identidad(page)
  expect(sesion.uid, 'no debe quedar ninguna sesión: nadie ha usado el chat').toBeNull()

  const claves = await page.evaluate(() => Object.keys(localStorage).filter((k) => /^sb-.*-auth-token$/.test(k)))
  expect(claves, 'ni ninguna credencial guardada').toEqual([])

  // Y abrir el widget sin completar los datos tampoco crea identidad.
  await page.goto('./')
  await abrirChat(page)
  await expect(page.getByText('Antes de empezar')).toBeVisible()
  const trasAbrir = await identidad(page)
  expect(trasAbrir.uid, 'abrir el chat sin identificarse no crea usuario').toBeNull()
})

test('la sesión anónima heredada se descarta al arrancar, antes del formulario', async ({ page }) => {
  test.skip(!URL_SUPABASE || !SERVICE, 'Necesita el Supabase local.')
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))

  // ── Visitante A ──
  await page.goto('./')
  await abrirChat(page)
  await expect(page.getByText('Antes de empezar')).toBeVisible()
  await identificarse(page, 'Visitante A', 'a@example.test')
  await escribir(page, 'mensaje de A antes de reiniciar')
  const a = await identidad(page)
  expect(a.anonima).toBe(true)

  // ── NUEVA INICIALIZACIÓN, y NADA MÁS ──
  //
  // Ni se abre el chat ni se envía el formulario. La frontera exige que el
  // token anónimo heredado deje de estar disponible ya en el arranque: si
  // sobrevive hasta que alguien vuelve a identificarse, durante todo ese rato
  // el navegador sigue teniendo la identidad de A a mano.
  await page.reload()
  await expect(page.locator('header')).toBeVisible()

  await expect
    .poll(async () => (await identidad(page)).uid, {
      message: 'el token anónimo heredado debe descartarse al arrancar, sin esperar al formulario',
      timeout: 15_000,
    })
    .toBeNull()

  // Y descartarlo NO puede significar crear otro: hasta que no se identifique
  // alguien, no debe haber sesión de ningún tipo.
  const claves = await page.evaluate(() => Object.keys(localStorage).filter((k) => /^sb-.*-auth-token$/.test(k)))
  expect(claves, 'no se crea una sesión nueva sólo por arrancar').toEqual([])

  // ── Y al identificarse, identidad nueva ──
  await abrirChat(page)
  await expect(page.getByText('Antes de empezar')).toBeVisible()
  await identificarse(page, 'Visitante B', 'b@example.test')

  // El campo de escribir aparece en cuanto hay datos, antes de que la sesión
  // esté creada: se espera a la condición real, no a un tiempo.
  await expect
    .poll(async () => (await identidad(page)).uid, {
      message: 'al identificarse debe crearse la sesión anónima nueva',
      timeout: 15_000,
    })
    .not.toBeNull()

  const b = await identidad(page)
  expect(b.anonima).toBe(true)
  expect(b.uid, 'y sólo entonces aparece un uid, distinto del de A').not.toBe(a.uid)
})
