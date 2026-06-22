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

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get('playlist') ?? '';
  const id = extractPlaylistId(param);
  if (!id) return Response.json({ error: 'Enlace de playlist inválido' }, { status: 400 });

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
        return Response.json({ error: 'Spotify respondió con un error' }, { status: 502 });
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
