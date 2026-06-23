// ── Descargador / verificador con yt-dlp ─────────────────────────────────────
// Adaptado de bot-erp (src/downloaders/videoDownloader.js). Requiere `yt-dlp` y
// `ffmpeg` instalados en el sistema (servidor Arch).

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SUPPORTED = [
  'youtube.com', 'youtu.be', 'facebook.com', 'fb.watch',
  'instagram.com', 'tiktok.com', 'vm.tiktok.com', 'twitter.com', 'x.com',
];

// yt-dlp REESCRIBE el archivo de cookies cuando YouTube las rota. En Render,
// YTDLP_COOKIES apunta a /etc/secrets/... que es READ-ONLY → yt-dlp crashea
// (OSError: Read-only file system). Solución: copiar las cookies a una ruta
// escribible (/tmp) una vez al arrancar y darle ESA a yt-dlp.
let COOKIES_PATH = null;
(function initCookies() {
  const src = process.env.YTDLP_COOKIES;
  if (!src) return;
  try {
    const dst = path.join(os.tmpdir(), 'ytdlp-cookies.txt');
    fs.copyFileSync(src, dst);
    fs.chmodSync(dst, 0o600);
    COOKIES_PATH = dst;
    console.log(`[cookies] copiadas a ${dst} (escribible)`);
  } catch (e) {
    COOKIES_PATH = src;   // fallback: usar el original (puede fallar si es read-only)
    console.log(`[cookies] no se pudo copiar (${e.message}); uso ${src}`);
  }
})();

// Nota: yt-dlp usa `deno` como runtime JS por defecto para el reto nsig de YouTube;
// la imagen Docker lo instala, así que no hace falta pasar --js-runtimes.

function cookieArgs() {
  return COOKIES_PATH ? ['--cookies', COOKIES_PATH] : [];
}

// Traduce el stderr crudo de yt-dlp a un mensaje útil para el usuario final.
function humanizeYtError(stderr) {
  if (!stderr) return null;
  const s = stderr.toLowerCase();
  if (s.includes("confirm you're not a bot") || s.includes('sign in to confirm'))
    return 'YouTube está bloqueando al servidor (IP de datacenter). Hace falta configurar cookies (YTDLP_COOKIES). TikTok/Instagram sí funcionan.';
  if (s.includes('private video') || s.includes('video is private'))
    return 'El video es privado.';
  if (s.includes('video unavailable') || s.includes('not available'))
    return 'El video no está disponible o fue eliminado.';
  if (s.includes('age') && s.includes('restrict'))
    return 'Video con restricción de edad: requiere cookies de una cuenta.';
  if (s.includes('unsupported url'))
    return 'Enlace no soportado.';
  // Última línea no vacía del stderr como pista.
  const lines = stderr.trim().split('\n').filter(Boolean);
  return lines.length ? lines[lines.length - 1].slice(0, 200) : null;
}

function validateUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    // Coincidencia exacta o subdominio real (evita "youtube.com.attacker.dev").
    return SUPPORTED.some((p) => host === p || host.endsWith('.' + p));
  } catch {
    return false;
  }
}

// Verifica disponibilidad y devuelve metadatos (el "comprobante").
function getInfo(url) {
  return new Promise((resolve, reject) => {
    if (!validateUrl(url)) return reject(new Error('URL no soportada'));
    const proc = spawn('yt-dlp', [...cookieArgs(), '--no-playlist', '--dump-json', '--no-download', url]);
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('error', () => reject(new Error('yt-dlp no disponible')));
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(err || `yt-dlp salió con código ${code}`));
      try {
        const info = JSON.parse(out);
        resolve({
          available: true,
          title: info.title,
          author: info.uploader,
          duration: info.duration,
          thumbnail: info.thumbnail,
          platform: info.extractor,
          isLive: info.is_live || false,
          // availability puede ser 'public' | 'unlisted' | 'private' | etc.
          availability: info.availability || 'public',
        });
      } catch {
        reject(new Error('No se pudo parsear la info'));
      }
    });
  });
}

// Busca en YouTube la mejor coincidencia de un texto (ej. "artista - título") y
// devuelve su URL real de YouTube. Sirve para convertir un pedido de Spotify en algo
// reproducible/descargable.
function searchYouTube(query) {
  return new Promise((resolve, reject) => {
    const q = String(query || '').trim();
    if (!q) return reject(new Error('Falta query'));
    const proc = spawn('yt-dlp', [...cookieArgs(), '--no-playlist', '--dump-json', '--no-download', `ytsearch1:${q}`]);
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('error', () => reject(new Error('yt-dlp no disponible')));
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(humanizeYtError(err) || `yt-dlp salió con código ${code}`));
      try {
        // ytsearch puede devolver una línea JSON (el primer resultado).
        const first = out.trim().split('\n').filter(Boolean)[0];
        const info = JSON.parse(first);
        resolve({
          url: info.webpage_url || (info.id ? `https://www.youtube.com/watch?v=${info.id}` : null),
          title: info.title,
          author: info.uploader,
          thumbnail: info.thumbnail,
          duration: info.duration,
        });
      } catch {
        reject(new Error('Sin resultados de búsqueda'));
      }
    });
  });
}

// Construye los args de yt-dlp según formato/calidad. Salida a stdout ('-o -').
function buildArgs(url, format, quality) {
  let args = [...cookieArgs(), '--no-playlist'];
  if (format === 'mp3') {
    args = args.concat(['-x', '--audio-format', 'mp3', '--audio-quality', '0']);
  } else if (url.includes('tiktok.com')) {
    // Forzar H.264 para compatibilidad (fix HEVC de TikTok).
    args = args.concat([
      '-f', 'best[ext=mp4][vcodec~="^((?!hevc).)*$"]/best[ext=mp4]/best',
      '--merge-output-format', 'mp4',
      '--postprocessor-args', 'ffmpeg:-c:v libx264 -preset fast -crf 23',
    ]);
  } else if (quality && quality !== 'best') {
    args = args.concat([
      '-f', `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}][ext=mp4]/best`,
      '--merge-output-format', 'mp4',
    ]);
  } else {
    args = args.concat(['-f', 'best[ext=mp4]/best', '--merge-output-format', 'mp4']);
  }
  return args.concat(['-o', '-', url]);
}

// Args para descarga directa de VIDEO (mp4). Con salida a stdout yt-dlp no puede
// mergear, así que pedimos un formato progresivo (un solo archivo) transmitible tal cual.
function buildVideoArgs(url, quality) {
  let args = [...cookieArgs(), '--no-playlist'];
  if (url.includes('tiktok.com')) {
    args = args.concat(['-f', 'best[ext=mp4][vcodec~="^((?!hevc).)*$"]/best[ext=mp4]/best']);
  } else if (quality && quality !== 'best') {
    args = args.concat(['-f', `best[height<=${quality}][ext=mp4]/best[ext=mp4]/best`]);
  } else {
    args = args.concat(['-f', 'best[ext=mp4]/best']);
  }
  return args.concat(['-o', '-', url]);
}

// MP3 real: yt-dlp (bestaudio) → ffmpeg (transcode a mp3) → cliente. Necesario porque
// con salida a stdout yt-dlp NO postprocesa (devolvía webm/opus con extensión .mp3).
function streamAudioMp3(url, safe, res) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [...cookieArgs(), '--no-playlist', '-f', 'bestaudio/best', '-o', '-', url]);
    const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-vn', '-f', 'mp3', '-b:a', '192k', 'pipe:1']);
    let bytes = 0;
    let err = '';
    ytdlp.stderr.on('data', (d) => (err += d.toString()));
    ytdlp.stdout.on('error', () => {});
    ytdlp.stdout.pipe(ff.stdin);
    ff.stdin.on('error', () => {});   // ffmpeg puede cerrar la entrada antes de tiempo
    ff.stdout.pipe(res);
    ff.stdout.on('data', (d) => (bytes += d.length));
    ff.stderr.on('data', () => {});
    ytdlp.on('error', (e) => { if (!res.headersSent) res.status(500).json({ error: 'yt-dlp no disponible' }); reject(e); });
    ff.on('error', (e) => { if (!res.headersSent) res.status(500).json({ error: 'ffmpeg no disponible' }); reject(e); });
    ytdlp.on('close', (code) => { if (code !== 0) { try { ff.stdin.end(); } catch { /* */ } } });
    ff.on('close', () => {
      if (bytes === 0) {
        const reason = humanizeYtError(err) || 'No se pudo convertir a mp3';
        if (!res.headersSent) res.status(500).json({ error: reason });
        return reject(new Error(reason));
      }
      resolve({ filename: `${safe}.mp3`, size: bytes, format: 'mp3' });
    });
    res.on('close', () => { try { ytdlp.kill(); } catch { /* */ } try { ff.kill(); } catch { /* */ } });
  });
}

// Stream directo al cliente (res es el Response de Express).
async function streamDownload(url, format, quality, res) {
  if (!validateUrl(url)) throw new Error('URL no soportada');
  const info = await getInfo(url).catch(() => ({ title: 'media' }));
  const safe = (info.title || 'media').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  res.setHeader('Content-Disposition', `attachment; filename="${safe}.${ext}"`);
  res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

  // MP3 va por el pipe de transcode (ffmpeg); mp4 se transmite directo.
  if (format === 'mp3') return streamAudioMp3(url, safe, res);

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', buildVideoArgs(url, quality));
    proc.stdout.pipe(res);
    let bytes = 0;
    let err = '';
    proc.stdout.on('data', (d) => (bytes += d.length));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('error', (e) => { if (!res.headersSent) res.status(500).json({ error: 'yt-dlp no disponible en el servidor' }); reject(e); });
    proc.on('close', (code) => {
      if (code !== 0) {
        const reason = humanizeYtError(err) || `yt-dlp salió con código ${code}`;
        if (!res.headersSent) res.status(500).json({ error: reason });
        return reject(new Error(reason));
      }
      resolve({ filename: `${safe}.${ext}`, size: bytes, format });
    });
    res.on('close', () => { if (!proc.killed) proc.kill(); });
  });
}

// Descarga a un Buffer en memoria (para subir a Supabase Storage).
async function downloadToBuffer(url, format, quality) {
  if (!validateUrl(url)) throw new Error('URL no soportada');
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', buildArgs(url, format, quality));
    const chunks = [];
    proc.stdout.on('data', (d) => chunks.push(d));
    proc.on('error', () => reject(new Error('yt-dlp no disponible')));
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`yt-dlp salió con código ${code}`));
      resolve(Buffer.concat(chunks));
    });
  });
}

module.exports = { validateUrl, getInfo, searchYouTube, streamDownload, downloadToBuffer };
