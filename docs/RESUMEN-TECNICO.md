# Resumen técnico y estado real — Nightcore AQP

> Documento de **traspaso (handoff)**: mapea el proyecto tal como está **en el código**
> (no lo planeado), para retomar el trabajo sin releer todo. Verificado contra el repo y
> con `npm run build` en verde (TypeScript + 12 rutas) el **2026-06-23**.
>
> Complementa, no reemplaza: [ESTADO.md](./ESTADO.md) (pendientes operativos),
> [ROADMAP.md](./ROADMAP.md) (visión/fases), [DECISIONS.md](./DECISIONS.md),
> [CHANGELOG.md](./CHANGELOG.md), [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. Qué es

Web de un club de **nightcore en Arequipa** (organiza **Yorch**, hecho por *Los Simpatizantes
de JP*; público, sin fines de lucro). Eje: eventos cada 1–2 meses + comunidad activa a diario
(playlist colaborativa, votos, disfraces, encuestas, rachas, temáticas). Estética **scenecore**
(neón magenta/cian/lima). Edición actual: **Nightcore Arequipa 3 / Fest 2.0**.

Stack: **Next.js 16.2.9 (App Router, React 19, Turbopack) + TypeScript + Tailwind v4** en
**Vercel**; **Supabase** (Postgres + Auth + Storage) como backend; **media-service**
(Node/Express + yt-dlp) opcional para descargas. Deploy: `nightcoreaqp-five.vercel.app`.
Repo: `github.com/phaletasss-max/nightcoreaqp`.

---

## 2. Arquitectura (3 piezas + 2 servicios externos)

```
┌────────────────────────┐     ┌─────────────────────────┐
│  Frontend (Vercel)     │────▶│  Supabase                │
│  Next.js 16 · React 19 │◀────│  Postgres · Auth ·       │
│  Tailwind v4           │     │  Storage(bucket "media") │
└───────┬────────────────┘     └─────────────────────────┘
        │ rutas API (server, en Vercel)
        ├─▶ /api/spotify/tracks ──▶ Spotify Web API (Client Credentials)
        ├─▶ /api/download ────────▶ Cobalt (instancia pública)  [fallback descargas]
        │
        └─▶ NEXT_PUBLIC_MEDIA_SERVICE_URL (si está) ──▶ media-service (yt-dlp+ffmpeg)
                                                          Render/Arch/casa, IP residencial
```

**Idea clave**: `yt-dlp` no corre en Vercel (serverless + YouTube bloquea IPs de datacenter),
por eso las descargas tienen **dos caminos**: media-service propio (preferido) o **Cobalt**
como proxy desde `/api/download` (siempre disponible, sin servidor propio).

---

## 3. Modo dual de datos (clave para entender el código)

Toda la app funciona **con o sin Supabase**, decidido en runtime por `isSupabaseConfigured()`
([src/utils/supabase.ts](../src/utils/supabase.ts)):

- **Configurado** (env reales) → `src/lib/data.ts` habla con Postgres vía anon key + RLS.
- **Sin configurar** (placeholders) → fallback a `localStorage` + datos demo
  ([src/lib/demo-data.ts](../src/lib/demo-data.ts)).

Las páginas **nunca** saben en qué modo están: solo llaman a la capa
[src/lib/data.ts](../src/lib/data.ts). Particularidades en código:

- **Canciones** (`getSongs`/`addSong`): **localStorage-first** — escribe local SIEMPRE y usa
  Supabase como backup en la nube (combina ambas fuentes, dedupe por id/url). Diseñado así para
  que una canción nunca "desaparezca" si la RLS rechaza la escritura.
- `saveEvent`: los eventos nuevos traen id de cliente (`e-...`) no-uuid → se insertan **sin id**
  (la BD genera el uuid). Reintenta con columnas base si faltan las extra de `phase-de.sql`.
- `addComment`: reintenta sin `flagged` si la columna no existe (degradación).

---

## 4. Mapa de archivos (`src/`)

### Páginas (`src/app/`)
| Ruta | Archivo | Qué hace |
|---|---|---|
| `/` | [page.tsx](../src/app/page.tsx) (461) | **Eventos = feed**: selector de evento, detalle, RSVP+ticket, muro de comentarios (con moderación), retos diarios, temáticas, feed comunidad, fondos. Es la home. |
| `/playlist` | [playlist/page.tsx](../src/app/playlist/page.tsx) (429) | Sugerir canciones (con validación de link), votar, importar playlist de Spotify, copiar/descargar MP3/MP4. |
| `/disfraces` | [disfraces/page.tsx](../src/app/disfraces/page.tsx) (209) | Subir disfraz (foto + evento + fecha, regla ≤1 semana post-evento), votar, comentar. |
| `/perfil` | [perfil/page.tsx](../src/app/perfil/page.tsx) (746) | Perfil propio: stats, insignias de asistencia, mis disfraces/comentarios, privacidad, vincular Spotify. Gateado: sin sesión pide login. |
| `/perfil/[id]` | [perfil/[id]/page.tsx](../src/app/perfil/[id]/page.tsx) | Perfil **público** de otro usuario (respeta `is_private`). |
| `/perfil/descargas` | [perfil/descargas/page.tsx](../src/app/perfil/descargas/page.tsx) (363) | Descargador directo: pega link (YT/IG/TikTok), elige MP3/MP4, descarga al dispositivo. |
| `/admin` | [admin/page.tsx](../src/app/admin/page.tsx) (852) | **Consola DJ/admin** (solo rol `dj`/`admin`, fuera del nav): CRUD eventos, gestor de diseño, cola de canciones, moderación (palabras + comentarios), usuarios, encuestas. |
| `/encuestas` | [encuestas/page.tsx](../src/app/encuestas/page.tsx) (7) | **Redirige a `/`** (su contenido se movió al feed de Eventos). |
| `/api/download` | [route.ts](../src/app/api/download/route.ts) | Proxy a Cobalt → stream del archivo (descarga in-page sin servidor propio). |
| `/api/spotify/tracks` | [route.ts](../src/app/api/spotify/tracks/route.ts) | Lee tracks de una playlist **pública** de Spotify (Client Credentials, server-side, paginado). |

### Componentes (`src/components/`)
`Navbar` · `Hero` · `AuthModal` (login/registro/reset) · `DailyChallenges` (racha, encuesta del
día, fans del mes) · `ThemesSection` (temáticas + ranking por clicks) · `CommunityFeed` (posts
recientes de disfraces) · `VideoBackground` (fondo de video toggleable: MP4 propios o YouTube
curado) · `ScenecoreBackground` (canvas: estrellas/checker/arcoíris) · `GlobalPlayer` +
`PlayerContext` (reproductor flotante global) · `DesignLoader` + `BgEditor` (aplica/edita el
diseño configurable del admin).

### Lógica (`src/lib/`)
- [data.ts](../src/lib/data.ts) — **capa de datos única** (dual Supabase/localStorage).
- [auth.tsx](../src/lib/auth.tsx) — `AuthProvider`/`useAuth`. Sesión real Supabase o invitado demo.
- [media.ts](../src/lib/media.ts) — cliente del media-service / fallback Cobalt.
- [moderation.ts](../src/lib/moderation.ts) — `hasBannedWord`/`censorText`.
- [types.ts](../src/lib/types.ts) · [demo-data.ts](../src/lib/demo-data.ts) · [logger.ts](../src/lib/logger.ts).

---

## 5. Base de datos (Supabase)

**3 scripts SQL** (en `supabase/`), correr en orden en el SQL Editor:

| Script | Qué crea | Estado |
|---|---|---|
| [schema.sql](../supabase/schema.sql) | ~15 tablas, ENUMs, triggers (recálculo de votos, racha `daily_check_in`, auto-perfil), **RLS completas**, tabla `themes` + RPC `click_theme`, `songs.file_url`. | base |
| [fixes.sql](../supabase/fixes.sql) | Políticas del bucket `media`, cierre de `site_settings`, admin real. | ✅ corrido (según sesión) |
| [phase-de.sql](../supabase/phase-de.sql) | Columnas extra de `events` (flyer, temáticas, djs jsonb, maps, tiktoks), `profiles.is_private`, tabla `banned_words`, `event_comments.flagged` + políticas staff. | ⏳ **PENDIENTE de correr** |

Seeds: `seed.sql` (demo) / `seed-clean.sql` (limpia y carga el evento real Fest 2.0 sin tocar
usuarios). Tablas principales: `profiles`, `events`, `event_attendees`, `songs`, `song_votes`,
`event_comments`, `costumes`, `costume_votes`, `costume_comments`, `surveys`, `survey_options`,
`survey_responses`, `themes`, `site_settings`, `banned_words`.

> **Sin `phase-de.sql`**: la app **degrada, no rompe** (reintentos en `data.ts`), pero
> moderación, perfiles privados y campos extra de eventos no funcionan, y verás `404` de
> `banned_words` en consola.

---

## 6. Variables de entorno

**Vercel (frontend):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (BD/auth) ·
`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` (ya puestos) · `NEXT_PUBLIC_MEDIA_SERVICE_URL`
(media-service propio; vacío → usa Cobalt) · `COBALT_API_URL` / `COBALT_API_KEY` (opcional, por
defecto una instancia pública). Plantilla: [.env.local.example](../.env.local.example).

**media-service (servidor):** `ALLOWED_ORIGINS` (CORS) · `YTDLP_COOKIES` (ruta a cookies.txt
para YouTube) · `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_BUCKET` (solo `/api/store`).
**No** fijar `PORT` (Render lo inyecta). Blueprint listo: [render.yaml](../render.yaml).

---

## 7. Estado por feature (verificado en código)

| Feature | Estado | Nota |
|---|---|---|
| Eventos (CRUD + RSVP + ticket) | ✅ | Admin crea/edita; campos extra requieren `phase-de.sql`. |
| Comentarios + moderación por palabras | ✅ código | Requiere `phase-de.sql` para `flagged`/`banned_words`. |
| Playlist: sugerir + votar | ✅ | Votos arreglados (columna `vote`, `onConflict`). |
| Importar playlist Spotify | ✅ prod | Solo playlists **públicas de usuario**; las **editoriales** dan 404/502 (límite de la API). |
| Descargas MP3/MP4 (in-page) | 🟡 funciona vía **Cobalt** | YouTube falla seguido (Cobalt/IP datacenter); IG/TikTok OK. Camino fiable = media-service propio. |
| media-service propio | ⏳ no desplegado/conectado | Código + Dockerfile + render.yaml listos. Falta `NEXT_PUBLIC_MEDIA_SERVICE_URL`. |
| Fondo de video toggleable | ✅ | MP4 propios (Storage) o YouTube curado. |
| Disfraces (evento+fecha, votos) | ✅ | |
| Encuestas / racha / fans del mes | ✅ | En el feed de Eventos (`DailyChallenges`). |
| Temáticas comunidad (ranking) | ✅ | `themes` + RPC `click_theme`. |
| Perfiles públicos + privacidad | ✅ código | Requiere `phase-de.sql`. |
| Gestor de diseño en vivo (`/admin`) | ✅ | Persiste en `site_settings`. |
| Auth email + confirmación | ✅ | Anti-multicuenta fase 1. WhatsApp/SMS OTP diferido. |
| PWA / push / notificaciones | ❌ | Ícono de campana en nav, sin backend de push aún. |
| Feed personalizado por interés | ❌ | Hoy es cronológico (disfraces recientes). |
| Verificación de asistencia (QR/código) | ❌ | Sin decidir. |
| Convertidor de archivos | ⏸️ aparcado | `convertidor/` (proyecto aparte, gitignored, MIT). |

---

## 8. ⚠️ Riesgos y deudas técnicas (revisar)

1. **Login "admin de emergencia" hardcodeado** en [auth.tsx:170](../src/lib/auth.tsx#L170):
   email `admin@nightcore.aqp` / password en texto plano y una lista `ADMIN_EMAILS` que da rol
   admin por correo. **No** tiene sesión real → la RLS rechaza sus escrituras (sirve para ver la
   UI, no para operar en BD). Es un bypass para no quedar bloqueado; **debe quitarse o protegerse
   antes de producción seria** (cualquiera que lea el bundle ve la contraseña).
2. **`signUp` con "éxito silencioso"** ante error 500 del trigger: crea un perfil **local**
   (`local-...`) que no existe en la BD. Útil para no bloquear al usuario, pero genera perfiles
   fantasma que la RLS rechazará después. Revisar el trigger de creación de perfil.
3. **Posible loop de render en `/perfil`** al vincular Spotify (spam de `scheduleCallback`/
   postMessage). Causa probable: el listener de `GlobalPlayer` usa `playNext` sin `useCallback`
   → el `useEffect` se re-suscribe en cada render. **Fix recomendado**: memorizar las funciones
   de `PlayerContext` con `useCallback`/`useMemo`. *(Pendiente de confirmar/arreglar.)*
4. **Descargas de YouTube poco fiables** sin media-service propio (Cobalt + IP de datacenter).
   IG/TikTok sí funcionan. Camino fiable: media-service en IP residencial + cookies.
5. **Render free duerme** (cold-start ~30s al primer request) — afecta al media-service si se
   despliega ahí.
6. **Check "Lint" de Vercel** puede salir en rojo aunque el deploy quede "Ready" (no bloqueante;
   el build local pasa lint).

---

## 9. Cómo correr

```bash
# Frontend
npm install
npm run dev      # http://localhost:3092
npm run build    # build de prod (TS + eslint) — ✅ en verde 2026-06-23

# media-service (en casa/servidor con IP residencial)
cd media-service && npm install
cp .env.example .env   # editar ALLOWED_ORIGINS
node --env-file=.env server.js
curl http://localhost:8787/health
# Exponer por HTTPS: cloudflared tunnel --url http://localhost:8787
# Luego en Vercel: NEXT_PUBLIC_MEDIA_SERVICE_URL = esa URL → Redeploy
```

Crear admin **real** (no el de emergencia):
```sql
update public.profiles set role='admin'
  where id = (select id from auth.users where email='TU_CORREO');
```

---

## 10. ❓ Dudas / decisiones para terminar la implementación

Lo que necesito confirmar contigo para cerrar lo pendiente:

1. **media-service — ¿dónde corre?** ¿En tu PC/casa con Cloudflare Tunnel (YouTube fiable,
   pero la PC tiene que estar encendida) o en Render free (siempre arriba pero duerme y YouTube
   falla sin cookies)? De esto depende si conectamos `NEXT_PUBLIC_MEDIA_SERVICE_URL` o nos
   quedamos solo con Cobalt para IG/TikTok.
2. **¿Corro/correrás `phase-de.sql`?** Es lo único que bloquea moderación, perfiles privados y
   campos extra de eventos. ¿Lo aplicas tú en el SQL Editor o preparo instrucciones exactas?
3. **Login de emergencia hardcodeado**: ¿lo quito ya (recomendado) o lo dejamos hasta tener un
   admin real configurado? Hoy expone una contraseña en el código del cliente.
4. **Alcance legal de descargas**: ¿descarga pública abierta de cualquier link, o la limitamos a
   "respaldo/comprobante para el set del DJ" como dice el ROADMAP? Cambia qué botones mostramos.
5. **Notificaciones/PWA**: ¿entra en el alcance ahora (push real + instalable) o lo dejamos para
   después? Hoy solo está el ícono de campana, sin backend.
6. **Verificación de asistencia** a eventos (insignias): ¿QR en puerta, código del staff, o lo
   dejamos manual por ahora?
7. **Tagline definitivo** y enlaces sociales reales (hoy el footer apunta a youtube.com/
   spotify.com/instagram.com genéricos).
8. **Feed personalizado por interés**: ¿lo implementamos (tabla `feed_items`/`feed_seen`) o el
   feed cronológico actual es suficiente para esta edición?
