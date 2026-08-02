import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// ============================================================================
// Comportamiento real de las políticas RLS, contra PostgreSQL de verdad.
//
// A diferencia de `tests/e2e/schema-seguro.spec.ts`, que lee el SQL como texto,
// aquí se ejecutan las operaciones: se cambia de rol, se pone el JWT de cada
// usuario y se comprueba qué deja hacer la base. Es la diferencia entre "la
// política está escrita" y "la política funciona".
//
// Lo que sigue sin cubrirse aquí: GoTrue (el alta real de usuarios) y el
// Storage de Supabase. `storage.objects` se simula, así que las políticas de
// Storage se comprueban en su forma, no en su integración. Para eso están las
// pruebas de `tests/rls/` contra un proyecto dedicado.
// ============================================================================

const DIR = join(process.cwd(), 'supabase/migrations')

const ANDAMIO = `
  create schema if not exists auth;
  create schema if not exists storage;
  create table if not exists auth.users (id uuid primary key, email text);
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid;
  $$;
  create table if not exists storage.buckets (id text primary key, name text, public boolean);
  create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id), name text, owner uuid
  );
  create or replace function storage.foldername(name text) returns text[]
  language sql immutable as $$ select string_to_array(name, '/'); $$;
  alter table storage.objects enable row level security;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  end $$;
  grant usage on schema public, auth, storage to anon, authenticated;
  -- Supabase concede permisos de tabla a anon y authenticated por defecto;
  -- RLS es lo que filtra después. Sin esto las pruebas fallarían por falta de
  -- permiso y no por la política, que es justo lo que se quiere medir.
  alter default privileges in schema public
    grant select, insert, update, delete on tables to anon, authenticated;
  alter default privileges in schema storage
    grant select, insert, update, delete on tables to anon, authenticated;
  -- alter default privileges solo alcanza a lo que se cree después, y las
  -- tablas de storage ya existen a estas alturas.
  grant select, insert, update, delete on all tables in schema storage
    to anon, authenticated;
  do $$ begin
    if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end $$;
`

let db: PGlite

/** Identificadores de los usuarios del escenario. */
const ANA = '11111111-1111-4111-8111-111111111111'
const BEA = '22222222-2222-4222-8222-222222222222'
const CLIENTE = '33333333-3333-4333-8333-333333333333'
const AGENTE = '44444444-4444-4444-8444-444444444444'

/**
 * Ejecuta SQL como un usuario concreto.
 *
 * Reproduce lo que hace PostgREST en cada petición: fija el rol y deja el JWT
 * en `request.jwt.claims`, de donde lo lee `auth.uid()`. Va en una transacción
 * para que el `set local` no se escape a la siguiente consulta.
 */
async function como<T>(
  uid: string | null,
  rol: 'anon' | 'authenticated',
  sql: string,
  params: unknown[] = [],
): Promise<{ rows: T[]; error: string | null }> {
  try {
    await db.exec('begin')
    await db.query(`set local role ${rol}`)
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [
      uid ? JSON.stringify({ sub: uid, role: rol }) : JSON.stringify({ role: rol }),
    ])
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
  await db.exec(ANDAMIO)
  for (const f of readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(DIR, f), 'utf8'))
  }
  // Usuarios del escenario. En Supabase los crea GoTrue; aquí se insertan.
  for (const id of [ANA, BEA, CLIENTE, AGENTE]) {
    await db.query('insert into auth.users (id, email) values ($1, $2)', [
      id,
      `${id}@ejemplo.test`,
    ])
  }
  await db.query(
    `insert into public.clientes (id, email) values ($1, $2)`,
    [CLIENTE, 'cliente@ejemplo.test'],
  )
  await db.query(
    `insert into public.agentes (id, email, nombre) values ($1, $2, $3)`,
    [AGENTE, 'agente@ejemplo.test', 'Agente de prueba'],
  )
}, 120_000)

afterAll(async () => {
  await db?.close()
})

describe('chat del visitante', () => {
  it('abrir conversación funciona y no deja mensajes del bot guardados', async () => {
    const { rows, error } = await como<{ abrir_conversacion: string }>(
      ANA,
      'anon',
      `select public.abrir_conversacion('Ana', 'ana@ejemplo.test', null, 'jsdom') as abrir_conversacion`,
    )
    expect(error).toBeNull()
    expect(rows[0].abrir_conversacion).toBeTruthy()

    const { rows: mensajes } = await db.query<{ n: number }>(
      `select count(*)::int as n from public.mensajes where autor = 'bot'`,
    )
    expect(mensajes[0].n, 'la bienvenida ya no se persiste').toBe(0)
  })

  it('un visitante no ve la ficha de otro', async () => {
    await como(BEA, 'anon', `select public.abrir_conversacion('Bea')`)
    const { rows } = await como<{ nombre: string }>(
      BEA,
      'anon',
      `select nombre from public.visitantes`,
    )
    expect(rows.map((r) => r.nombre), 'solo debe verse a sí misma').toEqual(['Bea'])
  })

  it('un visitante no puede insertar su ficha apuntando a otro cliente', async () => {
    const { error } = await como(
      ANA,
      'anon',
      `insert into public.visitantes (auth_id, cliente_id) values ($1, $2)`,
      [ANA, CLIENTE],
    )
    expect(error, 'no hay INSERT directo para el visitante').not.toBeNull()
  })

  it('un visitante no puede cambiar su cliente_id después', async () => {
    const { error } = await como(
      ANA,
      'anon',
      `update public.visitantes set cliente_id = $1 where auth_id = $2`,
      [CLIENTE, ANA],
    )
    expect(error).toMatch(/cliente_id/)
  })

  it('un visitante no puede escribir como bot ni como agente', async () => {
    const { rows } = await db.query<{ id: string }>(
      `select c.id from public.conversaciones c
         join public.visitantes v on v.id = c.visitor_id where v.auth_id = $1`,
      [ANA],
    )
    for (const autor of ['bot', 'agent']) {
      const { error } = await como(
        ANA,
        'anon',
        `insert into public.mensajes (conversacion_id, autor, texto) values ($1, $2, 'hola')`,
        [rows[0].id, autor],
      )
      expect(error, `no debe poder firmar como ${autor}`).not.toBeNull()
    }
  })

  it('un visitante no puede escribir en la conversación de otro', async () => {
    const { rows } = await db.query<{ id: string }>(
      `select c.id from public.conversaciones c
         join public.visitantes v on v.id = c.visitor_id where v.auth_id = $1`,
      [ANA],
    )
    const { error } = await como(
      BEA,
      'anon',
      `insert into public.mensajes (conversacion_id, autor, texto) values ($1, 'visitor', 'me cuelo')`,
      [rows[0].id],
    )
    expect(error).not.toBeNull()
  })

  it('el chat legítimo sigue funcionando', async () => {
    const { rows } = await db.query<{ id: string }>(
      `select c.id from public.conversaciones c
         join public.visitantes v on v.id = c.visitor_id where v.auth_id = $1`,
      [ANA],
    )
    const { error } = await como(
      ANA,
      'anon',
      `insert into public.mensajes (conversacion_id, autor, texto) values ($1, 'visitor', '¿Tenéis el 17 Pro?')`,
      [rows[0].id],
    )
    expect(error, 'escribir en la propia conversación debe funcionar').toBeNull()

    const { rows: leidos } = await como<{ texto: string }>(
      ANA,
      'anon',
      `select texto from public.mensajes`,
    )
    expect(leidos.map((r) => r.texto)).toContain('¿Tenéis el 17 Pro?')
  })
})

describe('agente', () => {
  it('un autenticado sin fila en agentes no ve las conversaciones', async () => {
    const { rows } = await como<{ id: string }>(
      CLIENTE,
      'authenticated',
      `select id from public.conversaciones`,
    )
    expect(rows, 'tener cuenta no convierte a nadie en agente').toEqual([])
  })

  it('un agente válido lee visitantes, conversaciones y mensajes', async () => {
    const visitantes = await como<{ id: string }>(
      AGENTE,
      'authenticated',
      `select id from public.visitantes`,
    )
    expect(visitantes.rows.length, 'debe ver a los visitantes').toBeGreaterThan(0)

    const conversaciones = await como<{ id: string }>(
      AGENTE,
      'authenticated',
      `select id from public.conversaciones`,
    )
    expect(conversaciones.rows.length).toBeGreaterThan(0)

    const mensajes = await como<{ id: string }>(
      AGENTE,
      'authenticated',
      `select id from public.mensajes`,
    )
    expect(mensajes.rows.length).toBeGreaterThan(0)
  })

  it('un agente válido puede responder y queda como agent', async () => {
    const { rows } = await db.query<{ id: string }>(`select id from public.conversaciones limit 1`)
    const { error } = await como(
      AGENTE,
      'authenticated',
      `insert into public.mensajes (conversacion_id, autor, texto) values ($1, 'agent', 'Buenos días')`,
      [rows[0].id],
    )
    expect(error, 'el agente debe poder responder').toBeNull()

    const { rows: guardados } = await db.query<{ autor: string }>(
      `select autor from public.mensajes where texto = 'Buenos días'`,
    )
    expect(guardados[0].autor).toBe('agent')
  })

  it('un agente no puede editar el teléfono del cliente', async () => {
    const { error } = await como(
      AGENTE,
      'authenticated',
      `update public.clientes set telefono = '600000000' where id = $1`,
      [CLIENTE],
    )
    // No hay UPDATE directo sobre clientes para nadie: o falla, o no alcanza
    // ninguna fila. Se comprueba el efecto, que es lo que importa.
    const { rows } = await db.query<{ telefono: string | null }>(
      `select telefono from public.clientes where id = $1`,
      [CLIENTE],
    )
    expect(rows[0].telefono, `el teléfono no debe cambiar (error: ${error})`).toBeNull()
  })
})

describe('cliente', () => {
  it('no puede crear su ficha ya aprobada', async () => {
    const otro = '55555555-5555-4555-8555-555555555555'
    await db.query('insert into auth.users (id, email) values ($1, $2)', [otro, 'o@ejemplo.test'])
    const { error } = await como(
      otro,
      'authenticated',
      `insert into public.clientes (id, email, descuento_educativo_estado)
       values ($1, 'o@ejemplo.test', 'aprobado')`,
      [otro],
    )
    expect(error, 'la política de alta exige los campos de descuento nulos').not.toBeNull()
  })

  it('edita su ficha por RPC sin tocar el descuento', async () => {
    const { error } = await como(
      CLIENTE,
      'authenticated',
      `select public.actualizar_mi_ficha('Nombre Nuevo', '600123456')`,
    )
    expect(error).toBeNull()

    const { rows } = await db.query<{ nombre: string; estado: string | null }>(
      `select nombre, descuento_educativo_estado as estado from public.clientes where id = $1`,
      [CLIENTE],
    )
    expect(rows[0].nombre).toBe('Nombre Nuevo')
    expect(rows[0].estado, 'el RPC no toca el descuento').toBeNull()
  })

  it('no puede registrar un justificante que no existe', async () => {
    const { error } = await como(
      CLIENTE,
      'authenticated',
      `select public.registrar_mi_justificante($1)`,
      [`${CLIENTE}/inventado.pdf`],
    )
    expect(error, 'la ruta debe existir en storage.objects').toMatch(/archivo subido/)
  })

  it('no puede registrar la carpeta de otro', async () => {
    const { error } = await como(
      CLIENTE,
      'authenticated',
      `select public.registrar_mi_justificante($1)`,
      [`${AGENTE}/justificante.pdf`],
    )
    expect(error).toMatch(/no pertenece/)
  })

  it('registra su justificante cuando el archivo existe', async () => {
    await db.query(`insert into storage.buckets (id, name, public) values
      ('descuentos-educativos', 'descuentos-educativos', false)
      on conflict (id) do nothing`)
    const ruta = `${CLIENTE}/justificante.pdf`
    await db.query(`insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)`, [
      'descuentos-educativos',
      ruta,
      CLIENTE,
    ])

    const { error } = await como(
      CLIENTE,
      'authenticated',
      `select public.registrar_mi_justificante($1)`,
      [ruta],
    )
    expect(error).toBeNull()

    const { rows } = await db.query<{ estado: string; archivo: string }>(
      `select descuento_educativo_estado as estado, descuento_educativo_archivo as archivo
         from public.clientes where id = $1`,
      [CLIENTE],
    )
    expect(rows[0].estado).toBe('pendiente')
    expect(rows[0].archivo).toBe(ruta)
  })
})

describe('reservas', () => {
  it('no se pueden insertar directamente', async () => {
    const { error } = await como(
      CLIENTE,
      'authenticated',
      `insert into public.reservas (cliente_id, family, model_slug, price, estado, pagado_at)
       values ($1, 'iphone', '17-pro', 1329, 'disponible', '2020-01-01')`,
      [CLIENTE],
    )
    expect(error, 'no hay política de INSERT para el cliente').not.toBeNull()
  })

  it('se crean por RPC con estado y fecha fijados por el servidor', async () => {
    const { rows, error } = await como<{ crear_mis_reservas: string }>(
      CLIENTE,
      'authenticated',
      `select public.crear_mis_reservas($1::jsonb) as crear_mis_reservas`,
      [
        JSON.stringify([
          {
            family: 'iphone',
            model_slug: '17-pro',
            model_name: 'iPhone 17 Pro',
            variant_label: '256 GB Plata',
            price: 1329,
            unidades: 2,
            // Lo que el cliente intente colar aquí debe ignorarse.
            estado: 'disponible',
            pagado_at: '2020-01-01T00:00:00Z',
            cliente_id: AGENTE,
          },
        ]),
      ],
    )
    expect(error).toBeNull()
    expect(rows.length, 'una fila por unidad').toBe(2)

    const { rows: creadas } = await db.query<{
      estado: string
      cliente_id: string
      pagado_at: string
    }>(`select estado, cliente_id, pagado_at from public.reservas`)
    expect(creadas).toHaveLength(2)
    for (const r of creadas) {
      expect(r.estado, 'siempre en-espera').toBe('en-espera')
      expect(r.cliente_id, 'siempre el de la sesión').toBe(CLIENTE)
      expect(
        new Date(r.pagado_at).getFullYear(),
        'la fecha la pone el servidor: es lo que fija el puesto en la cola',
      ).toBeGreaterThan(2020)
    }
  })

  it('rechaza precios negativos y cantidades excesivas', async () => {
    const negativo = await como(
      CLIENTE,
      'authenticated',
      `select public.crear_mis_reservas($1::jsonb)`,
      [JSON.stringify([{ family: 'iphone', model_slug: '17', model_name: 'iPhone 17', variant_label: '128 GB', price: -5 }])],
    )
    expect(negativo.error).toMatch(/Precio inválido/)

    const muchas = await como(
      CLIENTE,
      'authenticated',
      `select public.crear_mis_reservas($1::jsonb)`,
      [JSON.stringify([{ family: 'iphone', model_slug: '17', model_name: 'iPhone 17', variant_label: '128 GB', price: 10, unidades: 999 }])],
    )
    expect(muchas.error).toMatch(/fuera de rango/)
  })

  it('cancela la propia y no la ajena', async () => {
    const { rows } = await db.query<{ id: string }>(`select id from public.reservas limit 1`)

    const ajena = await como(
      AGENTE,
      'authenticated',
      `select public.cancelar_mi_reserva($1)`,
      [rows[0].id],
    )
    expect(ajena.error, 'no es suya').not.toBeNull()

    const propia = await como(
      CLIENTE,
      'authenticated',
      `select public.cancelar_mi_reserva($1)`,
      [rows[0].id],
    )
    expect(propia.error).toBeNull()

    const repetida = await como(
      CLIENTE,
      'authenticated',
      `select public.cancelar_mi_reserva($1)`,
      [rows[0].id],
    )
    expect(repetida.error, 'ya no está en espera').not.toBeNull()
  })
})
