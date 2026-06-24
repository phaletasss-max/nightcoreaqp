'use client';

// ── Página de Descargas — Descarga LOCAL (puente en la PC/celular) ───────────
// Ya NO descarga por servidor (YouTube bloquea la nube). En su lugar:
//  • PC: genera un .bat con el link/formato/calidad ya puestos; el usuario lo
//    ejecuta y yt-dlp descarga en SU PC (IP residencial → sin bloqueos).
//  • Celular: recomienda una app open-source (YTDLnis) vía modal.
// También permite buscar en YouTube (Data API) y sugerir canciones al DJ.

import React, { useState, useEffect } from 'react';
import {
  Download, Link2, Music, Video, AlertCircle, CheckCircle2,
  Loader2, PlayCircle, Camera, Sparkles, Zap, ArrowRight, Search, Smartphone, Monitor,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { searchYouTubeList, type YtSearchResult } from '@/lib/media';
import { buildCrateBat, downloadTextFile } from '@/lib/crate';
import { addSong, getSongs } from '@/lib/data';
import type { Song } from '@/lib/types';
import { usePlayer } from '@/context/PlayerContext';
import DownloadInstructionsModal from '@/components/DownloadInstructionsModal';

function getYouTubeId(url: string) {
  const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return m && m[2].length === 11 ? m[2] : null;
}

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

const QUALITIES = ['best', '1080', '720', '480', '360'];
const qualityLabel = (q: string) => (q === 'best' ? 'Mejor' : `${q}p`);

export default function DescargasPage() {
  const { profile, addPoints } = useAuth();
  const { playItem } = usePlayer();

  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState<string>('best');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showMobile, setShowMobile] = useState(false);

  // Buscador de YouTube (Data API)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YtSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Sugerir canción
  const [suggestMode, setSuggestMode] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState('');
  const [suggestArtist, setSuggestArtist] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestDone, setSuggestDone] = useState(false);

  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => { getSongs().then(setSongs); }, []);

  const platform = url ? detectPlatform(url) : 'unknown';
  const pInfo = platformInfo[platform];
  const cleanLink = (u: string) => u.split('&list=')[0].split('?list=')[0].trim();

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true); setError(null); setSearchResults([]);
    try {
      const results = await searchYouTubeList(q, 6);
      if (!results.length) setError('Sin resultados. Revisa YOUTUBE_API_KEY o prueba otro nombre.');
      else setSearchResults(results);
    } finally { setSearching(false); }
  };

  const pickResult = (t: YtSearchResult, play = false) => {
    setUrl(t.url);
    setSearchResults([]);
    setSearchQuery('');
    setError(null);
    if (play) playItem({ type: 'yt', id: getYouTubeId(t.url) || '', title: t.title || 'Previa', artist: t.author || 'YouTube' });
  };

  // Genera el .bat de descarga local con este link y lo baja al navegador.
  const handleDownload = () => {
    const cUrl = cleanLink(url);
    setError(null);
    setSuccess(false);
    if (!/^https?:\/\//i.test(cUrl) || !/(youtu\.?be|youtube\.com|tiktok\.com|instagram\.com)/i.test(cUrl)) {
      setError('Pega un enlace válido de YouTube, TikTok o Instagram (debe empezar con http).');
      return;
    }
    const bat = buildCrateBat([cUrl], format, { title: 'Descarga', quality: format === 'mp4' ? quality : undefined });
    downloadTextFile(`NightcoreAQP_${platform}_${format}.bat`, bat);
    setSuccess(true);
    addPoints(3);
    setTimeout(() => setSuccess(false), 5000);
  };

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cUrl = cleanLink(url);
    if (!cUrl.trim() || !suggestTitle.trim() || !suggestArtist.trim()) return;
    if (!profile) { setError('⚠️ Necesitas iniciar sesión para poder sugerir canciones.'); return; }

    const isYt = cUrl.includes('youtube.com') || cUrl.includes('youtu.be');
    if (!isYt) { setError('Solo puedes sugerir enlaces de YouTube a la playlist.'); return; }

    if (songs.find((s) => s.youtube_url === cUrl || s.youtube_url === url)) {
      setError('Esta canción ya fue sugerida y está en la playlist.');
      return;
    }

    setSuggesting(true);
    setError(null);
    try {
      await addSong(
        { title: suggestTitle, artist: suggestArtist, youtube_url: cUrl },
        profile?.id ?? null,
        profile?.username ?? 'Anónimo',
      );
      addPoints(5);
      setSuggestDone(true);
      setSuggestTitle(''); setSuggestArtist(''); setUrl('');
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
          La descarga ocurre en <strong>tu propio dispositivo</strong> (PC o celular), sin bloqueos. También puedes sugerir canciones para la playlist del DJ.
        </p>
      </div>

      {/* Buscador de YouTube por nombre */}
      <div className="card p-5 space-y-3 accent-cyan">
        <label className="label flex items-center gap-2"><Search className="h-3.5 w-3.5" /> Buscar en YouTube por nombre</label>
        <form onSubmit={doSearch} className="flex gap-2">
          <input className="input flex-1" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ej. Alan Walker Faded nightcore" />
          <button type="submit" disabled={searching} className="btn btn-cyan shrink-0">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
          </button>
        </form>
        {searchResults.length > 0 && (
          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {searchResults.map((t) => (
              <div key={t.url} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-white/[0.02]">
                {t.thumbnail && <img src={t.thumbnail} alt="" className="h-10 w-16 rounded object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{t.title}</p>
                  <p className="text-xs text-muted truncate">{t.author}{t.duration ? ` · ${Math.floor(t.duration / 60)}:${String(Math.floor(t.duration % 60)).padStart(2, '0')}` : ''}</p>
                </div>
                <button onClick={() => pickResult(t, true)} title="Elegir y ver en fondo" className="btn btn-lime text-black text-xs px-2.5 py-1.5 shrink-0">
                  <PlayCircle className="h-3.5 w-3.5" /> Elegir
                </button>
              </div>
            ))}
          </div>
        )}
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
            <button type="button" onClick={() => setFormat('mp4')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-bold transition-colors ${format === 'mp4' ? 'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta' : 'border-border text-muted hover:text-white'}`}>
              <Video className="h-4 w-4" /> MP4 (Video)
            </button>
            <button type="button" onClick={() => setFormat('mp3')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-bold transition-colors ${format === 'mp3' ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan' : 'border-border text-muted hover:text-white'}`}>
              <Music className="h-4 w-4" /> MP3 (Audio)
            </button>
          </div>
        </div>

        {/* Calidad (MP4) */}
        {format === 'mp4' && (
          <div className="space-y-2">
            <label className="label">Calidad del video</label>
            <div className="flex flex-wrap gap-2">
              {QUALITIES.map((q) => (
                <button key={q} type="button" onClick={() => setQuality(q)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${quality === q ? 'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta' : 'border-border text-muted hover:text-white'}`}>
                  {qualityLabel(q)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Errores y éxito */}
        {error && (
          <div className="badge badge-red w-full justify-start py-2.5 px-3 normal-case tracking-normal text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="badge badge-lime w-full justify-start py-2.5 px-3 normal-case tracking-normal text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>¡Descargador listo! Abre el .bat que se bajó y sigue las instrucciones. (+3 pts) ✦</span>
          </div>
        )}

        {/* Botones: descargar en PC / celular / sugerir */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={handleDownload} disabled={!url.trim()} className="btn btn-primary w-full">
            <Monitor className="h-4 w-4" /> Descargar en PC
          </button>
          <button type="button" onClick={() => setShowMobile(true)} className="btn btn-lime w-full text-black hover:bg-neon-lime/80">
            <Smartphone className="h-4 w-4" /> En celular
          </button>
          <button
            onClick={async () => {
              setSuggestMode(!suggestMode);
              if (!suggestMode && url.trim()) {
                const cUrl = cleanLink(url);
                if (songs.find((s) => s.youtube_url === cUrl || s.youtube_url === url)) {
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
                  } catch { /* ignorar */ }
                }
              }
            }}
            className="btn btn-cyan w-full"
          >
            <Zap className="h-4 w-4" /> Sugerir al DJ
          </button>
        </div>

        <p className="text-[11px] text-muted-2 text-center border-t border-border pt-3">
          En PC se baja un <strong>.bat</strong> que descarga el video en tu equipo (la primera vez instala yt-dlp solo). En celular usa la app recomendada.
        </p>
      </div>

      {/* Formulario de sugerencia al DJ */}
      {suggestMode && (
        <form onSubmit={handleSuggest} className="card p-6 space-y-4 accent-cyan animate-fade-in">
          <h3 className="section-title text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-neon-cyan glow-cyan" /> Sugerir canción para la playlist
          </h3>
          <p className="text-xs text-muted">
            El enlace se añade a la playlist pública. El DJ la tendrá lista para el próximo evento.
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
          <li>La descarga ocurre en tu dispositivo; el sitio no guarda los archivos.</li>
          <li>Las canciones sugeridas se añaden a la playlist pública del DJ.</li>
          <li>Respeta los derechos de autor — solo contenido para disfrute personal.</li>
          <li>El descargador usa yt-dlp (software libre) y es gratis para la comunidad.</li>
        </ul>
      </div>
    </div>

    {showMobile && <DownloadInstructionsModal onClose={() => setShowMobile(false)} />}
    </>
  );
}
