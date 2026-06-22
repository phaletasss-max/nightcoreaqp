-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fixes de persistencia y Storage (correr en SQL Editor)
--  Idempotente: se puede correr varias veces.
--  Origen: errores reales de consola (subida de imágenes y escritura de ajustes).
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. STORAGE: bucket `media` ───────────────────────────────────────────────
-- Error observado: "new row violates row-level security policy" al subir a
-- /storage/v1/object/media/uploads/...  → el bucket no tenía políticas.
-- Solución: bucket público (lectura) + subida/edición solo para usuarios
-- autenticados (no anónimos, por seguridad).

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media_public_read"  on storage.objects;
create policy "media_public_read" on storage.objects
  for select using ( bucket_id = 'media' );

drop policy if exists "media_auth_insert"  on storage.objects;
create policy "media_auth_insert" on storage.objects
  for insert to authenticated with check ( bucket_id = 'media' );

drop policy if exists "media_auth_update"  on storage.objects;
create policy "media_auth_update" on storage.objects
  for update to authenticated using ( bucket_id = 'media' );

drop policy if exists "media_auth_delete"  on storage.objects;
create policy "media_auth_delete" on storage.objects
  for delete to authenticated using ( bucket_id = 'media' );

-- ── 2. SITE_SETTINGS: cerrar escritura pública ───────────────────────────────
-- Antes: INSERT/UPDATE con CHECK (true) → cualquiera con la anon key podía
-- sobrescribir los fondos/ajustes. Ahora: solo staff (is_staff()).
-- ⚠ Requiere que el admin tenga sesión REAL de Supabase con role 'admin'/'dj'
--   (ver punto 4). El bypass hardcodeado NO pasa is_staff().

alter table public.site_settings enable row level security;

drop policy if exists "Lectura publica site_settings" on public.site_settings;
create policy "site_settings_select" on public.site_settings
  for select using ( true );

drop policy if exists "Escritura publica site_settings (Insert)" on public.site_settings;
drop policy if exists "Escritura publica site_settings (Update)" on public.site_settings;
drop policy if exists "site_settings_write_staff" on public.site_settings;
create policy "site_settings_write_staff" on public.site_settings
  for all using ( is_staff() ) with check ( is_staff() );

-- ── 3. DIAGNÓSTICO de persistencia del playlist (solo lectura) ───────────────
-- Corre esto para ver cuántas canciones hay REALMENTE en la BD.
-- Si la app "muestra" canciones que aquí NO aparecen → estaban solo en
-- localStorage (insert rechazado por RLS al no haber sesión real).

-- select count(*) as canciones_en_bd from public.songs;
-- select id, title, artist, suggested_by, suggested_by_name, votes_count, created_at
--   from public.songs order by created_at desc limit 50;

-- ── 4. ADMIN REAL (clave para que la persistencia funcione) ──────────────────
-- La RLS exige sesión real de Supabase. El "bypass" admin@nightcore.aqp NO la
-- tiene, así que sus escrituras (eventos, site_settings, borrar canciones) son
-- rechazadas en silencio. Solución: crea un usuario real y hazlo admin.
--   1) Regístrate normalmente en la app (Entrar → Registrarse) con tu correo.
--   2) Corre, reemplazando el correo:
-- update public.profiles
--   set role = 'admin'
--   where id = (select id from auth.users where email = 'TU_CORREO@gmail.com');
