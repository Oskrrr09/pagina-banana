import { expect, test } from '@playwright/test'

// ============================================================================
// Inicio nativo con sesión, y la ruta de «Mis pedidos».
//
// QUÉ SE CONSERVA DE ANTES, Y POR QUÉ
//
// `/cuenta` a secas abre «Datos personales». Cuando Inicio ofrecía un acceso
// llamado «Mis pedidos» que apuntaba ahí, la etiqueta prometía una cosa y la
// pantalla enseñaba otra. Ese acceso ya no está en Inicio —es un destino de la
// barra inferior y de la propia Cuenta—, pero **la ruta con apartado sigue
// teniendo que abrir el apartado que dice**, así que la comprobación se queda:
// cambia por dónde se entra, no lo que se exige.
//
// QUÉ SE COMPRUEBA AHORA ADEMÁS
//
// Que con sesión iniciada Inicio tampoco repita esos destinos. La suite E2E no
// puede verlo: allí no hay Supabase y por tanto no hay sesión.
// ============================================================================

const FIXTURE = '/pagina-banana/tests/e2e-prefs/inicio-fixture.html'

test('la cabecera dice quién eres, sin saludo protagonista', async ({ page }) => {
  // Era `Hola, Elena` a 28 px de tipografía display: el texto más grande de la
  // pantalla para lo único que quien abre la aplicación ya sabe. Inicio v2 lo
  // deja en una línea con el nombre y el acceso a la cuenta. Lo que esta
  // prueba protege —que la cabecera identifique la sesión— no cambia.
  await page.goto(FIXTURE)

  const h1 = page.getByRole('heading', { level: 1 })
  await expect(h1).toHaveText('Elena')
  await expect(h1, 'el saludo dejó de ser el titular').not.toHaveText(/Hola/)
  await expect(page.getByRole('link', { name: 'Tu cuenta' })).toHaveAttribute('href', /\/cuenta$/)
})

test('la ruta del apartado abre Mis pedidos, no Datos personales', async ({ page }) => {
  await page.goto(`${FIXTURE}#/cuenta/pedidos`)

  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Datos personales' })).toHaveCount(0)
  // El menú de apartados son ENLACES desde la PR #60: cada apartado tiene su
  // propia URL, así que un enlace es lo que es. La propiedad que esta línea
  // protege —que el apartado abierto queda marcado— no cambia.
  await expect(page.getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('aria-current', 'page')
})

test('con sesión, Inicio no repite los destinos de la barra inferior', async ({ page }) => {
  await page.goto(FIXTURE)

  // Se mira el destino, no el texto: «Mis compras» puede aparecer
  // legítimamente en otros sitios.
  await expect(page.locator('a[href$="/mis-productos"]')).toHaveCount(0)
  await expect(page.locator('a[href$="/cuenta/pedidos"]')).toHaveCount(0)

  // Y lo que sí tiene que seguir habiendo: la ayuda, que no está en la barra.
  await expect(page.getByRole('link', { name: /Soporte/ })).toBeVisible()
})

// ---------------------------------------------------------------------------
// El aviso de reserva disponible.
//
// Es la única señal con estado real en el servidor que Inicio interrumpe para
// enseñar, y no se puede demostrar sin una reserva: en la suite E2E no hay
// Supabase. El fixture inyecta la carga de reservas por la prop
// `listarReservas`, que en producción vale `listMyReservations`.
// ---------------------------------------------------------------------------

const CON_RESERVAS = `${FIXTURE}?reservas=1`

test('una reserva disponible se avisa en Inicio, y una en espera no', async ({ page }) => {
  await page.goto(CON_RESERVAS)

  const avisos = page.locator('[aria-label="Avisos"]')
  await expect(avisos).toBeVisible()
  await expect(avisos.getByText('Tu reserva está lista')).toBeVisible()

  // Los datos son los de ESA reserva, no un texto genérico.
  await expect(avisos).toContainText('iPhone 17 Pro')
  await expect(avisos).toContainText('256 GB · Titanio natural')

  // Y la que está en espera no se convierte en aviso: si el filtro se aflojara,
  // aquí aparecerían dos.
  await expect(avisos.getByRole('listitem')).toHaveCount(1)
  await expect(avisos).not.toContainText('MacBook Air M5')
})

test('el aviso va por delante del Finder', async ({ page }) => {
  // DECISIÓN DE INICIO V2
  //
  // Una reserva `disponible` es información temporal y accionable: hay una
  // unidad esperando. El Finder es una herramienta permanente y puede esperar
  // un dedo más abajo. Sólo se puede comprobar aquí: hace falta una sesión con
  // reservas, y la suite de navegador no tiene Supabase.
  await page.goto(CON_RESERVAS)

  // El aviso llega de una promesa: se espera a que exista antes de medirlo, no
  // se mete un tiempo fijo.
  const aviso = page.locator('[aria-label="Avisos"]')
  await expect(aviso).toBeVisible()
  const finder = page.locator('[aria-labelledby="inicio-finder"]')
  await expect(finder).toBeVisible()

  const cajaAviso = await aviso.boundingBox()
  const cajaFinder = await finder.boundingBox()
  expect(cajaAviso!.y + cajaAviso!.height, 'el aviso va antes que el Finder').toBeLessThanOrEqual(cajaFinder!.y + 1)
})

test('sin avisos, lo primero es producto y no queda hueco', async ({ page }) => {
  await page.goto(FIXTURE)

  // QUÉ CAMBIÓ EN LA FASE A
  //
  // Esta prueba exigía que el Finder fuera lo primero, justo detrás de la
  // identidad. Ahora la identidad ya no abre la pantalla y el primer bloque es
  // un carril de PRODUCTO: la app abría pidiendo cuenta y ofreciendo una
  // herramienta, con el producto debajo del pliegue.
  //
  // Se sigue exigiendo lo mismo con la misma dureza, sólo que sobre la pieza
  // que ahora manda: que vaya la primera y que no arrastre un hueco.
  await expect(page.locator('[aria-label="Avisos"]'), 'sin reservas no se pinta nada').toHaveCount(0)
  const orden = await page.evaluate(() => {
    const cont = document.querySelector('main') ?? document.body
    const primera = cont.querySelector('section')!.getBoundingClientRect()
    const carril = document.querySelector('ul[aria-label="Oportunidades"], ul[aria-label="Seguías mirando"]')
    const finder = document.querySelector('[aria-labelledby="inicio-finder"]')!.getBoundingClientRect()
    return {
      contTop: cont.getBoundingClientRect().top,
      primeraTop: primera.top,
      carrilTop: carril ? carril.getBoundingClientRect().top : null,
      finderTop: finder.top,
    }
  })
  expect(orden.carrilTop, 'hay un carril de producto en Inicio').not.toBeNull()
  expect(orden.carrilTop!, 'el producto va por delante del Finder').toBeLessThan(orden.finderTop)
  // Sin número mágico, igual que antes: lo que se exige es que la primera pieza
  // no arrastre un bloque entero de separación por encima.
  expect(
    orden.primeraTop - orden.contTop,
    `quedan ${Math.round(orden.primeraTop - orden.contTop)} px por encima de la primera pieza`,
  ).toBeLessThan(80)
})

test('el aviso abre el apartado de reservas de la cuenta', async ({ page }) => {
  await page.goto(CON_RESERVAS)

  await page.locator('[aria-label="Avisos"]').getByRole('link').first().click()

  // El fixture usa MemoryRouter, así que la URL del navegador no cambia: lo que
  // demuestra el destino es lo que se pinta.
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible()
  // El menú de apartados son ENLACES desde la PR #60: cada apartado tiene su
  // propia URL, así que un enlace es lo que es. La propiedad que esta línea
  // protege —que el apartado abierto queda marcado— no cambia.
  await expect(page.getByRole('link', { name: 'Mis reservas' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { name: 'Datos personales' })).toHaveCount(0)
})
