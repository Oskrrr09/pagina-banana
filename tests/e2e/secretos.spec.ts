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
