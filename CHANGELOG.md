# Changelog — Glitch AQP (antes Nightcore AQP)

Formato: `[vX.Y.Z] YYYY-MM-DD — descripción breve`.  
Versión semántica: MAYOR.MENOR.PATCH (la app web no tiene número de versión forzado; el desktop-app sí).

---

## [Unreleased] — Web

> **Versionado del sitio:** v1.0 = base Nightcore AQP (tag `v1.0`), v1.1 = rebrand Glitch AQP
> + funciones admin (tag `v1.1`, entradas (a)–(e) de abajo). Lo siguiente es la **v1.2**:
> identidad "Internet 2010 + Nightcore + Windows XP + Winamp + neón + anime + Arequipa".

### 2026-07-07 (t) — NΞON explica cómo hacer cada tarea admin + match robusto

- **feat(neon): guías "cómo hago X" del panel.** Preguntas "cómo cambio un rol", "cómo
  creo un evento", "cómo apruebo una asistencia", "cómo modero comentarios", "cómo cambio
  el fondo"… y NΞON responde con los **pasos reales** + botón que abre la pestaña correcta
  (`ADMIN_HOWTO` en neonActions.ts). Sin inventar nada.
- **fix(neon): match robusto ante palabras intercaladas.** Normalización que quita
  artículos/preposiciones ("cambiar UN rol", "ver LOS usuarios", "gestión DE dj") del
  texto y de las claves, así frases naturales sí disparan la acción. Verificado:
  "como cambiar un rol" → pasos completos; antes caía a la IA.

### 2026-07-07 (s) — NΞON guía a los admins por el panel + anti-alucinación

- **feat(neon): guía por el panel admin.** Si eres admin y preguntas por Métricas,
  Usuarios, Eventos, Encuestas, Disfraces, Comentarios, Insignias, Buzón, Bloques o
  Diseño, NΞON te da un botón que **navega a /admin, ABRE la pestaña** (click real) y la
  resalta. Nuevo `ADMIN_TABS` en `neonActions.ts`; `data-neon-target="tab-<id>"` en las
  pestañas; NeonSpotlight ahora puede hacer clic además de resaltar.
- **fix(neon): la IA ya no inventa rutas.** Gemini alucinaba secciones falsas
  ("Configuración → DJ Dashboard"). El system prompt ahora incluye la estructura REAL
  del panel (pestañas exactas, roles en Usuarios, DJ también en /dj) y una regla estricta
  de no inventar rutas. "gestión de dj" ahora abre la Consola DJ real.
- Verificado en preview (como admin): "donde veo los usuarios" → botón → /admin con la
  pestaña Usuarios abierta y resaltada; "gestión de dj" → botón Consola DJ. tsc/build ok.

### 2026-07-07 (r) — NΞON guía con botones + conciencia de permisos

- **feat(neon): acciones guiadas con botones.** Si pides algo ("quiero subir mi disfraz",
  "sugerir canción", "reservar", "descargar", "encuestas", "chat", "perfil", "buzón"),
  NΞON responde con un botón que **navega a la ruta** y **resalta el elemento clave**
  (`NeonSpotlight` + `data-neon-target` en Subir disfraz / Sugerir canción / Reservar).
  Todo local, sin API. Nuevo `src/lib/neonActions.ts`, `src/components/NeonSpotlight.tsx`.
- **feat(neon): conciencia de permisos (no da accesos).** "quiero ser DJ/admin" → explica
  que NΞON no puede otorgar el rol (lo decide un admin / requiere credencial). Rutas de
  staff ("consola dj", "panel admin") solo muestran el botón si tu rol lo permite; si no,
  NΞON dice que no puede llevarte. La autorización real sigue siendo la RLS.
- **fix(css): glow del spotlight en longhand** (Lightning CSS/Tailwind v4 rompía el
  shorthand `animation:` poniendo el nombre en `none`). Respeta `prefers-reduced-motion`.
- Verificado en preview: "subir disfraz" → botón → navega a /disfraces y resalta el
  botón; "quiero ser dj" → sin botón, mensaje explicativo. `tsc`/build verdes.

### 2026-07-07 (q) — Config del APK lista para compilar

- **chore(mobile-app): app.json listo para producción.** name "Glitch AQP", slug
  `glitch-aqp`, `android.package` = `com.glitchaqp.app` (obligatorio para compilar),
  `versionCode` 1, adaptiveIcon con fondo de la marca, y **plugins de permisos**:
  `expo-media-library` (guardar descargas en galería) + `expo-image-picker` (subir
  cosplay). eas.json ya generaba `.apk` en preview/production.
- **docs**: `mobile-app/COMO-COMPILAR-APK.md` — guía copy-paste para compilar con EAS
  (requiere cuenta Expo del dueño; el binario no se puede generar sin su login).

### 2026-07-07 (p) — Muro de comentarios en el APK + verificación general

- **feat(mobile-app): muro de comentarios del evento.** El HomeScreen ahora muestra el
  muro del próximo evento (comentar si hay sesión + lista de comentarios), espejo de la
  web: `getComments`/`addComment` en `mobile-app/lib/data.ts` → tabla `event_comments`,
  misma RLS (lectura pública, insert solo con `auth.uid() = user_id`). Respeta
  `comments_enabled` del evento. Verificado: sintaxis (esbuild) y tipos consistentes;
  el typecheck final lo hace EAS al compilar el APK.
- **Ronda de verificación** (sin cambios de comportamiento): confirmado que el APK cubre
  eventos/RSVP, disfraces, playlist, chat, encuestas, perfil, historial y descargas; que
  NΞON apunta bien a las ayudas + datos en vivo; sin secretos hardcodeados ni XSS.

### 2026-07-07 (o) — Proxy de releases en Render + pantalla de descargas del APK

- **feat(media-service): proxy de releases.** El repo privado dejaba el `.exe`/`.apk` en
  404 para el público. Nuevo `GET /api/release/{exe|apk|file/:name}`: localiza el asset
  del último release con `GITHUB_TOKEN` (solo server) y **redirige 302** a la URL firmada
  de GitHub (sin gastar ancho de banda de Render, caché 5 min). Config: `GITHUB_TOKEN`
  fine-grained (Contents: Read) en Render. La web (`DownloadInstructionsModal`,
  `perfil/descargas`) y `Instalar_Descargador.bat` ya apuntan al proxy.
- **feat(mobile-app): pantalla Descargas del APK** (`app/descargas.tsx`, Fase A del
  plan): pega enlace → MP3/MP4 720p → el media-service procesa → se guarda en la
  galería (expo-file-system SDK 56 `File.downloadFileAsync` + media-library
  `Asset.create`). El acceso "Descargas" de la home del APK estaba roto (la ruta no
  existía) — ya funciona. Falta: compilar con EAS y subir el `.apk` al release.
- ⚠️ Auto-update del `.exe` instalado sigue roto con repo privado (documentado en
  DESCARGADOR.md §4.5 con la solución para la próxima release).

### 2026-07-07 (n) — NΞON ve tu actividad + pop-up del .bat

- **feat(neon): actividad del usuario en tiempo real.** El chat envía a NΞON quién eres
  (nombre, puntos, racha) y **qué canción está sonando ahora** — responde personalizado
  y puede comentar lo que escuchas. Se suma a los DATOS EN VIVO de la BD (eventos, top
  playlist, encuesta activa; caché 60s, anon key + RLS, cero secretos nuevos).
- **feat(descargas): pop-up post-descarga del .bat** (`BatHelpModal`): al bajar un .bat
  desde Playlist o Descargas aparece un modal simple con 3 pasos (ábrelo con doble clic
  → se prepara solo la 1ª vez → tu música queda en Escritorio\NightcoreAQP) + nota de
  seguridad. Verificado en preview (aparece tras descargar y cierra bien).
- ⚠️ **Aviso pendiente:** el repo está PRIVADO → la descarga pública del `.exe` desde
  GitHub Releases da 404 a los usuarios (al dueño le funciona por su sesión). Decidir:
  volver a público, o mover el instalador a Supabase Storage.

### 2026-07-07 (m) — NΞON reactiva + descargador para no técnicos

- **feat(neon): Fase 3 — reacciones a la música.** Con el chat ABIERTO, cuando arranca
  una canción NΞON comenta («Frecuencia sincronizada…», «Nuevo BPM detectado…», rotando)
  con límite anti-saturación: máx. 1 cada 2 min, nunca con el fondo idle, sin llamar a la
  API (`Assistant.tsx` + `usePlayer`). También: easter eggs 2000s (Konata, Miku, XP, MSN,
  Ares, Rakion, GunBound, StepMania, Happy Hardcore) y saludo según la hora (Fase 2).
- **feat(descargador): lanzador para no técnicos** `public/downloads/Instalar_Descargador.bat`:
  si la app ya está instalada la abre; si no, baja el Setup OFICIAL del release de GitHub
  y lo ejecuta, explicando en pantalla qué hace (y el aviso de SmartScreen). No descarga
  canciones — solo instala/abre la app.
- **feat(desktop-app): "🧰 Exportar herramientas".** Botón en la topbar que copia
  yt-dlp/ffmpeg/ffprobe/deno de `userData/bin` a una carpeta elegida (+ `LEEME.txt`),
  SIN las canciones descargadas (IPC `export-tools` en main + preload + renderer).
  Nota: el `.exe` se compila en CI al publicar release (local sin node_modules).
- Verificado: `tsc --noEmit` limpio, `npm run build` OK, home y NΞON sin errores en
  preview; sintaxis de los 3 archivos del desktop-app validada con Node.

### 2026-07-07 (l) — Roles reales, NΞON y limpieza (pendiente aplicar SQL)

- **fix(roles): el cambio de rol ya persiste.** Causa: `updateProfileRole` hacía un
  `UPDATE` directo a `profiles` que la RLS filtraba (0 filas, sin error) → el rol volvía
  a USER. Ahora pasa por el RPC `admin_set_role` (SECURITY DEFINER): valida admin, exige
  **credencial-hash** para promover a ADMIN, y audita en `admin_logs`. La función devuelve
  `{ ok, error }` y el panel muestra el error real. SQL en `supabase/phase-roles.sql`
  (**pendiente de ejecutar**; el hash lo fija el propietario con `crypt`/`gen_salt`).
- **feat(roles): DJ solo ve lo suyo.** En `/admin` un DJ solo accede a Métricas, Consola
  DJ y Encuestas (`DJ_TABS`); el admin ve todo (ROLES.md). La RLS sigue siendo la verdad.
- **feat(neon): "Nightie" → NΞON.** Nuevo cerebro (`api/assistant`) con identidad, lore
  2012, tono y lenguaje de frecuencias/BPM; recibe `role`/`page` para ajustar el tono
  (sin dar permisos). El componente añade saludo de 1ª visita/regreso y comandos `/…`
  locales (sin gastar cuota): `/help /status /neon /version /ping /glitch /profile …`.
- **perf/clean(home): código muerto.** `VideoBackground` y `ScenecoreBackground` estaban
  importados en `page.tsx` pero **nunca se renderizaban** → imports quitados y archivos
  borrados. También se borró `CommunityFeed.tsx` (versión inicial, ya reemplazada por
  `LiveFeed`, sin imports). El único fondo de video sigue siendo `fondoscenecoe.mp4`
  (GlobalPlayer).
- **perf(player): pausa el fondo idle en pestañas ocultas.** El `<video>` de fondo
  (`fondoscenecoe`) seguía decodificando en segundo plano (CPU/GPU/batería en equipos
  modestos). Nuevo efecto `visibilitychange` que lo pausa cuando `document.hidden` y lo
  reanuda al volver — solo el fondo decorativo (type `default`); si el usuario escucha
  algo (yt/stream) no se toca.
- **docs/ux(descargador): copy más claro.** El modal de descargas explica que baja de
  YouTube/TikTok/Instagram/Facebook (MP3/MP4) y que el instalador prepara solo yt-dlp/
  ffmpeg. Spec de pendientes P4 en `docs/DESCARGADOR.md §6.5`.
- Verificado: `tsc --noEmit` limpio; **`npm run build` OK**; preview OK (home sin errores,
  NΞON saluda y `/status` responde local; video de fondo pausa correctamente con la
  pestaña oculta). Detalle: `docs/pt-v1.2-p1/PT-IMPLEMENTACION.md`.

### 2026-07-06 (k) — Branding completo: íconos, favicon y OG image de Glitch AQP

- **Íconos nuevos** (`scripts/gen-icons.mjs`, SVG → PNG con sharp): antes el ícono de la
  PWA/OG era el FLYER del Nightcore Fest 2.0. Ahora: "GLITCH AQP" con RGB split,
  scanlines, barra de tear y franjas de la paleta (512/192/favicon.ico 48px PNG-in-ICO).
- **OG image propia** `public/og.png` (1200x630) con tagline — `layout.tsx` la usa en
  Open Graph y Twitter pasa a `summary_large_image`.
- Regenerar todo: `node scripts/gen-icons.mjs`.
- `sw.js` → `nq-cache-v4` (los íconos viejos estaban precacheados).

### 2026-07-06 (j) — Sets del DJ publicables + marquesina Winamp

- **"Sets del DJ" dejó de ser placeholder**: el admin publica sets desde
  **Admin → Bloques** eligiendo la sección nueva **"🎧 Sets del DJ"** (anuncio, enlace,
  imagen o video — misma infra `custom_blocks`, sin SQL nuevo). La home los renderiza
  en la sección Sets; sin bloques, se mantiene el placeholder (prop `fallback` nueva
  en `CustomBlocks`). El admin ahora carga y lista los bloques de ambas secciones.
- **Marquesina en el LCD Winamp**: cuando suena una canción, el título se desplaza en
  loop continuo como el Winamp real (`.winamp-marquee`, texto duplicado → loop -50%
  perfecto). En idle ("Glitch AQP") queda estático. Respeta `prefers-reduced-motion`.
- Verificado en preview: publicar set → aparece en la home; borrar → vuelve el
  placeholder; marquesina y ecualizador andando.

### 2026-07-06 (i) — v1.2: player con skin Winamp

- **La barra flotante de la radio (GlobalPlayer) ahora es un Winamp clásico**:
  chasis metálico azul-acero (`.winamp-bar`), pantalla **LCD verde fosforescente**
  con fuente mono para artista/título (`.winamp-lcd`) y **mini ecualizador de 5
  barras** que baila con la música y se aplana en pausa (`.winamp-eq`).
  Los controles (play/pausa, skip, mute, menú) no cambian de comportamiento.
- Respeta `prefers-reduced-motion` (el ecualizador no anima).

### 2026-07-06 (h) — Un solo video de fondo en todo el sitio (fondoscenecoe)

- **Playlist ya no tiene video propio por defecto**: `DEFAULT_PAGE_VIDEOS` quedó vacío →
  todas las páginas (eventos, playlist, chat, buzón, historial, descargas, dj, perfil…)
  muestran el MISMO fondo: el idle de la radio (`fondoscenecoe.mp4`, el video original).
- **Se quitó `GlitchBackground`** (el video global automático del tema glitch): se
  superponía con el idle de la radia cuando el tema estaba activo. Si se quiere ese video,
  se asigna desde Admin → Diseño → Videos de fondo por página con "Todas las páginas"
  (así el idle se oculta solo y nunca hay dos videos).
- El gestor de videos por página sigue igual: cualquier asignación del admin pisa el idle
  en esa ruta, sin superposición.
- SQL: nada nuevo que correr. (Sigue pendiente de siempre `site_settings_setup.sql` SOLO
  si el gestor de diseño no persistiera en prod.)

### 2026-07-06 (g) — v1.2: Windows XP en TODO el perfil

- **`src/components/XPWindow.tsx`** (nuevo): ventana XP reutilizable (titlebar Luna +
  _ □ ✕ + cuerpo beige). `onClose` opcional para la ✕.
- **Todas las secciones de `/perfil` son ventanas XP**: Personalizar perfil, Perfil+
  (bio/links/galería), Mi estilo — Propiedades de pantalla, Notificaciones, Mis entradas,
  Insignias de asistencia, Mi actividad, Playlist de Spotify, Canciones de tu playlist y
  Mis canciones guardadas. La cabecera social (portada + avatar) se queda neón a propósito
  (contraste "2010 vs moderno").
- **Overrides `.xp-window`** en globals.css: tarjetas/badges/botones/inputs internos se
  aclaran al estilo clásico (beige/azul XP) automáticamente — cualquier contenido del sitio
  metido en una XPWindow se adapta sin tocar su JSX.

### 2026-07-06 (f) — v1.2: glitch en momentos clave + editor de perfil Windows XP

Filosofía v1.2: si todo tiene glitch, deja de destacar → el efecto aparece solo en
momentos concretos (intencional y memorable).

- **Glitch en momentos clave** (`globals.css` bloque "Glitch en MOMENTOS CLAVE"):
  - Logo: desplazamiento 2–3px con separación RGB al hover (`.glitch-shift` + `.glitch-text`).
  - **Canción empieza** → destello glitch de ~250ms en toda la pantalla (GlobalPlayer añade
    `nq-glitch-flash` al `<html>`; keyframes `glitchSongFlash`).
  - **Botones** → distorsión breve solo al hacer CLICK (`.btn:active`: skew + RGB shadow).
  - **Carga de la web** → interferencia CRT de "monitor encendiéndose" (~0.9s), una vez por
    sesión (`src/components/CRTBoot.tsx` + `.crt-boot`; sessionStorage `nq_crt_boot_done`).
  - Todo respeta `prefers-reduced-motion`.
- **Editor de perfil estilo Windows XP** (`.xp-window/.xp-titlebar/.xp-btn` en globals +
  `src/app/perfil/page.tsx`): "Personalizar perfil" ahora es una ventana XP Luna — barra de
  título azul con botones _ □ ✕ (✕ cierra), cuerpo beige `#ece9d8`, inputs blancos clásicos
  y botón "Guardar cambios" estilo XP. Los overrides pisan las utilidades neón dentro de
  la ventana.

### 2026-07-06 (e) — Perfil propio remasterizado + gestor de videos de fondo por página

- **Perfil propio con el mismo modelo social** (`src/app/perfil/page.tsx`): el "Fondo del
  Perfil" ahora es una PORTADA (banda superior de la tarjeta) y el avatar va montado sobre
  ella (grande, borde grueso), como el perfil público. Editor/privacidad/stats intactos.
- **Gestor admin "Videos de fondo por página"** (Admin → Diseño):
  - `src/lib/pageVideos.ts`: catálogo de páginas + parse/resolve; se guarda en
    `site_settings[design_page_videos]` (JSON pageKey→url). Default de fábrica:
    Playlist → `/section-glitch.mp4` (el admin puede quitarlo).
  - `src/components/PageVideoAdmin.tsx`: subir video o pegar URL, marcar páginas
    (una, varias o "Todas las páginas") y asignar; lista con mini-preview y quitar.
  - `src/components/PageVideoManager.tsx` (montado en layout): renderiza el video que
    toca en la ruta actual; live-update vía `nq-design-updated`. Expone `usePageVideoUrl`.
  - **GlobalPlayer**: el fondo idle de la radio se oculta automáticamente en cualquier
    página con video asignado (generaliza el fix (d) que era solo /playlist); el hardcode
    de PageVideoBg en /playlist se movió al default del gestor.
- Verificado en preview: asignar video a Chat desde el admin → /chat lo muestra sin
  superposición; /playlist conserva su default; /disfraces intacta.

### 2026-07-06 (d) — Playlist sin video superpuesto, foto de perfil, alias únicos y perfil social

- **Playlist**: el fondo idle de la radio (`fondoscenecoe.mp4`, GlobalPlayer) ya no se pinta
  en `/playlist` (se superponía con el video glitch de la sección). Al reproducir algo, el
  visual del player vuelve a mostrarse. Disfraces quedó con su fondo original (pedido del dueño).
- **Perfil propio** (`src/app/perfil/page.tsx`):
  - Campo nuevo **"Foto de perfil (el círculo)"** en el editor, separado del "Fondo del Perfil
    (detrás de la tarjeta)" — antes la única subida visible iba al fondo y parecía que la foto
    "se ponía en toda la pantalla".
  - **Alias únicos**: al guardar, se valida contra los usernames de otros usuarios
    (case-insensitive, ignora @); error visible si está tomado.
  - El "Sobre mí" (bio) ahora se muestra también en el perfil propio.
- **Perfil público estilo red social** (`src/app/perfil/[id]/page.tsx`):
  - **Portada** con `bg_url` (o gradiente si no hay), avatar circular montado sobre ella,
    nombre grande y contador de amigos.
  - Botones **"Agregar a amigos"** (toggle; usa `profile_reactions` con `reaction='friend'`,
    tabla existente — sin migración) y **"Mensaje"** (→ /chat). En el perfil propio:
    "Editar mi perfil". Ocultos en perfiles privados.
  - La fila de Fives no cuenta los 'friend' (solo sus 5 tipos).
- Verificado: tsc limpio, build OK, prueba funcional en preview (toggle de amigos 0→1,
  campos del editor, un solo video en /playlist).

### 2026-07-06 (c) — Fix SW en dev, fondo de perfil contenido y "Mi estilo" pulido

- **Service worker solo en producción** (`src/components/PWARegister.tsx`): en dev el
  sw.js servía estáticos cache-first → localhost mostraba código viejo ("no veo los
  cambios"). Ahora en dev se des-registra y borra sus caches automáticamente.
- **Fondo del perfil contenido**: la foto subida se pintaba a PANTALLA COMPLETA
  (capa `fixed inset-0` en `src/app/perfil/page.tsx`); ahora vive solo dentro de la
  tarjeta del perfil, con la opacidad literal del slider y degradado arriba/abajo
  para legibilidad.
- **"Mi estilo" pulido** (`src/components/UserDesignPanel.tsx`): tarjetas de tema con
  franja-gradiente de la paleta, hint, hover con elevación y check ✓ brillante en el
  activo; acentos como círculos de color con glow y check; chip "Del tema" con franja
  multicolor.

### 2026-07-06 (b) — Videos de sección, eventos completos, perfil y "Mi estilo" por usuario

> Detalle completo del sistema glitch + personalización: **[docs/GLITCH.md](docs/GLITCH.md)**

- **Video de fondo por página** (`src/components/PageVideoBg.tsx`, nuevo): `/playlist` y
  `/disfraces` usan `public/section-glitch.mp4` (Veo 3). Fixed, z -17, opacidad baja;
  si el archivo no existe no se monta (nunca rompe).
- **Gradientes adaptados al tema**: `text-glow-rainbow` y las franjas del hero
  (`.rainbow-stripe`, nueva) usan variables del tema en vez de hex fijos.
- **Eventos completos en la home** (`src/app/page.tsx`, `src/components/Hero.tsx`):
  - DJs: salen para cualquier evento con DJs configurados (fuera el hardcode `'Cyberpunk'`
    y los DJs de relleno); "Extras" usa el campo `details` real.
  - Detalle: flyer + precio (`ticket_price` / "Entrada gratuita") + bullets de `details`.
  - Hero: flyer visible también en móvil (antes solo desktop `lg:`).
  - `FlyerMedia.tsx` (nuevo): flyer como imagen, MP4 o MP3 según su tipo real.
- **Perfil arreglado** (`src/lib/data.ts`, `src/app/perfil/page.tsx`):
  - `uploadMediaFile` demo: dataURL persistente (webp máx 1280px) en vez de blob
    `createObjectURL` que moría al recargar (avatar/fondo "se perdían").
  - `updateProfileAvatar` demo: actualiza también `nq_demo_profile`/`nq_local_profile`.
  - Opacidad del fondo literal (se quitó `mix-blend-screen` que lavaba la imagen).
- **"Mi estilo" — personalización POR USUARIO** (`src/lib/designPresets.ts`,
  `src/components/UserDesignPanel.tsx`, `DesignLoader.tsx`):
  - El admin define el default (site_settings); el usuario pisa tema/acento/fuentes/tamaño
    solo para él (localStorage `nq_user_design_<id>`; merge en DesignLoader, live-update
    vía evento `nq-user-design-updated`).
  - Catálogos de temas/fuentes/acentos unificados en `lib/designPresets.ts` (admin y
    perfil importan de ahí).
  - Panel en `/perfil` → "Personalizar perfil" → tarjeta "Mi estilo" (con reset "Del sitio").
- **Admin responsive**: tabla de asistentes por evento con scroll horizontal; modal del
  BgEditor con `max-w-[calc(100vw-2rem)]` (antes se desbordaba en pantallas angostas).
- **Verificado**: `tsc` limpio, `npm run build` OK, revisión visual en localhost
  (home, playlist, perfil, admin; override de usuario probado en vivo).

### 2026-07-06 — Rebrand a "Glitch AQP" + kit de estética glitch

- **Rebrand**: "Nightcore AQP" → "Glitch AQP" en todos los textos visibles de la web:
  metadata/OG/Twitter/PWA (`src/app/layout.tsx`, `src/app/manifest.ts`), navbar (`GLITCHAQP`),
  footer, chat, historial, perfil, player global, `.bat` del descargador y modal de descargas.
  *No* se tocó el desktop-app (appId/productName) ni las URLs de releases para no romper
  el auto-update; ese rename va aparte cuando se publique una release nueva.
- **Kit CSS glitch** (`src/app/globals.css`): `.glitch-text` (RGB split magenta/cián con
  slices animados; usa `data-text`), `.glitch-hover` (jitter + aberración cromática),
  `.scanlines` (overlay CRT por sección). Respeta `prefers-reduced-motion`.
- **Tema nuevo "Glitch"** (`html[data-theme="glitch"]` + entrada en THEME_OPTIONS del admin):
  paleta de corrupción digital (negro profundo, magenta/cían duros, verde fósforo) y, con el
  tema activo, scanlines + viñeta CRT global (`body::after`) y barra de "tear" que cruza la
  pantalla (`body::before`).
- **`GlitchBackground.tsx`** (nuevo): video de fondo en loop (`public/glitch-bg.mp4`, pensado
  para un clip generado con Veo 3) que solo se monta con el tema glitch activo; si el archivo
  no existe, no muestra nada. z-index -18 (entre ScenecoreBackground y el overlay).
- Aplicado: `.glitch-text` en logo del navbar y H1 del hero; `.glitch-hover` en el flyer.
- **Verificado**: `tsc --noEmit` limpio + `npm run build` OK.

## [Unreleased] — Mobile (Expo)

### 2026-06-26 (e) — Auditoría de Seguridad & Parche de Base de Datos
- **Seguridad en la Base de Datos (`supabase/schema.sql` y `fixes.sql`)**: 
  - Corregida vulnerabilidad crítica de escalamiento de privilegios en la tabla de perfiles (`profiles`). Se añade la función trigger `check_profile_update` y el trigger `trg_check_profile_update` para bloquear cambios no autorizados en columnas de administración (`role`, `points`, `streak_count`) desde la API del cliente (PostgREST / SDK de Supabase).
  - Actualizada la política RLS `profiles_update_own` a `profiles_update_own_or_admin` para permitir que los administradores editen perfiles ajenos (necesario para el funcionamiento del panel de administración), evitando que el RLS rechace las promociones de rol.
  - Verificado que todas las 20+ tablas poseen RLS activo, las variables de entorno están debidamente protegidas en plantillas de ejemplo, y no existen llaves administrativas (`service_role`) hardcodeadas en el código cliente.

### 2026-06-26 (d) — App móvil, Fase 3 DJ y Retos/Encuestas (§16)

Completadas las pantallas de la Fase 3 y la integración de fotos de cosplay:

- **PT 3.1 — Retos y Encuestas (`app/encuestas.tsx`)**: Check-in diario (racha de días y +5 pts) con lógica de comparación de fechas, encuesta activa con visualización de resultados y barras de porcentaje (voto inline), e historial de encuestas con ganadores.
- **PT 3.2 — Panel DJ móvil (`app/dj.tsx`)**: Guard de acceso para roles `dj` y `admin`. Listado de setlist en tiempo real ordenado por votos con capacidad de marcar canciones como tocadas, estadísticas de cola de reproducción, y listado de asistentes confirmados con códigos VIP.
- **PT 3.3 — Subida de Fotos de Cosplay (`app/disfraces.tsx`)**: Integración de `expo-image-picker` y Supabase Storage (bucket `media`) para permitir a los usuarios subir fotos de cosplay desde su galería directamente en el móvil, registrando el cosplay en la base de datos y otorgando puntos.
- **PT 3.4 — Muro de la Fama y Historial (`app/historial.tsx`)**: Listado de eventos pasados indicando si el usuario asistió ("Asistí"), y visualización móvil del Muro de la Fama (ranking de Top Fans, Himnos musicales y Hall del Cosplay).
- **Navegación e Integración**: Añadidos accesos directos en el Grid de la pantalla de Inicio (`index.tsx`) con un layout responsivo de 2 columnas, y botón de acceso al Panel DJ en el Perfil (`perfil.tsx`).
- **Verificado**: `npx tsc --noEmit` sin errores y `npx expo export --platform android` bundla correctamente todo el árbol de rutas y dependencias.

### 2026-06-26 (c) — App móvil, Fase 2 comunidad (§16)

Pantallas de comunidad como rutas de stack (PT 2.1–2.4):

- **PT 2.1** — `app/disfraces.tsx`: galería de cosplay + voto ❤ binario (optimista, `costume_votes`).
- **PT 2.2** — `app/chat.tsx`: chat en vivo con Supabase Realtime (`subscribeChat`). Requiere
  `phase-chat.sql` corrido en Supabase.
- **PT 2.3** — `app/actividad.tsx`: "Mi actividad" (mis reservas + mis canciones sugeridas).
  Reemplaza a NotificationsScreen porque no hay tabla de notificaciones en la BD.
- **PT 2.4** — sección "Comunidad" en el Home con enlaces; `lib/data.ts` ampliado
  (`getCostumes`, `setCostumeVote`, `getChatMessages`, `sendChatMessage`, `subscribeChat`,
  `getMySuggestedSongs`).
- Verificado: `tsc` limpio + `expo export --platform android` sin errores. Pendiente probar en
  Expo Go (y correr `phase-chat.sql` para el chat). Siguiente: Fase 3 (PT 3.x).

### 2026-06-26 (b) — App móvil, Fase 1 MVP (§16)

Expo Router + las 3 pantallas core. Organizado en partes de trabajo (PT 1.1–1.6):

- **PT 1.1** — Instalada y configurada Expo Router: `expo-router`, `react-native-safe-area-context`,
  `react-native-screens`, `expo-linking`, `expo-constants`, `@expo/vector-icons`, `babel-preset-expo`.
  `package.json main` → `expo-router/entry`; `app.json` con `scheme`, plugin y `typedRoutes`;
  `babel.config.js`.
- **PT 1.2** — Navegación: `app/_layout.tsx` (Stack + SafeAreaProvider + AuthProvider) y
  `app/(tabs)/_layout.tsx` (Tabs Inicio/Playlist/Perfil). Eliminados `index.ts` y `App.tsx`.
- **PT 1.3** — `lib/auth.tsx` (AuthProvider/useAuth con sesión Supabase) + `lib/data.ts` ampliado
  (`getAttendees`, `createRsvp`, `setSongVote`, `getProfile`, `updateMyProfile`).
- **PT 1.4** — `app/(tabs)/index.tsx`: HomeScreen con evento activo + RSVP.
- **PT 1.5** — `app/(tabs)/playlist.tsx`: PlaylistScreen con voto ▲ optimista.
- **PT 1.6** — `app/(tabs)/perfil.tsx`: ProfileScreen con login/registro/logout + vista de perfil.
- Verificado: `npx tsc --noEmit` limpio **y** `npx expo export --platform android` bundlea sin
  errores. **Pendiente probar en Expo Go/dispositivo** con `.env` real. Siguiente: Fase 2 (PT 2.x).

### 2026-06-26 (a) — App móvil, Fase 0 base (§16)

- **`mobile-app/lib/supabase.ts`** — cliente Supabase para RN: misma instancia que la web
  (anon key vía `EXPO_PUBLIC_*`), sesión persistida con AsyncStorage, auto-refresh por `AppState`.
- **`mobile-app/lib/types.ts`** — copia de los tipos del dominio (sin importar de `src/`).
- **`mobile-app/lib/theme.ts`** — tema oscuro scenecore (tokens neón + radius/space).
- **`mobile-app/lib/data.ts`** — lectores read-only (`getNextEvent`, `getSongs`) contra Supabase.
- **`mobile-app/App.tsx`** — home temática real (próximo evento + top playlist), reemplaza el stub.
- `mobile-app/.env.example` + `.env` añadido al `.gitignore`; `userInterfaceStyle` → dark.
- `npx tsc --noEmit` limpio en `mobile-app/`. **Pendiente probar en Expo Go** (no hay emulador
  en el entorno de desarrollo actual). Falta Fase 1: `expo-router` + pantallas Home/Playlist/Perfil.

## [Unreleased] — Web

### 2026-07-02
- **Pasarela de Disfraces**:
  - Removida la restricción temporal del selector de eventos en `/disfraces` para permitir listar todos los eventos del sistema.
  - Implementada la subida de imágenes a Supabase Storage (bucket `media`) mediante `uploadMediaFile` al registrar un disfraz en lugar de usar URLs locales temporales.
  - Añadida persistencia de comentarios de disfraces en la base de datos a través de la nueva función `addCostumeComment` en `src/lib/data.ts` y su mapeo en `getCostumes`.
  - Integrada la validación de inicio de sesión con `AuthModal` al votar, registrar un disfraz o escribir comentarios.
  - **Corrección de Error Crítico (React #418 Hydration Mismatch)**: Removida la expresión vacía `{ }` que causaba el fallo de hidratación en React en la vista de tarjetas de disfraces.
  - **Fallback de URL**: Añadido placeholder para disfraces con URLs locales `blob:` corruptas previas a la integración de Storage.
  - **Alineación de Tipos**: Añadido el campo `user_id` a la interfaz `CostumeComment` en `types.ts` para equipararlo con la tabla de Supabase.
- **Seguridad y Parche de Puntos (Bug 2 & Supabase Linter)**:
  - **Persistencia de Puntos**: Creada e integrada la función RPC `add_points(p_delta)` en Supabase (`security definer` con search_path e intervalo de delta restringido) para evitar que el trigger `check_profile_update` bloquee las llamadas legítimas de sumas de puntos en el cliente.
  - **Mitigación de Vulnerabilidades de Linter**: Creado `supabase/phase-security-hardening.sql` para añadir `search_path = public` a todas las funciones triggers de votos (`recompute_song_votes`, `recompute_costume_votes`, `recompute_survey_votes`) y revocar permisos de ejecución a la cuenta `anon` en funciones de administración (`handle_new_user`, `approve_attendance_proof`, `reject_attendance_proof`, `daily_check_in`).


### 2026-06-26 (d)

**Perfil hi5 — Libro de visitas & Reacciones (Fase B — §14)**

- **Creadas migraciones de Base de Datos**: `supabase/phase-guestbook.sql` y `supabase/phase-reactions.sql` con políticas de RLS e índices de rendimiento.
- **Implementados endpoints en la capa de datos dual** (`src/lib/data.ts`): Añadidas funciones CRUD y de suscripción en tiempo real con Supabase Realtime (`getProfileGuestbook`, `addGuestbookEntry`, `deleteGuestbookEntry`, `subscribeProfileGuestbook`, `getProfileReactions`, `toggleProfileReaction`, `subscribeProfileReactions`) y sus respectivas alternativas locales en `localStorage`.
- **Integrados componentes interactivos en el Perfil Público**:
  - **Fives (Reacciones)**: Botones interactivos con contadores en tiempo real (⭐ estrella, 💜 corazón, 💀 calavera, 🔥 fuego, 👾 fantasma). Control del estado activo y limitación de 1 reacción por tipo por usuario.
  - **Guestbook (Libro de visitas)**: Muro de firma para usuarios autenticados con avatares, RLS y borrado autorizado por dueño del perfil, autor del mensaje o staff.
  - **Modal de Auth**: Integrado `AuthModal` al interactuar sin sesión.
- Verificado y compilado con `npx tsc --noEmit` limpio.

### 2026-06-26 (c)

**Perfil hi5 — estética Web 2.0 scenecore, Fase A (§14)**

- **Nuevo `src/app/perfil/[id]/perfil.module.css`** — skin retro scoped SOLO a la página de
  perfil público. No toca `globals.css` ni el diseño global. Reutiliza los tokens del tema
  (`--magenta`/`--cyan`/`--lime`); el acento por perfil entra por `--perfil-accent`.
- `src/app/perfil/[id]/page.tsx` — aplica el skin: contenedor `.retro` con fondo de cuadrícula
  neón animada (A3), paneles con borde neón doble y barra de título (A1), nombre con glow
  pulsante (A2), caja decorativa "now spinning" con disco giratorio + marquesina (A4), galería
  estilo hi5 con thumbnails neón y hover-zoom (A6), y cursor de estrella en desktop (A5).
- Todas las animaciones respetan `@media (prefers-reduced-motion: reduce)`.
- `npx tsc --noEmit` limpio; verificado en preview (Lightning CSS compila `color-mix`/`conic-gradient`).

### 2026-06-26 (b)

**Panel DJ + gestión de roles (§15)**

- **Nueva ruta `/dj`** (`src/app/dj/page.tsx`) — panel simplificado para cabina:
  setlist más votado con "marcar tocada" (`setSongPlayed`), descarga del set como `.bat`
  local (toggle MP3/MP4 vía `buildCrateBat`), y lista de asistentes confirmados del evento
  activo. Guard por rol `dj`/`admin` reutilizando `useAuth()` (mismo criterio que `/admin`).
- **Navbar** (`src/components/Navbar.tsx`) — enlace "DJ" (icono Disc3) visible solo para
  cuentas con rol `dj`/`admin`, en desktop y en el drawer móvil.
- **Admin → Usuarios** (`src/app/admin/page.tsx`) — el cambio de rol ahora pasa por
  `handleRoleChange`: spinner (`savingRoleId`) mientras guarda y `confirm()` antes de
  promover a administrador. La búsqueda y el dropdown de rol ya existían.
- `npx tsc --noEmit` limpio; verificado en preview.

### 2026-06-26 (a)

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
