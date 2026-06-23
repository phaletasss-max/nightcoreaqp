// ── Nightcore AQP · Media-service ────────────────────────────────────────────
// Express + yt-dlp + ffmpeg. Corre en el servidor Arch (NO en Vercel).
// El frontend (Vercel) lo llama por HTTPS para verificar y descargar canciones.

const express = require('express');
const cors = require('cors');
const { getInfo, searchYouTube, streamDownload, downloadToBuffer } = require('./lib/downloader');
const storage = require('./lib/storage');

const app = express();
app.use(express.json());

// CORS: solo el frontend autorizado (coma-separado en ALLOWED_ORIGINS).
const allowed = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
app.use(cors({ origin: allowed.includes('*') ? true : allowed }));

const log = (lvl, msg) => console.log(`[${new Date().toISOString()}] [${lvl}] ${msg}`);

// Raíz informativa (evita el 404 al abrir la URL en el navegador).
app.get('/', (req, res) => {
  res.json({
    service: 'nightcore-media',
    status: 'OK',
    endpoints: ['/health', '/api/ytcheck', '/api/info', '/api/download', '/api/store'],
  });
});

// Health check INSTANTÁNEO (sin spawnear nada) para que Render no haga timeout.
app.get('/health', (req, res) => {
  res.json({ status: 'OK', storage: storage.isConfigured() });
});

// Verificación de yt-dlp aparte (puede tardar; no la use el health check).
app.get('/api/ytcheck', (req, res) => {
  const { spawn } = require('child_process');
  const check = spawn('yt-dlp', ['--version']);
  let version = '';
  check.stdout.on('data', (d) => (version += d));
  check.on('error', () => res.json({ yt_dlp: false }));
  check.on('close', (code) => res.json({ yt_dlp: code === 0, yt_dlp_version: version.trim() || null }));
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

// Buscar en YouTube. POST /api/search { query } → { url, title, author, thumbnail }
// Convierte un pedido de Spotify (texto) en un link de YouTube reproducible.
app.post('/api/search', async (req, res) => {
  const { query, limit } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Falta query' });
  try {
    const results = await searchYouTube(query, limit);
    log('SEARCH', `"${query}" → ${results.length} resultados`);
    // Compat: `url` = mejor resultado (lo usa el auto-resolve de Spotify); `results` = lista.
    res.json({ url: results[0]?.url || null, title: results[0]?.title || null, results });
  } catch (err) {
    log('SEARCH', `FALLÓ "${query}": ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Descargar (stream directo). POST /api/download { url, format, quality }
app.post('/api/download', async (req, res) => {
  const { url, format = 'mp4', quality = 'best' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Falta url' });
  try {
    log('DOWNLOAD', `${format} ${url}`);
    const r = await streamDownload(url, format, quality, res);
    log('DOWNLOAD', `OK ${r.filename} (${(r.size / 1e6).toFixed(1)}MB)`);
  } catch (err) {
    log('DOWNLOAD', `FALLÓ: ${err.message}`);   // ← el motivo real aparece en los logs de Render
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
    log('DOWNLOAD_GET', `FALLÓ: ${err.message}`);
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

const PORT = process.env.PORT || 8787;
app.listen(PORT, '0.0.0.0', () => {
  log('STARTUP', `Media-service en puerto ${PORT}`);
  log('STARTUP', `Storage configurado: ${storage.isConfigured()}`);
});
