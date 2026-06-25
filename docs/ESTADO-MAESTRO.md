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
| Presets de tema (pixel / scenecore / gótico / anime) | ✅ | + token de color de acento. Admin → Diseño → Tema visual (2026-06-25) |

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
| Perfil privado (toggle) | 🟡 | **Falta `phase-de.sql`** (`is_private`) |
| Moderación por palabras | 🟡 | **Falta `phase-de.sql`** (`banned_words`, `flagged`) |
| Gestor de diseño en vivo (admin) | 🟡 | Código arreglado (§10 B1); falta promover tu cuenta a `role=admin` para que persista |
| Asistente IA (Gemini) | ✅ | `GEMINI_API_KEY` |
| PWA instalable + offline básico | ✅ | SW arreglado hoy (fallback) |
| App móvil (Expo) | ⛔ | Solo el stub por defecto |
| App de escritorio · descargas (Electron) | ✅ | `desktop-app/`: UI + auto-instala yt-dlp/ffmpeg/**deno** (nsig YouTube) + auto-update de yt-dlp + descarga. Releases auto-publicadas (GitHub Actions). Instalador NSIS + **auto-update** (visible + log) + botón ".exe" en la web (aviso SmartScreen). Cookies del navegador opcional + temas + imagen de fondo (0.1.3). Pendiente menor: icono propio (2026-06-25) |
| Convertidor de archivos | ⏸️ | Fuera del repo |
| Verificación de cuenta (email/WhatsApp) | ⛔ | Investigado en ROADMAP §8 |
| Feed personalizado por interés | ⛔ | `feed_items` / `feed_seen` no creadas |
| Fondo de video con scroll + reproductor global | 🟡 | `VideoBackground`/`GlobalPlayer` existen; revisar loop de render (§10) |
| **Personalización: añadir contenedores / editar CSS** | ⛔ | Propuesta nueva — ver §11 |

---

## 6. Base de datos · migraciones pendientes en Supabase

Correr en el **SQL Editor** (orden sugerido). Marcar aquí cuando se corra:

| Script | Crea | Estado |
|---|---|---|
| `supabase/schema.sql` | Tablas base + triggers + RLS + `is_staff()` | ✅ corrido |
| `supabase/fixes.sql` | Políticas bucket `media` + cierre `site_settings` + admin real | ✅ corrido |
| `supabase/phase-de.sql` | `is_private`, `banned_words`, `event_comments.flagged`, columnas extra de `events` | ⛔ **PENDIENTE** |
| `supabase/phase-1-attendance.sql` | `attendance_proofs` + RPCs aprobar/rechazar | ⛔ **PENDIENTE** (causa el 404 de hoy) |
| `supabase/saved-songs.sql` | `saved_songs` (playlist personal) | ❓ verificar |
| `supabase/phase-f.sql` · `phase-g.sql` · `fix-tags.sql` | (revisar contenido) | ❓ verificar |

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
| Pipeline "Zero Trust" (`pipeline.ts` + `ci-policy.ts` + `deploy-check.sh`) | ✅ | Integrity score, manifest hashing |
| E2E Playwright (`e2e/smoke.spec.ts`) | ✅ | |
| GitHub Actions (`.github/workflows/ci.yml`) | 🐞 | Llama `npm run typecheck` pero **ese script no existe** en `package.json`; el `|| echo` enmascara el fallo → el typecheck no corre (solo lo cubre `next build`) |
| Scripts de verificación (`scripts/verify-*`) | ✅ | env, rutas, schema, media-service, etc. |

---

## 9. Auditoría / seguridad · hallazgos

| # | Hallazgo | Severidad | Acción |
|---|---|---|---|
| S1 | **Login admin hardcodeado** en cliente: `ADMIN_EMAILS` + password `Nakamura321.` en `src/app/admin/page.tsx` (va en el bundle) | 🔴 Alta | Mover a sesión real Supabase con `role=admin`; quitar credenciales del código |
| S2 | **Admin de emergencia** vía flag `localStorage` (`nq_emergency_admin`) en `auth.tsx` | 🟠 Media | Solo da UI (RLS rechaza escrituras), pero es engañoso. Quitar o aislar |
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
- **Estado:** ✅ **Arreglado hoy** (`public/sw.js` v2: fallback garantizado + bump de caché).

---

## 11. Personalización avanzada (respuesta a "¿añadir contenedores / editar CSS / más temas?")

Hoy el admin puede: cambiar fondo/opacidad por sección, fuente, radio, blur, overlay, y
mostrar/ocultar secciones **fijas**. Lo que pides es subir un nivel. Propuesta por capas:

| Nivel | Qué da | Estado |
|---|---|---|
| **A. Más tokens** | Paleta de acento, opacidad, radio, blur, overlay, fuente como variables en `site_settings` | ✅ Hecho (token de acento añadido 2026-06-25) |
| **B. Presets de tema** | Dropdown *Scenecore · Pixel · Gótico · Anime* — cada uno setea toda la paleta vía `html[data-theme]` | ✅ Hecho (2026-06-25) |
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

1. ✅ **Panel (B1)** — hecho en código (sesión real Supabase). Falta tu paso: promover tu cuenta a `role=admin`.
2. **Correr migraciones** — `phase-1-attendance.sql` y `phase-de.sql` (cierra B2, insignias, privacidad, moderación).
3. **Endurecer seguridad (S1)** — sacar credenciales del cliente.
4. **Personalización A+B** — tokens extra + presets de tema (pixel/scenecore/gótico/anime).
5. **Arreglar CI (typecheck)** — añadir script `typecheck` real.
6. **Limpiar docs desincronizados** — `ARCHITECTURE.md` y `ESTADO.md` (`/api/download`, flujo de descargas).
7. **Definir branding** — tagline + `docs/BRANDING.md`.
8. (Largo plazo) App móvil real, feed personalizado, verificación de cuenta.
</content>
</invoke>
