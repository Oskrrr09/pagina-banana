/**
 * scripts/banana-audit/create-session.ts
 *
 * Prepara una sesión manual sobre https://tienda.bananacomputer.com/ para la
 * auditoría de UX. El script:
 *
 *  1. Muestra un aviso claro sobre qué cuenta se debe usar.
 *  2. Abre Chromium en modo visible.
 *  3. Deja que la persona navegue e inicie sesión a mano (email, contraseña
 *     y 2FA se teclean directamente en el navegador — este script NO los
 *     lee, ni los intercepta, ni los guarda en ningún log).
 *  4. Espera una confirmación explícita en la terminal.
 *  5. Guarda únicamente el `storageState` de Playwright en
 *     `playwright/.auth/banana-test-user.json`.
 *  6. Comprueba con `git check-ignore` que ese archivo está fuera de Git.
 *  7. No imprime el contenido de la sesión, ni cookies, ni tokens, ni
 *     cabeceras.
 *
 * Uso:  npm run audit:banana:login
 */

import { chromium } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const SESSION_PATH = resolve('playwright/.auth/banana-test-user.json')
const START_URL = 'https://tienda.bananacomputer.com/'

function warn(msg: string) {
  // Todos los mensajes salen a stderr para no ensuciar stdout con nada que
  // pudiera ser capturado por un pipe.
  process.stderr.write(msg.endsWith('\n') ? msg : `${msg}\n`)
}

function ensureIgnored(path: string): boolean {
  // `git check-ignore --quiet` sale con 0 si el path está ignorado, 1 si no.
  const res = spawnSync('git', ['check-ignore', '--quiet', path], {
    stdio: 'ignore',
  })
  return res.status === 0
}

async function main() {
  warn('')
  warn('══════════════════════════════════════════════════════════════════')
  warn(' Auditoría UX — sesión manual sobre tienda.bananacomputer.com')
  warn('══════════════════════════════════════════════════════════════════')
  warn('')
  warn(' AVISO IMPORTANTE')
  warn(' ----------------')
  warn(' Utiliza una cuenta de prueba sin pedidos personales, direcciones')
  warn(' reales, facturas, tarjetas, documentos ni información sensible.')
  warn('')
  warn(' Este script NO va a leer, mostrar ni guardar tu contraseña, tu')
  warn(' 2FA, cookies ni tokens. Tú tecleas las credenciales directamente')
  warn(' en el navegador que se abrirá a continuación.')
  warn('')
  warn(' Cuando termines de iniciar sesión y estés dentro de tu cuenta,')
  warn(' vuelve a esta terminal y pulsa ENTER para guardar la sesión.')
  warn('')
  warn(' Si no quieres continuar, pulsa Ctrl+C ahora.')
  warn('')

  const rl = createInterface({ input, output })
  await rl.question('Pulsa ENTER para abrir Chromium… ')

  // Asegura la carpeta destino sin crear el archivo.
  mkdirSync(dirname(SESSION_PATH), { recursive: true })

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  try {
    await page.goto(START_URL, { waitUntil: 'domcontentloaded' })
    warn('')
    warn(' Navegador abierto. Inicia sesión manualmente ahora.')
    warn(' Cuando estés dentro de tu cuenta, vuelve a esta terminal.')
    warn('')

    await rl.question('¿Sesión iniciada correctamente? Pulsa ENTER para guardarla y cerrar… ')

    // Guarda únicamente el storageState (cookies + localStorage por origen).
    // Nunca se imprime el contenido de este archivo.
    await context.storageState({ path: SESSION_PATH })
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
    rl.close()
  }

  if (!existsSync(SESSION_PATH)) {
    warn('')
    warn(' [ERROR] No se pudo guardar la sesión. Repite el proceso.')
    process.exit(1)
  }

  const size = statSync(SESSION_PATH).size
  const ignored = ensureIgnored(SESSION_PATH)

  warn('')
  warn('──────────────────────────────────────────────────────────────────')
  warn(` Sesión creada:          sí (${size} bytes)`)
  warn(` Ruta local:             ${SESSION_PATH}`)
  warn(` Ignorada por Git:       ${ignored ? 'sí' : 'NO (revisa .gitignore)'}`)
  warn('──────────────────────────────────────────────────────────────────')
  warn('')
  warn(' No se ha impreso ni volcado el contenido de la sesión.')
  warn(' Ya puedes lanzar la auditoría cuando esté disponible el runner.')
  warn('')

  if (!ignored) {
    // No devolvemos error a la shell, pero avisamos con código != 0 para que
    // ningún CI acepte accidentalmente una sesión mal ignorada.
    process.exit(2)
  }
}

main().catch((error: unknown) => {
  // Solo imprimimos el mensaje del error para no volcar objetos que puedan
  // contener detalles del contexto del navegador.
  const message = error instanceof Error ? error.message : 'desconocido'
  warn(`\n[ERROR] La creación de sesión falló: ${message}\n`)
  process.exit(1)
})
