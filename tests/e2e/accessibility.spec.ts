import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Cobertura de accesibilidad con axe-core.
//
// - Se ejecutan las etiquetas oficiales `wcag2a`, `wcag2aa` y `wcag21a`
//   (WCAG 2.1 nivel A/AA).
// - **No hay reglas globalmente desactivadas.** Cada excepción posible se
//   aplicaría con `.exclude()` o `.disableRules()` en una ruta concreta,
//   justificada y limitada, no en toda la suite.
// - Reglas y contraste se comprueban también sobre la guía interactiva
//   "Preparar mi dispositivo".

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a']

const PUBLIC_ROUTES = [
  '/',
  '/iphone',
  '/iphone/17-pro',
  '/iphone/17-pro/256gb-plata',
  '/accesorios',
  '/accesorios/adaptador-corriente-usb-c-20w',
  '/buscar?q=iphone',
  '/comparar',
  '/favoritos',
  '/carrito',
  '/servicios',
  '/plan-renove',
  '/tiendas',
  '/tiendas/castillo',
  '/soporte',
  '/servicio-tecnico',
  '/elige-tu-apple',
  '/login',
  '/registro',
] as const

async function reduceMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

async function seedCartForCheckout(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'banana:cart',
      JSON.stringify([
        {
          id: 'iphone/17-pro/plata/256GB',
          modelSlug: '17-pro',
          family: 'iphone',
          name: 'iPhone 17 Pro',
          color: 'Plata',
          capacity: '256GB',
          price: 1229,
          previousPrice: null,
          qty: 1,
          insured: false,
        },
      ]),
    )
  })
}

async function analyze(page: Page, url: string) {
  await reduceMotion(page)
  if (url === '/checkout/1') await seedCartForCheckout(page)
  await page.goto('.' + url)
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
  const detail = results.violations
    .map(
      (v) =>
        `${v.id} (${v.impact ?? 'unknown'}): ${v.nodes.length} nodo(s) — ${v.help}\n` +
        v.nodes
          .slice(0, 3)
          .map((n) => `  · ${n.target.join(' ')}`)
          .join('\n'),
    )
    .join('\n')
  expect(results.violations, `Violaciones axe en ${url}:\n${detail}`).toEqual([])
}

test.describe('Accesibilidad automatizada con axe-core (sin reglas globales desactivadas)', () => {
  test.beforeEach(async ({ page }) => {
    // El aviso no modal de tienda favorita tiene su propia cobertura. Aquí
    // se desactiva para que no robe el foco justo después de cerrar el modal
    // que está verificando cada prueba.
    await page.addInitScript(() => {
      localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    })
  })

  test('portada /', async ({ page }) => {
    await analyze(page, '/')
  })

  test('familia /iphone', async ({ page }) => {
    await analyze(page, '/iphone')
  })

  test('ficha de producto /iphone/17-pro/256gb-plata', async ({ page }) => {
    await analyze(page, '/iphone/17-pro/256gb-plata')
  })

  test('tiendas /tiendas', async ({ page }) => {
    await analyze(page, '/tiendas')
  })

  test('detalle de tienda /tiendas/castillo', async ({ page }) => {
    await analyze(page, '/tiendas/castillo')
  })

  test('soporte /soporte', async ({ page }) => {
    await analyze(page, '/soporte')
  })

  test('servicio técnico /servicio-tecnico', async ({ page }) => {
    await analyze(page, '/servicio-tecnico')
  })

  test('plan renove /plan-renove', async ({ page }) => {
    await analyze(page, '/plan-renove')
  })

  test('checkout paso 1 con carrito sembrado', async ({ page }) => {
    await analyze(page, '/checkout/1')
  })

  // Sin credenciales de Supabase (el caso de CI) estas rutas enseñan su
  // aviso de configuración; con credenciales, el formulario. Ambas
  // variantes deben pasar axe.
  test('acceso /login', async ({ page }) => {
    await analyze(page, '/login')
  })

  test('registro /registro', async ({ page }) => {
    await analyze(page, '/registro')
  })

  test('accesorios /accesorios', async ({ page }) => {
    await analyze(page, '/accesorios')
  })

  test('ficha de accesorio', async ({ page }) => {
    await analyze(page, '/accesorios/adaptador-corriente-usb-c-20w')
  })

  test('perfil /cuenta en modo demostrativo', async ({ page }) => {
    await analyze(page, '/cuenta')
  })

  test('guía "Preparar mi dispositivo" abierta desde /soporte', async ({ page }) => {
    await reduceMotion(page)
    await page.goto('./soporte')
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
    // Se abre desde el callout SAT (botón secundario) — el mismo diálogo se
    // reutiliza también desde el quick-link y desde la ficha SAT.
    await page.getByRole('button', { name: 'Preparar mi dispositivo' }).first().click()
    await expect(page.getByRole('dialog', { name: 'Preparar mi dispositivo' })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).include('[role="dialog"]').analyze()
    const detail = results.violations.map((v) => `${v.id}: ${v.help}`).join('\n')
    expect(results.violations, `Violaciones axe en la guía:\n${detail}`).toEqual([])
  })

  test('selector de modelos abierto aísla el fondo y pasa axe', async ({ page }) => {
    await reduceMotion(page)
    await page.goto('./comparar')
    const opener = page.locator('[data-model-picker-trigger]').first()
    await opener.click()
    const dialog = page.getByRole('dialog', { name: /^Elegir modelo de/ })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeFocused()
    await expect
      .poll(() =>
        page
          .locator('header')
          .first()
          .evaluate((element) => Boolean(element.closest('[inert]'))),
      )
      .toBe(true)

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(results.violations, results.violations.map((v) => v.id).join(',')).toEqual([])

    await page.keyboard.press('Shift+Tab')
    await expect(dialog.locator('button:not([disabled])').last()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('menú móvil abierto pasa axe', async ({ page }) => {
    await reduceMotion(page)
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('./')
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    const dialog = page.getByRole('dialog', { name: 'Menú principal' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Cerrar menú' })).toBeFocused()
    await expect.poll(() => page.locator('main').evaluate((element) => Boolean(element.closest('[inert]')))).toBe(true)
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(results.violations, results.violations.map((v) => v.id).join(',')).toEqual([])
  })

  test('chat abierto pasa axe', async ({ page }) => {
    await reduceMotion(page)
    await page.goto('./')
    await page.getByRole('button', { name: 'Abrir chat de Bananito' }).click()
    await expect(page.getByRole('dialog', { name: 'Chat de Bananito' })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    expect(results.violations, results.violations.map((v) => v.id).join(',')).toEqual([])
  })
})

test('cada ruta pública tiene una sola región principal y supera la regla de landmark', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
  })
  for (const route of PUBLIC_ROUTES) {
    await page.goto('.' + route)
    await expect(page.locator('main'), `${route} debe tener exactamente un main`).toHaveCount(1)
    const results = await new AxeBuilder({ page }).withRules(['landmark-no-duplicate-main']).analyze()
    expect(
      results.violations,
      `Landmarks duplicados en ${route}: ${results.violations.map((v) => v.id).join(',')}`,
    ).toEqual([])
  }
})

// ============================================================================
// A62-08 — EL ERROR DESCRIBE EL CAMPO, NO LO RENOMBRA
//
// El checkout tenía su propia copia de `Field` que envolvía el control en un
// `<label>` y metía el mensaje de error DENTRO de esa etiqueta. Con un único
// control dentro, un `<label>` envolvente basta para dar nombre — y por eso
// axe seguía verde—, pero al aparecer el error el texto pasaba a formar parte
// del **nombre accesible**:
//
//   antes  → textbox "Nombre y apellidos"
//   luego  → textbox "Nombre y apellidos Introduce tu nombre."
//
// Quien navega con lector de pantalla ve cambiar el nombre del campo, y nunca
// oye que sea inválido porque no había `aria-invalid` ni `aria-describedby`.
//
// Lo que se protege aquí es la RELACIÓN, no la implementación: no se afirma
// ningún `id` —los genera `useId()`— ni ninguna clase.
// ============================================================================
test.describe('errores del checkout asociados a su campo', () => {
  // Los campos obligatorios según `validateStep1`, con su mensaje real.
  const OBLIGATORIOS = [
    { etiqueta: 'Nombre y apellidos', error: 'Introduce tu nombre.' },
    { etiqueta: 'Email', error: 'Introduce un email válido.' },
    { etiqueta: 'Dirección', error: 'Introduce la dirección de envío.' },
  ] as const

  /** Lo que un lector de pantalla deduce del control: nombre, descripción y validez. */
  async function semantica(page: Page, etiqueta: string) {
    return page.evaluate((rotulo) => {
      const textoDe = (ids: string | null) =>
        (ids ?? '')
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? `«${id}» NO EXISTE`)
          .join(' ')
      const control = [...document.querySelectorAll('input, select, textarea')].find((el) => {
        const propia = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null
        const envolvente = el.closest('label')
        return (propia ?? envolvente)?.textContent?.trim().startsWith(rotulo) ?? false
      })
      if (!control) return null
      // Nombre accesible: el `aria-label` manda; si no, la etiqueta asociada.
      const propia = control.id ? document.querySelector(`label[for="${CSS.escape(control.id)}"]`) : null
      const envolvente = control.closest('label')
      const fuente = propia ?? envolvente
      return {
        nombre: (control.getAttribute('aria-label') ?? fuente?.textContent ?? '').trim().replace(/\s+/g, ' '),
        descripcion: textoDe(control.getAttribute('aria-describedby')),
        invalido: control.getAttribute('aria-invalid'),
        obligatorio: (control as HTMLInputElement).required,
        etiquetaExplicita: propia !== null,
      }
    }, etiqueta)
  }

  test.beforeEach(async ({ page }) => {
    await reduceMotion(page)
    await seedCartForCheckout(page)
    await page.goto('./checkout/1')
    await expect(page, 'el paso 1 se abre con carrito').toHaveURL(/\/checkout\/1$/)
  })

  test('sin error, el campo se llama por su etiqueta y no se anuncia inválido', async ({ page }) => {
    for (const { etiqueta } of OBLIGATORIOS) {
      const s = await semantica(page, etiqueta)
      expect(s, `${etiqueta} existe en el paso 1`).not.toBeNull()
      expect(s!.nombre, `${etiqueta} se llama por su etiqueta`).toBe(etiqueta)
      expect(s!.invalido, `${etiqueta} no nace inválido`).not.toBe('true')
      expect(s!.descripcion, `${etiqueta} no apunta a una descripción inexistente`).toBe('')
    }
  })

  test('con error, el mensaje describe el campo sin cambiarle el nombre', async ({ page }) => {
    // Se dispara la validación real del producto, no se pinta un error a mano.
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page, 'la validación retiene el paso 1').toHaveURL(/\/checkout\/1$/)

    for (const { etiqueta, error } of OBLIGATORIOS) {
      await expect(page.getByText(error, { exact: true }), `${etiqueta} enseña su error`).toBeVisible()

      const s = await semantica(page, etiqueta)
      expect(s, `${etiqueta} sigue en pantalla`).not.toBeNull()

      // El nombre NO se contamina: esto es lo que fallaba.
      expect(s!.nombre, `el nombre de ${etiqueta} no cambia al fallar`).toBe(etiqueta)
      expect(s!.nombre, `el error no se cuela en el nombre de ${etiqueta}`).not.toContain(error)

      // El error es la DESCRIPCIÓN, resuelta desde `aria-describedby` real.
      expect(s!.descripcion, `el error de ${etiqueta} describe el campo`).toBe(error)

      // Y el control se anuncia inválido y obligatorio.
      expect(s!.invalido, `${etiqueta} se anuncia inválido`).toBe('true')
      expect(s!.obligatorio, `${etiqueta} es obligatorio para validateStep1`).toBe(true)

      // La etiqueta se asocia explícitamente, no sólo por envoltura.
      expect(s!.etiquetaExplicita, `${etiqueta} usa label/for`).toBe(true)
    }
  })
})
