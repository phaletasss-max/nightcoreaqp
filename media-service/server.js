// ── Nightcore AQP · Media-service ────────────────────────────────────────────
// Express + yt-dlp + ffmpeg. Corre en el servidor Arch (NO en Vercel).
// El frontend (Vercel) lo llama por HTTPS para verificar y descargar canciones.

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { getInfo, streamDownload, downloadToBuffer } = require('./lib/downloader');
const storage = require('./lib/storage');
const FileConverter = require('./lib/converter');

const app = express();
app.use(express.json());

// Conversor de archivos (LibreOffice / ImageMagick / FFmpeg).
const converter = new FileConverter();
const uploadDir = path.join(__dirname, 'tmp-uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 100 * 1024 * 1024 } });

const CONVERSIONS = {
  'pdf-to-word': { name: 'PDF a Word',  input: ['pdf'],          output: 'docx', handler: 'pdfToWord' },
  'word-to-pdf': { name: 'Word a PDF',  input: ['doc', 'docx'],  output: 'pdf',  handler: 'wordToPdf' },
  'jpg-to-png':  { name: 'JPG a PNG',   input: ['jpg', 'jpeg'],  output: 'png',  handler: 'jpgToPng' },
  'png-to-jpg':  { name: 'PNG a JPG',   input: ['png'],          output: 'jpg',  handler: 'pngToJpg' },
  'webp-to-jpg': { name: 'WebP a JPG',  input: ['webp'],         output: 'jpg',  handler: 'webpToJpg' },
  'jpg-to-webp': { name: 'JPG a WebP',  input: ['jpg', 'jpeg'],  output: 'webp', handler: 'jpgToWebp' },
  'mp4-to-mp3':  { name: 'MP4 a MP3',   input: ['mp4'],          output: 'mp3',  handler: 'mp4ToMp3' },
};

// CORS: solo el frontend autorizado (coma-separado en ALLOWED_ORIGINS).
const allowed = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
app.use(cors({ origin: allowed.includes('*') ? true : allowed }));

const log = (lvl, msg) => console.log(`[${new Date().toISOString()}] [${lvl}] ${msg}`);

// Salud + verificación de yt-dlp.
app.get('/health', (req, res) => {
  const { spawn } = require('child_process');
  const check = spawn('yt-dlp', ['--version']);
  let version = '';
  check.stdout.on('data', (d) => (version += d));
  check.on('error', () => res.json({ status: 'OK', yt_dlp: false, storage: storage.isConfigured() }));
  check.on('close', (code) =>
    res.json({ status: 'OK', yt_dlp: code === 0, yt_dlp_version: version.trim() || null, storage: storage.isConfigured() }),
  );
});

// Verificar disponibilidad de un link (el "comprobante" al sugerir canción).
// POST /api/info { url } → { available, title, author, thumbnail, availability, embeddable }
app.post('/api/info', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Falta url' });
  try {
    const info = await getInfo(url);
    // Embebible si es público (no privado/borrado). yt-dlp ya falló si no existe.
    const embeddable = info.availability === 'public' && !info.isLive;
    log('INFO', `OK: ${info.title}`);
    res.json({ ...info, embeddable });
  } catch (err) {
    log('INFO', `No disponible: ${err.message}`);
    res.json({ available: false, embeddable: false, error: err.message });
  }
});

// Descargar (stream directo). POST /api/download { url, format, quality }
app.post('/api/download', async (req, res) => {
  const { url, format = 'mp4', quality = 'best' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Falta url' });
  try {
    log('DOWNLOAD', `${format} ${url}`);
    await streamDownload(url, format, quality, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// Soporte para GET (para embeber en src="...")
app.get('/api/download', async (req, res) => {
  const { url, format = 'mp4', quality = 'best' } = req.query || {};
  if (!url) return res.status(400).json({ error: 'Falta url' });
  try {
    log('DOWNLOAD_GET', `${format} ${url}`);
    await streamDownload(url, format, quality, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// Descargar + respaldar en Supabase Storage. POST /api/store { url, format }
// Devuelve { url: <public_url> }. Útil cuando un link no es embebible y queremos
// un respaldo propio para el set del DJ.
app.post('/api/store', async (req, res) => {
  const { url, format = 'mp3', quality = 'best' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Falta url' });
  if (!storage.isConfigured()) return res.status(501).json({ error: 'Storage no configurado' });
  try {
    const info = await getInfo(url).catch(() => ({ title: 'media' }));
    const safe = (info.title || 'media').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    log('STORE', `Descargando ${url}`);
    const buffer = await downloadToBuffer(url, format, quality);
    const publicUrl = await storage.uploadBuffer(buffer, `${safe}.${format === 'mp3' ? 'mp3' : 'mp4'}`, format);
    log('STORE', `Subido: ${publicUrl}`);
    res.json({ url: publicUrl, title: info.title || null });
  } catch (err) {
    log('STORE', `Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── CONVERSIÓN DE ARCHIVOS ───────────────────────────────────────────────────
// GET /api/convert/options → lista de conversiones disponibles.
app.get('/api/convert/options', (req, res) => {
  res.json({
    options: Object.entries(CONVERSIONS).map(([id, c]) => ({ id, name: c.name, input: c.input, output: c.output })),
  });
});

// POST /api/convert/:tipo (multipart, campo "file") → devuelve el archivo convertido.
app.post('/api/convert/:tipo', upload.single('file'), async (req, res) => {
  const conv = CONVERSIONS[req.params.tipo];
  if (!conv) { if (req.file) fs.unlink(req.file.path, () => {}); return res.status(400).json({ error: 'Conversión no soportada' }); }
  if (!req.file) return res.status(400).json({ error: 'Falta el archivo' });

  const inputExt = (req.file.originalname.split('.').pop() || '').toLowerCase();
  if (!conv.input.includes(inputExt)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: `Extensión .${inputExt} no válida. Usa: ${conv.input.join(', ')}` });
  }

  try {
    log('CONVERT', `${req.params.tipo} ← ${req.file.originalname}`);
    const result = await converter[conv.handler](req.file.path);
    res.download(result.path, result.filename, () => {
      setTimeout(() => { result.cleanup(); fs.unlink(req.file.path, () => {}); }, 5000);
    });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    log('CONVERT', `Error: ${err.message}`);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, '0.0.0.0', () => {
  log('STARTUP', `Media-service en puerto ${PORT}`);
  log('STARTUP', `Storage configurado: ${storage.isConfigured()}`);
});
