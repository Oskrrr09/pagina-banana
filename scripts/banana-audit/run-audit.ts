/**
 * scripts/banana-audit/run-audit.ts
 *
 * Runner manual de auditoría UX sobre tienda.bananacomputer.com.
 *
 *  - Nunca se añade a GitHub Actions ni al E2E normal (no toca
 *    `playwright.config.ts` ni `.github/workflows/`).
 *  - Se ejecuta a mano con `npm run audit:banana`.
 *  - Recorre por defecto sólo páginas públicas (portada, familias, ficha,
 *    tiendas, servicios, soporte, footer legal…). No pulsa botones que
 *    puedan generar pedidos, cargos o modificaciones de la cuenta.
 *  - Con `-- --auth` reutiliza la sesión guardada en
 *    `playwright/.auth/banana-test-user.json`, sin leer su contenido en
 *    ningún log, para recorrer también /cuenta, /pedidos y demás páginas
 *    privadas. Si el flag está activo y no existe la sesión, aborta con
 *    un mensaje comprensible y salida != 0.
 *  - Cada página se visita en dos proyectos: `desktop` (Chromium 1440×900)
 *    y `mobile` (Pixel 5, aprox. 390×844). Se captura título, cantidad de
 *    enlaces/imágenes, campos de formulario sin `label`, errores JS y de
 *    red y una captura de pantalla anonimizada en `audit-private/banana/`.
 *  - El archivo `audit-private/banana/report.json` resume la ejecución;
 *    también queda ignorado por Git.
 *
 * Uso:
 *   npm run audit:banana              # solo público
 *   npm run audit:banana -- --auth    # + páginas privadas con sesión
 */

import { chromium, devices, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const BASE = 'https://tienda.bananacomputer.com'
const SESSION_PATH = resolve('playwright/.auth/banana-test-user.json')
const OUTPUT_DIR = resolve('audit-private/banana')

const PUBLIC_PAGES: Array<{ id: string; path: string; note?: string }> = [
  { id: 'home', path: '/' },
  { id: 'iphone', path: '/comprar-un-iphone/', note: 'catálogo iPhone' },
  { id: 'mac', path: '/comprar-un-mac/', note: 'catálogo Mac' },
  { id: 'ipad', path: '/comprar-un-ipad/', note: 'catálogo iPad' },
  { id: 'apple-watch', path: '/comprar-un-apple-watch/', note: 'catálogo Watch' },
  { id: 'airpods', path: '/accesorios-apple/airpods/', note: 'catálogo AirPods' },
  { id: 'accesorios', path: '/accesorios/' },
  { id: 'ficha-iphone', path: '/comprar-un-iphone/iphone-17-pro/', note: 'ficha ejemplo' },
  { id: 'ficha-mac', path: '/comprar-un-mac/macbook-air-13-m5/', note: 'ficha ejemplo Mac' },
  { id: 'comparar-iphone', path: '/comparar-iphone/' },
  { id: 'rincon-chollo', path: '/servicios/rincon-del-chollo/', note: 'ofertas' },
  { id: 'seguros', path: '/servicios/seguros-a-todo-riesgo/' },
  { id: 'plan-renove', path: '/plan-renove/' },
  { id: 'servicio-tecnico', path: '/servicio-tecnico/' },
  { id: 'tiendas', path: '/tiendas/' },
  { id: 'tienda-detalle', path: '/tienda/plaza-de-espana-las-palmas-gc/', note: 'ficha tienda' },
  { id: 'soporte', path: '/soporte-banana/' },
  { id: 'empresas', path: '/empresas/' },
  { id: 'educacion', path: '/educacion/' },
  { id: 'descuento-educativo', path: '/descuento-educativo/' },
  { id: 'financiacion', path: '/financiacion/' },
  { id: 'envios-domicilio', path: '/envios-a-domicilio/' },
  { id: 'privacidad', path: '/politica-de-privacidad/' },
]

// Páginas que sólo se visitan con `--auth` (requieren sesión). El runner
// nunca pulsa aquí ningún control destructivo.
const PRIVATE_PAGES: Array<{ id: string; path: string; note?: string }> = [
  { id: 'cuenta', path: '/cuenta' },
  { id: 'pedidos', path: '/mi-cuenta/pedidos' },
  { id: 'direcciones', path: '/mi-cuenta/direcciones' },
  { id: 'favoritos', path: '/mi-cuenta/favoritos' },
]

type Project = { name: 'desktop' | 'mobile'; device: Parameters<Browser['newContext']>[0] }

const PROJECTS: Project[] = [
  {
    name: 'desktop',
    device: { viewport: { width: 1440, height: 900 } },
  },
  {
    name: 'mobile',
    device: { ...devices['Pixel 5'] },
  },
]

type PageReport = {
  id: string
  project: 'desktop' | 'mobile'
  path: string
  finalUrl: string
  statusFirstResponse: number | null
  title: string
  h1: string[]
  linkCount: number
  imageCount: number
  imagesWithoutAlt: number
  formFieldsWithoutLabel: number
  consoleErrors: string[]
  networkErrors: Array<{ status: number; url: string }>
  screenshot: string
}

function log(msg: string) {
  // Todos los mensajes van a stderr para poder redirigir stdout a un JSON.
  process.stderr.write(msg.endsWith('\n') ? msg : `${msg}\n`)
}

function isIgnored(path: string): boolean {
  const res = spawnSync('git', ['check-ignore', '--quiet', path], { stdio: 'ignore' })
  return res.status === 0
}

/**
 * Redacta cualquier ocurrencia de email, teléfono o números largos (que en
 * este contexto suelen ser IDs de pedido, DNI/NIF o similares) antes de
 * dejar rastro en logs o `report.json`.
 */
function anonymize(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}/g, '[num]')
    .replace(/\b[0-9A-Z]{6,}\b/g, (match) =>
      /[a-z]/.test(match) ? match : '[id]',
    )
    .trim()
}

async function auditPage(
  context: BrowserContext,
  project: 'desktop' | 'mobile',
  entry: { id: string; path: string },
): Promise<PageReport> {
  const page: Page = await context.newPage()
  const consoleErrors: string[] = []
  const networkErrors: PageReport['networkErrors'] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(anonymize(msg.text()).slice(0, 300))
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(anonymize(err.message).slice(0, 300))
  })
  page.on('response', (res) => {
    const status = res.status()
    if (status >= 400) {
      const url = res.url().replace(/\?.*$/, '?…')
      networkErrors.push({ status, url })
    }
  })

  const url = `${BASE}${entry.path}`
  let statusFirstResponse: number | null = null
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    statusFirstResponse = response ? response.status() : null
    // Pausa breve para permitir hidratación sin abusar del servidor.
    await page.waitForTimeout(1_200)
  } catch (err) {
    consoleErrors.push(`[navigation] ${anonymize(err instanceof Error ? err.message : 'error')}`)
  }

  const title = anonymize(await page.title().catch(() => ''))
  const h1 = (
    await page
      .locator('h1')
      .allTextContents()
      .catch(() => [] as string[])
  )
    .map((t) => anonymize(t).slice(0, 160))
    .filter(Boolean)
    .slice(0, 5)

  const linkCount = await page.locator('a[href]').count().catch(() => 0)
  const imageCount = await page.locator('img').count().catch(() => 0)
  const imagesWithoutAlt = await page.locator('img:not([alt])').count().catch(() => 0)
  const formFieldsWithoutLabel = await page
    .locator('input:not([type=hidden]):not([aria-label]):not([aria-labelledby])')
    .evaluateAll((nodes) => {
      let count = 0
      for (const node of nodes) {
        const id = node.getAttribute('id')
        const wrappedByLabel = node.closest('label')
        if (wrappedByLabel) continue
        if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) continue
        count += 1
      }
      return count
    })
    .catch(() => 0)

  const screenshot = resolve(OUTPUT_DIR, `${project}-${entry.id}.png`)
  mkdirSync(dirname(screenshot), { recursive: true })
  await page
    .screenshot({ path: screenshot, fullPage: false, timeout: 15_000 })
    .catch(() => undefined)

  await page.close()

  return {
    id: entry.id,
    project,
    path: entry.path,
    finalUrl: page.url() || url,
    statusFirstResponse,
    title,
    h1,
    linkCount,
    imageCount,
    imagesWithoutAlt,
    formFieldsWithoutLabel,
    consoleErrors: consoleErrors.slice(0, 8),
    networkErrors: networkErrors.slice(0, 12),
    screenshot: screenshot.replace(process.cwd() + '/', ''),
  }
}

async function main() {
  const args = process.argv.slice(2)
  const wantsAuth = args.includes('--auth')

  if (wantsAuth && !existsSync(SESSION_PATH)) {
    log('')
    log('[ERROR] --auth solicitado pero no existe la sesión en:')
    log(`         ${SESSION_PATH}`)
    log('        Ejecuta antes: npm run audit:banana:login')
    log('')
    process.exit(2)
  }

  mkdirSync(OUTPUT_DIR, { recursive: true })
  if (!isIgnored(OUTPUT_DIR)) {
    log('[ERROR] audit-private/ no está ignorado por Git. Aborta antes de escribir.')
    process.exit(3)
  }

  log('')
  log('──────────────────────────────────────────────────────────────────')
  log(' Auditoría UX manual sobre tienda.bananacomputer.com')
  log(`   Modo: ${wantsAuth ? 'público + privado con sesión' : 'solo público'}`)
  log(`   Salida (ignorada por Git): ${OUTPUT_DIR}`)
  log('──────────────────────────────────────────────────────────────────')

  const pages = wantsAuth ? [...PUBLIC_PAGES, ...PRIVATE_PAGES] : PUBLIC_PAGES
  const reports: PageReport[] = []

  const browser = await chromium.launch({ headless: true })

  try {
    for (const project of PROJECTS) {
      log(`\n== Proyecto: ${project.name} ==`)
      const context = await browser.newContext({
        ...project.device,
        ...(wantsAuth ? { storageState: SESSION_PATH } : {}),
      })
      // Nunca imprimimos storageState. Playwright lo carga silenciosamente.

      for (const entry of pages) {
        log(`  → ${entry.path}`)
        const report = await auditPage(context, project.name, entry)
        reports.push(report)
      }

      await context.close()
    }
  } finally {
    await browser.close().catch(() => {})
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    projects: PROJECTS.map((p) => p.name),
    authenticated: wantsAuth,
    pages: reports,
  }
  const reportPath = resolve(OUTPUT_DIR, 'report.json')
  writeFileSync(reportPath, JSON.stringify(summary, null, 2))

  log('')
  log('──────────────────────────────────────────────────────────────────')
  log(` Páginas auditadas: ${reports.length}`)
  log(` Informe (JSON) local: ${reportPath}`)
  log(' Capturas y JSON quedan bajo audit-private/ (ignorado por Git).')
  log('──────────────────────────────────────────────────────────────────')
  log('')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'desconocido'
  log(`\n[ERROR] La auditoría falló: ${anonymize(message)}\n`)
  process.exit(1)
})
