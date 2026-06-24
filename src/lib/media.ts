// ── Cliente del media-service (búsqueda de respaldo + Storage) ───────────────
// Las DESCARGAS ya no pasan por aquí: ocurren en la PC/celular del usuario (ver
// src/lib/crate.ts). Esto solo cubre la búsqueda de respaldo (yt-dlp) y storeBackup
// (fondos del DJ); ambas degradan a no-op si el media-service no está configurado.

const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || '').replace(/\/$/, '');

// Solo está "configurado" si hay una URL real (https, no localhost).
export function isMediaConfigured(): boolean {
  return !!MEDIA_URL && MEDIA_URL.startsWith('http') && !MEDIA_URL.includes('localhost');
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

export interface YtSearchResult { url: string; title?: string; author?: string; thumbnail?: string; duration?: number }

// Búsqueda oficial vía YouTube Data API (ruta /api/youtube/search en Vercel). No la
// bloquea YouTube (a diferencia del ytsearch de yt-dlp). Devuelve [] si la API no
// está configurada (501) o no hay resultados, para que el caller decida el fallback.
async function searchViaDataApi(query: string, limit: number): Promise<YtSearchResult[]> {
  try {
    const r = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&limit=${limit}`, { cache: 'no-store' });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results as YtSearchResult[]) || [];
  } catch {
    return [];
  }
}

// Búsqueda vía media-service (yt-dlp ytsearch). Respaldo: puede estar bloqueada por
// YouTube en IPs de datacenter. Vacío si no hay media-service o falla.
async function searchViaMediaService(query: string, limit: number): Promise<YtSearchResult[]> {
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

// Busca en YouTube la mejor coincidencia de un texto y devuelve su URL. Sirve para
// convertir un pedido de Spotify en algo reproducible/descargable. Null si nada da resultado.
export async function searchYouTube(query: string): Promise<string | null> {
  const list = await searchYouTubeList(query, 1);
  return list[0]?.url || null;
}

// Busca en YouTube y devuelve varios resultados (para que el usuario elija).
// Cascada: Data API oficial (no bloqueada) → media-service yt-dlp (respaldo).
export async function searchYouTubeList(query: string, limit = 6): Promise<YtSearchResult[]> {
  const viaApi = await searchViaDataApi(query, limit);
  if (viaApi.length) return viaApi;
  return searchViaMediaService(query, limit);
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
