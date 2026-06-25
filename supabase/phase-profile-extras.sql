-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase Perfil+ (galería, bio, links y personalización propia)
--  Correr en el SQL Editor de Supabase. Idempotente.
--
--  Añade a los perfiles: biografía, links sociales (TikTok/IG), color de acento y
--  fondo persistidos en BD (para que se vean también en el perfil público), y una
--  tabla de galería de fotos (profile_photos). Seguridad por RLS: lectura pública,
--  cada quien edita lo suyo (el staff también, para moderar).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Columnas extra del perfil ────────────────────────────────────────────────
alter table public.profiles add column if not exists bio           text;
alter table public.profiles add column if not exists tiktok_url    text;
alter table public.profiles add column if not exists instagram_url text;
-- Personalización (Fase 3). bg_url también lo añade phase-f.sql; aquí es idempotente.
alter table public.profiles add column if not exists bg_url        text;
alter table public.profiles add column if not exists accent        text;

-- ── Galería de fotos del perfil ──────────────────────────────────────────────
create table if not exists public.profile_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  url        text not null,
  caption    text,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists profile_photos_user
  on public.profile_photos (user_id, position);

alter table public.profile_photos enable row level security;

-- Lectura pública (la galería se muestra en el perfil público); el dueño o el
-- staff insertan/editan/borran.
drop policy if exists profile_photos_select on public.profile_photos;
create policy profile_photos_select on public.profile_photos
  for select using ( true );

drop policy if exists profile_photos_write_own on public.profile_photos;
create policy profile_photos_write_own on public.profile_photos
  for all using ( auth.uid() = user_id or is_staff() )
  with check ( auth.uid() = user_id or is_staff() );
