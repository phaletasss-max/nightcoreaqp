'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePlayer, type PlayableItem } from '@/context/PlayerContext';
import { getSongs } from '@/lib/data';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Tv,
  ListMusic, MoreVertical, Snowflake, Plus, X, Loader2,
} from 'lucide-react';

function getYouTubeId(url: string) {
  const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return m && m[2].length === 11 ? m[2] : null;
}

export default function GlobalPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const { playingItem, isPlaying, isMuted, togglePlay, toggleMute, playNext, playPrevious, queue, setQueue } = usePlayer();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // El iframe de YouTube solo acepta postMessage cuando ya cargó (origin youtube.com).
  // Postear antes ensucia la consola con "target origin does not match". Este flag evita eso.
  const iframeReadyRef = useRef(false);

  // Postea un comando al iframe de YouTube solo si ya está listo.
  const postToYt = (func: string) => {
    if (iframeReadyRef.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func }), 'https://www.youtube.com',
      );
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [bgFrozen, setBgFrozen] = useState(false);   // congelar fondo (música sigue)
  const [loadingList, setLoadingList] = useState(false);

  const hasQueue = queue.length > 0;
  const multi = queue.length > 1;

  // ── Sync play/pause con iframe (YouTube) y video ──
  useEffect(() => {
    if (playingItem?.type === 'yt') postToYt(isPlaying ? 'playVideo' : 'pauseVideo');
    if (playingItem?.type === 'stream' || playingItem?.type === 'default') {
      if (videoRef.current) {
        if (isPlaying) videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
    }
  }, [isPlaying, playingItem]);

  // ── Sync mute ──
  useEffect(() => {
    if (playingItem?.type === 'yt') postToYt(isMuted ? 'mute' : 'unMute');
    if (videoRef.current) {
      videoRef.current.muted = playingItem?.type === 'default' ? true : isMuted;
    }
  }, [isMuted, playingItem]);

  // ── Autoplay siguiente cuando un video de YouTube termina ──
  // YouTube emite eventos vía postMessage si registramos "listening". OJO: `infoDelivery`
  // llega MUCHAS veces por segundo (lleva el currentTime), así que sin un guard se dispara
  // playNext en bucle → re-render infinito. El ref asegura "avanzar solo una vez por fin".
  const endedGuard = useRef(false);
  // Al cambiar de pista, rearmar el guard y marcar el nuevo iframe como "no listo".
  useEffect(() => { endedGuard.current = false; iframeReadyRef.current = false; }, [playingItem]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== 'https://www.youtube.com') return;
      if (typeof e.data !== 'string') return;
      try {
        const d = JSON.parse(e.data);
        const state = typeof d?.info === 'object' ? d.info.playerState : d?.info;
        if ((d.event === 'onStateChange' || d.event === 'infoDelivery') && state === 0) {
          if (!endedGuard.current && queue.length > 1) {
            endedGuard.current = true;   // evita re-disparos del mismo "ended"
            playNext();
          }
        } else if (state === 1) {
          endedGuard.current = false;    // volvió a reproducir → rearmar
        }
      } catch { /* no es un mensaje de YT */ }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [queue.length, playNext]);

  // ── Cargar la playlist del DJ en la cola ──
  const playPlaylist = async () => {
    setLoadingList(true);
    try {
      const songs = await getSongs();
      const items: PlayableItem[] = songs.map((s) => {
        const isYt = s.youtube_url.includes('youtube.com') || s.youtube_url.includes('youtu.be');
        return {
          type: isYt ? ('yt' as const) : ('stream' as const),
          id: isYt ? (getYouTubeId(s.youtube_url) || '') : s.id,
          title: s.title,
          artist: s.artist,
          url: s.file_url || s.youtube_url,
        };
      }).filter((x) => (x.type === 'yt' ? x.id : x.url));
      if (items.length) setQueue(items, 0);
    } finally {
      setLoadingList(false);
      setMenuOpen(false);
    }
  };

  const isYt = playingItem?.type === 'yt';
  // El `src` NO debe depender de isMuted: si cambia, el iframe se recarga y la canción
  // reinicia. Arrancamos siempre con mute=1 (permite autoplay) y el estado real de mute
  // se aplica por postMessage (useEffect de mute + onLoad). Toggle de volumen = sin reload.
  // loop solo cuando NO hay cola (para que en cola el video pueda terminar y avanzar)
  const ytSrc = isYt && playingItem?.id
    ? `https://www.youtube.com/embed/${playingItem.id}?enablejsapi=1&autoplay=1&mute=1&controls=0&rel=0&playsinline=1&loop=${multi ? 0 : 1}&playlist=${playingItem.id}`
    : '';

  return (
    <>
      {/* Background Media */}
      <div className="fixed inset-0 -z-50 bg-black pointer-events-none overflow-hidden">
        {isYt ? (
          <iframe
            ref={iframeRef}
            key={playingItem?.id}
            src={ytSrc}
            title="YouTube"
            allow="autoplay; encrypted-media"
            onLoad={() => {
              // Ya cargó (origin youtube.com) → ahora sí se puede postear sin warning.
              iframeReadyRef.current = true;
              // Handshake para recibir eventos de estado (autoplay-next).
              iframeRef.current?.contentWindow?.postMessage('{"event":"listening"}', 'https://www.youtube.com');
              // Aplica el estado actual de play/mute (por si cambió antes de cargar).
              postToYt(isPlaying ? 'playVideo' : 'pauseVideo');
              postToYt(isMuted ? 'mute' : 'unMute');
            }}
            className={`absolute inset-0 w-[110vw] h-[110vh] -top-[5vh] -left-[5vw] object-cover pointer-events-none transition-opacity duration-500 ${bgFrozen ? 'opacity-0' : 'opacity-50'}`}
          />
        ) : playingItem?.type === 'default' && pathname === '/playlist' ? (
          /* En /playlist el fondo idle de la radio (fondoscenecoe) se superponía con el
             video glitch de la sección → aquí no se pinta. Al reproducir algo, sí. */
          null
        ) : (
          <video
            ref={videoRef}
            src={playingItem?.type === 'stream' ? playingItem.url : '/fondoscenecoe.mp4'}
            autoPlay
            muted={playingItem?.type === 'default' ? true : isMuted}
            loop={playingItem?.type === 'default'}
            playsInline
            onEnded={() => { if (playingItem?.type === 'stream' && hasQueue) playNext(); }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${bgFrozen ? 'opacity-0' : 'opacity-40'}`}
          />
        )}
        {/* Fondo estático cuando está congelado (la música sigue sonando) */}
        {bgFrozen && isYt && playingItem?.id && (
           
          <img src={`https://i.ytimg.com/vi/${playingItem.id}/hqdefault.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
        )}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Floating Control Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl">
        <div className="bg-black/60 backdrop-blur-md border border-border/50 rounded-full py-2 px-4 flex items-center justify-between shadow-2xl">

          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 border border-white/10 shrink-0">
              <Tv className={`h-4 w-4 ${playingItem?.type !== 'default' ? 'text-neon-cyan animate-pulse' : 'text-neon-magenta'}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest truncate">
                {playingItem?.type === 'default' ? 'Radio' : (playingItem?.artist || 'Reproduciendo')}
                {multi && <span className="text-neon-cyan"> · playlist</span>}
              </p>
              <p className="text-sm font-bold text-white truncate w-[150px] sm:w-[250px]">
                {playingItem?.title || 'Glitch AQP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Escuchar playlist actual */}
            {playingItem?.type === 'default' && (
              <button onClick={playPlaylist} disabled={loadingList} title="Escuchar la playlist actual"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neon-magenta/15 border border-neon-magenta/40 text-neon-magenta text-[11px] font-bold hover:bg-neon-magenta/25 transition-colors">
                {loadingList ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListMusic className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Escuchar playlist</span>
              </button>
            )}

            {multi && (
              <button onClick={playPrevious} className="p-2 text-muted hover:text-white transition-colors">
                <SkipBack className="h-4 w-4" />
              </button>
            )}
            <button onClick={togglePlay} className="p-2 text-white hover:text-neon-pink transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            {multi && (
              <button onClick={playNext} className="p-2 text-muted hover:text-white transition-colors">
                <SkipForward className="h-4 w-4" />
              </button>
            )}
            <button onClick={toggleMute} className="p-2 text-muted hover:text-white transition-colors">
              {isMuted ? <VolumeX className="h-4 w-4 text-fnaf-red" /> : <Volume2 className="h-4 w-4 text-neon-cyan" />}
            </button>

            {/* Menú de 3 puntos */}
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="p-2 text-muted hover:text-white transition-colors" title="Más opciones">
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute bottom-full right-0 mb-2 w-56 card bg-black/90 p-1.5 z-50 animate-fade-in">
                    <button onClick={() => { setBgFrozen((f) => !f); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left text-foreground hover:bg-white/10 transition-colors">
                      <Snowflake className={`h-4 w-4 ${bgFrozen ? 'text-neon-cyan' : 'text-muted'}`} />
                      {bgFrozen ? 'Reanudar fondo' : 'Congelar fondo (música sigue)'}
                    </button>
                    <button onClick={() => { setMenuOpen(false); router.push('/playlist'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left text-foreground hover:bg-white/10 transition-colors">
                      <Plus className="h-4 w-4 text-neon-lime" /> Sugerir una canción
                    </button>
                    {playingItem?.type !== 'default' && (
                      <button onClick={() => { setQueue([]); setBgFrozen(false); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left text-fnaf-red hover:bg-white/10 transition-colors">
                        <X className="h-4 w-4" /> Cerrar y volver al fondo
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
