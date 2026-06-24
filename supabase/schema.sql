-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Esquema de base de datos + RLS
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--  Es idempotente: se puede correr varias veces sin romper nada.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Extensiones ──────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ── Tipos (ENUMs) ────────────────────────────────────────────────────────────
do $$ begin
  create type user_role    as enum ('user', 'dj', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_status as enum ('planning', 'confirmed', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rsvp_status  as enum ('interested', 'confirmed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vote_type    as enum ('upvote', 'downvote');
exception when duplicate_object then null; end $$;


-- ════════════════════════════════════════════════════════════════════════════
--  TABLAS
-- ════════════════════════════════════════════════════════════════════════════

-- profiles ─ 1:1 con auth.users. La fila se crea sola al registrarse (trigger).
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  role          user_role not null default 'user',
  points        int not null default 0,
  streak_count  int not null default 0,
  last_check_in date,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- events ─ eventos mensuales/bimensuales.
create table if not exists events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  tagline           text,
  description       text,
  date              timestamptz not null,
  location          text,
  ticket_price      numeric(8,2) default 0,
  total_tickets     int default 0,
  available_tickets int default 0,
  status            event_status not null default 'planning',
  comments_enabled  boolean not null default true,
  created_at        timestamptz not null default now()
);

-- event_attendees ─ RSVP + reserva de entrada en una sola tabla.
create table if not exists event_attendees (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  user_id    uuid references profiles(id) on delete set null,
  name       text not null,
  email      text not null,
  code       text unique,
  status     rsvp_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)            -- 1 RSVP por usuario por evento
);

-- songs ─ sugerencias para la playlist del DJ. event_id opcional (playlist general).
create table if not exists songs (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid references events(id) on delete set null,
  title             text not null,
  artist            text not null,
  youtube_url       text not null,
  genre             text,
  geek_tag          text,
  suggested_by      uuid references profiles(id) on delete set null,
  suggested_by_name text,                -- snapshot del nombre para mostrar
  votes_count       int not null default 0,   -- mantenido por trigger
  played            boolean not null default false,
  file_url          text,                  -- MP4 propio (respaldo/fondo), subido por el media-service
  created_at        timestamptz not null default now()
);
-- Para bases ya creadas antes de agregar file_url:
alter table songs add column if not exists file_url text;
-- Hashtags de la canción (el código inserta `tags`):
alter table songs add column if not exists tags text[] not null default '{}';

-- song_votes ─ upvote/downvote por usuario. votes_count se recalcula por trigger.
create table if not exists song_votes (
  id         uuid primary key default gen_random_uuid(),
  song_id    uuid not null references songs(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  vote       vote_type not null,
  created_at timestamptz not null default now(),
  unique (song_id, user_id)             -- 1 voto por usuario por canción
);

-- event_comments ─ muro de comentarios del evento.
create table if not exists event_comments (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  user_id    uuid references profiles(id) on delete set null,
  username   text not null,
  content    text not null,
  created_at timestamptz not null default now()
);

-- costumes ─ concurso de disfraces (pasarela).
create table if not exists costumes (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references events(id) on delete set null,
  user_id     uuid references profiles(id) on delete set null,
  char_name   text not null,            -- "character" es palabra reservada en algunos contextos
  anime       text not null,
  photo_url   text not null,
  description text,
  votes_count int not null default 0,   -- mantenido por trigger
  created_at  timestamptz not null default now()
);
-- Columnas que el código inserta (tags / WIP):
alter table costumes add column if not exists tags   text[]  not null default '{}';
alter table costumes add column if not exists is_wip boolean not null default false;

-- costume_votes ─ like por usuario al disfraz.
create table if not exists costume_votes (
  id         uuid primary key default gen_random_uuid(),
  costume_id uuid not null references costumes(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (costume_id, user_id)
);

-- costume_comments ─ comentarios en cada disfraz.
create table if not exists costume_comments (
  id         uuid primary key default gen_random_uuid(),
  costume_id uuid not null references costumes(id) on delete cascade,
  user_id    uuid references profiles(id) on delete set null,
  username   text not null,
  content    text not null,
  created_at timestamptz not null default now()
);

-- surveys ─ encuesta del día. Solo una activa a la vez (la app reemplaza la activa).
create table if not exists surveys (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists survey_options (
  id          uuid primary key default gen_random_uuid(),
  survey_id   uuid not null references surveys(id) on delete cascade,
  text        text not null,
  position    int default 0,
  votes_count int not null default 0    -- mantenido por trigger
);

create table if not exists survey_responses (
  id         uuid primary key default gen_random_uuid(),
  survey_id  uuid not null references surveys(id) on delete cascade,
  option_id  uuid not null references survey_options(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (survey_id, user_id)           -- 1 respuesta por usuario por encuesta
);

-- daily_checkins ─ una fila por día de ingreso. Alimenta la racha (streak).
create table if not exists daily_checkins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  check_in_date date not null default current_date,
  created_at    timestamptz not null default now(),
  unique (user_id, check_in_date)
);

-- push_subscriptions ─ suscripciones Web Push (notificaciones).
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);

-- media_recordings ─ grabaciones propias de los sets del DJ (descarga libre).
create table if not exists media_recordings (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  recorded_on date,
  duration    text,
  size        text,
  file_url    text not null,
  downloads   int not null default 0,
  created_at  timestamptz not null default now()
);


-- ════════════════════════════════════════════════════════════════════════════
--  FUNCIONES DE APOYO
-- ════════════════════════════════════════════════════════════════════════════

-- ¿El usuario actual es admin o DJ? (security definer para no chocar con RLS)
create or replace function is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'dj')
  );
$$;

-- Crear el profile automáticamente cuando se registra un usuario en auth.users.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Recalcular votes_count de una canción (upvote = +1, downvote = -1).
create or replace function recompute_song_votes()
returns trigger
language plpgsql
as $$
declare
  target uuid := coalesce(new.song_id, old.song_id);
begin
  update songs set votes_count = coalesce((
    select sum(case when vote = 'upvote' then 1 else -1 end)
    from song_votes where song_id = target
  ), 0)
  where id = target;
  return null;
end;
$$;

drop trigger if exists trg_song_votes on song_votes;
create trigger trg_song_votes
  after insert or update or delete on song_votes
  for each row execute function recompute_song_votes();

-- Recalcular votes_count de un disfraz (conteo simple de likes).
create or replace function recompute_costume_votes()
returns trigger
language plpgsql
as $$
declare
  target uuid := coalesce(new.costume_id, old.costume_id);
begin
  update costumes set votes_count = coalesce((
    select count(*) from costume_votes where costume_id = target
  ), 0)
  where id = target;
  return null;
end;
$$;

drop trigger if exists trg_costume_votes on costume_votes;
create trigger trg_costume_votes
  after insert or update or delete on costume_votes
  for each row execute function recompute_costume_votes();

-- Recalcular votes_count de una opción de encuesta.
create or replace function recompute_survey_votes()
returns trigger
language plpgsql
as $$
declare
  target uuid := coalesce(new.option_id, old.option_id);
begin
  update survey_options set votes_count = coalesce((
    select count(*) from survey_responses where option_id = target
  ), 0)
  where id = target;
  return null;
end;
$$;

drop trigger if exists trg_survey_votes on survey_responses;
create trigger trg_survey_votes
  after insert or update or delete on survey_responses
  for each row execute function recompute_survey_votes();

-- Check-in diario: registra el día, actualiza racha y suma puntos. Devuelve la racha.
-- Llamar desde la app con: supabase.rpc('daily_check_in')
create or replace function daily_check_in()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid       uuid := auth.uid();
  last_date date;
  new_streak int;
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  -- Si ya hizo check-in hoy, devolver la racha actual sin cambios.
  if exists (select 1 from daily_checkins where user_id = uid and check_in_date = current_date) then
    return (select streak_count from profiles where id = uid);
  end if;

  select last_check_in into last_date from profiles where id = uid;

  if last_date = current_date - 1 then
    new_streak := (select streak_count from profiles where id = uid) + 1;  -- racha continúa
  else
    new_streak := 1;                                                       -- racha reiniciada
  end if;

  insert into daily_checkins (user_id, check_in_date) values (uid, current_date);

  update profiles
  set streak_count = new_streak,
      last_check_in = current_date,
      points = points + 5
  where id = uid;

  return new_streak;
end;
$$;

-- Conteo público de asistentes por evento (sin exponer correos). Útil para la home.
create or replace function event_attendee_count(p_event_id uuid)
returns int
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int from event_attendees where event_id = p_event_id;
$$;


-- ════════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Sin esto, cualquiera con la anon key podría leer/editar todo desde el browser.
-- ════════════════════════════════════════════════════════════════════════════

alter table profiles           enable row level security;
alter table events             enable row level security;
alter table event_attendees    enable row level security;
alter table songs              enable row level security;
alter table song_votes         enable row level security;
alter table event_comments     enable row level security;
alter table costumes           enable row level security;
alter table costume_votes      enable row level security;
alter table costume_comments   enable row level security;
alter table surveys            enable row level security;
alter table survey_options     enable row level security;
alter table survey_responses   enable row level security;
alter table daily_checkins     enable row level security;
alter table push_subscriptions enable row level security;
alter table media_recordings   enable row level security;

-- Helper para recrear policies de forma idempotente.
-- (En SQL no hay "create policy if not exists", así que hacemos drop + create.)

-- ── profiles ─────────────────────────────────────────────────────────────────
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select using (true);                         -- ranking/usernames son públicos

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── events ───────────────────────────────────────────────────────────────────
drop policy if exists events_select on events;
create policy events_select on events
  for select using (true);

drop policy if exists events_write_staff on events;
create policy events_write_staff on events
  for all using (is_staff()) with check (is_staff());

-- ── event_attendees ──────────────────────────────────────────────────────────
-- Lectura: el dueño ve su RSVP; el staff ve todos (para la lista del admin).
drop policy if exists attendees_select on event_attendees;
create policy attendees_select on event_attendees
  for select using (auth.uid() = user_id or is_staff());

drop policy if exists attendees_insert_own on event_attendees;
create policy attendees_insert_own on event_attendees
  for insert with check (auth.uid() = user_id);

drop policy if exists attendees_delete_own on event_attendees;
create policy attendees_delete_own on event_attendees
  for delete using (auth.uid() = user_id or is_staff());

-- ── songs ────────────────────────────────────────────────────────────────────
drop policy if exists songs_select on songs;
create policy songs_select on songs for select using (true);

drop policy if exists songs_insert_auth on songs;
create policy songs_insert_auth on songs
  for insert with check (auth.uid() = suggested_by);

-- El staff puede editar/eliminar cualquiera (marcar "tocada", limpiar cola).
-- El que sugirió puede borrar la suya.
drop policy if exists songs_update_staff on songs;
create policy songs_update_staff on songs
  for update using (is_staff()) with check (is_staff());

drop policy if exists songs_delete on songs;
create policy songs_delete on songs
  for delete using (is_staff() or auth.uid() = suggested_by);

-- ── song_votes ───────────────────────────────────────────────────────────────
drop policy if exists song_votes_select on song_votes;
create policy song_votes_select on song_votes for select using (true);

drop policy if exists song_votes_write_own on song_votes;
create policy song_votes_write_own on song_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── event_comments ───────────────────────────────────────────────────────────
drop policy if exists comments_select on event_comments;
create policy comments_select on event_comments for select using (true);

drop policy if exists comments_insert_own on event_comments;
create policy comments_insert_own on event_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists comments_delete on event_comments;
create policy comments_delete on event_comments
  for delete using (auth.uid() = user_id or is_staff());

-- ── costumes ─────────────────────────────────────────────────────────────────
drop policy if exists costumes_select on costumes;
create policy costumes_select on costumes for select using (true);

drop policy if exists costumes_insert_own on costumes;
create policy costumes_insert_own on costumes
  for insert with check (auth.uid() = user_id);

drop policy if exists costumes_modify on costumes;
create policy costumes_modify on costumes
  for update using (auth.uid() = user_id or is_staff())
  with check (auth.uid() = user_id or is_staff());

drop policy if exists costumes_delete on costumes;
create policy costumes_delete on costumes
  for delete using (auth.uid() = user_id or is_staff());

-- ── costume_votes ────────────────────────────────────────────────────────────
drop policy if exists costume_votes_select on costume_votes;
create policy costume_votes_select on costume_votes for select using (true);

drop policy if exists costume_votes_write_own on costume_votes;
create policy costume_votes_write_own on costume_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── costume_comments ─────────────────────────────────────────────────────────
drop policy if exists costume_comments_select on costume_comments;
create policy costume_comments_select on costume_comments for select using (true);

drop policy if exists costume_comments_insert_own on costume_comments;
create policy costume_comments_insert_own on costume_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists costume_comments_delete on costume_comments;
create policy costume_comments_delete on costume_comments
  for delete using (auth.uid() = user_id or is_staff());

-- ── surveys / survey_options ─ lectura pública, escritura solo staff ──────────
drop policy if exists surveys_select on surveys;
create policy surveys_select on surveys for select using (true);

drop policy if exists surveys_write_staff on surveys;
create policy surveys_write_staff on surveys
  for all using (is_staff()) with check (is_staff());

drop policy if exists survey_options_select on survey_options;
create policy survey_options_select on survey_options for select using (true);

drop policy if exists survey_options_write_staff on survey_options;
create policy survey_options_write_staff on survey_options
  for all using (is_staff()) with check (is_staff());

-- ── survey_responses ─────────────────────────────────────────────────────────
drop policy if exists survey_responses_select on survey_responses;
create policy survey_responses_select on survey_responses for select using (true);

drop policy if exists survey_responses_insert_own on survey_responses;
create policy survey_responses_insert_own on survey_responses
  for insert with check (auth.uid() = user_id);

-- ── daily_checkins ─ cada quien ve/crea los suyos ────────────────────────────
drop policy if exists checkins_own on daily_checkins;
create policy checkins_own on daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── push_subscriptions ─ privadas del usuario ───────────────────────────────
drop policy if exists push_own on push_subscriptions;
create policy push_own on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── media_recordings ─ lectura pública, escritura solo staff ─────────────────
drop policy if exists media_select on media_recordings;
create policy media_select on media_recordings for select using (true);

drop policy if exists media_write_staff on media_recordings;
create policy media_write_staff on media_recordings
  for all using (is_staff()) with check (is_staff());


-- ════════════════════════════════════════════════════════════════════════════
--  TEMÁTICAS sugeridas por la comunidad (ranking por clicks; top 10 = populares)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists themes (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  suggested_by      uuid references profiles(id) on delete set null,
  suggested_by_name text,
  clicks            int not null default 0,
  created_at        timestamptz not null default now()
);
-- Evita temáticas duplicadas (case-insensitive).
create unique index if not exists themes_name_unique on themes (lower(name));

-- Incrementar clicks de forma segura (cualquiera puede sumar, nadie edita el resto).
create or replace function click_theme(p_theme_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update themes set clicks = clicks + 1 where id = p_theme_id;
$$;

alter table themes enable row level security;

drop policy if exists themes_select on themes;
create policy themes_select on themes for select using (true);

drop policy if exists themes_insert on themes;
create policy themes_insert on themes for insert with check (auth.uid() = suggested_by);

drop policy if exists themes_write_staff on themes;
create policy themes_write_staff on themes
  for all using (is_staff()) with check (is_staff());


-- ════════════════════════════════════════════════════════════════════════════
--  REALTIME (opcional)
--  Permite que los votos/comentarios se actualicen solos sin refrescar.
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin
  alter publication supabase_realtime add table songs;
  alter publication supabase_realtime add table song_votes;
  alter publication supabase_realtime add table event_comments;
  alter publication supabase_realtime add table costumes;
  alter publication supabase_realtime add table survey_options;
exception when others then null; end $$;
