-- ── Playlist personal: canciones guardadas por usuario ──────────────────────
-- Cada usuario guarda canciones de la playlist en su lista personal ("Mis
-- guardadas"). Aplicar: Supabase → SQL Editor → Run. Seguro de re-ejecutar.

create table if not exists saved_songs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  song_id    uuid not null references songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, song_id)
);

alter table saved_songs enable row level security;

-- Cada quien ve y gestiona SOLO sus guardadas.
drop policy if exists saved_songs_select_own on saved_songs;
create policy saved_songs_select_own on saved_songs
  for select using (auth.uid() = user_id);

drop policy if exists saved_songs_write_own on saved_songs;
create policy saved_songs_write_own on saved_songs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
