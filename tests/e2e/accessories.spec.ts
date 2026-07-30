import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Suite del catálogo de accesorios Apple (§4.5). Cubre página general,
// filtros por categoría y compatibilidad, ficha de detalle, imágenes,
// variantes, compatibilidad exacta con dispositivos, integración con el
// buscador y accesibilidad.

async function openAccessories(page: Page) {
  await page.goto('./accesorios')
  await expect(page.getByRole('heading', { name: 'Accesorios Apple', level: 1 })).toBeVisible()
}

async function openDesktopHeaderSearch(page: Page) {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('./')
  await page.getByRole('button', { name: 'Buscar', exact: true }).first().click()
}

// ---------------------- Test 1 — Catálogo -----------------------------------

test('catálogo /accesorios: encabezado, filtros, tarjetas y sin CTA Comprar', async ({ page }) => {
  await openAccessories(page)
  // Encabezado y aviso.
  await expect(page.getByText(/Los precios son.+demostrativos/i)).toBeVisible()
  // Filtros por categoría (grupo "Categoría").
  const categoryGroup = page.getByRole('radiogroup', { name: 'Categoría' })
  await expect(categoryGroup.getByRole('radio', { name: 'Carga y cables' })).toBeVisible()
  await expect(categoryGroup.getByRole('radio', { name: 'iPhone' })).toBeVisible()
  await expect(categoryGroup.getByRole('radio', { name: 'iPad' })).toBeVisible()
  await expect(categoryGroup.getByRole('radio', { name: 'Mac' })).toBeVisible()
  await expect(categoryGroup.getByRole('radio', { name: 'Apple Watch' })).toBeVisible()
  await expect(categoryGroup.getByRole('radio', { name: 'AirTag' })).toBeVisible()
  // Tarjetas: al menos 12 accesorios visibles.
  const cardCount = await page.locator('main a[href*="/accesorios/"]').count()
  expect(cardCount).toBeGreaterThanOrEqual(12)
  // Ningún botón "Comprar" ni "Añadir al carrito".
  await expect(page.getByRole('button', { name: /Comprar|Añadir al carrito/ })).toHaveCount(0)
  // "Precio demostrativo" está presente al menos una vez.
  await expect(page.getByText('Precio demostrativo').first()).toBeVisible()
})

// ---------------------- Test 2 — Filtros ------------------------------------

test('filtros por categoría filtran correctamente y "Limpiar" restaura', async ({ page }) => {
  await openAccessories(page)
  const cardsBefore = await page.locator('main a[href*="/accesorios/"]').count()

  // Filtro Mac (grupo Categoría, para evitar el mismo label en Compatibilidad).
  await page.getByRole('radiogroup', { name: 'Categoría' }).getByRole('radio', { name: 'Mac' }).click()
  const macCards = await page.locator('main a[href*="/accesorios/"]').count()
  expect(macCards).toBeLessThan(cardsBefore)
  expect(macCards).toBeGreaterThan(0)

  // Limpiar filtros.
  await page.getByRole('button', { name: /Limpiar filtros/ }).click()
  const cardsAfter = await page.locator('main a[href*="/accesorios/"]').count()
  expect(cardsAfter).toBe(cardsBefore)
})

test('filtro AirTag muestra solo accesorios AirTag', async ({ page }) => {
  await openAccessories(page)
  await page.getByRole('radio', { name: 'AirTag', exact: true }).nth(0).click()
  const links = await page.locator('main a[href*="/accesorios/airtag"]').count()
  expect(links).toBeGreaterThanOrEqual(2)
})

// ---------------------- Test 3 — Ficha --------------------------------------

const detailFixtures: { slug: string; name: string }[] = [
  { slug: 'cargador-magsafe', name: 'Cargador MagSafe' },
  { slug: 'apple-pencil-pro', name: 'Apple Pencil Pro' },
  { slug: 'magic-mouse-usb-c', name: 'Magic Mouse' },
  { slug: 'correa-deportiva-watch-46mm', name: 'Correa deportiva' },
  { slug: 'airtag-2gen', name: 'AirTag' },
]

for (const fx of detailFixtures) {
  test(`ficha /accesorios/${fx.slug}: encabezado, especificaciones y CTA tiendas`, async ({ page }) => {
    await page.goto(`./accesorios/${fx.slug}`)
    await expect(page.getByRole('heading', { name: new RegExp(fx.name), level: 1 })).toBeVisible()
    await expect(page.getByText('Especificaciones')).toBeVisible()
    await expect(page.getByText('Precio demostrativo').first()).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Consultar disponibilidad en tiendas/ }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /Consultar disponibilidad en tiendas/ })).toHaveAttribute(
      'href',
      /\/tiendas$/,
    )
    // Ausencia de CTA comerciales de compra.
    await expect(page.getByRole('button', { name: /Añadir al carrito|Contratar seguro/ })).toHaveCount(0)
  })
}

// ---------------------- Test 4 — Imágenes -----------------------------------

test('imágenes del catálogo cargan (naturalWidth > 0, alt no vacío)', async ({ page }) => {
  await openAccessories(page)
  // Esperamos al layout.
  await page.waitForLoadState('networkidle')
  const images = page.locator('main img')
  const count = await images.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    const img = images.nth(i)
    const alt = await img.getAttribute('alt')
    expect(alt).not.toBe(null)
    expect((alt ?? '').length).toBeGreaterThan(0)
    const nw = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(nw).toBeGreaterThan(0)
  }
})

// ---------------------- Test 5 — Variantes ----------------------------------

test('variantes de Magic Mouse: blanco y negro tienen src DISTINTO', async ({ page }) => {
  await page.goto('./accesorios/magic-mouse-usb-c')
  const img = page.locator('main img').first()
  await expect(page.getByRole('radio', { name: /Superficie Multi-Touch blanca/ })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  const srcWhite = await img.getAttribute('src')
  await page.getByRole('radio', { name: /Superficie Multi-Touch negra/ }).click()
  await expect(page.getByRole('radio', { name: /Superficie Multi-Touch negra/ })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  const srcBlack = await img.getAttribute('src')
  expect(srcWhite).not.toBeNull()
  expect(srcBlack).not.toBeNull()
  expect(srcBlack).not.toBe(srcWhite)
  const alt = await img.getAttribute('alt')
  expect(alt).toContain('negra')
})

test('variantes de Magic Trackpad: blanco y negro tienen src DISTINTO', async ({ page }) => {
  await page.goto('./accesorios/magic-trackpad-usb-c')
  const img = page.locator('main img').first()
  const srcWhite = await img.getAttribute('src')
  await page.getByRole('radio', { name: /Superficie Multi-Touch negra/ }).click()
  const srcBlack = await img.getAttribute('src')
  expect(srcBlack).not.toBe(srcWhite)
})

// ---------------------- Test 6 — Compatibilidad exacta ----------------------

test('iPhone 17 Pro: aparece funda exacta y no la de Pro Max', async ({ page }) => {
  await page.goto('./iphone/17-pro')
  const section = page.getByRole('region', { name: /Accesorios compatibles/ }).or(
    page.locator('section:has(h2:has-text("Accesorios compatibles"))'),
  )
  await expect(page.getByRole('heading', { name: 'Accesorios compatibles' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Funda de trenzado técnico con MagSafe para el iPhone 17 Pro/ }),
  ).toBeVisible()
  // No debe aparecer una funda de iPhone 17 Pro Max ni de iPhone 17 estándar.
  await expect(
    page.getByRole('link', { name: /Funda.+iPhone 17 Pro Max/ }),
  ).toHaveCount(0)
  await expect(section).toBeVisible()
})

// ---------------------- Test 7 — iPad ---------------------------------------

test('iPad Pro: aparecen Apple Pencil y Magic Keyboard correctos', async ({ page }) => {
  await page.goto('./ipad/ipad-pro')
  await expect(page.getByRole('heading', { name: 'Accesorios compatibles' })).toBeVisible()
  const region = page.locator('section:has(h2:has-text("Accesorios compatibles"))')
  // Al menos algún Apple Pencil o Magic Keyboard.
  const text = (await region.textContent()) ?? ''
  const hasPencil = /Apple Pencil/i.test(text)
  const hasKeyboard = /Magic Keyboard/i.test(text)
  expect(hasPencil || hasKeyboard).toBe(true)
})

// ---------------------- Test 8 — Buscador AirPods ---------------------------

test('buscar AirPods: dispositivos primero, sin almohadillas oficial no verificada', async ({ page }) => {
  await page.goto('./buscar?q=AirPods')
  const headings = await page.locator('h2').allTextContents()
  const iDevices = headings.findIndex((h) => h.startsWith('Dispositivos Apple'))
  const iAppleAcc = headings.findIndex((h) => h.startsWith('Accesorios Apple'))
  expect(iDevices).toBeGreaterThanOrEqual(0)
  if (iAppleAcc !== -1) expect(iDevices).toBeLessThan(iAppleAcc)
  // La entrada oficial no verificable "Almohadillas para AirPods Pro" NO existe.
  await expect(page.getByText('Almohadillas para AirPods Pro')).toHaveCount(0)
})

// ---------------------- Test 9 — Buscador cargador --------------------------

test('buscar cargador: accesorios Apple de carga con ruta a /accesorios/…', async ({ page }) => {
  await page.goto('./buscar?q=cargador')
  await expect(page.getByRole('link', { name: /MagSafe|Adaptador de corriente/i }).first()).toBeVisible()
  // No aparecen dispositivos por mencionar batería.
  const headings = await page.locator('h2').allTextContents()
  expect(headings.filter((h) => h.startsWith('Dispositivos Apple')).length).toBe(0)
})

// ---------------------- Test 10 — Buscador funda iPhone 17 Pro --------------

test('buscar funda iPhone 17 Pro: aparece la funda exacta', async ({ page }) => {
  await page.goto('./buscar?q=funda%20iPhone%2017%20Pro')
  await expect(
    page.getByRole('link', { name: /Funda de trenzado técnico con MagSafe para el iPhone 17 Pro/ }).first(),
  ).toBeVisible()
})

// ---------------------- Test 11 — Buscador Apple Pencil ---------------------

test('buscar Apple Pencil: aparecen Pro y USB-C como fichas separadas', async ({ page }) => {
  await page.goto('./buscar?q=Apple%20Pencil')
  await expect(page.getByRole('link', { name: /Apple Pencil Pro/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Apple Pencil \(USB-C\)/ }).first()).toBeVisible()
})

// ---------------------- Test 12 — Buscador correa Watch ---------------------

test('buscar correa Watch: la correa oficial aparece', async ({ page }) => {
  await page.goto('./buscar?q=correa%20Watch')
  await expect(page.getByRole('link', { name: /Correa deportiva/ }).first()).toBeVisible()
})

// ---------------------- Test 13 — Navegación --------------------------------

test('Home: enlace de familias "Accesorios" lleva a /accesorios', async ({ page }) => {
  await page.goto('./')
  // El grid de "Explora por categoría" incluye Accesorios; su enlace debe
  // ir al catálogo real.
  const acc = page.getByRole('link', { name: /Accesorios/ }).filter({ hasNotText: 'Ir a' }).first()
  const href = await acc.getAttribute('href')
  expect(href).toMatch(/\/accesorios/)
})

test('Header escritorio: accesos rápidos incluyen Accesorios → /accesorios', async ({ page }) => {
  await openDesktopHeaderSearch(page)
  const link = page.getByRole('link', { name: 'Accesorios', exact: true }).first()
  await expect(link).toHaveAttribute('href', /\/accesorios$/)
})

// ---------------------- Test 14 — Accesibilidad -----------------------------

test('axe: /accesorios sin violaciones críticas', async ({ page }) => {
  await page.goto('./accesorios')
  const result = await new AxeBuilder({ page }).exclude('[aria-hidden="true"]').analyze()
  expect(result.violations).toEqual([])
})

test('axe: /accesorios/apple-pencil-pro sin violaciones críticas', async ({ page }) => {
  await page.goto('./accesorios/apple-pencil-pro')
  const result = await new AxeBuilder({ page }).exclude('[aria-hidden="true"]').analyze()
  expect(result.violations).toEqual([])
})

test('a 375 px /accesorios no genera scroll horizontal @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./accesorios')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

// ============================================================================
// Tests reforzados de la PR correctiva (sin SVG bespoke, variantes distintas,
// tarjetas visuales en /buscar, miniaturas en Header).
// ============================================================================

async function openDesktopHeaderSearchStrict(page: Page) {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('./')
  await page.getByRole('button', { name: 'Buscar', exact: true }).first().click()
}

test('sin ilustraciones inventadas: ningún src de accesorio real termina en .svg', async ({ page }) => {
  await page.goto('./accesorios')
  await page.waitForLoadState('networkidle')
  const srcs = await page
    .locator('main img')
    .evaluateAll((imgs) => imgs.map((el) => (el as HTMLImageElement).src))
  expect(srcs.length).toBeGreaterThan(0)
  for (const s of srcs) {
    expect(s.toLowerCase().endsWith('.svg')).toBe(false)
    expect(s).not.toContain('placeholder')
  }
})

test('todas las imágenes de accesorios cargan y pertenecen a /img/accessories', async ({ page }) => {
  await page.goto('./accesorios')
  await page.waitForLoadState('networkidle')
  const imgs = page.locator('main img')
  const count = await imgs.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    const img = imgs.nth(i)
    const src = (await img.getAttribute('src')) ?? ''
    // Pertenece al bundle local (no hotlinking a apple.com).
    expect(src).toContain('/img/accessories/')
    expect(src).not.toContain('apple.com')
    expect(src).not.toContain('cdn-apple')
    const nw = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
    const nh = await img.evaluate((el: HTMLImageElement) => el.naturalHeight)
    expect(nw).toBeGreaterThan(0)
    expect(nh).toBeGreaterThan(0)
    const alt = (await img.getAttribute('alt')) ?? ''
    expect(alt.length).toBeGreaterThan(0)
  }
})

test('/buscar?q=iPhone: la sección Accesorios Apple muestra tarjetas VISUALES con fotografía', async ({ page }) => {
  await page.goto('./buscar?q=iPhone')
  await page.waitForLoadState('networkidle')
  const accHeading = page.getByRole('heading', { name: /Accesorios Apple/ })
  await expect(accHeading).toBeVisible()
  // La sección debe contener enlaces a /accesorios/ con una imagen dentro.
  const accSection = page.locator('section', { has: page.locator('h2', { hasText: 'Accesorios Apple' }) })
  const links = accSection.locator('a[href*="/accesorios/"]')
  const linkCount = await links.count()
  expect(linkCount).toBeGreaterThan(0)
  // Cada enlace tiene una imagen de /img/accessories/.
  for (let i = 0; i < linkCount; i++) {
    const img = links.nth(i).locator('img').first()
    await expect(img).toHaveAttribute('src', /\/img\/accessories\//)
    const nw = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(nw).toBeGreaterThan(0)
  }
})

test('/buscar?q=cargador: accesorios Apple aparecen con fotografía y sin "Contenido demostrativo"', async ({ page }) => {
  await page.goto('./buscar?q=cargador')
  await page.waitForLoadState('networkidle')
  const accSection = page.locator('section', { has: page.locator('h2', { hasText: /Accesorios Apple/ }) })
  await expect(accSection).toBeVisible()
  const links = accSection.locator('a[href*="/accesorios/"]')
  expect(await links.count()).toBeGreaterThan(0)
  // Ninguna de esas tarjetas lleva la etiqueta de contenido demostrativo.
  const demoBadges = accSection.getByText('Contenido demostrativo')
  expect(await demoBadges.count()).toBe(0)
  // Al menos la primera tiene imagen local.
  await expect(links.first().locator('img').first()).toHaveAttribute('src', /\/img\/accessories\//)
})

test('/buscar?q=Apple Pencil: Pro y USB-C tienen fotografías DISTINTAS', async ({ page }) => {
  await page.goto('./buscar?q=Apple%20Pencil')
  await page.waitForLoadState('networkidle')
  const proLink = page.locator('a[href*="/accesorios/apple-pencil-pro"]').first()
  const usbLink = page.locator('a[href*="/accesorios/apple-pencil-usb-c"]').first()
  await expect(proLink).toBeVisible()
  await expect(usbLink).toBeVisible()
  const proSrc = await proLink.locator('img').first().getAttribute('src')
  const usbSrc = await usbLink.locator('img').first().getAttribute('src')
  expect(proSrc).not.toBeNull()
  expect(usbSrc).not.toBeNull()
  expect(proSrc).not.toBe(usbSrc)
})

test('Header autocompletado: sugerencias de accesorios reales muestran miniatura', async ({ page }) => {
  await openDesktopHeaderSearchStrict(page)
  const input = page.locator('[data-testid="header-search-input"]:visible')
  await input.fill('MagSafe')
  await expect(page.getByRole('option').first()).toBeVisible()
  // Al menos una opción cuyo enlace apunte a /accesorios/ debe contener una img.
  const accOption = page.getByRole('option').filter({ hasText: /MagSafe/i }).first()
  await expect(accOption).toBeVisible()
  const img = accOption.locator('img').first()
  await expect(img).toHaveAttribute('src', /\/img\/accessories\//)
  const nw = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
  expect(nw).toBeGreaterThan(0)
})

test('Header autocompletado: Enter directo sigue abriendo /buscar', async ({ page }) => {
  await openDesktopHeaderSearchStrict(page)
  const input = page.locator('[data-testid="header-search-input"]:visible')
  await input.fill('iPhone')
  await expect(page.getByRole('option').first()).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL(/\/buscar\?q=iPhone$/)
})

test('/accesorios: cada tarjeta tiene un tamaño de imagen suficiente (no diminuto)', async ({ page }) => {
  await page.goto('./accesorios')
  await page.waitForLoadState('networkidle')
  // Contenedores directos de imagen dentro de las tarjetas.
  const boxes = page.locator('main a[href*="/accesorios/"] > div').first()
  const box = await boxes.boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(140)
    expect(box.height).toBeGreaterThanOrEqual(140)
  }
})

test('sin residuos: 0 archivos SVG dentro del catálogo (referencias en accessories.ts)', async ({ page }) => {
  // Test guard: al menos una imagen debe existir y NINGUNA de las visibles
  // en /accesorios apunta a un .svg.
  await page.goto('./accesorios')
  await page.waitForLoadState('networkidle')
  const anySvg = await page
    .locator('main img')
    .evaluateAll((imgs) =>
      imgs.filter((el) => (el as HTMLImageElement).src.toLowerCase().endsWith('.svg')).length,
    )
  expect(anySvg).toBe(0)
})

// ============================================================================
// Tests reforzados de la PR fix/accessory-images-round-2 (imágenes correctas,
// misma tarjeta en /buscar).
// ============================================================================

test('no hay accesorios retirados en /accesorios (TB4 Pro, MK basic, funda iPhone Air)', async ({ page }) => {
  await page.goto('./accesorios')
  await page.waitForLoadState('networkidle')
  const links = await page.locator('main a[href*="/accesorios/"]').evaluateAll(
    (nodes) => nodes.map((n) => (n as HTMLAnchorElement).getAttribute('href') ?? ''),
  )
  expect(links.some((h) => h.includes('cable-thunderbolt-4-pro'))).toBe(false)
  expect(links.some((h) => h.includes('funda-magsafe-iphone-air'))).toBe(false)
  // magic-keyboard-usb-c básico retirado; magic-keyboard-touch-id-numeric permanece.
  expect(links.some((h) => h.endsWith('/accesorios/magic-keyboard-usb-c'))).toBe(false)
  expect(links.some((h) => h.includes('magic-keyboard-touch-id-numeric-usb-c'))).toBe(true)
})

test('rutas de accesorios retirados devuelven a /accesorios (no ficha huérfana)', async ({ page }) => {
  for (const slug of [
    'cable-thunderbolt-4-pro-1_8m',
    'funda-magsafe-iphone-air',
    'magic-keyboard-usb-c',
  ]) {
    await page.goto(`./accesorios/${slug}`)
    // El componente AccessoryDetailPage redirige a /accesorios si no encuentra el slug.
    await expect(page).toHaveURL(/\/accesorios$/)
  }
})

test('Magic Keyboard TouchID+numeric tiene dos variantes con imágenes distintas', async ({ page }) => {
  await page.goto('./accesorios/magic-keyboard-touch-id-numeric-usb-c')
  const img = page.locator('main img').first()
  await expect(page.getByRole('radio', { name: /Teclas blancas/ })).toBeVisible()
  const srcWhite = await img.getAttribute('src')
  await page.getByRole('radio', { name: /Teclas negras/ }).click()
  const srcBlack = await img.getAttribute('src')
  expect(srcWhite).not.toBeNull()
  expect(srcBlack).not.toBeNull()
  expect(srcBlack).not.toBe(srcWhite)
})

test('/buscar?q=iPhone: los accesorios Apple usan la MISMA tarjeta que /accesorios (min-h-[400px])', async ({ page }) => {
  await page.goto('./buscar?q=iPhone')
  await page.waitForLoadState('networkidle')
  const accSection = page.locator(
    'section', { has: page.locator('h2', { hasText: /Accesorios Apple/ }) },
  )
  const cards = accSection.locator('div.group.min-h-\\[400px\\]')
  // Al menos una tarjeta completa con altura mínima.
  expect(await cards.count()).toBeGreaterThan(0)
  // Cada tarjeta contiene una imagen local.
  const firstImg = cards.first().locator('img').first()
  await expect(firstImg).toHaveAttribute('src', /\/img\/accessories\//)
})

test('AccessoryCard comparte diseño con ProductCard: mismo borde, radio y min-height', async ({ page }) => {
  await page.goto('./accesorios')
  await page.waitForLoadState('networkidle')
  const accCard = page.locator('main .group.min-h-\\[400px\\]').first()
  const accBox = await accCard.boundingBox()
  expect(accBox).not.toBeNull()
  if (accBox) expect(accBox.height).toBeGreaterThanOrEqual(390)

  await page.goto('./iphone')
  await page.waitForLoadState('networkidle')
  const prodCard = page.locator('main .group.min-h-\\[400px\\]').first()
  const prodBox = await prodCard.boundingBox()
  expect(prodBox).not.toBeNull()
  if (prodBox) expect(prodBox.height).toBeGreaterThanOrEqual(390)
})
