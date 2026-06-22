-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase D (perfiles públicos + privacidad) y E (moderación)
--  Correr en el SQL Editor. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Columnas faltantes de events (el admin las usa al crear eventos) ─────────
-- Sin estas columnas, crear/editar un evento desde /admin fallaba (columna
-- inexistente) y el evento "desaparecía" al refrescar.
alter table public.events add column if not exists flyer_url       text;
alter table public.events add column if not exists themes          text;
alter table public.events add column if not exists details         text;
alter table public.events add column if not exists google_maps_url text;
alter table public.events add column if not exists tiktok_urls     text;
alter table public.events add column if not exists djs             jsonb;

-- ── Fase D: privacidad de perfil ─────────────────────────────────────────────
-- Si is_private = true, el perfil público muestra solo nombre/avatar y oculta
-- comentarios y actividad. La lectura del row sigue siendo pública (ranking).
alter table public.profiles add column if not exists is_private boolean not null default false;

-- ── Fase E: filtros de palabras + moderación de comentarios ──────────────────
create table if not exists public.banned_words (
  id         uuid primary key default gen_random_uuid(),
  word       text unique not null,
  created_at timestamptz not null default now()
);
alter table public.banned_words enable row level security;

drop policy if exists banned_words_select on public.banned_words;
create policy banned_words_select on public.banned_words
  for select using ( true );

drop policy if exists banned_words_write_staff on public.banned_words;
create policy banned_words_write_staff on public.banned_words
  for all using ( is_staff() ) with check ( is_staff() );

-- Marca de "requiere revisión" en comentarios. Se publica igual, pero en público
-- se muestra censurado (***) mientras flagged = true.
alter table public.event_comments add column if not exists flagged boolean not null default false;

-- El staff puede actualizar comentarios (aprobar = quitar flagged).
drop policy if exists comments_update_staff on public.event_comments;
create policy comments_update_staff on public.event_comments
  for update using ( is_staff() ) with check ( is_staff() );
