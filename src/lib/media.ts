// ── Cliente del media-service ────────────────────────────────────────────────
// Habla con el microservicio en el servidor Arch (yt-dlp). Si no está configurado
// (env vacío), las funciones degradan: checkVideo devuelve null (el caller hace una
// verificación básica de YouTube), y las descargas se deshabilitan en la UI.

const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || '').replace(/\/$/, '');

// Solo está "configurado" si hay una URL real (https, no localhost). Así, en
// producción sin media-service desplegado, las descargas se ocultan en vez de
// fallar contra http://localhost:8787 (Mixed Content / connection refused).
export function isMediaConfigured(): boolean {
  return !!MEDIA_URL && MEDIA_URL.startsWith('http') && !MEDIA_URL.includes('localhost');
}

// Las descargas ahora pasan por nuestra ruta /api/download (Vercel → Cobalt),
// así que están disponibles SIEMPRE, sin servidor propio.
export function downloadsAvailable(): boolean {
  return true;
}

export interface VideoQuality { height: number; sizeMb: number | null }
export interface VideoInfo {
  available: boolean;
  embeddable: boolean;
  title?: string;
  author?: string;
  thumbnail?: string;
  availability?: string;
  duration?: number;
  video?: VideoQuality[];      // calidades de mp4 disponibles (altura + tamaño aprox)
  audioSizeMb?: number | null; // tamaño aprox del mp3
  error?: string;
}

// Verifica si un link es reproducible/embebible (el "comprobante" al sugerir).
// Devuelve null si el media-service no está configurado (el caller decide).
export async function checkVideo(url: string): Promise<VideoInfo | null> {
  if (!isMediaConfigured()) return null;
  try {
    // Timeout: si el servicio está dormido/lento, no colgamos la UI (cae al fallback).
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${MEDIA_URL}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return (await r.json()) as VideoInfo;
  } catch {
    return { available: false, embeddable: false, error: 'No se pudo contactar el media-service' };
  }
}

// Intenta el media-service propio (Render/Arch, yt-dlp con cookies). Lanza si falla.
async function fetchFromMediaService(url: string, format: 'mp3' | 'mp4', quality?: string): Promise<Response> {
  const r = await fetch(`${MEDIA_URL}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format, quality: quality || 'best' }),
  });
  if (!r.ok) {
    let msg = 'media-service falló';
    try { const j = await r.json(); msg = j.error || msg; } catch { /* binario/no-JSON */ }
    throw new Error(msg);
  }
  return r;
}

// Cae al proxy de Vercel → flota Cobalt. Lanza si falla.
async function fetchFromCobalt(url: string, format: 'mp3' | 'mp4', filename: string): Promise<Response> {
  const qs = `url=${encodeURIComponent(url)}&format=${format}&filename=${encodeURIComponent(filename)}`;
  const r = await fetch(`/api/download?${qs}`, { cache: 'no-store' });
  if (!r.ok) {
    let msg = 'Error en la descarga';
    try { const j = await r.json(); msg = j.error || msg; } catch { /* binario/no-JSON */ }
    throw new Error(msg);
  }
  return r;
}

// Descarga mp3/mp4 EN-PÁGINA. El servidor solo trae el archivo; el blob se guarda
// en el dispositivo de quien pegó el link — NO se queda en el servidor.
//
// Cascada: si hay media-service propio configurado se intenta primero (mejor calidad
// y soporte de YouTube con cookies). Si falla — típicamente por el bloqueo de YouTube
// a IPs de datacenter — cae automáticamente al proxy Cobalt en vez de abortar.
export async function downloadMedia(url: string, format: 'mp3' | 'mp4', filename: string, quality?: string): Promise<void> {
  let r: Response | null = null;

  if (isMediaConfigured()) {
    try {
      r = await fetchFromMediaService(url, format, quality);
    } catch (primaryErr) {
      // Fallback transparente a Cobalt. Si este también falla, propagamos su error
      // (más útil para el usuario que el del datacenter bloqueado).
      try {
        r = await fetchFromCobalt(url, format, filename);
      } catch {
        throw primaryErr;
      }
    }
  } else {
    r = await fetchFromCobalt(url, format, filename);
  }

  const blob = await r.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}

// Busca en YouTube la mejor coincidencia de un texto y devuelve su URL. Sirve para
// convertir un pedido de Spotify en algo reproducible/descargable. Null si no hay
// media-service o no hay resultado.
export async function searchYouTube(query: string): Promise<string | null> {
  if (!isMediaConfigured()) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetch(`${MEDIA_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const data = await r.json();
    return (data.url as string) || null;
  } catch {
    return null;
  }
}

export interface YtSearchResult { url: string; title?: string; author?: string; thumbnail?: string; duration?: number }

// Busca en YouTube y devuelve varios resultados (para que el usuario elija). Vacío
// si no hay media-service o no hay resultados.
export async function searchYouTubeList(query: string, limit = 6): Promise<YtSearchResult[]> {
  if (!isMediaConfigured()) return [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const r = await fetch(`${MEDIA_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results as YtSearchResult[]) || [];
  } catch {
    return [];
  }
}

// Respalda un link en Supabase Storage (vía media-service). Devuelve la URL pública.
export async function storeBackup(url: string, format: 'mp3' | 'mp4'): Promise<string | null> {
  if (!isMediaConfigured()) return null;
  try {
    const r = await fetch(`${MEDIA_URL}/api/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format }),
    });
    const data = await r.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}
