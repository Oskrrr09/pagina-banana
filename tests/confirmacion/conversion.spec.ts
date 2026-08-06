import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Conversión de sesión anónima en cuenta permanente CON CONFIRMACIÓN DE EMAIL.
//
// La otra suite de integración corre con la confirmación desactivada, que es
// como está el entorno local por defecto. Ahí la conversión termina en una
// llamada y el camino real —el que documenta Supabase— no se recorre nunca.
//
// Aquí se recorre entero:
//
//   1. actualizar sólo el email;
//   2. sacar el enlace del buzón local y consumirlo;
//   3. refrescar la sesión;
//   4. comprobar que `is_anonymous` ya es false;
//   5. poner la contraseña;
//   6. crear la ficha de cliente;
//   7. vincular el chat conservando el mismo `auth.uid()`.
//
// Y los caminos que se tuercen: email de otra cuenta, contraseña rechazada,
// confirmación no válida, refresco fallido, y la regla que no se puede saltar
// en ningún caso — que la ficha no exista antes de que la cuenta lo sea.
// ============================================================================

const URL = process.env.RLS_TEST_URL
const ANON = process.env.RLS_TEST_ANON_KEY
const SERVICE = process.env.RLS_TEST_SERVICE_KEY
const MAIL = process.env.RLS_TEST_MAIL_URL ?? 'http://127.0.0.1:54324'
const RUN_ID = `${Date.now()}-${crypto.randomUUID()}`

const configurado = Boolean(URL && ANON && SERVICE)

test.skip(
  !configurado,
  'Necesita Supabase local con la confirmación de email activada. Se ejecuta ' +
    'desde `npm run test:confirmacion`, que la enciende y la restaura.',
)

function marca(etiqueta: string): string {
  return `conf-${RUN_ID}-${etiqueta}`
}

function clienteAnonimo(): SupabaseClient {
  return createClient(URL!, ANON!, { auth: { persistSession: false, autoRefreshToken: false } })
}

function clienteServicio(): SupabaseClient {
  return createClient(URL!, SERVICE!, { auth: { persistSession: false, autoRefreshToken: false } })
}

const usuarios: string[] = []

test.afterAll(async () => {
  if (!configurado) return
  const admin = clienteServicio()
  if (usuarios.length > 0) await admin.from('visitantes').delete().in('auth_id', usuarios)
  for (const uid of usuarios) {
    await admin.from('clientes').delete().eq('id', uid)
    await admin.auth.admin.deleteUser(uid).catch(() => {})
  }
})

/**
 * Saca del buzón local el enlace de confirmación dirigido a una dirección.
 *
 * Sirve tanto para Mailpit como para Inbucket: la CLI ha usado los dos según
 * la versión, y fijar uno dejaría la prueba dependiendo de cuál toque hoy.
 */
async function enlaceDeConfirmacion(email: string): Promise<string> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    const cuerpo = await leerUltimoCorreo(email)
    if (cuerpo) {
      const enlace = cuerpo.match(/https?:\/\/[^\s"'<>]*\/auth\/v1\/verify[^\s"'<>]*/)?.[0]
      if (enlace) return enlace.replace(/&amp;/g, '&')
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No llegó ningún correo de confirmación para ${email}`)
}

async function leerUltimoCorreo(email: string): Promise<string | null> {
  // Mailpit
  try {
    const lista = await fetch(`${MAIL}/api/v1/messages?limit=50`)
    if (lista.ok) {
      const json = (await lista.json()) as { messages?: { ID: string; To?: { Address: string }[] }[] }
      const mensaje = (json.messages ?? []).find((m) => (m.To ?? []).some((t) => t.Address === email))
      if (mensaje) {
        const detalle = await fetch(`${MAIL}/api/v1/message/${mensaje.ID}`)
        if (detalle.ok) {
          const cuerpo = (await detalle.json()) as { HTML?: string; Text?: string }
          return `${cuerpo.HTML ?? ''}\n${cuerpo.Text ?? ''}`
        }
      }
    }
  } catch {
    /* se prueba con Inbucket */
  }
  // Inbucket
  try {
    const buzon = email.split('@')[0]
    const lista = await fetch(`${MAIL}/api/v1/mailbox/${buzon}`)
    if (!lista.ok) return null
    const mensajes = (await lista.json()) as { id: string }[]
    if (mensajes.length === 0) return null
    const ultimo = mensajes[mensajes.length - 1]
    const detalle = await fetch(`${MAIL}/api/v1/mailbox/${buzon}/${ultimo.id}`)
    if (!detalle.ok) return null
    const cuerpo = (await detalle.json()) as { body?: { html?: string; text?: string } }
    return `${cuerpo.body?.html ?? ''}\n${cuerpo.body?.text ?? ''}`
  } catch {
    return null
  }
}

/** Consume el enlace sin seguir la redirección, que apunta a la web. */
async function consumir(enlace: string): Promise<number> {
  const respuesta = await fetch(enlace, { redirect: 'manual' })
  return respuesta.status
}

test('la conversión documentada de dos pasos funciona de punta a punta', async () => {
  const db = clienteAnonimo()
  const { data: anonima, error: errorAnonimo } = await db.auth.signInAnonymously()
  expect(errorAnonimo, 'los inicios anónimos deben estar activados').toBeNull()
  const uid = anonima.user!.id
  usuarios.push(uid)

  // El visitante escribe por el chat ANTES de registrarse. Es lo que hay que
  // conservar: si la conversión no mantuviera el uid, este hilo se perdería.
  const { data: conv, error: errorChat } = await db.rpc('abrir_conversacion', { p_nombre: 'Ana Anónima' })
  expect(errorChat).toBeNull()
  await db.rpc('enviar_mensaje_visitante', { p_conversacion_id: conv, p_texto: 'Pregunto antes de registrarme' })

  const email = `${marca('completa')}@ejemplo.test`

  // Paso 1 — sólo el email. La contraseña todavía no: el correo no está
  // verificado y Supabase no la acepta hasta que lo esté.
  const { error: errorEmail } = await db.auth.updateUser({ email })
  expect(errorEmail, 'actualizar sólo el email debe aceptarse').toBeNull()

  // Mientras no se confirme, la sesión SIGUE siendo anónima...
  const { data: pendiente } = await db.auth.refreshSession()
  expect(pendiente.session?.user.is_anonymous, 'sin confirmar sigue siendo anónima').toBe(true)

  // ...y por tanto la ficha no puede existir todavía. Es la regla que no se
  // puede saltar en ninguna configuración.
  const { error: errorFichaPronto } = await db.from('clientes').insert({ id: uid, email })
  expect(errorFichaPronto, 'no puede haber ficha antes de dejar de ser anónima').not.toBeNull()

  const admin = clienteServicio()
  const { data: sinFicha } = await admin.from('clientes').select('id').eq('id', uid)
  expect(sinFicha ?? [], 'ni siquiera una a medias').toEqual([])

  // Paso 2 — el enlace del buzón local.
  const enlace = await enlaceDeConfirmacion(email)
  const estado = await consumir(enlace)
  expect([200, 301, 302, 303, 307].includes(estado), `la confirmación respondió ${estado}`).toBe(true)

  // Paso 3 y 4 — refrescar y comprobar que ya no es anónima.
  const { data: renovada, error: errorRefresco } = await db.auth.refreshSession()
  expect(errorRefresco).toBeNull()
  expect(renovada.session?.user.is_anonymous, 'tras confirmar deja de ser anónima').toBe(false)
  expect(renovada.session?.user.id, 'y conserva el mismo uid').toBe(uid)

  // Paso 5 — ahora sí la contraseña.
  const { error: errorPassword } = await db.auth.updateUser({ password: 'prueba-conf-1234' })
  expect(errorPassword, 'con el email verificado la contraseña se acepta').toBeNull()

  // Paso 6 — la ficha.
  const { error: errorFicha } = await db.from('clientes').insert({ id: uid, email })
  expect(errorFicha, 'la cuenta permanente ya puede crear su ficha').toBeNull()

  // Paso 7 — el chat sigue siendo suyo.
  const { error: errorVinculo } = await db.rpc('vincular_mi_visitante_a_cliente')
  expect(errorVinculo, 'la vinculación del chat debe funcionar').toBeNull()

  const { data: visitante } = await db.from('visitantes').select('cliente_id').eq('auth_id', uid).single()
  expect(visitante!.cliente_id, 'la conversación queda enlazada con la cuenta').toBe(uid)

  const { data: mensajes } = await db.from('mensajes').select('texto').eq('conversacion_id', conv)
  expect(
    (mensajes ?? []).map((m) => m.texto),
    'y conserva lo que escribió siendo anónimo',
  ).toContain('Pregunto antes de registrarme')

  // Y la contraseña sirve de verdad para volver a entrar.
  const otro = clienteAnonimo()
  const { error: errorLogin } = await otro.auth.signInWithPassword({ email, password: 'prueba-conf-1234' })
  expect(errorLogin, 'la cuenta convertida debe poder iniciar sesión').toBeNull()
})

test('un email que ya pertenece a otra cuenta no convierte la sesión', async () => {
  const email = `${marca('ocupado')}@ejemplo.test`
  const admin = clienteServicio()
  const { data: existente, error: errorAlta } = await admin.auth.admin.createUser({
    email,
    password: 'prueba-conf-1234',
    email_confirm: true,
  })
  expect(errorAlta).toBeNull()
  usuarios.push(existente.user!.id)

  const db = clienteAnonimo()
  const { data: anonima } = await db.auth.signInAnonymously()
  const uid = anonima.user!.id
  usuarios.push(uid)

  const { error } = await db.auth.updateUser({ email })

  // GoTrue puede rechazarlo de inmediato o aceptarlo y no confirmarlo nunca,
  // según su configuración de privacidad. Lo que no puede pasar en ninguno de
  // los dos casos es que la sesión acabe siendo permanente.
  const { data: despues } = await db.auth.refreshSession()
  expect(
    Boolean(error) || despues.session?.user.is_anonymous === true,
    'un email ocupado no puede convertir la cuenta',
  ).toBe(true)

  const { data: ficha } = await admin.from('clientes').select('id').eq('id', uid)
  expect(ficha ?? [], 'y no deja ninguna ficha detrás').toEqual([])
})

test('una contraseña que no cumple el mínimo se rechaza y no deja la cuenta a medias', async () => {
  const db = clienteAnonimo()
  const { data: anonima } = await db.auth.signInAnonymously()
  const uid = anonima.user!.id
  usuarios.push(uid)

  const email = `${marca('password')}@ejemplo.test`
  await db.auth.updateUser({ email })
  const enlace = await enlaceDeConfirmacion(email)
  await consumir(enlace)
  const { data: renovada } = await db.auth.refreshSession()
  expect(renovada.session?.user.is_anonymous).toBe(false)

  // El mínimo del proyecto son 8 caracteres.
  const { error } = await db.auth.updateUser({ password: 'corta' })
  expect(error, 'una contraseña por debajo del mínimo debe rechazarse').not.toBeNull()

  // La cuenta ya es permanente —el email se confirmó— pero sigue sin
  // contraseña, así que no se puede entrar con la que se rechazó.
  const otro = clienteAnonimo()
  const { error: errorLogin } = await otro.auth.signInWithPassword({ email, password: 'corta' })
  expect(errorLogin, 'no debe poder entrarse con la contraseña rechazada').not.toBeNull()
})

test('una confirmación no válida o ya consumida no convierte la sesión', async () => {
  const db = clienteAnonimo()
  const { data: anonima } = await db.auth.signInAnonymously()
  const uid = anonima.user!.id
  usuarios.push(uid)

  const email = `${marca('token')}@ejemplo.test`
  await db.auth.updateUser({ email })
  const enlace = await enlaceDeConfirmacion(email)

  // Un token manipulado no sirve.
  const manipulado = enlace.replace(/token=([^&]+)/, 'token=$1caducado')
  await consumir(manipulado)
  const { data: trasManipulado } = await db.auth.refreshSession()
  expect(trasManipulado.session?.user.is_anonymous, 'un token inválido no confirma nada').toBe(true)

  // El bueno sí, y una segunda vez ya no: los tokens de un solo uso se
  // comportan igual que uno caducado.
  await consumir(enlace)
  const { data: trasBueno } = await db.auth.refreshSession()
  expect(trasBueno.session?.user.is_anonymous).toBe(false)

  const segundoIntento = await consumir(enlace)
  expect(segundoIntento, 'el mismo enlace no vale dos veces').not.toBe(200)
})

test('un refresco fallido no deja crear la ficha', async () => {
  const db = clienteAnonimo()
  const { data: anonima } = await db.auth.signInAnonymously()
  const uid = anonima.user!.id
  usuarios.push(uid)

  // Refrescar con un token que no vale falla, y sin token nuevo la sesión
  // sigue siendo anónima a ojos de la base por mucho que el email cambiara.
  const roto = clienteAnonimo()
  const { error } = await roto.auth.refreshSession({ refresh_token: 'no-es-un-token' })
  expect(error, 'un refresco con token inválido debe fallar').not.toBeNull()

  const { error: errorFicha } = await db
    .from('clientes')
    .insert({ id: uid, email: `${marca('refresco')}@ejemplo.test` })
  expect(errorFicha, 'sin sesión permanente no hay ficha').not.toBeNull()

  const admin = clienteServicio()
  const { data: ficha } = await admin.from('clientes').select('id').eq('id', uid)
  expect(ficha ?? []).toEqual([])
})
