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

## Próximo (Fase 2 · versión de usuario)
- Empaquetar a un **`.exe` profesional** con `electron-builder` (doble clic, sin instalar nada).
- Integración con la web: botón "Abrir en la app" que pase la lista de canciones.
- Firma de código / icono / instalador.

## Notas
- Requiere **Node 18+** para desarrollo.
- En Windows el auto-instalador de `ffmpeg` usa PowerShell (`Expand-Archive`).
- En Linux/Mac instala `ffmpeg` por tu gestor si falta (`yt-dlp` sí se auto-descarga).
