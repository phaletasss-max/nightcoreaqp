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

-- ── 5. SEGURIDAD DE PERFILES (Evitar hackeo de roles/puntos y permitir edición admin) ──
-- Aplica el trigger que impide a usuarios normales cambiarse el rol o puntos,
-- y actualiza la RLS para permitir que un administrador edite perfiles de otros.

-- Trigger de seguridad para evitar que los usuarios alteren su propio rol o puntos directamente
create or replace function check_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role user_role;
begin
  -- Obtener el rol del usuario autenticado que realiza la llamada
  select role into caller_role from public.profiles where id = auth.uid();

  -- 1. Si no es un administrador, impedir cambios en el rol
  if new.role is distinct from old.role then
    if caller_role is distinct from 'admin' then
      new.role := old.role; -- Restaurar el rol anterior
    end if;
  end if;

  -- 2. Impedir que usuarios comunes cambien sus puntos o racha directamente desde la API (ej: PostgREST)
  if new.points is distinct from old.points then
    if current_setting('role', true) in ('authenticated', 'anon') and (caller_role is distinct from 'admin' or caller_role is null) then
      new.points := old.points;
    end if;
  end if;

  if new.streak_count is distinct from old.streak_count then
    if current_setting('role', true) in ('authenticated', 'anon') and (caller_role is distinct from 'admin' or caller_role is null) then
      new.streak_count := old.streak_count;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_profile_update on public.profiles;
create trigger trg_check_profile_update
  before update on public.profiles
  for each row execute function check_profile_update();

-- Actualizar política RLS para permitir a administradores editar perfiles ajenos
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
  for update using (
    auth.uid() = id 
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  )
  with check (
    auth.uid() = id 
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

