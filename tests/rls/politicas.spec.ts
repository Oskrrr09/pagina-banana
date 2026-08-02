import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Pruebas de las políticas RLS del chat y de las cuentas.
//
// POR QUÉ ESTÁN SEPARADAS DE LA SUITE E2E
//
// Estas pruebas necesitan una base de datos real: RLS es una característica
// de Postgres y no se puede comprobar con mocks. Un mock diría que la política
// funciona porque yo lo he programado así, que es exactamente la afirmación
// que se quiere verificar.
//
// QUÉ HACE FALTA PARA EJECUTARLAS
//
// Un proyecto de Supabase **exclusivo para pruebas**, nunca el de la
// demostración, con el esquema y las migraciones aplicadas y los inicios de
// sesión anónimos activados. Se configuran tres variables:
//
//     RLS_TEST_URL              URL del proyecto de pruebas
//     RLS_TEST_ANON_KEY         su clave anónima
//     RLS_TEST_SERVICE_KEY      su clave de servicio (solo para preparar y
//                               limpiar los datos de cada prueba; nunca sale
//                               de aquí ni entra en el bundle)
//
// Sin ellas la suite se **salta** con un mensaje explicando qué falta. No se
// da por buena: se declara no ejecutada.
// ============================================================================

const URL = process.env.RLS_TEST_URL
const ANON = process.env.RLS_TEST_ANON_KEY
const SERVICE = process.env.RLS_TEST_SERVICE_KEY

const configurado = Boolean(URL && ANON && SERVICE)

test.skip(
  !configurado,
  'Sin proyecto de Supabase de pruebas. Define RLS_TEST_URL, RLS_TEST_ANON_KEY ' +
    'y RLS_TEST_SERVICE_KEY apuntando a un proyecto dedicado (NUNCA el de la ' +
    'demostración). Ver tests/rls/README.md.',
)

/** Cliente anónimo recién creado, sin sesión. */
function clienteAnonimo(): SupabaseClient {
  return createClient(URL!, ANON!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Cliente con permisos totales, solo para montar y desmontar el escenario. */
function clienteServicio(): SupabaseClient {
  return createClient(URL!, SERVICE!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Crea una sesión anónima y devuelve su cliente y su uid. */
async function visitanteAnonimo(): Promise<{ db: SupabaseClient; uid: string }> {
  const db = clienteAnonimo()
  const { data, error } = await db.auth.signInAnonymously()
  expect(error, 'los inicios de sesión anónimos deben estar activados').toBeNull()
  return { db, uid: data.user!.id }
}

const creados: { tabla: string; id: string }[] = []

test.afterAll(async () => {
  if (!configurado) return
  const admin = clienteServicio()
  // En orden inverso: los mensajes cuelgan de las conversaciones.
  for (const { tabla, id } of creados.reverse()) {
    await admin.from(tabla).delete().eq('id', id)
  }
})

// ---- Chat ------------------------------------------------------------------

test('un visitante no puede leer la ficha de otro', async () => {
  const ana = await visitanteAnonimo()
  const bea = await visitanteAnonimo()

  await ana.db.rpc('abrir_conversacion', {
    p_nombre: 'Ana Prueba',
    p_email: 'ana@ejemplo.test',
    p_bienvenida: 'Hola',
  })

  // Bea intenta enumerar visitantes. Debe ver como mucho la suya.
  const { data } = await bea.db.from('visitantes').select('id, nombre, email')
  const ajenas = (data ?? []).filter((v) => v.email === 'ana@ejemplo.test')
  expect(ajenas, 'un anónimo no puede ver los datos de otro visitante').toEqual([])
})

test('un visitante no puede leer los mensajes de otra conversación', async () => {
  const ana = await visitanteAnonimo()
  const bea = await visitanteAnonimo()

  const { data: conv } = await ana.db.rpc('abrir_conversacion', {
    p_nombre: 'Ana',
    p_bienvenida: 'Bienvenida de Ana',
  })
  await ana.db.from('mensajes').insert({
    conversacion_id: conv,
    autor: 'visitor',
    texto: 'secreto de Ana',
  })

  const { data } = await bea.db.from('mensajes').select('texto')
  const textos = (data ?? []).map((m) => m.texto)
  expect(textos, 'un anónimo no puede leer conversaciones ajenas').not.toContain(
    'secreto de Ana',
  )
})

test('un visitante no puede escribir en la conversación de otro', async () => {
  const ana = await visitanteAnonimo()
  const bea = await visitanteAnonimo()

  const { data: conv } = await ana.db.rpc('abrir_conversacion', { p_bienvenida: 'Hola' })

  const { error } = await bea.db.from('mensajes').insert({
    conversacion_id: conv,
    autor: 'visitor',
    texto: 'me cuelo',
  })
  expect(error, 'debe rechazarse por RLS').not.toBeNull()
})

test('un visitante no puede hacerse pasar por el agente ni por el bot', async () => {
  const ana = await visitanteAnonimo()
  const { data: conv } = await ana.db.rpc('abrir_conversacion', { p_bienvenida: 'Hola' })

  for (const autor of ['agent', 'bot'] as const) {
    const { error } = await ana.db.from('mensajes').insert({
      conversacion_id: conv,
      autor,
      texto: `suplantando a ${autor}`,
    })
    expect(error, `un visitante no puede escribir como ${autor}`).not.toBeNull()
  }
})

test('un visitante no puede cambiar el nombre ni el email de otro', async () => {
  const ana = await visitanteAnonimo()
  const bea = await visitanteAnonimo()

  await ana.db.rpc('abrir_conversacion', { p_nombre: 'Ana', p_email: 'ana@ejemplo.test' })

  const admin = clienteServicio()
  const { data: fichaAna } = await admin
    .from('visitantes')
    .select('id')
    .eq('email', 'ana@ejemplo.test')
    .single()

  const { data: tocadas } = await bea.db
    .from('visitantes')
    .update({ nombre: 'PISADO', email: 'atacante@ejemplo.test' })
    .eq('id', fichaAna!.id)
    .select()

  expect(tocadas ?? [], 'la actualización no debe alcanzar ninguna fila ajena').toEqual([])

  const { data: despues } = await admin
    .from('visitantes')
    .select('nombre')
    .eq('id', fichaAna!.id)
    .single()
  expect(despues!.nombre, 'el nombre debe seguir intacto').toBe('Ana')
})

test('el chat legítimo sigue funcionando de punta a punta', async () => {
  const ana = await visitanteAnonimo()

  const { data: conv, error: errorApertura } = await ana.db.rpc('abrir_conversacion', {
    p_nombre: 'Ana',
    p_email: 'ana@ejemplo.test',
    p_bienvenida: '¡Hola! Soy Bananito',
  })
  expect(errorApertura, 'abrir conversación debe funcionar').toBeNull()
  expect(conv).toBeTruthy()

  const { error: errorEnvio } = await ana.db.from('mensajes').insert({
    conversacion_id: conv,
    autor: 'visitor',
    texto: '¿Tenéis el iPhone 17 en Triana?',
  })
  expect(errorEnvio, 'enviar un mensaje propio debe funcionar').toBeNull()

  const { data: leidos } = await ana.db
    .from('mensajes')
    .select('autor, texto')
    .eq('conversacion_id', conv)
    .order('created_at')

  expect(leidos, 'debe ver su bienvenida y su mensaje').toHaveLength(2)
  expect(leidos![0].autor).toBe('bot')
  expect(leidos![1].texto).toContain('iPhone 17')
})

// ---- Cuentas ---------------------------------------------------------------

/** Crea un cliente con sesión propia. Devuelve su cliente Supabase y su uid. */
async function clienteRegistrado(sufijo: string) {
  const db = clienteAnonimo()
  const email = `rls-${sufijo}-${Date.now()}@ejemplo.test`
  const { data, error } = await db.auth.signUp({ email, password: 'prueba-rls-1234' })
  expect(error, 'el alta de cliente de prueba debe funcionar').toBeNull()
  const uid = data.user!.id
  await db.from('clientes').insert({ id: uid, email })
  creados.push({ tabla: 'clientes', id: uid })
  return { db, uid, email }
}

test('un cliente no puede leer los pedidos de otro', async () => {
  const uno = await clienteRegistrado('uno')
  const dos = await clienteRegistrado('dos')

  const admin = clienteServicio()
  const { data: pedido } = await admin
    .from('pedidos')
    .insert({ id: `BC-RLS${Date.now()}`, cliente_id: uno.uid, products_total: 100 })
    .select()
    .single()
  creados.push({ tabla: 'pedidos', id: pedido!.id })

  const { data } = await dos.db.from('pedidos').select('id')
  expect(
    (data ?? []).map((p) => p.id),
    'un cliente no puede ver pedidos ajenos',
  ).not.toContain(pedido!.id)
})

test('un cliente no puede aprobarse su propio descuento educativo', async () => {
  const uno = await clienteRegistrado('descuento')

  await uno.db
    .from('clientes')
    .update({ descuento_educativo_estado: 'aprobado' })
    .eq('id', uno.uid)

  const admin = clienteServicio()
  const { data } = await admin
    .from('clientes')
    .select('descuento_educativo_estado')
    .eq('id', uno.uid)
    .single()

  expect(
    data!.descuento_educativo_estado,
    'el estado del descuento solo lo mueve el agente',
  ).not.toBe('aprobado')
})
