# Documentación Funcional - Nightcore AQP

## 1. Inventario de Arquitectura

### Módulos Principales
*   **Frontend Web (App Router):** Sistema en Next.js (SSR/SSG).
*   **Backend Media (`media-service`):** Microservicio Express en Render (o Arch VPS) encargado del bypass de media usando `yt-dlp` y `ffmpeg`.
*   **Base de Datos y Auth:** Supabase (PostgreSQL, Realtime, Storage, Auth).
*   **App Móvil (APK):** Proyecto en `mobile-app` basado en Expo (React Native).

### Componentes Clave (UI)
*   `GlobalPlayer.tsx`: Reproductor de fondo con persistencia de estado global y visualizador de video.
*   `DesignLoader.tsx` / `BgEditor.tsx`: Controladores de los estilos inyectados dinámicamente desde Supabase (Design System Admin).
*   `AuthModal.tsx`: Control de acceso y login vía Supabase.
*   `DailyChallenges.tsx` / `ThemesSection.tsx`: Módulos de retención y marketing (PT-10).

### Endpoints (Rutas de API)
*   `/api/crate/download`: Generador masivo de archivos ZIP para el DJ.
*   `/api/cron/cleanup`: Cronjob seguro que limpia el caché de Supabase Storage.
*   `/api/assistant`: IA o asistente local.
*   `/api/spotify/tracks`: (Opcional) Resolución de metadatos musicales.

### Funciones Críticas (`src/lib/data.ts` y `lib/auth.tsx`)
1.  **Gestión de Supabase (`data.ts`):** `addSong()`, `getEvents()`, `updateSiteSetting()`.
2.  **Auth y Permisos (`auth.tsx`):** `useAuth()`, intercepta y maneja roles (`isStaff`).
3.  **Descargas (`media-service`):** `streamDownload()`, `downloadToBuffer()`.

## 2. Dependencias Externas y Variables de Entorno

### Dependencias
*   `@supabase/supabase-js`
*   `yt-dlp` y `ffmpeg` (Binarios requeridos en el host de `media-service`)
*   `archiver` (Node.js compresión)
*   `react-youtube` / `next/image`

### Variables de Entorno Requeridas (`.env.local`)
*   `NEXT_PUBLIC_SUPABASE_URL`: URL del cluster Supabase.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Llave pública de anon.
*   `SUPABASE_SERVICE_ROLE_KEY`: Llave maestra (Backend Only) para `cron` y `media-service`.
*   `NEXT_PUBLIC_MEDIA_SERVICE_URL`: URL base del `media-service` (ej. en Render).
*   `CRON_SECRET`: Firma de seguridad para invocar el limpiador.

## 3. Puntos de Fallo (Riesgos)
*   **Caída del `media-service`:** Si Render suspende el servicio, los usuarios no podrán buscar canciones válidas en `/playlist` ni escuchar pre-visualizaciones, pero el Muro y Eventos seguirán vivos.
*   **Cambio en Algoritmo de YT (yt-dlp roto):** Fallan las validaciones de URL.
*   **Supabase Storage Lleno:** Si el cron falla repetidamente, se agota el tier gratuito y el sitio no carga fondos dinámicos.
