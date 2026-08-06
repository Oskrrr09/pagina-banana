import { defineConfig, devices } from '@playwright/test'

// Fixtures aislados de la cuenta, con el mismo planteamiento que
// `playwright.agent.config.ts`: montan proveedores y pantallas reales en un
// navegador real, con su `localStorage`, sin arrastrar la aplicación entera.
//
// Dos fixtures: los proveedores de preferencias, y la pantalla `/cuenta` con el
// contexto de sesión inyectado. Cada spec navega a su propio HTML.
//
// Va en su propia configuración y no como un proyecto de `playwright.config.ts`
// porque necesita el servidor de desarrollo: la suite principal se ejecuta en
// CI contra el `dist` compilado, y ahí los ficheros de prueba no existen.

const PORT = 5175
const HOST = `http://127.0.0.1:${PORT}`
const FIXTURE = `${HOST}/pagina-banana/tests/e2e-prefs/fixture.html`

export default defineConfig({
  testDir: './tests/e2e-prefs',
  testMatch: /-cierre-sesion\.spec\.ts$/,
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
    // `ProfilePage` se corta antes de renderizar si Supabase no está
    // configurado. Se le dan valores inequívocamente falsos —puerto 9, que
    // rechaza cualquier conexión— porque el fixture inyecta el contexto de
    // sesión y nunca llega a hacer una petición.
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:9/supabase-inexistente',
      VITE_SUPABASE_ANON_KEY: 'clave-falsa-solo-para-el-fixture',
    },
    url: FIXTURE,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
