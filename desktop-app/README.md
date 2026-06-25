# Nightcore AQP · Descargador (app de escritorio)

App de escritorio (Electron) para descargar la música de la playlist **en tu PC**, a máxima
calidad y sin depender de servidores que YouTube bloquea. Reusa el mismo motor `yt-dlp` que ya
funciona en el `media-service`, pero con interfaz gráfica (sin terminal manual).

## Fase actual: local / desarrollo

```bash
cd desktop-app
npm install
npm run dev
```

`npm run dev` levanta el dev server del renderer (un puerto, p. ej. `localhost:5173`) y abre la
**ventana de la app** cargándolo. Los **logs salen en la terminal** y también en el panel
"Registro" de la app — así puedes ver exactamente dónde falla algo.

> La primera vez, la app **descarga sola `yt-dlp` y `ffmpeg`** a `userData/bin` (como el `.bat`
> de la web). No necesitas instalar nada aparte en Windows.

### Cómo se usa
1. Pega uno o varios enlaces (YouTube / TikTok / Instagram), uno por línea.
2. Elige **MP3** o **MP4** (y la calidad si es MP4).
3. (Opcional) cambia la carpeta de destino. Por defecto: `Descargas/NightcoreAQP`.
4. **Descargar**. Mira el progreso en el Registro.

## Estructura

```
desktop-app/
├─ electron.vite.config.mjs   # config de electron-vite (main · preload · renderer)
└─ src/
   ├─ main/
   │  ├─ index.js             # ventana de Electron + IPC
   │  └─ tools.js             # motor: auto-instala yt-dlp/ffmpeg y descarga
   ├─ preload/index.js        # puente seguro (contextBridge)
   └─ renderer/               # interfaz (HTML/CSS/JS)
```

## Empaquetar el `.exe` (instalador)

```bash
npm run dist
```

Genera `dist/NightcoreAQP-Downloader-Setup.exe` — un instalador NSIS: 2 clics, pregunta la
carpeta de instalación y crea el acceso directo al escritorio. El cliente **no ve terminal**.

> ⚠️ La **primera vez** en Windows hay que activar **Modo de desarrollador**
> (*Configuración → Privacidad y seguridad → Para desarrolladores → Modo de desarrollador*)
> **o** correr el comando desde una terminal **como Administrador**. Es porque `electron-builder`
> extrae una herramienta con symlinks de macOS y Windows exige privilegio para crearlos.

## Publicar + auto-actualización

La app se **auto-actualiza** desde **GitHub Releases** (renderer CSS/JS + proceso principal).
Para sacar una versión nueva:

1. Sube el número en `package.json` (`"version"`), p. ej. `0.1.0` → `0.1.1`.
2. Exporta un token de GitHub con permiso `repo`: `set GH_TOKEN=ghp_...` (Windows) / `export GH_TOKEN=...`.
3. `npm run release` → compila, genera el instalador y lo **publica** en
   `github.com/phaletasss-max/nightcoreaqp/releases` (con `latest.yml` para el updater).

Las apps ya instaladas detectan la versión nueva al abrir, la descargan y la aplican al
reiniciar (botón "Reiniciar y actualizar"). Hasta los parches de CSS/función llegan así.

> El botón "Descargar la App (.exe)" de la web apunta a
> `releases/latest/download/NightcoreAQP-Downloader-Setup.exe` — funciona en cuanto publiques
> la primera release.

## Próximo
- Icono propio (`build/icon.ico`) y firma de código (opcional).
- Botón "Abrir en la app" desde la web que pase la lista de canciones directo.

## Notas
- Requiere **Node 18+** para desarrollo.
- En Windows el auto-instalador de `ffmpeg` usa PowerShell (`Expand-Archive`).
- En Linux/Mac instala `ffmpeg` por tu gestor si falta (`yt-dlp` sí se auto-descarga).
