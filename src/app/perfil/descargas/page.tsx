'use client';

// ── Página de Descargas — Descargador de videos ──────────────────────────────
// Permite a los usuarios descargar videos de YouTube, Instagram, TikTok
// usando el media-service (yt-dlp). También pueden sugerir canciones
// para la playlist del DJ directamente desde aquí.

import React, { useState } from 'react';
import {
  Download, Link2, Music, Video, AlertCircle, CheckCircle2,
  Loader2, PlayCircle, Camera, Sparkles, Zap, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { downloadMedia, checkVideo, isMediaConfigured, storeBackup } from '@/lib/media';
import { addSong, getSongs } from '@/lib/data';
import type { Song } from '@/lib/types';
import { usePlayer } from '@/context/PlayerContext';

type Platform = 'youtube' | 'instagram' | 'tiktok' | 'unknown';

function detectPlatform(url: string): Platform {
  if (/youtu(\.be|be\.com)/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  return 'unknown';
}

const platformInfo: Record<Platform, { label: string; color: string; icon: React.ReactNode }> = {
  youtube: { label: 'YouTube', color: 'text-red-400', icon: <PlayCircle className="h-5 w-5" /> },
  instagram: { label: 'Instagram', color: 'text-pink-400', icon: <Camera className="h-5 w-5" /> },
  tiktok: { label: 'TikTok', color: 'text-neon-cyan', icon: <Music className="h-5 w-5" /> },
  unknown: { label: 'Enlace', color: 'text-muted', icon: <Link2 className="h-5 w-5" /> },
};

export default function DescargasPage() {
  const { profile, addPoints } = useAuth();
  const mediaOn = isMediaConfigured();

  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sugerir canción
  const [suggestMode, setSuggestMode] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState('');
  const [suggestArtist, setSuggestArtist] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestDone, setSuggestDone] = useState(false);

  const [songs, setSongs] = useState<Song[]>([]);

  React.useEffect(() => {
    getSongs().then(setSongs);
  }, []);

  const platform = url ? detectPlatform(url) : 'unknown';
  const pInfo = platformInfo[platform];
  const { playItem } = usePlayer();

  const handleDownload = async () => {
    if (!url.trim()) return;
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      if (!mediaOn) {
        throw new Error('El servicio de descarga no está conectado aún. Pronto estará disponible.');
      }

      const cleanUrl = (u: string) => u.split('&list=')[0].split('?list=')[0];
      const cUrl = cleanUrl(url);

      // Verificar disponibilidad
      const info = await checkVideo(cUrl);
      if (info && !info.available) {
        throw new Error('Ese enlace no está disponible o es privado.');
      }

      const filename = info?.title || `descarga_${Date.now()}`;
      
      // La reproducción automática fue removida. Solo descarga normal.
      await downloadMedia(cUrl, format, filename.replace(/[^a-z0-9]/gi, '_').substring(0, 50));
      setSuccess(true);
      addPoints(3);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la descarga');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = (u: string) => u.split('&list=')[0].split('?list=')[0];
    const cUrl = cleanUrl(url);
    if (!cUrl.trim() || !suggestTitle.trim() || !suggestArtist.trim()) return;

    const isYt = cUrl.includes('youtube.com') || cUrl.includes('youtu.be');
    if (!isYt) {
      setError('Solo puedes sugerir enlaces de YouTube a la playlist.');
      return;
    }

    const exists = songs.find(s => s.youtube_url === cUrl || s.youtube_url === url);
    if (exists) {
      setError('Esta canción ya fue sugerida y está en la playlist.');
      return;
    }

    setSuggesting(true);
    setError(null);

    try {
      // Añadir a la playlist
      await addSong(
        { title: suggestTitle, artist: suggestArtist, youtube_url: cUrl },
        profile?.id ?? null,
        profile?.username ?? 'Anónimo',
      );

      if (mediaOn) {
        const storedUrl = await storeBackup(cUrl, 'mp4');
      }

      addPoints(5);
      setSuggestDone(true);
      setSuggestTitle('');
      setSuggestArtist('');
      setUrl('');
      setTimeout(() => setSuggestDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sugerir');
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="badge badge-pink mx-auto">
          <Sparkles className="h-3.5 w-3.5 glow-magenta" /> Descargador ✦
        </div>
        <h1 className="section-title text-3xl">
          <span className="text-glow-rainbow">Descarga</span> tus videos favoritos
        </h1>
        <p className="text-sm text-muted max-w-md mx-auto">
          Descarga videos de YouTube, Instagram y TikTok. También puedes sugerir canciones directamente para la playlist del DJ.
        </p>
      </div>

      {/* Input principal */}
      <div className="card p-6 sm:p-8 space-y-5 accent-magenta">
        <div className="space-y-2">
          <label className="label flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5" /> Pega tu enlace
          </label>
          <div className="relative">
            <input
              className="input pr-24"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); setSuccess(false); }}
              placeholder="https://www.youtube.com/watch?v=..."
              type="url"
            />
            {url && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold ${pInfo.color}`}>
                {pInfo.icon}
                {pInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Formato */}
        <div className="space-y-2">
          <label className="label">Formato</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('mp4')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-bold transition-colors ${
                format === 'mp4'
                  ? 'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta'
                  : 'border-border text-muted hover:text-white'
              }`}
            >
              <Video className="h-4 w-4" /> MP4 (Video)
            </button>
            <button
              type="button"
              onClick={() => setFormat('mp3')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-bold transition-colors ${
                format === 'mp3'
                  ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                  : 'border-border text-muted hover:text-white'
              }`}
            >
              <Music className="h-4 w-4" /> MP3 (Audio)
            </button>
          </div>
        </div>

        {/* Errores y éxito */}
        {error && (
          <div className="badge badge-red w-full justify-start py-2.5 px-3 normal-case tracking-normal text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="badge badge-lime w-full justify-start py-2.5 px-3 normal-case tracking-normal text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>¡Descarga iniciada! (+3 pts) ✦</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleDownload}
            disabled={!url.trim() || loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Descargando…</>
            ) : (
              <><Download className="h-4 w-4" /> Descargar</>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!url.trim()) return;
              const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || '').replace(/\/$/, '');
              const cleanUrl = (u: string) => u.split('&list=')[0].split('?list=')[0];
              playItem({ 
                 type: 'stream', 
                 url: `${MEDIA_URL}/api/download?url=${encodeURIComponent(cleanUrl(url))}&format=mp4`,
                 title: 'Vista previa',
                 artist: 'Descargas'
              });
            }}
            disabled={!url.trim() || loading}
            className="btn btn-lime w-full text-black hover:bg-neon-lime/80"
          >
            <PlayCircle className="h-4 w-4" /> Ver en fondo
          </button>
          <button
            onClick={async () => {
              setSuggestMode(!suggestMode);
              if (!suggestMode && url.trim()) {
                const cleanUrl = (u: string) => u.split('&list=')[0].split('?list=')[0];
                const cUrl = cleanUrl(url);
                const exists = songs.find(s => s.youtube_url === cUrl || s.youtube_url === url);
                if (exists) {
                  setError('⚠️ Esta canción ya está en la playlist.');
                  setSuggestMode(false);
                  return;
                }
                if (cUrl.includes('youtu')) {
                  try {
                    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cUrl)}`);
                    const data = await res.json();
                    if (data.title) {
                      const parts = data.title.split('-');
                      if (parts.length > 1) {
                        setSuggestArtist(parts[0].trim());
                        setSuggestTitle(parts.slice(1).join('-').trim());
                      } else {
                        setSuggestTitle(data.title);
                      }
                    }
                  } catch(e) {}
                }
              }
            }}
            className="btn btn-cyan w-full"
          >
            <Zap className="h-4 w-4" /> Sugerir al DJ
          </button>
        </div>

        {!mediaOn && (
          <p className="text-[11px] text-muted-2 text-center">
            ⚡ El servicio de descarga se está configurando. Pronto estará disponible para descargas directas.
          </p>
        )}
      </div>

      {/* Formulario de sugerencia al DJ */}
      {suggestMode && (
        <form onSubmit={handleSuggest} className="card p-6 space-y-4 accent-cyan animate-fade-in">
          <h3 className="section-title text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-neon-cyan glow-cyan" /> Sugerir canción para la playlist
          </h3>
          <p className="text-xs text-muted">
            El enlace se descargará y se añadirá a la playlist pública. El DJ la tendrá lista para el próximo evento.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Título de la canción</label>
              <input className="input" required value={suggestTitle} onChange={(e) => setSuggestTitle(e.target.value)} placeholder="Ej. Angel With A Shotgun" />
            </div>
            <div>
              <label className="label">Artista / Remix</label>
              <input className="input" required value={suggestArtist} onChange={(e) => setSuggestArtist(e.target.value)} placeholder="Ej. Nightcore (The Cab)" />
            </div>
          </div>

          {suggestDone && (
            <div className="badge badge-lime w-full justify-start py-2.5 px-3 normal-case tracking-normal text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>¡Canción sugerida con éxito! (+5 pts) Se añadirá a la playlist ✦</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setSuggestMode(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" disabled={suggesting || !url.trim()} className="btn btn-cyan">
              {suggesting ? 'Enviando…' : <><ArrowRight className="h-4 w-4" /> Sugerir</>}
            </button>
          </div>
        </form>
      )}

      {/* Info de plataformas soportadas */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-neon-magenta" /> Plataformas soportadas
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'YouTube', icon: <PlayCircle className="h-6 w-6" />, color: 'text-red-400', desc: 'Videos y música' },
            { name: 'Instagram', icon: <Camera className="h-6 w-6" />, color: 'text-pink-400', desc: 'Reels y posts' },
            { name: 'TikTok', icon: <Music className="h-6 w-6" />, color: 'text-neon-cyan', desc: 'Videos cortos' },
          ].map((p) => (
            <div key={p.name} className="card bg-surface-2 p-4 text-center space-y-2 rainbow-border">
              <div className={`mx-auto ${p.color}`}>{p.icon}</div>
              <p className="text-sm font-bold text-white">{p.name}</p>
              <p className="text-[10px] text-muted-2">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reglas */}
      <div className="card p-5 space-y-3">
        <h4 className="font-bold text-white text-sm">Información importante</h4>
        <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
          <li>Las descargas son para uso personal.</li>
          <li>Las canciones sugeridas se añaden a la playlist pública del DJ.</li>
          <li>Respeta los derechos de autor — solo contenido para disfrute personal.</li>
          <li>El servicio usa yt-dlp y es gratuito para la comunidad.</li>
        </ul>
      </div>
    </div>
    </>
  );
}
