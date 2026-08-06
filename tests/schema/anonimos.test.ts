import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ANDAMIO_SUPABASE } from './andamio'

// ============================================================================
// Separación entre sesión anónima del chat y cuenta de cliente permanente.
//
// `signInAnonymously()` no crea un rol aparte: Supabase le da a la sesión
// anónima el mismo rol PostgreSQL que a una cuenta de verdad, `authenticated`.
// La diferencia viaja como un reclamo del JWT, `is_anonymous: true`, y es lo
// único en lo que se puede apoyar la base.
//
// Aquí se prueba contra PostgreSQL real, poniendo el JWT que pondría
// PostgREST. Las sesiones anónimas de GoTrue —las de verdad— se prueban en
// `tests/rls/politicas.spec.ts`.
// ============================================================================

const DIR_MIGRACIONES = join(process.cwd(), 'supabase/migrations')

const ANONIMO = '55555555-5555-4555-8555-555555555555'
const PERMANENTE = '66666666-6666-4666-8666-666666666666'

let db: PGlite

/**
 * Ejecuta SQL como lo haría PostgREST: fija el rol y deja el JWT completo en
 * `request.jwt.claims`. `anonimo` decide si el reclamo `is_anonymous` va a
 * true, que es la única señal que distingue una sesión de la otra.
 */
async function como<T>(
  uid: string,
  opciones: { anonimo: boolean; sinReclamo?: boolean },
  sql: string,
  params: unknown[] = [],
): Promise<{ rows: T[]; error: string | null }> {
  const claims: Record<string, unknown> = { sub: uid, role: 'authenticated' }
  if (!opciones.sinReclamo) claims.is_anonymous = opciones.anonimo
  try {
    await db.exec('begin')
    await db.query('set local role authenticated')
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)])
    const res = await db.query<T>(sql, params)
    await db.exec('commit')
    return { rows: res.rows, error: null }
  } catch (e) {
    await db.exec('rollback').catch(() => {})
    return { rows: [], error: (e as Error).message }
  }
}

beforeAll(async () => {
  db = await PGlite.create({ extensions: { pgcrypto } })
  await db.exec(ANDAMIO_SUPABASE)
  for (const fichero of readdirSync(DIR_MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(join(DIR_MIGRACIONES, fichero), 'utf8'))
  }

  await db.exec(`
    insert into auth.users (id, email) values
      ('${ANONIMO}', null),
      ('${PERMANENTE}', 'permanente@ejemplo.test');
    insert into public.clientes (id, email) values
      ('${PERMANENTE}', 'permanente@ejemplo.test');
  `)
}, 120_000)

afterAll(async () => {
  await db?.close()
})

describe('es_usuario_permanente()', () => {
  it('devuelve false con is_anonymous true', async () => {
    const { rows } = await como<{ r: boolean }>(
      ANONIMO,
      { anonimo: true },
      'select public.es_usuario_permanente() as r',
    )
    expect(rows[0].r).toBe(false)
  })

  it('devuelve true con is_anonymous false', async () => {
    const { rows } = await como<{ r: boolean }>(
      PERMANENTE,
      { anonimo: false },
      'select public.es_usuario_permanente() as r',
    )
    expect(rows[0].r).toBe(true)
  })

  it('sin el reclamo cuenta como permanente', async () => {
    // Las cuentas creadas antes de que existieran las sesiones anónimas no
    // llevan el reclamo. Tratarlas como anónimas las dejaría fuera de su
    // propia ficha.
    const { rows } = await como<{ r: boolean }>(
      PERMANENTE,
      { anonimo: false, sinReclamo: true },
      'select public.es_usuario_permanente() as r',
    )
    expect(rows[0].r).toBe(true)
  })
})

describe('una sesión anónima no puede actuar como cliente', () => {
  it('no puede crear su ficha en clientes', async () => {
    const { error } = await como(
      ANONIMO,
      { anonimo: true },
      `insert into public.clientes (id, email) values ($1, 'anonimo@ejemplo.test')`,
      [ANONIMO],
    )
    expect(error, 'el alta de ficha exige cuenta permanente').not.toBeNull()

    const { rows } = await db.query<{ n: number }>('select count(*)::int as n from public.clientes where id = $1', [
      ANONIMO,
    ])
    expect(rows[0].n, 'no debe quedar ninguna ficha del anónimo').toBe(0)
  })

  it('no ve ninguna fila de clientes', async () => {
    const { rows } = await como<{ id: string }>(ANONIMO, { anonimo: true }, 'select id from public.clientes')
    expect(rows).toHaveLength(0)
  })

  it('no puede crear un pedido', async () => {
    const { error } = await como(
      ANONIMO,
      { anonimo: true },
      `insert into public.pedidos (id, cliente_id, delivery, payment_method)
       values ('BC-ANON-1', $1, 'envio', 'tarjeta')`,
      [ANONIMO],
    )
    expect(error).not.toBeNull()
  })

  it('no puede crear reservas por RPC', async () => {
    const { error } = await como(ANONIMO, { anonimo: true }, `select public.crear_mis_reservas($1::jsonb)`, [
      JSON.stringify([
        {
          family: 'iphone',
          model_slug: '17-pro',
          model_name: 'iPhone 17 Pro',
          variant_label: '256 GB Plata',
          price: 1329,
          unidades: 1,
        },
      ]),
    ])
    expect(error).toMatch(/cuenta registrada/i)
  })

  it('no puede editar una ficha por RPC', async () => {
    const { error } = await como(ANONIMO, { anonimo: true }, `select public.actualizar_mi_ficha('Intruso')`)
    expect(error).toMatch(/cuenta registrada/i)
  })

  it('no puede registrar un justificante', async () => {
    const { error } = await como(ANONIMO, { anonimo: true }, `select public.registrar_mi_justificante($1)`, [
      `${ANONIMO}/justificante.pdf`,
    ])
    expect(error).toMatch(/cuenta registrada/i)
  })

  it('no puede vincular su visitante a un cliente', async () => {
    const { error } = await como(ANONIMO, { anonimo: true }, 'select public.vincular_mi_visitante_a_cliente()')
    expect(error).toMatch(/cuenta registrada/i)
  })

  it('no puede subir un justificante a Storage', async () => {
    const { error } = await como(
      ANONIMO,
      { anonimo: true },
      `insert into storage.objects (bucket_id, name) values ('descuentos-educativos', $1)`,
      [`${ANONIMO}/justificante.pdf`],
    )
    expect(error).not.toBeNull()
  })
})

describe('la cuenta permanente conserva sus recorridos', () => {
  it('lee su propia ficha', async () => {
    const { rows } = await como<{ id: string }>(PERMANENTE, { anonimo: false }, 'select id from public.clientes')
    expect(rows.map((r) => r.id)).toEqual([PERMANENTE])
  })

  it('crea un pedido propio', async () => {
    const { error } = await como(
      PERMANENTE,
      { anonimo: false },
      `insert into public.pedidos (id, cliente_id, delivery, payment_method)
       values ('BC-PERM-1', $1, 'envio', 'tarjeta')`,
      [PERMANENTE],
    )
    expect(error).toBeNull()
  })

  it('crea y cancela una reserva por RPC', async () => {
    const { rows, error } = await como<{ crear_mis_reservas: string }>(
      PERMANENTE,
      { anonimo: false },
      `select public.crear_mis_reservas($1::jsonb)`,
      [
        JSON.stringify([
          {
            family: 'iphone',
            model_slug: '17-pro',
            model_name: 'iPhone 17 Pro',
            variant_label: '256 GB Plata',
            price: 1329,
            unidades: 1,
          },
        ]),
      ],
    )
    expect(error).toBeNull()
    const id = rows[0].crear_mis_reservas
    expect(id).toBeTruthy()

    const { error: errorCancelar } = await como(
      PERMANENTE,
      { anonimo: false },
      `select public.cancelar_mi_reserva($1::uuid)`,
      [id],
    )
    expect(errorCancelar).toBeNull()
  })

  it('edita su ficha por RPC', async () => {
    const { error } = await como(PERMANENTE, { anonimo: false }, `select public.actualizar_mi_ficha('Nombre Legítimo')`)
    expect(error).toBeNull()
    const { rows } = await db.query<{ nombre: string }>('select nombre from public.clientes where id = $1', [
      PERMANENTE,
    ])
    expect(rows[0].nombre).toBe('Nombre Legítimo')
  })

  it('sube su justificante a Storage', async () => {
    const { error } = await como(
      PERMANENTE,
      { anonimo: false },
      `insert into storage.objects (bucket_id, name) values ('descuentos-educativos', $1)`,
      [`${PERMANENTE}/justificante.pdf`],
    )
    expect(error).toBeNull()
  })
})

describe('la política restrictiva no depende de las permisivas', () => {
  it('clientes, pedidos y reservas tienen una restrictiva de permanencia', async () => {
    const { rows } = await db.query<{ tablename: string; permissive: string }>(
      `select tablename, permissive
         from pg_policies
        where schemaname = 'public'
          and policyname = 'solo cuentas permanentes'
        order by tablename`,
    )
    expect(rows.map((r) => r.tablename)).toEqual(['clientes', 'pedidos', 'reservas'])
    for (const fila of rows) {
      expect(fila.permissive, `${fila.tablename} debe ser RESTRICTIVE`).toBe('RESTRICTIVE')
    }
  })

  it('una permisiva nueva y abierta no reabre el acceso', async () => {
    // Es lo que motiva usar una restrictiva: las permisivas se combinan con OR,
    // así que sin ella bastaría con esta política para volver a exponerlo todo.
    await db.exec(`create policy "prueba abierta" on public.pedidos for select to authenticated using (true)`)
    try {
      const { rows } = await como<{ id: string }>(ANONIMO, { anonimo: true }, 'select id from public.pedidos')
      expect(rows, 'la restrictiva debe seguir cortando').toHaveLength(0)
    } finally {
      await db.exec(`drop policy "prueba abierta" on public.pedidos`)
    }
  })
})
