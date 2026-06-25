-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase Chat (chat de comunidad en tiempo real)
--  Correr en el SQL Editor de Supabase. Idempotente (se puede correr varias veces).
--
--  Crea: salas de chat (chat_rooms), mensajes (chat_messages) y reportes
--  (chat_reports). Seguridad por RLS: cualquiera lee, solo usuarios con sesión
--  escriben como ellos mismos, el staff (admin/dj) oculta/borra. Habilita Realtime
--  sobre chat_messages para que los mensajes lleguen en vivo (postgres_changes).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Salas ────────────────────────────────────────────────────────────────────
-- 'general' por defecto. event_id opcional → permite un canal por evento.
create table if not exists public.chat_rooms (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  event_id   uuid references public.events(id) on delete cascade,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.chat_rooms (slug, name) values ('general', 'Chat general')
  on conflict (slug) do nothing;

-- ── Mensajes ─────────────────────────────────────────────────────────────────
-- 'room' es el slug de la sala (texto, no FK, para tolerar salas dinámicas como
-- 'event-<uuid>'). 'hidden' lo marca el staff para esconder un mensaje sin borrarlo.
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  room       text not null default 'general',
  user_id    uuid references auth.users(id) on delete set null,
  username   text not null,
  content    text not null,
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_room_time
  on public.chat_messages (room, created_at desc);

-- ── Reportes ─────────────────────────────────────────────────────────────────
-- Un usuario reporta un mensaje; el staff lo revisa (NO se oculta solo, para
-- evitar abuso). unique(message_id, reporter_id) → un reporte por persona.
create table if not exists public.chat_reports (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references public.chat_messages(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (message_id, reporter_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.chat_rooms    enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_reports  enable row level security;

-- chat_rooms: lectura pública, escritura solo staff.
drop policy if exists chat_rooms_select on public.chat_rooms;
create policy chat_rooms_select on public.chat_rooms
  for select using ( true );

drop policy if exists chat_rooms_write_staff on public.chat_rooms;
create policy chat_rooms_write_staff on public.chat_rooms
  for all using ( is_staff() ) with check ( is_staff() );

-- chat_messages: se ven los no ocultos (el staff ve todos); inserta solo el
-- propio usuario autenticado; el staff actualiza (ocultar); borra el autor o el staff.
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages
  for select using ( hidden = false or is_staff() );

drop policy if exists chat_messages_insert_own on public.chat_messages;
create policy chat_messages_insert_own on public.chat_messages
  for insert with check ( auth.uid() = user_id );

drop policy if exists chat_messages_update_staff on public.chat_messages;
create policy chat_messages_update_staff on public.chat_messages
  for update using ( is_staff() ) with check ( is_staff() );

drop policy if exists chat_messages_delete on public.chat_messages;
create policy chat_messages_delete on public.chat_messages
  for delete using ( auth.uid() = user_id or is_staff() );

-- chat_reports: inserta solo el reportante (como él mismo); lectura/borrado staff.
drop policy if exists chat_reports_insert_own on public.chat_reports;
create policy chat_reports_insert_own on public.chat_reports
  for insert with check ( auth.uid() = reporter_id );

drop policy if exists chat_reports_select_staff on public.chat_reports;
create policy chat_reports_select_staff on public.chat_reports
  for select using ( is_staff() );

drop policy if exists chat_reports_delete_staff on public.chat_reports;
create policy chat_reports_delete_staff on public.chat_reports
  for delete using ( is_staff() );

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Añade chat_messages a la publicación de Realtime para recibir INSERT en vivo.
-- Idempotente: solo si aún no está en la publicación.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
