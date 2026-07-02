-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Phase Security Hardening
--  Correr en el SQL Editor de Supabase. Idempotente.
--
--  Resuelve TODOS los warnings del Supabase Linter (2026-07-02):
--  1. function_search_path_mutable → añade SET search_path = public
--  2. anon_security_definer_function_executable → revoke EXECUTE de anon
--  3. Crea RPC add_points() para sumar puntos sin chocar con el trigger
--  4. Nota: auth_leaked_password_protection se activa desde el Dashboard
-- ════════════════════════════════════════════════════════════════════════════

-- ══ 1. CORREGIR search_path MUTABLE EN TRIGGERS ══════════════════════════
-- Las funciones de recálculo de votos no tenían set search_path, lo cual es
-- un riesgo de inyección de search_path.

create or replace function recompute_song_votes()
returns trigger
language plpgsql
set search_path = public
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

create or replace function recompute_costume_votes()
returns trigger
language plpgsql
set search_path = public
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

create or replace function recompute_survey_votes()
returns trigger
language plpgsql
set search_path = public
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

-- ══ 2. REVOCAR EXECUTE DE ANON EN FUNCIONES SECURITY DEFINER ══════════════
-- Estas funciones NO deben poder llamarse sin haber iniciado sesión.
-- handle_new_user:         es un trigger, no debe exponerse como RPC.
-- approve/reject_proof:    solo staff; ya valida internamente con is_staff().
-- daily_check_in:          requiere auth.uid(); anon siempre falla.

revoke execute on function public.handle_new_user()                       from anon;
revoke execute on function public.approve_attendance_proof(uuid)          from anon;
revoke execute on function public.reject_attendance_proof(uuid)           from anon;
revoke execute on function public.daily_check_in()                        from anon;

-- NOTA: is_staff(), click_theme(uuid), event_attendee_count(uuid) se
-- dejan accesibles a anon INTENCIONALMENTE:
--   • is_staff() → la RLS la usa internamente, necesita funcionar para anon (devuelve false).
--   • click_theme() → cualquier visitante puede sumar clicks (sin auth).
--   • event_attendee_count() → lectura pública del conteo.

-- ══ 3. RPC add_points — SOLUCIONA Bug 2 de la auditoría ══════════════════
-- El trigger check_profile_update BLOQUEA cambios a `points` hechos por
-- usuarios autenticados normales (para evitar hackeo). Pero addPoints()
-- en auth.tsx también hacía un update directo → los puntos NUNCA se
-- guardaban en prod.
--
-- Solución: un RPC security definer que suma puntos al usuario autenticado.
-- No valida rol (cualquier usuario logueado gana puntos por acciones).
-- El delta se limita a ±100 por llamada como protección anti-abuso.

create or replace function add_points(p_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;
  -- Limitar el delta para evitar abuso desde la consola del browser
  if p_delta < -100 or p_delta > 100 then
    raise exception 'Delta fuera de rango permitido';
  end if;
  update profiles set points = points + p_delta where id = uid;
end;
$$;

-- Solo usuarios autenticados pueden llamar add_points
revoke execute on function public.add_points(int) from anon;

-- ══ 4. NOTA SOBRE auth_leaked_password_protection ═════════════════════════
-- Este warning se resuelve desde el Dashboard de Supabase:
--   Authentication → Settings → Password Security
--   → Activar "Leaked Password Protection"
-- No requiere SQL.
