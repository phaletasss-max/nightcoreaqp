// ── Búsqueda en YouTube vía Data API v3 (oficial, no la bloquean) ────────────
// Reemplaza la búsqueda por yt-dlp (ytsearch) que YouTube bloquea en IPs de
// datacenter. Devuelve { results: [{ url, title, author, thumbnail, duration }] }.
//
// Requiere YOUTUBE_API_KEY (Google Cloud → YouTube Data API v3). Si no está
// configurada, responde 501 y el caller (media.ts) cae al media-service yt-dlp.
//
// Cuota: search.list = 100 unidades; videos.list (duraciones) = 1 unidad. El
// límite gratuito por defecto es 10.000/día ≈ 100 búsquedas/día.

import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const KEY = process.env.YOUTUBE_API_KEY || '';
const API = 'https://www.googleapis.com/youtube/v3';

// Convierte una duración ISO-8601 (ej. "PT3M25S") a segundos.
function isoToSeconds(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  const [, h, mi, s] = m;
  return (parseInt(h || '0', 10) * 3600) + (parseInt(mi || '0', 10) * 60) + parseInt(s || '0', 10);
}

export async function GET(request: NextRequest) {
  if (!KEY) return Response.json({ error: 'YOUTUBE_API_KEY no configurada' }, { status: 501 });

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim();
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '6', 10) || 6, 1), 10);
  if (!q) return Response.json({ error: 'Falta q' }, { status: 400 });

  try {
    // 1) Buscar videos (snippet: título, canal, miniatura).
    const searchUrl = `${API}/search?part=snippet&type=video&maxResults=${limit}&q=${encodeURIComponent(q)}&key=${KEY}`;
    const sr = await fetch(searchUrl, { cache: 'no-store' });
    const sdata = await sr.json().catch(() => null);
    if (!sr.ok) {
      const reason = sdata?.error?.message || `Data API status ${sr.status}`;
      return Response.json({ error: reason }, { status: sr.status === 403 ? 403 : 502 });
    }

    interface YtItem { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; thumbnails?: Record<string, { url?: string }> } }
    const items: YtItem[] = Array.isArray(sdata?.items) ? sdata.items : [];
    const ids = items.map((it) => it.id?.videoId).filter(Boolean) as string[];

    // 2) Duraciones (1 unidad de cuota). Si falla, seguimos sin duración.
    const durations: Record<string, number | undefined> = {};
    if (ids.length) {
      try {
        const vr = await fetch(`${API}/videos?part=contentDetails&id=${ids.join(',')}&key=${KEY}`, { cache: 'no-store' });
        const vdata = await vr.json().catch(() => null);
        for (const v of (vdata?.items || [])) durations[v.id] = isoToSeconds(v.contentDetails?.duration);
      } catch { /* duración es opcional */ }
    }

    const results = items
      .filter((it) => it.id?.videoId)
      .map((it) => {
        const id = it.id!.videoId!;
        const th = it.snippet?.thumbnails || {};
        return {
          url: `https://www.youtube.com/watch?v=${id}`,
          title: it.snippet?.title,
          author: it.snippet?.channelTitle,
          thumbnail: (th.high || th.medium || th.default)?.url,
          duration: durations[id],
        };
      });

    return Response.json({ results });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error en la búsqueda' }, { status: 500 });
  }
}
