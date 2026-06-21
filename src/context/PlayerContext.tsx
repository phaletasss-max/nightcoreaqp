'use client';

import React, { createContext, useContext, useState } from 'react';

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
  setQueue: (items: PlayableItem[]) => void;
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

  const defaultItem: PlayableItem = { type: 'default', title: 'Nightcore AQP', artist: 'Radio' };

  const playingItem = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : defaultItem;

  const playItem = (item: PlayableItem) => {
    // If it's already in queue, jump to it
    const idx = queue.findIndex(q => (q.id === item.id && q.id) || (q.url === item.url && q.url));
    if (idx >= 0) {
      setCurrentIndex(idx);
    } else {
      setQueueState([item]);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  };

  const setQueue = (items: PlayableItem[], startIndex = 0) => {
    setQueueState(items);
    if (items.length > 0) {
      setCurrentIndex(startIndex);
      setIsPlaying(true);
    } else {
      setCurrentIndex(-1);
    }
  };

  const playNext = () => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else {
      setCurrentIndex(-1);
    }
  };

  const playPrevious = () => {
    if (currentIndex - 1 >= 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <PlayerContext.Provider value={{ queue, currentIndex, playingItem, isPlaying, isMuted, playItem, setQueue, playNext, playPrevious, togglePlay, toggleMute }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
