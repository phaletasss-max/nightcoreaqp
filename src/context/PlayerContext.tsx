'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface PlayableItem {
  type: 'yt' | 'stream' | 'default';
  id?: string;
  url?: string;
  title: string;
  artist: string;
}

interface PlayerContextType {
  queue: PlayableItem[];
  currentIndex: number;
  playingItem: PlayableItem | null;
  isPlaying: boolean;
  isMuted: boolean;
  playItem: (item: PlayableItem) => void;
  setQueue: (items: PlayableItem[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueueState] = useState<PlayableItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const defaultItem: PlayableItem = { type: 'default', title: 'Glitch AQP', artist: 'Radio' };

  const playingItem = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : defaultItem;

  const playItem = useCallback((item: PlayableItem) => {
    // Si ya está en la cola, salta a él; si no, arranca una cola de uno.
    setQueueState((q) => {
      const idx = q.findIndex((x) => (x.id === item.id && x.id) || (x.url === item.url && x.url));
      if (idx >= 0) { setCurrentIndex(idx); return q; }
      setCurrentIndex(0);
      return [item];
    });
    setIsPlaying(true);
  }, []);

  const setQueue = useCallback((items: PlayableItem[], startIndex = 0) => {
    setQueueState(items);
    if (items.length > 0) {
      setCurrentIndex(startIndex);
      setIsPlaying(true);
    } else {
      setCurrentIndex(-1);
    }
  }, []);

  // Usar el updater funcional evita depender de currentIndex/queue → identidad estable.
  const playNext = useCallback(() => {
    setCurrentIndex((i) => {
      if (i + 1 < queue.length) { setIsPlaying(true); return i + 1; }
      return -1;
    });
  }, [queue.length]);

  const playPrevious = useCallback(() => {
    setCurrentIndex((i) => {
      if (i - 1 >= 0) { setIsPlaying(true); return i - 1; }
      return i;
    });
  }, []);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const value = useMemo(
    () => ({ queue, currentIndex, playingItem, isPlaying, isMuted, playItem, setQueue, playNext, playPrevious, togglePlay, toggleMute }),
    [queue, currentIndex, playingItem, isPlaying, isMuted, playItem, setQueue, playNext, playPrevious, togglePlay, toggleMute],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
