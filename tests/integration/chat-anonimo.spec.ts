import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Abrir el chat no convierte al visitante en cliente.
//
// Esta prueba monta la aplicación entera —con `CustomerAuthProvider` y el
// widget del chat— contra el Supabase local de verdad, con los inicios de
// sesión anónimos activados. Es el recorrido exacto que fallaba:
//
//   1. El visitante abre el chat.
//   2. `chatSession` crea una sesión anónima con `signInAnonymously()`.
//   3. Supabase le da a esa sesión el rol `authenticated`.
//   4. `CustomerAuthProvider` la tomaba por una sesión de cliente, buscaba su
//      ficha en `clientes`, no la encontraba y **la creaba sola**.
//
// El resultado era que cualquiera que abriese el widget quedaba dado de alta
// como cliente y la tienda le enseñaba «Mi cuenta» sin haberse registrado.
//
// Se comprueban las dos capas, porque cada una puede fallar sin la otra: que
// la interfaz siga tratándolo como visitante, y que en la base no haya
// aparecido ninguna fila.
// ============================================================================

const URL_SUPABASE = process.env.VITE_SUPABASE_URL
const SERVICE = process.env.RLS_TEST_SERVICE_KEY

test('abrir el chat no da de alta al visitante como cliente', async ({ page }) => {
  test.skip(
    !URL_SUPABASE || !SERVICE,
    'Necesita el Supabase local en marcha. Se ejecuta desde npm run test:integration.',
  )

  // Antes se sembraba `bananito:guest` para saltarse el formulario. Esa clave
  // ya no se lee: la identidad del visitante sin cuenta es efímera y cada
  // inicialización vuelve a pedir nombre y correo. Así que ahora se rellena, que
  // es además el recorrido que hace cualquiera. Lo que esta prueba vigila no
  // cambia: abrir el chat NO puede dar de alta a nadie en `clientes`.
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })

  // Antes de abrir el chat no hay ninguna sesión.
  await page.goto('./')
  const sesionInicial = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('sb-') && k.includes('auth-token')),
  )
  expect(sesionInicial, 'no debe haber sesión antes de abrir el chat').toEqual([])

  await page.getByRole('button', { name: 'Abrir chat de Bananito' }).click()
  await expect(page.getByRole('dialog', { name: /Bananito/ })).toBeVisible()

  // Se identifica: hasta que no lo hace no se crea ninguna sesión, para no dar
  // de alta usuarios anónimos por el mero hecho de abrir la aplicación.
  await page.getByLabel('Nombre').fill('Visitante Anónimo')
  await page.getByLabel('Email').fill('anon@example.test')
  await page
    .getByRole('button', { name: /Empezar|Continuar|Entrar/i })
    .first()
    .click()

  // El chat sí abre sesión: es anónima, y es lo que debe pasar.
  await expect
    .poll(
      async () =>
        page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('sb-') && k.includes('auth-token'))),
      { message: 'el chat debe crear una sesión anónima', timeout: 15_000 },
    )
    .not.toEqual([])

  const uid = await page.evaluate(() => {
    const clave = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.includes('auth-token'))
    if (!clave) return null
    const bruto = localStorage.getItem(clave)!
    const json = JSON.parse(bruto.startsWith('base64-') ? atob(bruto.slice(7)) : bruto)
    return { id: json.user?.id ?? null, anonima: json.user?.is_anonymous ?? null }
  })
  expect(uid?.anonima, 'la sesión del chat debe ser anónima').toBe(true)
  expect(uid?.id).toBeTruthy()

  // Capa 1 — la interfaz sigue tratándolo como visitante sin cuenta.
  await page.goto('./cuenta')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toHaveCount(0)

  // Capa 2 — en la base no ha aparecido ninguna ficha. Se consulta con la clave
  // de servicio a propósito: desde la sesión anónima la fila no se vería
  // aunque existiera, así que preguntar con ella no probaría nada.
  const admin = createClient(URL_SUPABASE!, SERVICE!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await admin.from('clientes').select('id').eq('id', uid!.id)
  expect(error).toBeNull()
  expect(data ?? [], 'abrir el chat no debe crear ficha en clientes').toEqual([])

  await admin.from('visitantes').delete().eq('auth_id', uid!.id)
  await admin.auth.admin.deleteUser(uid!.id).catch(() => {})
})
