// ── Generador de scripts .bat de descarga LOCAL ─────────────────────────────
// El servidor (Render/Vercel) está en un datacenter que YouTube bloquea. En vez
// de descargar ahí, generamos un .bat que el usuario ejecuta en SU PC (IP
// residencial → sin bloqueos). El .bat baja yt-dlp + ffmpeg por su cuenta y
// descarga los links incrustados. Compartido por la playlist (admin top-N) y la
// página de descargas (un solo link).

// Bloque que descarga yt-dlp y ffmpeg a una subcarpeta "_tools" (una sola vez).
const BOOTSTRAP: string[] = [
  'set "TOOLS=%~dp0_tools"',
  'if not exist "%TOOLS%" mkdir "%TOOLS%"',
  'set "YTDLP=%TOOLS%\\yt-dlp.exe"',
  'set "FFMPEG=%TOOLS%\\ffmpeg.exe"',
  'if not exist "%YTDLP%" (',
  '  echo Descargando yt-dlp ^(una sola vez^)...',
  '  curl -L --progress-bar -o "%YTDLP%" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"',
  ')',
  'if not exist "%FFMPEG%" (',
  '  echo Descargando ffmpeg ^(una sola vez, puede tardar^)...',
  '  curl -L --progress-bar -o "%TOOLS%\\ffmpeg.zip" "https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip"',
  '  powershell -NoProfile -Command "Expand-Archive -Force \'%TOOLS%\\ffmpeg.zip\' \'%TOOLS%\\ffmpeg_tmp\'" >nul 2>&1',
  '  for /r "%TOOLS%\\ffmpeg_tmp" %%F in (ffmpeg.exe) do copy /y "%%F" "%FFMPEG%" >nul',
  '  for /r "%TOOLS%\\ffmpeg_tmp" %%F in (ffprobe.exe) do copy /y "%%F" "%TOOLS%\\ffprobe.exe" >nul',
  '  del /q "%TOOLS%\\ffmpeg.zip" >nul 2>&1',
  '  rmdir /s /q "%TOOLS%\\ffmpeg_tmp" >nul 2>&1',
  ')',
  '"%YTDLP%" -U >nul 2>&1',
];

// Args de yt-dlp según formato/calidad. quality numérico (ej. "720") limita altura.
// IMPORTANTE: el selector -f va ENTRE COMILLAS porque el `<=` lleva un `<` que
// cmd interpretaría como redirección de entrada y rompería la descarga.
function dlArgsFor(format: 'mp3' | 'mp4', quality?: string): string {
  if (format === 'mp3') return '-x --audio-format mp3 --audio-quality 0';
  if (quality && quality !== 'best' && /^\d+$/.test(quality))
    return `-f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]" --merge-output-format mp4`;
  return '-f "bestvideo+bestaudio/best" --merge-output-format mp4';
}

export interface CrateOptions {
  title?: string;    // título de la ventana del .bat
  dest?: string;     // carpeta destino (ruta Windows); default Escritorio\NightcoreAQP
  quality?: string;  // solo mp4: "best" | "360" | "480" | "720" | "1080"
}

// Construye el contenido de un .bat que descarga 1..N links en la PC del usuario.
export function buildCrateBat(urls: string[], format: 'mp3' | 'mp4', opts: CrateOptions = {}): string {
  const { title = 'Crate', dest = '%USERPROFILE%\\Desktop\\NightcoreAQP', quality } = opts;
  const clean = urls.map((u) => String(u).replace(/["\r\n]/g, '')).filter(Boolean);
  const dlArgs = dlArgsFor(format, quality);

  // Una llamada directa de yt-dlp por URL. OJO: NO usar `for %%U in (...)` — el `?`
  // de las URLs de YouTube se interpreta como comodín de archivo y el loop se salta
  // (la URL va entre comillas, así el `&` de las playlists tampoco rompe el comando).
  const dlLines = clean.flatMap((u, i) => [
    'echo.',
    `echo  ---- Descargando ${i + 1}/${clean.length} ...`,
    `"%YTDLP%" --no-playlist --ffmpeg-location "%TOOLS%" ${dlArgs} -o "%DEST%\\%%(title)s.%%(ext)s" "${u}"`,
  ]);

  return [
    '@echo off',
    'setlocal',
    `title Glitch AQP - ${title}`,
    'color 0D',
    'cd /d "%~dp0"',
    'echo.',
    `echo  === GLITCH AQP - DESCARGA LOCAL (${format.toUpperCase()}) ===`,
    `echo  ${clean.length} archivo^(s^) a descargar en TU PC.`,
    'echo.',
    ...BOOTSTRAP,
    `set "DEST=${dest}"`,
    'if not exist "%DEST%" mkdir "%DEST%"',
    'echo.',
    'echo  Guardando en: %DEST%',
    ...dlLines,
    'echo.',
    'echo  =========================================================',
    'echo   LISTO. Tus archivos estan en: %DEST%',
    'echo   Sube tu cancion a la playlist para que otros la escuchen!',
    'echo  =========================================================',
    'pause',
    'endlocal',
    // El .bat se autoelimina al cerrar (deja solo los archivos descargados, sin script).
    '(goto) 2>nul & del "%~f0"',
    '',
  ].join('\r\n');
}

// Dispara la descarga de un archivo de texto (el .bat) en el navegador.
export function downloadTextFile(filename: string, content: string, mime = 'application/octet-stream'): void {
  const blob = new Blob([content], { type: mime });
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}
