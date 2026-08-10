import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// ============================================================================
// Continuidad temporal de la conversación de una cuenta.
//
// Ni un extremo ni el otro. `abrir_conversacion()` reutilizaba CUALQUIER
// conversación abierta del visitante sin mirar la fecha —medido antes del
// cambio: una con 45 minutos de inactividad se devolvía igual—, así que una
// cuenta arrastraba la misma para siempre. Y crear una nueva en cada arranque
// rompería el caso real de una caída de conexión o de iOS terminando la app,
// donde quien vuelve a los dos minutos espera seguir donde estaba.
//
// La regla: una conversación ABIERTA se reanuda mientras siga siendo reciente,
// con un corte ESTRICTO a los treinta minutos de inactividad.
//
// La actividad la marca `ultimo_mensaje_at`, que mantiene el disparador
// `trg_touch_conversation` al insertar en `mensajes`: se mueve con un mensaje
// del visitante y también con uno del agente, y no con una asignación.
//
// El corte productivo lo evalúa Postgres con su propio `now()`. La ANTIGÜEDAD
// de los datos, en cambio, se prepara desde Node, así que los casos funcionales
// usan márgenes amplios —5 y 45 minutos— y no un borde de un segundo: con esa
// holgura, un pequeño desfase de reloj entre Node y la base no puede cambiar el
// resultado. Aquí no se espera media hora.
// ============================================================================

const URL_SUPABASE = process.env.VITE_SUPABASE_URL
const SERVICE = process.env.RLS_TEST_SERVICE_KEY
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const CLAVE = 'continuidad-1234'

const admin = () => createClient(URL_SUPABASE!, SERVICE!, { auth: { persistSession: false } })

async function cuenta(etiqueta: string) {
  const email = `${etiqueta}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`
  const { error } = await admin().auth.admin.createUser({ email, password: CLAVE, email_confirm: true })
  if (error) throw error
  return email
}

/** Una sesión nueva de esa cuenta: es lo que ocurre en cada inicialización. */
async function sesion(email: string): Promise<SupabaseClient> {
  const c = createClient(URL_SUPABASE!, ANON!, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email, password: CLAVE })
  if (error) throw error
  return c
}

async function abrir(email: string): Promise<string> {
  const c = await sesion(email)
  const { data, error } = await c.rpc('abrir_conversacion', { p_nombre: 'Cuenta de prueba', p_email: email })
  if (error) throw error
  return data as string
}

/**
 * Coloca la última actividad N minutos atrás.
 *
 * El instante lo calcula Node, no Postgres. Por eso los casos funcionales van
 * con márgenes amplios: una diferencia de reloj de unos segundos entre el
 * proceso de pruebas y la base es irrelevante frente a 5 ó 45 minutos, pero
 * volvería frágil un borde de 29m59s contra 30m01s.
 */
async function inactivaDesdeHace(id: string, minutos: number) {
  const { error } = await admin()
    .from('conversaciones')
    .update({ ultimo_mensaje_at: new Date(Date.now() - minutos * 60_000).toISOString() })
    .eq('id', id)
  if (error) throw error
}

test.beforeEach(() => {
  test.skip(
    !URL_SUPABASE || !SERVICE || !ANON,
    'Necesita el Supabase local. Se ejecuta desde npm run test:integration.',
  )
})

test('una conversación reciente se reanuda', async () => {
  const email = await cuenta('reciente')
  const c1 = await abrir(email)
  await inactivaDesdeHace(c1, 5)
  expect(await abrir(email), 'con 5 minutos de inactividad debe reanudarse').toBe(c1)
})

test('una conversación inactiva más de media hora no se reanuda', async () => {
  const email = await cuenta('antigua')
  const c1 = await abrir(email)
  await inactivaDesdeHace(c1, 45)

  const c2 = await abrir(email)
  expect(c2, 'con 45 minutos de inactividad debe abrirse otra').not.toBe(c1)

  // Y la anterior sigue en el servidor: esto no cierra ni borra histórico.
  const { data: vieja } = await admin().from('conversaciones').select('id, estado').eq('id', c1).maybeSingle()
  expect(vieja, 'la conversación anterior se conserva').toBeTruthy()
  expect(vieja!.estado, 'y sigue abierta: dejar de ser reanudable no es cerrarla').toBe('abierta')
})

test('el corte de los treinta minutos es estricto', () => {
  // OPCIÓN B de las dos que había: comprobación estática sobre el SQL de la
  // migración, acompañada de los casos funcionales de 5 y 45 minutos.
  //
  // La A —ejecutar SQL contra el Postgres desplegado— exigiría exponer la
  // definición de la función a través de PostgREST, es decir, añadir un RPC de
  // producción cuyo único cliente serían las pruebas. No compensa.
  //
  // Lo que se fija aquí es el OPERADOR: con `>=` los treinta minutos exactos se
  // reanudarían, y el contrato dice que ya están fuera. El comportamiento a
  // ambos lados lo cubren las pruebas funcionales; esto cubre el borde exacto,
  // que con timestamps generados desde Node sería frágil de medir.
  const sql = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260810000500_continuidad_temporal_conversacion.sql'),
    'utf8',
  )
  expect(
    sql.replace(/\s+/g, ' '),
    'el corte debe ser ESTRICTO: con `>=` los treinta minutos exactos se reanudarían',
  ).toContain("ultimo_mensaje_at > now() - interval '30 minutes'")
  expect(sql, 'y no puede colarse un `>=`').not.toContain('ultimo_mensaje_at >= now()')
})

test('una conversación cerrada no se reanuda aunque sea reciente', async () => {
  const email = await cuenta('cerrada')
  const c1 = await abrir(email)
  await admin()
    .from('conversaciones')
    .update({ estado: 'cerrada', ultimo_mensaje_at: new Date().toISOString() })
    .eq('id', c1)

  expect(await abrir(email), 'el cierre manda sobre el tiempo').not.toBe(c1)
})

test('un mensaje del agente también refresca la ventana', async () => {
  const email = await cuenta('agente')
  const c1 = await abrir(email)
  await inactivaDesdeHace(c1, 45)

  // El disparador no mira el autor: un mensaje del agente cuenta como
  // actividad igual que uno del visitante.
  const { data: fila } = await admin().from('conversaciones').select('visitor_id').eq('id', c1).maybeSingle()
  const { error } = await admin()
    .from('mensajes')
    .insert({ conversacion_id: c1, autor: 'agent', texto: 'respuesta del agente' })
  expect(error, 'el mensaje del agente debe entrar').toBeNull()
  expect(fila, 'la conversación existe').toBeTruthy()

  expect(await abrir(email), 'tras responder el agente, vuelve a ser reanudable').toBe(c1)
})

test('la conversación nueva no hereda la asignación de la anterior', async () => {
  const email = await cuenta('asignacion')
  const c1 = await abrir(email)
  await inactivaDesdeHace(c1, 45)

  const c2 = await abrir(email)
  expect(c2).not.toBe(c1)

  const { data } = await admin().from('conversaciones').select('agente_id').eq('id', c2).maybeSingle()
  expect(data!.agente_id, 'una conversación nueva nace sin agente').toBeNull()
})

test('dos aperturas simultáneas no crean dos conversaciones', async () => {
  // El arnés importa tanto como el contrato. Antes esto hacía dos
  // `signInWithPassword` concurrentes, y eso mezclaba dos cosas: la emisión del
  // JWT y el RPC. Uno de los dos tokens llegaba a ser rechazado por el
  // validador —«JWT issued at future»— y la prueba fallaba sin que
  // `abrir_conversacion` llegara a ejecutarse dos veces.
  //
  // Ahora: UNA autenticación, UN token, y dos peticiones concurrentes con ese
  // mismo token. Así lo único que se mide es la concurrencia del RPC.
  const email = await cuenta('concurrencia')
  const c = await sesion(email)
  const { data: s } = await c.auth.getSession()
  const token = s.session!.access_token

  const llamar = () =>
    fetch(`${URL_SUPABASE}/rest/v1/rpc/abrir_conversacion`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: ANON!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_nombre: 'Concurrencia', p_email: email }),
    }).then(async (r) => ({ estado: r.status, cuerpo: await r.text() }))

  // PRIMERA APERTURA · no hay visitante todavía. Es donde estaba la carrera:
  // dos INSERT simultáneos y uno se estrellaba contra `visitantes_auth_id_key`
  // con `23505`, devolviendo HTTP 409 a quien perdía.
  const [a, b] = await Promise.all([llamar(), llamar()])
  expect(a.estado, `la primera llamada debe funcionar: ${a.cuerpo.slice(0, 120)}`).toBe(200)
  expect(b.estado, `y la segunda también: ${b.cuerpo.slice(0, 120)}`).toBe(200)
  expect(b.cuerpo, 'las dos deben acabar en la misma conversación').toBe(a.cuerpo)

  const { data: uid } = await c.auth.getUser()
  const { data: visitantes } = await admin().from('visitantes').select('id').eq('auth_id', uid.user!.id)
  expect(visitantes!.length, 'exactamente un visitante').toBe(1)
  const { data: convs } = await admin().from('conversaciones').select('id').eq('visitor_id', visitantes![0].id)
  expect(convs!.length, 'y exactamente una conversación').toBe(1)

  // VISITANTE EXISTENTE + C1 RECIENTE · las dos deben recuperarla.
  const [c1, c2] = await Promise.all([llamar(), llamar()])
  expect(c1.cuerpo).toBe(a.cuerpo)
  expect(c2.cuerpo).toBe(a.cuerpo)

  // VISITANTE EXISTENTE + C1 CADUCADA · las dos deben coincidir en la nueva, y
  // la anterior sigue existiendo: el total pasa a ser dos, no una.
  await inactivaDesdeHace(JSON.parse(a.cuerpo) as string, 45)
  const [d1, d2] = await Promise.all([llamar(), llamar()])
  expect(d1.estado).toBe(200)
  expect(d2.estado).toBe(200)
  expect(d2.cuerpo, 'ambas en la misma conversación nueva').toBe(d1.cuerpo)
  expect(d1.cuerpo, 'que no es la caducada').not.toBe(a.cuerpo)

  const { data: finales } = await admin().from('conversaciones').select('id').eq('visitor_id', visitantes![0].id)
  expect(finales!.length, 'la caducada se conserva: C1 + C2').toBe(2)
})
