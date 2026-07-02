# Estado Maestro — Nightcore AQP

> Mapa único del proyecto: visión, branding, arquitectura, APIs, features, deploy, pruebas,
> seguridad y marketing — cada cosa con su **estado real en código**.
> Es el documento "padre"; los de `docs/` y `docs/pt/` son el detalle.

**Última actualización:** 2026-07-02
**Edición vigente:** Nightcore Arequipa 3 · **Organiza:** Yorch · **Hecho por:** Los Simpatizantes de JP
**Producción:** https://nightcoreaqp-five.vercel.app (Vercel) · Media-service en Render (`nightcore-media`)

---

## Leyenda de estados

| Símbolo | Significado |
|---|---|
| ✅ | **Implementado y funcionando** en producción |
| 🔒 | **Cerrado** — terminado, verificado y documentado. No tocar sin abrir tarea |
| 🟡 | **En proceso / parcial** — existe pero depende de algo (migración, env, decisión) |
| 🐞 | **Roto** — implementado pero con bug activo en producción |
| ⛔ | **Pendiente** — no empezado |
| ⏸️ | **Aparcado** — decidido posponer |

> **Regla de cierre:** algo pasa a 🔒 solo cuando (1) funciona en prod, (2) tiene prueba o
> verificación manual registrada, y (3) está documentado aquí + en `CHANGELOG.md`. Lo 🔒 no se
> modifica "de pasada": se abre una entrada en `ROADMAP.md` antes de tocarlo.

---

## ⭐ PARA LA SIGUIENTE IA — empieza aquí (handoff 2026-06-26)

> Si retomas este proyecto, **lee primero** [AGENTS.md](../AGENTS.md) + [GUIA-IA.md](./GUIA-IA.md)
> (reglas para no romper: capa de datos dual, RLS, Tailwind v4, no secretos). Luego esto.

**Cómo trabajamos aquí:** todo va en **partes de trabajo (PT) por fases**. Cada fase se deja
documentada con su estado y un **punto de continuidad** para que el siguiente continúe sin contexto.
Al terminar algo: verificar (`tsc`/`build`), documentar (este doc + `CHANGELOG.md`) y commit+push a `main`.

**📋 Plan exhaustivo hasta el 100%:** [PLAN-COMPLETO.md](./PLAN-COMPLETO.md) — TODAS las PT que faltan
para terminar el proyecto entero (web, móvil, escritorio, backend, infra, QA, branding, pulido).

**Estado de las 3 áreas de trabajo activas (2026-06-26):**

| Área | Hecho | Dónde continuar |
|---|---|---|
| **§14 Perfil hi5** (web) | Fases A+B ✅ completadas (CSS scoped en `src/app/perfil/[id]/perfil.module.css` + guestbook/reactions) | ¡Completado! Integrado con realtime de Supabase y local fallback. |
| **§15 Panel DJ + roles** (web) | Fase A (`/dj`) + Fase B (UX roles admin) ✅ desplegadas | Fase C (vincular DJ↔perfil) ⏸️ aparcada. Ver §15. |
| **§16 App móvil** (Expo) | Fases 0+1+2+3 ✅ (10 pantallas, `tsc`+`expo export` OK, **sin probar en dispositivo**) | ¡Fase 3 Completada! DJ móvil, subir foto cosplay, encuestas, racha y historial integrados. |

**Migraciones de Supabase:** las 10 de features están ✅ corridas (2026-06-26, ver §6). Solo faltaría
`site_settings_setup.sql` si el gestor de diseño no persiste.

**Acciones que solo puede hacer el dueño (no la IA):** hacer el repo público (auto-update desktop),
probar el móvil en Expo Go, correr SQL en Supabase, decisiones de producto (Play Store vs APK, push).

**Reglas de oro que NO se rompen:** (1) descargas siempre locales (`.bat`/Electron, nunca server-side);
(2) seguridad = RLS, no el cliente; (3) capa de datos dual `if(cfg())` en `src/lib/data.ts`;
(4) el móvil NO importa de `src/`; (5) push a `main` = deploy a producción → no commitees secretos.

---

## 0. Plan de trabajo consolidado (2026-06-26)

> Resumen ejecutivo: lo verificado vs lo pendiente. Detalle en las secciones siguientes.
> (Para IA que retoma el proyecto, ver también [GUIA-IA.md](./GUIA-IA.md).)

### ✅ Hecho y COMPROBADO (probado funcionando esta sesión)
- **App de escritorio (Electron, v0.1.7)** — descarga **YouTube e Instagram en MP4** (deno resuelve
  el reto `nsig`), **TikTok en H.264** (sin `0xc00d5212`), y MP3. Auto-instala yt-dlp/ffmpeg/deno.
  Instalador NSIS publicado en GitHub Releases, auto-update con log, cookies (navegador + archivo
  `.txt`), personalización (temas + imagen de fondo). *Verificado en vivo con los logs del usuario.*
- **Descarga masiva en la web** (`.bat` estilo DJ con URLs reales; el `.bat` se autoelimina al cerrar).
- **Temas/personalización del sitio** (presets pixel/scenecore/gótico/anime + acento; cobertura de
  color auditada con `color-mix`; fix de blur). Verificado en preview + build de producción.
- **Seguridad S1/S2** — credenciales hardcodeadas eliminadas (el repo ya es seguro para hacerlo público).
- **Bugs cerrados**: panel admin 401 (B1 → sesión real), service worker `/disfraces` (B3), CI
  typecheck (script añadido), blur de tarjetas, fondo de los temas del desktop (B4).
- **Web base en producción**: eventos/RSVP, playlist+votos+Spotify, disfraces, encuestas, temáticas,
  retos/racha, perfiles, asistente IA, PWA, historial.
- **Parte social nueva (2026-06-25)**: **chat de comunidad en vivo** (`/chat`, Supabase Realtime
  + filtro de groserías + moderación staff), **perfiles con galería de fotos + bio + links**, y
  **color de acento por perfil**. Código verificado (tsc/build verdes, chat probado en preview);
  **migraciones corridas el 2026-06-26** (`phase-chat.sql` + `phase-profile-extras.sql`) → activas en prod.
- **Limpieza y responsive (2026-06-26)**:
  - **S5 cerrado** — `console.log('[FASE 3]…')` eliminados de `src/lib/data.ts` (5 líneas).
  - **Bug "Votar" cerrado** — `LiveFeed.tsx`: la encuesta ahora vota inline (opciones + barras de %)
    en lugar de redirigir a `/encuestas` → `/`. Usa `voteSurvey` de `data.ts`.
  - **Admin tabs responsive** — `src/app/admin/page.tsx`: tabs pasan de `flex-wrap` (se apilaban
    en móvil) a `overflow-x-auto scrollbar-hide flex-nowrap` → scroll horizontal en móvil, fila
    única en desktop. Header ahora es `flex-col sm:flex-row`.
  - **Playlist song card** — `src/app/playlist/page.tsx`: botón "Copiar" oculto en móvil
    (`hidden sm:flex`) para dar espacio a los botones esenciales (Play, Guardar, YouTube).
  - **`.scrollbar-hide` global** — añadido a `globals.css` (se usaba en tags de playlist pero
    no estaba definido; ahora disponible en todo el sitio).
  - Verificado en preview: home, playlist, admin (móvil+desktop), chat, disfraces, sugerencias.
    TypeScript limpio (`npx tsc --noEmit` sin errores). Sin errores de consola.
- **Panel DJ + gestión de roles (2026-06-26)** — ver §15:
  - **Ruta `/dj`** nueva: setlist más votado, marcar tocada, descarga `.bat` del set (MP3/MP4),
    lista de confirmados. Guard por rol `dj`/`admin` (mismo criterio que `/admin`).
  - **Navbar**: enlace "DJ" visible solo para staff.
  - **Admin → Usuarios**: dropdown de rol con spinner + confirmación al promover a admin.
  - Verificado en preview + `tsc` limpio.

### 🟡 En proceso (falta un paso, casi nada de código)
- **Repo → público** (Settings → Danger Zone → Make public): destraba el **auto-update** del desktop
  (hoy da 404 anónimo) y la descarga pública del `.exe`. **Es el paso #1.**
- **Promover tu cuenta a `role=admin`** (SQL): para que el gestor de diseño **persista** en prod.
- ~~**Correr migraciones de Supabase**~~ → ✅ **hechas el 2026-06-26** (10 scripts; ver §6). Solo faltaría `site_settings_setup.sql` (no estaba en los 4 grupos) si el gestor de diseño no persiste.
- **media-service (Render)**: se duerme; YouTube le exige cookies. Plan Arch (IP residencial) sin implementar.

### ⛔ Pendiente (no empezado)
- **APK móvil** → §16: **Fases 0, 1 y 2 hechas ✅** (Expo Router + 6 pantallas: Home/Playlist/Perfil + Disfraces/Chat/Mi actividad; auth, RSVP, votos, chat Realtime; `tsc` y `expo export` OK, **sin probar en dispositivo**). Siguiente: **Fase 3 (PT 3.x)** (subir foto, DJ móvil, encuestas) + probar en Expo Go (`phase-chat.sql` ya corrida, el chat móvil debería funcionar). Decisiones abiertas: Play Store vs APK, push.
- **Perfil hi5 / estética Web 2.0** → Fases A y B ✅ completadas. Incluye diseño retro, galería, reproductor Winamp, Fives (reacciones) y Guestbook en tiempo real con Supabase + local fallback.
- ~~**Panel DJ + gestión de roles**~~ → ✅ **hecho 2026-06-26** (ruta `/dj` + UX de roles en admin). Ver §15.
- **Branding**: tagline definitivo + `docs/BRANDING.md`; SEO/OG images.
- **Feed personalizado por interés**; **verificación de cuenta** (email/WhatsApp).
- **Firma de código del `.exe`** (quitar el aviso de SmartScreen) + icono propio.
- **Limpieza**: docs desincronizados (`ESTADO.md`, `ARCHITECTURE.md`). *(S5 console.logs y bug "Votar" del feed — ✅ cerrados el 2026-06-26)*

---

## 1. Visión (01)

Plataforma web/comunidad sin fines de lucro para las fiestas de **nightcore + scenecore** en
Arequipa. No es solo una landing de evento: es un **hub social gamificado** — los asistentes
reservan, sugieren música, suben cosplay, votan, mantienen rachas y construyen perfil.

**Pilares:**
1. **Evento** — feed del próximo evento, RSVP, countdown, comprobante de asistencia.
2. **Música de la comunidad** — playlist colaborativa que alimenta el setlist del DJ.
3. **Identidad scene** — cosplay, temáticas, estética pixel/neón personalizable.
4. **Gratis y abierto** — código y dominios públicos; coste operativo ≈ 0 (tiers gratuitos).

Detalle: [ROADMAP.md](./ROADMAP.md) · [docs/pt/pt-02-objetivos-y-vision.md](./pt/pt-02-objetivos-y-vision.md)

---

## 2. Branding · estado

| Elemento | Estado | Nota |
|---|---|---|
| Nombre / edición ("Nightcore Arequipa 3") | ✅ | |
| Estética pixel + neón (magenta/lime/cyan) scenecore | ✅ | Tokens en `globals.css`; fuentes pixel/rounded vía `DesignLoader` |
| Crédito "Organiza Yorch / Los Simpatizantes de JP" | ✅ | En el asistente y docs |
| Tagline definitivo | ⛔ | Se quitó "Música acelerada, eventos reales"; falta elegir el nuevo |
| Guía de marca (paleta, logos, uso) | ⛔ | No existe documento; recomendado crear `docs/BRANDING.md` |
| Presets de tema (7: scenecore / pixel / gótico / anime / y2k / vaporwave / cyber) | ✅ | + acento, **fuente de títulos y de texto**, **colores a medida**, **tamaño** y **reset**. Admin → Diseño (ampliado 2026-06-25) |

---

## 3. Arquitectura · estado ✅

Tres piezas desacopladas (detalle en [ARCHITECTURE.md](./ARCHITECTURE.md)):

```
Frontend (Vercel)        Supabase (gratis)         Descargas
Next.js 16 + React 19 ─▶ Postgres · Auth ·    +   .bat local (yt-dlp en la PC del user)
Tailwind v4              Storage · RLS            media-service (Render) = respaldo/búsqueda
```

- **Capa de datos dual** — `src/lib/data.ts`: Supabase si hay credenciales, si no `localStorage` + demo. 🔒
- **Auth** — `src/lib/auth.tsx`: sesión real Supabase o invitado demo. 🟡 (ver bug de admin, §10)
- **Diseño en vivo** — `DesignLoader` + `site_settings` + evento `nq-design-updated`. 🐞 (no persiste en prod)
- **Descargas locales** — `src/lib/crate.ts` genera `.bat` que descarga en la IP del usuario. 🔒

---

## 4. APIs e integraciones · estado

| Ruta / servicio | Estado | Detalle |
|---|---|---|
| `GET /api/spotify/tracks` | ✅ | Client Credentials. **No** sirve playlists editoriales de Spotify (502/404) |
| `GET /api/youtube/search` | ✅ | YouTube Data API (no la bloquea YouTube). 501 si falta key → fallback a media-service |
| `POST /api/assistant` | ✅ | Gemini ("Nightie"). Cascada de modelos free. Requiere `GEMINI_API_KEY` |
| `POST /api/generate-image` | 🟡 | Genera fondos con IA (cascada `gemini-2.5-flash-image`→`imagen-3`). Gateada a staff. **Requiere key con acceso a imágenes (de pago)**; degrada con mensaje si no. UI en `BgEditor` (2026-06-25) |
| `GET /api/health` · `/api/health/dependencies` | ✅ | Health checks |
| `GET /api/cron/cleanup` | 🟡 | Existe; verificar que esté agendado |
| media-service `/api/search` `/api/store` `/health` | 🟡 | Render free se duerme (~30s cold start); YouTube necesita cookies |
| Supabase REST (vía supabase-js) | ✅ | anon key + RLS |

> **Nota:** `docs/ESTADO.md` menciona `/api/download` — **ya no existe** (las descargas pasaron al
> `.bat` local). Doc desincronizado, corregir.

---

## 5. Funcionalidades · matriz de estado

| Feature | Estado | Depende de |
|---|---|---|
| Feed de eventos + selector + detalle | ✅ | |
| RSVP (reserva / interés) + código | ✅ | |
| Countdown / Hero | ✅ | |
| Comprobante de asistencia (insignias) | 🟡🐞 | **Falta correr `phase-1-attendance.sql`** → hoy da 404 |
| Playlist: sugerir + votar + Top-N | ✅ | |
| Importar de Spotify | ✅ | playlists de usuario (no editoriales) |
| Playlist personal (guardar canciones) | 🟡 | verificar `saved-songs.sql` corrido |
| Descargas MP3/MP4 (.bat local) — DJ | 🔒 | |
| Descarga masiva para usuarios (estilo DJ) | ✅ | Playlist: barra "Descargar a tu PC" (MP3/MP4) + botón por canción → `.bat` con URLs reales. Reemplaza la descarga por unidad confusa (2026-06-25) |
| Búsqueda de respaldo (media-service) | 🟡 | Render + cookies YouTube |
| Disfraces (cosplay) + votos + comentarios | 🔒 | Sube fotos a Supabase Storage, selector muestra todos los eventos, y comentarios persistidos en BD |
| Encuestas | ✅ | |
| Temáticas sugeridas (ranking por clicks) | ✅ | |
| Retos diarios / racha | ✅ | |
| Perfil + actividad | ✅ | |
| **Chat de comunidad en vivo** (`/chat`) | ✅ (migración corrida 2026-06-26) | Supabase Realtime; login para escribir; filtro `banned_words`; reportar + ocultar/eliminar staff. `phase-chat.sql` ✅ |
| **Buzón de sugerencias/denuncias** (`/sugerencias`) | ✅ (migración corrida 2026-06-26) | Formulario 100% anónimo (sin login). Dos categorías: sugerencia/denuncia. Solo el staff lee en Admin → Buzón. `phase-sugerencias.sql` ✅ |
| **Perfil: galería de fotos + bio + links** | ✅ (migración corrida 2026-06-26) | `profile_photos` + bio + TikTok/IG; galería gated por privacidad. `phase-profile-extras.sql` ✅ |
| **Perfil: color de acento (personalización)** | ✅ **nuevo** (2026-06-25) | `profiles.accent` aplicado con `color-mix` en perfil propio + público |
| Perfil privado (toggle) | ✅ (corrida 2026-06-26) | `phase-de.sql` ✅ (`is_private`) |
| Moderación por palabras | ✅ (corrida 2026-06-26) | `phase-de.sql` ✅ (`banned_words`, `flagged`) |
| Gestor de diseño en vivo (admin) | 🟡 | Código arreglado (§10 B1); falta promover tu cuenta a `role=admin` para que persista |
| Asistente IA (Gemini) | ✅ | `GEMINI_API_KEY` |
| PWA instalable + offline básico | ✅ | SW arreglado hoy (fallback) |
| App móvil (Expo) | 🟡 (Fases 0/1/2 en código) | 6 pantallas con Expo Router (Home/Playlist/Perfil/Disfraces/Chat/Mi actividad); `tsc` + `expo export` OK. **Falta probar en Expo Go** + decidir Play Store vs APK. Ver §16 |
| App de escritorio · descargas (Electron) | ✅ **comprobado** | `desktop-app/` **v0.1.7**: auto-instala yt-dlp/ffmpeg/**deno** + auto-update de yt-dlp; baja **YouTube/IG MP4** (deno→nsig) y **TikTok H.264**; cookies (navegador + **archivo `.txt`**); temas + imagen de fondo; auto-update (electron-updater, visible + log); instalador NSIS; releases auto-publicadas (GitHub Actions). Falta: repo público (para auto-update), icono propio, firma de código |
| Convertidor de archivos | ⏸️ | Fuera del repo |
| Verificación de cuenta (email/WhatsApp) | ⛔ | Investigado en ROADMAP §8 |
| Feed personalizado por interés | ⛔ | `feed_items` / `feed_seen` no creadas |
| Fondo de video con scroll + reproductor global | 🟡 | `VideoBackground`/`GlobalPlayer` existen; revisar loop de render (§10) |
| **Personalización: añadir contenedores / editar CSS** | ⛔ | Propuesta nueva — ver §11 |

---

## 6. Base de datos · migraciones en Supabase

**Estado 2026-06-26: las 10 migraciones de features están ✅ corridas.** Solo quedaría
`site_settings_setup.sql` (no estaba en los 4 grupos) si el gestor de diseño no persiste.
Todas son idempotentes; correr en el **SQL Editor**.

| Script | Crea / cambia | Estado |
|---|---|---|
| `supabase/schema.sql` | 19 tablas + triggers + RLS + `is_staff()` / `daily_check_in()` / RPCs | ✅ corrido |
| `site_settings_setup.sql` (raíz del repo) | tabla `site_settings (key, value)` | ⚠️ **ÚNICA QUE FALTARÍA** — no estaba en los 4 grupos del 2026-06-26. Sin ella el gestor de diseño (Admin → Diseño) cae a localStorage y no persiste en prod. Correr si el diseño no se guarda |
| `supabase/fixes.sql` | bucket `media` + cierra la RLS de `site_settings` a staff | ✅ corrido (depende de la tabla anterior) |
| `supabase/fix-tags.sql` | `songs.tags`, `costumes.tags` + `is_wip` | ✅ **corrido (2026-06-26)** |
| `supabase/phase-de.sql` | columnas extra de `events`, `profiles.is_private`, `banned_words`, `event_comments.flagged` | ✅ **corrido (2026-06-26)** (eventos completos, privacidad, moderación) |
| `supabase/phase-1-attendance.sql` | `attendance_proofs` + RPCs aprobar/rechazar | ✅ **corrido (2026-06-26)** (insignias; cierra el 404) |
| `supabase/phase-f.sql` | `profiles.email` + `bg_url`; redefine `handle_new_user` | ✅ **corrido (2026-06-26)** (panel muestra correos; fondo de perfil) |
| `supabase/phase-g.sql` | recrea bucket `media` **público (anon)** | ✅ **corrido (2026-06-26)** (subir avatar/flyer/fondos) |
| `supabase/saved-songs.sql` | `saved_songs` (playlist personal) | ✅ absorbida en `schema.sql` (+ corrida 2026-06-26) |
| `supabase/phase-chat.sql` | `chat_rooms`, `chat_messages`, `chat_reports` + RLS + Realtime | ✅ **corrido (2026-06-26)** (activa chat `/chat` web **y móvil**) |
| `supabase/phase-profile-extras.sql` | `profiles.bio/tiktok_url/instagram_url/accent/bg_url` + `profile_photos` + RLS | ✅ **corrido (2026-06-26)** (galería, bio, links, acento — base del perfil hi5) |
| `supabase/phase-sugerencias.sql` | tabla `suggestions` + RLS (insert anon, read/update/delete staff) | ✅ **corrido (2026-06-26)** (buzón persiste en BD) |
| `supabase/phase-bloques.sql` | tabla `custom_blocks` + RLS (público lee visibles, staff gestiona todo) | ✅ **corrido (2026-06-26)** (cierra el 404 de `custom_blocks`; bloques del admin en BD) |
| `supabase/phase-security-hardening.sql` | corrige search_path mutable, revoca ejecución a anon de triggers definer, RPC add_points | ✅ **corrido (2026-07-02)** (resuelve linter warnings de Supabase y Bug de puntos) |

> **Hallazgo de auditoría:** `scripts/verify-schema.ts` valida `events.is_visible` y columnas
> `setting_key/setting_value` que **no existen** (la tabla usa `key/value`); ninguna migración crea
> `events.is_visible`. Ajustar el verificador (o añadir la columna) para que `deploy:check` no falle.

---

## 7. Deploy · estado ✅

| Pieza | Dónde | Estado |
|---|---|---|
| Frontend | Vercel (`nightcoreaqp-five`) | ✅ auto-deploy desde `main` |
| Base de datos | Supabase (free) | ✅ |
| Media-service | Render (`nightcore-media`, Docker, free) | 🟡 se duerme; cookies YouTube |
| Blueprint Render | `render.yaml` | ✅ |
| Variables de entorno | Vercel + Render | ✅ documentadas en `ESTADO.md §4` |

---

## 8. Pruebas y CI/CD · estado

| Pieza | Estado | Nota |
|---|---|---|
| Pipeline "Zero Trust" (`pipeline.ts` + `ci-policy.ts` + `deploy-check.sh`) | 🟡 | Bien diseñado (integrity score, hashing), pero **ningún workflow lo invoca** (solo a mano con `npm run deploy:check`) y exige servicios vivos (media-service/Supabase) + secretos |
| E2E Playwright (`e2e/smoke.spec.ts`) | ✅ | |
| GitHub Actions (`.github/workflows/ci.yml`) | ✅ | Script `typecheck` **ya añadido** (2026-06-25), así el `npm run typecheck` del CI sí corre. Sigue siendo verificación superficial (typecheck+lint+build), no el Zero Trust |
| `.github/workflows/desktop-release.yml` | ✅ | Compila y publica el `.exe` (runner Windows + GITHUB_TOKEN) |
| Scripts de verificación (`scripts/verify-*`) | ✅ | env, rutas, schema, media-service, etc. (algunos asumen columnas inexistentes, ver §6) |

---

## 9. Auditoría / seguridad · hallazgos

| # | Hallazgo | Severidad | Acción |
|---|---|---|---|
| S1 | ~~Login admin hardcodeado + password en el bundle~~ | ✅ Resuelto | Panel usa sesión real (B1); credenciales hardcodeadas eliminadas; clave destructiva → "ELIMINAR" (2026-06-25) |
| S2 | ~~Admin de emergencia + allowlist de correos~~ | ✅ Resuelto | Bypass de emergencia y `ADMIN_EMAILS` eliminados; `isStaff` = rol real en BD (2026-06-25) |
| S3 | Toda la seguridad real recae en **RLS**; el cliente usa anon key | 🟢 Info | Correcto, pero auditar que cada tabla tenga RLS cerrada (la mayoría usa `is_staff()`) |
| S4 | Demo: rol por defecto `admin` (`auth.tsx`) | 🟢 Info | Solo aplica sin Supabase configurado |
| S6 | ~~Escalamiento de privilegios en `profiles` (hackeo de roles y puntos)~~ | ✅ Resuelto | Añadida la restricción RLS `profiles_update_own_or_admin` y el trigger `check_profile_update` para bloquear la modificación directa de columnas administrativas por parte del usuario. (2026-06-26) |
| S7 | Linter warnings de Supabase (search_path, exec por anon) | ✅ Resuelto | Creada y ejecutada la migración `phase-security-hardening.sql` que añade `set search_path` y revoca permisos a anon. (2026-07-02) |
| S8 | Pérdida de puntos por RLS/trigger en update directo | ✅ Resuelto | Implementado el RPC `add_points()` y modificada la llamada en `auth.tsx` para persistencia robusta. (2026-07-02) |

---

## 10. 🐞 Bugs activos (reporte 2026-06-25)

### B1 — `POST /site_settings 401` en bucle (panel de ajustes) — ✅ arreglado en código
- **Causa raíz:** el login de `/admin` era **hardcodeado** (no creaba sesión real de Supabase).
  `auth.uid()` nulo → `is_staff()` = false → la política `site_settings_write_staff` (de
  `fixes.sql`) **rechazaba cada escritura con 401**.
- **Por qué "en bucle":** arrastrar un slider dispara `updateSiteSetting` en cada paso → muchos
  POST, todos 401. Los cambios se veían en vivo (estado optimista) pero **no se guardaban**.
- **Arreglo aplicado (2026-06-25):** `src/app/admin/page.tsx` ahora exige **sesión real de
  Supabase** con rol staff. Estados: *verificando → login real → sin permisos → panel*. Se
  eliminó el form maestro hardcodeado. En modo demo (sin Supabase) entra como staff y persiste
  en localStorage.
- **Acción del usuario (1 vez):** registrarse en la app con tu correo y promover la cuenta:
  `update profiles set role='admin' where email='TU_CORREO';` Después, entrar a `/admin` con
  ese correo → los ajustes ya **persisten**.
- **Pendiente relacionado:** el bypass de emergencia sigue en `auth.tsx` (no concede acceso al
  panel porque no crea sesión real); quitarlo es parte de S1.

### B2 — `attendance_proofs 404`
- **Causa:** la tabla no existe. **Correr `supabase/phase-1-attendance.sql`.**

### B3 — SW: `Failed to convert value to 'Response'` en `/disfraces`
- **Causa:** el fallback del service worker podía resolver a `undefined`.
- **Estado:** ✅ **Arreglado** (`public/sw.js` v2: fallback garantizado + bump de caché).

### B4 — Temas del desktop no cambiaban el color de fondo — ✅ arreglado
- **Causa:** los presets `html[data-theme]` definían `--background`, pero el `body` pinta con
  `var(--bg)` (que nunca se redefinía) → cambiaban superficies/texto/acentos pero **no** el fondo
  de página. **Fix (v0.1.7):** los presets ahora setean `--bg`. (Hallazgo de la auditoría.)

### B5 — TikTok MP4 daba `0xc00d5212` (HEVC) — ✅ arreglado
- **Causa:** TikTok venía en HEVC y `--recode-video` no re-encoda un HEVC ya en contenedor mp4.
- **Fix (v0.1.6):** se selecciona explícitamente un formato H.264 (`vcodec` sin `hev`/`hvc`).

### B6 — React #418 Hydration Mismatch en `/disfraces` — ✅ arreglado
- **Causa:** Expresión JSX vacía `{ }` que rompía el DOM al hidratar en el navegador.
- **Fix:** Eliminada la expresión y añadido control de fallback para imágenes con blob URLs.


---

## 11. Personalización avanzada (respuesta a "¿añadir contenedores / editar CSS / más temas?")

Hoy el admin puede: cambiar fondo/opacidad por sección, fuente, radio, blur, overlay, y
mostrar/ocultar secciones **fijas**. Lo que pides es subir un nivel. Propuesta por capas:

| Nivel | Qué da | Estado |
|---|---|---|
| **A. Más tokens** | Acento, opacidad, radio, blur, overlay + **fuente de títulos Y de texto**, **colores a medida** (fondo/superficie/texto), **tamaño de letra** y **reset** como variables en `site_settings` | ✅ Hecho (ampliado 2026-06-25: la fuente del cuerpo, colores granulares, escala y reset) |
| **B. Presets de tema** | Dropdown *Scenecore · Pixel · Gótico · Anime · **Y2K · Vaporwave · Cyber*** (7) — cada uno setea toda la paleta vía `html[data-theme]` | ✅ Hecho (3 packs nuevos 2026-06-25) |
| **C. Bloques/contenedores** | Tabla `custom_blocks` (tipo, título, contenido, orden, sección) + render dinámico → el admin añade/ordena contenedores sin tocar código | ✅ Hecho (2026-06-25) — Admin → Bloques: 5 tipos (anuncio/texto/enlace/imagen/video), orden ↑↓, toggle visible, editar inline. `phase-bloques.sql` ✅ corrida 2026-06-26 |
| **D. CSS libre** | Inyectar CSS crudo | ❌ Descartado (footgun + XSS) |

**Implementado (2026-06-25):** presets en `globals.css` (`html[data-theme="..."]`),
aplicados por `DesignLoader` (`data-theme` + acento inline), selector en Admin → Diseño.

**Auditoría de cobertura (2026-06-25):** se revisó todo `globals.css` y se parametrizaron con
`color-mix()` sobre las variables del tema los colores que estaban hardcodeados: **fondo de
`.card`** (`--card-rgb` por tema → carbón en gótico, ya no púrpura), bordes de acento
(`.accent-*`), badges de marca (pink/cyan/lime), glows (`.glow-*`, `.text-glow-*`), anillo de
foco de inputs, scrollbar, hovers de botón, fondos ambientales (`.app-bg`, `.scenecore-bg`),
`.hero-gradient` y el borde arcoíris animado. **Verificado en vivo** (gótico: `.card` =
`rgba(18,11,14,.75)`, glow/acento = `#c1121f`; default restaura limpio) + **build de
producción verde**.

*Excepciones intencionales (NO cambian con el tema, por diseño):* badges de estado
verde/amarillo/rojo (semántica: confirmado/interés/peligro), el título arcoíris
(`text-glow-rainbow`) y las estrellitas decorativas del fondo (`scenecore-bg::after`).

**Fix de blur (2026-06-25):** el slider "Glassmorphism Blur" no afectaba a las tarjetas. Causa
(pre-existente): `.card` usaba `backdrop-filter: blur(var(--glass-blur))` y Lightning CSS
(Tailwind v4) descartaba la propiedad estándar (Chrome no entiende `-webkit-backdrop-filter`).
Fix: la variable guarda el valor completo (`--card-backdrop: blur(Npx)`) y `.card` declara solo
la estándar (Lightning añade el prefijo). Además se quitó la clase Tailwind `backdrop-blur`
fija de la tarjeta del Hero y del reproductor (pisaban el control). Verificado en el **CSS de
producción** (`.card` incluye `backdrop-filter`). *Nota:* el dev server de Next emite solo
`-webkit` (quirk de Turbopack) → el blur se ve en producción, no en `next dev`.

**Siguiente nivel posible:** C (bloques/contenedores) o decoraciones temáticas por preset.

---

## 12. Marketing · estado

| Pieza | Estado |
|---|---|
| Plan de marketing/lanzamiento | 🟡 Existe `docs/pt/pt-10-marketing-lanzamiento.md` |
| Canales (TikTok/IG) | 🟡 Links de evento sí; estrategia formal ⛔ |
| PWA instalable (retención) | ✅ |
| SEO / metadatos / OG images | ⛔ verificar |

---

## 13. Próximos pasos priorizados

1. **Hacer el repo público** (Settings → Danger Zone) — destraba el auto-update del desktop y la descarga pública del `.exe`. **Tu paso #1.**
2. **Promover tu cuenta a `role=admin`** (SQL) — para que el gestor de diseño persista.
3. ✅ **Migraciones de Supabase corridas (2026-06-26)** — 10 scripts (§6): `phase-g/de/f/profile-extras/bloques/chat/sugerencias/1-attendance/fix-tags/saved-songs`. Cierra insignias, privacidad, moderación, tags, subidas, chat, perfil, buzón y bloques. *(Solo faltaría `site_settings_setup.sql` si el gestor de diseño no persiste.)*
4. ✅ Hecho: panel B1, seguridad S1/S2, personalización A+B, CI typecheck, blur, temas desktop.
5. **Limpiar docs desincronizados** — `ARCHITECTURE.md` y `ESTADO.md` (mencionan `/api/download`/Cobalt, ya inexistentes). ✅ Avance 2026-06-25: descargador consolidado en [DESCARGADOR.md](./DESCARGADOR.md) y `pt-11` marcado como superado.
6. **Definir branding** — tagline + `docs/BRANDING.md`.
7. **App de PC**: icono propio + firma de código (quita el aviso SmartScreen).
8. **Áreas de trabajo (2026-06-26)** — avance: **§14** perfil hi5 Fase A ✅ (falta Fase B con migraciones), **§15** panel DJ + roles ✅, **§16** app móvil Fases 0/1/2 ✅ (falta probar en dispositivo + Fase 3). Detalle y puntos de continuidad en la sección **⭐ PARA LA SIGUIENTE IA** (arriba) y en §14/§15/§16.

---

## 14. Plan: Perfil hi5 — Estética Web 2.0 scenecore

> Contexto: la propuesta es llevar el perfil público (`/perfil/[id]`) a una estética
> inspirada en hi5/MySpace 2006-2008 — neon, pixel, guestbook, reactions retro — SIN
> modificar el diseño global del sitio. Todo lo de esta sección está **scoped a esa ruta**.

### Reglas de no-romper para esta área
- Los cambios de estilo van exclusivamente a `src/app/perfil/[id]/page.tsx` y un archivo
  CSS scoped (ej. `perfil.module.css`). **No tocar `globals.css` ni `DesignLoader`.**
- Las variables de color reutilizan los tokens ya definidos (`--magenta`, `--neon-cyan`,
  `--neon-lime`). No colores hardcodeados nuevos salvo en el CSS del módulo de perfil.
- El reproductor retro es un **skin visual** del `GlobalPlayer` ya existente, no un
  componente de audio nuevo. Reusa `PlayerContext`.
- Tailwind v4 gotcha: si aplicas `backdrop-filter` en este módulo, usa variable completa
  (ej. `--perfil-blur: blur(8px)`), no `blur(var(--x))`.

### Fase A — Solo frontend, cero migraciones ✅ (hecho 2026-06-26)

Implementado en `src/app/perfil/[id]/perfil.module.css` (CSS module scoped) + `page.tsx`.
**No se tocó** `globals.css` ni `DesignLoader`. El acento del perfil entra por la variable
inline `--perfil-accent` (de `profile.accent`) con fallback al `--cyan` del tema, así respeta
los 7 presets. Todo bajo `@media (prefers-reduced-motion: reduce)` para accesibilidad.

| Tarea | Estado | Detalle |
|---|---|---|
| **A1. Layout retro del perfil** | ✅ | `.retro` (max-width 950) + `.panel` con borde neón doble (`border` + `box-shadow` doble + inset glow), fondo `rgba(0,0,0,0.80)`, y `.titlebar` estilo ventana ("★ Perfil de X ★"). |
| **A2. Neon glow en nombre** | ✅ | `.glowName` con `text-shadow` triple animado (`glowPulse`) usando `--pa`. |
| **A3. Fondo animado CSS** | ✅ | `.retro::before`: cuadrícula doble `linear-gradient` con `color-mix`, animada con `@keyframes retroGrid` (sin GIFs). |
| **A4. Skin retro del reproductor** | ✅ | `.player` decorativo "now spinning": disco `conic-gradient` girando (`.disc`) + marquesina (`.marquee`). **No** reimplementa audio (el real lo maneja `GlobalPlayer`); es adorno visual. |
| **A5. Cursor retro** | ✅ | `.retro` con `cursor: url(SVG estrella)` dentro de `@media (pointer: fine)` → solo desktop, no rompe táctil. |
| **A6. Galería estilo hi5** | ✅ | `.gallery` (3/4 cols) + `.thumb` con borde neón, `box-shadow`, hover con zoom+rotación y caption en `title`. |

> Verificado en preview: `color-mix`/`conic-gradient` compilan bien con Lightning CSS; `--pa`
> resuelve al acento o al cian del tema; sin errores de consola; `tsc` limpio. (El screenshot
> automático expira por las animaciones infinitas — no es un bug de la página.)

### Fase B — Requiere migraciones nuevas ✅ (hecho 2026-06-26)

| Tarea | Migración necesaria | Detalle |
|---|---|---|
| **B1. Guestbook** | `supabase/phase-guestbook.sql` → tabla `profile_guestbook (id, owner_id, author_id, author_name, content, created_at)` + RLS (cualquier user logueado escribe en perfil ajeno; owner lee/elimina) | ✅ Sección vertical "Libro de visitas" en el perfil público. Requiere login para dejar mensaje, RLS robusto e integración con realtime de Supabase y local fallback. |
| **B2. Reactions / "Fives"** | `supabase/phase-reactions.sql` → tabla `profile_reactions (id, profile_id, user_id, reaction)` + RLS (1 reacción por user por tipo) | ✅ Grid de botones retro: ⭐ estrella, 💜 corazón, 💀 calavera, 🔥 fuego, 👾 fantasma. Contador visible e interactivo en tiempo real con control de 1 por tipo por usuario. |

### Descartado (y por qué)

| Elemento | Razón |
|---|---|
| GIFs de fondo repetitivos | Rendimiento. Usar CSS animado es equivalente visualmente. |
| Fuentes 11–13px tipo Tahoma como default | Rompe accesibilidad. Los temas "Pixel" y "Vaporwave" ya dan esa estética a quien la activa. |
| Autoplay de audio | Todos los browsers modernos lo bloquean. Botón de activación destacado en su lugar. |
| Filtros destructivos en imágenes (grayscale global) | Destruiría las fotos de cosplay. Solo aplicar como hover-effect opcional. |
| Cursor personalizado global | Invasivo y no funciona en móvil. Scoped al perfil, solo desktop. |
| CSS libre inyectable | Footgun + XSS. Ya descartado en §11. |

---

## 15. Plan: Panel DJ + Gestión de roles

> Contexto: el rol `dj` ya existe en BD (`UserRole = 'user' | 'dj' | 'admin'`) y en la
> función `is_staff()` de la RLS. Lo que falta es (a) una pantalla propia para el DJ
> y (b) mejor UX para que el admin asigne roles.

### Reglas de no-romper para esta área
- El panel `/dj` protege por `role === 'dj' || role === 'admin'`, usando el mismo
  `useAuth()` + `isStaff` que ya usa `/admin`. No crear un sistema de auth paralelo.
- La lógica de descarga del `.bat` se importa de `src/lib/crate.ts` sin duplicar.
- El tab `users` del admin actual sigue funcionando. Las mejoras son UX (dropdown,
  búsqueda), no restructurar el estado ni las llamadas a `data.ts`.
- Toda escritura de rol pasa por `updateProfileRole` en `data.ts` (ya existe). No
  llames directamente a Supabase desde el componente.

### Fase A — Página `/dj` simplificada ✅ (hecho 2026-06-26)

| Tarea | Estado | Detalle |
|---|---|---|
| **A1. Ruta `src/app/dj/page.tsx`** | ✅ | Guard con `useAuth()`: `loading` → spinner; sin rol `dj`/`admin` → tarjeta "solo para DJs" + volver. Mismo criterio que `/admin` (prod: rol real; demo: `isStaff`). |
| **A2. Panel de playlist del evento activo** | ✅ | Setlist ordenado por votos (tocadas al fondo), botón "marcar tocada" (`setSongPlayed`), botón refrescar. Evento activo = confirmado ?? primero (igual que la home). |
| **A3. Descarga `.bat` del set** | ✅ | Toggle MP3/MP4 + "Descargar set" → `buildCrateBat` de `crate.ts` con los hosts descargables (YouTube/TikTok/IG). |
| **A4. Lista de asistentes confirmados** | ✅ | `getAttendees` filtrado por evento activo + `status === 'confirmed'`. Solo lectura, grid con iniciales y código. |
| **A5. Link desde el Navbar** | ✅ | Enlace `DJ` (icono Disc3) inyectado en `navItems` solo si `role === 'dj' || 'admin'`. Desktop + drawer móvil. |

### Fase B — Mejoras de gestión de roles en Admin ✅ (hecho 2026-06-26)

| Tarea | Estado | Detalle |
|---|---|---|
| **B1. Búsqueda de usuario en tab Usuarios** | ✅ | `userSearch` filtra por `username`/`email` en estado local + orden (puntos/racha/nombre/rol). *(Ya existía; verificado.)* |
| **B2. Dropdown de rol inline** | ✅ | `<select>` user/dj/admin → `handleRoleChange` → `updateProfileRole`. Ahora con `savingRoleId` (spinner `Loader2` mientras guarda + `disabled`). |
| **B3. Confirmación antes de promover a admin** | ✅ | `handleRoleChange`: si el nuevo rol es `admin`, `confirm()` con el nombre del usuario antes de escribir. `try/catch` con aviso si la RLS rechaza. |

### Verificación 2026-06-26
- `npx tsc --noEmit` limpio. Preview: `/dj` carga (evento activo detectado, setlist/confirmados),
  Navbar muestra "DJ", tab Usuarios del admin con búsqueda + dropdown de rol. Sin errores de consola.

### Fase C — Vinculación DJ ↔ Evento (opcional, largo plazo) ⏸️

`EventItem.djs` ya es un array `{name, tel, color, bg_url}`. Se podría añadir `profile_id`
para vincular a un perfil real y mostrar el avatar del DJ en la página del evento. Requiere
migración en `events`. Aparcado hasta que haya más de un DJ activo en el sistema.

---

## 16. Plan: App móvil (Expo — MVP)

> Contexto: `mobile-app/` ya tiene **Fases 0+1+2 implementadas** (Expo Router + 6 pantallas;
> ver tablas de PT abajo). El backend (Supabase) reutiliza las mismas tablas y RLS que la web.
> **AGENTS.md del mobile**: leer docs de Expo v56 en https://docs.expo.dev/versions/v56.0.0/
> antes de escribir código. No asumir que es la misma API que versiones anteriores.
>
> **Para continuar (Fase 3):** `cd mobile-app && npm install --legacy-peer-deps`, crear `.env`
> (ver `.env.example`), `npm start` → Expo Go. Verificar con `npx tsc --noEmit` y
> `npx expo export --platform android` (no hay emulador en el entorno de la IA).

### Reglas de no-romper para esta área
- **No hay descargas en el servidor móvil.** La regla de oro del proyecto aplica igual:
  yt-dlp corre en la PC/app de escritorio, no en el teléfono ni en Vercel.
- Usar `@supabase/supabase-js` directamente (el mismo cliente que la web). Las tablas,
  RLS y funciones son idénticas — no crear endpoints nuevos solo para el móvil.
- Guardar la sesión con `expo-secure-store` (no `AsyncStorage` en texto plano).
- Usar **Expo Router** (file-based routing, ya en v56) para la estructura de navegación.
  No React Navigation manual.
- El build de `mobile-app/` es completamente independiente del de `src/` (Next.js).
  No importar nada de `src/lib/` ni `src/components/` en el mobile — duplicar solo los
  tipos necesarios o extraerlos a un paquete compartido en el futuro.

### Fase 0 — Setup y arquitectura ✅ (hecho 2026-06-26)

Base en `mobile-app/lib/` (estructura plana). Completada junto con la Fase 1 (router +
AuthProvider). `npx tsc --noEmit` limpio y `expo export` (android) OK. **Queda probar en
Expo Go** (`npm start` en `mobile-app/`) + un `.env` real.

| Tarea | Estado | Detalle |
|---|---|---|
| **0A. Dependencias base** | ✅ | `@supabase/supabase-js` + `@react-native-async-storage/async-storage` (ya estaban) + `expo-router`, `react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `@expo/vector-icons`, `babel-preset-expo` (instaladas en PT 1.1). `@shopify/flash-list` aún no (FlatList basta por ahora). |
| **0B. Cliente Supabase para RN** | ✅ | `mobile-app/lib/supabase.ts` — misma instancia que la web (anon key vía `EXPO_PUBLIC_*`), auto-refresh por `AppState`, `isConfigured` (= `cfg()` de la web). |
| **0C. Tipos del dominio** | ✅ | `mobile-app/lib/types.ts` — copia de `src/lib/types.ts` (sin importar nada de `src/`). |
| **0D. Tema base oscuro** | ✅ | `mobile-app/lib/theme.ts` — tokens scenecore (magenta/cyan/lime + superficies) + `radius`/`space`. |
| **0E. Layout raíz con Expo Router** | ✅ | Hecho en Fase 1 (PT 1.2): `app/_layout.tsx` con `AuthProvider` + `Stack`. El `App.tsx` de una sola pantalla fue reemplazado por las rutas de `app/`. |

> **Desviaciones documentadas (decisión 2026-06-26):**
> - **AsyncStorage en vez de `expo-secure-store`** para la sesión. Es el patrón estándar de
>   Supabase para RN y evita una dependencia nueva (async-storage ya estaba). El token es un
>   JWT con la anon key (pública por diseño; la seguridad real la da la RLS). Si se quiere
>   cifrado en reposo, migrar a `expo-secure-store` es un cambio aislado en `lib/supabase.ts`.
> - **Sin `expo-router` todavía.** Se difiere a la Fase 1 (cuando entren las 3 pantallas), para
>   no reestructurar la navegación antes de tener pantallas que navegar.
> - Archivos en `mobile-app/lib/` (no `src/lib/`) para seguir la estructura plana del scaffold.
> - Añadidos `mobile-app/.env.example` y `.env` al `.gitignore`.

### Fase 1 — MVP: las tres pantallas core ✅ (hecho 2026-06-26)

Implementado con **Expo Router** (file-based) bajo `mobile-app/app/`. Estructura de PT:

| PT | Estado | Detalle |
|---|---|---|
| **PT 1.1 — Instalar + configurar Expo Router** | ✅ | `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants` + `@expo/vector-icons` + `babel-preset-expo`. `package.json main` → `expo-router/entry`; `app.json`: `scheme: "nightcoreaqp"`, plugin `expo-router`, `experiments.typedRoutes`; `babel.config.js` con `babel-preset-expo`. |
| **PT 1.2 — Navegación** | ✅ | `app/_layout.tsx` (Stack raíz + `SafeAreaProvider` + `AuthProvider`); `app/(tabs)/_layout.tsx` (Tabs: Inicio/Playlist/Perfil con iconos Ionicons). Borrados `index.ts` y `App.tsx` (entry ahora es expo-router). |
| **PT 1.3 — Auth + datos** | ✅ | `lib/auth.tsx` (`AuthProvider`/`useAuth`: sesión Supabase, signIn/signUp/signOut, carga de profile). `lib/data.ts` ampliado: `getAttendees`, `createRsvp` (tabla `event_attendees`), `setSongVote` (tabla `song_votes`), `getProfile`, `updateMyProfile`. |
| **PT 1.4 — HomeScreen** | ✅ | `app/(tabs)/index.tsx`: evento activo + conteo confirmados/interesados + RSVP (interesado/confirmar) si hay sesión. |
| **PT 1.5 — PlaylistScreen** | ✅ | `app/(tabs)/playlist.tsx`: lista por votos, voto ▲ con toggle optimista (requiere sesión). |
| **PT 1.6 — ProfileScreen** | ✅ | `app/(tabs)/perfil.tsx`: login/registro/logout + vista de perfil (avatar, rango, puntos, racha, rol). |

> **Verificación (2026-06-26):** `npx tsc --noEmit` limpio **y** `npx expo export --platform
> android` exporta el bundle Hermes sin errores de resolución (todo el grafo de imports compila
> y la app arranca). **Falta probar el comportamiento en runtime** en Expo Go/dispositivo con un
> `.env` real (login, RSVP, voto). Tablas/columnas espejadas de la web; la RLS aplica igual.

> **Punto de continuidad para el siguiente chat → Fase 2 (PT 2.x).** Las pantallas nuevas siguen
> el mismo patrón: archivo en `app/(tabs)/` o `app/`, datos en `lib/data.ts`, sesión vía `useAuth`.
> No importar nada de `src/`. Antes de empezar, correr `npm install --legacy-peer-deps` en
> `mobile-app/` (hay conflictos de peer deps de RN; es el escape estándar).

### Fase 2 — V2: comunidad ✅ (hecho 2026-06-26)

Pantallas como rutas de stack (fuera de `(tabs)`), con cabecera propia + botón atrás.
Accesos desde la sección "Comunidad" del Home (PT 2.4).

| PT | Estado | Detalle |
|---|---|---|
| **PT 2.1 — CostumesScreen** | ✅ | `app/disfraces.tsx`: galería de cosplay por votos + voto binario ❤ (toggle optimista → `costume_votes`). **Subir foto** queda para una PT futura (necesita bucket Storage + image picker). |
| **PT 2.2 — ChatScreen** | ✅ (código) | `app/chat.tsx`: historial + **Realtime** (`subscribeChat` → `postgres_changes` INSERT) + envío. ⚠️ **Requiere `phase-chat.sql` corrido** en Supabase para funcionar; sin él la lista sale vacía. |
| **PT 2.3 — Mi actividad** | ✅ | `app/actividad.tsx`: en vez de una `NotificationsScreen` (no hay tabla de notificaciones en la BD), un feed personal: mis reservas (`event_attendees` filtradas) + mis canciones sugeridas (`getMySuggestedSongs`). |
| **PT 2.4 — Navegación + datos** | ✅ | Sección "Comunidad" en el Home con `Link` a las 3 rutas. `lib/data.ts` ampliado: `getCostumes`, `setCostumeVote`, `getChatMessages`, `sendChatMessage`, `subscribeChat`, `getMySuggestedSongs`. |

> **Verificación (2026-06-26):** `tsc` limpio + `expo export --platform android` bundlea sin
> errores. **Pendiente probar en runtime** (Expo Go): voto de disfraz, y el chat **tras correr
> `phase-chat.sql`**. Decisión documentada: `NotificationsScreen` se reemplazó por "Mi actividad"
> porque no existe modelo de notificaciones en la BD (sería una migración nueva; ver Fase 3).

> **Punto de continuidad → Fase 4 (Distribución & Notificaciones).** Pendientes naturales:
> Probar el bundle en dispositivo real a través de Expo Go o construir el APK final. Evaluar si
> se implementarán notificaciones push en el futuro.

### Fase 3 — V3: DJ y extras ✅ (hecho 2026-06-26)

| Pantalla | Ruta | Features |
|---|---|---|
| **DJScreen** | `app/dj.tsx` | Panel DJ simplificado. Solo visible con rol `dj` o `admin`. Setlist interactivo, toggle de tocadas y confirmados. |
| **EncuestasScreen** | `app/encuestas.tsx` | Registro de racha diaria (+5 pts) y encuesta del día con barras de porcentaje + historial. |
| **HistoryScreen** | `app/historial.tsx` | Historial de eventos pasados indicando asistencia personal y Muro de la Fama (fans, canciones y cosplays). |
| **Subida de Cosplay** | `app/disfraces.tsx` | Formulario modal para subir fotos de cosplay mediante `expo-image-picker` y Supabase Storage. |

### Decisiones pendientes (antes de publicar / Fase 3)

- [ ] ¿Publicar en Play Store (requiere cuenta de desarrollador Google ~$25 único) o distribuir solo APK manual por ahora?
- [ ] ¿Notificaciones push? (Expo Notifications + un servicio externo). Añade complejidad; recomendado dejarlo para V3.
- [x] ¿Mismo dominio de Supabase que la web o instancia separada? → **Mismo** (ya implementado en `lib/supabase.ts`).

> **Lo que falta del móvil para llegar al 100%** está en [PLAN-COMPLETO.md](./PLAN-COMPLETO.md)
> **Bloque C** (PT M1 probar en dispositivo ← bloqueante, M3 icono/splash, M4 push, M5 build EAS,
> M6 publicar, M7 paridad).
