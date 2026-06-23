# Changelog

Historial real de lo construido. Lo más reciente arriba.

---

## 2026-06-23 — Clave de seguridad admin, fixes de player y asistente

- ✅ **Clave de seguridad para acciones destructivas** en `/admin`: vaciar playlist,
  eliminar usuarios o eventos piden una clave extra (`ADMIN_DANGER_KEY`) además del confirm.
  Barrera anti-accidentes (la seguridad real sigue siendo la RLS de Supabase).
- ✅ **Warning de postMessage de YouTube eliminado**: el player solo postea al iframe
  cuando ya cargó (flag `iframeReadyRef` + `onLoad`). Adiós a "target origin does not match".
- ✅ **Asistente más resistente**: reintenta con otro modelo también ante 5xx transitorios
  de Google (antes un 500/503 puntual daba 502). Mensaje amable si todos fallan.

---

## 2026-06-23 — Calidades de descarga, asistente Gemini, fixes

### Descargas
- ✅ **Calidad + tamaño antes de bajar**: `getInfo` resume las calidades de MP4 (altura +
  tamaño aprox) y el tamaño del MP3. Nuevo `DownloadMenu` ("Descargar ▾") muestra las
  opciones con su peso y deja elegir antes de descargar.

### Asistente (Gemini)
- ✅ Ruta `/api/assistant` (Gemini, key server-side `GEMINI_API_KEY`) + chat flotante
  "Nightie" (`Assistant.tsx`) montado en el layout. Ayuda a los usuarios a usar la web.
  Requiere `GEMINI_API_KEY` en Vercel; sin ella, el chat avisa que no está configurada.
- ✅ **Funciona en el tier GRATUITO**: la ruta prueba varios modelos vigentes
  (gemini-2.5/2.0 flash-lite) y usa el primero con cuota. Verificado en producción
  respondiendo con `gemini-2.5-flash-lite`. No requiere facturación. (Los modelos 1.5
  ya no existen en 2026.)

### Fixes
- ✅ **Subida de fotos/personalización**: `supabase/phase-g.sql` arregla las políticas del
  bucket `media` (error "new row violates row-level security policy").
- 🔎 **Spotify 502 diagnosticado**: el endpoint ahora revela el status real → Spotify
  devuelve **403 Forbidden** (restricción del lado de Spotify, no bug nuestro).

---

## 2026-06-23 — Descargas YouTube en Render + Spotify reproducible

### Media-service (arreglos para que YouTube funcione en Render)
- ✅ **Fix crash read-only**: yt-dlp reescribe el cookies.txt cuando YouTube rota las
  cookies, pero `/etc/secrets` en Render es read-only → `OSError: Read-only file system`.
  Ahora se copia el archivo a `/tmp` (escribible) al arrancar y se usa esa ruta.
- ✅ **deno** instalado en la imagen Docker (runtime JS que yt-dlp necesita para el reto
  nsig de YouTube; antes: "No supported JavaScript runtime could be found").
- ✅ Logs de error reales en `/api/download` (diagnóstico desde Render).

### Spotify → reproducible y descargable
- ✅ Nuevo endpoint `POST /api/search` (yt-dlp `ytsearch1:`) + `searchYouTube()` en el
  cliente. Al sugerir una canción importada de Spotify, se **busca su equivalente en
  YouTube** y se guarda ESE link → la canción queda reproducible en el player y descargable.
  Si el media-service no responde, cae al link de Spotify (solo pedido al DJ).

> Pendiente del lado del usuario: las cookies de YouTube exportadas estaban **vencidas**
> ("cookies are no longer valid"). Hay que re-exportarlas con el método incógnito.

---

## 2026-06-23 — Subida de imágenes (avatar + flyer)

- ✅ **Foto de perfil (avatar)**: el avatar del perfil ahora se puede subir (antes era
  siempre un icono). Sube a Storage (`uploadMediaFile`) → `profiles.avatar_url`
  (`updateProfileAvatar` en la capa de datos) y se refresca la sesión. Hover = cámara.
- ✅ **Flyer de evento por archivo**: el formulario de `/admin → Eventos` ahora permite
  **subir un archivo** (imagen/MP4/MP3) además de pegar URL.
- Verificado en preview: home sin el bucle (consola limpia), perfil con avatar + botón
  Consola, playlist con panel de Spotify.

---

## 2026-06-23 — Fixes de estabilidad + opacidad por sección

### Bugfix crítico
- ✅ **Bucle infinito de render** (spam de `postMessage` + React #418): `PlayerContext`
  recreaba sus funciones en cada render → el listener de YouTube en `GlobalPlayer` se
  re-suscribía sin parar y los `infoDelivery` (muchos/seg) lo retroalimentaban. Memoizado
  con `useCallback`/`useMemo`; handler con guard de "fin único" + filtro de `origin`.

### Admin
- ✅ **Correos N/A en Gestión de Usuarios**: `profiles` no guardaba email. Nueva migración
  [`supabase/phase-f.sql`](../supabase/phase-f.sql) (añade `profiles.email` + backfill +
  trigger actualizado; también `profiles.bg_url`).
- ✅ **Acceso a `/admin` por rol real**: botón "Consola admin/DJ" visible solo en el perfil
  de staff; `/admin` pasa directo si el rol real es admin/dj (la contraseña maestra queda
  como respaldo de emergencia).

### Diseño
- ✅ **Opacidad por sección**: nuevo componente `SectionBg` (reemplaza el patrón repetido
  img+BgEditor en la home). Cada fondo guarda su opacidad (`bg_opacity_<sección>` en
  `site_settings`) ajustable con un slider en `BgEditor`. Soporta **video** (MP4/WebM) de fondo.

### Descargas
- ✅ **Errores reales de yt-dlp**: `media-service` ahora captura el stderr y devuelve el
  motivo legible (p. ej. "YouTube bloquea la IP → faltan cookies", "video privado") en vez
  de un genérico "Error en descarga".
- ✅ Ruta `/` informativa en el media-service (antes daba 404 al abrir la URL).

### Spotify
- ✅ **Importar de Spotify en la página de Playlist**: nuevo panel "Importar de Spotify"
  (botón junto a "Sugerir canción") que lee una playlist pública vía `/api/spotify/tracks`
  y permite sugerir cada track al DJ con un click. Antes esto solo existía, escondido, en
  `/perfil`, y la página de Playlist solo aceptaba enlaces de YouTube.

---

## 2026-06-20 — Fase 1 (en progreso)

### Documentación
- Creada carpeta `docs/` con `README`, `ROADMAP`, `DECISIONS`, `ARCHITECTURE`, `CHANGELOG`.

### Navegación / IA
- ✅ Quitados `Admin` y `Retos` del nav público. Nav = Eventos · Playlist · Disfraces · Perfil.
- ✅ `Admin` solo por URL `/admin` con rol `dj`/`admin` (ya gateado por `isStaff`).
- ✅ Ícono de **notificaciones** (campana) en la barra, para usuarios con sesión.
- ✅ Contenido de Retos (racha, encuesta, fans, historial) movido al **feed de Eventos**
  vía nuevo componente `DailyChallenges`. `/encuestas` ahora redirige a `/`.
- ✅ `Perfil` gateado: sin sesión muestra aviso para iniciar sesión.

### Branding
- ✅ Tagline nuevo en hero: "El club de nightcore de Arequipa." (subcopy menciona a Yorch).
- ✅ Footer y metadata acreditan a **Yorch** (organiza) y **Los Simpatizantes de JP** (web),
  proyecto público sin fines de lucro.

### Disfraces · evento + fecha
- ✅ Selector de evento en el formulario; solo lista eventos vigentes o terminados hace
  ≤ 1 semana (regla "subible hasta 1 semana después"). Se guarda `event_id` y se muestra el
  evento en cada tarjeta.

### Temáticas de la comunidad
- ✅ Nueva tabla `themes` + RPC `click_theme` + RLS en `schema.sql`. Funciones en la capa de
  datos (`getThemes`/`addTheme`/`clickTheme`). Componente `ThemesSection` en el feed de Eventos:
  sugerir temáticas y clickearlas; ranking por clicks (top 10 = populares).

### Confirmación por email
- ✅ Flujo ya cubierto por `AuthModal` (registro → "revisa tu correo"). Documentado en
  `supabase/README.md` el toggle **Confirm email: ON** (anti-multicuenta, fase 1).

### Perfil enriquecido
- ✅ `getUserActivity` en la capa de datos. El perfil muestra **insignias de asistencia**,
  stats (publicaciones / comentarios / likes), miniaturas de mis disfraces y mis comentarios.

### Feed de la comunidad (versión inicial)
- ✅ `CommunityFeed` en Eventos: muestra las publicaciones recientes de disfraces.
  (Pendiente: mezclar debates/preguntas y personalizar por interés.)

---

## 2026-06-20 — Fondo con MP4 propios (resuelve embeds bloqueados)

- ✅ `songs.file_url` (MP4 propio) en `schema.sql` + tipos + `setSongFileUrl` en la capa de datos.
- ✅ **Consola DJ**: botón "Descargar a fondo" por canción → `storeBackup` (media-service
  descarga MP4 → Supabase Storage) → guarda `file_url`. Indicador si ya está en el fondo.
- ✅ `VideoBackground` reescrito: si hay canciones con MP4 propio, las usa vía `<video>`
  (sin restricción de embed de YouTube), agrupadas por autor; si no, cae a la lista curada de
  YouTube. Así los videos sugeridos que YouTube no deja embeber se ven igual una vez descargados.
- ⚠️ La descarga real corre en el media-service (servidor Arch). `yt-dlp` no está disponible en
  el entorno de desarrollo ni en Vercel.

---

## 2026-06-20 — Fase 2 · Fondo de video + media-service

### Fondo de video con reproductor (Fase 2)
- ✅ `VideoBackground`: fondo fijo detrás de todo el contenido de Eventos. Cambia de autor con
  el scroll (cross-fade). Reproductor flotante: **audio on/off global**, pausar video,
  pista anterior/siguiente (mismo autor) y siguiente autor.
- ✅ `.card` ahora translúcida con blur para que el video se perciba detrás (glass limpio).

### Media-service (paquete desplegable — Fase 2/3)
- ✅ Carpeta `media-service/` (Node/Express, reusa `bot-erp`): `/api/info` (comprobante de
  disponibilidad), `/api/download` (stream mp3/mp4), `/api/store` (descarga + sube a Supabase
  Storage). Con `.env.example` y `README.md` de despliegue en Arch (yt-dlp, ffmpeg, HTTPS).
- ✅ Cliente frontend `src/lib/media.ts` (`checkVideo`/`downloadMedia`/`storeBackup`) con
  degradación si `NEXT_PUBLIC_MEDIA_SERVICE_URL` está vacío.

### Integración en la UI (Fase 2/3)
- ✅ **Playlist**: al sugerir, valida el link (comprobante real con media-service; chequeo
  básico de YouTube sin él). Botones por canción: copiar enlace (siempre) y MP3/MP4 (cuando
  el media-service está conectado).
- ✅ **Consola DJ** (admin): botón "Descargar set (MP3)" de la cola (cuando hay media-service).

### Pendiente (post-fases / cuando se decida)
- Desplegar el media-service en el Arch + poner `NEXT_PUBLIC_MEDIA_SERVICE_URL` (decisión 2 de
  DECISIONS.md). Hasta entonces, descargas deshabilitadas con aviso.
- Personalización del feed por interés; OTP WhatsApp (si hay abuso).
- Verificación de asistencia a eventos (QR/código de staff).

---

## 2026-06-20 — v0.1 · Cimiento + rediseño

### Backend / datos
- `supabase/schema.sql`: 15 tablas, ENUMs, triggers (recálculo de votos, racha `daily_check_in`,
  auto-creación de perfil) y **RLS completas**. `supabase/seed.sql` con datos demo.
- `.env.local.example` y `supabase/README.md` (guía de conexión).

### Capa lógica (nueva)
- `src/lib/types.ts`, `src/lib/demo-data.ts`, `src/lib/data.ts` (capa de datos dual
  Supabase/localStorage), `src/lib/auth.tsx` (`AuthProvider`), `src/components/AuthModal.tsx`.

### Rediseño (más limpio)
- Nuevo sistema de diseño en `globals.css` (tokens + utilidades `.card`/`.btn`/`.input`/
  `.badge`/`.track`). Menos glows/animaciones.
- `Hero.tsx` ligero reemplaza al `CinematicHero` (eran 5 iframes de YouTube en autoplay).
- Las 6 páginas y el navbar reescritos y conectados a la capa de datos.
- Build, TypeScript y lint en verde. Verificado visualmente con capturas.
