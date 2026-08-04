import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ANDAMIO_SUPABASE } from './andamio'
import { auditarCatalogo, serializarCatalogo } from './auditoria'

// ============================================================================
// Actualización desde el estado exacto de la PR #33.
//
// Instalar sobre una base vacía no demuestra que una base YA DESPLEGADA se
// pueda actualizar. Son dos cosas distintas y la segunda es la que le va a
// pasar a la base de verdad.
//
// El SQL está congelado en `estados/`, sacado con `git show` de los commits
// reales. No es una reconstrucción a mano.
//
// Y se reproduce como llegó la base de verdad, no como decía el repositorio:
// el `schema.sql` de la PR #33 tampoco instalaba sobre una base vacía —tenía
// el mismo fallo de orden que esta PR corrige—, así que el estado desplegado
// es el esquema ANTERIOR (commit 30b7957, con sus `using (true)`) más las dos
// migraciones de la PR #33 aplicadas encima. Que es exactamente lo que le
// pasó a la base real.
// ============================================================================

const DIR_MIGRACIONES = join(process.cwd(), 'supabase/migrations')
const DIR_ESTADOS = join(process.cwd(), 'tests/schema/estados')

const CLIENTE = '33333333-3333-4333-8333-333333333333'
const VISITANTE = '11111111-1111-4111-8111-111111111111'

let db: PGlite

/** Levanta una base en el estado en que la dejaba la PR #33. */
async function estadoPR33(): Promise<PGlite> {
  const base = await PGlite.create({ extensions: { pgcrypto } })
  await base.exec(ANDAMIO_SUPABASE)
  // El orden real: el esquema anterior y encima las dos migraciones.
  for (const f of ['pr33-schema.sql', 'pr33-a.sql', 'pr33-b.sql']) {
    await base.exec(readFileSync(join(DIR_ESTADOS, f), 'utf8'))
  }
  return base
}

async function aplicarMigracionesNuevas(base: PGlite): Promise<void> {
  for (const f of readdirSync(DIR_MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await base.exec(readFileSync(join(DIR_MIGRACIONES, f), 'utf8'))
  }
}

beforeAll(async () => {
  db = await estadoPR33()

  // Datos de una base en uso: si la actualización los pierde o los reasigna,
  // hay que enterarse aquí y no en producción.
  await db.query('insert into auth.users (id, email) values ($1, $2), ($3, $4)', [
    VISITANTE,
    'v@ejemplo.test',
    CLIENTE,
    'c@ejemplo.test',
  ])
  await db.query('insert into public.clientes (id, email) values ($1, $2)', [CLIENTE, 'c@ejemplo.test'])
  await db.query(`insert into public.visitantes (auth_id, nombre, email) values ($1, 'Ana', 'ana@ejemplo.test')`, [
    VISITANTE,
  ])
  const { rows } = await db.query<{ id: string }>(
    `insert into public.conversaciones (visitor_id)
     select id from public.visitantes where auth_id = $1 returning id`,
    [VISITANTE],
  )
  await db.query(
    `insert into public.mensajes (conversacion_id, autor, texto)
     values ($1, 'visitor', 'mensaje anterior a la actualización')`,
    [rows[0].id],
  )
}, 120_000)

afterAll(async () => {
  await db?.close()
})

describe('actualización desde la PR #33', () => {
  it('la migración nueva se aplica sin errores', async () => {
    // Esta es la prueba que faltaba, y falla contra la versión anterior de la
    // migración: soltaba `conversacion_es_mia()` mientras dos políticas la
    // seguían usando, y PostgreSQL usa RESTRICT por defecto.
    await expect(aplicarMigracionesNuevas(db)).resolves.toBeUndefined()
  })

  it('no queda ninguna política que llame a conversacion_es_mia', async () => {
    const { rows } = await db.query<{ politica: string }>(
      `select pol.polname as politica
         from pg_policy pol
        where pg_get_expr(pol.polqual, pol.polrelid) like '%conversacion_es_mia%'
           or pg_get_expr(pol.polwithcheck, pol.polrelid) like '%conversacion_es_mia%'`,
    )
    expect(rows.map((r) => r.politica)).toEqual([])
  })

  it('la función auxiliar ya no existe', async () => {
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'conversacion_es_mia'`,
    )
    expect(rows[0].n).toBe(0)
  })

  it('no quedan las firmas antiguas', async () => {
    const { rows } = await db.query<{ nombre: string; args: string }>(
      `select p.proname as nombre, pg_get_function_identity_arguments(p.oid) as args
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in ('abrir_conversacion', 'actualizar_mi_ficha', 'enviar_valoracion')`,
    )
    // Una sola versión de cada una.
    expect(rows.filter((r) => r.nombre === 'abrir_conversacion')).toHaveLength(1)
    expect(rows.filter((r) => r.nombre === 'actualizar_mi_ficha')).toHaveLength(1)
    expect(rows.filter((r) => r.nombre === 'enviar_valoracion')).toHaveLength(1)
    // Y ninguna con el parámetro de bienvenida.
    const abrir = rows.find((r) => r.nombre === 'abrir_conversacion')!
    expect(abrir.args.split(',')).toHaveLength(4)
  })

  it('los datos que ya existían siguen ahí y con su dueño', async () => {
    const { rows: visitantes } = await db.query<{ nombre: string; auth_id: string }>(
      `select nombre, auth_id from public.visitantes`,
    )
    expect(visitantes, 'no se pierde el visitante').toHaveLength(1)
    expect(visitantes[0].nombre).toBe('Ana')
    expect(visitantes[0].auth_id, 'no se reasigna a otro usuario').toBe(VISITANTE)

    const { rows: mensajes } = await db.query<{ texto: string }>(`select texto from public.mensajes`)
    expect(mensajes.map((m) => m.texto)).toContain('mensaje anterior a la actualización')
  })

  it('los datos heredados que ya no podrían crearse se conservan', async () => {
    // El estado anterior permitía escribir cualquier UUID en `agente_id`.
    // La migración no debe borrarlos ni reasignarlos en silencio: son datos de
    // alguien, y decidir qué hacer con ellos es una decisión de negocio, no un
    // efecto secundario de una migración.
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.conversaciones`)
    expect(rows[0].n, 'la conversación heredada sigue ahí').toBeGreaterThan(0)

    const { rows: mensajes } = await db.query<{ n: number }>(`select count(*)::int as n from public.mensajes`)
    expect(mensajes[0].n, 'y sus mensajes').toBeGreaterThan(0)
  })

  it('supera la misma auditoría exacta que una instalación limpia', async () => {
    const auditoria = await auditarCatalogo(db)
    expect(auditoria.problemas, auditoria.problemas.join('\n')).toEqual([])
  })

  it('una segunda aplicación conserva catálogo y datos exactamente', async () => {
    const antes = await auditarCatalogo(db)
    expect(antes.problemas).toEqual([])
    const catalogoAntes = serializarCatalogo(antes.catalogo)
    const { rows: datosAntes } = await db.query<{
      visitantes: number
      conversaciones: number
      mensajes: number
      propietario: string
    }>(
      `select (select count(*)::int from public.visitantes) as visitantes,
              (select count(*)::int from public.conversaciones) as conversaciones,
              (select count(*)::int from public.mensajes) as mensajes,
              (select auth_id::text from public.visitantes limit 1) as propietario`,
    )

    await expect(aplicarMigracionesNuevas(db)).resolves.toBeUndefined()
    const despues = await auditarCatalogo(db)
    expect(despues.problemas, despues.problemas.join('\n')).toEqual([])
    expect(serializarCatalogo(despues.catalogo)).toBe(catalogoAntes)
    expect(new Set(despues.catalogo.map((funcion) => funcion.firma)).size).toBe(despues.catalogo.length)
    const { rows: datosDespues } = await db.query<(typeof datosAntes)[number]>(
      `select (select count(*)::int from public.visitantes) as visitantes,
              (select count(*)::int from public.conversaciones) as conversaciones,
              (select count(*)::int from public.mensajes) as mensajes,
              (select auth_id::text from public.visitantes limit 1) as propietario`,
    )
    expect(datosDespues).toEqual(datosAntes)
  })

  it('las políticas finales funcionan después de actualizar', async () => {
    await db.exec('begin')
    await db.query(`set local role anon`)
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: VISITANTE, role: 'anon' }),
    ])
    const { rows } = await db.query<{ texto: string }>(`select texto from public.mensajes`)
    await db.exec('commit')

    expect(
      rows.map((r) => r.texto),
      'el visitante sigue viendo lo suyo',
    ).toContain('mensaje anterior a la actualización')
  })
})
