-- ==============================================================================
-- FASE 1: GAMIFICACIÓN DE ASISTENCIA (Insignias por Fotos)
-- Ejecutar en Supabase -> SQL Editor
-- ==============================================================================

do $$ begin
  create type proof_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists attendance_proofs (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  photo_url   text not null,
  status      proof_status not null default 'pending',
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id) on delete set null,
  unique (event_id, user_id) -- Solo una foto por usuario por evento
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table attendance_proofs enable row level security;

-- Los usuarios pueden leer sus propias pruebas y los admins pueden leer todas
drop policy if exists attendance_proofs_select on attendance_proofs;
create policy attendance_proofs_select on attendance_proofs
  for select using (auth.uid() = user_id or is_staff());

-- Los usuarios pueden insertar sus propias pruebas (1 por evento)
drop policy if exists attendance_proofs_insert on attendance_proofs;
create policy attendance_proofs_insert on attendance_proofs
  for insert with check (auth.uid() = user_id);

-- Los administradores/DJ pueden aprobar/rechazar las fotos
drop policy if exists attendance_proofs_update_staff on attendance_proofs;
create policy attendance_proofs_update_staff on attendance_proofs
  for update using (is_staff()) with check (is_staff());

-- Función para aprobar la foto y otorgar puntos/insignia (se puede mejorar luego)
create or replace function approve_attendance_proof(p_proof_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not is_staff() then
    raise exception 'No autorizado';
  end if;

  -- Cambiar el estado a aprobado
  update attendance_proofs
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_proof_id
  returning user_id into v_user_id;

  -- Dar puntos extra por asistir (ejemplo: 50 pts)
  update profiles
  set points = points + 50
  where id = v_user_id;
end;
$$;

-- Función para rechazar la foto
create or replace function reject_attendance_proof(p_proof_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff() then
    raise exception 'No autorizado';
  end if;

  update attendance_proofs
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_proof_id;
end;
$$;
