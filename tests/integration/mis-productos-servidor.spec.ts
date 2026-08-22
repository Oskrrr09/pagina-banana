import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// «Mis productos» contra un Supabase de verdad.
//
// QUÉ HUECO CIERRA ESTA SUITE
//
// Ya existían dos capas de cobertura y ninguna tocaba el servidor:
// `tests/unit/my-products.test.ts` prueba la proyección como función pura, y
// `tests/e2e-prefs/mis-productos.spec.ts` prueba la pantalla interceptando la
// respuesta de Supabase. Las dos son buenas, y las dos podrían seguir en verde
// con la consulta rota: nadie comprobaba que un pedido escrito en la base
// aparezca en la pantalla del cliente que lo compró —y sólo en la suya—.
//
// Aquí la cuenta se crea por la interfaz de registro, así que la sesión es real
// y permanente; los pedidos se siembran con la clave de servicio, que es
// montaje; y la LECTURA la hace el navegador con el `anon` y la sesión del
// cliente, atravesando las políticas de verdad.
//
// La clave de servicio no entra en el bundle: la recibe el proceso de pruebas.
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
const pedidosCreados: string[] = []
const usuariosCreados: string[] = []

test.afterAll(async () => {
  if (!configurado) return
  const admin = servicio()
  if (pedidosCreados.length > 0) await admin.from('pedidos').delete().in('id', pedidosCreados)
  await admin.from('reservas').delete().in('cliente_id', usuariosCreados)
  // El orden importa, y está aprendido: `visitantes.auth_id` bloquea el borrado
  // del usuario si se intenta al revés. Es el mismo patrón que usa
  // `tests/rls/politicas.spec.ts`.
  if (usuariosCreados.length > 0) {
    await admin.from('visitantes').delete().in('auth_id', usuariosCreados)
    for (const uid of usuariosCreados) await admin.auth.admin.deleteUser(uid)
  }
})

/** Una línea de dispositivo, con la identidad completa que guarda el checkout. */
function linea(extra: Record<string, unknown> = {}) {
  return {
    id: 'iphone/17-pro/plata/256GB',
    family: 'iphone',
    modelSlug: '17-pro',
    kind: 'device',
    colorSlug: 'plata',
    name: 'iPhone 17 Pro',
    color: 'Plata',
    capacity: '256GB',
    price: 1229,
    qty: 1,
    insured: false,
    ...extra,
  }
}

async function sembrarPedido(clienteId: string, id: string, lines: unknown[], createdAt: string) {
  const fila = {
    id,
    cliente_id: clienteId,
    created_at: createdAt,
    delivery: 'envio',
    payment_method: 'tarjeta',
    financing_months: null,
    products_total: 0,
    insurance_total: 0,
    insured_units: 0,
    lines,
    status: 'demo',
  }
  const { error } = await servicio().from('pedidos').insert(fila)
  expect(error, `el pedido ${id} debe poder sembrarse`).toBeNull()
  pedidosCreados.push(id)
}

/** Se registra por la interfaz: la cuenta y su sesión son las de un cliente. */
async function registrarse(page: import('@playwright/test').Page, etiqueta: string) {
  const email = `productos-${RUN}-${etiqueta}@example.test`
  const password = `Productos-${RUN}-segura`

  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
  await page.goto('./registro')
  await page.getByLabel('Nombre y apellidos').fill('Cliente de prueba')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/cuenta$/, { timeout: 15_000 })

  const { data } = await servicio().auth.admin.listUsers()
  const uid = data.users.find((u) => u.email === email)?.id
  expect(uid, 'la cuenta recién creada debe existir en Auth').toBeTruthy()
  usuariosCreados.push(uid!)
  return { email, uid: uid! }
}

const tarjetas = (page: import('@playwright/test').Page) => page.locator('article')

test('un pedido del cliente aparece con la variante que compró', async ({ page }) => {
  const { uid } = await registrarse(page, 'a1')
  await sembrarPedido(uid, `PROD-${RUN}-1`, [linea()], '2026-08-10T10:00:00.000Z')

  await page.goto('./mis-productos')
  await expect(page.getByRole('heading', { level: 1, name: 'Mis productos' })).toBeVisible()

  // Una tarjeta, y las aserciones colgando de ELLA: si mañana aparecieran dos,
  // un `getByText` suelto podría estar leyendo la otra.
  await expect(tarjetas(page)).toHaveCount(1)
  const tarjeta = tarjetas(page).first()
  await expect(tarjeta.getByRole('heading', { level: 3, name: 'iPhone 17 Pro' })).toBeVisible()
  await expect(tarjeta.getByText('Plata · 256GB')).toBeVisible()
  await expect(tarjeta.getByText(/Comprado el 10 de agosto de 2026/)).toBeVisible()
  await expect(tarjeta.getByText(`Pedido PROD-${RUN}-1`)).toBeVisible()

  // Y el enlace lleva a esa variante exacta, no a otra que también exista.
  const enlace = tarjeta.getByRole('link', { name: /Ver producto/ })
  await expect(enlace).toHaveCount(1)
  await expect(enlace).toHaveAttribute('href', '/pagina-banana/iphone/17-pro/256gb-plata')
})

test('dos unidades son una tarjeta que lo dice, y dos pedidos son dos tarjetas', async ({ page }) => {
  const { uid } = await registrarse(page, 'a2')
  // El MISMO SKU en dos pedidos distintos: probablemente dos aparatos, así que
  // no se colapsan. Y una línea con `qty: 2` no se parte en dos tarjetas.
  await sembrarPedido(uid, `PROD-${RUN}-2A`, [linea({ qty: 2 })], '2026-08-11T10:00:00.000Z')
  await sembrarPedido(uid, `PROD-${RUN}-2B`, [linea()], '2026-08-12T10:00:00.000Z')

  await page.goto('./mis-productos')
  await expect(tarjetas(page)).toHaveCount(2)

  const conDos = tarjetas(page).filter({ hasText: `PROD-${RUN}-2A` })
  await expect(conDos).toHaveCount(1)
  await expect(conDos.getByText(/2 unidades/)).toBeVisible()

  const conUna = tarjetas(page).filter({ hasText: `PROD-${RUN}-2B` })
  await expect(conUna).toHaveCount(1)
  await expect(conUna.getByText(/unidades/), 'con una unidad no se anuncia cantidad').toHaveCount(0)
})

test('el pedido de otro cliente no se ve', async ({ page, browser }) => {
  const { uid: ajeno } = await registrarse(page, 'b1')
  await sembrarPedido(ajeno, `PROD-${RUN}-AJENO`, [linea()], '2026-08-09T10:00:00.000Z')

  // Contexto nuevo, cliente nuevo: nada compartido con el anterior.
  const contexto = await browser.newContext()
  const otra = await contexto.newPage()
  const { uid: propio } = await registrarse(otra, 'b2')
  await sembrarPedido(propio, `PROD-${RUN}-PROPIO`, [linea()], '2026-08-09T11:00:00.000Z')

  await otra.goto('./mis-productos')
  await expect(tarjetas(otra)).toHaveCount(1)
  await expect(tarjetas(otra).first().getByText(`Pedido PROD-${RUN}-PROPIO`)).toBeVisible()
  await expect(otra.getByText(`PROD-${RUN}-AJENO`), 'el pedido ajeno no puede aparecer').toHaveCount(0)
  await contexto.close()
})

test('una reserva no produce producto', async ({ page }) => {
  const { uid } = await registrarse(page, 'c1')
  const { error } = await servicio().from('reservas').insert({
    cliente_id: uid,
    family: 'iphone',
    model_slug: '17-pro',
    variant_label: 'Plata · 256GB',
    model_name: 'iPhone 17 Pro',
    price: 1229,
    estado: 'disponible',
  })
  expect(error, 'la reserva debe poder sembrarse').toBeNull()

  await page.goto('./mis-productos')
  // Reserva ≠ propiedad: la pantalla se queda vacía, y lo dice sin insinuar
  // que el cliente no haya comprado nunca.
  await expect(tarjetas(page)).toHaveCount(0)
  await expect(page.getByText('No hay dispositivos en tus compras')).toBeVisible()
})

test('desde aquí se llega a Mis pedidos, que es donde están los accesorios', async ({ page }) => {
  const { uid } = await registrarse(page, 'd1')
  // Un pedido de SÓLO accesorios: existe la compra y no hay dispositivos. Es
  // justamente el caso que hacía ambiguo el rótulo anterior.
  await sembrarPedido(
    uid,
    `PROD-${RUN}-ACC`,
    [linea({ kind: 'accessory', family: 'accesorios', name: 'Cargador MagSafe · 1 m' })],
    '2026-08-13T10:00:00.000Z',
  )

  await page.goto('./mis-productos')
  await expect(tarjetas(page)).toHaveCount(0)
  await expect(page.getByText('No hay dispositivos en tus compras')).toBeVisible()

  // DOS accesos, y son dos a propósito: uno en la cabecera y otro dentro del
  // estado vacío, que es donde está mirando quien no tiene dispositivos. Se
  // exige la cardinalidad ANTES de pulsar: con `.first()` a secas, perder uno
  // de los dos dejaba el test en verde porque el otro seguía respondiendo.
  const aPedidos = page.getByRole('link', { name: 'Ver mis pedidos' })
  await expect(aPedidos, 'cabecera y estado vacío ofrecen la salida a Mis pedidos').toHaveCount(2)
  // Ya protegida la cardinalidad, pulsar uno de dos destinos idénticos es
  // deliberado y no esconde nada.
  await aPedidos.first().click()
  await expect(page).toHaveURL(/\/cuenta\/pedidos$/)
  // Y el accesorio sí está allí: la compra no se ha perdido, sólo no es un
  // dispositivo.
  await expect(page.getByText('Cargador MagSafe · 1 m')).toBeVisible()
})
