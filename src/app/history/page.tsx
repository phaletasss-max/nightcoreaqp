'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Star, Music, Medal, Crown, ChevronUp } from 'lucide-react';
import { getProfiles, getSongs, getCostumes } from '@/lib/data';
import type { Profile, Song, Costume } from '@/lib/types';
import Link from 'next/link';

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [topGeeks, setTopGeeks] = useState<Profile[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [topCostumes, setTopCostumes] = useState<Costume[]>([]);

  useEffect(() => {
    console.log('[FASE 4] Cargando datos para el Muro de la Fama...');
    async function loadStats() {
      try {
        const [profiles, songs, costumes] = await Promise.all([
          getProfiles(),
          getSongs(),
          getCostumes()
        ]);
        
        // Asistentes con más puntos y rachas (Los "Geeks")
        const geeks = profiles.sort((a, b) => b.points - a.points).slice(0, 5);
        
        // Canciones históricas más votadas (Top DJ)
        const histSongs = songs.sort((a, b) => b.votes_count - a.votes_count).slice(0, 10);
        
        // Mejores disfraces
        const bestCostumes = costumes.sort((a, b) => b.votes_count - a.votes_count).slice(0, 3);
        
        setTopGeeks(geeks);
        setTopSongs(histSongs);
        setTopCostumes(bestCostumes);
      } catch (err) {
        console.error('[FASE 4] Error cargando Muro de la Fama:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted">
        <Trophy className="h-10 w-10 animate-bounce mb-4 text-yellow-500" />
        <p>Cargando el Muro de la Fama...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400" />
          Muro de la Fama
          <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400" />
        </h1>
        <p className="text-muted-2 text-sm max-w-xl mx-auto">
          Los verdaderos reyes y reinas de Nightcore AQP. Aquí inmortalizamos a los Geeks con más puntos, las canciones que rompieron la pista y los cosplays legendarios.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Geeks (Usuarios con más puntos) */}
        <div className="card accent-pink p-6 sm:p-8 space-y-5">
          <h2 className="section-title text-xl flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-400" /> Top Geeks Activos
          </h2>
          <div className="space-y-3">
            {topGeeks.map((geek, i) => (
              <div key={geek.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-border hover:border-yellow-500/50 transition-colors">
                <div className="h-10 w-10 shrink-0 bg-yellow-500/20 text-yellow-500 font-extrabold rounded-full flex items-center justify-center text-lg border border-yellow-500/50">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate flex items-center gap-2">
                    {geek.username || 'Usuario Anon'}
                    {i === 0 && <Crown className="h-4 w-4 text-yellow-400 shrink-0" />}
                  </p>
                  <p className="text-xs text-muted">Racha: {geek.streak_count} eventos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-neon-pink">{geek.points} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mejores Disfraces */}
        <div className="card accent-cyan p-6 sm:p-8 space-y-5">
          <h2 className="section-title text-xl flex items-center gap-2">
            <Star className="h-6 w-6 text-neon-cyan" /> Hall del Cosplay
          </h2>
          <div className="grid gap-3">
            {topCostumes.map((costume, i) => (
              <div key={costume.id} className="group relative h-28 rounded-xl overflow-hidden border border-border flex items-end">
                { }
                <img src={costume.photo_url} alt={costume.char_name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative z-10 p-3 w-full flex items-center justify-between">
                  <div>
                    <span className="badge badge-yellow mb-1 scale-90 origin-left">Top #{i + 1}</span>
                    <p className="font-bold text-white text-sm">{costume.char_name}</p>
                    <p className="text-[10px] text-neon-cyan">{costume.anime}</p>
                  </div>
                  <div className="flex items-center gap-1 text-neon-pink font-bold text-sm bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-current" /> {costume.votes_count}
                  </div>
                </div>
              </div>
            ))}
            {topCostumes.length === 0 && <p className="text-muted text-sm py-4 text-center">Aún no hay disfraces registrados.</p>}
          </div>
        </div>
      </div>

      {/* Canciones Históricas */}
      <div className="card accent-lime p-6 sm:p-8 space-y-5">
        <h2 className="section-title text-xl flex items-center gap-2">
          <Music className="h-6 w-6 text-neon-lime" /> Himnos de Nightcore AQP
        </h2>
        <p className="text-xs text-muted">Las canciones más votadas en la historia de nuestros eventos.</p>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topSongs.map((song, i) => (
            <div key={song.id} className="bg-black/40 border border-border rounded-xl p-4 flex gap-3 items-center hover:border-neon-lime/50 transition-colors">
              <div className="text-2xl font-black text-white/10 italic">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{song.title}</p>
                <p className="text-xs text-muted truncate">{song.artist}</p>
                {song.tags && song.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 overflow-hidden">
                    {song.tags.slice(0, 2).map(t => (
                      <span key={t} className="text-[9px] text-neon-lime bg-neon-lime/10 px-1 rounded-sm">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center text-neon-cyan">
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs font-bold">{song.votes_count}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center pt-4">
          <Link href="/playlist" className="btn btn-ghost border border-white/10 text-xs">
            Ver playlist actual completa
          </Link>
        </div>
      </div>
    </div>
  );
}
