import { expect, test, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// CUENTA NAVEGA COMO UNA SUPERFICIE REAL.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// Antes el apartado visible salía de un `useState` sembrado UNA vez desde la
// URL. `/cuenta?apartado=pedidos` abría Pedidos, se pulsaba Reservas, la
// pantalla cambiaba… y la URL seguía diciendo `pedidos`. Es decir: copiar el
// enlace daba otro sitio, Atrás no volvía al apartado anterior y el enlace
// profundo dejaba de ser cierto en cuanto se tocaba el menú.
//
// POR QUÉ ESTO ES INTEGRACIÓN Y NO E2E DE NAVEGADOR
//
// `/cuenta` no se monta sin Supabase configurado —enseña su pantalla de «esto
// necesita Supabase»—, y el build de las suites de navegador corre a propósito
// sin credenciales. Así que la navegación se prueba donde hay sesión de verdad,
// que además permite comprobar de paso lo que sólo el servidor puede decir:
// que el perfil persiste, y qué se ve cuando una lectura falla.
//
// La clave de servicio se usa sólo para montar y limpiar, nunca para la acción
// que se está probando.
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
  await admin.from('reservas').delete().in('cliente_id', usuariosCreados)
  await admin.from('clientes').delete().in('id', usuariosCreados)
  // El orden importa: `visitantes.auth_id` bloquea el borrado del usuario si se
  // intenta al revés. Mismo patrón que `tests/rls/politicas.spec.ts`.
  await admin.from('visitantes').delete().in('auth_id', usuariosCreados)
  for (const uid of usuariosCreados) await admin.auth.admin.deleteUser(uid)
})

/** Los siete apartados, en el orden en que se pintan. */
const APARTADOS = [
  { id: 'datos', label: 'Datos personales', titulo: 'Datos personales' },
  { id: 'envio', label: 'Dirección de envío', titulo: 'Dirección de envío' },
  { id: 'facturacion', label: 'Dirección de facturación', titulo: 'Dirección de facturación' },
  { id: 'pedidos', label: 'Mis pedidos', titulo: 'Mis pedidos' },
  { id: 'reservas', label: 'Mis reservas', titulo: 'Mis reservas' },
  { id: 'descuento', label: 'Descuento educativo', titulo: 'Descuento educativo' },
  { id: 'favoritos', label: 'Favoritos y tienda', titulo: 'Favoritos y tienda' },
] as const

/**
 * Una cuenta con correo deliberadamente largo.
 *
 * El correo es el dato que dice con qué cuenta estás dentro, y en móvil competía
 * por el ancho con «Cerrar sesión». Uno corto no habría enseñado el problema.
 */
async function cuenta(etiqueta: string) {
  const email = `cuenta-larga-de-prueba-${RUN}-${etiqueta}@dominio-bastante-largo.example.test`
  const password = `Cuenta-${RUN}-segura`
  const { data, error } = await servicio().auth.admin.createUser({ email, password, email_confirm: true })
  expect(error, 'la cuenta de prueba debe crearse').toBeNull()
  usuariosCreados.push(data.user!.id)
  return { email, password, uid: data.user!.id }
}

async function identificarse(page: Page, email: string, password: string) {
  await page.addInitScript(() => localStorage.setItem('banana:favorite-store-prompt', 'dismissed'))
  await page.goto('./login')
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('form').first().getByRole('button').first().click()
  await expect(page).toHaveURL(/\/cuenta/, { timeout: 20_000 })
}

const menu = (page: Page) => page.getByRole('navigation', { name: 'Apartados de mi cuenta' })
const activo = (page: Page) => menu(page).getByRole('link').and(page.locator('[aria-current="page"]'))
const seccion = (page: Page, titulo: string) => page.getByRole('heading', { level: 2, name: titulo })

async function sembrarPedido(uid: string, id: string) {
  const { error } = await servicio()
    .from('pedidos')
    .insert({
      id,
      cliente_id: uid,
      created_at: '2026-08-12T10:00:00.000Z',
      delivery: 'envio',
      payment_method: 'tarjeta',
      products_total: 1229,
      insurance_total: 0,
      insured_units: 0,
      status: 'demo',
      lines: [
        {
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
        },
      ],
    })
  expect(error, 'el pedido de montaje debe poder sembrarse').toBeNull()
}

test.describe('la URL manda', () => {
  test('los siete apartados son enlaces y sólo uno está activo', async ({ page }) => {
    const a = await cuenta('menu')
    await identificarse(page, a.email, a.password)

    // La cardinalidad primero: el resto de la suite se apoya en que son siete.
    await expect(menu(page).getByRole('link'), 'siete apartados, ni uno más').toHaveCount(7)
    await expect(activo(page), 'exactamente uno activo').toHaveCount(1)
    await expect(activo(page)).toHaveText('Datos personales')
  })

  test('un enlace profundo abre su apartado y lo marca', async ({ page }) => {
    const a = await cuenta('deep')
    await identificarse(page, a.email, a.password)

    for (const { id, label, titulo } of APARTADOS) {
      await page.goto(id === 'datos' ? './cuenta' : `./cuenta?apartado=${id}`)
      await expect(seccion(page, titulo), id).toBeVisible()
      await expect(activo(page), id).toHaveText(label)
    }
  })

  test('pulsar un apartado cambia la URL, no sólo la pantalla', async ({ page }) => {
    // ÉSTE ES EL FALLO QUE MOTIVÓ LA PR.
    const a = await cuenta('url')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=pedidos')
    await expect(page).toHaveURL(/apartado=pedidos/)

    await menu(page).getByRole('link', { name: 'Mis reservas' }).click()
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(page, 'la URL sigue a la pantalla').toHaveURL(/apartado=reservas/)
    await expect(page).not.toHaveURL(/apartado=pedidos/)
  })

  test('Datos personales es el estado canónico de /cuenta', async ({ page }) => {
    const a = await cuenta('canonica')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=reservas')
    await menu(page).getByRole('link', { name: 'Datos personales' }).click()

    await expect(seccion(page, 'Datos personales')).toBeVisible()
    // Se quita el parámetro en vez de escribir `?apartado=datos`.
    await expect(page).toHaveURL(/\/cuenta$/)
  })

  test('llegar con ?apartado=datos explícito sigue siendo válido', async ({ page }) => {
    // La aplicación ya no genera esa URL —Datos es el estado canónico de
    // `/cuenta`—, pero hay enlaces por ahí y no se rompen.
    const a = await cuenta('datos-explicito')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=datos')

    await expect(seccion(page, 'Datos personales')).toBeVisible()
    await expect(activo(page)).toHaveText('Datos personales')
    await expect(page, 'no se reescribe: es una dirección válida').toHaveURL(/apartado=datos/)
  })

  test('un apartado que no existe abre Datos y limpia la URL', async ({ page }) => {
    const a = await cuenta('invalido')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=banana')

    await expect(seccion(page, 'Datos personales')).toBeVisible()
    await expect(page, 'la URL deja de prometer algo que no se enseña').toHaveURL(/\/cuenta$/)
  })

  test('el resto de la URL no se pierde por el camino', async ({ page }) => {
    const a = await cuenta('otros-params')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=pedidos&utm=campania')
    await menu(page).getByRole('link', { name: 'Mis reservas' }).click()

    await expect(page).toHaveURL(/apartado=reservas/)
    await expect(page, 'sólo se toca `apartado`').toHaveURL(/utm=campania/)
  })
})

test.describe('Atrás y Adelante', () => {
  test('el historial recorre los apartados', async ({ page }) => {
    const a = await cuenta('historial')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=pedidos')
    await expect(seccion(page, 'Mis pedidos')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis pedidos')

    await menu(page).getByRole('link', { name: 'Mis reservas' }).click()
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(page).toHaveURL(/apartado=reservas/)

    await menu(page).getByRole('link', { name: 'Favoritos y tienda' }).click()
    await expect(seccion(page, 'Favoritos y tienda')).toBeVisible()
    await expect(page).toHaveURL(/apartado=favoritos/)

    await page.goBack()
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis reservas')
    await expect(page).toHaveURL(/apartado=reservas/)

    await page.goBack()
    await expect(seccion(page, 'Mis pedidos')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis pedidos')
    await expect(page).toHaveURL(/apartado=pedidos/)

    await page.goForward()
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis reservas')
    await expect(page).toHaveURL(/apartado=reservas/)
  })

  test('volver a pulsar el apartado activo no añade una entrada', async ({ page }) => {
    // Si cada pulsación apilara una entrada idéntica, salir de la pantalla
    // exigiría tantos Atrás como veces se hubiera pulsado.
    const a = await cuenta('repetido')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta')
    await menu(page).getByRole('link', { name: 'Mis pedidos' }).click()
    await expect(page).toHaveURL(/apartado=pedidos/)

    const pedidos = menu(page).getByRole('link', { name: 'Mis pedidos' })
    await pedidos.click()
    await pedidos.click()
    await expect(page).toHaveURL(/apartado=pedidos/)

    // Un solo Atrás devuelve a Datos, no tres.
    await page.goBack()
    await expect(seccion(page, 'Datos personales')).toBeVisible()
    await expect(page).toHaveURL(/\/cuenta$/)
  })
})

test.describe('el menú en móvil', () => {
  for (const ancho of [390, 320]) {
    test(`a ${ancho} px el apartado activo se ve entero`, async ({ page }) => {
      // NO BASTA CON `aria-current`
      //
      // El menú es una fila desplazable de más de 1.000 px. El activo puede
      // estar marcado y quedar fuera del área visible, que es lo que pasaba al
      // abrir un enlace profundo. Se miden cajas.
      await page.setViewportSize({ width: ancho, height: 844 })
      const a = await cuenta(`movil-${ancho}`)
      await identificarse(page, a.email, a.password)

      for (const { id, label } of APARTADOS) {
        await page.goto(id === 'datos' ? './cuenta' : `./cuenta?apartado=${id}`)
        const enlace = activo(page)
        await expect(enlace, id).toHaveText(label)

        // Se espera a la CONDICIÓN, no un tiempo fijo: el ajuste del carril
        // ocurre en un efecto, y medir justo después de que aparezca el rótulo
        // puede pillarlo a medio camino. `expect.poll` reintenta hasta que se
        // cumple o se agota, así que con el ajuste desactivado falla igual.
        await expect
          .poll(
            async () => {
              const caja = await menu(page).locator('ul').boundingBox()
              const el = await enlace.boundingBox()
              if (!caja || !el) return 'sin caja'
              // Un píxel de tolerancia por el redondeo de subpíxeles.
              if (el.x < caja.x - 1) return 'recortado por la izquierda'
              if (el.x + el.width > caja.x + caja.width + 1) return 'recortado por la derecha'
              return 'entero'
            },
            { timeout: 5_000, message: `${id} a ${ancho}: el apartado activo debe verse entero` },
          )
          .toBe('entero')
      }
    })
  }

  test('los siete apartados llegan al objetivo táctil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const a = await cuenta('targets')
    await identificarse(page, a.email, a.password)

    const enlaces = menu(page).getByRole('link')
    await expect(enlaces).toHaveCount(7)
    for (let i = 0; i < 7; i++) {
      const caja = await enlaces.nth(i).boundingBox()
      const nombre = (await enlaces.nth(i).innerText()).trim()
      expect(caja!.height, `«${nombre}» mide ${caja!.height} px de alto`).toBeGreaterThanOrEqual(44)
    }
  })

  test('un correo largo se lee entero y no desborda', async ({ page }) => {
    const a = await cuenta('correo')
    await identificarse(page, a.email, a.password)
    for (const ancho of [320, 390]) {
      await page.setViewportSize({ width: ancho, height: 844 })
      await page.goto('./cuenta')

      await expect(page.getByText(a.email), `el correo se enseña entero a ${ancho}`).toBeVisible()
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(desborde, `desbordamiento horizontal a ${ancho}`).toBe(0)
    }
  })
})

test.describe('los datos, y lo que se ve cuando fallan', () => {
  test('lo que se guarda en Datos personales vuelve del servidor tras recargar', async ({ page }) => {
    // NO BASTA CON MIRAR EL ESTADO DE REACT DESPUÉS DEL CLIC
    //
    // Se recarga la página entera: lo que aparezca después ha tenido que venir
    // de `clientes`, porque el formulario nace vacío.
    const a = await cuenta('persistencia')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta')

    const nombre = `Nombre Guardado ${RUN}`
    await page.getByLabel('Nombre y apellidos').fill(nombre)
    await page.getByLabel('Teléfono').fill('600123456')
    await page.getByRole('button', { name: 'Guardar' }).first().click()
    await expect(page.getByText('Guardado.')).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(page.getByLabel('Nombre y apellidos')).toHaveValue(nombre, { timeout: 15_000 })
    await expect(page.getByLabel('Teléfono')).toHaveValue('600123456')

    // Y está en la tabla, no sólo en la pantalla.
    const { data } = await servicio().from('clientes').select('nombre, telefono').eq('id', a.uid).maybeSingle()
    expect(data?.nombre).toBe(nombre)
  })

  test('un pedido real se ve entrando directamente por el enlace profundo', async ({ page }) => {
    const a = await cuenta('pedido')
    const id = `CTA-${RUN}`
    await sembrarPedido(a.uid, id)
    await identificarse(page, a.email, a.password)

    // Sin pasar antes por Datos personales.
    await page.goto('./cuenta?apartado=pedidos')
    await expect(seccion(page, 'Mis pedidos')).toBeVisible()
    await expect(page.getByText(id)).toBeVisible()
    await expect(activo(page)).toHaveText('Mis pedidos')
    await expect(page).toHaveURL(/apartado=pedidos/)
  })

  test('sin pedidos se dice que no los hay, y no parece un error', async ({ page }) => {
    const a = await cuenta('vacio-pedidos')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=pedidos')

    await expect(seccion(page, 'Mis pedidos')).toBeVisible()
    await expect(page.getByText(/Todavía no has hecho ningún pedido/i)).toBeVisible()
    await expect(page.getByText(/No se pudieron cargar/i), 'un vacío no es un error').toHaveCount(0)
  })

  test('si la lectura de pedidos falla, se dice que falló y no que no hay ninguno', async ({ page }) => {
    const a = await cuenta('error-pedidos')
    await sembrarPedido(a.uid, `CTA-ERR-${RUN}`)
    await identificarse(page, a.email, a.password)

    // Se responde 500 sólo a la lectura de pedidos. El pedido EXISTE, así que
    // un estado vacío aquí sería una mentira: diría que no ha comprado nada.
    await page.route('**/rest/v1/pedidos*', (ruta) =>
      ruta.request().method() === 'GET'
        ? ruta.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"caída"}' })
        : ruta.continue(),
    )
    await page.goto('./cuenta?apartado=pedidos')

    await expect(page.getByText(/No se pudieron cargar los pedidos/i)).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByText(/Todavía no has hecho ningún pedido/i),
      'un error no puede parecer un vacío',
    ).toHaveCount(0)
  })

  test('reservas distingue igual el vacío del fallo', async ({ page }) => {
    const a = await cuenta('reservas')
    await identificarse(page, a.email, a.password)

    await page.goto('./cuenta?apartado=reservas')
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(page.getByText(/No tienes ninguna reserva/i), 'vacío').toBeVisible()

    await page.route('**/rest/v1/reservas*', (ruta) =>
      ruta.request().method() === 'GET'
        ? ruta.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"caída"}' })
        : ruta.continue(),
    )
    await page.goto('./cuenta?apartado=reservas')
    await expect(page.getByText(/No se pudieron cargar las reservas/i), 'fallo').toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/No tienes ninguna reserva/i), 'un error no puede parecer un vacío').toHaveCount(0)
  })
})
