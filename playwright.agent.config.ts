import { defineConfig, devices } from '@playwright/test'

const PORT = 5174
const HOST = `http://127.0.0.1:${PORT}`
const FIXTURE = `${HOST}/pagina-banana/tests/e2e-agent/fixture.html`

export default defineConfig({
  testDir: './tests/e2e-agent',
  testMatch: 'agent-panel.spec.ts',
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
