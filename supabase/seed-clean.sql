-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Limpieza y primer evento real
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--  ⚠ ESTO BORRA TODOS LOS DATOS DEMO Y CREA EL PRIMER EVENTO REAL.
-- ════════════════════════════════════════════════════════════════════════════

-- ── PASO 1: Limpiar todas las tablas (orden por dependencias FK) ───────────

-- Respuestas y votos primero (dependen de otras tablas)
DELETE FROM survey_responses;
DELETE FROM song_votes;
DELETE FROM costume_votes;
DELETE FROM costume_comments;
DELETE FROM event_comments;
DELETE FROM daily_checkins;
DELETE FROM push_subscriptions;

-- Entidades principales
DELETE FROM survey_options;
DELETE FROM surveys;
DELETE FROM songs;
DELETE FROM costumes;
DELETE FROM event_attendees;
DELETE FROM events;
DELETE FROM media_recordings;
DELETE FROM themes;

-- NO borramos profiles (se crean con auth.users y son de los usuarios reales).

-- ── PASO 2: Insertar el primer evento real ─────────────────────────────────

INSERT INTO events (title, tagline, description, date, location, ticket_price, total_tickets, available_tickets, status, comments_enabled)
VALUES (
  'Nightcore Fest 2.0 — Cyberpunk',
  '¡Vive la fiesta, que no te lo cuenten… VÍVELO! 🚀🔥',
  'Segunda edición del Nightcore Fest con temática CYBERPUNK. '
  || 'DJs: DJ Lobito (946 388 627), DJ Matt (944 506 957), DJ Mely (951 710 227). '
  || '10 horas de música Nightcore. Corcho libre hasta las 8 PM. '
  || 'Shots a los primeros en llegar. Cóctel gratis si vienes con cosplay. '
  || '1 sellada al grupo más grande. ¡Reclama tu cóctel gratis si vienes con cosplay!',
  '2026-07-12T17:00:00-05:00'::timestamptz,
  'LUXX Club × Ember — A 1 cuadra y ½ de la Plaza de Armas, Arequipa',
  0,       -- ticket_price (entrada libre o el que definas)
  200,     -- total_tickets
  200,     -- available_tickets
  'confirmed',
  true
);

-- ── PASO 3: Encuesta inicial (temática del Fest 3.0) ───────────────────────

INSERT INTO surveys (question, active) VALUES
  ('¿Qué temática quieres para el Nightcore Fest 3.0?', true)
RETURNING id;
-- Nota: toma el UUID devuelto y úsalo abajo, o corre las 2 queries juntas así:

DO $$
DECLARE
  sid uuid;
BEGIN
  -- Desactiva cualquier encuesta previa
  UPDATE surveys SET active = false WHERE active = true;

  -- Crea la nueva
  INSERT INTO surveys (question, active) VALUES
    ('¿Qué temática quieres para el Nightcore Fest 3.0?', true)
  RETURNING id INTO sid;

  -- Opciones
  INSERT INTO survey_options (survey_id, text, position) VALUES
    (sid, 'Anime Clásico (Naruto, Bleach, Death Note)', 0),
    (sid, 'Vocaloid / Hatsune Miku', 1),
    (sid, 'Gaming (FNAF, Undertale, Minecraft)', 2),
    (sid, 'Emo / Scene / Visual Kei', 3);
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- ¡Listo! La base de datos está limpia y tiene el Nightcore Fest 2.0.
-- La encuesta está activa para que la comunidad vote la próxima temática.
-- ════════════════════════════════════════════════════════════════════════════
