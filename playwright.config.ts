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

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `${HOST}${BASE_PATH}`,
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
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
      grep: /@mobile|@all/,
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port ' + PORT,
    url: `${HOST}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
})
