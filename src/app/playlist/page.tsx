'use client';

import React, { useState, useEffect } from 'react';
import {
  Music, Plus, ChevronUp, ChevronDown, Play, ExternalLink, Search, Music3,
  Link2, Check, AlertCircle, Loader2, Video, CheckCircle2, UploadCloud
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getSongs, addSong, setSongVote, uploadMediaFile } from '@/lib/data';
import { checkVideo, isMediaConfigured, searchYouTube, searchYouTubeList, type VideoInfo, type YtSearchResult } from '@/lib/media';
import type { Song, VoteType } from '@/lib/types';
import { usePlayer, type PlayableItem } from '@/context/PlayerContext';
import DownloadInstructionsModal from '@/components/DownloadInstructionsModal';

function getYouTubeId(url: string) {
  const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return m && m[2].length === 11 ? m[2] : null;
}

// Hosts que yt-dlp SÍ puede descargar. Spotify NO (streaming con DRM) → no mostramos
// botones de descarga en esas canciones (solo sirven como pedido al DJ).
const DOWNLOADABLE = /(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com)/i;
const isSpotify = (url: string) => /open\.spotify\.com|spotify:/i.test(url);

const tagColor: Record<string, string> = {
  FNAF: 'badge-red', Anime: 'badge-pink', Undertale: 'badge-yellow',
  Minecraft: 'badge-green',
};

export default function PlaylistPage() {
  const { profile, addPoints } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const { playingItem, playItem, setQueue } = usePlayer();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newTags, setNewTags] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [youtubeEquivalent, setYoutubeEquivalent] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // ── Importar desde Spotify ──
  const [showSpotify, setShowSpotify] = useState(false);
  const [spUrl, setSpUrl] = useState('');
  const [spTracks, setSpTracks] = useState<{ id: string; title: string; artist: string; url: string; image: string | null }[]>([]);
  const [spLoading, setSpLoading] = useState(false);
  const [spError, setSpError] = useState<string | null>(null);
  const [spSuggested, setSpSuggested] = useState<string[]>([]);
  const [spSuggesting, setSpSuggesting] = useState<string | null>(null);

  const loadSpotify = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = (spUrl.match(/playlist[/:]([A-Za-z0-9]{22})/) || [])[1] || (/^[A-Za-z0-9]{22}$/.test(spUrl.trim()) ? spUrl.trim() : null);
    if (!id) { setSpError('Pega el enlace de una playlist pública de Spotify.'); return; }
    setSpLoading(true); setSpError(null); setSpTracks([]);
    try {
      const r = await fetch(`/api/spotify/tracks?playlist=${id}`);
      const data = await r.json();
      if (!r.ok || data.error) setSpError(data.error || 'No se pudieron cargar las canciones.');
      else if (!data.tracks?.length) setSpError('La playlist no tiene canciones legibles (¿es pública y no editorial de Spotify?).');
      else setSpTracks(data.tracks);
    } catch {
      setSpError('No se pudo conectar con Spotify.');
    } finally {
      setSpLoading(false);
    }
  };

  // ── Buscar canción por nombre (YouTube, vía media-service) ──
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YtSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuggested, setSearchSuggested] = useState<string[]>([]);
  const [searchSuggesting, setSearchSuggesting] = useState<string | null>(null);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (!isMediaConfigured()) { setSearchError('La búsqueda necesita el media-service conectado.'); return; }
    setSearchLoading(true); setSearchError(null); setSearchResults([]);
    try {
      const results = await searchYouTubeList(q, 6);
      if (!results.length) setSearchError('Sin resultados. Prueba con otro nombre.');
      else setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  };

  const suggestFromSearch = async (t: YtSearchResult) => {
    if (searchSuggested.includes(t.url)) return;
    setSearchSuggesting(t.url);
    try {
      const row = await addSong(
        { title: t.title || 'Sin título', artist: t.author || 'YouTube', youtube_url: t.url, genre: 'YouTube', geek_tag: 'YouTube' },
        profile?.id ?? null, profile?.username ?? 'Tú',
      );
      setSongs((prev) => prev.some((s) => s.id === row.id) ? prev : [...prev, row]);
      setSearchSuggested((prev) => [...prev, t.url]);
      addPoints(5);
    } catch {
      setSearchError('No se pudo sugerir. Intenta de nuevo.');
    } finally {
      setSearchSuggesting(null);
    }
  };

  const suggestFromSpotify = async (t: { id: string; title: string; artist: string; url: string }) => {
    if (spSuggested.includes(t.id)) return;
    setSpSuggesting(t.id);
    try {
      // Buscar el equivalente en YouTube → reproducible y descargable. Si el
      // media-service no responde o no encuentra, cae al link de Spotify (solo pedido).
      const ytUrl = await searchYouTube(`${t.artist} ${t.title}`);
      const playableUrl = ytUrl || t.url;
      const fromYt = !!ytUrl;
      const row = await addSong(
        {
          title: t.title, artist: t.artist, youtube_url: playableUrl,
          genre: fromYt ? 'YouTube (de Spotify)' : 'Spotify',
          geek_tag: fromYt ? 'YouTube' : 'Spotify',
        },
        profile?.id ?? null, profile?.username ?? 'Tú',
      );
      setSongs((prev) => prev.some((s) => s.id === row.id) ? prev : [...prev, row]);
      setSpSuggested((prev) => [...prev, t.id]);
      addPoints(5);
    } catch {
      setSpError('No se pudo sugerir la canción. Intenta de nuevo.');
    } finally {
      setSpSuggesting(null);
    }
  };

  // Clean url logic to strip '&list=' parameters before fetching
  const cleanUrl = (u: string) => u.split('&list=')[0].split('?list=')[0];

  useEffect(() => {
    if (!showForm || !url || !url.startsWith('http')) {
      setTimeout(() => setVideoInfo(null), 0);
      return;
    }
    const cUrl = cleanUrl(url);
    const isYt = cUrl.includes('youtube.com') || cUrl.includes('youtu.be');
    const isSp = isSpotify(cUrl);
    
    if (!isYt && !isSp) {
      setTimeout(() => {
        setFormError('Solo se aceptan enlaces de YouTube o Spotify para la playlist.');
        setVideoInfo(null);
      }, 0);
      return;
    }

    setFormError(null);
    setYoutubeEquivalent(null);
    const t = setTimeout(async () => {
      setChecking(true);
      let info: VideoInfo | null = null;
      let finalYtUrl = cUrl;

      if (isSp) {
        // Auto-fetch Spotify metadata usando oEmbed
        try {
          const spRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(cUrl)}`);
          if (spRes.ok) {
            const spData = await spRes.json();
            const fetchedTitle = spData.title.split(' - ')[0]; // Limpiar "- Single"
            const fetchedArtist = spData.author_name || '';
            // Buscar equivalente en YouTube con la API v3 silenciosamente
            const ytUrl = await searchYouTube(`${fetchedArtist} ${fetchedTitle}`);
            if (ytUrl) {
              finalYtUrl = ytUrl;
              setYoutubeEquivalent(ytUrl);
              const ytRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(ytUrl)}`);
              if (ytRes.ok) {
                const ytData = await ytRes.json();
                info = { available: true, embeddable: true, title: fetchedTitle, author: fetchedArtist, thumbnail: ytData.thumbnail_url || spData.thumbnail_url };
              } else {
                info = { available: true, embeddable: true, title: fetchedTitle, author: fetchedArtist, thumbnail: spData.thumbnail_url };
              }
            } else {
              info = { available: true, embeddable: false, title: fetchedTitle, author: fetchedArtist, thumbnail: spData.thumbnail_url };
            }
          }
        } catch { /* ignorar error y forzar ingreso manual */ }
      } else {
        // Normal YT flow (noembed directo para evitar datacenter block)
        try {
          const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cUrl)}`);
          if (res.ok) {
            const data = await res.json();
            info = { available: true, embeddable: true, title: data.title, author: data.author_name, thumbnail: data.thumbnail_url };
          }
        } catch { /* ignorar fallback */ }
      }
      
      setChecking(false);
      setVideoInfo(info);
      if (info && info.available) {
        setTitle(info.title || '');
        setArtist(info.author || '');
        
        // Auto preview con el reproductor incrustado
        if (info.embeddable) {
          const yt = getYouTubeId(finalYtUrl);
          if (yt) playItem({ type: 'yt', id: yt, title: info.title || 'Previa', artist: info.author || 'Sugerencia' });
        }
      } else {
        const yt = getYouTubeId(cUrl);
        if (yt) setTitle(`Video ${yt}`);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [url, showForm]);

  const mediaOn = isMediaConfigured();

  useEffect(() => { getSongs().then(setSongs); }, []);

  const allTags = Array.from(new Set(songs.flatMap((s) => s.tags || []))).filter(Boolean);

  const filtered = songs
    .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()) || s.artist.toLowerCase().includes(query.toLowerCase()))
    .filter((s) => !activeTag || (s.tags && s.tags.includes(activeTag)))
    .sort((a, b) => b.votes_count - a.votes_count);

  const handleVote = async (id: string, type: VoteType) => {
    let nextVote: VoteType | null = type;
    setSongs((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      let diff = 0;
      if (s.userVote === type) { diff = type === 'upvote' ? -1 : 1; nextVote = null; }
      else if (!s.userVote) diff = type === 'upvote' ? 1 : -1;
      else diff = type === 'upvote' ? 2 : -2;
      return { ...s, votes_count: s.votes_count + diff, userVote: nextVote };
    }));
    await setSongVote(id, nextVote, profile?.id ?? null);
    if (nextVote) addPoints(2);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cUrl = cleanUrl(url);
    const isYt = cUrl.includes('youtube.com') || cUrl.includes('youtu.be');
    const isSp = isSpotify(cUrl);
    if (!isYt && !isSp) {
      setFormError('Solo se pueden sugerir enlaces de YouTube o Spotify.');
      return;
    }
    if (!title || !cUrl) return;
    setFormError(null);

    const finalArtist = artist || videoInfo?.author || 'YouTube';

    const ytId = getYouTubeId(cUrl);
    if (ytId && songs.some((s) => getYouTubeId(s.youtube_url) === ytId)) {
      setFormError('Esta canción ya está en la playlist. ¡Búscala abajo y dale tu voto!');
      return;
    }

    if (!videoInfo && mediaOn && !title) {
      setFormError('Espera a que se verifique el enlace o escribe el título manualmente.');
      return;
    }

    if (videoInfo && !videoInfo.available && !title) {
      setFormError('Ese link no está disponible o el validador falló. Por favor, escribe el título manualmente.');
      return;
    }

    const parsedTags = newTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const finalUrl = youtubeEquivalent || cUrl;
    const row = await addSong({ 
      title, 
      artist: finalArtist, 
      youtube_url: finalUrl, 
      genre: isSpotify(cUrl) ? 'YouTube (desde Spotify)' : 'YouTube',
      tags: parsedTags 
    }, profile?.id ?? null, profile?.username ?? 'Tú');
    
    setSongs((prev) => [...prev, row]);
    
    setTitle(''); setArtist(''); setUrl(''); setNewTags(''); setShowForm(false); setVideoInfo(null); setYoutubeEquivalent(null);
    addPoints(5);
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;
    setFormError(null);
    setUploading(true);
    
    try {
      const publicUrl = await uploadMediaFile(file);
      if (!publicUrl) throw new Error('Error al subir');
      
      const row = await addSong({ title, artist: artist || 'Local Upload', youtube_url: publicUrl, file_url: publicUrl }, profile?.id ?? null, profile?.username ?? 'Tú');
      setSongs((prev) => [...prev, row]);
      setTitle(''); setArtist(''); setFile(null); setShowForm(false); setUploadMode(false);
      addPoints(5);
    } catch {
      setFormError('No se pudo subir el archivo. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async (song: Song) => {
    try {
      await navigator.clipboard.writeText(song.youtube_url);
      setCopiedId(song.id);
      setTimeout(() => setCopiedId((c) => (c === song.id ? null : c)), 1500);
    } catch { /* clipboard bloqueado */ }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="section-title flex items-center gap-2 text-2xl">
              <Music className="h-6 w-6 text-neon-pink" /> Playlist del DJ
            </h1>
            <p className="text-sm text-muted mt-1">Sugiere y vota. El Top 10 entra al setlist en vivo.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (filtered.length === 0) return;
                const itemsToQueue = filtered.map(s => {
                  const isYt = s.youtube_url.includes('youtube.com') || s.youtube_url.includes('youtu.be');
                  return {
                    type: isYt ? 'yt' as const : 'stream' as const,
                    id: isYt ? getYouTubeId(s.youtube_url) || '' : s.id,
                    title: s.title,
                    artist: s.artist,
                    url: s.file_url || s.youtube_url
                  }
                }).filter(s => s.id !== '');
                setQueue(itemsToQueue, 0);
              }}
              className="btn btn-lime text-black hover:bg-neon-lime/80"
            >
              <Play className="h-4 w-4" /> Reproducir todo
            </button>
            <button onClick={() => { setShowSearch((v) => !v); setShowForm(false); setShowSpotify(false); }} className="btn btn-cyan">
              <Search className="h-4 w-4" /> Buscar canción
            </button>
            <button onClick={() => { setShowSpotify((v) => !v); setShowForm(false); setShowSearch(false); }} className="btn btn-lime text-black hover:bg-neon-lime/80">
              <Music3 className="h-4 w-4" /> Importar de Spotify
            </button>
            <button onClick={() => { setShowForm(!showForm); setShowSpotify(false); setShowSearch(false); }} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Sugerir canción
            </button>
          </div>
        </div>

        {/* Buscar canción por nombre en YouTube → sugerir al DJ */}
        {showSearch && (
          <div className="card accent-cyan p-5 space-y-4 animate-fade-in">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2"><Search className="h-5 w-5 text-neon-cyan" /> Buscar canción</h3>
              <p className="text-xs text-muted mt-1">Escribe el nombre (artista + título) y elige el resultado de YouTube. Queda reproducible y descargable.</p>
            </div>
            <form onSubmit={doSearch} className="flex gap-2">
              <input className="input flex-1" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ej. Alan Walker Faded nightcore" />
              <button type="submit" disabled={searchLoading} className="btn btn-cyan shrink-0">
                {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
              </button>
            </form>
            {searchError && (
              <div className="badge badge-red w-full justify-start py-2 px-3 normal-case tracking-normal text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" /> <span>{searchError}</span>
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                {searchResults.map((t) => {
                  const done = searchSuggested.includes(t.url);
                  return (
                    <div key={t.url} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-white/[0.02]">
                      { }
                      {t.thumbnail && <img src={t.thumbnail} alt="" className="h-10 w-16 rounded object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{t.title}</p>
                        <p className="text-xs text-muted truncate">{t.author}{t.duration ? ` · ${Math.floor(t.duration / 60)}:${String(Math.floor(t.duration % 60)).padStart(2, '0')}` : ''}</p>
                      </div>
                      <button onClick={() => suggestFromSearch(t)} disabled={done || searchSuggesting === t.url}
                        className={`btn shrink-0 text-xs px-3 py-1.5 ${done ? 'btn-ghost text-neon-lime' : 'btn-primary'}`}>
                        {searchSuggesting === t.url ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        {done ? 'Sugerida' : 'Sugerir'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Importar desde Spotify → sugerir al DJ */}
        {showSpotify && (
          <div className="card accent-lime p-5 space-y-4 animate-fade-in">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2"><Music3 className="h-5 w-5 text-neon-lime" /> Importar desde Spotify</h3>
              <p className="text-xs text-muted mt-1">Pega el enlace de una playlist <strong>pública</strong> de Spotify y sugiere sus canciones al DJ. (Las playlists editoriales de Spotify no se pueden leer; usa una tuya o pública de usuario.)</p>
            </div>
            <form onSubmit={loadSpotify} className="flex gap-2">
              <input className="input flex-1" value={spUrl} onChange={(e) => setSpUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/..." />
              <button type="submit" disabled={spLoading} className="btn btn-lime text-black shrink-0">
                {spLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Cargar
              </button>
            </form>
            {spError && (
              <div className="badge badge-red w-full justify-start py-2 px-3 normal-case tracking-normal text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" /> <span>{spError}</span>
              </div>
            )}
            {spTracks.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                {spTracks.map((t) => {
                  const done = spSuggested.includes(t.id);
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-white/[0.02]">
                      { }
                      {t.image && <img src={t.image} alt="" className="h-10 w-10 rounded object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{t.title}</p>
                        <p className="text-xs text-muted truncate">{t.artist}</p>
                      </div>
                      <button onClick={() => suggestFromSpotify(t)} disabled={done || spSuggesting === t.id}
                        className={`btn shrink-0 text-xs px-3 py-1.5 ${done ? 'btn-ghost text-neon-lime' : 'btn-primary'}`}>
                        {spSuggesting === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        {done ? 'Sugerida' : 'Sugerir'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <form onSubmit={uploadMode ? handleUploadFile : handleAdd} className="card accent-pink p-5 space-y-4 animate-fade-in">
            <div className="flex gap-2 mb-2 bg-black/40 p-1 rounded-lg w-fit">
              <button type="button" onClick={() => setUploadMode(false)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!uploadMode ? 'bg-neon-magenta text-white' : 'text-muted-2 hover:text-white'}`}>Por Enlace</button>
              <button type="button" onClick={() => setUploadMode(true)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${uploadMode ? 'bg-neon-lime text-black' : 'text-muted-2 hover:text-white'}`}>Subir Archivo</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Título (Auto-generado)</label>
                <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Angel With A Shotgun" />
              </div>
              <div>
                <label className="label text-muted-2 text-xs uppercase font-bold">Estado de Reproducción</label>
                <div className="h-[42px] flex items-center px-3 border border-border rounded-lg bg-black/40 text-sm">
                  {checking ? (
                    <span className="text-neon-cyan animate-pulse">Verificando enlace...</span>
                  ) : videoInfo ? (
                    videoInfo.available ? (
                      videoInfo.embeddable ? (
                        <span className="text-neon-lime truncate">✅ Reproducible (Compatible)</span>
                      ) : (
                        <span className="text-neon-yellow truncate">📥 Vista Previa Descargada</span>
                      )
                    ) : (
                      <span className="text-red-500 truncate">❌ {videoInfo.error || 'Privado / Borrado'}</span>
                    )
                  ) : (
                    <span className="text-muted truncate">Pega el link para verificar</span>
                  )}
                </div>
              </div>
            </div>
            
            {!uploadMode ? (
              <>
                <div>
                  <label className="label">Enlace de YouTube</label>
                  <input className="input" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                </div>
                {formError && (
                  <div className="badge badge-red w-full justify-start py-2 px-3 normal-case tracking-normal text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" /> <span>{formError}</span>
                  </div>
                )}
                <p className="text-[11px] text-muted-2">
                  {mediaOn
                    ? 'Validamos que el link sea reproducible antes de agregarlo.'
                    : 'El comprobante automático (yt-dlp) se activa al conectar el media-service.'}
                </p>
                <div>
                  <label className="label text-neon-cyan">Hashtags (separados por coma)</label>
                  <input className="input" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="Ej. #numetal, #vocaloid, #speedup" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Archivo (MP4/MP3)</label>
                  <label className={`border-2 border-dashed ${file ? 'border-neon-lime bg-neon-lime/10' : 'border-border bg-white/[0.02] hover:border-neon-magenta hover:bg-white/[0.05]'} rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center`}>
                    <input type="file" accept="video/mp4,audio/mp3" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                    {file ? (
                      <>
                        <Video className="h-8 w-8 text-neon-lime mb-2" />
                        <p className="text-sm font-bold text-neon-lime">{file.name}</p>
                        <p className="text-xs text-muted-2 mt-1">Click para cambiar</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-muted-2 mb-2" />
                        <p className="text-sm font-bold text-white">Sube el MP4/MP3 de la canción</p>
                        <p className="text-xs text-muted-2 mt-1">Máximo 50MB</p>
                      </>
                    )}
                  </label>
                </div>
                {formError && (
                  <div className="badge badge-red w-full justify-start py-2 px-3 normal-case tracking-normal text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" /> <span>{formError}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
              <button type="submit" disabled={checking || uploading} className="btn btn-primary">
                {uploading ? 'Subiendo...' : checking ? 'Verificando…' : 'Agregar'}
              </button>
            </div>
          </form>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-2" />
          <input className="input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título o artista…" />
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveTag(null)} 
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${!activeTag ? 'bg-neon-cyan text-black' : 'bg-surface border border-border text-muted hover:text-white'}`}
            >
              Todos
            </button>
            {allTags.map(tag => (
              <button 
                key={tag} 
                onClick={() => setActiveTag(tag)} 
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${activeTag === tag ? 'bg-neon-cyan text-black' : 'bg-surface border border-border text-neon-cyan hover:bg-neon-cyan/10'}`}
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="card p-10 text-center text-muted-2">
              <Music3 className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No hay sugerencias todavía.</p>
            </div>
          ) : (
            filtered.map((song, i) => {
              const yt = getYouTubeId(song.youtube_url);
              const isPlaying = (playingItem?.type === 'yt' && playingItem.id === yt) || (playingItem?.type === 'stream' && playingItem.url?.includes(encodeURIComponent(song.youtube_url)));
              return (
                <div key={song.id} className={`card card-hover flex items-center gap-3 p-3 ${isPlaying ? 'accent-pink' : ''}`}>
                  <div className="flex flex-col items-center">
                    <button onClick={() => handleVote(song.id, 'upvote')} className={`p-0.5 rounded ${song.userVote === 'upvote' ? 'text-neon-pink' : 'text-muted-2 hover:text-foreground'}`}>
                      <ChevronUp className="h-5 w-5 stroke-[3]" />
                    </button>
                    <span className={`text-sm font-extrabold tabular-nums ${song.votes_count < 0 ? 'text-fnaf-red' : 'text-white'}`}>{song.votes_count}</span>
                    <button onClick={() => handleVote(song.id, 'downvote')} className={`p-0.5 rounded ${song.userVote === 'downvote' ? 'text-neon-cyan' : 'text-muted-2 hover:text-foreground'}`}>
                      <ChevronDown className="h-5 w-5 stroke-[3]" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-2">#{i + 1}</span>
                      <h4 className="font-bold text-white truncate">{song.title}</h4>
                      {song.geek_tag && <span className={`badge ${tagColor[song.geek_tag] ?? 'badge-cyan'}`}>{song.geek_tag}</span>}
                      {song.tags?.map(t => (
                        <span key={t} className="text-[10px] text-neon-cyan font-bold bg-neon-cyan/10 px-1.5 py-0.5 rounded-md border border-neon-cyan/20">
                          {t.startsWith('#') ? t : `#${t}`}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted truncate">{song.artist}</p>
                    <p className="text-[11px] text-muted-2 mt-0.5">Sugerido por <span className="text-neon-pink font-semibold">{song.suggested_by_name}</span>{song.genre ? ` · ${song.genre}` : ''}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      const itemsToQueue = filtered.map(s => {
                        const isYt = s.youtube_url.includes('youtube.com') || s.youtube_url.includes('youtu.be');
                        return {
                          type: isYt ? 'yt' as const : 'stream' as const,
                          id: isYt ? getYouTubeId(s.youtube_url) || '' : s.id,
                          title: s.title,
                          artist: s.artist,
                          url: s.file_url || s.youtube_url
                        }
                      }).filter(s => s.id !== '');
                      
                      const idx = itemsToQueue.findIndex(q => q.id === (yt || song.id));
                      setQueue(itemsToQueue, idx >= 0 ? idx : 0);
                    }} title="Vista previa en fondo"
                      className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-colors ${isPlaying ? 'bg-neon-pink text-black border-neon-pink' : 'border-border text-muted hover:text-white'}`}>
                      <Play className={`h-4 w-4 ${isPlaying ? 'fill-black' : ''}`} />
                    </button>
                    <a href={song.youtube_url} target="_blank" rel="noreferrer" title="Abrir en YouTube"
                      className="h-9 w-9 rounded-lg border border-border text-muted hover:text-white flex items-center justify-center transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button onClick={() => handleCopy(song)} title="Copiar enlace"
                      className="h-9 w-9 rounded-lg border border-border text-muted hover:text-white flex items-center justify-center transition-colors">
                      {copiedId === song.id ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Link2 className="h-4 w-4" />}
                    </button>
                    {/* Botón de instrucciones de descarga local */}
                    {DOWNLOADABLE.test(song.youtube_url) ? (
                      <div className="hidden sm:flex items-center border-l border-border pl-2 ml-1">
                        <button onClick={() => setShowDownloadModal(true)} className="btn btn-ghost px-2 py-1 text-xs text-neon-lime">
                          Descargar ⏬
                        </button>
                      </div>
                    ) : isSpotify(song.youtube_url) ? (
                      <span className="hidden sm:inline-flex items-center gap-1 border-l border-border pl-2 ml-1 text-[10px] font-bold text-neon-cyan" title="Sugerencia desde Spotify">
                        <Music3 className="h-3 w-3" /> Spotify
                      </span>
                    ) : null}

                    {/* Miniatura del Video */}
                    {yt && (
                      <div className="hidden sm:block ml-2 w-20 h-12 rounded overflow-hidden border border-border shrink-0 relative group bg-black">
                        <img src={`https://i.ytimg.com/vi/${yt}/mqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 rounded text-[8px] font-bold text-white">2:00</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      <div className="card p-5 space-y-3">
        <h4 className="font-bold text-white">Reglas</h4>
        <ul className="text-xs text-muted space-y-1.5 flex flex-wrap gap-4">
          <li>• Solo remixes Nightcore, Eurobeat, Hardcore o Lofi Speedup.</li>
          <li>• No repitas canciones ya listadas.</li>
          <li>• Las sugerencias cierran 24h antes del evento.</li>
        </ul>
      </div>

      {showDownloadModal && (
        <DownloadInstructionsModal onClose={() => setShowDownloadModal(false)} />
      )}
    </div>
  );
}
