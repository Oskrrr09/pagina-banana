import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ANDAMIO_SUPABASE } from './andamio'

// ============================================================================
// Permisos de tabla, que es la capa que hay DEBAJO de las políticas.
//
// Las políticas RLS filtran filas; el GRANT decide si se llega a evaluarlas.
// Sin GRANT, PostgreSQL corta antes con «permission denied for table …» y da
// igual lo bien escrita que esté la política. `service_role` salta RLS por
// BYPASSRLS pero tampoco salta los GRANT.
//
// Las migraciones estuvieron sin conceder ni uno solo, apoyadas en unas
// *default privileges* de Supabase que no alcanzan a las tablas que crean.
// En Supabase local eso dejaba 17 de las 27 pruebas RLS en rojo mientras el
// arnés de esquema seguía verde, porque se concedía los permisos a sí mismo.
//
// Esta suite comprueba el cuadro completo: lo que hay que poder hacer, y —más
// importante— lo que NO. Cada ausencia de aquí abajo es el reflejo de un «NO
// hay INSERT/UPDATE directo» escrito en las políticas.
// ============================================================================

const DIR_MIGRACIONES = join(process.cwd(), 'supabase/migrations')

const TABLAS = ['visitantes', 'conversaciones', 'mensajes', 'agentes', 'clientes', 'pedidos', 'reservas'] as const
const OPERACIONES = ['select', 'insert', 'update', 'delete'] as const

type Tabla = (typeof TABLAS)[number]
type Operacion = (typeof OPERACIONES)[number]

/** Lo que cada rol debe poder hacer sobre cada tabla. Lo que no está, se deniega. */
const ESPERADO: Record<'anon' | 'authenticated' | 'service_role', Record<Tabla, Operacion[]>> = {
  // Sesión sin JWT: sólo lee lo suyo del chat, y edita su ficha de visitante
  // —que el disparador `visitantes_protege_columnas` acota a sus columnas—.
  anon: {
    visitantes: ['select', 'update'],
    conversaciones: ['select'],
    mensajes: ['select'],
    agentes: [],
    clientes: [],
    pedidos: [],
    reservas: [],
  },
  // Cliente o agente con sesión. Crea su ficha y sus pedidos; todo lo demás
  // pasa por los RPC `security definer`.
  authenticated: {
    visitantes: ['select', 'update'],
    conversaciones: ['select'],
    mensajes: ['select'],
    agentes: ['select'],
    clientes: ['select', 'insert'],
    pedidos: ['select', 'insert'],
    reservas: ['select'],
  },
  // Administración: monta el escenario, da de alta agentes y limpia.
  service_role: {
    visitantes: [...OPERACIONES],
    conversaciones: [...OPERACIONES],
    mensajes: [...OPERACIONES],
    agentes: [...OPERACIONES],
    clientes: [...OPERACIONES],
    pedidos: [...OPERACIONES],
    reservas: [...OPERACIONES],
  },
}

let db: PGlite

beforeAll(async () => {
  db = await PGlite.create({ extensions: { pgcrypto } })
  await db.exec(ANDAMIO_SUPABASE)
  for (const fichero of readdirSync(DIR_MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(join(DIR_MIGRACIONES, fichero), 'utf8'))
  }
}, 120_000)

afterAll(async () => {
  await db?.close()
})

async function tienePermiso(rol: string, tabla: string, operacion: string): Promise<boolean> {
  const { rows } = await db.query<{ permitido: boolean }>(`select has_table_privilege($1, $2, $3) as permitido`, [
    rol,
    `public.${tabla}`,
    operacion,
  ])
  return rows[0].permitido
}

describe('permisos de tabla concedidos por las migraciones', () => {
  for (const rol of ['anon', 'authenticated', 'service_role'] as const) {
    for (const tabla of TABLAS) {
      const permitidas = ESPERADO[rol][tabla]
      it(`${rol} sobre ${tabla}: ${permitidas.length > 0 ? permitidas.join(', ') : 'ninguna operación'}`, async () => {
        for (const operacion of OPERACIONES) {
          const debe = permitidas.includes(operacion)
          const puede = await tienePermiso(rol, tabla, operacion)
          expect(
            puede,
            debe
              ? `${rol} debe poder hacer ${operacion} en ${tabla}; sin el GRANT la política ni se evalúa`
              : `${rol} NO debe poder hacer ${operacion} en ${tabla}: eso pasa por un RPC security definer`,
          ).toBe(debe)
        }
      })
    }
  }

  it('el rol público no recibe nada por la puerta de atrás', async () => {
    for (const tabla of TABLAS) {
      for (const operacion of OPERACIONES) {
        expect(await tienePermiso('public', tabla, operacion), `PUBLIC no debe tener ${operacion} sobre ${tabla}`).toBe(
          false,
        )
      }
    }
  })

  it('anon y authenticated pueden usar el esquema public', async () => {
    for (const rol of ['anon', 'authenticated', 'service_role']) {
      const { rows } = await db.query<{ permitido: boolean }>(
        `select has_schema_privilege($1, 'public', 'usage') as permitido`,
        [rol],
      )
      expect(rows[0].permitido, `${rol} necesita USAGE sobre public`).toBe(true)
    }
  })
})
