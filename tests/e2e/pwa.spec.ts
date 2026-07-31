import { test, expect } from '@playwright/test'

// Aplicación instalable (PWA) del panel de agentes.
//
// Alcance de lo que se puede comprobar aquí: la suite corre contra el dev
// server de Vite, donde el service worker NO se registra a propósito. Lo que
// depende de él (precache, arranque sin conexión, badge del Dock) solo se
// verifica sobre un build servido, y queda anotado en
// `docs/04-problemas-pendientes.md`.

const MANIFEST = '/pagina-banana/manifest-agente.webmanifest'

test.describe('identidad de app del panel', () => {
  test('el panel declara manifest, icono de iOS y color de barra', async ({ page }) => {
    await page.goto('./agente')

    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toHaveCount(1)
    await expect(manifest).toHaveAttribute('href', MANIFEST)

    // iOS ignora los iconos del manifest: sin esta etiqueta el panel se
    // instalaría en un iPhone con el icono amarillo de la tienda.
    await expect(page.locator('link[rel="apple-touch-icon"]').last()).toHaveAttribute(
      'href',
      '/pagina-banana/icons/agente-apple-touch-180.png',
    )
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
      'content',
      'Banana Agente',
    )
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffce1f')
  })

  test('la pantalla de acceso también es instalable', async ({ page }) => {
    // Es el momento en que el agente tiene la URL delante; si el manifest solo
    // colgara del panel ya autenticado, aquí no se podría instalar.
    await page.goto('./agente/login')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', MANIFEST)
  })

  test('ninguna página de la tienda ofrece instalar el panel interno', async ({ page }) => {
    for (const ruta of ['./', './iphone', './carrito', './favoritos']) {
      await page.goto(ruta)
      await expect(page.locator('link[rel="manifest"]')).toHaveCount(0)
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff')
    }
  })

  test('salir del panel deja el documento como estaba', async ({ page }) => {
    await page.goto('./')
    await page.goto('./agente')
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1)

    // Atrás resuelve dentro de la SPA, sin recargar el documento: es
    // exactamente el caso en que un desmontaje mal limpiado dejaría el
    // manifest del panel interno colgando de una página pública.
    await page.goBack()
    await expect(page).toHaveURL(/\/pagina-banana\/$/)
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff')
  })
})

test.describe('manifest', () => {
  test('se sirve y cumple los requisitos de instalación', async ({ page, request }) => {
    await page.goto('./agente')
    const response = await request.get(MANIFEST)
    expect(response.status()).toBe(200)

    const manifest = await response.json()
    expect(manifest.name).toBe('Banana Agente')
    expect(manifest.short_name).toBe('Agente')
    expect(manifest.display).toBe('standalone')

    // El scope acota la app al panel: los enlaces a la tienda salen al
    // navegador en vez de abrirse dentro de la ventana del agente.
    expect(manifest.start_url).toBe('/pagina-banana/agente')
    expect(manifest.scope).toBe('/pagina-banana/agente')

    // Chrome exige al menos 192 y 512, y uno `maskable` para que Android no
    // dibuje el icono dentro de un cuadrado blanco.
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true)
  })

  test('todos los iconos declarados existen', async ({ request }) => {
    const manifest = await (await request.get(MANIFEST)).json()
    for (const icon of manifest.icons as { src: string }[]) {
      const response = await request.get(icon.src)
      expect(response.status(), `${icon.src} no se sirve`).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
    }
  })
})

test('en desarrollo no se registra ningún service worker', async ({ page }) => {
  // Regresión deliberada. Un service worker cacheando entre recargas pelearía
  // con el HMR de Vite y, sobre todo, con esta misma suite: es el mismo tipo
  // de fuga que hizo que las pruebas escribieran en el Supabase real (QA-002).
  await page.goto('./agente')
  const registros = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 0
    return (await navigator.serviceWorker.getRegistrations()).length
  })
  expect(registros).toBe(0)
})
