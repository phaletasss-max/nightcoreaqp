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

export interface VideoInfo {
  available: boolean;
  embeddable: boolean;
  title?: string;
  author?: string;
  thumbnail?: string;
  availability?: string;
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

// Descarga mp3/mp4 EN-PÁGINA. El servidor solo trae el archivo (yt-dlp); el blob
// se guarda en el dispositivo de quien pegó el link — NO se queda en el servidor.
// - Si hay media-service propio (Render/Arch) configurado → lo usa (YouTube con cookies).
// - Si no → cae al proxy de Vercel → Cobalt.
export async function downloadMedia(url: string, format: 'mp3' | 'mp4', filename: string): Promise<void> {
  let r: Response;
  if (isMediaConfigured()) {
    r = await fetch(`${MEDIA_URL}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format }),
    });
  } else {
    const qs = `url=${encodeURIComponent(url)}&format=${format}&filename=${encodeURIComponent(filename)}`;
    r = await fetch(`/api/download?${qs}`, { cache: 'no-store' });
  }
  if (!r.ok) {
    let msg = 'Error en la descarga';
    try { const j = await r.json(); msg = j.error || msg; } catch { /* respuesta binaria/no-JSON */ }
    throw new Error(msg);
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
