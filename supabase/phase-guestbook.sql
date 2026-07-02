-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase Perfil hi5: Guestbook (Libro de visitas)
--  Correr en el SQL Editor de Supabase. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.profile_guestbook (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists profile_guestbook_owner
  on public.profile_guestbook (owner_id, created_at desc);

alter table public.profile_guestbook enable row level security;

-- Cualquier usuario (incluso anon) puede leer el guestbook de un perfil.
drop policy if exists profile_guestbook_select on public.profile_guestbook;
create policy profile_guestbook_select on public.profile_guestbook
  for select using ( true );

-- Cualquier usuario autenticado puede escribir en un guestbook (y debe coincidir author_id con su UID).
drop policy if exists profile_guestbook_insert on public.profile_guestbook;
create policy profile_guestbook_insert on public.profile_guestbook
  for insert
  to authenticated
  with check ( auth.uid() = author_id );

-- El dueño del perfil (owner_id) o el autor (author_id) o el staff pueden borrar comentarios.
drop policy if exists profile_guestbook_delete on public.profile_guestbook;
create policy profile_guestbook_delete on public.profile_guestbook
  for delete using ( auth.uid() = owner_id or auth.uid() = author_id or is_staff() );

do $$ begin
  alter publication supabase_realtime add table profile_guestbook;
exception when others then null; end $$;
