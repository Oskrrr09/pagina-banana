import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Vigila que no se cuele una credencial de servidor en algo que se publica.
//
// Es fácil de cometer y muy caro: basta renombrar una variable a `VITE_` para
// que Vite la incruste en el JavaScript que descarga cualquiera. La clave
// `service_role` de Supabase **salta todas las políticas RLS**, así que
// filtrarla equivale a publicar la base de datos entera con permiso de
// escritura.
//
// La clave anónima sí puede ir en el bundle: para eso está, y es la que las
// políticas mantienen a raya.
//
// DOS CONTRATOS DISTINTOS, Y CONVIENE NO CONFUNDIRLOS
//
// 1 · SEGURIDAD — que el frontend publicado no lleve una credencial
//     privilegiada (`service_role` y compañía). Se comprueba sobre el código
//     fuente y sobre el artefacto.
// 2 · AISLAMIENTO — que el artefacto que sirven las PRUEBAS no apunte a un
//     Supabase real, para que la suite no escriba visitantes y conversaciones
//     de mentira en el proyecto de verdad. Ya pasó una vez (QA-002).
//
// El segundo no es un problema de seguridad: la anon key está diseñada para
// viajar al cliente y la protección real es RLS. Es un problema de aislamiento
// de las pruebas, y por eso `build:test` la vacía a propósito.
//
// POR QUÉ CAMBIÓ EL CONTRATO DE LAS DOS COMPROBACIONES DE ARTEFACTO
//
// Antes hacían `test.skip(!existsSync(dist))` sin más. Es decir: quien
// ejecutara una validación que dice inspeccionar el bundle y no tuviera bundle
// obtenía «PASS · 2 skipped» — una omisión silenciosa disfrazada de
// aprobación. Ahora se distingue:
//
// - Si se está validando el ARTEFACTO —`E2E_CONTRA_BUILD=1`, que es lo que
//   hacen el CI y `npm run test:artefacto`—, la ausencia de `dist` es un FALLO
//   de precondición.
// - Si se está corriendo la suite normal contra el servidor de desarrollo, no
//   hay artefacto que validar y se omite diciendo por qué.

/** Recorre un directorio y devuelve las rutas de sus ficheros. */
function ficheros(dir: string): string[] {
  if (!existsSync(dir)) return []
  const salida: string[] = []
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) salida.push(...ficheros(ruta))
    else salida.push(ruta)
  }
  return salida
}

test('ninguna variable VITE_ expone una clave de servicio', () => {
  const sospechosas: string[] = []
  for (const fichero of ['.env.example', 'vite.config.ts', 'playwright.config.ts']) {
    const ruta = join(process.cwd(), fichero)
    if (!existsSync(ruta)) continue
    for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
      // Se busca la asignación, no la palabra: `.env.example` la menciona a
      // propósito en un comentario para avisar de que no se ponga aquí.
      if (/^\s*VITE_[A-Z_]*(SERVICE|SECRET|PRIVATE)[A-Z_]*\s*=/.test(linea)) {
        sospechosas.push(`${fichero}: ${linea.trim()}`)
      }
    }
  }
  expect(sospechosas, `Una variable VITE_ acaba dentro del JavaScript público:\n  ` + sospechosas.join('\n  ')).toEqual(
    [],
  )
})

test('el código fuente no lee una clave de servicio desde el entorno del cliente', () => {
  const ofensores: string[] = []
  for (const ruta of ficheros(join(process.cwd(), 'src'))) {
    if (!/\.(ts|tsx)$/.test(ruta)) continue
    const src = readFileSync(ruta, 'utf8')
    if (/import\.meta\.env\.[A-Za-z_]*(SERVICE_ROLE|SERVICE_KEY|SECRET)/.test(src)) {
      ofensores.push(ruta.replace(process.cwd() + '/', ''))
    }
  }
  expect(
    ofensores,
    `Estos ficheros leen una credencial de servidor desde el cliente:\n  ` + ofensores.join('\n  '),
  ).toEqual([])
})

/**
 * ¿Se está validando el artefacto, o corriendo contra el servidor de desarrollo?
 *
 * Es la misma variable con la que el CI decide servir el `dist` compilado, así
 * que las dos cosas no pueden desincronizarse.
 */
const VALIDANDO_ARTEFACTO = process.env.E2E_CONTRA_BUILD === '1'
const DIST = join(process.cwd(), 'dist')

/**
 * Los roles declarados por los JWT que haya dentro de un fichero.
 *
 * QUÉ DETECTA, EXACTAMENTE
 *
 * Cadenas con tres segmentos base64url separados por puntos. De cada candidata
 * se decodifica el SEGUNDO segmento —el payload— y, si resulta ser JSON con un
 * campo `role`, se devuelve ese rol. Nada más: no se valida la firma ni se
 * interpreta el token de ninguna otra forma.
 *
 * ES DEFENSIVO A PROPÓSITO
 *
 * Un bundle minificado tiene muchas cadenas con puntos que no son tokens. Todo
 * lo que no decodifique, o no sea JSON, o no traiga `role`, se descarta en
 * silencio: la comprobación no puede caerse por encontrarse algo raro, porque
 * entonces dejaría de vigilar.
 *
 * QUÉ NO DETECTA, Y SE DICE A PROPÓSITO
 *
 * Los formatos de clave de Supabase que no son JWT no se buscan por prefijo.
 * Inventarse un prefijo daría una sensación de cobertura que no existe; añadir
 * uno real exige mirar la documentación oficial vigente y es una decisión
 * aparte de esta prueba.
 */
function rolesDeTokens(contenido: string): string[] {
  const roles: string[] = []
  const candidatos = contenido.match(/[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g) ?? []
  for (const candidato of candidatos) {
    const payload = candidato.split('.')[1]
    try {
      const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: unknown }
      if (typeof json.role === 'string') roles.push(json.role)
    } catch {
      /* no era un token: ni se decodifica ni es JSON. Se ignora. */
    }
  }
  return roles
}

/** La precondición del contrato: si digo que valido el bundle, tiene que haberlo. */
function exigirArtefacto(motivo: string) {
  if (!VALIDANDO_ARTEFACTO) {
    // Se omite SIEMPRE, exista o no `dist/`. Antes se omitía sólo cuando no
    // había artefacto, así que un `dist` que hubiera quedado de una ejecución
    // anterior se inspeccionaba igualmente: un bundle viejo, que no tiene por
    // qué corresponder con lo que sirve el servidor de desarrollo, dando un
    // veredicto sobre algo que nadie ha pedido validar. Fuera de
    // `E2E_CONTRA_BUILD` el artefacto no forma parte del experimento.
    test.skip(true, 'Modo desarrollo: el artefacto no forma parte de este experimento. Usa `npm run test:artefacto`.')
    return
  }
  expect(
    existsSync(DIST),
    `PRECONDICIÓN INCUMPLIDA: se pidió validar el artefacto (E2E_CONTRA_BUILD=1) y no existe \`dist/\`. ${motivo} ` +
      'Compílalo con `npm run build:test`. Esto NO puede omitirse: una validación de bundle sin bundle no valida nada.',
  ).toBe(true)
}

test('el bundle construido no contiene una clave de servicio', () => {
  exigirArtefacto('No se puede afirmar que el bundle publicado esté limpio de credenciales privilegiadas.')
  const dist = DIST

  const ofensores: string[] = []
  for (const ruta of ficheros(dist)) {
    if (!/\.(js|css|html|webmanifest|json)$/.test(ruta)) continue
    const contenido = readFileSync(ruta, 'utf8')
    const corto = ruta.replace(process.cwd() + '/', '')

    // 1 · El literal, por si aparece en claro en una constante o un comentario.
    if (contenido.includes('service_role')) ofensores.push(`${corto} (literal)`)

    // 2 · Y el rol DENTRO del token, que es donde de verdad viaja.
    //
    // Buscar sólo el literal era un falso verde de seguridad, y está medido:
    // con un JWT sintético de rol `service_role` dentro del bundle, la
    // comprobación pasaba. El payload va en base64url, así que la cadena
    // `service_role` no aparece por ninguna parte del fichero.
    for (const rol of rolesDeTokens(contenido)) {
      if (rol === 'service_role') ofensores.push(`${corto} (JWT con role=service_role)`)
    }
  }
  expect(ofensores, `Estos artefactos publicados mencionan service_role:\n  ` + ofensores.join('\n  ')).toEqual([])
})

test('el bundle que sirven las pruebas no apunta a ningún Supabase', () => {
  // El fallo que esto vigila es sutil: Vite **incrusta** las variables VITE_
  // en el JavaScript durante el build. No son configuración de ejecución.
  //
  // Servir el bundle de producción en las pruebas y vaciar las variables del
  // proceso que lo sirve no cambia nada: las credenciales ya están dentro del
  // .js, y las pruebas acabarían escribiendo visitantes y conversaciones de
  // mentira en el Supabase de la demostración, mezclados con los reales. Ya
  // pasó una vez (QA-002).
  exigirArtefacto('No se puede afirmar que el artefacto de pruebas esté aislado del Supabase real.')
  const dist = DIST

  const conUrl: string[] = []
  for (const ruta of ficheros(dist)) {
    if (!/\.js$/.test(ruta)) continue
    const contenido = readFileSync(ruta, 'utf8')
    // Cualquier proyecto de Supabase, no solo el nuestro: no hace falta
    // conocer la URL concreta para saber que no debería haber ninguna.
    const encontrada = contenido.match(/https:\/\/[a-z0-9]{16,}\.supabase\.co/)
    if (encontrada) {
      // Se recorta a propósito: no tiene sentido volcar el identificador
      // completo del proyecto en un registro público.
      conUrl.push(`${ruta.replace(process.cwd() + '/', '')} → ${encontrada[0].slice(0, 16)}…`)
    }
  }

  expect(
    conUrl,
    'El bundle servido en las pruebas lleva una URL de Supabase incrustada. ' +
      'Compila el artefacto de pruebas con VITE_SUPABASE_URL y ' +
      'VITE_SUPABASE_ANON_KEY vacías:\n  ' +
      conUrl.join('\n  '),
  ).toEqual([])
})
