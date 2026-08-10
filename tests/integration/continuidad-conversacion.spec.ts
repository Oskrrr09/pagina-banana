import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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
// El tiempo lo pone Postgres, no el navegador, y la antigüedad se prepara
// escribiendo datos de prueba: aquí no se espera media hora.
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

/** Coloca la última actividad N minutos atrás. El reloj es el de Postgres. */
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

test('el corte de los treinta minutos es estricto', async () => {
  const email = await cuenta('borde')
  const c1 = await abrir(email)

  await inactivaDesdeHace(c1, 29 + 59 / 60)
  expect(await abrir(email), '29m59s todavía se reanuda').toBe(c1)

  await inactivaDesdeHace(c1, 30 + 1 / 60)
  expect(await abrir(email), '30m01s ya no').not.toBe(c1)
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
  const email = await cuenta('concurrencia')

  // Sin conversación previa: las dos deben acabar en la misma.
  const [a, b] = await Promise.all([abrir(email), abrir(email)])
  expect(b, 'sin conversación previa, dos aperturas a la vez dan una sola').toBe(a)

  // Con una reciente: las dos deben recuperar esa misma.
  const [c, d] = await Promise.all([abrir(email), abrir(email)])
  expect(c, 'con una reciente, ambas la recuperan').toBe(a)
  expect(d).toBe(a)
})
