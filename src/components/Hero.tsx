'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { EventItem } from '@/lib/types';

const THEMES = [
  { emoji: '🩵', label: 'Miku' },
  { emoji: '🔴', label: 'FNAF' },
  { emoji: '🟡', label: 'Undertale' },
  { emoji: '🟢', label: 'Minecraft' },
  { emoji: '🌸', label: 'Caramelldansen' },
];

function useCountdown(dateStr?: string) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!dateStr) return;
    const tick = () => {
      const diff = new Date(dateStr).getTime() - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]);
  return t;
}

export default function Hero({ nextEvent, onCta }: { nextEvent?: EventItem; onCta?: () => void }) {
  const t = useCountdown(nextEvent?.date);

  return (
    <section className="hero-gradient relative overflow-hidden rounded-2xl border border-border px-6 py-12 sm:px-10 sm:py-16">
      {/* malla sutil */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,45,143,0.12), transparent 45%)' }} />

      <div className="relative max-w-2xl">
        <div className="badge badge-pink mb-5">
          <Sparkles className="h-3.5 w-3.5" />
          Comunidad nightcore · Arequipa
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
          El club de nightcore<br />
          <span className="text-neon-pink text-glow-pink">de Arequipa.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-muted max-w-xl leading-relaxed">
          Sugiere y vota la playlist del DJ, reserva tu entrada, compite en el concurso de
          disfraces y mantén tu racha diaria. Organizado por Yorch, hecho por la comunidad.
        </p>

        {/* Próximo evento + countdown */}
        {nextEvent && (
          <div className="mt-8 card p-5 max-w-lg bg-surface/60 backdrop-blur">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="eyebrow mb-1">Próximo evento</p>
                <p className="font-bold text-white leading-tight">{nextEvent.title}</p>
              </div>
              <span className={`badge ${nextEvent.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>
                {nextEvent.status === 'confirmed' ? 'Confirmado' : 'En planeación'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[{ l: 'Días', v: t.d }, { l: 'Hrs', v: t.h }, { l: 'Min', v: t.m }, { l: 'Seg', v: t.s }].map((c) => (
                <div key={c.l} className="rounded-lg bg-black/30 border border-border py-2.5 text-center">
                  <div className="text-2xl font-extrabold text-white tabular-nums">{String(c.v).padStart(2, '0')}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-2 mt-0.5">{c.l}</div>
                </div>
              ))}
            </div>
            {onCta && (
              <button onClick={onCta} className="btn btn-primary w-full mt-4">
                Reservar mi entrada <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Temáticas */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">Temáticas</span>
          {THEMES.map((th) => (
            <span key={th.label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-3 py-1 text-xs font-semibold text-muted">
              <span>{th.emoji}</span>{th.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
