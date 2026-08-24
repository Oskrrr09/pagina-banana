import { expect, test, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// A62-03 + A62-04 — CUENTA HABLA EL IDIOMA DE QUIEN LA MIRA, Y NO MIENTE.
//
// A62-03: la Cuenta WEB estaba escrita en castellano dentro del código. Con el
// navegador en inglés, alemán, francés o italiano seguían viéndose «Mi cuenta»,
// «Cerrar sesión», «Datos personales»… La reauditoría contó 530 líneas con DOS
// llamadas a traducción en `sections.tsx`, y ninguna en `apartados.ts`.
//
// A62-04: la sección de pedidos decía «Pedidos demostrativos hechos con la
// sesión iniciada» y, en vacío, «Todavía no has hecho ningún pedido con la
// sesión iniciada». Desde D-083 eso es FALSO: una compra hecha sin cuenta se
// reconcilia al identificarse, así que la lista puede contener pedidos que
// nadie hizo con la sesión abierta. La interfaz no debe afirmar cómo nació el
// pedido, sólo que está asociado a la cuenta.
//
// POR QUÉ INTEGRACIÓN
//
// `/cuenta` no se monta sin Supabase: sin credenciales enseña su pantalla de
// «esto necesita Supabase». Hace falta sesión de verdad.
//
// D-047 SIGUE INTACTA
//
// La web habla cinco idiomas; la aplicación nativa va siempre en castellano.
// El último bloque lo comprueba: traducir la web no puede traducir la app.
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
  await admin.from('pedidos').delete().in('cliente_id', usuariosCreados)
  await admin.from('clientes').delete().in('id', usuariosCreados)
  await admin.from('visitantes').delete().in('auth_id', usuariosCreados)
  for (const uid of usuariosCreados) await admin.auth.admin.deleteUser(uid)
})

async function cuenta(etiqueta: string) {
  const email = `a62-03-${RUN}-${etiqueta}@example.test`
  const password = `A62-03-${RUN}-segura`
  const { data, error } = await servicio().auth.admin.createUser({ email, password, email_confirm: true })
  expect(error, 'la cuenta de prueba debe crearse').toBeNull()
  usuariosCreados.push(data.user!.id)
  return { email, password, uid: data.user!.id }
}

/**
 * Un pedido ya ASOCIADO a la cuenta, escrito por el servidor.
 *
 * No se reproduce aquí la reconciliación completa de una compra invitada: ese
 * contrato es D-083 y ya lo cubre `compra-invitado-servidor.spec.ts`. Lo que
 * importa para A62-04 es el resultado —una fila de `pedidos` con este
 * `cliente_id`—, que es exactamente lo que deja la reconciliación. Duplicar su
 * infraestructura sólo para pintar una tarjeta haría la suite más lenta sin
 * proteger nada nuevo.
 */
let pedidosCreados = 0

async function pedidoAsociado(uid: string, metodo: 'tarjeta' | 'bizum' | 'financiacion' = 'tarjeta') {
  // EL IDENTIFICADOR TIENE QUE SER ÚNICO POR LLAMADA
  //
  // Con el sello del fichero bastaba mientras sólo hubiera un pedido. Al probar
  // dos idiomas, las dos variantes insertaban la MISMA clave y, corriendo en
  // paralelo, la segunda chocaba con `23505 duplicate key`. Se numera cada
  // pedido para que dos pruebas nunca compitan por la misma fila.
  const numero = ++pedidosCreados
  const { error } = await servicio()
    .from('pedidos')
    .insert({
      id: `BC-A6203${RUN.slice(-5).toUpperCase()}${numero}`,
      cliente_id: uid,
      delivery: 'envio',
      payment_method: metodo,
      products_total: 1229,
      insurance_total: 0,
      lines: [
        { id: 'iphone/17-pro', family: 'iphone', modelSlug: '17-pro', name: 'iPhone 17 Pro', qty: 1, price: 1229 },
      ],
    })
  expect(error, 'el pedido de prueba debe crearse').toBeNull()
}

async function identificarse(page: Page, email: string, password: string) {
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
  await page.goto('./login')
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('form').first().getByRole('button').first().click()
  await expect(page).toHaveURL(/\/cuenta/, { timeout: 20_000 })
}

/** Copy castellano que NO puede verse cuando la web habla otro idioma. */
const CASTELLANO = [
  'Mi cuenta',
  'Cerrar sesión',
  'Datos personales',
  'Dirección de envío',
  'Dirección de facturación',
  'Descuento educativo',
  'Favoritos y tienda',
]

/** Las dos frases que A62-04 retira, en cualquier idioma y estado. */
const OBSOLETO = [
  'Pedidos demostrativos hechos con la sesión iniciada.',
  'Todavía no has hecho ningún pedido con la sesión iniciada.',
]

const IDIOMAS = [
  {
    locale: 'es-ES',
    corto: 'es',
    titulo: 'Mi cuenta',
    salir: 'Cerrar sesión',
    datos: 'Datos personales',
    pedidos: 'Mis pedidos',
    vacio: 'Todavía no tienes ningún pedido.',
    conTarjeta: 'Envío a domicilio · Tarjeta',
    conFinanciacion: 'Envío a domicilio · Financiación',
  },
  {
    locale: 'en-US',
    corto: 'en',
    titulo: 'My account',
    salir: 'Sign out',
    datos: 'Personal details',
    pedidos: 'My orders',
    vacio: 'You have no orders yet.',
    conTarjeta: 'Home delivery · Card',
    conFinanciacion: 'Home delivery · Financing',
  },
  {
    locale: 'de-DE',
    corto: 'de',
    titulo: 'Mein Konto',
    salir: 'Abmelden',
    datos: 'Persönliche Daten',
    pedidos: 'Meine Bestellungen',
    vacio: 'Du hast noch keine Bestellungen.',
  },
  {
    locale: 'fr-FR',
    corto: 'fr',
    titulo: 'Mon compte',
    salir: 'Se déconnecter',
    datos: 'Données personnelles',
    pedidos: 'Mes commandes',
    vacio: 'Tu n’as encore aucune commande.',
  },
  {
    locale: 'it-IT',
    corto: 'it',
    titulo: 'Il mio account',
    salir: 'Esci',
    datos: 'Dati personali',
    pedidos: 'I miei ordini',
    vacio: 'Non hai ancora nessun ordine.',
  },
] as const

for (const idioma of IDIOMAS) {
  test.describe(`Cuenta web en ${idioma.corto}`, () => {
    test.use({ locale: idioma.locale })

    test('la raíz, los datos y los pedidos hablan el idioma activo', async ({ page }) => {
      const a = await cuenta(`web-${idioma.corto}`)
      await identificarse(page, a.email, a.password)

      // --- raíz: título, apartados y salir ---
      await page.goto('./cuenta')
      await expect(page.getByRole('heading', { level: 1, name: idioma.titulo })).toBeVisible()
      await expect(page.getByRole('link', { name: idioma.datos })).toBeVisible()
      await expect(page.getByRole('button', { name: idioma.salir })).toBeVisible()

      // --- datos: su propio título ---
      await page.goto('./cuenta/datos')
      await expect(page.getByRole('heading', { name: idioma.datos })).toBeVisible()

      // --- pedidos: título y estado vacío, que es A62-04 ---
      await page.goto('./cuenta/pedidos')
      await expect(page.getByRole('heading', { name: idioma.pedidos })).toBeVisible()
      await expect(page.getByText(idioma.vacio)).toBeVisible()

      // A62-04: la afirmación falsa no vuelve por ninguna vía.
      for (const frase of OBSOLETO) {
        await expect(page.getByText(frase), `«${frase}» no puede volver`).toHaveCount(0)
      }
    })

    if (idioma.corto !== 'es') {
      test('no se cuela castellano en la interfaz', async ({ page }) => {
        const a = await cuenta(`resid-${idioma.corto}`)
        await identificarse(page, a.email, a.password)

        for (const ruta of ['./cuenta', './cuenta/datos', './cuenta/pedidos']) {
          await page.goto(ruta)
          await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
          for (const literal of CASTELLANO) {
            await expect(
              page.getByText(literal, { exact: true }),
              `«${literal}» en ${ruta} con la web en ${idioma.corto}`,
            ).toHaveCount(0)
          }
        }
      })
    }
  })
}

test.describe('A62-04 · un pedido asociado no se describe por cómo nació', () => {
  for (const corto of ['es', 'en'] as const) {
    const idioma = IDIOMAS.find((i) => i.corto === corto)!
    test.describe(`en ${corto}`, () => {
      test.use({ locale: idioma.locale })

      test('la tarjeta se ve y el copy no habla de sesión iniciada', async ({ page }) => {
        const a = await cuenta(`pedido-${corto}`)
        await pedidoAsociado(a.uid, 'tarjeta')
        await pedidoAsociado(a.uid, 'financiacion')
        await identificarse(page, a.email, a.password)

        await page.goto('./cuenta/pedidos')
        await expect(page.getByText('iPhone 17 Pro').first(), 'el pedido asociado se ve').toBeVisible()
        await expect(page.getByText(idioma.vacio), 'con pedido no hay estado vacío').toHaveCount(0)
        for (const frase of OBSOLETO) {
          await expect(page.getByText(frase)).toHaveCount(0)
        }

        // EL MÉTODO DE PAGO ES UN ENUM INTERNO, NO UN DATO DE LA PERSONA
        //
        // `payment_method` sólo vale 'tarjeta' | 'bizum' | 'financiacion': lo
        // escribe el propio producto, no lo teclea nadie. Pintarlo crudo dejaba
        // «Home delivery · tarjeta» con la web en inglés. Se comprueba la LÍNEA
        // ENTERA —entrega y pago juntos— para que la aserción no pueda pasar por
        // encontrar la palabra suelta en cualquier otro punto de la pantalla.
        await expect(
          page.getByText(idioma.conTarjeta, { exact: true }),
          'la línea combina entrega y pago, los dos traducidos',
        ).toBeVisible()
        await expect(
          page.getByText(idioma.conFinanciacion, { exact: true }),
          'y lo mismo con la financiación',
        ).toBeVisible()
        for (const token of ['tarjeta', 'financiacion']) {
          await expect(
            page.getByText(new RegExp(`·\\s*${token}\\b`)),
            `el token interno «${token}» no llega a la pantalla`,
          ).toHaveCount(0)
        }
      })
    })
  }
})

test.describe('D-047 · la aplicación nativa sigue en castellano', () => {
  test.use({ locale: 'de-DE' })

  test('aunque el navegador vaya en alemán, la app habla español', async ({ page }) => {
    const a = await cuenta('nativa')
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    })
    await identificarse(page, a.email, a.password)

    await page.goto('./cuenta')
    await expect(page.getByText('Mis pedidos').first(), 'la raíz nativa sigue en castellano').toBeVisible()

    await page.goto('./cuenta/pedidos')
    await expect(page.getByRole('heading', { name: 'Mis pedidos' }), 'y sus subpantallas también').toBeVisible()
    await expect(page.getByText('Mein Konto'), 'no se cuela el alemán del navegador').toHaveCount(0)
  })
})
