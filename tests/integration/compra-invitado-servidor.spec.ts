import { expect, test, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// UNA COMPRA HECHA SIN CUENTA SE RECUPERA AL IDENTIFICARSE.
//
// QUÉ ATRAVIESA ESTA SUITE, Y QUÉ NO
//
// Atraviesa: checkout real sin sesión → cola pendiente real en `localStorage` →
// alta o inicio de sesión REALES contra el Supabase local → reconciliación →
// escritura en `pedidos` bajo las políticas de verdad → lectura desde la
// interfaz.
//
// NO atraviesa un pago: el cobro sigue siendo simulado, como en todo el
// prototipo, y el contenido del pedido lo compone el cliente. Lo que esta PR
// protege es **de quién es** el pedido, no que su precio esté validado por
// servidor.
//
// La clave de servicio se usa sólo para montar y limpiar, nunca para la acción
// que se está probando.
// ============================================================================

const URL = process.env.VITE_SUPABASE_URL
const SERVICE = process.env.RLS_TEST_SERVICE_KEY
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const configurado = Boolean(URL && SERVICE && ANON)

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
  if (!configurado) return
  const admin = servicio()
  if (usuariosCreados.length === 0) return
  await admin.from('pedidos').delete().in('cliente_id', usuariosCreados)
  await admin.from('reservas').delete().in('cliente_id', usuariosCreados)
  await admin.from('clientes').delete().in('id', usuariosCreados)
  // El orden importa: `visitantes.auth_id` bloquea el borrado del usuario si se
  // intenta al revés. Mismo patrón que `tests/rls/politicas.spec.ts`.
  await admin.from('visitantes').delete().in('auth_id', usuariosCreados)
  for (const uid of usuariosCreados) await admin.auth.admin.deleteUser(uid)
})

/** Una cuenta ya existente en el Supabase local, creada por la vía de servicio. */
async function cuenta(etiqueta: string) {
  const email = `invitado-${RUN}-${etiqueta}@example.test`
  const password = `Invitado-${RUN}-segura`
  const { data, error } = await servicio().auth.admin.createUser({ email, password, email_confirm: true })
  expect(error, 'la cuenta de prueba debe crearse').toBeNull()
  usuariosCreados.push(data.user!.id)
  return { email, password, uid: data.user!.id }
}

async function comoNavegador(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
}

/** Compra un iPhone recorriendo el checkout de verdad, sin identificarse. */
async function comprarComoInvitado(page: Page) {
  await page.goto('./iphone/17-pro/256gb-plata')
  await page
    .getByRole('button', { name: /Añadir a la cesta|Añadir al carrito/i })
    .first()
    .click()
  await page.goto('./checkout/1')

  await page.getByLabel('Nombre y apellidos').fill('Compradora Invitada')
  await page.getByLabel('Email').fill(`invitada-${RUN}@example.test`)
  await page.getByLabel('Dirección').fill('Calle de Prueba 1')
  await page
    .getByRole('button', { name: /Continuar|Siguiente/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/checkout\/2/, { timeout: 15_000 })
  await page
    .getByRole('button', { name: /Confirmar|Pagar/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/checkout\/3/, { timeout: 20_000 })

  const pendientes = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]'))
  expect(pendientes, 'la compra sin cuenta queda esperando').toHaveLength(1)
  return pendientes[0].order.id as string
}

/** Recorre el checkout con la sesión ya iniciada. */
async function comprarConSesion(page: Page) {
  await page.goto('./iphone/17-pro/256gb-plata')
  await page
    .getByRole('button', { name: /Añadir a la cesta|Añadir al carrito/i })
    .first()
    .click()
  await page.goto('./checkout/1')
  // La cuenta de prueba se crea por la vía de servicio y no tiene ficha de
  // cliente, así que el checkout no prerrellena nada: se escribe como siempre.
  await page.getByLabel('Nombre y apellidos').fill('Compradora Con Sesión')
  await page.getByLabel('Email').fill(`consesion-${RUN}@example.test`)
  await page.getByLabel('Dirección').fill('Calle de Prueba 1')
  await page
    .getByRole('button', { name: /Continuar|Siguiente/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/checkout\/2/, { timeout: 15_000 })
  await page
    .getByRole('button', { name: /Confirmar|Pagar/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/checkout\/3/, { timeout: 20_000 })
}

/** Inicia sesión por la interfaz, que es como lo haría una persona. */
async function identificarse(page: Page, email: string, password: string) {
  await page.goto('./login')
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('form').first().getByRole('button').first().click()
  await expect(page).toHaveURL(/\/cuenta|\/checkout\/3/, { timeout: 20_000 })
}

/** Los pedidos que el SERVIDOR tiene para esa cuenta. */
async function pedidosDe(uid: string) {
  const { data } = await servicio().from('pedidos').select('id, cliente_id, lines').eq('cliente_id', uid)
  return data ?? []
}

/** Espera a que la cola local quede vacía, que es la señal de éxito confirmado. */
async function esperarReconciliacion(page: Page) {
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]').length), {
      timeout: 20_000,
      message: 'la compra pendiente debe consumirse tras sincronizarse',
    })
    .toBe(0)
}

test('la compra invitada acaba en la cuenta, y se recupera desde otro dispositivo', async ({ page, browser }) => {
  const { email, password, uid } = await cuenta('a')
  await comoNavegador(page)
  const pedidoId = await comprarComoInvitado(page)

  // Todavía NO está en el servidor: nadie la ha reclamado.
  expect(await pedidosDe(uid), 'sin identificarse, la compra no llega a la tabla').toHaveLength(0)

  // Cerrar y reabrir el navegador conservando el almacenamiento: es el caso que
  // motivó mover la cola de `sessionStorage` a `localStorage`.
  const estado = await page.context().storageState()
  await page.context().close()
  const reabierto = await browser.newContext({ storageState: estado })
  const segunda = await reabierto.newPage()

  await identificarse(segunda, email, password)
  await esperarReconciliacion(segunda)

  const filas = await pedidosDe(uid)
  expect(filas, 'exactamente un pedido, y suyo').toHaveLength(1)
  expect(filas[0].id).toBe(pedidoId)
  expect(filas[0].cliente_id).toBe(uid)

  // Y se ve en las dos superficies de la interfaz.
  await segunda.goto('./cuenta?apartado=pedidos')
  await expect(segunda.getByText(pedidoId)).toBeVisible()
  await segunda.goto('./mis-productos')
  await expect(segunda.locator('article')).toHaveCount(1)
  await expect(segunda.locator('article').first().getByRole('heading', { name: 'iPhone 17 Pro' })).toBeVisible()

  // OTRO DISPOSITIVO: contexto nuevo, sin nada guardado. Si la compra sólo
  // viviera en el almacenamiento local, aquí no habría nada.
  const otroDispositivo = await browser.newContext()
  const tercera = await otroDispositivo.newPage()
  await comoNavegador(tercera)
  await identificarse(tercera, email, password)
  await tercera.goto('./mis-productos')
  await expect(tercera.locator('article'), 'la compra viene del servidor, no del navegador').toHaveCount(1)
  await tercera.goto('./cuenta?apartado=pedidos')
  await expect(tercera.getByText(pedidoId)).toBeVisible()

  await reabierto.close()
  await otroDispositivo.close()
})

test('darse de alta también recupera la compra', async ({ page }) => {
  await comoNavegador(page)
  const pedidoId = await comprarComoInvitado(page)

  const email = `alta-${RUN}@example.test`
  const password = `Alta-${RUN}-segura`
  await page.goto('./registro')
  await page.getByLabel('Nombre y apellidos').fill('Alta Invitada')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  // El alta local devuelve sesión directamente; si el proyecto activara la
  // confirmación por correo, esta espera fallaría en vez de fingir que la
  // reconciliación ocurrió al pulsar el botón.
  await expect(page).toHaveURL(/\/cuenta/, { timeout: 20_000 })

  const { data } = await servicio().auth.admin.listUsers()
  const uid = data.users.find((u) => u.email === email)?.id
  expect(uid, 'la cuenta recién creada existe').toBeTruthy()
  usuariosCreados.push(uid!)

  await esperarReconciliacion(page)
  const filas = await pedidosDe(uid!)
  expect(filas).toHaveLength(1)
  expect(filas[0].id).toBe(pedidoId)
})

test('la sesión anónima del chat no reclama nada', async ({ page }) => {
  // EL CASO QUE ESTO IMPIDE
  //
  // El chat abre sesiones anónimas con el MISMO cliente de Supabase. Si la
  // reconciliación se disparara con cualquier `session`, la compra se subiría a
  // nombre de un visitante anónimo.
  await comoNavegador(page)
  const pedidoId = await comprarComoInvitado(page)

  const anonimo = await page.evaluate(
    async ([url, anon]) => {
      const { createClient } = await import(/* @vite-ignore */ 'https://esm.sh/@supabase/supabase-js@2')
      const sb = createClient(url, anon)
      const { data } = await sb.auth.signInAnonymously()
      return data.session?.user.id ?? null
    },
    [URL!, ANON!] as const,
  )

  // Si el entorno no permite abrir la sesión anónima desde la página, se siembra
  // igualmente el evento de auth recargando: lo que importa es que, sin cuenta
  // permanente, nada se mueva.
  await page.goto('./')
  await page.waitForTimeout(1500)

  const pendientes = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]'))
  expect(pendientes, 'la compra sigue esperando').toHaveLength(1)
  expect(pendientes[0].claimedBy, 'una sesión anónima no puede reclamarla').toBeUndefined()

  if (anonimo) {
    const { data } = await servicio().from('pedidos').select('id').eq('id', pedidoId)
    expect(data ?? [], 'no se ha escrito ningún pedido').toHaveLength(0)
  }

  // Y con una cuenta de verdad sí se recupera.
  const { email, password, uid } = await cuenta('anon')
  await identificarse(page, email, password)
  await esperarReconciliacion(page)
  expect(await pedidosDe(uid)).toHaveLength(1)
})

test('dos reconciliaciones a la vez dejan un solo pedido', async ({ page, browser }) => {
  const { email, password, uid } = await cuenta('carrera')
  await comoNavegador(page)
  const pedidoId = await comprarComoInvitado(page)

  // LA CARRERA DE VERDAD, Y POR QUÉ SE MONTA ASÍ
  //
  // El estado se captura AHORA, con la compra todavía pendiente. Si se capturara
  // después de identificarse, la primera pestaña ya habría consumido la cola y
  // la segunda no encontraría nada: la prueba pasaría sin haber competido nunca.
  // Se comprobó, y con esa versión una mutación que duplica pedidos seguía en
  // verde.
  //
  // Con dos contextos que arrancan con la MISMA compra pendiente y la MISMA
  // cuenta, los dos intentan insertar el mismo identificador. Uno gana; el otro
  // recibe el conflicto de clave y tiene que resolverlo preguntando de quién es
  // el pedido, no inventándose otro.
  const conLaCompra = await page.context().storageState()
  await page.context().close()

  const uno = await browser.newContext({ storageState: conLaCompra })
  const dos = await browser.newContext({ storageState: conLaCompra })
  const p1 = await uno.newPage()
  const p2 = await dos.newPage()

  for (const p of [p1, p2]) {
    const pendientes = await p
      .goto('./')
      .then(() => p.evaluate(() => JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]').length))
    expect(pendientes, 'las dos arrancan con la compra pendiente delante').toBe(1)
  }

  await Promise.all([identificarse(p1, email, password), identificarse(p2, email, password)])
  await esperarReconciliacion(p1)
  await esperarReconciliacion(p2)

  const filas = await pedidosDe(uid)
  expect(filas, 'una sola fila, pese a que las dos intentaron escribirla').toHaveLength(1)
  expect(filas[0].id).toBe(pedidoId)

  await uno.close()
  await dos.close()
})

test('otra cuenta del mismo navegador no hereda la compra', async ({ page }) => {
  const a = await cuenta('duenya')
  const b = await cuenta('intrusa')
  await comoNavegador(page)
  const pedidoId = await comprarComoInvitado(page)

  await identificarse(page, a.email, a.password)
  await esperarReconciliacion(page)
  expect(await pedidosDe(a.uid), 'la compra es de A').toHaveLength(1)

  // A cierra sesión y entra B en el MISMO navegador.
  await page.goto('./cuenta')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/pagina-banana\/$/, { timeout: 20_000 })
  await identificarse(page, b.email, b.password)
  await page.waitForTimeout(2000)

  expect(await pedidosDe(b.uid), 'B no recibe la compra de A').toHaveLength(0)
  await page.goto('./mis-productos')
  await expect(page.locator('article'), 'B no la ve en Mis productos').toHaveCount(0)
  await page.goto('./cuenta?apartado=pedidos')
  await expect(page.getByText(pedidoId), 'B no la ve en Mis pedidos').toHaveCount(0)

  // Y el servidor sigue teniendo un único propietario.
  const { data } = await servicio().from('pedidos').select('cliente_id').eq('id', pedidoId)
  expect(data).toHaveLength(1)
  expect(data![0].cliente_id).toBe(a.uid)
})

test('un fallo de red deja la compra para su dueño, no para la siguiente cuenta', async ({ page }) => {
  const a = await cuenta('fallo-a')
  const b = await cuenta('fallo-b')
  await comoNavegador(page)
  const pedidoId = await comprarComoInvitado(page)

  // A empieza, pero la escritura falla. El pendiente queda reclamado por A.
  await page.route('**/rest/v1/pedidos*', (ruta) =>
    ruta.request().method() === 'POST' ? ruta.abort('failed') : ruta.continue(),
  )
  await identificarse(page, a.email, a.password)
  await expect
    .poll(
      () => page.evaluate(() => JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]')[0]?.claimedBy),
      {
        timeout: 20_000,
      },
    )
    .toBe(a.uid)
  expect(await pedidosDe(a.uid), 'no se llegó a escribir').toHaveLength(0)

  // B entra en el mismo navegador. El bloqueo de red se levanta DESPUÉS de
  // cerrar la sesión de A: si se levantara antes, A completaría su reintento
  // durante el propio cierre y la compra dejaría de estar pendiente, con lo que
  // esta prueba no comprobaría nada. Pasó, y así se descubrió.
  await page.goto('./cuenta')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/pagina-banana\/$/, { timeout: 20_000 })
  await page.unroute('**/rest/v1/pedidos*')
  await identificarse(page, b.email, b.password)

  // No vale una espera fija: si B pudiera quedarse la compra, tardaría lo que
  // tarde el insert y una espera corta lo taparía. Se vigila el dato que
  // cambiaría —el reclamo— y se le da tiempo de sobra para hacerlo mal.
  await expect
    .poll(
      () => page.evaluate(() => JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]')[0]?.claimedBy),
      { timeout: 8_000, message: 'el reclamo de A no puede pasar a B' },
    )
    .toBe(a.uid)
  expect(await pedidosDe(b.uid), 'la compra reclamada por A no es de B').toHaveLength(0)

  // A vuelve y sí la recupera.
  await page.goto('./cuenta')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/pagina-banana\/$/, { timeout: 20_000 })
  await identificarse(page, a.email, a.password)
  await esperarReconciliacion(page)
  const filas = await pedidosDe(a.uid)
  expect(filas, 'A reintenta y la recupera').toHaveLength(1)
  expect(filas[0].id).toBe(pedidoId)
})

test('un cliente no puede escribir un pedido a nombre de otro', async ({ page }) => {
  // Con el cliente NORMAL, el mismo que usa la aplicación. Nada de clave de
  // servicio aquí: lo que se prueba es la política, y la clave de servicio se la
  // salta por definición.
  const a = await cuenta('rls-a')
  const b = await cuenta('rls-b')
  await comoNavegador(page)
  await page.goto('./')

  const resultado = await page.evaluate(
    async ([url, anon, email, password, ajeno]) => {
      const { createClient } = await import(/* @vite-ignore */ 'https://esm.sh/@supabase/supabase-js@2')
      const sb = createClient(url, anon)
      await sb.auth.signInWithPassword({ email, password })
      const { error } = await sb.from('pedidos').insert({
        id: `BC-INTRUSO${Date.now().toString(16).slice(-4).toUpperCase()}`,
        cliente_id: ajeno,
        created_at: new Date().toISOString(),
        delivery: 'envio',
        payment_method: 'tarjeta',
        products_total: 1,
        insurance_total: 0,
        insured_units: 0,
        lines: [],
        status: 'demo',
      })
      return error ? { denegado: true, mensaje: error.message } : { denegado: false, mensaje: '' }
    },
    [URL!, ANON!, a.email, a.password, b.uid] as const,
  )

  expect(resultado.denegado, `A no puede insertar a nombre de B: ${resultado.mensaje}`).toBe(true)
  expect(await pedidosDe(b.uid), 'B no tiene ningún pedido ajeno').toHaveLength(0)
})

test('el dueño lo pone la sesión, no el pedido guardado', async ({ page }) => {
  // MANIPULAR LA COLA LOCAL NO SIRVE DE NADA
  //
  // Alguien con acceso a su propio navegador puede escribir lo que quiera en
  // `localStorage`. Lo que no puede es decidir de quién es el pedido: el
  // `cliente_id` sale de la sesión en curso, y aunque el código lo tomara de
  // otro sitio, la política `cliente crea sus pedidos` exige
  // `cliente_id = auth.uid()` en su `with check`.
  //
  // Se exigen las dos mitades. Que B no reciba nada lo garantiza el servidor
  // aunque el cliente se equivoque; que A SÍ la reciba es lo que demuestra que
  // el código está usando la sesión y no el dato manipulado.
  const a = await cuenta('dueno-a')
  const b = await cuenta('dueno-b')
  await comoNavegador(page)
  const pedidoId = await comprarComoInvitado(page)

  await page.evaluate((ajeno) => {
    const lista = JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]')
    lista[0].order.clienteId = ajeno
    localStorage.setItem('banana:pending-guest-orders', JSON.stringify(lista))
  }, b.uid)

  await identificarse(page, a.email, a.password)
  await esperarReconciliacion(page)

  expect(await pedidosDe(b.uid), 'nada puede acabar a nombre de B').toHaveLength(0)
  const deA = await pedidosDe(a.uid)
  expect(deA, 'la compra es de quien tiene la sesión').toHaveLength(1)
  expect(deA[0].id).toBe(pedidoId)
})

test('un fallo de LECTURA no convierte el reintento en un segundo pedido', async ({ page }) => {
  // EL FALLO QUE ESTO VIGILA
  //
  // Comprobar «¿este pedido ya es mío?» sólo puede responder dos cosas si se
  // mira el dato y se ignora el error: hay fila, o no la hay. Pero hay una
  // tercera —no se pudo leer— y confundirla con «no la hay» tenía consecuencia:
  // tras un conflicto de clave, un corte de red se habría interpretado como
  // «ese identificador es de otra persona», y la respuesta a eso es renombrar la
  // compra e insertarla otra vez. Un corte de red duplicaba el pedido.
  //
  // El montaje reproduce el estado real que lo provoca: la fila YA está escrita
  // —el insert anterior salió bien y la aplicación cayó antes de vaciar la
  // cola— y las lecturas fallan.
  const a = await cuenta('lectura')
  await comoNavegador(page)
  const pedidoId = await comprarComoInvitado(page)

  // La fila ya existe, a nombre de A.
  const { error } = await servicio().from('pedidos').insert({
    id: pedidoId,
    cliente_id: a.uid,
    created_at: new Date().toISOString(),
    delivery: 'envio',
    payment_method: 'tarjeta',
    products_total: 1229,
    insurance_total: 0,
    insured_units: 0,
    lines: [],
    status: 'demo',
  })
  expect(error, 'el montaje debe poder escribir la fila previa').toBeNull()

  // Las LECTURAS de pedidos fallan; las escrituras se dejan pasar, que es lo que
  // hace peligroso el caso.
  //
  // Se cuentan las escrituras, y ésa es la aserción exacta: sin poder leer, el
  // código NO debe escribir. Contar filas al final no serviría —ya hay una, así
  // que una comprobación de «hay una» acierta al primer intento y nunca llega a
  // ver la segunda—. Se comprobó: con esa versión la contramutación seguía en
  // verde.
  let escrituras = 0
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().includes('/rest/v1/pedidos')) escrituras++
  })
  // Se responde 500 a las lecturas en vez de cortar la conexión: es la forma en
  // que llega un fallo de PostgREST o de RLS, y la que devuelve `{ error }` en
  // lugar de lanzar. Con un `abort`, el cliente lanza y el `insert` no se
  // alcanza nunca —lo comprobé, y la contramutación se quedaba en verde por ese
  // motivo, no porque el código estuviera bien—.
  await page.route('**/rest/v1/pedidos*', (ruta) =>
    ruta.request().method() === 'GET'
      ? ruta.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"caída"}' })
      : ruta.continue(),
  )
  await identificarse(page, a.email, a.password)

  // Se espera a que la reconciliación haya HECHO algo: reclamar la compra, o
  // escribir. La condición incluye las dos porque un código roto puede llegar a
  // escribir y vaciar la cola, y si sólo se vigilara el reclamo, la espera
  // fallaría por el motivo equivocado y el mensaje no diría lo que pasó.
  await expect
    .poll(
      async () => {
        const reclamo = await page.evaluate(
          () => JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]')[0]?.claimedBy,
        )
        return Boolean(reclamo) || escrituras > 0
      },
      { timeout: 15_000, message: 'la reconciliación debe haberlo intentado' },
    )
    .toBe(true)

  expect(escrituras, 'sin poder leer, no se escribe a ciegas').toBe(0)
  expect(await pedidosDe(a.uid), 'y sigue habiendo un solo pedido').toHaveLength(1)

  const pendiente = await page.evaluate(
    () => JSON.parse(localStorage.getItem('banana:pending-guest-orders') ?? '[]')[0],
  )
  expect(pendiente, 'sin poder confirmar, la compra sigue en la cola').toBeTruthy()
  expect(pendiente.claimedBy, 'reclamada por quien lo intentó').toBe(a.uid)
  expect(pendiente.order.id, 'y conserva su identificador: no se renombra a ciegas').toBe(pedidoId)
  expect(pendiente.claimedBy, 'reclamada por quien lo intentó').toBe(a.uid)

  // Restaurada la lectura, el reintento reconoce que la fila ya es suya.
  await page.unroute('**/rest/v1/pedidos*')
  await page.reload()
  await esperarReconciliacion(page)

  const filas = await pedidosDe(a.uid)
  expect(filas, 'sigue habiendo exactamente una').toHaveLength(1)
  expect(filas[0].id, 'y es la de siempre').toBe(pedidoId)
})

test('una sincronización lenta acaba retirando el aviso de la confirmación', async ({ page }) => {
  // El aviso se refrescaba con un sondeo que se cortaba a los cinco segundos:
  // una sincronización más lenta terminaba bien y dejaba en pantalla un aviso
  // que ya no era cierto. Ahora la cola avisa cuando cambia.
  const a = await cuenta('lenta')
  await comoNavegador(page)
  await comprarComoInvitado(page)
  await expect(page.getByText('Guarda esta compra en tu cuenta')).toBeVisible()

  // Se retrasa la escritura MÁS de cinco segundos, y luego se deja pasar.
  await page.route('**/rest/v1/pedidos*', async (ruta) => {
    if (ruta.request().method() === 'POST') await new Promise((resolve) => setTimeout(resolve, 7000))
    await ruta.continue()
  })

  // Sin recargar y sin cambiar de sesión: se inicia sesión desde la propia
  // confirmación, que es el camino que ofrece la pantalla.
  await page.getByRole('link', { name: 'Iniciar sesión' }).click()
  await page.locator('input[type="email"]').first().fill(a.email)
  await page.locator('input[type="password"]').first().fill(a.password)
  await page.locator('form').first().getByRole('button').first().click()
  // Se aterriza en la confirmación por el `?redirect=`, sin recargar a mano: un
  // `goto` aquí cancelaría el POST en vuelo y falsearía la espera.
  await expect(page).toHaveURL(/\/checkout\/3/, { timeout: 20_000 })

  await expect(page.getByText('Guarda esta compra en tu cuenta'), 'el aviso desaparece al guardarse').toHaveCount(0, {
    timeout: 30_000,
  })
  expect(await pedidosDe(a.uid)).toHaveLength(1)
})

test('con la sesión abierta y el espejo caído, la confirmación no dice que se guardó', async ({ page }) => {
  // Una compra hecha CON sesión no entra en la cola: se escribe en el checkout.
  // Si esa escritura falla, el checkout ignora el error a propósito para no
  // bloquear la confirmación. La pantalla se quedaba entonces sin pendiente y
  // con sesión, que era justo el estado que leía como éxito.
  const a = await cuenta('espejo')
  await comoNavegador(page)
  await identificarse(page, a.email, a.password)

  await page.route('**/rest/v1/pedidos*', (ruta) =>
    ruta.request().method() === 'POST' ? ruta.abort('failed') : ruta.continue(),
  )
  await comprarConSesion(page)

  expect(await pedidosDe(a.uid), 'el espejo falló, no hay pedido').toHaveLength(0)
  await expect(page.getByText(/ya está guardada en tu cuenta/i), 'no se puede afirmar lo que no ocurrió').toHaveCount(0)
  await expect(
    page.getByText(/Guarda esta compra en tu cuenta/),
    'ni ofrecer guardar lo que no está en la cola',
  ).toHaveCount(0)
})
