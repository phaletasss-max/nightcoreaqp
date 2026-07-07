# El Descargador — doc maestro (léeme antes de tocarlo)

> Fuente única de verdad del sistema de descargas de Nightcore AQP: **qué es, por qué es así, y
> las reglas para no romperlo.** Supera a `docs/pt/pt-11-app-movil-descargas.md` (desactualizado:
> describía un descargador vía media-service + APK que ya no es el enfoque).

---

## 1. La idea (y el problema que resuelve)

**Problema:** el DJ del club gastaba muchísimo tiempo cazando y descargando a mano las canciones
pedidas. Lo natural sería descargarlas en el servidor… pero **Vercel/Render viven en datacenters
cuyas IPs YouTube bloquea** (te pide verificación anti-bot / "sign in"). Descargar server-side es
frágil, caro y se cae.

**Solución (regla de oro):** **las descargas ocurren en la PC/red del usuario, no en el servidor.**
Una IP residencial no la bloquea YouTube. Por eso hay tres vías, todas "locales":

| Vía | Qué es | Para quién | Código |
|---|---|---|---|
| **`.bat` de la web** | La web genera un script `.bat` que el usuario ejecuta en su PC; baja yt-dlp/ffmpeg solos y descarga los links. | Cualquiera (descarga masiva estilo DJ + por canción). | [`src/lib/crate.ts`](../src/lib/crate.ts) |
| **App de escritorio (`.exe`)** | Electron con UI; auto-instala yt-dlp/ffmpeg/**deno**, descarga con barra de progreso, cookies, temas. | Power users / el DJ. | [`desktop-app/`](../desktop-app) |
| **media-service** | Express + yt-dlp en Render. **Solo búsqueda de respaldo** y storage; las descargas ya **no** pasan por aquí. | Fallback de búsqueda (`/api/youtube/search` cae aquí si falta la Data API). | [`media-service/`](../media-service) |

> **No reintroduzcas descargas server-side.** Si lo haces "para que sea más cómodo", YouTube lo
> bloqueará y romperás producción. La incomodidad de correr un `.bat`/`.exe` es el precio de que
> funcione gratis y sin bloqueos.

---

## 2. La app de escritorio (`.exe`) — motor

Archivo clave: [`desktop-app/src/main/tools.js`](../desktop-app/src/main/tools.js). Proceso Electron +
IPC + auto-update en [`desktop-app/src/main/index.js`](../desktop-app/src/main/index.js).

### Auto-instalación de herramientas (`ensureTools`)
A `userData/bin` (NO en Archivos de Programa → sin permisos de admin), una sola vez:
- **yt-dlp** (`yt-dlp.exe`) desde el release `latest` de GitHub. Se auto-actualiza (`-U`) una vez por
  sesión (YouTube cambia seguido).
- **ffmpeg** (`ffmpeg.exe` + `ffprobe.exe`), extraído del zip de FFmpeg-Builds con PowerShell.
- **deno** (`deno.exe`) — **OBLIGATORIO para YouTube**: es el runtime JS que yt-dlp usa para resolver
  el reto **`nsig`**. Sin deno, YouTube suele bloquear. Se extrae del zip oficial de Deno.

`runYtdlp` mete `userData/bin` en el **`PATH`** del proceso yt-dlp para que encuentre `deno` y
`ffmpeg` sin rutas absolutas. **No quites esto.**

### Selección de formato (`buildArgs`) — reglas que ya nos mordieron
- `--restrict-filenames`: nombres ASCII sin espacios ni `#`. Evita el bug de Windows que recorta el
  espacio final (TikTok `"#foryou .mp4"`) y rompe ffprobe al extraer MP3.
- **MP3:** `-x --audio-format mp3 --audio-quality 0`. **Baja sin sesión** (audio no está gateado).
- **TikTok:** se fuerza un formato **H.264 (no HEVC)**: `best[ext=mp4][vcodec!*=hev][vcodec!*=hvc]/…`.
  Windows no reproduce HEVC (error `0xc00d5212`) y `--recode-video` no re-encoda un HEVC ya en mp4.
- **MP4 con calidad:** `bestvideo[height<=N]+bestaudio/best[height<=N]`.
- **No** forzar `player_client` (el `android` viejo dispara más el bloqueo anti-bot hoy).

### Cookies (para MP4 gateado de YouTube)
- El **audio (MP3)** baja sin sesión. El **video (MP4)** de music videos gateados exige login →
  cookies. Es **regla de YouTube, no un bug.**
- Prioridad: **archivo `cookies.txt`** (`--cookies`, lo más fiable, sin candados de navegador) →
  si no, **navegador** (`--cookies-from-browser`). Firefox no necesita cerrarse; Chrome/Edge sí.
- Con **deno** instalado, normalmente **no** hacen falta cookies para audio ni para la mayoría de
  videos. `humanize()` traduce los errores típicos a consejos.
- **Soporte de Plataformas:** Además de YouTube y TikTok, `yt-dlp` tiene soporte nativo total para descargar MP3 y MP4 (video) de **Facebook (Watch/Videos)**, **Instagram (Reels/Posts)** y **Twitter/X**. No requieren configuración extra; el motor las detecta y descarga automáticamente.

---

## 3. El `.bat` de la web

Archivo: [`src/lib/crate.ts`](../src/lib/crate.ts). `buildCrateBat(urls, format, opts)` arma un `.bat`
que el navegador descarga (`downloadTextFile`). Lo usan la playlist (top-N del admin) y la página de
descargas (un link).

**Trampas de `cmd` que respetar (romperlas = descargas que fallan en silencio):**
- **NO** uses `for %%U in (...)` con URLs: el `?` de YouTube se interpreta como comodín y el loop se
  salta. Se hace **una llamada `yt-dlp` por URL**.
- Las **URLs van entre comillas** (por el `&` de las playlists).
- El **selector `-f` va entre comillas** (por el `<` de `height<=`, que `cmd` leería como redirección).
- El `.bat` **se autoelimina al cerrar** (`(goto) 2>nul & del "%~f0"`) → deja solo los archivos.
- Bootstrap: baja yt-dlp + ffmpeg a una subcarpeta `_tools` (una sola vez), igual que el `.exe`.

> El `.bat` **no** instala deno. Para YouTube gateado, la vía robusta es la **app de escritorio**.

---

## 4. Build y publicación del `.exe`

- Workflow: [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) — runner
  Windows, compila con **electron-builder** (instalador **NSIS**) y publica en **GitHub Releases**
  usando `GITHUB_TOKEN`.
- **Auto-update:** `electron-updater` lee los releases de GitHub (visible + log en la app).
- ⚠️ **Requiere repo público:** con el repo privado, el auto-update da **404 anónimo** y la descarga
  pública del `.exe` no funciona. (Ver pendientes en `ESTADO-MAESTRO.md`.)
- Versión actual: **v0.1.7** (estado detallado en `ESTADO-MAESTRO.md §5`).
- Pendiente: **icono propio** + **firma de código** (quita el aviso de SmartScreen).

---

## 5. media-service (respaldo)

[`media-service/`](../media-service) (Express + yt-dlp, Docker, Render free). Hoy cubre **solo**:
- **Búsqueda de respaldo** (`/api/search`, yt-dlp `ytsearch`) — fallback de `/api/youtube/search`
  cuando falta la YouTube Data API. Puede estar bloqueado por YouTube (IP de datacenter).
- **storeBackup** (`/api/store`) — sube fondos del DJ a Supabase Storage.
- Se **duerme** (~30s cold start en el plan free) y YouTube le exige cookies. Plan B "Arch" (IP
  residencial) en [`PLAN-ARCH-SERVER.md`](./PLAN-ARCH-SERVER.md), sin implementar.

`docs/ESTADO.md` aún menciona `/api/download` — **ya no existe** (doc desincronizado).

---

## 6.5 Pendientes P4 — UX para usuarios no técnicos (2026-07-07)

Objetivo del dueño: que la gente **no vea el `.bat`** (los confunde) y entienda que es un
**descargador de YouTube/TikTok/Instagram/Facebook**.

1. **El `.exe` es el camino principal** (ya es así en `DownloadInstructionsModal`: el botón
   grande es el `.exe`; el `.bat` es un enlace secundario "¿sin instalar?"). El copy del modal
   ahora explica qué hace el instalador y de qué plataformas descarga. ✅ (hecho en la web)
2. **Lanzador `.bat` que instala/abre el `.exe`** ✅ HECHO (2026-07-07):
   [`public/downloads/Instalar_Descargador.bat`](../public/downloads/Instalar_Descargador.bat).
   Detecta el `.exe` en `%LOCALAPPDATA%\Programs\Nightcore AQP Downloader\`; si está lo abre,
   si no baja el Setup **solo del release oficial** de GitHub y lo lanza, explicando cada paso
   (incluido el aviso de SmartScreen). NO descarga canciones (eso es el crate `.bat`). Solo
   ASCII en los `echo` (los acentos se rompen con el codepage de cmd).
3. **Exportar herramientas (sin canciones)** ✅ HECHO (2026-07-07) en el `desktop-app`:
   botón **"🧰 Exportar herramientas"** (topbar) → IPC `export-tools` (main) copia
   `yt-dlp.exe`, `ffmpeg.exe`, `ffprobe.exe`, `deno.exe` de `userData/bin` a
   `<carpeta elegida>\GlitchAQP_Herramientas\` + `LEEME.txt`, **excluyendo canciones**.
   Sin zip (sin dependencias nuevas: copia directa). Sale en la próxima release del `.exe`
   (v0.1.8; el CI lo compila al publicar).
4. **APK**: la app Android sigue el mismo enfoque (descarga local a la galería vía la nube);
   documentación en `docs/pt/pt-11-app-movil-descargas.md` (marcada como desactualizada — al
   retomar el APK, reescribir alineada con este doc).

## 6. Checklist para no romper la estructura/idea

1. **Descargas = locales** (`.bat`/`.exe`), nunca server-side.
2. **deno** es obligatorio en el `.exe` para YouTube (`nsig`); se auto-instala a `userData/bin` y va
   en el `PATH` del proceso yt-dlp.
3. **`.bat`:** una llamada por URL (no `for`), URLs y `-f` entre comillas, autoeliminación.
4. **TikTok:** formato H.264 (no HEVC) o no reproduce en Windows.
5. **Cookies:** MP3 sin sesión; MP4 gateado pide cookies (archivo `.txt` con prioridad). Es regla de
   YouTube.
6. **Build desktop:** `desktop-app/` tiene su **propio `postcss.config.cjs` vacío** a propósito (que
   su build NO agarre el `postcss.config.mjs` del sitio). No lo borres.
7. **Verifica** (`npm run build` en `desktop-app/`) y **documenta** (este archivo + `CHANGELOG.md` +
   `ESTADO-MAESTRO.md`) al cerrar.
