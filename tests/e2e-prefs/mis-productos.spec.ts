import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// La pantalla `/mis-productos`, que se llama «Mis compras» desde la PR #41.
//
// `tests/unit/my-products.test.ts` cubre qué compras se convierten en producto
// y cuáles no; esto cubre lo que se ve: el guardia de sesión, el vacío, la
// lista y —lo importante— que una compra que no se puede resolver del todo no
// acabe enlazando a una variante distinta de la que se compró.
//
// Los pedidos llegan interceptando la petición a Supabase, así que la página
// recorre su camino de carga real. Ver `productos-fixture.tsx`.
// ============================================================================

const FIXTURE = '/pagina-banana/tests/e2e-prefs/productos-fixture.html'

/** Una línea comprada, con toda su identidad. */
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

function pedido(id: string, lines: Record<string, unknown>[], createdAt = '2026-08-08T10:00:00.000Z') {
  return {
    id,
    created_at: createdAt,
    cliente_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    delivery: 'envio',
    payment_method: 'tarjeta',
    financing_months: null,
    products_total: 1229,
    insurance_total: 0,
    insured_units: 0,
    lines,
    status: 'demo',
  }
}

async function conPedidos(page: Page, pedidos: unknown[]) {
  await page.route('**/rest/v1/pedidos*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pedidos),
    })
  })
}

test('sin sesión manda a identificarse y no enseña nada', async ({ page }) => {
  await conPedidos(page, [])
  await page.goto(`${FIXTURE}?sesion=no`)

  await expect(page.getByTestId('ruta')).toHaveText('/login?redirect=%2Fmis-productos')
  await expect(page.getByRole('heading', { name: 'Mis compras' })).toHaveCount(0)
})

test('sin compras explica para qué sirve la pantalla', async ({ page }) => {
  await conPedidos(page, [])
  await page.goto(FIXTURE)

  await expect(page.getByRole('heading', { name: 'Mis compras' })).toBeVisible()
  await expect(page.getByText('Todavía no hay compras que enseñar')).toBeVisible()
  // Un vacío que sólo dijera «no hay nada» no le sirve a quien acaba de entrar.
  await expect(page.getByText(/Aquí aparecerán los productos que compres/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver el catálogo' })).toBeVisible()
})

test('una compra resuelta enlaza a su variante exacta', async ({ page }) => {
  await conPedidos(page, [pedido('BC-482910', [linea()])])
  await page.goto(FIXTURE)

  const tarjeta = page.locator('article').filter({ hasText: 'iPhone 17 Pro' })
  await expect(tarjeta).toBeVisible()
  await expect(tarjeta.getByText('Plata · 256GB')).toBeVisible()
  await expect(tarjeta.getByText(/Comprado el 08 de agosto de 2026/)).toBeVisible()
  await expect(tarjeta.getByText('Pedido BC-482910')).toBeVisible()

  // Sin `basename`: el fixture monta la pantalla en un `MemoryRouter` pelado.
  await expect(tarjeta.getByRole('link', { name: /Ver producto/ })).toHaveAttribute(
    'href',
    '/iphone/17-pro/256gb-plata',
  )
})

test('si el catálogo ya no tiene esa variante, el enlace va al modelo y no a otra', async ({ page }) => {
  await conPedidos(page, [
    pedido('BC-1', [linea({ colorSlug: 'color-retirado', color: 'Color retirado', image: '/img/el-que-compre.webp' })]),
  ])
  await page.goto(FIXTURE)

  const tarjeta = page.locator('article').filter({ hasText: 'iPhone 17 Pro' })
  await expect(tarjeta).toBeVisible()
  // Se sigue enseñando lo que se compró…
  await expect(tarjeta.getByText('Color retirado · 256GB')).toBeVisible()
  // …incluida su foto, la guardada al comprar y no la de otro color.
  await expect(tarjeta.locator('img')).toHaveAttribute('src', '/img/el-que-compre.webp')

  const enlace = tarjeta.getByRole('link', { name: /Ver producto/ })
  // …pero el enlace lleva a la ficha del modelo, nunca a una variante que no
  // es la comprada. Ese enlace funcionaría, y sería mentira.
  await expect(enlace).toHaveAttribute('href', '/iphone/17-pro')
  await expect(enlace).not.toHaveAttribute('href', /256gb-plata/)
})

test('sin color resuelto y sin foto guardada, hueco neutro y no la de otro color', async ({ page }) => {
  await conPedidos(page, [
    pedido('BC-1', [linea({ colorSlug: 'color-retirado', color: 'Color retirado', image: undefined })]),
  ])
  await page.goto(FIXTURE)

  const tarjeta = page.locator('article').filter({ hasText: 'iPhone 17 Pro' })
  await expect(tarjeta).toBeVisible()
  // `ProductImage` deja su hueco con el texto alternativo. Más vale eso que una
  // foto convincente de un producto que no es el que se compró.
  await expect(tarjeta.locator('img')).toHaveCount(0)
})

test('lo que no se puede resolver no aparece', async ({ page }) => {
  // Formato antiguo: sin identidad. El nombre coincide con un producto real y
  // aun así no se asocia.
  const antigua = { name: 'iPhone 17 Pro', color: 'Plata', capacity: '256GB', price: 1229, qty: 1, insured: false }
  const accesorio = linea({ kind: 'accessory', family: 'accesorios', name: 'Cargador MagSafe · 1 m' })
  await conPedidos(page, [pedido('BC-1', [antigua, accesorio])])
  await page.goto(FIXTURE)

  await expect(page.getByText('Todavía no hay compras que enseñar')).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver producto/ })).toHaveCount(0)
})

test('varias unidades se dicen, no se inventan aparatos', async ({ page }) => {
  await conPedidos(page, [pedido('BC-1', [linea({ qty: 2 })])])
  await page.goto(FIXTURE)

  await expect(page.locator('article')).toHaveCount(1)
  await expect(page.getByText(/2 unidades/)).toBeVisible()
})

test('no se afirma ninguna cobertura ni dato que no tengamos', async ({ page }) => {
  await conPedidos(page, [pedido('BC-1', [linea({ insured: true })])])
  await page.goto(FIXTURE)

  await expect(page.locator('article')).toHaveCount(1)
  // `insured` significa que se marcó la casilla en un checkout demostrativo.
  // No es una póliza, y la pantalla no puede insinuar que lo sea.
  const cuerpo = page.locator('body')
  for (const prohibido of [
    'Garantía',
    'garantía',
    'Seguro activo',
    'IMEI',
    'Número de serie',
    'AppleCare',
    'Factura',
  ]) {
    await expect(cuerpo, `no debe aparecer «${prohibido}»`).not.toContainText(prohibido)
  }
})
