// Segunda pasada de integración, con la CONFIRMACIÓN DE EMAIL ACTIVADA.
//
// POR QUÉ HACE FALTA UNA PASADA APARTE
//
// La conversión de una sesión anónima en cuenta permanente se comporta de dos
// maneras distintas según `enable_confirmations`. Con la confirmación apagada
// —que es como está el entorno local por defecto— el email se da por bueno al
// instante y la conversión termina en una llamada. Con ella encendida hay que
// verificar el correo antes de poder poner la contraseña, y la sesión sigue
// siendo anónima mientras tanto.
//
// Probar sólo la primera configuración deja el camino real sin cubrir y hace
// que el código dependa, sin decirlo, de que el proyecto tenga la
// autoconfirmación puesta. Aquí se enciende la confirmación, se levanta
// Supabase con ella y se ejecuta la suite que recorre el flujo documentado de
// dos pasos.
//
// `supabase/config.toml` se modifica en el disco porque la CLI no admite un
// fichero de configuración alternativo. Se restaura siempre al terminar, tanto
// si la suite pasa como si falla o si se interrumpe.

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const CONFIG = 'supabase/config.toml'

const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})
if (docker.status !== 0) {
  console.error('Docker no está disponible. Instálalo o arráncalo antes de ejecutar esta pasada.')
  process.exit(1)
}

const original = readFileSync(CONFIG, 'utf8')

/** Enciende la confirmación de email y lo que el flujo documentado necesita. */
function configConConfirmacion(texto) {
  let salida = texto.replace(/^enable_confirmations = false$/m, 'enable_confirmations = true')
  if (!/^enable_confirmations = true$/m.test(salida)) {
    throw new Error('No se encontró enable_confirmations en config.toml; revisa el fichero.')
  }
  // Confirmar en las dos direcciones no aplica a una cuenta anónima —no tiene
  // email anterior— y complica la lectura del buzón sin añadir cobertura.
  salida = salida.replace(/^double_confirm_changes = true$/m, 'double_confirm_changes = false')
  // La documentación de Supabase exige el enlazado manual para asociar una
  // identidad a una cuenta anónima.
  if (!/^enable_manual_linking/m.test(salida)) {
    salida = salida.replace(
      /^enable_anonymous_sign_ins = true$/m,
      'enable_anonymous_sign_ins = true\nenable_manual_linking = true',
    )
  }
  // Servidor de correo local, de donde la suite saca el enlace de confirmación.
  if (!/^\[inbucket\]/m.test(salida)) {
    salida += '\n[inbucket]\nenabled = true\nport = 54324\n'
  }
  return salida
}

function ejecutar(comando, argumentos, opciones = {}) {
  return spawnSync(comando, argumentos, { stdio: 'inherit', ...opciones })
}

let codigo = 1
try {
  writeFileSync(CONFIG, configConConfirmacion(original))
  console.log('Reiniciando Supabase local con la confirmación de email activada.')
  ejecutar(npx, ['supabase', 'stop'])
  const arranque = ejecutar(npx, ['supabase', 'start'])
  if (arranque.status !== 0) throw new Error('No se pudo arrancar Supabase con la nueva configuración.')
  const reset = ejecutar(npx, ['supabase', 'db', 'reset'])
  if (reset.status !== 0) throw new Error('No se pudieron aplicar las migraciones.')

  const estado = spawnSync(npx, ['supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (estado.status !== 0) throw new Error('supabase status falló tras el arranque.')
  const valores = JSON.parse(estado.stdout)
  const primero = (...claves) => claves.map((c) => valores[c]).find(Boolean)
  const url = primero('API_URL', 'api_url')
  const anon = primero('ANON_KEY', 'anon_key', 'PUBLISHABLE_KEY')
  const service = primero('SERVICE_ROLE_KEY', 'service_role_key', 'SECRET_KEY')
  const correo = primero('INBUCKET_URL', 'inbucket_url', 'MAILPIT_URL', 'mailpit_url') ?? 'http://127.0.0.1:54324'
  if (!url || !anon || !service) throw new Error('Faltan URL o claves en supabase status.')

  console.log(`Ejecutando la conversión anónimo → permanente con confirmación (${url}).`)
  const pruebas = ejecutar(npx, ['playwright', 'test', '--project=confirmacion'], {
    env: {
      ...process.env,
      PW_SKIP_WEBSERVER: '1',
      RLS_TEST_URL: url,
      RLS_TEST_ANON_KEY: anon,
      RLS_TEST_SERVICE_KEY: service,
      RLS_TEST_MAIL_URL: correo,
    },
  })
  codigo = pruebas.status ?? 1
} catch (e) {
  console.error(e.message)
  codigo = 1
} finally {
  // Pase lo que pase, el repositorio queda como estaba. Un config.toml con la
  // confirmación encendida cambiaría en silencio el resto de las suites.
  writeFileSync(CONFIG, original)
  console.log('Configuración de Supabase restaurada.')
  ejecutar(npx, ['supabase', 'stop'])
}

process.exit(codigo)
