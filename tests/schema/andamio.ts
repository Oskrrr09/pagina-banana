/**
 * Reproduce las piezas de Supabase de las que depende el esquema.
 *
 * `auth.uid()` se define igual que allí —leyendo el reclamo `sub` del JWT que
 * PostgREST deja en `request.jwt.claims`— y los roles reciben los permisos de
 * tabla que Supabase concede por defecto. Copiar esa forma exacta es lo que
 * hace que probar las políticas aquí signifique algo.
 *
 * Sigue siendo una imitación: no hay GoTrue, ni PostgREST, ni el servicio de
 * Storage. Por eso las pruebas de `tests/rls/` contra un proyecto dedicado no
 * sobran.
 */
export const ANDAMIO_SUPABASE = `
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
