-- Esquema del chat de Bananito — Fase 1
-- ============================================================
-- Cómo aplicarlo: abre el SQL Editor en el panel de Supabase,
-- pega este archivo entero y pulsa "Run". Es idempotente (usa
-- `if not exists` y `create or replace`), así que puedes volver
-- a ejecutarlo sin miedo si iteramos.
--
-- Modelo:
--   visitantes      → una fila por navegador que visita la web.
--   conversaciones  → agrupan mensajes; un visitante puede tener
--                     varias (una por sesión activa).
--   mensajes        → cada línea del chat, con `autor` = visitor|agent|bot.
--
-- Seguridad (RLS):
--   En la Fase 1 no hay auth real. El panel /agente asume que "eres tú".
--   Por eso las políticas permiten al rol `anon` leer/escribir todo lo que
--   necesita el prototipo. En la Fase 2 se sustituye por políticas basadas
--   en `auth.uid()` cuando metamos login de agente.

-- --------------------------------------------------------------
-- Extensión para generar UUIDs (viene activa en Supabase, pero
-- lo dejamos explícito para hacer el script portable).
-- --------------------------------------------------------------
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------
-- Tablas
-- --------------------------------------------------------------
create table if not exists public.visitantes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text,
  email text,
  user_agent text
);

create table if not exists public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_id uuid not null references public.visitantes(id) on delete cascade,
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  agente_id text,
  ultimo_mensaje_at timestamptz
);

create index if not exists conversaciones_ultimo_mensaje_idx
  on public.conversaciones (ultimo_mensaje_at desc nulls last);

create index if not exists conversaciones_visitor_idx
  on public.conversaciones (visitor_id);

create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  autor text not null check (autor in ('visitor', 'agent', 'bot')),
  texto text not null
);

create index if not exists mensajes_conversacion_idx
  on public.mensajes (conversacion_id, created_at);

-- --------------------------------------------------------------
-- Trigger: mantener `ultimo_mensaje_at` al día en la conversación
-- para que el panel del agente pueda ordenar por actividad reciente.
-- --------------------------------------------------------------
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversaciones
    set ultimo_mensaje_at = new.created_at
    where id = new.conversacion_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation on public.mensajes;
create trigger trg_touch_conversation
  after insert on public.mensajes
  for each row execute function public.touch_conversation_on_message();

-- --------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------
alter table public.visitantes     enable row level security;
alter table public.conversaciones enable row level security;
alter table public.mensajes       enable row level security;

-- Fase 1: acceso abierto al rol `anon` para poder prototipar sin login.
-- Cuando metamos auth real, sustituimos por políticas específicas.
drop policy if exists "fase1 anon read visitantes"      on public.visitantes;
drop policy if exists "fase1 anon insert visitantes"    on public.visitantes;
drop policy if exists "fase1 anon update visitantes"    on public.visitantes;

drop policy if exists "fase1 anon read conversaciones"  on public.conversaciones;
drop policy if exists "fase1 anon insert conversaciones" on public.conversaciones;
drop policy if exists "fase1 anon update conversaciones" on public.conversaciones;

drop policy if exists "fase1 anon read mensajes"        on public.mensajes;
drop policy if exists "fase1 anon insert mensajes"      on public.mensajes;

create policy "fase1 anon read visitantes"
  on public.visitantes for select to anon using (true);
create policy "fase1 anon insert visitantes"
  on public.visitantes for insert to anon with check (true);
create policy "fase1 anon update visitantes"
  on public.visitantes for update to anon using (true) with check (true);

create policy "fase1 anon read conversaciones"
  on public.conversaciones for select to anon using (true);
create policy "fase1 anon insert conversaciones"
  on public.conversaciones for insert to anon with check (true);
create policy "fase1 anon update conversaciones"
  on public.conversaciones for update to anon using (true) with check (true);

create policy "fase1 anon read mensajes"
  on public.mensajes for select to anon using (true);
create policy "fase1 anon insert mensajes"
  on public.mensajes for insert to anon with check (true);

-- --------------------------------------------------------------
-- Realtime: publicar las tres tablas para que los clientes se
-- puedan suscribir a INSERT/UPDATE en vivo.
-- --------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes'
  ) then
    execute 'alter publication supabase_realtime add table public.mensajes';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversaciones'
  ) then
    execute 'alter publication supabase_realtime add table public.conversaciones';
  end if;
end
$$;
