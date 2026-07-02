-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase Perfil hi5: Reactions / "Fives"
--  Correr en el SQL Editor de Supabase. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.profile_reactions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reaction    text not null, -- 'star' | 'heart' | 'skull' o similar
  created_at  timestamptz not null default now(),
  unique (profile_id, user_id, reaction)
);

create index if not exists profile_reactions_idx
  on public.profile_reactions (profile_id, reaction);

alter table public.profile_reactions enable row level security;

-- Lectura pública de reacciones.
drop policy if exists profile_reactions_select on public.profile_reactions;
create policy profile_reactions_select on public.profile_reactions
  for select using ( true );

-- Solo usuarios autenticados pueden reaccionar y el user_id debe ser el suyo.
drop policy if exists profile_reactions_insert on public.profile_reactions;
create policy profile_reactions_insert on public.profile_reactions
  for insert
  to authenticated
  with check ( auth.uid() = user_id );

-- Solo el usuario que reaccionó puede quitar su reacción.
drop policy if exists profile_reactions_delete on public.profile_reactions;
create policy profile_reactions_delete on public.profile_reactions
  for delete using ( auth.uid() = user_id );

do $$ begin
  alter publication supabase_realtime add table profile_reactions;
exception when others then null; end $$;
