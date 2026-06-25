-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase Sugerencias (buzón anónimo de sugerencias/denuncias)
--  Correr en el SQL Editor de Supabase. Idempotente (se puede correr varias veces).
--
--  Crea: tabla suggestions. Seguridad por RLS: cualquier visitante (incluso
--  anónimo) puede insertar; solo el staff (admin/dj) puede leer, marcar como
--  leída y eliminar. Nunca expone las denuncias al público.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.suggestions (
  id         uuid primary key default gen_random_uuid(),
  category   text not null check (category in ('sugerencia', 'denuncia')),
  content    text not null check (char_length(content) between 10 and 1000),
  contact    text null      check (contact is null or char_length(contact) <= 100),
  user_id    uuid null references auth.users(id) on delete set null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists suggestions_created_at
  on public.suggestions (created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.suggestions enable row level security;

-- Cualquier visitante puede insertar. user_id debe ser nulo (anónimo) o el propio
-- usuario autenticado (nunca puede suplantar a otro).
drop policy if exists suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions
  for insert with check (user_id is null or auth.uid() = user_id);

-- Solo staff puede leer.
drop policy if exists suggestions_select_staff on public.suggestions;
create policy suggestions_select_staff on public.suggestions
  for select using ( is_staff() );

-- Staff actualiza (marcar leído) y borra.
drop policy if exists suggestions_update_staff on public.suggestions;
create policy suggestions_update_staff on public.suggestions
  for update using ( is_staff() ) with check ( is_staff() );

drop policy if exists suggestions_delete_staff on public.suggestions;
create policy suggestions_delete_staff on public.suggestions
  for delete using ( is_staff() );
