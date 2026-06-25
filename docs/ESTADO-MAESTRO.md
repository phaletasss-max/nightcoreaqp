# Estado Maestro — Nightcore AQP

> Mapa único del proyecto: visión, branding, arquitectura, APIs, features, deploy, pruebas,
> seguridad y marketing — cada cosa con su **estado real en código**.
> Es el documento "padre"; los de `docs/` y `docs/pt/` son el detalle.

**Última actualización:** 2026-06-25
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

## 0. Plan de trabajo consolidado (2026-06-25)

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
  **falta correr** `phase-chat.sql` y `phase-profile-extras.sql` en Supabase para activar en prod.

### 🟡 En proceso (falta un paso, casi nada de código)
- **Repo → público** (Settings → Danger Zone → Make public): destraba el **auto-update** del desktop
  (hoy da 404 anónimo) y la descarga pública del `.exe`. **Es el paso #1.**
- **Promover tu cuenta a `role=admin`** (SQL): para que el gestor de diseño **persista** en prod.
- **Correr migraciones de Supabase** (ver §6): desbloquean insignias, privacidad, moderación, tags y subidas.
- **media-service (Render)**: se duerme; YouTube le exige cookies. Plan Arch (IP residencial) sin implementar.

### ⛔ Pendiente (no empezado)
- **APK móvil** (`mobile-app/` es solo el stub de Expo).
- **Branding**: tagline definitivo + `docs/BRANDING.md`; SEO/OG images.
- **Personalización nivel C** (añadir/ordenar contenedores → tabla `custom_blocks`).
- **Feed personalizado por interés**; **verificación de cuenta** (email/WhatsApp).
- **Firma de código del `.exe`** (quitar el aviso de SmartScreen) + icono propio.
- **Limpieza**: docs desincronizados (`ESTADO.md`, `ARCHITECTURE.md`), `console.log` de depuración (S5),
  bug menor del feed ("Votar" lleva a `/encuestas` que redirige a `/`).

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
| Disfraces (cosplay) + votos + comentarios | ✅ | |
| Encuestas | ✅ | |
| Temáticas sugeridas (ranking por clicks) | ✅ | |
| Retos diarios / racha | ✅ | |
| Perfil + actividad | ✅ | |
| **Chat de comunidad en vivo** (`/chat`) | ✅ **nuevo** (2026-06-25) | Supabase Realtime; login para escribir; filtro `banned_words`; reportar + ocultar/eliminar staff. **Correr `phase-chat.sql`** en prod |
| **Perfil: galería de fotos + bio + links** | ✅ **nuevo** (2026-06-25) | `profile_photos` + bio + TikTok/IG; galería gated por privacidad. **Correr `phase-profile-extras.sql`** |
| **Perfil: color de acento (personalización)** | ✅ **nuevo** (2026-06-25) | `profiles.accent` aplicado con `color-mix` en perfil propio + público |
| Perfil privado (toggle) | 🟡 | **Falta `phase-de.sql`** (`is_private`) |
| Moderación por palabras | 🟡 | **Falta `phase-de.sql`** (`banned_words`, `flagged`) |
| Gestor de diseño en vivo (admin) | 🟡 | Código arreglado (§10 B1); falta promover tu cuenta a `role=admin` para que persista |
| Asistente IA (Gemini) | ✅ | `GEMINI_API_KEY` |
| PWA instalable + offline básico | ✅ | SW arreglado hoy (fallback) |
| App móvil (Expo) | ⛔ | Solo el stub por defecto |
| App de escritorio · descargas (Electron) | ✅ **comprobado** | `desktop-app/` **v0.1.7**: auto-instala yt-dlp/ffmpeg/**deno** + auto-update de yt-dlp; baja **YouTube/IG MP4** (deno→nsig) y **TikTok H.264**; cookies (navegador + **archivo `.txt`**); temas + imagen de fondo; auto-update (electron-updater, visible + log); instalador NSIS; releases auto-publicadas (GitHub Actions). Falta: repo público (para auto-update), icono propio, firma de código |
| Convertidor de archivos | ⏸️ | Fuera del repo |
| Verificación de cuenta (email/WhatsApp) | ⛔ | Investigado en ROADMAP §8 |
| Feed personalizado por interés | ⛔ | `feed_items` / `feed_seen` no creadas |
| Fondo de video con scroll + reproductor global | 🟡 | `VideoBackground`/`GlobalPlayer` existen; revisar loop de render (§10) |
| **Personalización: añadir contenedores / editar CSS** | ⛔ | Propuesta nueva — ver §11 |

---

## 6. Base de datos · migraciones pendientes en Supabase

Correr en el **SQL Editor** (orden sugerido). Marcar aquí cuando se corra:

| Script | Crea / cambia | Estado |
|---|---|---|
| `supabase/schema.sql` | 19 tablas + triggers + RLS + `is_staff()` / `daily_check_in()` / RPCs | ✅ corrido |
| `site_settings_setup.sql` (raíz del repo) | tabla `site_settings (key, value)` | ⚠️ **necesaria 1ª** — sin ella el gestor de diseño cae a localStorage |
| `supabase/fixes.sql` | bucket `media` + cierra la RLS de `site_settings` a staff | ✅ corrido (depende de la tabla anterior) |
| `supabase/fix-tags.sql` | `songs.tags`, `costumes.tags` + `is_wip` | ⛔ **PENDIENTE** (PGRST204 al sugerir canción/disfraz; redundante si `schema.sql` ya las trae) |
| `supabase/phase-de.sql` | columnas extra de `events`, `profiles.is_private`, `banned_words`, `event_comments.flagged` | ⛔ **PENDIENTE** (eventos completos, privacidad, moderación) |
| `supabase/phase-1-attendance.sql` | `attendance_proofs` + RPCs aprobar/rechazar | ⛔ **PENDIENTE** (insignias; causa el 404) |
| `supabase/phase-f.sql` | `profiles.email` + `bg_url`; redefine `handle_new_user` | ⛔ **PENDIENTE** (panel muestra correos; fondo de perfil) |
| `supabase/phase-g.sql` | recrea bucket `media` **público (anon)** | ⛔ **PENDIENTE** (subir avatar/flyer/fondos falla sin esto si no hay sesión real) |
| `supabase/saved-songs.sql` | `saved_songs` (playlist personal) | ✅ absorbida en `schema.sql` |
| `supabase/phase-chat.sql` | `chat_rooms`, `chat_messages`, `chat_reports` + RLS + Realtime | ⛔ **PENDIENTE** (activa el chat `/chat`; sin ella el chat sale vacío pero no rompe) |
| `supabase/phase-profile-extras.sql` | `profiles.bio/tiktok_url/instagram_url/accent/bg_url` + `profile_photos` + RLS | ⛔ **PENDIENTE** (activa galería, bio, links y acento del perfil) |

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
| S5 | `console.log('[FASE 3]…')` de depuración en `data.ts` de producción | 🟢 Bajo | Limpiar |

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

---

## 11. Personalización avanzada (respuesta a "¿añadir contenedores / editar CSS / más temas?")

Hoy el admin puede: cambiar fondo/opacidad por sección, fuente, radio, blur, overlay, y
mostrar/ocultar secciones **fijas**. Lo que pides es subir un nivel. Propuesta por capas:

| Nivel | Qué da | Estado |
|---|---|---|
| **A. Más tokens** | Acento, opacidad, radio, blur, overlay + **fuente de títulos Y de texto**, **colores a medida** (fondo/superficie/texto), **tamaño de letra** y **reset** como variables en `site_settings` | ✅ Hecho (ampliado 2026-06-25: la fuente del cuerpo, colores granulares, escala y reset) |
| **B. Presets de tema** | Dropdown *Scenecore · Pixel · Gótico · Anime · **Y2K · Vaporwave · Cyber*** (7) — cada uno setea toda la paleta vía `html[data-theme]` | ✅ Hecho (3 packs nuevos 2026-06-25) |
| **C. Bloques/contenedores** | Tabla `custom_blocks` (tipo, título, contenido, orden, sección) + render dinámico → el admin añade/ordena contenedores sin tocar código | ⛔ Pendiente (fase aparte) |
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
3. **Correr migraciones de Supabase** (§6) — `site_settings_setup.sql` + `phase-de` + `phase-1-attendance` + `phase-g` + `phase-f` + `fix-tags`. Cierra insignias, privacidad, moderación, tags y subidas.
4. ✅ Hecho: panel B1, seguridad S1/S2, personalización A+B, CI typecheck, blur, temas desktop.
5. **Limpiar docs desincronizados** — `ARCHITECTURE.md` y `ESTADO.md` (mencionan `/api/download`/Cobalt, ya inexistentes). ✅ Avance 2026-06-25: descargador consolidado en [DESCARGADOR.md](./DESCARGADOR.md) y `pt-11` marcado como superado.
6. **Definir branding** — tagline + `docs/BRANDING.md`.
7. **App de PC**: icono propio + firma de código (quita el aviso SmartScreen).
8. (Largo plazo) App móvil real (APK), feed personalizado, verificación de cuenta.
</content>
</invoke>
