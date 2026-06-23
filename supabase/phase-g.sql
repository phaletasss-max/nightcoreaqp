-- ════════════════════════════════════════════════════════════════════════════
--  NIGHTCORE AQP — Fase G
--  Arregla la subida de imágenes (avatar, flyer, fondos, archivos de canciones).
--  Error que resuelve: "new row violates row-level security policy" al subir a Storage.
--  Correr en el SQL Editor. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) El bucket 'media' debe existir y ser PÚBLICO (para servir las imágenes por URL).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- 2) Políticas de storage.objects para el bucket 'media'.
--    Permiten leer y subir a cualquiera (anon + autenticado). Es un bucket de
--    contenido comunitario (avatares, flyers, fondos); el riesgo es bajo.
--    Si más adelante quieres endurecerlo, cambia el insert/update/delete a
--    "auth.role() = 'authenticated'" (pero entonces hay que entrar con cuenta REAL,
--    no con el admin de emergencia, que no tiene sesión).

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select using ( bucket_id = 'media' );

drop policy if exists media_public_insert on storage.objects;
create policy media_public_insert on storage.objects
  for insert with check ( bucket_id = 'media' );

drop policy if exists media_public_update on storage.objects;
create policy media_public_update on storage.objects
  for update using ( bucket_id = 'media' ) with check ( bucket_id = 'media' );

drop policy if exists media_public_delete on storage.objects;
create policy media_public_delete on storage.objects
  for delete using ( bucket_id = 'media' );
