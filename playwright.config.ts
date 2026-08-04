import { defineConfig, devices } from '@playwright/test'

// Configuración de Playwright.
// - Levanta Vite en modo dev (`npm run dev`) sobre el puerto 5173.
// - En dev el basename por defecto de Vite es `/pagina-banana/`, por lo que
//   `baseURL` incluye esa ruta para reflejar el entorno de producción.
// - En CI se ejecuta con más retries, sin `--headed` y guardando artefactos
//   (traces/screenshots/vídeo) cuando una prueba falla.

const PORT = Number(process.env.PW_PORT ?? 5173)
const BASE_PATH = process.env.PW_BASE_PATH ?? '/pagina-banana/'
const HOST = `http://127.0.0.1:${PORT}`
const SKIP_WEBSERVER = process.env.PW_SKIP_WEBSERVER === '1'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `${HOST}${BASE_PATH}`,
    // La tienda detecta el idioma del navegador, y el de Playwright viene en
    // inglés. Sin fijarlo aquí, toda la suite —escrita en castellano— se
    // ejecutaría contra la versión inglesa. Las pruebas que miden la
    // detección lo sobrescriben con su propio `test.use({ locale })`.
    locale: 'es-ES',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Mobile project usa un dispositivo Chromium (Pixel 5) para no exigir
      // que WebKit esté instalado en CI. Solo corren las pruebas con marca
      // `@mobile` o `@all`.
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      grep: /@mobile|@all/,
    },
    {
      // Políticas RLS contra un proyecto de Supabase dedicado. No entra en la
      // ejecución por defecto: necesita base de datos real y credenciales
      // propias. Ver tests/rls/README.md.
      name: 'rls',
      testDir: './tests/rls',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: SKIP_WEBSERVER
    ? undefined
    : {
        // En CI se sirve el `dist` ya compilado —el mismo artefacto que se
        // publica— en vez del servidor de desarrollo. Así las pruebas ven el base
        // path real y los assets procesados, que es donde se esconden los fallos
        // que solo aparecen en producción.
        command: process.env.E2E_CONTRA_BUILD
          ? `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`
          : `npm run dev -- --mode test --host 127.0.0.1 --port ${PORT}`,
        // Las pruebas corren SIEMPRE en modo demo, sin backend.
        //
        // Sin esto, un `npx playwright test` en local creaba visitantes y
        // conversaciones de mentira en el Supabase de verdad del proyecto,
        // mezclados con los reales. Además así local y CI prueban lo mismo:
        // el workflow tampoco tiene credenciales.
        //
        // Se pasan por `env` y no solo con `.env.test` porque Vite da máxima
        // prioridad a las variables que ya existen en el entorno: un
        // `.env.local` con credenciales no puede volver a colarse.
        env: {
          VITE_SUPABASE_URL: '',
          VITE_SUPABASE_ANON_KEY: '',
        },
        url: `${HOST}${BASE_PATH}`,
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore',
        stderr: 'pipe',
        timeout: 120_000,
      },
})
