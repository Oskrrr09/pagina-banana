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
  expect(
    sospechosas,
    `Una variable VITE_ acaba dentro del JavaScript público:\n  ` + sospechosas.join('\n  '),
  ).toEqual([])
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
    `Estos ficheros leen una credencial de servidor desde el cliente:\n  ` +
      ofensores.join('\n  '),
  ).toEqual([])
})

test('el bundle construido no contiene una clave de servicio', () => {
  const dist = join(process.cwd(), 'dist')
  test.skip(!existsSync(dist), 'No hay build. Ejecuta `npm run build` antes.')

  const ofensores: string[] = []
  for (const ruta of ficheros(dist)) {
    if (!/\.(js|css|html|webmanifest|json)$/.test(ruta)) continue
    const contenido = readFileSync(ruta, 'utf8')
    // Un JWT de Supabase lleva su rol dentro del payload. Se busca el literal
    // del rol, que es lo que distingue una clave de servicio de la anónima.
    if (contenido.includes('service_role')) {
      ofensores.push(ruta.replace(process.cwd() + '/', ''))
    }
  }
  expect(
    ofensores,
    `Estos artefactos publicados mencionan service_role:\n  ` + ofensores.join('\n  '),
  ).toEqual([])
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
  const dist = join(process.cwd(), 'dist')
  test.skip(!existsSync(dist), 'No hay build. Ejecuta `npm run build` antes.')

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
      'VITE_SUPABASE_ANON_KEY vacías:\n  ' + conUrl.join('\n  '),
  ).toEqual([])
})
