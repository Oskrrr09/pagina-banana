import { expect, test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

// ============================================================================
// Cerrar y reabrir una conversación desde el panel, con el cableado REAL.
//
// POR QUÉ ESTA PRUEBA EXISTE, Y POR QUÉ NO BASTABA LA QUE HABÍA
//
// `tests/e2e-agent/agent-panel.spec.ts` cubre `ConversationActions` en
// aislamiento, con un fixture que **sustituye** `changeState` por un
// `setEstado` local. Eso comprueba los botones y los avisos de error, que es
// para lo que está, pero no puede ver el fallo que motivó esta prueba: el
// panel cerraba de verdad —RPC 204 y fila `cerrada` en la base— y aun así
// seguía enseñando la conversación como abierta y sin asignar, con el botón
// «Cerrar» deshabilitado.
//
// El bug vivía en el cableado que el fixture no monta: `useAgentInbox` está
// filtrado por bandeja, así que al cerrar la conversación desaparecía de
// `items`, `selected` pasaba a `undefined` y `ConversationColumn` recibía
// `conversation = null`. Con el respaldo `?? 'abierta'`, eso se pintaba como
// una conversación abierta y libre.
//
// De ahí que aquí se monte el panel entero contra Supabase local: agente real,
// bandeja real, selección real. `service_role` sólo da de alta al agente
// —no hay registro público de agentes— y mira la base desde fuera; **cerrar y
// reabrir los ejecuta el agente desde la interfaz**.
// ============================================================================

const URL_SUPABASE = process.env.VITE_SUPABASE_URL
const SERVICE = process.env.RLS_TEST_SERVICE_KEY
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const CLAVE = 'prueba-agente-1234'

function admin() {
  return createClient(URL_SUPABASE!, SERVICE!, { auth: { persistSession: false } })
}

/** Cuenta de agente real en GoTrue, más su ficha en `agentes`. */
async function crearAgente(sufijo: string) {
  const email = `agente-${sufijo}-${sello()}@example.test`
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password: CLAVE,
    email_confirm: true,
  })
  if (error) throw error
  const uid = data.user!.id
  const { error: errorFicha } = await admin()
    .from('agentes')
    .insert({ id: uid, nombre: `Agente ${sufijo}`, email, rol: 'agente' })
  if (errorFicha) throw errorFicha
  return { email, uid }
}

/**
 * Visitante por el flujo normal: sesión anónima, RPC de apertura y un mensaje.
 *
 * Se hace con la clave pública y las mismas funciones que usa la web, no con
 * inserciones administrativas: una conversación fabricada por `service_role`
 * podría no parecerse a las que produce el producto.
 */
async function visitanteConConversacion(nombre: string) {
  const visitante = createClient(URL_SUPABASE!, ANON!, { auth: { persistSession: false } })
  const { error: errorAnon } = await visitante.auth.signInAnonymously()
  if (errorAnon) throw errorAnon

  const { data: conversacion, error: errorAbrir } = await visitante.rpc('abrir_conversacion', {
    p_nombre: nombre,
    p_email: `${nombre.toLowerCase().replace(/\s+/g, '-')}@example.test`,
    p_telefono: null,
  })
  if (errorAbrir) throw errorAbrir

  const texto = `Mensaje de ${nombre}`
  const { error: errorMensaje } = await visitante.rpc('enviar_mensaje_visitante', {
    p_conversacion_id: conversacion as string,
    p_texto: texto,
  })
  if (errorMensaje) throw errorMensaje

  return { conversacionId: conversacion as string, texto }
}

/** La fila tal y como está en la base, sin pasar por la interfaz. */
async function filaDeConversacion(id: string) {
  const { data, error } = await admin()
    .from('conversaciones')
    .select('estado, agente_id, cerrada_at, valoracion_solicitada')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as {
    estado: string
    agente_id: string | null
    cerrada_at: string | null
    valoracion_solicitada: boolean
  }
}

async function entrarComoAgente(page: Page, email: string) {
  await page.goto('./agente')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page
    .getByRole('button', { name: /Entrar|Iniciar sesión|Acceder/i })
    .first()
    .click()
}

/** La fila de la bandeja, que es un botón dentro de la lista. */
function filaBandeja(page: Page, nombre: string) {
  return page.getByRole('button').filter({ hasText: nombre }).first()
}

/**
 * Identificador único por prueba.
 *
 * `Date.now()` NO vale: con repeticiones en paralelo dos pruebas arrancan en
 * el mismo milisegundo, comparten nombre de visitante y cada una encuentra la
 * conversación de la otra en la bandeja. Medido: la conversación aparecía
 * asignada al agente de la prueba vecina.
 */
const sello = () => `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`

const botonEstado = (page: Page) => page.getByRole('button', { name: /^(Cerrar|Reabrir)$/ })
const cabecera = (page: Page) => page.locator('main header')

/**
 * El mensaje dentro del panel de conversación, no el de la bandeja.
 *
 * La lista repite el último mensaje como vista previa, así que buscarlo en la
 * página entera encuentra dos y no distingue «la conversación está abierta
 * delante del agente» de «aparece en una fila de la lista».
 */
const mensajeEnPanel = (page: Page, texto: string) => page.getByRole('main').getByText(texto)

/**
 * Preparación: el agente se asigna la conversación desde la interfaz.
 *
 * No es lo que esta prueba mide —lo que mide es qué pasa al cerrar—, pero sí
 * su precondición: el producto no deja cerrar una conversación que no es tuya.
 *
 * Se espera a la condición REAL en dos pasos, primero la base y luego la
 * pantalla. La bandeja se refresca por realtime y, con varias pruebas
 * escribiendo a la vez, esa convergencia no es inmediata: medido, con carga en
 * paralelo la cabecera puede tardar más de los cinco segundos que da `expect`
 * por defecto. No es una pausa —si la condición no llega, falla—, es esperar a
 * que el panel tenga el dato antes de pedirle que actúe sobre él.
 */
async function asignarse(page: Page, nombre: string, conversacionId: string, agenteUid: string) {
  // Primero, que el panel esté enseñando LA conversación de esta prueba.
  //
  // El panel autoselecciona la conversación abierta más reciente al entrar, y
  // la base es compartida: sin esta comprobación, con varias pruebas a la vez
  // el clic podía caer sobre la conversación de otra —medido: aparecía
  // asignada al agente de la prueba vecina—. No es sincronización de más: es
  // asegurarse de que actuamos sobre lo que creemos.
  // Sin distinguir mayúsculas: la bandeja no enseña el nombre tal cual, lo
  // pasa por `visitorDisplayName`, que capitaliza cada palabra.
  await expect(cabecera(page), 'el panel debe estar en la conversación de esta prueba').toContainText(
    new RegExp(nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    { timeout: 20_000 },
  )

  await page.getByRole('button', { name: 'Asignarme' }).click({ timeout: 20_000 })

  await expect
    .poll(async () => (await filaDeConversacion(conversacionId)).agente_id, {
      message: 'el RPC de asignación debe dejar la conversación a nombre del agente',
      timeout: 20_000,
    })
    .toBe(agenteUid)

  await expect(cabecera(page), 'y el panel debe haberse enterado antes de seguir').toContainText('Asignada a ti', {
    timeout: 20_000,
  })
}

test.beforeEach(() => {
  test.skip(!URL_SUPABASE || !SERVICE || !ANON, 'Faltan credenciales de Supabase local para esta prueba.')
})

test('cerrar una conversación la enseña archivada, sin salir de ella', async ({ page }) => {
  const nombre = `Cierre ${sello()}`
  const { conversacionId, texto } = await visitanteConConversacion(nombre)
  const agente = await crearAgente('cierre')

  await entrarComoAgente(page, agente.email)

  const fila = filaBandeja(page, nombre)
  await expect(fila, 'la conversación debe aparecer en la bandeja de abiertas').toBeVisible({ timeout: 30_000 })
  await fila.click()
  await expect(mensajeEnPanel(page, texto), 'la conversación seleccionada debe traer su mensaje').toBeVisible()

  await asignarse(page, nombre, conversacionId, agente.uid)

  const antes = await filaDeConversacion(conversacionId)
  expect(antes.estado, 'precondición: la conversación empieza abierta').toBe('abierta')
  expect(antes.agente_id, 'precondición: queda asignada al agente').toBe(agente.uid)

  await page.getByRole('button', { name: 'Cerrar' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Cerrar conversación' })
  await expect(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: /Cerrar y pedir valoración/ }).click()
  await expect(dialogo).toHaveCount(0)

  // 1 · El servidor. Se lee de la base, no de la pantalla.
  await expect
    .poll(async () => (await filaDeConversacion(conversacionId)).estado, {
      message: 'el RPC de cierre debe dejar la conversación cerrada en la base',
      timeout: 15_000,
    })
    .toBe('cerrada')
  const cerrada = await filaDeConversacion(conversacionId)
  expect(cerrada.cerrada_at, 'el cierre debe fechar `cerrada_at`').not.toBeNull()
  expect(cerrada.agente_id, 'cerrar no puede perder quién atendió').toBe(agente.uid)
  expect(cerrada.valoracion_solicitada, 'se pidió valoración en el diálogo').toBe(true)

  // 2 · La pantalla, SIN recargar. Esto es lo que fallaba.
  await expect(botonEstado(page), 'tras cerrar, la acción disponible es reabrir').toHaveText('Reabrir', {
    timeout: 15_000,
  })
  await expect(botonEstado(page), 'y tiene que poder pulsarse: la conversación sigue siendo suya').toBeEnabled()
  await expect(cabecera(page), 'la cabecera debe reflejar el estado real').toContainText('Archivada')
  await expect(cabecera(page), 'y no puede olvidar la asignación').toContainText('Asignada a ti')
  await expect(
    page.getByRole('button', { name: 'Cerrar', exact: true }),
    'no puede seguir ofreciendo «Cerrar» algo que ya está cerrado',
  ).toHaveCount(0)

  // 3 · La conversación sigue seleccionada, ahora en la otra bandeja.
  await expect(mensajeEnPanel(page, texto), 'no se expulsa al agente de la conversación').toBeVisible()
  await expect(
    page.getByRole('tab', { name: /Archivad/i }),
    'la bandeja de archivadas pasa a ser la activa',
  ).toHaveAttribute('aria-selected', 'true')
  await expect(filaBandeja(page, nombre), 'y la conversación se ve en ella').toBeVisible()

  // 4 · Y no se puede responder a una conversación archivada.
  await expect(
    page.getByRole('textbox', { name: 'Responder al visitante' }),
    'una conversación archivada no ofrece caja de respuesta',
  ).toHaveCount(0)
  await expect(page.getByText(/Conversación archivada/)).toBeVisible()
  await expect(page.getByText(/Valoración pedida al cliente/)).toBeVisible()
})

test('reabrir devuelve la conversación a abiertas conservando la selección', async ({ page }) => {
  const nombre = `Reapertura ${sello()}`
  const { conversacionId, texto } = await visitanteConConversacion(nombre)
  const agente = await crearAgente('reapertura')

  await entrarComoAgente(page, agente.email)
  const fila = filaBandeja(page, nombre)
  await expect(fila).toBeVisible({ timeout: 30_000 })
  await fila.click()
  await asignarse(page, nombre, conversacionId, agente.uid)

  await page.getByRole('button', { name: 'Cerrar' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Cerrar conversación' })
  await expect(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: /Cerrar y pedir valoración/ }).click()
  await expect(botonEstado(page)).toHaveText('Reabrir', { timeout: 15_000 })

  await botonEstado(page).click()

  // El servidor: `reabrir_conversacion` vuelve a `abierta`, limpia la fecha de
  // cierre y NO toca `agente_id` — leído de la implementación, no supuesto.
  await expect
    .poll(async () => (await filaDeConversacion(conversacionId)).estado, {
      message: 'reabrir debe devolver la conversación a abierta',
      timeout: 15_000,
    })
    .toBe('abierta')
  const reabierta = await filaDeConversacion(conversacionId)
  expect(reabierta.cerrada_at, 'reabrir limpia `cerrada_at`').toBeNull()
  expect(reabierta.agente_id, 'reabrir conserva quién atendió').toBe(agente.uid)

  // La pantalla, otra vez sin recargar.
  await expect(botonEstado(page), 'vuelve a ofrecerse cerrar').toHaveText('Cerrar', { timeout: 15_000 })
  await expect(cabecera(page), 'y deja de estar archivada').not.toContainText('Archivada')
  await expect(cabecera(page)).toContainText('Asignada a ti')
  await expect(mensajeEnPanel(page, texto), 'la conversación sigue seleccionada').toBeVisible()
  await expect(
    page.getByRole('tab', { name: /Abiert/i }),
    'la bandeja activa vuelve a ser la de abiertas',
  ).toHaveAttribute('aria-selected', 'true')
  await expect(
    page.getByRole('textbox', { name: 'Responder al visitante' }),
    'y se puede volver a responder',
  ).toBeEnabled()
})

test('una conversación asignada a otro agente no ofrece el cierre', async ({ page }) => {
  // OJO CON LO QUE PRUEBA ESTO, Y CON LO QUE NO.
  //
  // Aquí NO se llama al servidor: el botón está deshabilitado, así que no hay
  // clic, no hay `cerrar_conversacion` y no hay nada que rechazar. Lo que se
  // demuestra es la barrera PREVIA de la interfaz: un agente que no la lleva
  // no puede ni empezar la operación, y nada se mueve de sitio.
  //
  // Que un cierre YA EMITIDO y rechazado por el servidor tampoco cambie de
  // bandeja es otra propiedad distinta, y la prueba la siguiente.
  const nombre = `Sin permiso ${sello()}`
  const { conversacionId } = await visitanteConConversacion(nombre)
  const supervisor = await crearAgente('sinpermiso')
  // Se le asigna a OTRO agente, así que éste no puede cerrarla.
  const otro = await crearAgente('duenno')
  const { error } = await admin().from('conversaciones').update({ agente_id: otro.uid }).eq('id', conversacionId)
  if (error) throw error

  await entrarComoAgente(page, supervisor.email)
  const fila = filaBandeja(page, nombre)
  await expect(fila).toBeVisible({ timeout: 30_000 })
  await fila.click()

  await expect(cabecera(page)).toContainText('Asignada a otro agente')
  await expect(
    page.getByRole('button', { name: 'Cerrar', exact: true }),
    'un agente que no la lleva no puede cerrarla',
  ).toBeDisabled()

  // Y la conversación sigue donde estaba: abierta, en la bandeja de abiertas.
  expect((await filaDeConversacion(conversacionId)).estado).toBe('abierta')
  await expect(page.getByRole('tab', { name: /Abiert/i })).toHaveAttribute('aria-selected', 'true')
})

test('un cierre que el servidor rechaza no mueve de bandeja', async ({ page }) => {
  // LA FRONTERA DE `onSuccess`.
  //
  // El salto a Archivadas sólo puede ocurrir si `changeState` vuelve SIN
  // error. Para demostrarlo hace falta un rechazo de verdad, no un 403
  // inventado: la petición la emite el agente con su sesión real y la responde
  // el servidor real.
  //
  // El truco para que sea determinista, y no una carrera con realtime: se
  // retiene la petición ya emitida y, justo entonces, se le quita la
  // conversación a A. Cuando la petición sigue su camino, el servidor la
  // rechaza porque A ya no es quien la lleva. La interfaz había decidido
  // cerrar cuando aún podía, que es exactamente el caso que interesa.
  const nombre = `Rechazo ${sello()}`
  const { conversacionId } = await visitanteConConversacion(nombre)
  const agenteA = await crearAgente('rechazo-a')
  const agenteB = await crearAgente('rechazo-b')

  await entrarComoAgente(page, agenteA.email)
  const fila = filaBandeja(page, nombre)
  await expect(fila).toBeVisible({ timeout: 30_000 })
  await fila.click()
  await asignarse(page, nombre, conversacionId, agenteA.uid)

  const cerrar = page.getByRole('button', { name: 'Cerrar', exact: true })
  await expect(cerrar, 'hasta aquí la interfaz cree —con razón— que puede cerrarla').toBeEnabled()

  const respuestas: { status: number; cuerpo: string }[] = []
  let peticiones = 0

  await page.route('**/rest/v1/rpc/cerrar_conversacion*', async (route) => {
    peticiones++
    // La petición ya está emitida, con el token real de A. Ahora se le retira
    // la conversación, usando admin sólo como actor externo del experimento.
    const { error } = await admin().from('conversaciones').update({ agente_id: agenteB.uid }).eq('id', conversacionId)
    if (error) throw error

    // Y se envía TAL CUAL al Supabase real: sin tocar cabeceras, sin fabricar
    // cuerpo. Lo que conteste el servidor es lo que verá el navegador.
    const response = await route.fetch()
    respuestas.push({ status: response.status(), cuerpo: (await response.text()).slice(0, 300) })
    await route.fulfill({ response })
  })

  await cerrar.click()
  const dialogo = page.getByRole('dialog', { name: 'Cerrar conversación' })
  await expect(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: /Cerrar y pedir valoración/ }).click()

  await expect
    .poll(() => respuestas.length, { message: 'el servidor tiene que haber contestado al cierre', timeout: 20_000 })
    .toBe(1)

  expect(peticiones, 'una sola petición de cierre, ni reintentos ni duplicados').toBe(1)
  const [respuesta] = respuestas
  // El contrato observado: `cerrar_conversacion` levanta `42501` y PostgREST
  // lo traduce a 403. Se fija el valor concreto —no un «cualquier cosa mayor
  // que 400»— para que un 500 o un 404 por otra causa no se cuelen como si
  // fueran este rechazo.
  expect(respuesta.status, `el servidor debe rechazar el cierre; contestó ${respuesta.cuerpo}`).toBe(403)
  expect(respuesta.cuerpo, 'y con el motivo del propio RPC').toContain('No se puede cerrar')

  // La base: el cierre no ha ocurrido. La reasignación sí, que la hizo el test.
  const fila1 = await filaDeConversacion(conversacionId)
  expect(fila1.estado, 'un cierre rechazado no cierra nada').toBe('abierta')
  expect(fila1.cerrada_at, 'ni fecha el cierre').toBeNull()
  expect(fila1.agente_id, 'y la conversación es ya de B, que es lo que provocó el rechazo').toBe(agenteB.uid)

  // La pantalla: NO se ha saltado a Archivadas. `onSuccess` no puede correr
  // cuando `changeState` devuelve error.
  await expect(
    page.getByRole('tab', { name: /Abiert/i }),
    'la bandeja no puede moverse por un cierre que el servidor rechazó',
  ).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: /Archivad/i })).toHaveAttribute('aria-selected', 'false')

  // Y el producto cuenta lo que ha pasado, en vez de tragárselo.
  await expect(dialogo, 'el diálogo se queda para que se pueda reintentar').toBeVisible()
  await expect(dialogo.getByRole('alert'), 'con el error real del servidor').toBeVisible()

  await page.unroute('**/rest/v1/rpc/cerrar_conversacion*')
})

test('las operaciones propias funcionan aunque no llegue ni un evento de realtime', async ({ page }) => {
  // LA PROPIEDAD QUE ESTA PRUEBA FIJA
  //
  // Medido con Supabase local y varios paneles a la vez: hay páginas que
  // llegan a `SUBSCRIBED`, conservan el WebSocket abierto, no dan
  // `CHANNEL_ERROR` ni `TIMED_OUT`… y no reciben ni un `postgres_changes` en
  // veinte segundos. En los fallos, 0 de 5 recibieron evento; en los aciertos,
  // 25 de 25. Mientras eso pasa la base está correcta y el panel miente.
  //
  // Así que lo que el agente acaba de hacer no puede depender de su propio eco.
  // Aquí se corta el realtime de raíz —el WebSocket se intercepta y nunca se
  // conecta al servidor— y se exige que asignarse, cerrar y reabrir sigan
  // funcionando por RPC y relectura. HTTP y PostgREST siguen intactos.
  await page.routeWebSocket(/realtime/, () => {
    // Sin `connectToServer`: el canal queda mudo a propósito.
  })

  const nombre = `Sin realtime ${sello()}`
  const { conversacionId } = await visitanteConConversacion(nombre)
  const agente = await crearAgente('sin-realtime')

  await entrarComoAgente(page, agente.email)
  const fila = filaBandeja(page, nombre)
  await expect(fila, 'la carga inicial es REST, así que la bandeja debe llegar igual').toBeVisible({ timeout: 30_000 })
  await fila.click()
  await asignarse(page, nombre, conversacionId, agente.uid)

  // Cerrar.
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  const dialogo = page.getByRole('dialog', { name: 'Cerrar conversación' })
  await expect(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: /Cerrar y pedir valoración/ }).click()

  await expect(botonEstado(page), 'sin realtime, cerrar debe reflejarse igual').toHaveText('Reabrir', {
    timeout: 20_000,
  })
  await expect(cabecera(page)).toContainText('Archivada')
  expect((await filaDeConversacion(conversacionId)).estado).toBe('cerrada')

  // Y reabrir.
  await botonEstado(page).click()
  await expect(botonEstado(page), 'y reabrir también').toHaveText('Cerrar', { timeout: 20_000 })
  await expect(cabecera(page)).not.toContainText('Archivada')
  const reabierta = await filaDeConversacion(conversacionId)
  expect(reabierta.estado).toBe('abierta')
  expect(reabierta.agente_id, 'reabrir conserva quién atendió').toBe(agente.uid)
})
