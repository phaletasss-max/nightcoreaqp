-- ── Fix: columnas que el código usa pero faltaban en el schema ───────────────
-- Síntoma: PGRST204 "Could not find the 'tags' column of 'songs'" al sugerir
-- canción, y el equivalente al registrar disfraz (tags / is_wip).
--
-- Cómo aplicar: Supabase → SQL Editor → pega esto → Run. Es seguro re-ejecutar.

alter table songs    add column if not exists tags   text[]  not null default '{}';
alter table costumes add column if not exists tags   text[]  not null default '{}';
alter table costumes add column if not exists is_wip boolean not null default false;

-- Refresca la cache del schema de PostgREST (evita seguir viendo PGRST204).
notify pgrst, 'reload schema';
