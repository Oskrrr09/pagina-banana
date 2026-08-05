/**
 * Reproduce las piezas de Supabase de las que depende el esquema.
 *
 * `auth.uid()` se define igual que allí —leyendo el reclamo `sub` del JWT que
 * PostgREST deja en `request.jwt.claims`—. Copiar esa forma exacta es lo que
 * hace que probar las políticas aquí signifique algo.
 *
 * NO SE CONCEDEN PERMISOS SOBRE `public`.
 *
 * Este andamio los concedía, con el argumento de que «Supabase los concede
 * por defecto». No a estas tablas: las *default privileges* del proyecto las
 * fijó otro rol antes, y no alcanzan a lo que crea la migración. Al
 * concederlos aquí, el arnés respondía que las políticas funcionaban mientras
 * en Supabase local todo caía con «permission denied for table …» antes de
 * evaluar ninguna política. Los permisos de `public` los concede ahora la
 * propia migración `20260805000300_permisos_de_tabla.sql`, que es lo que se
 * despliega; aquí sólo se preparan los roles.
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
  create table if not exists storage.buckets (
    id text primary key,
    name text,
    public boolean,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
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
    if not exists (select 1 from pg_roles where rolname='service_role') then
      create role service_role nologin bypassrls;
    end if;
  end $$;
  grant usage on schema auth, storage to anon, authenticated, service_role;
  -- Storage sí lo gestiona Supabase, no esta migración: sus tablas ya existen
  -- y ya vienen con permisos. Se imitan aquí a mano porque las tablas se han
  -- creado justo arriba y ninguna migración las toca.
  grant select, insert, update, delete on all tables in schema storage
    to anon, authenticated, service_role;
  do $$ begin
    if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end $$;
`
