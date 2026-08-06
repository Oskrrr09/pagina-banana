import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ANDAMIO_SUPABASE } from './andamio'
import { auditarCatalogo, catalogarFunciones, serializarCatalogo } from './auditoria'
import { FUNCIONES, PARAMETROS_PROHIBIDOS } from './funciones'

// Instala la fuente ejecutable sobre PostgreSQL/PGlite. GoTrue, PostgREST y
// Storage reales siguen correspondiendo a tests/rls y a un proyecto dedicado.

const DIR_MIGRACIONES = join(process.cwd(), 'supabase/migrations')
const CLIENTE_IDEMPOTENCIA = '99999999-9999-4999-8999-999999999999'

let db: PGlite
let migraciones: string[] = []

async function aplicarMigraciones(base: PGlite): Promise<string[]> {
  const ficheros = readdirSync(DIR_MIGRACIONES)
    .filter((fichero) => fichero.endsWith('.sql'))
    .sort()
  for (const fichero of ficheros) {
    await base.exec(readFileSync(join(DIR_MIGRACIONES, fichero), 'utf8'))
  }
  return ficheros
}

beforeAll(async () => {
  db = await PGlite.create({ extensions: { pgcrypto } })
  await db.exec(ANDAMIO_SUPABASE)
  migraciones = await aplicarMigraciones(db)
}, 120_000)

afterAll(async () => {
  await db?.close()
})

describe('instalación desde cero', () => {
  it('deja constancia de la versión de PostgreSQL usada', async () => {
    const { rows: version } = await db.query<{ version: string }>('select version()')
    console.log(`   PostgreSQL bajo prueba → ${version[0].version}`)
    expect(version[0].version).toMatch(/PostgreSQL/)
  })

  it('las migraciones se aplican sobre una base vacía', async () => {
    expect(migraciones.length, 'debe haber al menos una migración').toBeGreaterThan(0)

    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from information_schema.tables where table_schema = 'public'`,
    )
    expect(rows[0].n, 'deben existir las tablas finales').toBeGreaterThan(5)
  })

  it('el bucket educativo es privado y limita tamaño y tipos MIME', async () => {
    const { rows } = await db.query<{
      public: boolean
      file_size_limit: number
      allowed_mime_types: string[]
    }>(
      `select public, file_size_limit, allowed_mime_types
         from storage.buckets where id = 'descuentos-educativos'`,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].public).toBe(false)
    expect(Number(rows[0].file_size_limit)).toBe(5 * 1024 * 1024)
    expect(rows[0].allowed_mime_types.sort()).toEqual(['application/pdf', 'image/jpeg', 'image/png'].sort())
  })

  it('supera la auditoría exacta del catálogo final', async () => {
    const auditoria = await auditarCatalogo(db)
    expect(auditoria.problemas, auditoria.problemas.join('\n')).toEqual([])
  })

  it('detecta PUBLIC aunque aclexplode lo represente con grantee = 0', async () => {
    await db.exec('begin')
    try {
      await db.exec(`create function public.auditoria_public_temporal(p_valor integer)
        returns integer language sql as $$ select p_valor $$`)
      const funcion = (await catalogarFunciones(db)).find((item) => item.firma === 'auditoria_public_temporal(integer)')
      expect(funcion, 'la función temporal debe aparecer como propia').toBeDefined()
      expect(funcion!.ejecuta).toContain('PUBLIC')
    } finally {
      await db.exec('rollback')
    }
  })

  it('detecta una sobrecarga nueva aunque el nombre ya esté clasificado', async () => {
    await db.exec('begin')
    try {
      await db.exec(`create function public.abrir_conversacion(p_control integer)
        returns uuid language sql as $$ select gen_random_uuid() $$`)
      const auditoria = await auditarCatalogo(db)
      expect(auditoria.problemas.join('\n')).toContain(
        'función inesperada o sin clasificar: abrir_conversacion(integer)',
      )
    } finally {
      await db.exec('rollback')
    }
  })
})

describe('firmas finales', () => {
  it('no queda la sobrecarga antigua de abrir_conversacion', async () => {
    const firmas = (await catalogarFunciones(db))
      .filter((funcion) => funcion.firma.startsWith('abrir_conversacion('))
      .map((funcion) => funcion.firma)
    expect(firmas).toEqual(['abrir_conversacion(text,text,text,text)'])
  })

  it('no queda la sobrecarga antigua de actualizar_mi_ficha', async () => {
    const firmas = (await catalogarFunciones(db))
      .filter((funcion) => funcion.firma.startsWith('actualizar_mi_ficha('))
      .map((funcion) => funcion.firma)
    expect(firmas).toEqual(['actualizar_mi_ficha(text,text,jsonb,jsonb)'])
  })

  it('no queda la versión de enviar_valoracion que recibe el visitante', async () => {
    const firmas = (await catalogarFunciones(db))
      .filter((funcion) => funcion.firma.startsWith('enviar_valoracion('))
      .map((funcion) => funcion.firma)
    expect(firmas).toEqual(['enviar_valoracion(uuid,smallint,text)'])
  })
})

describe('garantías individuales de la auditoría compartida', () => {
  it('toda función del proyecto está clasificada', async () => {
    const catalogo = await catalogarFunciones(db)
    expect(catalogo.filter((funcion) => !funcion.clasificacion)).toEqual([])
    expect(catalogo.map((funcion) => funcion.firma).sort()).toEqual(Object.keys(FUNCIONES).sort())
  })

  it('cada firma tiene exactamente los permisos declarados', async () => {
    const catalogo = await catalogarFunciones(db)
    for (const funcion of catalogo) {
      expect(funcion.ejecuta, funcion.firma).toEqual([...FUNCIONES[funcion.firma].ejecuta].sort())
    }
  })

  it('ninguna función del proyecto es ejecutable por PUBLIC', async () => {
    const catalogo = await catalogarFunciones(db)
    expect(catalogo.filter((funcion) => funcion.ejecuta.includes('PUBLIC'))).toEqual([])
  })

  it('los disparadores y auxiliares internos no se llaman desde la API', async () => {
    // La excepción no se escribe con el nombre de una función concreta.
    // Estaba fijada a `es_agente()`, y al aparecer una segunda auxiliar con el
    // mismo motivo legítimo —`es_usuario_permanente()`, que también la invocan
    // las políticas y por eso necesita EXECUTE— habría que volver a tocar la
    // prueba. Se compara contra lo DECLARADO en `FUNCIONES`: una auxiliar sin
    // ejecutores declarados no puede tenerlos de verdad. Los roles exactos de
    // las que sí los declaran los verifica `auditarCatalogo`.
    const catalogo = await catalogarFunciones(db)
    const internosExpuestos = catalogo.filter(
      (funcion) =>
        ['trigger', 'auxiliar'].includes(funcion.clasificacion!.categoria) &&
        funcion.clasificacion!.ejecuta.length === 0 &&
        funcion.ejecuta.length > 0,
    )
    expect(internosExpuestos).toEqual([])
  })

  it('los RPC de cliente y agente no están al alcance de anon', async () => {
    const catalogo = await catalogarFunciones(db)
    const expuestos = catalogo.filter(
      (funcion) =>
        ['rpc-cliente', 'rpc-agente'].includes(funcion.clasificacion!.categoria) && funcion.ejecuta.includes('anon'),
    )
    expect(expuestos).toEqual([])
  })

  it('toda función SECURITY DEFINER fija search_path', async () => {
    const catalogo = await catalogarFunciones(db)
    const sinRuta = catalogo.filter(
      (funcion) => funcion.securityDefiner && !funcion.configuracion.some((valor) => valor.startsWith('search_path=')),
    )
    expect(sinRuta).toEqual([])
  })

  it('ninguna firma recibe datos sensibles salvo su excepción exacta', async () => {
    const catalogo = await catalogarFunciones(db)
    const problemas: string[] = []
    for (const funcion of catalogo) {
      for (const parametro of PARAMETROS_PROHIBIDOS) {
        if (!new RegExp(`\\b${parametro}\\b`).test(funcion.argumentos)) continue
        if (parametro in (funcion.clasificacion!.parametrosPermitidos ?? {})) continue
        problemas.push(`${funcion.firma}: ${parametro}`)
      }
    }
    expect(problemas).toEqual([])
  })

  it('revisar_descuento_educativo conserva su firma y excepción exactas', async () => {
    const firma = 'revisar_descuento_educativo(uuid,text,text)'
    expect(FUNCIONES[firma].parametrosPermitidos).toHaveProperty('p_cliente_id')
    expect(Object.keys(FUNCIONES).filter((actual) => actual.startsWith('revisar_descuento_educativo('))).toEqual([
      firma,
    ])
  })
})

describe('políticas finales', () => {
  it('ninguna política de datos personales es incondicional', async () => {
    const { rows } = await db.query<{
      tabla: string
      politica: string
      usando: string | null
      comprobando: string | null
    }>(
      `select c.relname as tabla,
              pol.polname as politica,
              pg_get_expr(pol.polqual, pol.polrelid) as usando,
              pg_get_expr(pol.polwithcheck, pol.polrelid) as comprobando
         from pg_policy pol
         join pg_class c on c.oid = pol.polrelid
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'`,
    )
    const abiertas = rows
      .filter((row) => row.usando === 'true' || row.comprobando === 'true')
      .map((row) => `${row.tabla}.${row.politica}`)
    expect(abiertas, `políticas incondicionales:\n${abiertas.join('\n')}`).toEqual([])
  })

  it('no permite INSERT directo en mensajes ni conversaciones', async () => {
    const { rows } = await db.query<{ tabla: string; politica: string }>(
      `select c.relname as tabla, pol.polname as politica
         from pg_policy pol
         join pg_class c on c.oid = pol.polrelid
        where c.relname in ('mensajes', 'conversaciones') and pol.polcmd = 'a'`,
    )
    expect(rows.map((row) => `${row.tabla}.${row.politica}`)).toEqual([])
  })

  it('no permite UPDATE ni DELETE directo en conversaciones, reservas o agentes', async () => {
    const { rows } = await db.query<{ tabla: string; politica: string; cmd: string }>(
      `select c.relname as tabla, pol.polname as politica, pol.polcmd::text as cmd
         from pg_policy pol
         join pg_class c on c.oid = pol.polrelid
        where c.relname in ('conversaciones', 'reservas', 'agentes')
          and pol.polcmd in ('w', 'd')`,
    )
    expect(rows.map((row) => `${row.tabla}.${row.politica} (${row.cmd})`)).toEqual([])
  })
})

describe('segunda aplicación idempotente', () => {
  it('repite la auditoría y conserva catálogo y datos exactamente', async () => {
    await db.query('insert into auth.users (id, email) values ($1, $2)', [
      CLIENTE_IDEMPOTENCIA,
      'idempotencia@ejemplo.test',
    ])
    await db.query('insert into public.clientes (id, email) values ($1, $2)', [
      CLIENTE_IDEMPOTENCIA,
      'idempotencia@ejemplo.test',
    ])
    const antes = await auditarCatalogo(db)
    expect(antes.problemas).toEqual([])
    const catalogoAntes = serializarCatalogo(antes.catalogo)

    await expect(aplicarMigraciones(db)).resolves.toEqual(migraciones)

    const despues = await auditarCatalogo(db)
    expect(despues.problemas, despues.problemas.join('\n')).toEqual([])
    expect(serializarCatalogo(despues.catalogo)).toBe(catalogoAntes)
    expect(new Set(despues.catalogo.map((funcion) => funcion.firma)).size).toBe(despues.catalogo.length)
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.clientes where id = $1`, [
      CLIENTE_IDEMPOTENCIA,
    ])
    expect(rows[0].n, 'no borra ni duplica el cliente existente').toBe(1)
  })
})
