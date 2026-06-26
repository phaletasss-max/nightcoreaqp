# Changelog — Nightcore AQP

Formato: `[vX.Y.Z] YYYY-MM-DD — descripción breve`.  
Versión semántica: MAYOR.MENOR.PATCH (la app web no tiene número de versión forzado; el desktop-app sí).

---

## [Unreleased] — Mobile (Expo)

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
