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
const AGENTE_B = '66666666-6666-4666-8666-666666666666'
const SUPERVISOR = '77777777-7777-4777-8777-777777777777'
const CLIENTE_REVISION = '88888888-8888-4888-8888-888888888888'

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
  for (const id of [ANA, BEA, CLIENTE, AGENTE, AGENTE_B, SUPERVISOR, CLIENTE_REVISION]) {
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
    `insert into public.clientes (
       id, email, nombre, telefono, direccion_envio,
       descuento_educativo_estado, descuento_educativo_archivo,
       descuento_educativo_subido_at
     ) values ($1, 'revision@ejemplo.test', 'Persona revisada', '600111222',
       '{"localidad":"Las Palmas"}'::jsonb, 'pendiente',
       'justificantes/revision.pdf', '2026-08-01T10:00:00Z')`,
    [CLIENTE_REVISION],
  )
  await db.query(
    `insert into public.agentes (id, email, nombre, rol) values
       ($1, 'a@ejemplo.test', 'Agente A', 'agente'),
       ($2, 'b@ejemplo.test', 'Agente B', 'agente'),
       ($3, 's@ejemplo.test', 'Supervisora', 'supervisor')`,
    [AGENTE, AGENTE_B, SUPERVISOR],
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
      `select public.enviar_mensaje_visitante($1, '¿Tenéis el 17 Pro?')`,
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

  it('un agente válido responde por RPC y el mensaje queda firmado con su UUID', async () => {
    const { rows } = await db.query<{ id: string }>(`select id from public.conversaciones limit 1`)
    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.responder_como_agente($1, 'Buenos días')`,
      [rows[0].id],
    )
    expect(error, 'el agente debe poder responder').toBeNull()

    const { rows: guardados } = await db.query<{ autor: string; agente_id: string }>(
      `select autor, agente_id from public.mensajes where texto = 'Buenos días'`,
    )
    expect(guardados[0].autor).toBe('agent')
    // Lo que importa: la firma sale de la sesión, no del cliente.
    expect(guardados[0].agente_id, 'no puede quedar nulo ni ser de otro').toBe(AGENTE)
  })

  it('el agente no puede insertar mensajes a mano ni atribuirlos a otro', async () => {
    const { rows } = await db.query<{ id: string }>(`select id from public.conversaciones limit 1`)
    const directo = await como(
      AGENTE,
      'authenticated',
      `insert into public.mensajes (conversacion_id, autor, texto, agente_id)
       values ($1, 'agent', 'firmando por otro', $2)`,
      [rows[0].id, CLIENTE],
    )
    expect(directo.error, 'ya no hay INSERT directo para el agente').not.toBeNull()
  })

  it('un cliente autenticado no puede usar el RPC de agente', async () => {
    const { rows } = await db.query<{ id: string }>(`select id from public.conversaciones limit 1`)
    const { error } = await como(
      CLIENTE,
      'authenticated',
      `select public.responder_como_agente($1, 'me hago pasar por agente')`,
      [rows[0].id],
    )
    expect(error).toMatch(/agente dado de alta/)
  })

  it('el mensaje de un visitante mueve ultimo_mensaje_at', async () => {
    // Sin `security definer` en el disparador esto fallaba en silencio: el
    // mensaje entraba y la fecha no se movía, así que la conversación se
    // quedaba hundida en la bandeja del agente.
    const { rows } = await db.query<{ id: string; antes: string }>(
      `select c.id, c.ultimo_mensaje_at as antes
         from public.conversaciones c
         join public.visitantes v on v.id = c.visitor_id
        where v.auth_id = $1`,
      [ANA],
    )
    const antes = rows[0].antes

    await new Promise((r) => setTimeout(r, 5))
    const { error } = await como(
      ANA,
      'anon',
      `select public.enviar_mensaje_visitante($1, 'sigo aquí')`,
      [rows[0].id],
    )
    expect(error).toBeNull()

    const { rows: despues } = await db.query<{ ultimo_mensaje_at: string }>(
      `select ultimo_mensaje_at from public.conversaciones where id = $1`,
      [rows[0].id],
    )
    expect(
      new Date(despues[0].ultimo_mensaje_at).getTime(),
      'la fecha debe avanzar',
    ).toBeGreaterThan(new Date(antes).getTime())
  })

  it('el agente no puede ascenderse a supervisor', async () => {
    // Sin política de UPDATE, PostgreSQL no da error: simplemente no alcanza
    // ninguna fila. Se comprueba el efecto, que es lo que importa.
    await como(
      AGENTE,
      'authenticated',
      `update public.agentes set rol = 'supervisor' where id = $1`,
      [AGENTE],
    )

    const { rows } = await db.query<{ rol: string | null }>(
      `select rol from public.agentes where id = $1`,
      [AGENTE],
    )
    expect(rows[0].rol).not.toBe('supervisor')
  })

  it('el agente sí puede cambiar su estado por RPC', async () => {
    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.cambiar_mi_estado('ocupado')`,
    )
    expect(error).toBeNull()

    const { rows } = await db.query<{ estado: string }>(
      `select estado from public.agentes where id = $1`,
      [AGENTE],
    )
    expect(rows[0].estado).toBe('ocupado')
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

  it('revisa un cliente existente y solo cambia los campos de revisión', async () => {
    const { rows: antes } = await db.query<{
      email: string
      nombre: string
      telefono: string
      direccion_envio: { localidad: string }
      archivo: string
      subido_at: string
    }>(
      `select email, nombre, telefono, direccion_envio,
              descuento_educativo_archivo as archivo,
              descuento_educativo_subido_at as subido_at
         from public.clientes where id = $1`,
      [CLIENTE_REVISION],
    )

    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.revisar_descuento_educativo($1, 'aprobado', 'Documentación válida')`,
      [CLIENTE_REVISION],
    )
    expect(error).toBeNull()

    const { rows: despues } = await db.query<{
      email: string
      nombre: string
      telefono: string
      direccion_envio: { localidad: string }
      archivo: string
      subido_at: string
      estado: string
      nota: string
      revisado_por: string
      revisado_at: string
    }>(
      `select email, nombre, telefono, direccion_envio,
              descuento_educativo_archivo as archivo,
              descuento_educativo_subido_at as subido_at,
              descuento_educativo_estado as estado,
              descuento_educativo_nota as nota,
              descuento_educativo_revisado_por as revisado_por,
              descuento_educativo_revisado_at as revisado_at
         from public.clientes where id = $1`,
      [CLIENTE_REVISION],
    )
    expect({
      email: despues[0].email,
      nombre: despues[0].nombre,
      telefono: despues[0].telefono,
      direccion_envio: despues[0].direccion_envio,
      archivo: despues[0].archivo,
      subido_at: despues[0].subido_at,
    }).toEqual(antes[0])
    expect(despues[0].estado).toBe('aprobado')
    expect(despues[0].nota).toBe('Documentación válida')
    expect(despues[0].revisado_por).toBe(AGENTE)
    expect(despues[0].revisado_at).toBeTruthy()
  })

  it('rechaza un cliente inexistente y no modifica ninguna ficha', async () => {
    const { rows: antes } = await db.query<{ estado: string; nota: string; revisado_por: string }>(
      `select descuento_educativo_estado as estado,
              descuento_educativo_nota as nota,
              descuento_educativo_revisado_por as revisado_por
         from public.clientes where id = $1`,
      [CLIENTE_REVISION],
    )
    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.revisar_descuento_educativo(
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'rechazado', 'No debe aplicarse'
      )`,
    )
    expect(error).toMatch(/El cliente no existe/)
    const { rows: despues } = await db.query<typeof antes[number]>(
      `select descuento_educativo_estado as estado,
              descuento_educativo_nota as nota,
              descuento_educativo_revisado_por as revisado_por
         from public.clientes where id = $1`,
      [CLIENTE_REVISION],
    )
    expect(despues).toEqual(antes)
  })

  it('un cliente no puede revisar descuentos y el estado permanece intacto', async () => {
    const { rows: antes } = await db.query<{ estado: string; nota: string }>(
      `select descuento_educativo_estado as estado,
              descuento_educativo_nota as nota
         from public.clientes where id = $1`,
      [CLIENTE_REVISION],
    )
    const { error } = await como(
      CLIENTE,
      'authenticated',
      `select public.revisar_descuento_educativo($1, 'rechazado', 'Ataque')`,
      [CLIENTE_REVISION],
    )
    expect(error).toMatch(/Solo un agente autenticado/)
    const { rows: despues } = await db.query<typeof antes[number]>(
      `select descuento_educativo_estado as estado,
              descuento_educativo_nota as nota
         from public.clientes where id = $1`,
      [CLIENTE_REVISION],
    )
    expect(despues).toEqual(antes)
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

describe('conversaciones: nadie escribe la fila a mano', () => {
  /** Conversación limpia para cada prueba, creada por el camino legítimo. */
  async function nueva(uid: string): Promise<string> {
    const { rows } = await como<{ abrir_conversacion: string }>(
      uid,
      'anon',
      `select public.abrir_conversacion('Visitante') as abrir_conversacion`,
    )
    return rows[0].abrir_conversacion
  }

  it('un visitante no puede insertar una conversación directamente', async () => {
    const { rows } = await db.query<{ id: string }>(
      `select id from public.visitantes where auth_id = $1`,
      [ANA],
    )
    // Ni siquiera con su propio visitor_id: la fila entera la elegía el
    // navegador —estado, agente, fechas, valoración—.
    const { error } = await como(
      ANA,
      'anon',
      `insert into public.conversaciones (visitor_id, estado, agente_id, ultimo_mensaje_at)
       values ($1, 'cerrada', $2, '2030-01-01')`,
      [rows[0].id, AGENTE],
    )
    expect(error, 'no hay política de INSERT').not.toBeNull()
  })

  it('un agente no puede reescribir la fila ni borrarla', async () => {
    const conv = await nueva(BEA)
    const antes = await db.query<{ visitor_id: string; created_at: string }>(
      `select visitor_id, created_at from public.conversaciones where id = $1`,
      [conv],
    )

    await como(
      AGENTE,
      'authenticated',
      `update public.conversaciones
          set visitor_id = gen_random_uuid(), valoracion_estrellas = 5
        where id = $1`,
      [conv],
    )
    await como(AGENTE, 'authenticated', `delete from public.conversaciones where id = $1`, [conv])

    const despues = await db.query<{ visitor_id: string; estrellas: number | null }>(
      `select visitor_id, valoracion_estrellas as estrellas
         from public.conversaciones where id = $1`,
      [conv],
    )
    expect(despues.rows, 'la conversación no se borra').toHaveLength(1)
    expect(despues.rows[0].visitor_id, 'el dueño es inmutable').toBe(antes.rows[0].visitor_id)
    expect(despues.rows[0].estrellas, 'el agente no puntúa por el visitante').toBeNull()
  })

  // Ojo con el nombre: esto NO prueba una carrera.
  //
  // PGlite tiene una sola conexión y serializa, así que las dos llamadas van
  // una detrás de otra. Lo que se comprueba es la semántica de la sentencia
  // atómica —que la segunda, con el estado ya cambiado, no encuentra fila que
  // casar— y no la contención simultánea de dos conexiones. Eso queda
  // pendiente de PostgreSQL o Supabase real.
  it('el segundo agente no puede responder si la conversación ya es de otro', async () => {
    const conv = await nueva(BEA)

    const primero = await como(
      AGENTE,
      'authenticated',
      `select public.responder_como_agente($1, 'La atiendo yo')`,
      [conv],
    )
    expect(primero.error).toBeNull()

    const segundo = await como(
      AGENTE_B,
      'authenticated',
      `select public.responder_como_agente($1, 'No, yo')`,
      [conv],
    )
    expect(segundo.error, 'la lleva otro agente').toMatch(/otro agente/)

    const { rows } = await db.query<{ agente_id: string }>(
      `select agente_id from public.conversaciones where id = $1`,
      [conv],
    )
    expect(rows[0].agente_id).toBe(AGENTE)
  })

  it('el agente B no puede apropiarse de la conversación de A', async () => {
    const conv = await nueva(BEA)
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])

    const { error } = await como(
      AGENTE_B,
      'authenticated',
      `select public.asignarme_conversacion($1)`,
      [conv],
    )
    expect(error).toMatch(/la lleva otro agente/i)
  })

  it('cerrar conserva los mensajes y no deja responder después', async () => {
    const conv = await nueva(BEA)
    await como(BEA, 'anon', `select public.enviar_mensaje_visitante($1, 'hola')`, [conv])
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])

    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.cerrar_conversacion($1, true)`,
      [conv],
    )
    expect(error).toBeNull()

    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from public.mensajes where conversacion_id = $1`,
      [conv],
    )
    expect(rows[0].n, 'cerrar no borra el historial').toBeGreaterThan(0)

    const despues = await como(
      BEA,
      'anon',
      `select public.enviar_mensaje_visitante($1, 'y esto?')`,
      [conv],
    )
    expect(despues.error).toMatch(/cerrada/)
  })

  it('reabrir no toca la valoración que ya dio el visitante', async () => {
    const conv = await nueva(BEA)
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])
    await como(AGENTE, 'authenticated', `select public.cerrar_conversacion($1, true)`, [conv])
    await como(BEA, 'anon', `select public.enviar_valoracion($1, 5::smallint, 'genial')`, [conv])

    await como(AGENTE, 'authenticated', `select public.reabrir_conversacion($1)`, [conv])

    const { rows } = await db.query<{ estado: string; estrellas: number }>(
      `select estado, valoracion_estrellas as estrellas
         from public.conversaciones where id = $1`,
      [conv],
    )
    expect(rows[0].estado).toBe('abierta')
    expect(rows[0].estrellas, 'la puntuación es del visitante').toBe(5)
  })
})

describe('mensajes: la fecha y el autor los pone el servidor', () => {
  it('el visitante no puede fijar fecha, autor ni agente', async () => {
    const { rows } = await db.query<{ id: string }>(
      `select c.id from public.conversaciones c
         join public.visitantes v on v.id = c.visitor_id where v.auth_id = $1 limit 1`,
      [ANA],
    )
    // Una fecha futura dejaba la conversación clavada arriba de la bandeja.
    const { error } = await como(
      ANA,
      'anon',
      `insert into public.mensajes (conversacion_id, autor, texto, created_at, agente_id)
       values ($1, 'visitor', 'trampa', '2030-01-01', $2)`,
      [rows[0].id, AGENTE],
    )
    expect(error, 'ya no hay INSERT directo').not.toBeNull()
  })

  it('el RPC deja el mensaje con autor visitor, sin agente y con fecha de ahora', async () => {
    const { rows } = await db.query<{ id: string }>(
      `select c.id from public.conversaciones c
         join public.visitantes v on v.id = c.visitor_id where v.auth_id = $1 limit 1`,
      [ANA],
    )
    const { error } = await como(
      ANA,
      'anon',
      `select public.enviar_mensaje_visitante($1, '  con espacios  ')`,
      [rows[0].id],
    )
    expect(error).toBeNull()

    const { rows: m } = await db.query<{
      autor: string
      agente_id: string | null
      texto: string
      created_at: string
    }>(
      `select autor, agente_id, texto, created_at from public.mensajes
        where texto = 'con espacios'`,
    )
    expect(m[0].autor).toBe('visitor')
    expect(m[0].agente_id).toBeNull()
    expect(m[0].texto, 'se recorta el texto').toBe('con espacios')
    expect(new Date(m[0].created_at).getFullYear()).toBeLessThan(2030)
  })

  it('rechaza texto vacío y texto excesivo', async () => {
    const { rows } = await db.query<{ id: string }>(
      `select c.id from public.conversaciones c
         join public.visitantes v on v.id = c.visitor_id where v.auth_id = $1 limit 1`,
      [ANA],
    )
    const vacio = await como(ANA, 'anon', `select public.enviar_mensaje_visitante($1, '   ')`, [
      rows[0].id,
    ])
    expect(vacio.error).toMatch(/vacío/)

    const largo = await como(
      ANA,
      'anon',
      `select public.enviar_mensaje_visitante($1, repeat('x', 5000))`,
      [rows[0].id],
    )
    expect(largo.error).toMatch(/demasiado largo/)
  })
})

describe('reservas frente al agente', () => {
  async function reserva(): Promise<string> {
    const { rows } = await como<{ crear_mis_reservas: string }>(
      CLIENTE,
      'authenticated',
      `select public.crear_mis_reservas($1::jsonb) as crear_mis_reservas`,
      [
        JSON.stringify([
          {
            family: 'iphone',
            model_slug: '17-pro',
            model_name: 'iPhone 17 Pro',
            variant_label: '256 GB',
            price: 1329,
          },
        ]),
      ],
    )
    return rows[0].crear_mis_reservas
  }

  it('el agente solo puede cambiar el estado, y por transiciones válidas', async () => {
    const id = await reserva()
    const antes = await db.query<{ price: string; pagado_at: string; cliente_id: string }>(
      `select price, pagado_at, cliente_id from public.reservas where id = $1`,
      [id],
    )

    await como(
      AGENTE,
      'authenticated',
      `update public.reservas set price = 1, cliente_id = $2, pagado_at = '2020-01-01' where id = $1`,
      [id, AGENTE],
    )
    const despues = await db.query<{ price: string; pagado_at: string; cliente_id: string }>(
      `select price, pagado_at, cliente_id from public.reservas where id = $1`,
      [id],
    )
    expect(despues.rows[0].price, 'el precio es inmutable').toBe(antes.rows[0].price)
    expect(despues.rows[0].cliente_id, 'el dueño es inmutable').toBe(antes.rows[0].cliente_id)
    expect(despues.rows[0].pagado_at, 'la posición en la cola es inmutable').toEqual(
      antes.rows[0].pagado_at,
    )

    const ok = await como(
      AGENTE,
      'authenticated',
      `select public.cambiar_estado_reserva($1, 'disponible')`,
      [id],
    )
    expect(ok.error, 'en-espera → disponible es válida').toBeNull()

    const mal = await como(
      AGENTE,
      'authenticated',
      `select public.cambiar_estado_reserva($1, 'en-espera')`,
      [id],
    )
    expect(mal.error, 'disponible → en-espera no lo es').toMatch(/Transición no permitida/)
  })

  it('un cliente no puede usar el RPC del agente', async () => {
    const id = await reserva()
    const { error } = await como(
      CLIENTE,
      'authenticated',
      `select public.cambiar_estado_reserva($1, 'cancelada')`,
      [id],
    )
    expect(error).toMatch(/agente dado de alta/)
  })

  it('el supervisor no obtiene UPDATE directo por serlo', async () => {
    const id = await reserva()
    await como(
      SUPERVISOR,
      'authenticated',
      `update public.reservas set price = 1 where id = $1`,
      [id],
    )
    const { rows } = await db.query<{ price: string }>(
      `select price from public.reservas where id = $1`,
      [id],
    )
    expect(Number(rows[0].price)).toBe(1329)
  })

  it('una cuenta de agente sin ficha de cliente no puede reservar', async () => {
    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.crear_mis_reservas($1::jsonb)`,
      [
        JSON.stringify([
          { family: 'iphone', model_slug: '17', model_name: 'iPhone 17', variant_label: '128 GB', price: 10 },
        ]),
      ],
    )
    expect(error).toMatch(/ficha de cliente/)
  })

  it('rechaza textos vacíos, listas vacías y precios con más de dos decimales', async () => {
    const vacio = await como(
      CLIENTE,
      'authenticated',
      `select public.crear_mis_reservas($1::jsonb)`,
      [JSON.stringify([{ family: '  ', model_slug: 'x', model_name: 'y', variant_label: 'z', price: 1 }])],
    )
    expect(vacio.error).toMatch(/Falta family/)

    const lista = await como(
      CLIENTE,
      'authenticated',
      `select public.crear_mis_reservas('[]'::jsonb)`,
    )
    expect(lista.error).toMatch(/ninguna línea/)

    const decimales = await como(
      CLIENTE,
      'authenticated',
      `select public.crear_mis_reservas($1::jsonb)`,
      [
        JSON.stringify([
          { family: 'iphone', model_slug: '17', model_name: 'iPhone 17', variant_label: '128 GB', price: 10.123 },
        ]),
      ],
    )
    expect(decimales.error).toMatch(/dos decimales/)
  })
})

describe('agentes entre sí', () => {
  it('B no puede cambiar el estado operativo de A', async () => {
    await como(AGENTE_B, 'authenticated', `select public.cambiar_mi_estado('ausente')`)
    const { rows } = await db.query<{ estado: string }>(
      `select estado from public.agentes where id = $1`,
      [AGENTE],
    )
    // `cambiar_mi_estado` no acepta a quién: siempre es la sesión.
    expect(rows[0].estado, 'A no cambia porque lo pida B').not.toBe('ausente')
  })

  it('ser supervisor no da UPDATE directo sobre agentes', async () => {
    await como(
      SUPERVISOR,
      'authenticated',
      `update public.agentes set rol = 'supervisor' where id = $1`,
      [AGENTE],
    )
    const { rows } = await db.query<{ rol: string }>(
      `select rol from public.agentes where id = $1`,
      [AGENTE],
    )
    expect(rows[0].rol).toBe('agente')
  })
})

describe('autorización de las operaciones sobre conversaciones', () => {
  let siguiente = 0

  /**
   * Conversación recién creada, con un visitante distinto cada vez.
   *
   * Hace falta de verdad: `abrir_conversacion()` reutiliza la conversación
   * abierta del visitante, así que reusar el mismo devolvía siempre la misma
   * fila y las pruebas se pisaban entre ellas.
   */
  async function nuevaAbierta(): Promise<string> {
    siguiente += 1
    const uid = `aaaaaaaa-0000-4000-8000-${String(siguiente).padStart(12, '0')}`
    await db.query('insert into auth.users (id, email) values ($1, $2)', [
      uid,
      `v${siguiente}@ejemplo.test`,
    ])
    const { rows } = await como<{ abrir_conversacion: string }>(
      uid,
      'anon',
      `select public.abrir_conversacion('Visitante') as abrir_conversacion`,
    )
    return rows[0].abrir_conversacion
  }

  it('una conversación cerrada Y LIBRE no puede reclamarse', async () => {
    // Aísla la condición `estado = 'abierta'` de verdad.
    //
    // La versión anterior de esta prueba dejaba la conversación asignada a A,
    // así que B fallaba por pertenecer a otro. Habría pasado igual aunque
    // desapareciera la comprobación de estado, que es justo lo que dice medir.
    // Aquí la cierra un supervisor sin asignársela, de modo que lo único que
    // puede impedir la reclamación es el estado.
    const conv = await nuevaAbierta()
    await como(SUPERVISOR, 'authenticated', `select public.cerrar_conversacion($1, false)`, [conv])

    const previo = await db.query<{ estado: string; agente_id: string | null }>(
      `select estado, agente_id from public.conversaciones where id = $1`,
      [conv],
    )
    expect(previo.rows[0].estado, 'punto de partida').toBe('cerrada')
    expect(previo.rows[0].agente_id, 'y sin agente, que es lo que aísla el caso').toBeNull()

    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.asignarme_conversacion($1)`,
      [conv],
    )
    expect(error).toMatch(/cerrada/)

    const despues = await db.query<{ estado: string; agente_id: string | null }>(
      `select estado, agente_id from public.conversaciones where id = $1`,
      [conv],
    )
    expect(despues.rows[0].agente_id, 'sigue sin agente').toBeNull()
    expect(despues.rows[0].estado, 'sigue cerrada').toBe('cerrada')
  })

  it('una conversación cerrada y asignada tampoco puede reclamarse', async () => {
    const conv = await nuevaAbierta()
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])
    await como(AGENTE, 'authenticated', `select public.cerrar_conversacion($1, false)`, [conv])

    const { error } = await como(
      AGENTE_B,
      'authenticated',
      `select public.asignarme_conversacion($1)`,
      [conv],
    )
    expect(error).not.toBeNull()
    const { rows } = await db.query<{ agente_id: string }>(
      `select agente_id from public.conversaciones where id = $1`,
      [conv],
    )
    expect(rows[0].agente_id, 'sigue siendo de A').toBe(AGENTE)
  })

  it('una conversación abierta y libre sí puede reclamarse', async () => {
    const conv = await nuevaAbierta()
    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.asignarme_conversacion($1)`,
      [conv],
    )
    expect(error).toBeNull()
    const { rows } = await db.query<{ agente_id: string }>(
      `select agente_id from public.conversaciones where id = $1`,
      [conv],
    )
    expect(rows[0].agente_id).toBe(AGENTE)
  })

  it('liberar una conversación cerrada falla y conserva la trazabilidad', async () => {
    const conv = await nuevaAbierta()
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])
    await como(AGENTE, 'authenticated', `select public.cerrar_conversacion($1, true)`, [conv])

    const antes = await db.query<Record<string, unknown>>(
      `select estado, agente_id, cerrada_at, valoracion_solicitada, valoracion_estrellas
         from public.conversaciones where id = $1`,
      [conv],
    )

    for (const quien of [AGENTE, SUPERVISOR]) {
      const { error } = await como(
        quien,
        'authenticated',
        `select public.liberar_mi_conversacion($1)`,
        [conv],
      )
      expect(error, 'una cerrada conserva quién la atendió').toMatch(/cerrada|no es tuya/)
    }

    const despues = await db.query<Record<string, unknown>>(
      `select estado, agente_id, cerrada_at, valoracion_solicitada, valoracion_estrellas
         from public.conversaciones where id = $1`,
      [conv],
    )
    expect(despues.rows[0], 'no cambia ninguna columna').toEqual(antes.rows[0])
  })

  it('un cliente heredado como agente_id no puede liberar la conversación', async () => {
    // Dato heredado real: `conversaciones.agente_id` referencia `auth.users`,
    // no `public.agentes`, y versiones anteriores dejaban escribir ahí
    // cualquier UUID. Si `liberar_mi_conversacion()` solo comprobara
    // `agente_id = auth.uid()`, ese cliente podría retirar la asignación.
    const conv = await nuevaAbierta()
    await db.query(`update public.conversaciones set agente_id = $1 where id = $2`, [
      CLIENTE,
      conv,
    ])

    const { error } = await como(
      CLIENTE,
      'authenticated',
      `select public.liberar_mi_conversacion($1)`,
      [conv],
    )
    expect(error, 'tener el UUID ahí no convierte a nadie en agente').toMatch(
      /agente dado de alta/,
    )

    const { rows } = await db.query<{ agente_id: string }>(
      `select agente_id from public.conversaciones where id = $1`,
      [conv],
    )
    expect(rows[0].agente_id, 'la asignación heredada sigue intacta').toBe(CLIENTE)
  })

  it('un anónimo no puede liberar ninguna conversación', async () => {
    const conv = await nuevaAbierta()
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])
    const { error } = await como(
      ANA,
      'anon',
      `select public.liberar_mi_conversacion($1)`,
      [conv],
    )
    expect(error).not.toBeNull()
  })

  it('asignarse la propia otra vez es idempotente', async () => {
    const conv = await nuevaAbierta()
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])
    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.asignarme_conversacion($1)`,
      [conv],
    )
    expect(error).toBeNull()
  })

  it('un agente normal no puede cerrar una conversación libre', async () => {
    const conv = await nuevaAbierta()
    const { error } = await como(
      AGENTE,
      'authenticated',
      `select public.cerrar_conversacion($1, false)`,
      [conv],
    )
    // Una conversación libre es la de otro compañero que aún no la ha cogido.
    expect(error, 'hay que asignársela primero').toMatch(/no es tuya/)
  })

  it('el supervisor sí puede cerrar una libre y una ajena', async () => {
    const libre = await nuevaAbierta()
    const libreOk = await como(
      SUPERVISOR,
      'authenticated',
      `select public.cerrar_conversacion($1, false)`,
      [libre],
    )
    expect(libreOk.error).toBeNull()

    const ajena = await nuevaAbierta()
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [ajena])
    const ajenaOk = await como(
      SUPERVISOR,
      'authenticated',
      `select public.cerrar_conversacion($1, false)`,
      [ajena],
    )
    expect(ajenaOk.error).toBeNull()
  })

  it('el agente B no puede cerrar ni reabrir la conversación de A', async () => {
    const conv = await nuevaAbierta()
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])

    const cerrar = await como(
      AGENTE_B,
      'authenticated',
      `select public.cerrar_conversacion($1, false)`,
      [conv],
    )
    expect(cerrar.error).toMatch(/no es tuya/)

    await como(AGENTE, 'authenticated', `select public.cerrar_conversacion($1, false)`, [conv])
    const reabrir = await como(
      AGENTE_B,
      'authenticated',
      `select public.reabrir_conversacion($1)`,
      [conv],
    )
    expect(reabrir.error).toMatch(/no es tuya/)
  })

  it('reabrir no cambia el agente asignado ni deja cerrada_at', async () => {
    const conv = await nuevaAbierta()
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])
    await como(AGENTE, 'authenticated', `select public.cerrar_conversacion($1, false)`, [conv])
    await como(AGENTE, 'authenticated', `select public.reabrir_conversacion($1)`, [conv])

    const { rows } = await db.query<{ estado: string; agente_id: string; cerrada_at: string | null }>(
      `select estado, agente_id, cerrada_at from public.conversaciones where id = $1`,
      [conv],
    )
    expect(rows[0].estado).toBe('abierta')
    expect(rows[0].agente_id, 'reabrir no reasigna').toBe(AGENTE)
    expect(rows[0].cerrada_at).toBeNull()
  })

  it('liberar exige que esté abierta y asignada a quien libera', async () => {
    const sinAgente = await nuevaAbierta()
    const nada = await como(
      AGENTE,
      'authenticated',
      `select public.liberar_mi_conversacion($1)`,
      [sinAgente],
    )
    expect(nada.error, 'no hay nada que liberar').not.toBeNull()

    const conv = await nuevaAbierta()
    await como(AGENTE, 'authenticated', `select public.asignarme_conversacion($1)`, [conv])
    const ajena = await como(
      AGENTE_B,
      'authenticated',
      `select public.liberar_mi_conversacion($1)`,
      [conv],
    )
    expect(ajena.error, 'no es de B').not.toBeNull()

    const propia = await como(
      AGENTE,
      'authenticated',
      `select public.liberar_mi_conversacion($1)`,
      [conv],
    )
    expect(propia.error).toBeNull()
  })

  it('un cliente y un anónimo no pueden usar los RPC de agente', async () => {
    const conv = await nuevaAbierta()
    for (const [uid, rol] of [
      [CLIENTE, 'authenticated'],
      [ANA, 'anon'],
    ] as const) {
      const { error } = await como(uid, rol, `select public.asignarme_conversacion($1)`, [conv])
      expect(error, `${rol} no debe poder asignarse conversaciones`).not.toBeNull()
    }
  })
})

describe('máquina de estados de las reservas', () => {
  async function reservaEn(estado: string): Promise<string> {
    const { rows } = await como<{ crear_mis_reservas: string }>(
      CLIENTE,
      'authenticated',
      `select public.crear_mis_reservas($1::jsonb) as crear_mis_reservas`,
      [
        JSON.stringify([
          {
            family: 'iphone',
            model_slug: '17',
            model_name: 'iPhone 17',
            variant_label: '128 GB',
            price: 959,
          },
        ]),
      ],
    )
    const id = rows[0].crear_mis_reservas
    if (estado !== 'en-espera') {
      await como(AGENTE, 'authenticated', `select public.cambiar_estado_reserva($1, 'disponible')`, [id])
    }
    if (estado === 'completada' || estado === 'cancelada') {
      await como(AGENTE, 'authenticated', `select public.cambiar_estado_reserva($1, $2)`, [id, estado])
    }
    return id
  }

  const permitidas: [string, string][] = [
    ['en-espera', 'disponible'],
    ['en-espera', 'cancelada'],
    ['disponible', 'completada'],
    ['disponible', 'cancelada'],
  ]
  for (const [desde, hasta] of permitidas) {
    it(`permite ${desde} → ${hasta}`, async () => {
      const id = await reservaEn(desde)
      const { error } = await como(
        AGENTE,
        'authenticated',
        `select public.cambiar_estado_reserva($1, $2)`,
        [id, hasta],
      )
      expect(error).toBeNull()
    })
  }

  const rechazadas: [string, string][] = [
    ['disponible', 'en-espera'],
    ['completada', 'cancelada'],
    ['cancelada', 'disponible'],
    ['completada', 'en-espera'],
  ]
  for (const [desde, hasta] of rechazadas) {
    it(`rechaza ${desde} → ${hasta}`, async () => {
      const id = await reservaEn(desde)
      const { error } = await como(
        AGENTE,
        'authenticated',
        `select public.cambiar_estado_reserva($1, $2)`,
        [id, hasta],
      )
      expect(error).toMatch(/Transición no permitida/)
      const { rows } = await db.query<{ estado: string }>(
        `select estado from public.reservas where id = $1`,
        [id],
      )
      expect(rows[0].estado, 'el estado no se mueve').toBe(desde)
    })
  }

  it('una operación con el estado ya cambiado no puede avanzar', async () => {
    // Esto NO es una prueba de contención: PGlite serializa. Comprueba la
    // semántica de la sentencia atómica, que es lo que evita que dos
    // decisiones tomadas sobre la misma lectura se apliquen las dos.
    const id = await reservaEn('disponible')

    const primera = await como(
      AGENTE,
      'authenticated',
      `select public.cambiar_estado_reserva($1, 'completada')`,
      [id],
    )
    expect(primera.error).toBeNull()

    // La segunda venía decidida cuando la reserva aún estaba 'disponible'.
    const segunda = await como(
      AGENTE_B,
      'authenticated',
      `select public.cambiar_estado_reserva($1, 'cancelada')`,
      [id],
    )
    expect(segunda.error, 'completada → cancelada no está permitida').toMatch(
      /Transición no permitida/,
    )

    const { rows } = await db.query<{ estado: string }>(
      `select estado from public.reservas where id = $1`,
      [id],
    )
    expect(rows[0].estado).toBe('completada')
  })
})

describe('la fecha de los mensajes la pone el servidor', () => {
  /** Margen por la conversión entre el reloj de Node y el de Postgres. */
  const TOLERANCIA_MS = 2000

  it('el mensaje del visitante cae dentro de la ventana de ejecución', async () => {
    const { rows: conv } = await como<{ abrir_conversacion: string }>(
      BEA,
      'anon',
      `select public.abrir_conversacion('Bea') as abrir_conversacion`,
    )
    const id = conv[0].abrir_conversacion

    const antes = Date.now()
    await como(BEA, 'anon', `select public.enviar_mensaje_visitante($1, 'dentro de ventana')`, [id])
    const despues = Date.now()

    const { rows } = await db.query<{ created_at: string; ultimo: string }>(
      `select m.created_at, c.ultimo_mensaje_at as ultimo
         from public.mensajes m
         join public.conversaciones c on c.id = m.conversacion_id
        where m.texto = 'dentro de ventana'`,
    )
    const t = new Date(rows[0].created_at).getTime()
    // Antes esto solo comprobaba que el año fuera anterior a 2030, lo que
    // dejaba pasar cualquier fecha antigua.
    expect(t).toBeGreaterThanOrEqual(antes - TOLERANCIA_MS)
    expect(t).toBeLessThanOrEqual(despues + TOLERANCIA_MS)
    expect(
      new Date(rows[0].ultimo).getTime(),
      'ultimo_mensaje_at debe coincidir con el mensaje',
    ).toBe(t)
  })

  it('la respuesta del agente también, y avanza la fecha', async () => {
    const { rows: conv } = await como<{ abrir_conversacion: string }>(
      BEA,
      'anon',
      `select public.abrir_conversacion('Bea') as abrir_conversacion`,
    )
    const id = conv[0].abrir_conversacion
    await como(BEA, 'anon', `select public.enviar_mensaje_visitante($1, 'primero')`, [id])

    const { rows: previa } = await db.query<{ ultimo: string }>(
      `select ultimo_mensaje_at as ultimo from public.conversaciones where id = $1`,
      [id],
    )

    await new Promise((r) => setTimeout(r, 5))
    const antes = Date.now()
    await como(AGENTE, 'authenticated', `select public.responder_como_agente($1, 'respondo')`, [id])
    const despues = Date.now()

    const { rows } = await db.query<{ created_at: string; ultimo: string; agente_id: string }>(
      `select m.created_at, c.ultimo_mensaje_at as ultimo, m.agente_id
         from public.mensajes m
         join public.conversaciones c on c.id = m.conversacion_id
        where m.texto = 'respondo'`,
    )
    const t = new Date(rows[0].created_at).getTime()
    expect(t).toBeGreaterThanOrEqual(antes - TOLERANCIA_MS)
    expect(t).toBeLessThanOrEqual(despues + TOLERANCIA_MS)
    expect(new Date(rows[0].ultimo).getTime()).toBe(t)
    expect(
      new Date(rows[0].ultimo).getTime(),
      'la fecha avanza respecto al mensaje anterior',
    ).toBeGreaterThan(new Date(previa[0].ultimo).getTime())
    expect(rows[0].agente_id).toBe(AGENTE)
  })

  it('el disparador no toca ninguna otra columna de la conversación', async () => {
    const { rows: conv } = await como<{ abrir_conversacion: string }>(
      BEA,
      'anon',
      `select public.abrir_conversacion('Bea') as abrir_conversacion`,
    )
    const id = conv[0].abrir_conversacion
    const antes = await db.query<Record<string, unknown>>(
      `select visitor_id, created_at, estado, agente_id, valoracion_estrellas
         from public.conversaciones where id = $1`,
      [id],
    )

    await como(BEA, 'anon', `select public.enviar_mensaje_visitante($1, 'hola')`, [id])

    const despues = await db.query<Record<string, unknown>>(
      `select visitor_id, created_at, estado, agente_id, valoracion_estrellas
         from public.conversaciones where id = $1`,
      [id],
    )
    expect(despues.rows[0]).toEqual(antes.rows[0])
  })
})
