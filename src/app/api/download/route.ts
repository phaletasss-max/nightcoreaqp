// ── Proxy de descarga (in-page, sin servidor propio) ─────────────────────────
// Vercel no puede correr yt-dlp, pero SÍ puede pedirle el archivo a un servicio
// público que sí lo corre (Cobalt, open-source) y devolverlo aquí mismo. Así la
// descarga ocurre DENTRO de la web, sin redirigir a otro sitio.
//
// Configurable: COBALT_API_URL (instancia de Cobalt) y COBALT_API_KEY (opcional).
// Lista de instancias públicas: https://instances.cobalt.best

import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const COBALT = (process.env.COBALT_API_URL || 'https://cobalt-api.kwiatekmiki.com').replace(/\/$/, '');
const KEY = process.env.COBALT_API_KEY || '';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const url = sp.get('url');
  const format = sp.get('format') === 'mp3' ? 'mp3' : 'mp4';
  const filename = (sp.get('filename') || 'descarga').replace(/[^a-z0-9_-]/gi, '_').slice(0, 60) || 'descarga';
  if (!url) return Response.json({ error: 'Falta url' }, { status: 400 });

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (KEY) headers.Authorization = `Api-Key ${KEY}`;

    const ask = await fetch(`${COBALT}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        downloadMode: format === 'mp3' ? 'audio' : 'auto',
        audioFormat: format === 'mp3' ? 'mp3' : 'best',
        filenameStyle: 'basic',
      }),
      cache: 'no-store',
    });

    const data = await ask.json().catch(() => null);
    if (!data) return Response.json({ error: 'El servicio de descarga no respondió (intenta otra instancia COBALT_API_URL).' }, { status: 502 });

    let mediaUrl: string | null = null;
    if (data.status === 'tunnel' || data.status === 'redirect' || data.status === 'stream') mediaUrl = data.url;
    else if (data.status === 'picker' && Array.isArray(data.picker) && data.picker[0]?.url) mediaUrl = data.picker[0].url;

    if (!mediaUrl) {
      const msg = data?.error?.code || data?.text || 'No se pudo obtener el video (¿privado/region bloqueada?).';
      return Response.json({ error: msg }, { status: 502 });
    }

    // Stream del archivo de vuelta al navegador → descarga en-página.
    const media = await fetch(mediaUrl, { cache: 'no-store' });
    if (!media.ok || !media.body) return Response.json({ error: 'No se pudo descargar el archivo.' }, { status: 502 });

    const ext = format === 'mp3' ? 'mp3' : 'mp4';
    return new Response(media.body, {
      headers: {
        'Content-Type': format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}.${ext}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error en la descarga' }, { status: 500 });
  }
}
