import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// ============================================================================
// Instala el esquema en un PostgreSQL de verdad y comprueba el resultado.
//
// POR QUÉ NO BASTABA CON EXPRESIONES REGULARES
//
// Las comprobaciones de texto que había (`tests/e2e/schema-seguro.spec.ts`) no
// habrían detectado el fallo que encontró la revisión: las políticas invocaban
// `public.conversacion_es_mia(...)` y la función estaba declarada más abajo en
// el mismo fichero. Sobre una base ya montada eso "funciona" porque la función
// existe de antes; sobre una base vacía, revienta. La única forma de saberlo
// es instalarlo en una base vacía.
//
// QUÉ ES ESTO Y QUÉ NO ES
//
// PGlite es PostgreSQL real compilado a WebAssembly: mismo planificador, mismo
// RLS, mismo `pg_proc`. Corre sin Docker, que es lo que permite ejecutarlo aquí
// y en cualquier CI.
//
// La versión concreta no se afirma de memoria: la primera prueba la consulta y
// la imprime, para que quede en el registro de la ejecución.
//
// Lo que NO es: no es Supabase. GoTrue, Storage y el sistema de roles se
// simulan abajo con la misma forma que tienen allí (`auth.uid()` leyendo de
// `request.jwt.claims`), pero siguen siendo una imitación. Las pruebas de
// `tests/rls/` contra un Supabase dedicado siguen haciendo falta para lo que
// depende de esas piezas — Storage sobre todo.
// ============================================================================

const DIR_MIGRACIONES = join(process.cwd(), 'supabase/migrations')

/**
 * Reproduce las piezas de Supabase de las que depende el esquema.
 *
 * `auth.uid()` se define igual que en Supabase: leyendo el reclamo `sub` del
 * JWT que PostgREST deja en `request.jwt.claims`. Copiar su forma exacta es lo
 * que hace que probar las políticas aquí signifique algo.
 */
const ANDAMIO_SUPABASE = `
  create schema if not exists auth;
  create schema if not exists storage;
  -- gen_random_uuid() es del núcleo desde PostgreSQL 13, así que no hace
  -- falta pgcrypto (que además PGlite no trae de serie).

  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text
  );

  create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(
      current_setting('request.jwt.claims', true)::json ->> 'sub', ''
    )::uuid;
  $$;

  create or replace function auth.role() returns text
  language sql stable as $$
    select coalesce(
      current_setting('request.jwt.claims', true)::json ->> 'role', 'anon'
    );
  $$;

  create table if not exists storage.buckets (
    id text primary key, name text, public boolean default false
  );
  create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text,
    owner uuid
  );
  create or replace function storage.foldername(name text) returns text[]
  language sql immutable as $$
    select string_to_array(name, '/');
  $$;
  alter table storage.objects enable row level security;

  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
      create role service_role nologin bypassrls;
    end if;
  end $$;

  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  -- Supabase concede permisos de tabla a anon y authenticated por defecto;
  -- RLS es lo que filtra después.
  alter default privileges in schema public
    grant select, insert, update, delete on tables to anon, authenticated;
  alter default privileges in schema storage
    grant select, insert, update, delete on tables to anon, authenticated;
  -- alter default privileges solo alcanza a lo que se cree después, y las
  -- tablas de storage ya existen a estas alturas.
  grant select, insert, update, delete on all tables in schema storage
    to anon, authenticated;

  -- Realtime: el esquema lo referencia al final.
  do $$ begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end $$;
`

let db: PGlite

/** Aplica las migraciones en el orden en que las aplicaría la CLI. */
async function aplicarMigraciones(base: PGlite): Promise<string[]> {
  const ficheros = readdirSync(DIR_MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort() // la CLI ordena por nombre; por eso llevan marca de tiempo delante
  for (const f of ficheros) {
    await base.exec(readFileSync(join(DIR_MIGRACIONES, f), 'utf8'))
  }
  return ficheros
}

beforeAll(async () => {
  // El esquema declara `create extension pgcrypto`, así que se carga igual
  // que en Supabase en vez de retocar el SQL para la prueba: probar una
  // versión distinta de la que se despliega no probaría nada.
  db = await PGlite.create({ extensions: { pgcrypto } })
  await db.exec(ANDAMIO_SUPABASE)
}, 120_000)

afterAll(async () => {
  await db?.close()
})

describe('instalación desde cero', () => {
  it('deja constancia de la versión de PostgreSQL usada', async () => {
    const { rows } = await db.query<{ version: string }>('select version()')
    // Se imprime a propósito: cualquier afirmación sobre "Postgres N" en la
    // documentación tiene que poder contrastarse con la ejecución real.
    console.log(`   PostgreSQL bajo prueba → ${rows[0].version}`)
    expect(rows[0].version).toMatch(/PostgreSQL/)
  })

  it('las migraciones se aplican sobre una base vacía', async () => {
    const ficheros = await aplicarMigraciones(db)
    expect(ficheros.length, 'debe haber al menos una migración').toBeGreaterThan(0)

    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from information_schema.tables
        where table_schema = 'public'`,
    )
    expect(rows[0].n, 'deben existir las tablas').toBeGreaterThan(5)
  })

  it('se pueden volver a aplicar sin romperse (idempotencia)', async () => {
    // Es lo que hace que la misma migración sirva para una base nueva y para
    // la ya desplegada.
    await expect(aplicarMigraciones(db)).resolves.toBeDefined()
  })
})

describe('firmas de las funciones', () => {
  /**
   * Firmas reales de una función, tal y como las ve PostgreSQL.
   *
   * Se quedan solo los tipos: los nombres de parámetro no distinguen
   * sobrecargas, que es lo que aquí se quiere contar.
   */
  async function firmas(nombre: string): Promise<string[]> {
    const { rows } = await db.query<{ args: string }>(
      `select pg_get_function_identity_arguments(p.oid) as args
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = $1
        order by 1`,
      [nombre],
    )
    return rows.map((r) =>
      r.args
        .split(',')
        .map((p) => p.trim().split(/\s+/).slice(1).join(' '))
        .join(', '),
    )
  }

  it('no queda la sobrecarga antigua de abrir_conversacion', async () => {
    const encontradas = await firmas('abrir_conversacion')
    expect(encontradas, 'debe existir exactamente una').toHaveLength(1)
    // La antigua tenía un quinto `text`: el texto de la bienvenida, que era lo
    // que permitía almacenar mensajes firmados por el bot desde el navegador.
    expect(encontradas[0]).toBe('text, text, text, text')
  })

  it('no queda la sobrecarga antigua de actualizar_mi_ficha', async () => {
    const encontradas = await firmas('actualizar_mi_ficha')
    expect(encontradas).toHaveLength(1)
    expect(encontradas[0], 'la antigua aceptaba la ruta del justificante').toBe(
      'text, text, jsonb, jsonb',
    )
  })

  it('no queda la versión de enviar_valoracion que recibe el visitante', async () => {
    const encontradas = await firmas('enviar_valoracion')
    expect(encontradas).toHaveLength(1)
    expect(encontradas[0]).toBe('uuid, smallint, text')
  })
})

describe('políticas', () => {
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

    expect(rows.length, 'debe haber políticas').toBeGreaterThan(10)

    const abiertas = rows
      .filter((r) => r.usando === 'true' || r.comprobando === 'true')
      .map((r) => `${r.tabla}.${r.politica}`)

    expect(
      abiertas,
      'estas políticas dan acceso incondicional:\n  ' + abiertas.join('\n  '),
    ).toEqual([])
  })

  it('no queda ninguna política de INSERT sobre mensajes ni conversaciones', async () => {
    // Ya no se escribe por política: todo pasa por RPC, que es lo único que
    // puede fijar autor, firmante y fecha sin fiarse del navegador.
    const { rows } = await db.query<{ tabla: string; politica: string }>(
      `select c.relname as tabla, pol.polname as politica
         from pg_policy pol
         join pg_class c on c.oid = pol.polrelid
        where c.relname in ('mensajes', 'conversaciones')
          and pol.polcmd = 'a'`,
    )
    expect(
      rows.map((r) => `${r.tabla}.${r.politica}`),
      'un INSERT directo deja al cliente elegir columnas del servidor',
    ).toEqual([])
  })

  it('no queda UPDATE ni DELETE directo sobre conversaciones ni reservas', async () => {
    const { rows } = await db.query<{ tabla: string; politica: string; cmd: string }>(
      `select c.relname as tabla, pol.polname as politica, pol.polcmd::text as cmd
         from pg_policy pol
         join pg_class c on c.oid = pol.polrelid
        where c.relname in ('conversaciones', 'reservas', 'agentes')
          and pol.polcmd in ('w', 'd')`,
    )
    expect(
      rows.map((r) => `${r.tabla}.${r.politica} (${r.cmd})`),
      'borrar una conversación se lleva sus mensajes por cascada',
    ).toEqual([])
  })
})

describe('funciones security definer', () => {
  it('todas fijan su search_path', async () => {
    const { rows } = await db.query<{ nombre: string; config: string[] | null }>(
      `select p.proname as nombre, p.proconfig as config
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef`,
    )
    expect(rows.length, 'debe haber funciones security definer').toBeGreaterThan(5)

    const sinRuta = rows
      .filter((r) => !(r.config ?? []).some((c) => c.startsWith('search_path=')))
      .map((r) => r.nombre)

    expect(
      sinRuta,
      'sin search_path fijo, quien controle el suyo puede anteponer una tabla ' +
        'propia y hacer que la función escriba donde no debe:\n  ' + sinRuta.join('\n  '),
    ).toEqual([])
  })

  it('las auxiliares no son ejecutables desde la API', async () => {
    // `conversacion_es_mia` la usan las políticas; nadie debe poder llamarla
    // directamente para sondear de quién es una conversación.
    for (const nombre of ['visitantes_protege_columnas', 'touch_conversation_on_message']) {
      const { rows } = await db.query<{ rol: string }>(
        `select r.rolname as rol
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
           join pg_roles r on r.oid = a.grantee
          where n.nspname = 'public' and p.proname = $1
            and a.privilege_type = 'EXECUTE'
            and r.rolname in ('anon', 'authenticated', 'public')`,
        [nombre],
      )
      expect(rows.map((r) => r.rol), `${nombre} no debe ser ejecutable por la API`).toEqual([])
    }
  })
})

describe('privilegios finales', () => {
  /** Roles con EXECUTE sobre una función. */
  async function quienEjecuta(nombre: string): Promise<string[]> {
    const { rows } = await db.query<{ rol: string }>(
      `select r.rolname as rol
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
         join pg_roles r on r.oid = a.grantee
        where n.nspname = 'public' and p.proname = $1
          and a.privilege_type = 'EXECUTE'
          and r.rolname in ('anon', 'authenticated', 'public')
        order by 1`,
      [nombre],
    )
    return rows.map((r) => r.rol)
  }

  it('los RPC de agente solo los ejecuta authenticated', async () => {
    for (const nombre of [
      'asignarme_conversacion',
      'liberar_mi_conversacion',
      'cerrar_conversacion',
      'reabrir_conversacion',
      'cambiar_estado_reserva',
      'responder_como_agente',
      'cambiar_mi_estado',
    ]) {
      expect(await quienEjecuta(nombre), `${nombre}`).toEqual(['authenticated'])
    }
  })

  it('los RPC del visitante los ejecutan anon y authenticated', async () => {
    for (const nombre of ['abrir_conversacion', 'enviar_mensaje_visitante', 'enviar_valoracion']) {
      expect(await quienEjecuta(nombre), `${nombre}`).toEqual(['anon', 'authenticated'])
    }
  })

  it('las auxiliares no son ejecutables desde la API', async () => {
    // `es_supervisor` decide quién puede cerrar y reabrir: poder llamarla
    // desde fuera no rompe nada por sí solo, pero es superficie que no hace
    // falta exponer.
    for (const nombre of [
      'es_supervisor',
      'visitantes_protege_columnas',
      'touch_conversation_on_message',
    ]) {
      expect(await quienEjecuta(nombre), `${nombre}`).toEqual([])
    }
  })

  // Actúan sobre datos de OTRO por diseño, así que el destinatario tiene que
  // venir por parámetro. Lo que las protege no es ocultar el id, sino que la
  // autorización sea `es_agente()`.
  const ACTUAN_SOBRE_TERCEROS = new Set(['revisar_descuento_educativo'])

  it('ningún RPC de datos propios recibe el identificador del propietario', async () => {
    const { rows } = await db.query<{ nombre: string; args: string }>(
      `select p.proname as nombre, pg_get_function_arguments(p.oid) as args
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef`,
    )
    const sospechosas = rows
      .filter((r) => !ACTUAN_SOBRE_TERCEROS.has(r.nombre))
      .filter((r) => /p_(agente_id|cliente_id|visitor_id|autor|created_at|fecha|uid)\b/i.test(r.args))
      .map((r) => `${r.nombre}(${r.args})`)

    expect(
      sospechosas,
      'esos valores los deriva el servidor de la sesión; aceptarlos por ' +
        'parámetro es pedirle al cliente la respuesta que hay que comprobar:\n  ' +
        sospechosas.join('\n  '),
    ).toEqual([])
  })
})
