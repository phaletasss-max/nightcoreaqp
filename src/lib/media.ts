// ── Cliente del media-service ────────────────────────────────────────────────
// Habla con el microservicio en el servidor Arch (yt-dlp). Si no está configurado
// (env vacío), las funciones degradan: checkVideo devuelve null (el caller hace una
// verificación básica de YouTube), y las descargas se deshabilitan en la UI.

const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || '').replace(/\/$/, '');

export function isMediaConfigured(): boolean {
  return !!MEDIA_URL && !MEDIA_URL.includes('tu-media-service');
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
    const r = await fetch(`${MEDIA_URL}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return (await r.json()) as VideoInfo;
  } catch {
    return { available: false, embeddable: false, error: 'No se pudo contactar el media-service' };
  }
}

// Descarga mp3/mp4 vía el media-service (stream → blob → descarga en el navegador).
export async function downloadMedia(url: string, format: 'mp3' | 'mp4', filename: string): Promise<void> {
  if (!isMediaConfigured()) throw new Error('Descarga disponible cuando el media-service esté conectado');
  const r = await fetch(`${MEDIA_URL}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format }),
  });
  if (!r.ok) throw new Error('Error en la descarga');
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
