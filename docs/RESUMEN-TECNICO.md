# Mapa técnico del proyecto — Nightcore AQP

> Documento **maestro / de traspaso**: mapea el proyecto tal como está **en el código**.
> Verificado contra el repo y `npm run build` en verde. Última actualización: **2026-06-23**.
>
> Complementa: [CHANGELOG.md](./CHANGELOG.md) (historial), [ROADMAP.md](./ROADMAP.md) (visión/fases),
> [DECISIONS.md](./DECISIONS.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [ESTADO.md](./ESTADO.md).

---

## 1. Qué es y visión

Web de un club de **nightcore en Arequipa** (organiza **Yorch**, hecho por *Los Simpatizantes
de JP*; público, sin fines de lucro). Eventos cada 1–2 meses + comunidad diaria: playlist
colaborativa con votos, disfraces, encuestas, rachas, temáticas, descargas y un asistente IA.
Estética **scenecore** (neón). Edición actual: **Nightcore Arequipa 3 / Fest 2.0**.

**Visión a futuro (anotada por el dueño):** la plataforma puede volverse **multi-evento /
multi-género** — nightcore sería *uno* de varios eventos (de otros géneros) sobre la misma
base. El modelo de datos ya lo permite en buena medida (la tabla `events` es genérica; songs/
costumes/comments cuelgan de un `event_id`). Para multi-género real faltaría: agrupar eventos
por "serie/género", branding por evento, y un selector de comunidad. Ver §12.

Stack: **Next.js 16.2.9 (App Router, React 19, Turbopack) + TypeScript + Tailwind v4** en
**Vercel** · **Supabase** (Postgres + Auth + Storage) · **media-service** (Node/Express +
yt-dlp + ffmpeg + deno) en **Render** · APIs externas: **Spotify**, **Gemini**, **Cobalt**.
Deploy: `nightcoreaqp-five.vercel.app`. Repo: `github.com/phaletasss-max/nightcoreaqp`
(public). Media-service: `nightcore-media.onrender.com`.

---

## 2. Arquitectura

```
┌────────────────────────┐     ┌─────────────────────────┐
│  Frontend (Vercel)     │────▶│  Supabase               │
│  Next.js 16 · React 19 │◀────│  Postgres · Auth ·      │
│  Tailwind v4           │     │  Storage (bucket media) │
└───────┬────────────────┘     └─────────────────────────┘
        │  rutas API (server, en Vercel):
        ├─▶ /api/spotify/tracks ─▶ Spotify embed público (lee nombres, esquiva el 403)
        │                          └ fallback: Spotify Web API (client-credentials)
        ├─▶ /api/assistant ───────▶ Gemini (chat "Nightie", tier gratuito)
        ├─▶ /api/download ────────▶ Cobalt (fallback de descargas si no hay media-service)
        │
        └─▶ NEXT_PUBLIC_MEDIA_SERVICE_URL ─▶ media-service (Render): yt-dlp + ffmpeg + deno
              /api/info · /api/download · /api/search · /api/store · /api/ytcheck · /health
```

**Por qué el media-service aparte:** `yt-dlp` no corre en Vercel (serverless + YouTube
bloquea IPs de datacenter). Vive en Render con **cookies de YouTube** + **deno** (runtime JS
para el reto nsig). Es la única pieza que toca YouTube directamente.

---

## 3. Modo dual de datos

Toda la app corre **con o sin Supabase**, decidido en runtime por `isSupabaseConfigured()`
([src/utils/supabase.ts](../src/utils/supabase.ts)):
- **Configurado** → `src/lib/data.ts` habla con Postgres (anon key + RLS).
- **Sin configurar** → fallback a `localStorage` + datos demo ([src/lib/demo-data.ts](../src/lib/demo-data.ts)).

Las páginas solo llaman a la capa [src/lib/data.ts](../src/lib/data.ts). Notas:
- **Canciones**: localStorage-first + Supabase como backup; `getSongs` combina ambas
  (dedupe por id/url). Para que una sugerencia sea **compartida** (la vean todos), el usuario
  debe estar logueado con **cuenta real** (RLS `songs_insert: auth.uid() = suggested_by`).
  El "admin de emergencia" no tiene sesión real → sus sugerencias quedan solo locales.

---

## 4. Mapa de archivos (`src/`)

### Páginas (`src/app/`)
| Ruta | Archivo | Qué hace |
|---|---|---|
| `/` | [page.tsx](../src/app/page.tsx) | **Eventos = feed/home**: evento + countdown + RSVP/ticket, muro de comentarios (moderado), retos diarios, temáticas, novedades, fondos por sección. |
| `/playlist` | [playlist/page.tsx](../src/app/playlist/page.tsx) | Sugerir/votar. 3 vías: **Buscar canción** (YouTube), **Importar de Spotify**, **Sugerir** (link YT). Descargar con calidades (`DownloadMenu`). Reproducir todo. |
| `/disfraces` | [disfraces/page.tsx](../src/app/disfraces/page.tsx) | Subir cosplay (foto+evento+fecha), votar, comentar. |
| `/perfil` | [perfil/page.tsx](../src/app/perfil/page.tsx) | Perfil propio: avatar subible, stats, insignias, privacidad, guardar canciones favoritas, vincular Spotify, botón **Consola** (si staff). |
| `/perfil/[id]` | [perfil/[id]/page.tsx](../src/app/perfil/[id]/page.tsx) | Perfil público (respeta `is_private`). |
| `/perfil/descargas` | [perfil/descargas/page.tsx](../src/app/perfil/descargas/page.tsx) | Descargador directo (pega link → MP3/MP4). |
| `/admin` | [admin/page.tsx](../src/app/admin/page.tsx) | **Consola DJ/admin** (solo rol real o clave maestra). CRUD eventos, cola DJ, moderación, usuarios, encuestas, diseño. **Clave de seguridad** en acciones destructivas. |
| `/encuestas` | [encuestas/page.tsx](../src/app/encuestas/page.tsx) | Redirige a `/`. |

### Rutas API (`src/app/api/`, corren en Vercel)
| Ruta | Qué hace |
|---|---|
| [spotify/tracks](../src/app/api/spotify/tracks/route.ts) | Lee canciones de una playlist: **1º embed público** (`__NEXT_DATA__`, esquiva el 403), 2º Spotify Web API (client-credentials). |
| [assistant](../src/app/api/assistant/route.ts) | Chat con **Gemini**. Prueba varios modelos gratuitos (flash-lite) hasta que uno responda. Key server-side. |
| [download](../src/app/api/download/route.ts) | Proxy a **Cobalt** (descargas sin media-service propio). |

### Componentes (`src/components/`)
`Navbar` · `Hero` · `AuthModal` · `DailyChallenges` · `ThemesSection` · `CommunityFeed` ·
`VideoBackground` · `ScenecoreBackground` · `GlobalPlayer` (+ `PlayerContext`) · `DesignLoader`
· `BgEditor` + **`SectionBg`** (fondos por sección con opacidad, soporta video) ·
**`DownloadMenu`** (descarga con calidades/tamaños) · **`Assistant`** (chat flotante "Nightie").

### Lógica (`src/lib/`)
[data.ts](../src/lib/data.ts) (capa de datos) · [auth.tsx](../src/lib/auth.tsx) (AuthProvider) ·
[media.ts](../src/lib/media.ts) (`checkVideo`/`downloadMedia`/`searchYouTube`/`searchYouTubeList`/
`storeBackup`) · [moderation.ts](../src/lib/moderation.ts) · [types.ts](../src/lib/types.ts) ·
[demo-data.ts](../src/lib/demo-data.ts) · [logger.ts](../src/lib/logger.ts).

---

## 5. Media-service (Render) — endpoints

Carpeta [media-service/](../media-service) (Node/Express). Dockerfile instala yt-dlp + ffmpeg +
**deno**. Cookies de YouTube vía Secret File + `YTDLP_COOKIES` (se copian a `/tmp` porque
`/etc/secrets` es read-only).

| Método | Ruta | Cuerpo | Devuelve |
|---|---|---|---|
| GET | `/` · `/health` | — | estado |
| GET | `/api/ytcheck` | — | versión de yt-dlp |
| POST | `/api/info` | `{url}` | metadatos + **calidades de mp4 (altura+MB)** + `audioSizeMb` + `embeddable` |
| POST | `/api/search` | `{query, limit}` | `{url, results:[{url,title,author,thumbnail,duration}]}` (búsqueda YouTube) |
| POST | `/api/download` | `{url, format, quality}` | stream del archivo (mp3 real vía ffmpeg; mp4 progresivo) |
| POST | `/api/store` | `{url, format}` | `{url}` (descarga + sube a Supabase Storage) |

---

## 6. Base de datos (Supabase)

Correr en orden en el **SQL Editor**:

| Script | Crea | Estado |
|---|---|---|
| [schema.sql](../supabase/schema.sql) | ~15 tablas, ENUMs, triggers (votos, racha, auto-perfil), **RLS**, `themes`+`click_theme`, `songs.file_url` | base |
| [fixes.sql](../supabase/fixes.sql) | políticas bucket `media`, cierre `site_settings`, admin real | ✅ |
| [phase-de.sql](../supabase/phase-de.sql) | columnas extra de `events`, `profiles.is_private`, `banned_words`, `event_comments.flagged` | ✅ |
| [phase-f.sql](../supabase/phase-f.sql) | `profiles.email` (+backfill+trigger), `profiles.bg_url` | ✅ |
| [phase-g.sql](../supabase/phase-g.sql) | políticas `storage.objects` del bucket `media` (subir avatar/flyer/fondos) | ✅ |

Tablas: `profiles`, `events`, `event_attendees`, `songs`, `song_votes`, `event_comments`,
`costumes`, `costume_votes`, `costume_comments`, `surveys`, `survey_options`,
`survey_responses`, `themes`, `site_settings`, `banned_words`.

**RLS clave:** `songs`/`costumes`/comentarios = lectura pública (`using true`); escritura
requiere `auth.uid()` propio; staff (`is_staff()`) puede moderar/borrar.

---

## 7. Variables de entorno

### Vercel (frontend) — plantilla en [.env.local.example](../.env.local.example)
| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | BD / auth |
| `NEXT_PUBLIC_MEDIA_SERVICE_URL` | URL del media-service (Render). Vacío → descargas por Cobalt |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | API de Spotify (fallback; el embed no las necesita) |
| `GEMINI_API_KEY` (+ `GEMINI_MODEL` opc.) | Asistente. Tier gratuito basta (modelos flash-lite) |
| `COBALT_API_URL` / `COBALT_API_KEY` (opc.) | Instancia de Cobalt para `/api/download` |

### Render (media-service)
| Variable | Para qué |
|---|---|
| `ALLOWED_ORIGINS` | CORS (dominio del frontend) |
| `YTDLP_COOKIES` | Ruta al cookies.txt (Secret File) → YouTube. Ver §10 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_BUCKET` | Solo para `/api/store` |
| **No** fijar `PORT` | Render lo inyecta |

---

## 8. Estado por feature (verificado)

| Feature | Estado |
|---|---|
| Descargas YouTube (MP3 real / MP4 por calidad) | ✅ Render + cookies + deno. Verificado |
| Buscar canción por nombre (YouTube) | ✅ |
| Importar de Spotify (vía embed) | ✅ esquiva el 403; resuelve a YouTube al sugerir |
| Sugerir/votar en playlist compartida | ✅ (con cuenta real) |
| Asistente Gemini "Nightie" | ✅ tier gratuito (flash-lite) |
| Descargas TikTok / Instagram | ✅ (sin cookies) |
| Fondo de video toggleable + opacidad por sección | ✅ |
| Disfraces, encuestas, racha, temáticas | ✅ |
| Perfiles + privacidad + avatar + guardar canciones | ✅ |
| Gestor de diseño en vivo | ✅ |
| Subida de imágenes (avatar/flyer/fondos) | ✅ (requiere `phase-g.sql`) |
| Moderación (palabras + comentarios) | ✅ |
| Notificaciones / PWA | ❌ pendiente (ver §12) |
| Multi-evento / multi-género | ⏳ parcial (modelo lo soporta; falta agrupar/branding) |

---

## 9. Seguridad y admin

- **Acceso a `/admin`:** botón "Consola" visible solo en el perfil de staff; `/admin` entra
  directo si el rol real es `admin`/`dj`. Como respaldo hay una **clave maestra** hardcodeada.
- **Clave de acciones destructivas** (`ADMIN_DANGER_KEY` en [admin/page.tsx](../src/app/admin/page.tsx)):
  vaciar playlist, borrar usuario/evento piden esta clave además del confirm.
  **Valor actual: `VcsgDSnLgQcH@`**. Es una **barrera anti-accidentes**; la seguridad real es
  la RLS de Supabase. ⚠️ El repo es público → esta clave es visible en el código; sirve para
  evitar borrados accidentales, no para frenar a un atacante decidido.
- **Login "admin de emergencia"** (en [auth.tsx](../src/lib/auth.tsx)): email/contraseña
  hardcodeados, sin sesión real → la RLS rechaza sus escrituras (sirve para ver la UI, no para
  operar en BD). Deuda técnica: quitarlo/protegerlo para producción seria.

---

## 10. Limitaciones conocidas y decisiones

1. **Spotify API → 403 Forbidden** con client-credentials para muchas playlists (restricción
   de Spotify). **Solución adoptada:** leer los nombres desde la **página de embed pública**
   (sin auth) y resolver cada canción en **YouTube**. Funciona.
2. **YouTube en Render** necesita **cookies** (IP de datacenter). Exportarlas en **incógnito**
   y subirlas como Secret File (`cookies.txt`) + `YTDLP_COOKIES=/etc/secrets/cookies.txt`.
   Caducan → re-exportar. yt-dlp también requiere **deno** (ya en el Docker).
3. **Gemini:** la suscripción "Gemini Pro" (consumer) NO da cuota de API; la **API key del
   tier gratuito basta** usando modelos `*-flash-lite` (los 1.5 ya no existen en 2026).
4. **Spotify Premium NO se puede "compartir"** para que otros escuchen como premium (viola los
   ToS y técnicamente cada usuario necesita su propio Premium). Por eso la reproducción va por
   YouTube.
5. **Render free** duerme (cold-start ~30-60s en el primer request).

---

## 11. Cómo correr / desplegar

```bash
# Frontend
npm install && npm run dev      # http://localhost:3092
npm run build                   # build de prod (TS + eslint)

# media-service (Render: deploy automático desde main vía Dockerfile)
#  - Subir cookies.txt como Secret File + YTDLP_COOKIES=/etc/secrets/cookies.txt
#  - ALLOWED_ORIGINS = https://nightcoreaqp-five.vercel.app
```

Flujo de trabajo: **cada cambio terminado → `git commit` + `git push origin main`** (Vercel y
Render auto-despliegan). El commit + CHANGELOG son el historial de versiones.

Crear admin real:
```sql
update public.profiles set role='admin'
  where id = (select id from auth.users where email='TU_CORREO');
```

---

## 12. Pendiente / futuro

- **PWA + Web Push**: instalable como app + notificaciones (lo más cercano a una app móvil sin
  costo). *No iniciado por decisión del dueño (por ahora).*
- **Multi-evento / multi-género**: agrupar eventos por serie/género, branding por evento,
  selector de comunidad. El modelo de datos ya lo soporta parcialmente.
- **Quitar/endurecer** el login de emergencia y mover la clave destructiva a algo server-side.
- **Feed personalizado** por interés; verificación de asistencia (QR/código).
