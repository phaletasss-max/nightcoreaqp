'use client';

// ── Fondo de video toggleable con scroll + reproductor global ────────────────
// Detrás de TODO el contenido. Al bajar, cambia de autor con cross-fade.
// Reproductor flotante: audio on/off (global), pausar video, pista anterior/
// siguiente (mismo autor) y siguiente autor.
//
// TOGGLE: El usuario puede activar/desactivar el fondo de video.
// - Desactivado (por defecto): se ve el fondo scenecore animado.
// - Activado: se muestran los videos de la playlist como fondo.
//
// Fuente de los videos:
//  1) Si hay canciones con MP4 propio (descargadas por el media-service), usa esos.
//  2) Si no, cae a una lista curada de YouTube (iframe).

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2, VolumeX, Play, Pause, SkipForward, SkipBack,
  FastForward, ChevronUp, ChevronDown, Tv, MonitorOff,
} from 'lucide-react';
import { getSongs } from '@/lib/data';

interface Track { title: string; mp4Url?: string; youtubeId?: string; }
interface Scene { id: string; author: string; accent: string; tracks: Track[]; }

const PALETTE = ['255,0,255', '0,255,255', '57,255,20', '255,105,180', '255,240,31', '153,51,255'];

// Lista curada de respaldo (YouTube) hasta que existan MP4 propios.
const CURATED: Scene[] = [
  { id: 'yoasobi', author: 'YOASOBI / Vocaloid', accent: '0,255,255', tracks: [{ title: 'Idol (アイドル)', youtubeId: 'ZRtdQ81jPUQ' }] },
  { id: 'caramell', author: 'Caramella Girls', accent: '255,0,255', tracks: [{ title: 'Caramelldansen', youtubeId: 'A67GrVdEg94' }] },
  { id: 'fnaf', author: 'The Living Tombstone', accent: '255,77,77', tracks: [{ title: 'FNAF 2 Song', youtubeId: 'd1wK9FzN96w' }] },
  { id: 'undertale', author: 'Undertale', accent: '255,240,31', tracks: [{ title: 'Stronger Than You', youtubeId: 'co5Zo6Ng9-c' }] },
  { id: 'minecraft', author: 'Zarcort & Kronno', accent: '57,255,20', tracks: [{ title: 'Creeper vs Zombie', youtubeId: '5m288qNNDw0' }] },
];

const yt = (id: string, opts: string) => `https://www.youtube.com/embed/${id}?${opts}`;

export default function VideoBackground() {
  const [scenes, setScenes] = useState<Scene[]>(CURATED);
  const [usingDownloads, setUsingDownloads] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [bgEnabled, setBgEnabled] = useState(false); // Toggle: fondo de video activado

  const bgRef = useRef<HTMLIFrameElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);

  // Construir escenas desde las canciones con MP4 propio (agrupadas por autor).
  useEffect(() => {
    getSongs().then((songs) => {
      const dl = songs.filter((s) => s.file_url);
      if (!dl.length) return;
      const byAuthor = new Map<string, Track[]>();
      for (const s of dl) {
        const key = s.artist || s.suggested_by_name || 'Comunidad';
        if (!byAuthor.has(key)) byAuthor.set(key, []);
        byAuthor.get(key)!.push({ title: s.title, mp4Url: s.file_url! });
      }
      const built = [...byAuthor.entries()].map(([author, tracks], i) => ({
        id: `dl-${i}`, author, accent: PALETTE[i % PALETTE.length], tracks,
      }));
      setScenes(built);
      setUsingDownloads(true);
      setSceneIdx(0);
      setTrackIdx(0);
    });
  }, []);

  const scene = scenes[Math.min(sceneIdx, scenes.length - 1)];
  const track = scene.tracks[Math.min(trackIdx, scene.tracks.length - 1)] ?? scene.tracks[0];
  const usingMp4 = !!track.mp4Url;
  const multiTrack = scene.tracks.length > 1;
  const accent = `rgb(${scene.accent})`;

  // ── Scroll → autor activo ──
  const onScroll = useCallback(() => {
    if (!bgEnabled) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const idx = Math.min(scenes.length - 1, Math.floor(progress * scenes.length));
    setSceneIdx((cur) => { if (cur !== idx) { setTrackIdx(0); return idx; } return cur; });
  }, [scenes.length, bgEnabled]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  // ── Control de MP4 (directo por ref) ──
  useEffect(() => {
    if (usingMp4 && vidRef.current) vidRef.current.muted = !audioOn;
  }, [audioOn, usingMp4, track]);
  useEffect(() => {
    if (usingMp4 && vidRef.current) {
      if (videoOn && bgEnabled) vidRef.current.play().catch(() => {});
      else vidRef.current.pause();
    }
  }, [videoOn, usingMp4, track, bgEnabled]);

  // ── Control de YouTube (postMessage) ──
  const postBg = (func: string) => {
    bgRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: '' }), '*');
  };

  const toggleVideo = () => {
    setVideoOn((on) => {
      if (usingMp4) { const v = vidRef.current; if (v) { if (on) v.pause(); else v.play().catch(() => {}); } }
      else postBg(on ? 'pauseVideo' : 'playVideo');
      return !on;
    });
  };

  const nextTrack = () => setTrackIdx((i) => (i + 1) % scene.tracks.length);
  const prevTrack = () => setTrackIdx((i) => (i - 1 + scene.tracks.length) % scene.tracks.length);
  const nextScene = () => {
    const ni = (sceneIdx + 1) % scenes.length;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (ni / scenes.length) * max + 4, behavior: 'smooth' });
    setSceneIdx(ni);
    setTrackIdx(0);
  };

  const toggleBg = () => setBgEnabled((on) => !on);

  return (
    <>
      {/* Capa de fondo fija — solo si el fondo de video está activado */}
      {bgEnabled && (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background pointer-events-none">
          <div key={`${scene.id}-${track.mp4Url || track.youtubeId}`} className="absolute inset-0 animate-fade-in">
            {usingMp4 ? (
              <video
                ref={vidRef}
                src={track.mp4Url}
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <iframe
                ref={bgRef}
                src={yt(track.youtubeId!, `autoplay=1&mute=1&loop=1&playlist=${track.youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&enablejsapi=1&start=8`)}
                allow="autoplay; encrypted-media"
                className="absolute border-0"
                style={{ width: '177.78vh', minWidth: '100%', minHeight: '56.25vw', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              />
            )}
          </div>
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(10,10,15,0.78), rgba(10,10,15,0.9)), radial-gradient(circle at 50% 0%, rgba(${scene.accent},0.12), transparent 55%)` }} />
        </div>
      )}

      {/* Audio global de YouTube (iframe oculto sin mute). El MP4 usa ref.muted. */}
      {bgEnabled && audioOn && !usingMp4 && track.youtubeId && (
        <div className="fixed -z-10 opacity-0 pointer-events-none w-px h-px overflow-hidden" aria-hidden>
          <iframe
            key={`audio-${track.youtubeId}`}
            src={yt(track.youtubeId, `autoplay=1&mute=0&loop=1&playlist=${track.youtubeId}&controls=0&start=8`)}
            allow="autoplay; encrypted-media"
            title="audio"
          />
        </div>
      )}

      {/* Reproductor flotante */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
        <div className="card bg-background/85 p-2.5 flex items-center gap-2"
          style={{ borderColor: bgEnabled ? `rgba(${scene.accent},0.40)` : 'rgba(255,0,255,0.25)' }}>

          {/* Toggle fondo de video */}
          <button onClick={toggleBg}
            className={`p-1.5 rounded-lg transition-colors ${bgEnabled ? 'text-neon-lime' : 'text-muted hover:text-neon-magenta'}`}
            title={bgEnabled ? 'Desactivar fondo musical' : 'Activar fondo musical'}>
            {bgEnabled ? <Tv className="h-4 w-4 glow-lime" /> : <MonitorOff className="h-4 w-4" />}
          </button>

          <button onClick={() => setCollapsed((c) => !c)} className="p-1.5 rounded-lg text-muted hover:text-white" title={collapsed ? 'Mostrar' : 'Ocultar'}>
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <span className="h-2 w-2 rounded-full shrink-0"
            style={{
              background: bgEnabled ? accent : 'rgba(255,0,255,0.5)',
              boxShadow: bgEnabled && audioOn ? `0 0 8px ${accent}` : 'none',
            }} />

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-2 truncate">
                {bgEnabled ? (
                  <>Fondo · {scene.author} {usingDownloads && <span className="text-neon-lime">· propio</span>}</>
                ) : (
                  <span className="text-neon-magenta">Fondo scenecore ✦</span>
                )}
              </p>
              <p className="text-xs font-bold text-white truncate">
                {bgEnabled ? track.title : 'Animación scenecore activa'}
              </p>
            </div>
          )}

          {bgEnabled && (
            <div className="flex items-center gap-1 shrink-0">
              {multiTrack && (
                <button onClick={prevTrack} className="p-1.5 rounded-lg text-muted hover:text-white" title="Pista anterior (mismo autor)"><SkipBack className="h-4 w-4" /></button>
              )}
              <button onClick={toggleVideo} className="p-1.5 rounded-lg text-muted hover:text-white" title={videoOn ? 'Pausar video' : 'Reproducir video'}>
                {videoOn ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              {multiTrack && (
                <button onClick={nextTrack} className="p-1.5 rounded-lg text-muted hover:text-white" title="Pista siguiente (mismo autor)"><SkipForward className="h-4 w-4" /></button>
              )}
              <button onClick={nextScene} className="p-1.5 rounded-lg text-muted hover:text-white" title="Siguiente autor"><FastForward className="h-4 w-4" /></button>
              <button onClick={() => setAudioOn((a) => !a)} className="p-1.5 rounded-lg transition-colors" style={{ color: audioOn ? accent : undefined }} title={audioOn ? 'Silenciar' : 'Activar audio'}>
                {audioOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
