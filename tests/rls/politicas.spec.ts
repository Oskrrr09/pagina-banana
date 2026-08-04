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
  return { db, uid: anotarUsuario(data.user!.id) }
}

const creados: { tabla: string; id: string }[] = []
const usuarios: string[] = []
const objetos: string[] = []

/** Registra una sesión para borrarla al final pase lo que pase. */
function anotarUsuario(uid: string): string {
  usuarios.push(uid)
  return uid
}

test.afterAll(async () => {
  if (!configurado) return
  const admin = clienteServicio()

  // `visitantes.auth_id` usa ON DELETE SET NULL: borrar el usuario de Auth no
  // limpia el chat, lo deja huérfano. Se elimina mientras el auth_id todavía
  // permite reconocer todas las filas creadas por esta ejecución; las
  // conversaciones y los mensajes caen por cascada.
  if (usuarios.length > 0) {
    await admin.from('visitantes').delete().in('auth_id', usuarios)
  }

  // Orden inverso: los mensajes cuelgan de las conversaciones, y éstas de los
  // visitantes. Va en `afterAll` sin `if` de éxito a propósito: si una prueba
  // falla a mitad, la basura que dejó es justo la que más estorba a la
  // siguiente ejecución.
  for (const { tabla, id } of creados.reverse()) {
    await admin.from(tabla).delete().eq('id', id)
  }
  if (objetos.length > 0) {
    await admin.storage.from('descuentos-educativos').remove(objetos)
  }
  // Borrar el usuario arrastra por cascada su visitante, conversaciones y
  // mensajes; aun así se borran antes por si alguna clave foránea no fuera
  // en cascada.
  for (const uid of usuarios) {
    await admin.auth.admin.deleteUser(uid).catch(() => {})
  }
})

// ---- Chat ------------------------------------------------------------------

test('un visitante no puede leer la ficha de otro', async () => {
  const ana = await visitanteAnonimo()
  const bea = await visitanteAnonimo()

  await ana.db.rpc('abrir_conversacion', {
    p_nombre: 'Ana Prueba',
    p_email: 'ana@ejemplo.test',
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
  })
  await ana.db.rpc('enviar_mensaje_visitante', {
    p_conversacion_id: conv,
    p_texto: 'secreto de Ana',
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

  const { data: conv } = await ana.db.rpc('abrir_conversacion', { p_nombre: 'Ana' })

  const { error } = await bea.db.from('mensajes').insert({
    conversacion_id: conv,
    autor: 'visitor',
    texto: 'me cuelo',
  })
  expect(error, 'debe rechazarse por RLS').not.toBeNull()
})

test('un visitante no puede hacerse pasar por el agente ni por el bot', async () => {
  const ana = await visitanteAnonimo()
  const { data: conv } = await ana.db.rpc('abrir_conversacion', { p_nombre: 'Ana' })

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
  })
  expect(errorApertura, 'abrir conversación debe funcionar').toBeNull()
  expect(conv).toBeTruthy()

  const { error: errorEnvio } = await ana.db.rpc('enviar_mensaje_visitante', {
    p_conversacion_id: conv,
    p_texto: '¿Tenéis el iPhone 17 en Triana?',
  })
  expect(errorEnvio, 'enviar un mensaje propio debe funcionar').toBeNull()

  const { data: leidos } = await ana.db
    .from('mensajes')
    .select('autor, texto')
    .eq('conversacion_id', conv)
    .order('created_at')

  // Solo su mensaje: la bienvenida ya no se guarda, la pinta el widget en el
  // idioma activo.
  expect(leidos, 'debe ver su mensaje').toHaveLength(1)
  expect(leidos![0].autor).toBe('visitor')
  expect(leidos![0].texto).toContain('iPhone 17')
})

// ---- Cuentas ---------------------------------------------------------------

/** Crea un cliente con sesión propia. Devuelve su cliente Supabase y su uid. */
async function clienteRegistrado(sufijo: string) {
  const db = clienteAnonimo()
  const email = `rls-${sufijo}-${Date.now()}@ejemplo.test`
  const { data, error } = await db.auth.signUp({ email, password: 'prueba-rls-1234' })
  expect(error, 'el alta de cliente de prueba debe funcionar').toBeNull()
  const uid = anotarUsuario(data.user!.id)
  await db.from('clientes').insert({ id: uid, email })
  creados.push({ tabla: 'clientes', id: uid })
  return { db, uid, email }
}

/** Crea una cuenta de agente real en GoTrue y abre una sesión sin service_role. */
async function agenteRegistrado(
  sufijo: string,
  rol: 'agente' | 'supervisor' = 'agente',
) {
  const admin = clienteServicio()
  const email = `rls-agente-${sufijo}-${Date.now()}@ejemplo.test`
  const password = 'prueba-rls-agente-1234'
  const { data: alta, error: errorAlta } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  expect(errorAlta, 'el alta administrativa del agente debe funcionar').toBeNull()
  const uid = anotarUsuario(alta.user!.id)

  const { error: errorFicha } = await admin.from('agentes').insert({
    id: uid,
    email,
    nombre: `Agente ${sufijo}`,
    rol,
    estado: 'disponible',
  })
  expect(errorFicha, 'la ficha del agente debe poder prepararse').toBeNull()
  creados.push({ tabla: 'agentes', id: uid })

  const db = clienteAnonimo()
  const { error: errorLogin } = await db.auth.signInWithPassword({ email, password })
  expect(errorLogin, 'el login real del agente debe funcionar').toBeNull()
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

test('un visitante no puede colar una bienvenida falsa firmada por el bot', async () => {
  const ana = await visitanteAnonimo()

  // La firma del RPC ya no acepta texto. Se intenta igualmente: si alguien
  // reintrodujera el parámetro, esta prueba lo cazaría.
  const { error } = await ana.db.rpc('abrir_conversacion', {
    p_nombre: 'Ana',
    p_bienvenida: 'Banana Computer regala un iPhone a quien responda YA',
  } as Record<string, unknown>)
  expect(error, 'el RPC no debe aceptar texto de bienvenida').not.toBeNull()

  // Y por si acaso: ningún mensaje de bot con ese contenido.
  const admin = clienteServicio()
  const { data } = await admin.from('mensajes').select('texto').eq('autor', 'bot')
  const textos = (data ?? []).map((m) => m.texto as string)
  expect(textos.some((t) => t.includes('regala un iPhone'))).toBe(false)
})

test('un visitante no puede asignarse el cliente_id de otro', async () => {
  const ana = await visitanteAnonimo()
  const otro = await clienteRegistrado('victima')
  await ana.db.rpc('abrir_conversacion', { p_nombre: 'Ana' })

  const { error } = await ana.db
    .from('visitantes')
    .update({ cliente_id: otro.uid })
    .eq('auth_id', ana.uid)

  expect(error, 'el disparador debe rechazar el cambio de cliente_id').not.toBeNull()
})

test('un anónimo sin cuenta no puede vincularse como cliente', async () => {
  const ana = await visitanteAnonimo()
  await ana.db.rpc('abrir_conversacion', { p_nombre: 'Ana' })

  const { error } = await ana.db.rpc('vincular_mi_visitante_a_cliente')
  expect(error, 'no tiene ficha de cliente, así que no puede vincularse').not.toBeNull()
})

test('un cliente vincula su propio chat con su cuenta', async () => {
  const uno = await clienteRegistrado('vinculo')
  await uno.db.rpc('abrir_conversacion', { p_nombre: 'Cliente' })

  const { error } = await uno.db.rpc('vincular_mi_visitante_a_cliente')
  expect(error, 'la vinculación legítima debe funcionar').toBeNull()

  const admin = clienteServicio()
  const { data } = await admin
    .from('visitantes')
    .select('cliente_id')
    .eq('auth_id', uno.uid)
    .single()
  expect(data!.cliente_id).toBe(uno.uid)
})

test('un cliente no puede crear su ficha ya aprobada', async () => {
  const db = clienteAnonimo()
  const email = `rls-aprobado-${Date.now()}@ejemplo.test`
  const { data } = await db.auth.signUp({ email, password: 'prueba-rls-1234' })
  const uid = anotarUsuario(data.user!.id)

  const { error } = await db.from('clientes').insert({
    id: uid,
    email,
    descuento_educativo_estado: 'aprobado',
  })
  expect(error, 'la política de alta debe exigir los campos de descuento nulos').not.toBeNull()
})

test('un cliente edita su ficha por RPC pero no toca el descuento', async () => {
  const uno = await clienteRegistrado('edicion')

  const { error } = await uno.db.rpc('actualizar_mi_ficha', {
    p_nombre: 'Nombre Nuevo',
    p_telefono: '600123456',
    p_direccion_envio: { calle: 'Triana 105', ciudad: 'Las Palmas' },
  })
  expect(error, 'la edición legítima debe funcionar').toBeNull()

  const admin = clienteServicio()
  const { data } = await admin
    .from('clientes')
    .select('nombre, telefono, direccion_envio, descuento_educativo_estado')
    .eq('id', uno.uid)
    .single()

  expect(data!.nombre).toBe('Nombre Nuevo')
  expect(data!.telefono).toBe('600123456')
  expect(data!.descuento_educativo_estado, 'el RPC no toca el descuento').toBeNull()
})

test('un cliente no puede registrar un justificante de otra carpeta', async () => {
  const uno = await clienteRegistrado('justificante')
  const otroUid = '00000000-0000-4000-8000-000000000001'

  const { error } = await uno.db.rpc('registrar_mi_justificante', {
    p_ruta: `${otroUid}/justificante.pdf`,
  })
  expect(error, 'la ruta debe estar dentro de la carpeta del propio usuario').not.toBeNull()
})

test('registrar un justificante devuelve la solicitud a pendiente y limpia la revisión', async () => {
  const uno = await clienteRegistrado('rerevision')
  const admin = clienteServicio()

  // Estado de partida: rechazada, con nota y datos de revisión.
  await admin
    .from('clientes')
    .update({
      descuento_educativo_estado: 'rechazado',
      descuento_educativo_nota: 'El documento no se lee',
      descuento_educativo_revisado_at: new Date().toISOString(),
    })
    .eq('id', uno.uid)

  const ruta = `${uno.uid}/justificante.pdf`
  const { error: errorSubida } = await uno.db.storage
    .from('descuentos-educativos')
    .upload(ruta, new Blob(['justificante de prueba'], { type: 'application/pdf' }), {
      contentType: 'application/pdf',
      upsert: true,
    })
  expect(errorSubida, 'el cliente debe poder subir a su propia carpeta').toBeNull()
  objetos.push(ruta)

  const { error } = await uno.db.rpc('registrar_mi_justificante', { p_ruta: ruta })
  expect(error).toBeNull()

  const { data } = await admin
    .from('clientes')
    .select(
      'descuento_educativo_estado, descuento_educativo_archivo, descuento_educativo_nota, descuento_educativo_revisado_at',
    )
    .eq('id', uno.uid)
    .single()

  expect(data!.descuento_educativo_estado).toBe('pendiente')
  expect(data!.descuento_educativo_archivo).toBe(ruta)
  expect(data!.descuento_educativo_nota, 'la nota anterior ya no aplica').toBeNull()
  expect(data!.descuento_educativo_revisado_at).toBeNull()
})

// ---- Reservas --------------------------------------------------------------

/** Crea una reserva en espera para el cliente indicado. */
async function reservaEnEspera(
  cliente: { db: SupabaseClient; uid: string },
  variante = '256 GB Plata',
): Promise<string> {
  const { data, error } = await cliente.db.rpc('crear_mis_reservas', {
    p_lineas: [
      {
        family: 'iphone',
        model_slug: '17-pro',
        model_name: 'iPhone 17 Pro',
        variant_label: variante,
        price: 1329,
        unidades: 1,
      },
    ],
  })
  expect(error, 'la reserva legítima debe crearse por RPC').toBeNull()
  const id = (data as string[] | null)?.[0]
  expect(id, 'el RPC debe devolver el identificador creado').toBeTruthy()
  creados.push({ tabla: 'reservas', id: id! })
  return id!
}

test('un cliente cancela su reserva por RPC', async () => {
  const uno = await clienteRegistrado('reserva')
  const reserva = await reservaEnEspera(uno)

  const { error } = await uno.db.rpc('cancelar_mi_reserva', { p_reserva_id: reserva })
  expect(error, 'cancelar la propia reserva debe funcionar').toBeNull()

  const admin = clienteServicio()
  const { data } = await admin.from('reservas').select('estado').eq('id', reserva).single()
  expect(data!.estado).toBe('cancelada')
})

test('un cliente no puede cancelar la reserva de otro', async () => {
  const uno = await clienteRegistrado('duenyo')
  const dos = await clienteRegistrado('intruso')
  const reserva = await reservaEnEspera(uno)

  const { error } = await dos.db.rpc('cancelar_mi_reserva', { p_reserva_id: reserva })
  expect(error, 'no es suya').not.toBeNull()
})

test('un cliente no puede cambiar el precio ni la fecha de su reserva', async () => {
  const uno = await clienteRegistrado('precio')
  const reserva = await reservaEnEspera(uno)

  // `pagado_at` fija el puesto en la lista de espera: moverlo es colarse.
  const { data: tocadas } = await uno.db
    .from('reservas')
    .update({ price: 1, pagado_at: '2020-01-01T00:00:00Z', estado: 'disponible' })
    .eq('id', reserva)
    .select()

  expect(tocadas ?? [], 'no debe existir UPDATE directo del cliente').toEqual([])

  const admin = clienteServicio()
  const { data } = await admin
    .from('reservas')
    .select('price, estado')
    .eq('id', reserva)
    .single()
  expect(Number(data!.price)).toBe(1329)
  expect(data!.estado).toBe('en-espera')
})

test('una reserva ya cancelada no se puede volver a cancelar', async () => {
  const uno = await clienteRegistrado('recancelar')
  const reserva = await reservaEnEspera(uno)

  await uno.db.rpc('cancelar_mi_reserva', { p_reserva_id: reserva })
  const { error } = await uno.db.rpc('cancelar_mi_reserva', { p_reserva_id: reserva })
  expect(error, 'solo se cancela lo que está en espera').not.toBeNull()
})

test('un autenticado que no es agente no puede actuar como agente', async () => {
  const uno = await clienteRegistrado('falsoagente')
  const ana = await visitanteAnonimo()
  const { data: conv } = await ana.db.rpc('abrir_conversacion', { p_nombre: 'Ana' })

  const { error } = await uno.db.from('mensajes').insert({
    conversacion_id: conv,
    autor: 'agent',
    texto: 'Le atiendo yo',
  })
  expect(error, 'tener cuenta no convierte a nadie en agente').not.toBeNull()

  const { data } = await uno.db.from('visitantes').select('id')
  expect((data ?? []).length, 'un cliente normal no enumera visitantes').toBe(0)
})

// ---- Integración real de agente, Storage y RPC finales --------------------

test('un agente responde por RPC sin poder elegir autor ni firmante', async () => {
  const visitante = await visitanteAnonimo()
  const agente = await agenteRegistrado('respuesta')
  const { data: conv } = await visitante.db.rpc('abrir_conversacion', {
    p_nombre: 'Visitante respuesta',
  })

  const { error } = await agente.db.rpc('responder_como_agente', {
    p_conversacion_id: conv,
    p_texto: 'Respuesta verificada',
  })
  expect(error, 'el agente debe poder responder').toBeNull()

  const admin = clienteServicio()
  const { data } = await admin
    .from('mensajes')
    .select('autor, agente_id, texto')
    .eq('conversacion_id', conv)
    .eq('texto', 'Respuesta verificada')
    .single()
  expect(data).toMatchObject({ autor: 'agent', agente_id: agente.uid })
})

test('una cuenta normal no puede invocar operaciones de agente', async () => {
  const visitante = await visitanteAnonimo()
  const cliente = await clienteRegistrado('no-agente-rpc')
  const { data: conv } = await visitante.db.rpc('abrir_conversacion', {
    p_nombre: 'Visitante protegido',
  })

  const { error } = await cliente.db.rpc('responder_como_agente', {
    p_conversacion_id: conv,
    p_texto: 'No soy agente',
  })
  expect(error, 'authenticated no basta: hace falta estar en agentes').not.toBeNull()
})

test('un agente no puede ascenderse ni cambiar su ficha directamente', async () => {
  const agente = await agenteRegistrado('sin-ascenso')

  const { data: tocadas } = await agente.db
    .from('agentes')
    .update({ rol: 'supervisor', nombre: 'Me ascendí' })
    .eq('id', agente.uid)
    .select()
  expect(tocadas ?? [], 'no debe existir UPDATE directo de agentes').toEqual([])

  const { error: errorEstado } = await agente.db.rpc('cambiar_mi_estado', {
    p_estado: 'ocupado',
    p_nombre: null,
  })
  expect(errorEstado, 'el cambio acotado de estado sí debe funcionar').toBeNull()

  const admin = clienteServicio()
  const { data } = await admin
    .from('agentes')
    .select('rol, nombre, estado')
    .eq('id', agente.uid)
    .single()
  expect(data!.rol).toBe('agente')
  expect(data!.nombre).not.toBe('Me ascendí')
  expect(data!.estado).toBe('ocupado')
})

test('cerrar y valorar exige asignación y respeta al dueño del chat', async () => {
  const visitante = await visitanteAnonimo()
  const intruso = await visitanteAnonimo()
  const agente = await agenteRegistrado('cierre')
  const { data: conv } = await visitante.db.rpc('abrir_conversacion', {
    p_nombre: 'Visitante cierre',
  })

  const { error: sinAsignar } = await agente.db.rpc('cerrar_conversacion', {
    p_conversacion_id: conv,
    p_solicitar_valoracion: true,
  })
  expect(sinAsignar, 'un agente normal no cierra una conversación libre').not.toBeNull()

  expect(
    (await agente.db.rpc('asignarme_conversacion', { p_conversacion_id: conv })).error,
  ).toBeNull()
  expect(
    (
      await agente.db.rpc('cerrar_conversacion', {
        p_conversacion_id: conv,
        p_solicitar_valoracion: true,
      })
    ).error,
  ).toBeNull()

  const { error: valoracionAjena } = await intruso.db.rpc('enviar_valoracion', {
    p_conversacion_id: conv,
    p_estrellas: 1,
    p_observacion: 'No es mi conversación',
  })
  expect(valoracionAjena, 'otro visitante no puede valorar una conversación ajena').not.toBeNull()

  const { error: valoracion } = await visitante.db.rpc('enviar_valoracion', {
    p_conversacion_id: conv,
    p_estrellas: 5,
    p_observacion: 'Todo bien',
  })
  expect(valoracion, 'el dueño puede valorar una vez si se le pide').toBeNull()

  const { error: repetida } = await visitante.db.rpc('enviar_valoracion', {
    p_conversacion_id: conv,
    p_estrellas: 1,
    p_observacion: 'Intento de sobrescritura',
  })
  expect(repetida, 'la valoración no se puede sobrescribir').not.toBeNull()
})

test('Storage aísla carpetas, permite upsert propio y deja leer al agente', async () => {
  const uno = await clienteRegistrado('storage-uno')
  const dos = await clienteRegistrado('storage-dos')
  const agente = await agenteRegistrado('storage-agente')
  const ruta = `${uno.uid}/justificante.pdf`
  const bucket = uno.db.storage.from('descuentos-educativos')

  const archivo = new Blob(['primera versión'], { type: 'application/pdf' })
  expect((await bucket.upload(ruta, archivo, { contentType: 'application/pdf' })).error).toBeNull()
  objetos.push(ruta)

  const reemplazo = new Blob(['segunda versión'], { type: 'application/pdf' })
  expect(
    (await bucket.upload(ruta, reemplazo, { contentType: 'application/pdf', upsert: true })).error,
    'la segunda subida necesita la política UPDATE',
  ).toBeNull()

  expect(
    (await dos.db.storage.from('descuentos-educativos').download(ruta)).error,
    'otro cliente no puede leer el justificante',
  ).not.toBeNull()
  expect(
    (await agente.db.storage.from('descuentos-educativos').download(ruta)).error,
    'un agente dado de alta sí puede revisarlo',
  ).toBeNull()

  expect(
    (await uno.db.rpc('registrar_mi_justificante', { p_ruta: ruta })).error,
    'solo se registra una ruta que existe de verdad',
  ).toBeNull()
})

test('la posición de reserva usa el orden real y no expone colas ajenas', async () => {
  const uno = await clienteRegistrado('cola-uno')
  const dos = await clienteRegistrado('cola-dos')
  // Una variante exclusiva por ejecución evita que dos workflows paralelos
  // compartan cola en el mismo proyecto dedicado y vuelvan el resultado
  // dependiente de datos externos a esta prueba.
  const variante = `RLS ${Date.now()} ${crypto.randomUUID()}`
  const primera = await reservaEnEspera(uno, variante)
  const segunda = await reservaEnEspera(dos, variante)

  const { data: posicion, error } = await dos.db.rpc('posicion_en_cola', {
    p_reserva_id: segunda,
  })
  expect(error).toBeNull()
  expect(posicion).toBe(2)

  const { data: ajena } = await uno.db.rpc('posicion_en_cola', {
    p_reserva_id: segunda,
  })
  expect(ajena, 'el RPC no revela la posición de una reserva ajena').toBeNull()

  // La variable se usa para dejar explícito qué fila va delante y evitar
  // que una refactorización convierta sin querer esta prueba en una sola fila.
  expect(primera).not.toBe(segunda)
})
