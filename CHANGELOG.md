# Changelog — Glitch AQP (antes Nightcore AQP)

Formato: `[vX.Y.Z] YYYY-MM-DD — descripción breve`.  
Versión semántica: MAYOR.MENOR.PATCH (la app web no tiene número de versión forzado; el desktop-app sí).

---

## [Unreleased] — Web

> **Versionado del sitio:** v1.0 = base Nightcore AQP (tag `v1.0`), v1.1 = rebrand Glitch AQP
> + funciones admin (tag `v1.1`, entradas (a)–(e) de abajo). Lo siguiente es la **v1.2**:
> identidad "Internet 2010 + Nightcore + Windows XP + Winamp + neón + anime + Arequipa".

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
