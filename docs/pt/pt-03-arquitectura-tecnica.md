# Plan de Trabajo (PT-03) - Arquitectura Técnica

## 1. Stack Tecnológico General
El proyecto Nightcore AQP está construido bajo una arquitectura moderna sin servidor (Serverless), maximizando la escalabilidad y minimizando los costos operativos.

*   **Frontend & Backend (API):** Next.js 14+ (App Router). Permite React Server Components (RSC) para cargas ultrarrápidas y SEO, combinado con Server Actions para mutaciones seguras sin necesidad de montar una API REST compleja.
*   **Base de Datos & Auth:** Supabase (PostgreSQL). Actúa como la fuente única de verdad. Se aprovechan sus características como Row Level Security (RLS) para evitar que usuarios no autorizados borren datos, y Edge Functions para tareas pesadas si se requiere a futuro.
*   **Almacenamiento (Storage):** Supabase Storage (Bucket "media"). Usado para guardar flyers, fotos de perfil, imágenes de disfraces, archivos MP3/MP4 descargados y pruebas de asistencia.
*   **Estilos:** TailwindCSS con variables CSS nativas para soportar cambios de diseño (temas) en vivo.

## 2. Modelado de Datos (Esquema Principal)
El sistema relacional se basa en las siguientes tablas clave:
*   `profiles`: Tabla extendida de los usuarios autenticados (relacionada con `auth.users`).
*   `events`: Manejo de las fechas, estados, aforo y metadatos de las fiestas.
*   `event_attendees` y `attendance_proofs`: El motor de reservas (RSVP) y su verificación.
*   `songs` y `song_votes`: El sistema de co-creación de la playlist.
*   `costumes` y `costume_votes`: Concurso de cosplay/outfits interactivo.
*   `event_comments` y `banned_words`: El muro de la comunidad y su filtro protector.

## 3. Integraciones Externas Críticas
*   **Media-Service (yt-dlp):** Para eludir restricciones de CORS y bloqueos, la aplicación se apoya en un microservicio en Python/Node que ejecuta `yt-dlp` en un VPS o contenedor separado. Su labor es procesar enlaces de YouTube y devolver el stream en bruto (MP4/MP3) o subirlo directo a Supabase.
*   **Spotify Web API:** Flujo *Client Credentials* en el lado del servidor (`/api/spotify/tracks`) para raspar metadatos de playlists, con `fallback` de scraping de la ruta `/embed/` para eludir posibles errores 403.

## 4. Patrones de Diseño Adoptados
*   **Capa de Abstracción de Datos (`src/lib/data.ts`):** Todo componente de UI llama a funciones de este archivo. Este archivo decide internamente si conectarse a Supabase o usar `localStorage` (modo Demo) como `fallback` o sincronización offline.
*   **Seguridad por Capas:** Se valida en UI (formularios HTML5) → Se valida en Next.js Server Actions (TypeScript) → Se bloquea en la Base de Datos (Políticas RLS en Postgres).
