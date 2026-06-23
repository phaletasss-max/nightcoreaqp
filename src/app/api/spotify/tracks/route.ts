// ── Ruta de servidor: tracks de una playlist de Spotify ──────────────────────
// Lee la lista de canciones de una playlist PÚBLICA usando la Web API de Spotify
// con el flujo Client Credentials. El Client ID/Secret viven SOLO aquí (server),
// nunca llegan al navegador. Corre en Vercel (Spotify no bloquea sus IPs).
//
// GET /api/spotify/tracks?playlist=<id|url>
//   → { tracks: [{ id, title, artist, url, image }] }  |  { error }

import type { NextRequest } from 'next/server';

// Cache del token en memoria del proceso (se reusa mientras la instancia esté viva).
let cachedToken: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now()) return cachedToken.token;

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Spotify no está configurado en el servidor');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No se pudo autenticar con Spotify');

  const data = await res.json();
  // Renueva 60s antes de que expire para evitar usar un token al límite.
  cachedToken = { token: data.access_token, exp: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000 };
  return cachedToken.token;
}

// Acepta: id pelado (22 chars), URL open.spotify.com/playlist/<id>, o spotify:playlist:<id>.
function extractPlaylistId(input: string): string | null {
  const m = input.match(/playlist[/:]([A-Za-z0-9]{22})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9]{22}$/.test(input.trim())) return input.trim();
  return null;
}

interface SpotifyArtist { name: string }
interface SpotifyImage { url: string }
interface SpotifyTrack {
  id: string | null;
  name: string;
  artists?: SpotifyArtist[];
  external_urls?: { spotify?: string };
  album?: { images?: SpotifyImage[] };
}
interface SpotifyPlaylistItem { track: SpotifyTrack | null }
interface SpotifyTracksPage { items?: SpotifyPlaylistItem[]; next: string | null }

type Track = { id: string; title: string; artist: string; url: string; image: string | null };

// ── Vía EMBED (sin auth, evita el 403 de client-credentials) ──────────────────
// La página pública de embed trae la lista de canciones dentro de un <script
// __NEXT_DATA__>. Leemos nombres + artistas de ahí; cada uno se busca luego en
// YouTube al sugerir. No usa API key ni login → no la bloquea el 403.
async function tracksFromEmbed(id: string): Promise<Track[] | null> {
  const r = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'es,en;q=0.8',
    },
    cache: 'no-store',
  });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  let data: unknown;
  try { data = JSON.parse(m[1]); } catch { return null; }

  // Navegación defensiva hasta entity.trackList.
  const entity = (data as { props?: { pageProps?: { state?: { data?: { entity?: {
    trackList?: { uri?: string; title?: string; subtitle?: string }[];
    coverArt?: { sources?: { url?: string }[] };
  } } } } } })?.props?.pageProps?.state?.data?.entity;
  const list = entity?.trackList;
  if (!Array.isArray(list) || !list.length) return null;
  const cover = entity?.coverArt?.sources?.[0]?.url ?? null;

  return list
    .map((t, i): Track => ({
      id: t.uri || `emb-${i}`,
      title: (t.title || '').trim(),
      artist: (t.subtitle || '').trim(),
      url: '',                 // se resolverá a YouTube al sugerir
      image: cover,
    }))
    .filter((t) => t.title);
}

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get('playlist') ?? '';
  const id = extractPlaylistId(param);
  if (!id) return Response.json({ error: 'Enlace de playlist inválido' }, { status: 400 });

  // 1) Intentar la vía EMBED (pública, sin auth). Resuelve el 403.
  try {
    const embed = await tracksFromEmbed(id);
    if (embed && embed.length) return Response.json({ tracks: embed, source: 'embed' });
  } catch { /* sigue a la API oficial */ }

  // 2) API oficial (si hay credenciales y la playlist es accesible).
  try {
    const token = await getToken();
    const tracks: { id: string; title: string; artist: string; url: string; image: string | null }[] = [];

    const fields = 'next,items(track(id,name,artists(name),external_urls(spotify),album(images)))';
    let url: string | null =
      `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100&fields=${encodeURIComponent(fields)}`;

    // Paginación: playlists con más de 100 canciones.
    let guard = 0;
    while (url && guard < 25) {
      guard++;
      const r: Response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!r.ok) {
        if (r.status === 404) return Response.json({ error: 'Playlist no encontrada o privada (hazla pública)' }, { status: 404 });
        if (r.status === 401) { cachedToken = null; return Response.json({ error: 'Token de Spotify rechazado, intenta de nuevo' }, { status: 502 }); }
        // Surface del status y cuerpo real de Spotify para diagnóstico.
        const body = await r.text().catch(() => '');
        return Response.json(
          { error: `Spotify respondió ${r.status}`, detail: body.slice(0, 400) },
          { status: 502 },
        );
      }
      const page: SpotifyTracksPage = await r.json();
      for (const it of page.items ?? []) {
        const t = it.track;
        if (!t || !t.id) continue; // descarta episodios/locales sin id
        tracks.push({
          id: t.id,
          title: t.name,
          artist: (t.artists ?? []).map((a) => a.name).filter(Boolean).join(', '),
          url: t.external_urls?.spotify ?? '',
          image: t.album?.images?.[t.album.images.length - 1]?.url ?? t.album?.images?.[0]?.url ?? null,
        });
      }
      url = page.next;
    }

    return Response.json({ tracks });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Error al consultar Spotify' },
      { status: 500 },
    );
  }
}
