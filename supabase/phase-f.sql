-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase F
--  · email visible en /admin (Gestión de Usuarios)
--  · avatar_url + bg_url de perfil (personalización)
--  Correr en el SQL Editor. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── email en profiles ────────────────────────────────────────────────────────
-- El correo vive en auth.users (no accesible con la anon key desde el navegador).
-- Lo replicamos en profiles para mostrarlo en el panel admin.
alter table public.profiles add column if not exists email text;

-- Backfill de los usuarios ya existentes.
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id
   and (p.email is distinct from u.email);

-- ── bg_url de perfil (fondo personalizable) ──────────────────────────────────
-- avatar_url ya existe en el schema base; añadimos el fondo del perfil.
alter table public.profiles add column if not exists bg_url text;

-- ── Trigger de auto-perfil: ahora también guarda el email ─────────────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- (el trigger on_auth_user_created ya apunta a esta función; no hace falta recrearlo)
