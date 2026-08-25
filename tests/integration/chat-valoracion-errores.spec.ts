import { expect, test, type Page, type Route } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// AUD-001 — LA VALORACIÓN TAMPOCO CUENTA LO QUE FALLA POR DENTRO.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// `enviarValoracion` devolvía `error.message` del RPC `enviar_valoracion` y
// `ClosedFooter` lo metía en su estado con `setError(err)`, así que el mensaje
// de PostgREST acababa en un `role="alert"` dentro de la burbuja del chat.
//
// Se exige que:
//
//   1. el mensaje técnico NO aparece en pantalla;
//   2. aparece un mensaje genérico y traducido;
//   3. el formulario sigue utilizable —se puede reintentar—;
//   4. la valoración NO se da por enviada.
//
// POR QUÉ UN FICHERO PROPIO Y NO UNA PRUEBA MÁS EN panel-agentes-cierre
//
// Aquélla monta el panel del AGENTE para observar qué pasa al cerrar. Aquí lo
// que se mira es la burbuja del VISITANTE cuando el envío falla. Comparten el
// estado de partida —conversación cerrada pidiendo valoración—, no el sujeto.
//
// POR QUÉ EL CIERRE SE HACE CONTRA LA BASE Y NO DESDE EL PANEL
//
// Levantar además el panel del agente y hacerle cerrar por la interfaz añade
// una superficie entera que esta prueba no mide, y con ella sus esperas. El
// estado de partida se fija con la clave de servicio; lo que se ejercita de
// verdad —el formulario, el envío y el error— pasa íntegro por el producto.
//
// POR QUÉ NO SE RECARGA LA PÁGINA
//
// Una conversación cerrada no se reanuda aunque sea reciente (ver
// `continuidad-conversacion.spec.ts`): recargar abriría otra conversación y se
// perdería el estado que se quiere probar. Se espera al canal de tiempo real,
// que es como se entera el visitante en producción.
// ============================================================================

const URL_SUPABASE = process.env.VITE_SUPABASE_URL
const SERVICE = process.env.RLS_TEST_SERVICE_KEY
const configurado = Boolean(URL_SUPABASE && SERVICE)

test.skip(
  !configurado,
  'Necesita el Supabase local del orquestador: npm run test:integration lo levanta y pasa las claves.',
)

function admin(): SupabaseClient {
  return createClient(URL_SUPABASE!, SERVICE!, { auth: { persistSession: false, autoRefreshToken: false } })
}

const RUN = `${Date.now()}-${Math.random().toString(16).slice(2)}`

/**
 * Un mensaje inconfundiblemente técnico. Si algo así llega al DOM es que se
 * está pintando el error de dentro.
 */
const TECNICO = 'permission denied for function enviar_valoracion'

/** El genérico público de la valoración. */
const GENERICO = 'No se ha podido enviar la valoración. Inténtalo de nuevo.'

/** Abre el chat y se identifica, que es el recorrido de cualquier visitante. */
async function abrirChatComoVisitante(page: Page, email: string) {
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
  await page.goto('./')
  await page.getByRole('button', { name: 'Abrir chat de Bananito' }).click()
  await expect(page.getByRole('dialog', { name: /Bananito/ })).toBeVisible()
  await page.getByLabel('Nombre').fill('Visitante AUD-001')
  await page.getByLabel('Email').fill(email)
  await page
    .getByRole('button', { name: /Empezar|Continuar|Entrar/i })
    .first()
    .click()
}

/** La conversación que acaba de abrir ese visitante, vista desde fuera. */
async function conversacionDe(email: string): Promise<string> {
  let id: string | null = null
  await expect
    .poll(
      async () => {
        const { data: visitante } = await admin().from('visitantes').select('id').eq('email', email).maybeSingle()
        if (!visitante) return null
        const { data: conversacion } = await admin()
          .from('conversaciones')
          .select('id')
          .eq('visitor_id', visitante.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        id = (conversacion?.id as string | undefined) ?? null
        return id
      },
      { message: 'el visitante debe haber abierto una conversación', timeout: 20_000 },
    )
    .not.toBeNull()
  return id!
}

/**
 * Cierra pidiendo valoración y espera a que la burbuja lo refleje.
 *
 * El `update` se repite a propósito. El visitante se entera por el canal de
 * tiempo real `conversacion:<id>`, y hay una carrera real: si el cierre ocurre
 * antes de que ese canal llegue a `SUBSCRIBED`, el evento se pierde y no
 * vuelve —una conversación cerrada tampoco se reanuda al recargar, así que no
 * hay segunda oportunidad—. Medido en local, el evento llega en medio segundo
 * cuando el canal ya está escuchando.
 *
 * Reintentar un `update` idempotente hasta que la pantalla lo acuse es
 * determinista y no esconde nada: lo que se está midiendo no es la latencia
 * del realtime, sino qué hace el formulario cuando el envío falla.
 */
async function cerrarPidiendoValoracion(page: Page, conversacionId: string) {
  const estrellas = page.getByRole('radio', { name: '5 estrellas' })
  await expect
    .poll(
      async () => {
        const { error } = await admin()
          .from('conversaciones')
          .update({ estado: 'cerrada', cerrada_at: new Date().toISOString(), valoracion_solicitada: true })
          .eq('id', conversacionId)
        expect(error, 'el cierre de preparación debe aplicarse').toBeNull()
        return estrellas.count()
      },
      { message: 'la conversación cerrada debe pedir valoración en la burbuja', timeout: 30_000, intervals: [500] },
    )
    .toBeGreaterThan(0)
  return estrellas
}

/** Rompe el envío de la valoración, y sólo ése. */
async function romperEnvioDeValoracion(page: Page) {
  await page.route('**/rest/v1/rpc/enviar_valoracion*', (route: Route) =>
    route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: '42501', message: TECNICO, hint: null, details: null }),
    }),
  )
}

const alerta = (page: Page) => page.getByRole('alert').first()
const botonEnviar = (page: Page) => page.getByRole('button', { name: /Enviar valoración|Enviando/ })

test('un fallo al enviar la valoración no enseña el mensaje del servidor', async ({ page }) => {
  const email = `aud-001-rating-${RUN}@example.test`

  await abrirChatComoVisitante(page, email)
  const conversacionId = await conversacionDe(email)

  // El visitante se entera por tiempo real, sin recargar.
  const estrellas = await cerrarPidiendoValoracion(page, conversacionId)
  await expect(estrellas, 'la conversación cerrada pide valoración').toBeVisible()

  await romperEnvioDeValoracion(page)
  await estrellas.click()
  await botonEnviar(page).click()

  await expect(alerta(page), 'algo se dice').toBeVisible()
  await expect(page.getByText(TECNICO), 'el mensaje del servidor no llega a la pantalla').toHaveCount(0)
  await expect(page.locator('body'), 'ni el código del error').not.toContainText('42501')
  await expect(page.locator('body'), 'ni el nombre de la función').not.toContainText('enviar_valoracion')
  await expect(alerta(page), 'se ofrece un mensaje genérico y accionable').toHaveText(GENERICO)

  // Se puede reintentar: el formulario sigue ahí y no se ha dado por enviada.
  await expect(botonEnviar(page), 'el botón vuelve de «Enviando…»').toBeEnabled()
  await expect(estrellas, 'la puntuación elegida no se pierde').toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText('¡Gracias por tu valoración!'), 'un fallo no puede dar las gracias').toHaveCount(0)

  // Y en la base tampoco consta.
  const { data } = await admin()
    .from('conversaciones')
    .select('valoracion_estrellas')
    .eq('id', conversacionId)
    .maybeSingle()
  expect(data?.valoracion_estrellas, 'la valoración no se guardó').toBeNull()
})
