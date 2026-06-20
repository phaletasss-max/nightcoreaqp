-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Datos de ejemplo (seed)
--  Ejecutar DESPUÉS de schema.sql. Opcional: solo para no arrancar con la app vacía.
--  Las canciones/disfraces de usuario quedan sin "suggested_by" (suggested_by_name
--  guarda el nombre visible); se reasignan a usuarios reales cuando la gente vote.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Eventos ──────────────────────────────────────────────────────────────────
insert into events (id, title, tagline, description, date, location, ticket_price, total_tickets, available_tickets, status, comments_enabled)
values
  ('e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
   'NIGHTCORE NEXUS V1',
   'La mayor fiesta anime, eurobeat y nightcore en Arequipa',
   'Únete a una noche llena de visuales cyberpunk, remixes acelerados de tus canciones de anime favoritas y un setlist comandado por los DJs más duros de la escena local.',
   '2026-07-18T20:00:00-05:00',
   'Casona San Francisco 308, Centro Histórico, Arequipa',
   15.00, 150, 27, 'confirmed', true),
  ('e2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
   'NIGHTCORE FRIKI FEST (EDICIÓN ESPECIAL)',
   'Temática Cyberpunk, Hatsune Miku, FNAF & Cultura Geek',
   '¡Nuestra próxima gran fecha temática! Concurso especial de disfraces, cabina cyberpunk decorada con visuales creepy-coloridos de Vocaloid y animatrónicos, y playbacks en vivo.',
   '2026-07-25T18:00:00-05:00',
   'Por confirmar (Arequipa)',
   12.00, 200, 200, 'planning', true)
on conflict (id) do nothing;

-- ── Canciones (playlist del DJ) ──────────────────────────────────────────────
insert into songs (event_id, title, artist, youtube_url, genre, geek_tag, suggested_by_name, votes_count)
values
  ('e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Caramelldansen (Swedish Original)', 'Caramella Girls', 'https://www.youtube.com/watch?v=A67GrVdEg94', 'Nightcore Classics', 'Meme/Dance', 'MikuFan_AQP', 98),
  ('e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Idol (アイドル)', 'YOASOBI', 'https://www.youtube.com/watch?v=ZRtdQ81jPUQ', 'Anime Eurobeat', 'Anime', 'OshiNoKo_Lover', 87),
  ('e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Ева - Винтаж (Dante Dance Song)', 'Vintage (DMC Speedup Remix)', 'https://www.youtube.com/watch?v=5gU966a3Bik', 'Eurobeat Speedup', 'Gaming/DMC', 'Dante_Slayer', 76),
  ('e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'FRIENDS', 'Marshmello & Anne-Marie (Speedup)', 'https://www.youtube.com/watch?v=jzD_yyEw0M4', 'Nightcore Pop', 'Pop/Speedup', 'Friendzone_Hero', 65),
  ('e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Five Nights at Freddy''s 2 Song', 'The Living Tombstone', 'https://www.youtube.com/watch?v=d1wK9FzN96w', 'Creepy Synthwave', 'FNAF', 'Foxy_BiteOf87', 59),
  ('e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Stronger Than You - Chara Response Remake', 'Undertale Animation Parody', 'https://www.youtube.com/watch?v=co5Zo6Ng9-c', 'Chiptune Remix', 'Undertale', 'Sans_Undertale', 48),
  ('e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Creeper vs Zombie - Especial 1 Millón (Parte 2)', 'Zarcort & Kronno Zomber', 'https://www.youtube.com/watch?v=5m288qNNDw0', 'Geek Rap / Gamer', 'Minecraft', 'Fernanfloo_Fan', 43)
on conflict do nothing;

-- ── Temáticas de la comunidad ────────────────────────────────────────────────
insert into themes (name, suggested_by_name, clicks) values
  ('Hatsune Miku / Vocaloid', 'MikuFan_AQP', 142),
  ('FNAF / Horror', 'Foxy_BiteOf87', 118),
  ('Caramelldansen / Meme', 'Kawaii_Neko', 97),
  ('Undertale', 'Sans_Undertale', 85),
  ('Minecraft / Gamer', 'Fernanfloo_Fan', 73),
  ('Cyberpunk / Edgerunners', 'CyberDJ_99', 64),
  ('Evangelion', 'Asuka_S2', 51),
  ('Jujutsu Kaisen', 'Magic_Mash', 38)
on conflict do nothing;

-- ── Encuesta del día ─────────────────────────────────────────────────────────
do $$
declare s_id uuid;
begin
  insert into surveys (question, active)
  values ('¿Qué día de la semana prefieres que se realice el próximo evento de Nightcore AQP?', true)
  returning id into s_id;

  insert into survey_options (survey_id, text, position, votes_count) values
    (s_id, 'Viernes por la noche', 0, 85),
    (s_id, 'Sábado por la noche (Opción Tradicional)', 1, 221),
    (s_id, 'Domingo por la tarde (Matinee)', 2, 36);
end $$;
