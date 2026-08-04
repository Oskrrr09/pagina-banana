import { spawnSync } from 'node:child_process'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})

if (docker.status !== 0) {
  console.error('Docker no está disponible. Instálalo o arráncalo antes de ejecutar la integración Supabase local.')
  process.exit(1)
}

const status = spawnSync(npx, ['supabase', 'status', '-o', 'json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})

if (status.status !== 0) {
  process.stderr.write(status.stderr)
  console.error('Supabase local no está activo. Ejecuta npm run supabase:start primero.')
  process.exit(status.status ?? 1)
}

let values
try {
  values = JSON.parse(status.stdout)
} catch {
  console.error('La CLI no devolvió JSON válido al consultar el entorno local.')
  process.exit(1)
}

const first = (...keys) => keys.map((key) => values[key]).find(Boolean)
const url = first('API_URL', 'api_url', 'apiUrl')
const anon = first('ANON_KEY', 'anon_key', 'anonKey', 'PUBLISHABLE_KEY')
const service = first('SERVICE_ROLE_KEY', 'service_role_key', 'serviceRoleKey', 'SECRET_KEY')

if (!url || !anon || !service) {
  console.error('Faltan API_URL, ANON_KEY/PUBLISHABLE_KEY o SERVICE_ROLE_KEY/SECRET_KEY en supabase status.')
  process.exit(1)
}

console.log(`Ejecutando 27 pruebas RLS contra Supabase local (${url}).`)
const tests = spawnSync(npx, ['playwright', 'test', '--project=rls'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PW_SKIP_WEBSERVER: '1',
    RLS_TEST_URL: url,
    RLS_TEST_ANON_KEY: anon,
    RLS_TEST_SERVICE_KEY: service,
  },
})

if (tests.status !== 0) process.exit(tests.status ?? 1)

const publicEnv = {
  ...process.env,
  VITE_SUPABASE_URL: url,
  VITE_SUPABASE_ANON_KEY: anon,
}

console.log('Compilando la PWA contra el Supabase local efímero.')
const build = spawnSync(npm, ['run', 'build'], {
  stdio: 'inherit',
  env: publicEnv,
})
if (build.status !== 0) process.exit(build.status ?? 1)

console.log('Comprobando cierre de sesión y recarga offline sin datos privados.')
const pwaAuth = spawnSync(npx, ['playwright', 'test', '--project=pwa-auth'], {
  stdio: 'inherit',
  env: {
    ...publicEnv,
    E2E_CONTRA_BUILD: '1',
  },
})

process.exit(pwaAuth.status ?? 1)
