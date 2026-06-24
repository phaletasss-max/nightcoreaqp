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

// Cascada de instancias Cobalt: si la primera está caída/rate-limited/bloqueada,
// se prueba la siguiente. COBALT_API_URL puede traer varias separadas por coma;
// si no, se usa una flota pública por defecto. La key (opcional) aplica a todas.
const DEFAULT_INSTANCES = [
  'https://cobalt-api.kwiatekmiki.com',
  'https://cobalt-api.meowing.de',
  'https://dwnld.nichita.net',
  'https://co.eepy.today',
];
const INSTANCES = (process.env.COBALT_API_URL || DEFAULT_INSTANCES.join(','))
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
const KEY = process.env.COBALT_API_KEY || '';

interface CobaltAttempt { mediaUrl: string | null; detail: string }

// Pide a UNA instancia el enlace de medios. Devuelve la url o un detalle del fallo.
async function askInstance(base: string, url: string, format: 'mp3' | 'mp4'): Promise<CobaltAttempt> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (KEY) headers.Authorization = `Api-Key ${KEY}`;

  // Timeout por instancia: que una colgada no consuma todo el presupuesto (60s).
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const ask = await fetch(`${base}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        downloadMode: format === 'mp3' ? 'audio' : 'auto',
        audioFormat: format === 'mp3' ? 'mp3' : 'best',
        filenameStyle: 'basic',
      }),
      cache: 'no-store',
      signal: ctrl.signal,
    });
    const data = await ask.json().catch(() => null);
    if (!data) return { mediaUrl: null, detail: 'sin respuesta JSON' };

    if (data.status === 'tunnel' || data.status === 'redirect' || data.status === 'stream')
      return { mediaUrl: data.url, detail: 'ok' };
    if (data.status === 'picker' && Array.isArray(data.picker) && data.picker[0]?.url)
      return { mediaUrl: data.picker[0].url, detail: 'ok' };

    const detail = data?.error?.code || data?.error?.context?.service || data?.text || `status=${data?.status || 'desconocido'}`;
    return { mediaUrl: null, detail: String(detail) };
  } catch (e) {
    return { mediaUrl: null, detail: e instanceof Error ? e.message : 'error de red' };
  } finally {
    clearTimeout(t);
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const url = sp.get('url');
  const format = sp.get('format') === 'mp3' ? 'mp3' : 'mp4';
  const filename = (sp.get('filename') || 'descarga').replace(/[^a-z0-9_-]/gi, '_').slice(0, 60) || 'descarga';
  if (!url) return Response.json({ error: 'Falta url' }, { status: 400 });

  // Recorre la flota hasta que una instancia entregue un enlace de medios usable.
  const failures: string[] = [];
  let mediaUrl: string | null = null;
  for (const base of INSTANCES) {
    const r = await askInstance(base, url, format);
    if (r.mediaUrl) { mediaUrl = r.mediaUrl; break; }
    const host = base.replace(/^https?:\/\//, '');
    failures.push(`${host}: ${r.detail}`);
  }

  if (!mediaUrl) {
    return Response.json(
      { error: `Ninguna instancia de descarga entregó el video. Prueba TikTok/Instagram o configura COBALT_API_URL. Detalle: ${failures.join(' | ')}` },
      { status: 502 },
    );
  }

  try {
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
