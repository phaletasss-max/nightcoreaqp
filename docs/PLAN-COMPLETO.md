# Plan de trabajo COMPLETO — hasta el 100%

> **Propósito:** enumerar **TODO** lo que falta para terminar el proyecto entero (web + móvil +
> escritorio + backend + infra + QA + branding + lanzamiento), en **partes de trabajo (PT)**
> detalladas para que cualquier IA o persona pueda tomar una y ejecutarla sin contexto previo.
>
> **Documento padre:** [ESTADO-MAESTRO.md](./ESTADO-MAESTRO.md) (estado vivo). **Entrada:** [HANDOFF.md](../HANDOFF.md).
> **Reglas para no romper:** [AGENTS.md](../AGENTS.md) + [GUIA-IA.md](./GUIA-IA.md). **Léelos primero.**

## Cómo usar este documento
- Cada PT tiene: **Estado · Objetivo · Tareas · Archivos · Dependencias · Criterio de aceptación**.
- Estados: ⛔ no empezado · 🟡 parcial · ✅ hecho · ⏸️ aparcado · 👤 acción del dueño (no la IA).
- Al terminar una PT: **verificar** (`tsc`/`build`/`expo export`) → **marcar aquí + en ESTADO-MAESTRO + CHANGELOG** → **commit + push a `main`**.
- **Última actualización:** 2026-07-02.

> ⚠️ **Nota (2026-06-26):** hay **trabajo en curso sin commitear** en el árbol (otra sesión): la
> **Fase B del perfil hi5** (migraciones `phase-guestbook.sql` + `phase-reactions.sql` ya redactadas
> y UI web en edición) y refinamientos del móvil. Antes de tomar PT W1/W2, revisar el working tree
> con `git status` para no duplicar.

## Ruta crítica sugerida (orden recomendado)
1. **Probar en dispositivo lo ya hecho** (PT M1) y **verificar features web en prod** (PT W0).
2. Cerrar **backend pendiente** (PT B1–B4) — desbloquea perfil hi5 Fase B y feed.
3. **Web Fase B + feed + SEO** (PT W1–W5).
4. **Móvil: build + publicar** (PT M3–M6).
5. **Desktop: repo público + firma** (PT D1–D3).
6. **Infra/CI + QA** (PT I1–I4, Q1–Q3).
7. **Branding + lanzamiento** (PT BR1–BR5).
8. **Pulido transversal** (PT P1–P4).

---

# BLOQUE A — Web (Next.js)

### PT W0 — Verificar en producción todo lo desbloqueado por las migraciones 👤🟡
- **Objetivo:** confirmar que las features que dependían de migraciones (corridas 2026-06-26) funcionan en el sitio real.
- **Tareas:**
  - [ ] Bloques: Admin → Bloques crea/ordena → render en home; sin 404 de `custom_blocks`.
  - [ ] Chat `/chat`: enviar mensaje, ver en 2 pestañas (Realtime), reportar, moderar (staff).
  - [ ] Buzón `/sugerencias`: enviar → aparece en Admin → Buzón.
  - [ ] Perfil: bio/links/acento/galería; toggle privado; subir foto (Storage).
  - [ ] Insignias: Admin → Insignias (aprobar/rechazar pruebas).
  - [ ] Moderación: palabras prohibidas filtran en chat/comentarios.
- **Dependencias:** migraciones §6 (✅), cuenta `role=admin` (👤), `site_settings_setup.sql` (PT B1).
- **Criterio:** las 6 áreas responden en prod sin errores de consola.

### PT W1 — Perfil hi5 Fase B: Guestbook (libro de visitas) ✅
- **Objetivo:** sección "Libro de visitas" en `/perfil/[id]` donde usuarios logueados dejan mensajes.
- **Tareas:**
  - [x] Migración `supabase/phase-guestbook.sql`: tabla `profile_guestbook (id, owner_id, author_id, author_name, content, created_at)` + RLS.
  - [x] `src/lib/data.ts`: `getGuestbook(ownerId)`, `addGuestbookEntry(ownerId, content, author)`, `deleteGuestbookEntry(id)` con patrón dual.
  - [x] UI scoped en `src/app/perfil/[id]/page.tsx` + `perfil.module.css`.
  - [x] Censura con `banned_words`.
- **Archivos:** `supabase/phase-guestbook.sql`, `src/lib/data.ts`, `src/app/perfil/[id]/page.tsx`, `perfil.module.css`, `src/lib/types.ts`.
- **Dependencias:** `is_staff()` (✅).
- **Criterio:** dejar/leer/borrar mensajes en prod; RLS impide editar ajenos; `tsc` + build verdes.

### PT W2 — Perfil hi5 Fase B: Reactions / "Fives" ✅
- **Objetivo:** botones retro (⭐/💜/💀) con contador; 1 reacción por usuario por tipo.
- **Tareas:**
  - [x] Migración `supabase/phase-reactions.sql`: `profile_reactions` + RLS (1 por user+tipo).
  - [x] `data.ts`: `getReactions`, `toggleReaction`.
  - [x] UI en perfil (grid de botones neón, contador, estado propio).
- **Archivos:** `supabase/phase-reactions.sql`, `data.ts`, `perfil/[id]/page.tsx`, `perfil.module.css`, `types.ts`.
- **Dependencias:** ninguna nueva.
- **Criterio:** reaccionar/quitar reacción persiste; contador correcto; `tsc`/build verdes.

### PT W3 — Feed personalizado por interés ⛔
- **Objetivo:** que el muro/feed priorice contenido según los intereses/actividad del usuario.
- **Tareas:**
  - [ ] Definir modelo: tablas `feed_items` (o vista) + `feed_seen (user_id, item_id)` → migración.
  - [ ] `data.ts`: `getFeed(userId)` que mezcla encuestas, comentarios, rachas, disfraces (ya existe `LiveFeed`) + marca vistos.
  - [ ] Ajustar `src/components/LiveFeed.tsx` para ordenar por relevancia/no-vistos.
- **Archivos:** migración nueva, `data.ts`, `LiveFeed.tsx`, `types.ts`.
- **Dependencias:** decisión de producto (¿qué define "interés"? tags de canciones/disfraces seguidos).
- **Criterio:** el feed cambia por usuario; no repite vistos; degrada bien sin sesión.

### PT W4 — Verificación de cuenta (anti-multicuenta) 🟡👤
- **Objetivo:** reducir cuentas falsas en votaciones/rachas.
- **Tareas:**
  - [ ] Confirmar **"Confirm email": ON** en Supabase Auth (👤; ya recomendado en README de supabase).
  - [ ] (Opcional V2) OTP por WhatsApp/SMS vía Twilio — tiene costo; documentar y aparcar si no se quiere gasto.
  - [ ] UI: el `AuthModal` ya muestra "revisa tu correo"; verificar el flujo completo.
- **Dependencias:** decisión de gasto (Twilio).
- **Criterio:** un usuario nuevo debe confirmar correo antes de votar; documentado.

### PT W5 — SEO / metadatos / Open Graph ⛔
- **Objetivo:** que el sitio se vea bien al compartir (TikTok/IG/WhatsApp) y sea indexable.
- **Tareas:**
  - [ ] `generateMetadata` por ruta (título/descr) en las páginas clave.
  - [ ] `src/app/opengraph-image.tsx` (o imágenes OG por evento) con la estética scenecore.
  - [ ] `src/app/sitemap.ts` + `src/app/robots.ts`.
  - [ ] Favicon set completo + `apple-touch-icon` + manifest PWA revisado.
- **Archivos:** `src/app/**` (metadata), `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`, `public/`.
- **Dependencias:** branding (PT BR1/BR3) para el copy/imágenes.
- **Criterio:** preview de enlace correcto en WhatsApp/IG; Lighthouse SEO ≥ 90.

### PT W6 — §15 Fase C: vincular DJ ↔ perfil real ⏸️
- **Objetivo:** que `EventItem.djs[]` apunte a un perfil real (avatar, link).
- **Tareas:**
  - [ ] Migración: añadir `profile_id` al modelo de DJs del evento.
  - [ ] Admin: selector de perfil al añadir DJ.
  - [ ] Página de evento: mostrar avatar/perfil del DJ.
- **Dependencias:** aparcado hasta tener >1 DJ activo (decisión de producto).
- **Criterio:** DJ del evento enlaza a su `/perfil/[id]`.

---

# BLOQUE B — Backend / Supabase

### PT B1 — `site_settings_setup.sql` (gestor de diseño) 👤
- **Objetivo:** que Admin → Diseño persista en prod (no caiga a localStorage).
- **Tareas:**
  - [ ] Correr `site_settings_setup.sql` (raíz del repo) en el SQL Editor.
  - [ ] Verificar que un cambio de diseño persiste tras recargar.
- **Criterio:** el diseño se guarda en `site_settings` y sobrevive recarga/otro dispositivo.

### PT B2 — Migraciones nuevas de features pendientes ✅
- **Objetivo:** crear las tablas que piden W1/W2/W3 y, si se hace, notificaciones.
- **Tareas:**
  - [x] `phase-guestbook.sql` (PT W1), `phase-reactions.sql` (PT W2).
  - [ ] (Opcional) `phase-notifications.sql` para notificaciones reales (móvil PT M4 / web).
  - [x] Todas idempotentes, con RLS, de perfil y chat.
- **Criterio:** cada migración corre limpia y queda registrada en §6.

### PT B3 — Auditoría RLS completa (hallazgo S3) ⛔
- **Objetivo:** confirmar que **cada** tabla tiene RLS cerrada correctamente.
- **Tareas:**
  - [ ] Listar todas las tablas (`schema.sql` + phases) y revisar políticas `select/insert/update/delete`.
  - [ ] Verificar que columnas administrativas (rol, puntos) no sean editables por el user (S6 ya cubre `profiles`).
  - [ ] Probar con una cuenta no-staff que no puede leer/escribir lo ajeno.
- **Criterio:** matriz tabla×operación documentada; sin huecos.

### PT B4 — Arreglar `scripts/verify-schema.ts` ⛔
- **Objetivo:** que `deploy:check` no falle por columnas inexistentes.
- **Tareas:**
  - [ ] El verificador valida `events.is_visible` y `setting_key/setting_value` que **no existen** (la tabla usa `key/value`).
  - [ ] Ajustar el verificador a las columnas reales (o añadir las columnas si se decide).
- **Archivos:** `scripts/verify-schema.ts`.
- **Criterio:** `npm run deploy:check` pasa la validación de schema.

---

# BLOQUE C — App móvil (Expo)

> Estado actual: **Fases 0/1/2/3 en código** (Home/Playlist/Perfil/Disfraces+subida/Chat/Mi
> actividad/DJ/Encuestas/Historial). `tsc` + `expo export` verdes. **Nunca probada en dispositivo.**

### PT M1 — Probar TODO en dispositivo (Expo Go) 👤🟡 — **bloqueante**
- **Objetivo:** validar el comportamiento real (no solo que compila).
- **Tareas:**
  - [ ] `cd mobile-app && npm install --legacy-peer-deps`; crear `.env` (ver `.env.example`); `npm start`.
  - [ ] Probar: login/registro, RSVP, voto de canción, voto+subida de disfraz, chat (Realtime), Mi actividad, DJ (rol staff), encuestas+check-in, historial.
  - [ ] Anotar bugs runtime → abrir PT de fix por cada uno.
- **Criterio:** las 9 pantallas funcionan en un Android real con un `.env` de prod.

### PT M2 — Reconciliar `lib/data.ts` móvil ↔ pantallas ✅(verificar)
- **Objetivo:** asegurar que toda función usada por las pantallas existe y espeja la web.
- **Tareas:**
  - [ ] Confirmar `getEvents/getSongs/setSongVote/setSongPlayed/getAttendees/createRsvp/getProfile/getProfiles/getCostumes/addCostume/setCostumeVote/getChatMessages/sendChatMessage/subscribeChat/getActiveSurvey/voteSurvey/dailyCheckIn/getMySuggestedSongs` (ya presentes).
  - [ ] `npx tsc --noEmit` + `npx expo export --platform android` verdes.
- **Criterio:** sin imports rotos; bundle OK.

### PT M3 — Identidad de la app (icono, splash, metadatos) ⛔
- **Objetivo:** branding propio en vez de los assets por defecto de Expo.
- **Tareas:**
  - [ ] Iconos (`assets/icon.png`, adaptive android, `favicon`) con el logo scenecore.
  - [ ] Splash screen propio.
  - [ ] `app.json`: `name` visible, `version`, `android.package` (ej. `pe.nightcoreaqp.app`), `ios.bundleIdentifier`.
- **Dependencias:** branding (PT BR1–BR3).
- **Criterio:** la app instalada muestra icono/nombre/splash propios.

### PT M4 — Notificaciones push ⛔ (decisión)
- **Objetivo:** avisar de nuevo evento, encuesta, respuestas.
- **Tareas:**
  - [ ] `expo-notifications` + permisos + token Expo Push.
  - [ ] Tabla `push_subscriptions` (ya existe en schema) o nueva; guardar token por usuario.
  - [ ] Envío: función/servidor que dispara push (Edge Function de Supabase o servicio).
- **Dependencias:** decisión de producto (recomendado V2/V3).
- **Criterio:** recibir una push de prueba en dispositivo.

### PT M5 — Build con EAS (APK/AAB) ⛔👤
- **Objetivo:** generar el instalable.
- **Tareas:**
  - [ ] `eas.json` + `eas build:configure`; cuenta Expo.
  - [ ] Build de **APK** (distribución directa) y/o **AAB** (Play Store).
  - [ ] Probar el APK en un teléfono real (instalación manual).
- **Criterio:** APK instalable que arranca y conecta a Supabase.

### PT M6 — Distribución / publicación ⛔👤 (decisión)
- **Objetivo:** llevar la app a los usuarios.
- **Tareas:**
  - [ ] **Decidir:** Play Store (cuenta dev Google ~US$25 único, revisión, política de privacidad) **vs** APK manual (link de descarga + aviso de "orígenes desconocidos").
  - [ ] Si Play Store: ficha (descr, screenshots, icono), política de privacidad (URL), AAB firmado.
  - [ ] Si APK: alojar el APK + instrucciones; considerar canal de actualización.
- **Criterio:** la app es instalable por un usuario final.

### PT M7 — Paridad de features con la web (lo que falte) 🟡
- **Objetivo:** cerrar huecos entre web y móvil.
- **Tareas:** revisar y, si se quiere, añadir: temáticas, guardar canciones (saved), asistente IA, descargas (recordar: **NO** server-side; en móvil el `.bat` no aplica → documentar alternativa o omitir), personalización de tema.
- **Criterio:** lista de paridad documentada; lo prioritario implementado.

---

# BLOQUE D — App de escritorio (Electron)

### PT D1 — Repo público 👤 — **paso #1 del proyecto**
- **Objetivo:** destrabar el **auto-update** del desktop (hoy 404 anónimo) y la descarga pública del `.exe`.
- **Tareas:** GitHub → Settings → Danger Zone → Make public.
- **Criterio:** el auto-update descarga sin 404; el `.exe` se baja sin login. **No commitear secretos** (auditar antes).

### PT D2 — Icono propio del `.exe` ⛔
- **Tareas:** icono `.ico` propio + config en `electron-builder`.
- **Criterio:** el instalador y la ventana muestran el icono de Nightcore AQP.

### PT D3 — Firma de código (quitar SmartScreen) ⛔👤 (costo)
- **Objetivo:** que Windows no muestre el aviso de "editor desconocido".
- **Tareas:** obtener certificado de firma (OV/EV, costo anual) + firmar en el pipeline `desktop-release.yml`.
- **Dependencias:** presupuesto.
- **Criterio:** el `.exe` firmado no dispara SmartScreen.

### PT D4 — QA de descargas (edge cases) 🟡
- **Tareas:** probar YouTube (nsig/deno), Instagram, TikTok (H.264), playlists, cookies; manejar errores con mensajes claros.
- **Criterio:** matriz de fuentes probada y documentada.

---

# BLOQUE E — Infra / CI / DevOps

### PT I1 — Cablear el pipeline "Zero Trust" o decidir descartarlo ⛔
- **Objetivo:** que la verificación profunda (`pipeline.ts`/`ci-policy.ts`) corra de verdad, o documentar que se usa solo manual.
- **Tareas:** decidir; si se mantiene, invocarlo en un workflow con los servicios/secretos necesarios; si no, marcarlo como herramienta manual en docs.
- **Criterio:** estado claro y consistente (no "diseñado pero nadie lo llama").

### PT I2 — media-service: que no se duerma / plan Arch ⛔
- **Objetivo:** que el respaldo de búsqueda/descarga esté disponible.
- **Tareas:** cron ping (uptime) para evitar el sleep de Render **y/o** documentar el plan Arch (IP residencial) para YouTube; cookies.
- **Criterio:** media-service responde de forma fiable o el plan B está escrito.

### PT I3 — Documentar variables de entorno (única fuente) ⛔
- **Tareas:** consolidar todas las env (Vercel, Render, mobile `.env`, desktop) en un solo doc/`.env.example`.
- **Criterio:** un nuevo dev configura todo desde un solo lugar.

### PT I4 — Backups de la BD ⛔
- **Tareas:** verificar backups automáticos de Supabase (plan free) + export manual periódico.
- **Criterio:** existe una copia recuperable de los datos.

---

# BLOQUE F — QA / Testing

### PT Q1 — Ampliar E2E (Playwright) ⛔
- **Objetivo:** cubrir flujos clave web además del smoke.
- **Tareas:** tests de chat, perfil, voto de playlist, RSVP, panel admin/dj (con mock o cuenta de prueba).
- **Archivos:** `e2e/*.spec.ts`.
- **Criterio:** CI corre los E2E en verde.

### PT Q2 — Matriz de pruebas móvil ⛔
- **Tareas:** probar en ≥2 versiones de Android (y iOS si aplica); anotar resultados.
- **Criterio:** matriz documentada; bugs abiertos como PT.

### PT Q3 — Pen-test ligero de RLS ⛔
- **Tareas:** con una cuenta normal, intentar leer/escribir datos ajenos/administrativos vía el cliente; confirmar que la RLS bloquea.
- **Criterio:** sin escalamiento de privilegios (complementa S3/S6).

---

# BLOQUE G — Branding / Marketing / Lanzamiento

### PT BR1 — Tagline definitivo ⛔
- **Tareas:** elegir el tagline (se quitó "Música acelerada, eventos reales"); aplicarlo en home/OG/README.
- **Criterio:** tagline consistente en el sitio y docs.

### PT BR2 — `docs/BRANDING.md` ⛔
- **Tareas:** paleta (magenta/cyan/lime + superficies), logos, uso, tipografías, do/don't.
- **Criterio:** guía de marca completa y enlazada desde README.

### PT BR3 — OG images / favicon set ⛔
- **Tareas:** imágenes OG (genérica + por evento), favicon multi-tamaño, apple-touch-icon. (Se solapa con PT W5/M3.)
- **Criterio:** assets de marca listos y referenciados.

### PT BR4 — Plan de marketing / lanzamiento ⛔
- **Tareas:** retomar `docs/pt/pt-10-marketing-lanzamiento.md`; estrategia TikTok/IG, calendario, llamadas a la acción.
- **Criterio:** plan accionable con fechas.

### PT BR5 — Checklist de lanzamiento ⛔
- **Tareas:** dominio propio (¿?), analytics (privacy-friendly), aviso legal/privacidad, prueba final cross-device, anuncio.
- **Criterio:** checklist firmada antes de "lanzar".

---

# BLOQUE H — Pulido transversal

### PT P1 — Accesibilidad ⛔
- **Tareas:** contraste AA, labels en inputs, focus visible, `prefers-reduced-motion` (ya en perfil hi5) extendido, navegación por teclado.
- **Criterio:** Lighthouse a11y ≥ 90; sin trampas de foco.

### PT P2 — Performance ⛔
- **Tareas:** Lighthouse perf, lazy-load de imágenes/listas, revisar bundle, `next/image` donde aplique, caché.
- **Criterio:** perf ≥ 90 en móvil; sin regresiones.

### PT P3 — Estados de error/vacío consistentes ⛔
- **Tareas:** unificar loaders, empty states y manejo de error (web + móvil) con el lenguaje visual scenecore.
- **Criterio:** ninguna pantalla queda en blanco o con error crudo.

### PT P4 — Limpiar docs desincronizados ⛔
- **Tareas:** `docs/ARCHITECTURE.md` y `docs/ESTADO.md` mencionan `/api/download`/Cobalt (inexistentes); actualizar o marcar superado (ya se hizo con `pt-11`/DESCARGADOR).
- **Criterio:** sin referencias a piezas eliminadas.

---

## Resumen de "lo que falta" en una línea por bloque
- **A Web:** Perfil hi5 Fase B (guestbook + reactions), feed personalizado, SEO/OG, verificación de cuenta; DJ↔perfil aparcado.
- **B Backend:** `site_settings_setup`, migraciones nuevas (guestbook/reactions/feed), auditoría RLS, fix `verify-schema`.
- **C Móvil:** **probar en dispositivo**, icono/splash, push (decisión), build EAS, publicar (Play Store vs APK), paridad.
- **D Desktop:** **repo público**, icono, firma de código.
- **E Infra:** Zero Trust (cablear o descartar), media-service sleep/Arch, env única, backups.
- **F QA:** E2E ampliado, matriz móvil, pen-test RLS.
- **G Branding:** tagline, BRANDING.md, OG, marketing, checklist de lanzamiento.
- **H Pulido:** a11y, performance, estados vacíos, limpieza de docs.
