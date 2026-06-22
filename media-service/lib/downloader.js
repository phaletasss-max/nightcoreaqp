// ── Descargador / verificador con yt-dlp ─────────────────────────────────────
// Adaptado de bot-erp (src/downloaders/videoDownloader.js). Requiere `yt-dlp` y
// `ffmpeg` instalados en el sistema (servidor Arch).

const { spawn } = require('child_process');

const SUPPORTED = [
  'youtube.com', 'youtu.be', 'facebook.com', 'fb.watch',
  'instagram.com', 'tiktok.com', 'vm.tiktok.com', 'twitter.com', 'x.com',
];

// Si se define YTDLP_COOKIES (ruta a un cookies.txt exportado de YouTube),
// se lo pasamos a yt-dlp. Necesario para que YouTube no bloquee en servidores.
function cookieArgs() {
  return process.env.YTDLP_COOKIES ? ['--cookies', process.env.YTDLP_COOKIES] : [];
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

// Stream directo al cliente (res es el Response de Express).
async function streamDownload(url, format, quality, res) {
  if (!validateUrl(url)) throw new Error('URL no soportada');
  const info = await getInfo(url).catch(() => ({ title: 'audio' }));
  const safe = (info.title || 'media').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  res.setHeader('Content-Disposition', `attachment; filename="${safe}.${ext}"`);
  res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', buildArgs(url, format, quality));
    proc.stdout.pipe(res);
    let bytes = 0;
    proc.stdout.on('data', (d) => (bytes += d.length));
    proc.on('error', (e) => { if (!res.headersSent) res.status(500).json({ error: 'yt-dlp no disponible' }); reject(e); });
    proc.on('close', (code) => {
      if (code !== 0) { if (!res.headersSent) res.status(500).json({ error: 'Error en descarga' }); return reject(new Error(`Código ${code}`)); }
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

module.exports = { validateUrl, getInfo, streamDownload, downloadToBuffer };
