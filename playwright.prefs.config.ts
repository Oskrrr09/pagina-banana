import { defineConfig, devices } from '@playwright/test'

// Fixture aislado de las preferencias de cuenta, con el mismo planteamiento que
// `playwright.agent.config.ts`: monta los proveedores reales en un navegador
// real, con su `localStorage`, sin arrastrar la aplicación entera.
//
// Va en su propia configuración y no como un proyecto de `playwright.config.ts`
// porque necesita el servidor de desarrollo: la suite principal se ejecuta en
// CI contra el `dist` compilado, y ahí los ficheros de prueba no existen.

const PORT = 5175
const HOST = `http://127.0.0.1:${PORT}`
const FIXTURE = `${HOST}/pagina-banana/tests/e2e-prefs/fixture.html`

export default defineConfig({
  testDir: './tests/e2e-prefs',
  testMatch: 'preferencias-cierre-sesion.spec.ts',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: FIXTURE,
    locale: 'es-ES',
  },
  webServer: {
    command: `npm run dev -- --mode test --host 127.0.0.1 --port ${PORT} --strictPort`,
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    url: FIXTURE,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
