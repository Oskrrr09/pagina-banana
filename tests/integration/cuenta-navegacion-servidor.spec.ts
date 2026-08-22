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
// DESDE LA NAVEGACIÓN NATIVA, ADEMÁS, CADA APARTADO ES UNA RUTA
//
// `?apartado=` tenía un techo: el armazón decide si una pantalla lleva
// «Volver» mirando el PATHNAME, así que `/cuenta?apartado=pedidos` era
// `/cuenta` —una raíz de pestaña— y nunca podía ofrecer retroceso. Ahora cada
// apartado tiene su segmento y la gramática es la misma en web y en la
// aplicación. La antigua sigue entrando y se normaliza con `replace`.
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
      await page.goto(`./cuenta/${id}`)
      await expect(seccion(page, titulo), id).toBeVisible()
      await expect(activo(page), id).toHaveText(label)
    }
  })

  test('pulsar un apartado cambia la URL, no sólo la pantalla', async ({ page }) => {
    // ÉSTE ES EL FALLO QUE MOTIVÓ LA PR.
    const a = await cuenta('url')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta/pedidos')
    await expect(page).toHaveURL(/\/cuenta\/pedidos$/)

    await menu(page).getByRole('link', { name: 'Mis reservas' }).click()
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(page, 'la URL sigue a la pantalla').toHaveURL(/\/cuenta\/reservas$/)
    await expect(page).not.toHaveURL(/\/cuenta\/pedidos$/)
  })

  test('Datos personales tiene ruta propia, y /cuenta la enseña igual', async ({ page }) => {
    const a = await cuenta('canonica')
    await identificarse(page, a.email, a.password)

    // `/cuenta` sin más sigue abriendo Datos: es la entrada del área.
    await page.goto('./cuenta')
    await expect(seccion(page, 'Datos personales')).toBeVisible()
    await expect(activo(page)).toHaveText('Datos personales')

    // Y pulsarlo desde otro apartado escribe su dirección, como los demás: una
    // sola gramática para los siete en vez de una excepción para uno.
    await page.goto('./cuenta/reservas')
    await menu(page).getByRole('link', { name: 'Datos personales' }).click()
    await expect(seccion(page, 'Datos personales')).toBeVisible()
    await expect(page).toHaveURL(/\/cuenta\/datos$/)
  })

  test('un apartado que no existe vuelve a la cuenta y limpia la URL', async ({ page }) => {
    const a = await cuenta('invalido')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta/banana')

    await expect(seccion(page, 'Datos personales')).toBeVisible()
    await expect(page, 'la URL deja de prometer algo que no se enseña').toHaveURL(/\/cuenta$/)
  })

  test('el resto de la URL no se pierde por el camino', async ({ page }) => {
    const a = await cuenta('otros-params')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta/pedidos?utm=campania')
    await menu(page).getByRole('link', { name: 'Mis reservas' }).click()

    await expect(page).toHaveURL(/\/cuenta\/reservas/)
    await expect(page, 'lo que no es nuestro se conserva').toHaveURL(/utm=campania/)
  })
})

// ============================================================================
// LA GRAMÁTICA ANTIGUA SIGUE ENTRANDO.
//
// `?apartado=` fue la dirección de un apartado durante varias versiones: hay
// enlaces por ahí y no se rompen. Se traduce a la subruta con `replace`, que es
// lo que impide que quede una entrada de historial obligando a un Atrás de más.
// ============================================================================
test.describe('compatibilidad con ?apartado=', () => {
  test('cada apartado antiguo aterriza en su subruta', async ({ page }) => {
    const a = await cuenta('legacy')
    await identificarse(page, a.email, a.password)

    for (const { id, titulo } of APARTADOS) {
      await page.goto(`./cuenta?apartado=${id}`)
      await expect(page, id).toHaveURL(new RegExp(`/cuenta/${id}$`))
      await expect(seccion(page, titulo), id).toBeVisible()
    }
  })

  test('un apartado inventado aterriza en la raíz', async ({ page }) => {
    const a = await cuenta('legacy-invalido')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=banana')

    await expect(page).toHaveURL(/\/cuenta$/)
    await expect(seccion(page, 'Datos personales')).toBeVisible()
  })

  test('el resto de la consulta viaja con la traducción', async ({ page }) => {
    const a = await cuenta('legacy-params')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta?apartado=pedidos&utm=campania')

    await expect(page).toHaveURL(/\/cuenta\/pedidos/)
    await expect(page, 'sólo se traduce `apartado`').toHaveURL(/utm=campania/)
  })

  test('la traducción NO deja una entrada de historial de más', async ({ page }) => {
    // Sin `replace`, salir de la pantalla exigiría dos Atrás: uno para deshacer
    // la traducción y otro para irse de verdad.
    const a = await cuenta('legacy-historial')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta')
    await expect(seccion(page, 'Datos personales')).toBeVisible()

    await page.goto('./cuenta?apartado=pedidos')
    await expect(page).toHaveURL(/\/cuenta\/pedidos$/)

    await page.goBack()
    await expect(page, 'un solo Atrás devuelve a la raíz').toHaveURL(/\/cuenta$/)
  })
})

test.describe('Atrás y Adelante', () => {
  test('el historial recorre los apartados', async ({ page }) => {
    const a = await cuenta('historial')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta/pedidos')
    await expect(seccion(page, 'Mis pedidos')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis pedidos')

    await menu(page).getByRole('link', { name: 'Mis reservas' }).click()
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(page).toHaveURL(/\/cuenta\/reservas$/)

    await menu(page).getByRole('link', { name: 'Favoritos y tienda' }).click()
    await expect(seccion(page, 'Favoritos y tienda')).toBeVisible()
    await expect(page).toHaveURL(/\/cuenta\/favoritos$/)

    await page.goBack()
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis reservas')
    await expect(page).toHaveURL(/\/cuenta\/reservas$/)

    await page.goBack()
    await expect(seccion(page, 'Mis pedidos')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis pedidos')
    await expect(page).toHaveURL(/\/cuenta\/pedidos$/)

    await page.goForward()
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis reservas')
    await expect(page).toHaveURL(/\/cuenta\/reservas$/)
  })

  test('volver a pulsar el apartado activo no añade una entrada', async ({ page }) => {
    // Si cada pulsación apilara una entrada idéntica, salir de la pantalla
    // exigiría tantos Atrás como veces se hubiera pulsado.
    const a = await cuenta('repetido')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta')
    await menu(page).getByRole('link', { name: 'Mis pedidos' }).click()
    await expect(page).toHaveURL(/\/cuenta\/pedidos$/)

    const pedidos = menu(page).getByRole('link', { name: 'Mis pedidos' })
    await pedidos.click()
    await pedidos.click()
    await expect(page).toHaveURL(/\/cuenta\/pedidos$/)

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
        await page.goto(`./cuenta/${id}`)
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
    await page.goto('./cuenta/pedidos')
    await expect(seccion(page, 'Mis pedidos')).toBeVisible()
    await expect(page.getByText(id)).toBeVisible()
    await expect(activo(page)).toHaveText('Mis pedidos')
    await expect(page).toHaveURL(/\/cuenta\/pedidos$/)
  })

  test('sin pedidos se dice que no los hay, y no parece un error', async ({ page }) => {
    const a = await cuenta('vacio-pedidos')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta/pedidos')

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
    await page.goto('./cuenta/pedidos')

    await expect(page.getByText(/No se pudieron cargar los pedidos/i)).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByText(/Todavía no has hecho ningún pedido/i),
      'un error no puede parecer un vacío',
    ).toHaveCount(0)
  })

  test('reservas distingue igual el vacío del fallo', async ({ page }) => {
    const a = await cuenta('reservas')
    await identificarse(page, a.email, a.password)

    await page.goto('./cuenta/reservas')
    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(page.getByText(/No tienes ninguna reserva/i), 'vacío').toBeVisible()

    await page.route('**/rest/v1/reservas*', (ruta) =>
      ruta.request().method() === 'GET'
        ? ruta.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"caída"}' })
        : ruta.continue(),
    )
    await page.goto('./cuenta/reservas')
    await expect(page.getByText(/No se pudieron cargar las reservas/i), 'fallo').toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/No tienes ninguna reserva/i), 'un error no puede parecer un vacío').toHaveCount(0)
  })
  test('Pedidos enseña la carga mientras la lectura sigue pendiente', async ({ page }) => {
    // UNA PETICIÓN DE VERDAD EN VUELO, NO UNA ESPERA A OJO
    //
    // El GET de `pedidos` se retiene con una señal que esta prueba controla:
    // mientras no se suelte, la respuesta no llega y la sección tiene que estar
    // enseñando su estado de carga. Así el «Cargando…» se observa por existir,
    // no porque hayamos acertado con un tiempo.
    const a = await cuenta('carga-pedidos')
    await identificarse(page, a.email, a.password)

    let soltar = () => {}
    const retenida = new Promise<void>((resolve) => {
      soltar = resolve
    })
    await page.route('**/rest/v1/pedidos*', async (ruta) => {
      if (ruta.request().method() !== 'GET') return ruta.continue()
      await retenida
      await ruta.continue()
    })

    await page.goto('./cuenta/pedidos')
    const seccionPedidos = page.locator('section').filter({ has: seccion(page, 'Mis pedidos') })
    await expect(seccionPedidos.getByText('Cargando…'), 'con la lectura en vuelo, se anuncia la carga').toBeVisible()

    soltar()
    await expect(seccionPedidos.getByText('Cargando…'), 'y desaparece al llegar la respuesta').toHaveCount(0, {
      timeout: 15_000,
    })
    await expect(page.getByText(/Todavía no has hecho ningún pedido/i)).toBeVisible()
  })

  test('Reservas enseña la carga mientras su lectura sigue pendiente', async ({ page }) => {
    const a = await cuenta('carga-reservas')
    await identificarse(page, a.email, a.password)

    let soltar = () => {}
    const retenida = new Promise<void>((resolve) => {
      soltar = resolve
    })
    await page.route('**/rest/v1/reservas*', async (ruta) => {
      if (ruta.request().method() !== 'GET') return ruta.continue()
      await retenida
      await ruta.continue()
    })

    await page.goto('./cuenta/reservas')
    // Se busca DENTRO de la sección: el armazón tiene su propio estado de carga
    // de sesión, y confundirlos daría un verde que no dice nada.
    const seccionReservas = page.locator('section').filter({ has: seccion(page, 'Mis reservas') })
    await expect(seccionReservas.getByText('Cargando…')).toBeVisible()

    soltar()
    await expect(seccionReservas.getByText('Cargando…')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByText(/No tienes ninguna reserva/i)).toBeVisible()
  })

  test('una reserva real se muestra entrando directamente por el enlace profundo', async ({ page }) => {
    const a = await cuenta('reserva-datos')
    // Montaje con la vía de servicio; la LECTURA la hace el navegador con su
    // sesión, atravesando la política `cliente lee sus reservas`.
    const { error } = await servicio().from('reservas').insert({
      cliente_id: a.uid,
      family: 'iphone',
      model_slug: '17-pro',
      variant_label: 'Plata · 1TB',
      model_name: 'iPhone 17 Pro',
      price: 1729,
      estado: 'en-espera',
    })
    expect(error, 'la reserva de montaje debe poder sembrarse').toBeNull()

    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta/reservas')

    await expect(seccion(page, 'Mis reservas')).toBeVisible()
    await expect(activo(page)).toHaveText('Mis reservas')
    await expect(page).toHaveURL(/\/cuenta\/reservas$/)

    const tarjeta = page.locator('li').filter({ hasText: 'iPhone 17 Pro' })
    await expect(tarjeta, 'una sola reserva').toHaveCount(1)
    await expect(tarjeta.getByText('Plata · 1TB')).toBeVisible()
    await expect(tarjeta.getByText(/En lista de espera/)).toBeVisible()
    // Es la única en cola para esa variante, así que su puesto es determinista.
    await expect(tarjeta.getByText(/Posición 1/)).toBeVisible()
    await expect(page.getByText(/No tienes ninguna reserva/i), 'con datos no se enseña el vacío').toHaveCount(0)
  })
})

// ============================================================================
// Y LO MISMO DENTRO DEL BINARIO, QUE ES OTRA PANTALLA.
//
// En la aplicación `/cuenta` deja de ser «la web con un menú» y pasa a ser una
// lista vertical: cada apartado es una pantalla con su «Volver». Se prueba aquí
// y no en `tests/e2e/` porque `/cuenta` no se monta sin Supabase configurado, y
// el build de las suites de navegador corre a propósito sin credenciales.
//
// Capacitor se simula igual que en el resto de la suite: `window.Capacitor`
// antes del bundle, el mismo camino de código que en el WebView.
// ============================================================================
test.describe('la cuenta dentro de la aplicación', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  async function comoApp(page: Page) {
    await page.addInitScript(() => {
      ;(window as { Capacitor?: unknown }).Capacitor = {}
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    })
  }

  /** Las ocho entradas de la lista, con el destino que debe llevar cada una. */
  const ENTRADAS = [
    { nombre: 'Mis pedidos', destino: '/cuenta/pedidos' },
    { nombre: 'Mis reservas', destino: '/cuenta/reservas' },
    { nombre: 'Datos personales', destino: '/cuenta/datos' },
    { nombre: 'Dirección de envío', destino: '/cuenta/envio' },
    { nombre: 'Dirección de facturación', destino: '/cuenta/facturacion' },
    // Favoritos y Tienda habitual salen del área: llevar a una pantalla
    // intermedia cuyo único contenido son estos dos enlaces no aportaba nada.
    { nombre: 'Favoritos', destino: '/favoritos' },
    { nombre: 'Tienda habitual', destino: '/tiendas' },
    { nombre: 'Descuento educativo', destino: '/cuenta/descuento' },
  ] as const

  test('la raíz es una lista vertical, sin carril y sin «Volver»', async ({ page }) => {
    await comoApp(page)
    const a = await cuenta('nativa-raiz')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta')

    // Lo que se retira: el menú desplazable medía 1104 px dentro de 350, así
    // que enseñaba dos de siete apartados.
    await expect(menu(page), 'la aplicación ya no monta el carril').toHaveCount(0)
    // `/cuenta` es raíz de pestaña: allí no hay «atrás», hay pestañas.
    await expect(page.locator('[data-app-back]'), 'la raíz no lleva control de vuelta').toHaveCount(0)
    await expect(page.locator('[data-app-tab-bar]'), 'la barra inferior sigue ahí').toHaveCount(1)

    for (const { nombre, destino } of ENTRADAS) {
      const fila = page.getByRole('link', { name: new RegExp(`^${nombre}`) })
      await expect(fila, nombre).toHaveCount(1)
      await expect(fila, nombre).toHaveAttribute('href', new RegExp(`${destino}$`))
    }
  })

  test('las filas se descubren bajando, no arrastrando de lado', async ({ page }) => {
    await comoApp(page)
    const a = await cuenta('nativa-scroll')
    await identificarse(page, a.email, a.password)

    for (const ancho of [320, 390]) {
      await page.setViewportSize({ width: ancho, height: 844 })
      await page.goto('./cuenta')
      await expect(page.getByRole('link', { name: /^Mis pedidos/ })).toBeVisible()

      const medida = await page.evaluate(() => {
        const de = document.documentElement
        const guardado = de.style.overflowX
        de.style.overflowX = 'visible'
        const documento = de.scrollWidth - de.clientWidth
        de.style.overflowX = guardado
        const contenido = document.querySelector('#contenido')!
        return {
          documento,
          lateral: contenido.scrollWidth - contenido.clientWidth,
          vertical: contenido.scrollHeight > contenido.clientHeight,
        }
      })
      expect(medida.documento, `el documento no desborda a ${ancho}`).toBeLessThanOrEqual(2)
      expect(medida.lateral, `no hay desplazamiento lateral a ${ancho}`).toBeLessThanOrEqual(2)
      expect(medida.vertical, `la lista se recorre en vertical a ${ancho}`).toBe(true)

      // Y las ocho llegan al objetivo táctil, no sólo las que caben de entrada.
      for (const { nombre } of ENTRADAS) {
        const caja = await page.getByRole('link', { name: new RegExp(`^${nombre}`) }).boundingBox()
        expect(caja!.height, `«${nombre}» a ${ancho} px mide ${caja!.height}`).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('entrar en un apartado da pantalla propia, «Volver» y pestaña', async ({ page }) => {
    await comoApp(page)
    const a = await cuenta('nativa-entrar')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta')

    await page.getByRole('link', { name: /^Mis pedidos/ }).click()
    await expect(page).toHaveURL(/\/cuenta\/pedidos$/)

    // El título de la pantalla es UNO. Antes el chip activo decía «Mis
    // pedidos» y el encabezado de debajo lo repetía.
    await expect(page.getByRole('heading', { level: 1, name: 'Mis pedidos' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mis pedidos' }), 'sin título duplicado').toHaveCount(1)

    await expect(page.locator('[data-app-back]'), 'la secundaria sí lleva «Volver»').toHaveCount(1)
    await expect(page.locator('[data-app-tab-bar]'), 'la barra inferior no se esconde').toHaveCount(1)
    const activa = page.locator('[data-app-tab-bar] [aria-current]')
    await expect(activa, 'la pestaña Cuenta sigue marcada').toContainText('Cuenta')

    // Y vuelve a la lista.
    await page.locator('[data-app-back]').click()
    await expect(page).toHaveURL(/\/cuenta$/)
    await expect(page.getByRole('link', { name: /^Mis reservas/ })).toBeVisible()
  })

  test('en frío, «Volver» lleva a la cuenta y no a la portada', async ({ page }) => {
    // Sin historial propio el control usa el destino semántico. Antes de esta
    // PR `/cuenta/pedidos` no era ninguna ruta y ese destino era `/`.
    await comoApp(page)
    const a = await cuenta('nativa-frio')
    await identificarse(page, a.email, a.password)

    await page.goto('./cuenta/reservas')
    await expect(page.getByRole('heading', { level: 1, name: 'Mis reservas' })).toBeVisible()
    await expect(page.locator('[data-app-back]')).toHaveCount(1)

    await page.locator('[data-app-back]').click()
    await expect(page).toHaveURL(/\/cuenta$/)
  })

  test('recargar un apartado se queda en ese apartado', async ({ page }) => {
    await comoApp(page)
    const a = await cuenta('nativa-reload')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta/descuento')
    await expect(page.getByRole('heading', { level: 1, name: 'Descuento educativo' })).toBeVisible()

    await page.reload()
    await expect(page).toHaveURL(/\/cuenta\/descuento$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Descuento educativo' })).toBeVisible()
  })

  test('`/cuenta/favoritos` sigue existiendo aunque no sea una fila', async ({ page }) => {
    // No aparece en la lista —sus dos enlaces están sueltos en Preferencias—
    // pero la dirección no se rompe: hay enlaces antiguos y la web la usa.
    await comoApp(page)
    const a = await cuenta('nativa-favoritos')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta/favoritos')

    await expect(page.getByRole('heading', { level: 1, name: 'Favoritos y tienda' })).toBeVisible()
    await expect(page.locator('[data-app-back]')).toHaveCount(1)
  })

  test('cerrar sesión vive al final y conserva su contrato', async ({ page }) => {
    await comoApp(page)
    const a = await cuenta('nativa-logout')
    await identificarse(page, a.email, a.password)
    await page.goto('./cuenta')

    // Está DESPUÉS de la última fila de navegación, no compitiendo con ellas:
    // antes el botón era lo primero que se veía al abrir la cuenta.
    const ultimaFila = page.getByRole('link', { name: /^Descuento educativo/ })
    const boton = page.getByRole('button', { name: 'Cerrar sesión' })
    await expect(ultimaFila).toBeVisible()
    await expect(boton).toBeVisible()
    const cajaFila = await ultimaFila.boundingBox()
    const cajaBoton = await boton.boundingBox()
    expect(cajaBoton!.y, 'cerrar sesión va por debajo de las secciones').toBeGreaterThan(cajaFila!.y)

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page, 'se navega a la portada al confirmarse el cierre').toHaveURL(/\/pagina-banana\/$/, {
      timeout: 20_000,
    })
    // `replace`: Atrás no devuelve a una cuenta que ya no tiene sesión.
    await page.goBack()
    await expect(page).not.toHaveURL(/\/cuenta$/)
  })

  test('un enlace profundo sin sesión conserva su destino tras identificarse', async ({ page }) => {
    await comoApp(page)
    const a = await cuenta('nativa-deep')

    // Sin sesión: el guardia manda a identificarse SIN perder a dónde iba.
    await page.goto('./cuenta/pedidos')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcuenta%2Fpedidos/)

    await page.locator('input[type="email"]').first().fill(a.email)
    await page.locator('input[type="password"]').first().fill(a.password)
    await page.locator('form').first().getByRole('button').first().click()

    await expect(page, 'vuelve al apartado que se pidió', { timeout: 20_000 }).toHaveURL(/\/cuenta\/pedidos$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Mis pedidos' })).toBeVisible()
  })
})
