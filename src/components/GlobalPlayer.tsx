'use client';

import React, { useRef, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Tv } from 'lucide-react';

export default function GlobalPlayer() {
  const { playingItem, isPlaying, isMuted, togglePlay, toggleMute, playNext, playPrevious, queue, setQueue } = usePlayer();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync isPlaying with iframe and video
  useEffect(() => {
    if (playingItem?.type === 'yt' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: isPlaying ? 'playVideo' : 'pauseVideo'
      }), '*');
    }
    if (playingItem?.type === 'stream' || playingItem?.type === 'default') {
      if (videoRef.current) {
        if (isPlaying) videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
    }
  }, [isPlaying, playingItem]);

  // Sync isMuted with iframe and video
  useEffect(() => {
    if (playingItem?.type === 'yt' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: isMuted ? 'mute' : 'unMute'
      }), '*');
    }
    if (videoRef.current) {
      videoRef.current.muted = playingItem?.type === 'default' ? true : isMuted;
    }
  }, [isMuted, playingItem]);

  const hasQueue = queue.length > 0;

  return (
    <>
      {/* Background Media */}
      <div className="fixed inset-0 -z-50 bg-black pointer-events-none overflow-hidden">
        {playingItem?.type === 'yt' ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${playingItem.id}?enablejsapi=1&autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${playingItem.id}&controls=0`}
            title="YouTube"
            allow="autoplay; encrypted-media"
            className="absolute inset-0 w-[110vw] h-[110vh] -top-[5vh] -left-[5vw] object-cover opacity-50 pointer-events-none"
            // Removido mix-blend-screen para mejor rendimiento
          />
        ) : (
          <video
            ref={videoRef}
            src={playingItem?.type === 'stream' ? playingItem.url : '/fondoscenecoe.mp4'}
            autoPlay
            muted={playingItem?.type === 'default' ? true : isMuted}
            loop={playingItem?.type === 'default'}
            playsInline
            onEnded={() => {
              if (playingItem?.type === 'stream' && hasQueue) playNext();
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
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
                {playingItem?.artist || 'Fondo'}
              </p>
              <p className="text-sm font-bold text-white truncate w-[150px] sm:w-[250px]">
                {playingItem?.title || 'Nightcore AQP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {hasQueue && (
              <button onClick={playPrevious} className="p-2 text-muted hover:text-white transition-colors">
                <SkipBack className="h-4 w-4" />
              </button>
            )}
            <button onClick={togglePlay} className="p-2 text-white hover:text-neon-pink transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            {hasQueue && (
              <button onClick={playNext} className="p-2 text-muted hover:text-white transition-colors">
                <SkipForward className="h-4 w-4" />
              </button>
            )}
            <div className="w-px h-4 bg-border mx-1" />
            <button onClick={toggleMute} className="p-2 text-muted hover:text-white transition-colors">
              {isMuted ? <VolumeX className="h-4 w-4 text-fnaf-red" /> : <Volume2 className="h-4 w-4 text-neon-cyan" />}
            </button>
            {playingItem?.type !== 'default' && (
              <>
                <div className="w-px h-4 bg-border mx-1" />
                <button onClick={() => setQueue([])} className="p-2 text-muted hover:text-fnaf-red transition-colors" title="Cerrar y volver al fondo verde">
                  <Tv className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}
