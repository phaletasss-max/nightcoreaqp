'use client';

// ── Feed de la comunidad (versión inicial) ───────────────────────────────────
// Muestra contenido nuevo de la comunidad en Eventos: por ahora las publicaciones
// recientes de disfraces. Más adelante se mezclan debates/preguntas y se ordena
// por interés del usuario (no repetir lo ya visto). Ver docs/ROADMAP.md (Fase 1/2).

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';
import { getCostumes } from '@/lib/data';
import type { Costume } from '@/lib/types';

export default function CommunityFeed() {
  const [costumes, setCostumes] = useState<Costume[]>([]);

  useEffect(() => { getCostumes().then(setCostumes); }, []);

  const recent = costumes.slice(0, 6);
  if (recent.length === 0) return null;

  return (
    <section className="card p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="section-title text-xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-neon-pink" /> Novedades de la comunidad
        </h3>
        <Link href="/disfraces" className="text-xs font-bold text-neon-cyan hover:underline flex items-center gap-1">
          Ver todo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {recent.map((c) => (
          <Link key={c.id} href="/disfraces" className="group block rounded-xl overflow-hidden border border-border card-hover">
            <div className="relative aspect-[3/4] bg-black overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.photo_url} alt={c.char_name} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
              <span className="absolute bottom-1.5 right-1.5 badge badge-pink bg-black/70 backdrop-blur text-[10px]">
                <Heart className="h-3 w-3" /> {c.votes_count}
              </span>
            </div>
            <p className="text-[11px] font-bold text-white truncate px-2 py-1.5">{c.char_name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
