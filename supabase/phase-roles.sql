-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE / GLITCH AQP — Phase Roles (P1 crítica)
--  Correr en: Supabase Dashboard → SQL Editor → New query → Run
--  Es idempotente: se puede correr varias veces sin romper nada.
--
--  Qué resuelve:
--   • El cambio de rol desde el panel no persistía (UPDATE directo + RLS →
--     0 filas, sin error → el rol volvía a USER al recargar).
--   • Centraliza la autorización en el backend (RPC security definer), como
--     exigen ROLES.md y SECURITY.md.
--   • Promoción a ADMIN exige credencial-hash validada SOLO en la BD.
--   • Toda promoción/rebaja queda en admin_logs (auditoría).
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;  -- crypt(), gen_salt()

-- ── 1. Secretos bloqueados ───────────────────────────────────────────────────
-- Sin policies RLS → PostgREST (anon/authenticated) NO puede leer ni escribir.
-- Solo las funciones security definer (owner) acceden a esta tabla.
create table if not exists app_secrets (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table app_secrets enable row level security;
revoke all on app_secrets from anon, authenticated;

-- ── 2. Auditoría (admin_logs) ────────────────────────────────────────────────
create table if not exists admin_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references profiles(id) on delete set null,
  action      text not null,
  target_id   uuid,
  description text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
alter table admin_logs enable row level security;
-- Staff lee la auditoría; nadie inserta/edita/borra directo (solo vía RPC).
drop policy if exists admin_logs_select_staff on admin_logs;
create policy admin_logs_select_staff on admin_logs
  for select using (is_staff());
revoke insert, update, delete on admin_logs from anon, authenticated;

-- ── 3. Policy correcta de profiles (admin o propio) ──────────────────────────
-- Garantiza el estado bueno aunque producción tuviera la policy antigua.
drop policy if exists profiles_update_own on profiles;
drop policy if exists profiles_update_own_or_admin on profiles;
create policy profiles_update_own_or_admin on profiles
  for update using (
    auth.uid() = id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  )
  with check (
    auth.uid() = id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ── 4. RPC admin_set_role — única vía autorizada para cambiar roles ──────────
create or replace function admin_set_role(
  p_target_id  uuid,
  p_new_role   user_role,
  p_credential text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller      uuid := auth.uid();
  v_caller_role user_role;
  v_old_role    user_role;
  v_hash        text;
begin
  if v_caller is null then
    raise exception 'No autenticado';
  end if;

  -- El llamante debe ser admin.
  select role into v_caller_role from profiles where id = v_caller;
  if v_caller_role is distinct from 'admin' then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;

  select role into v_old_role from profiles where id = p_target_id;
  if v_old_role is null then
    raise exception 'Usuario no encontrado';
  end if;

  -- Promoción a ADMIN → exige la credencial-hash (validada aquí, nunca en el front).
  if p_new_role = 'admin' and v_old_role is distinct from 'admin' then
    select value into v_hash from app_secrets where key = 'admin_promo';
    if v_hash is null then
      raise exception 'No hay credencial de administrador configurada';
    end if;
    if p_credential is null or crypt(p_credential, v_hash) is distinct from v_hash then
      raise exception 'Credencial de administrador inválida';
    end if;
  end if;

  -- Aplicar + auditar solo si hay cambio real.
  if v_old_role is distinct from p_new_role then
    update profiles set role = p_new_role where id = p_target_id;
    insert into admin_logs (admin_id, action, target_id, description, metadata)
    values (
      v_caller, 'role_change', p_target_id,
      format('rol %s -> %s', v_old_role, p_new_role),
      jsonb_build_object('old', v_old_role, 'new', p_new_role)
    );
  end if;
end;
$$;

revoke execute on function admin_set_role(uuid, user_role, text) from anon;
grant  execute on function admin_set_role(uuid, user_role, text) to authenticated;

-- ── 5. (SOLO EL PROPIETARIO) Fijar la credencial de administrador ────────────
-- Ejecuta esta línea UNA vez, reemplazando 'CAMBIA-ESTA-CLAVE' por tu secreto.
-- El texto plano NUNCA se guarda: solo su hash bcrypt. Para rotarla, vuelve a
-- correr la misma línea con otra clave.
--
--   insert into app_secrets (key, value)
--   values ('admin_promo', crypt('CAMBIA-ESTA-CLAVE', gen_salt('bf')))
--   on conflict (key) do update set value = excluded.value, updated_at = now();
