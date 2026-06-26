# Changelog — Nightcore AQP

Formato: `[vX.Y.Z] YYYY-MM-DD — descripción breve`.  
Versión semántica: MAYOR.MENOR.PATCH (la app web no tiene número de versión forzado; el desktop-app sí).

---

## [Unreleased] — Web

### 2026-06-26

**Limpieza · Responsive · Bugs cerrados**

- **S5 cerrado** — eliminados 5 `console.log('[FASE 3]…')` de `src/lib/data.ts`
  (`addSong` y `addCostume`). Ya no filtran datos internos en consola de producción.
- **Bug "Votar" cerrado** — `src/components/LiveFeed.tsx`: el botón de encuesta en el feed
  ahora vota *inline* con barras de porcentaje. Antes redirigía a `/encuestas` que solo hace
  `redirect('/')`. Usa `voteSurvey` de `data.ts`.
- **Admin tabs responsive** — `src/app/admin/page.tsx`: los 11 tabs pasaron de `flex-wrap`
  (3-4 filas en móvil) a `overflow-x-auto scrollbar-hide flex-nowrap` (scroll horizontal).
  Header ahora usa `flex-col sm:flex-row`.
- **Playlist song card** — `src/app/playlist/page.tsx`: botón "Copiar URL" oculto en móvil
  (`hidden sm:flex`) para que los botones Play, Guardar y YouTube no desborden.
- **`.scrollbar-hide` global** — añadido a `src/app/globals.css` (ya se usaba en tags de
  playlist pero faltaba la definición).
- TypeScript limpio tras todos los cambios (`npx tsc --noEmit` sin errores).

---

### 2026-06-25

**Chat en vivo · Perfiles sociales · Generación de imagen IA · Buzón comunitario**

- Chat de comunidad en tiempo real (`/chat`) con Supabase Realtime, filtro de groserías y
  moderación de staff.
- Perfiles ampliados: galería de fotos, bio, links (TikTok/Instagram), color de acento propio.
- Generación de fondos estilo scenecore con IA (`POST /api/generate-image`; requiere key con
  acceso a imágenes de pago; gateada a staff).
- Buzón de sugerencias/denuncias + bloques de contenido en el panel admin.
- Responsive: fila de botones de playlist envuelve correctamente en móvil.
- Migraciones pendientes de correr en Supabase: `phase-chat.sql`, `phase-profile-extras.sql`,
  `phase-sugerencias.sql`, `phase-bloques.sql`.

---

## [0.1.7] — Desktop App — 2026-06-21

- Auto-update funcional via GitHub Releases (requiere repo público).
- Descarga de Instagram MP4.
- Personalización de temas e imagen de fondo en el desktop.
- Log de descarga en UI.
- Fix `0xc00d5212` (TikTok HEVC → H.264 forzado).
- Cookies desde archivo `.txt` y desde navegador.

## [0.1.6] — Desktop App

- TikTok forzado a H.264 (`vcodec` sin `hev`/`hvc`).
- Deno para resolución del reto `nsig` de YouTube.

## [0.1.5] — Desktop App

- Auto-instalación de yt-dlp, ffmpeg y deno a `userData/bin`.
- Descarga YouTube + TikTok + Instagram + MP3.
