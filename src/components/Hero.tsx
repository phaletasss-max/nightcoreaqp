'use client';

// ── Hero section — Scenecore edition ─────────────────────────────────────────
// Muestra el próximo evento con countdown, DJs y temas scenecore.

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Zap, Star, X, Info } from 'lucide-react';
import type { EventItem } from '@/lib/types';
import FlyerMedia from '@/components/FlyerMedia';

const THEMES = [
  { emoji: '💜', label: 'Cyberpunk' },
  { emoji: '🎧', label: 'Nightcore' },
  { emoji: '⚡', label: 'Eurobeat' },
  { emoji: '🌈', label: 'Scene' },
  { emoji: '💀', label: 'Emo' },
  { emoji: '🎮', label: 'Gaming' },
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
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <section className="hero-gradient relative overflow-hidden rounded-2xl border border-border px-6 py-12 sm:px-10 sm:py-16 rainbow-border">
        {/* Background image (opaque) */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.15] bg-cover bg-center mix-blend-screen" 
          style={{ backgroundImage: 'url("/fondoflayers.jpg")' }} 
        />

        {/* Scenecore decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-4 right-4 opacity-20">
            <Star className="h-8 w-8 text-neon-yellow" />
          </div>
          <div className="absolute bottom-6 left-6 opacity-15">
            <Zap className="h-10 w-10 text-neon-lime" />
          </div>
          <div className="absolute top-1/2 right-1/4 opacity-10">
            <Star className="h-6 w-6 text-neon-magenta" />
          </div>
          {/* Rainbow stripe accent */}
          <div className="absolute top-0 left-0 right-0 h-1 rainbow-stripe" />
          <div className="absolute bottom-0 left-0 right-0 h-1 rainbow-stripe" />
        </div>

        {/* Glow blobs */}
        <div className="absolute inset-0 opacity-[0.3] pointer-events-none z-0"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,0,255,0.15), transparent 45%), radial-gradient(circle at 20% 80%, rgba(0,255,255,0.10), transparent 45%)' }} />

        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="badge badge-pink mb-5">
              <Sparkles className="h-3.5 w-3.5 glow-magenta" />
              Comunidad nightcore · Arequipa
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
              <span className="glitch-text" data-text="El club de nightcore">El club de nightcore</span><br />
              <span className="text-glow-rainbow">de Arequipa.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted max-w-xl leading-relaxed">
              Sugiere y vota la playlist del DJ, reserva tu entrada, compite en el concurso de
              disfraces y mantén tu racha diaria. Organizado por <span className="text-neon-magenta font-bold">Yorch</span>, hecho por la comunidad.
            </p>

            {/* Próximo evento + countdown */}
            {nextEvent && (
              <div className="mt-8 card p-5 max-w-lg bg-surface/60 accent-magenta">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="eyebrow mb-1">Próximo evento</p>
                    <p className="font-bold text-white leading-tight">{nextEvent.title}</p>
                  </div>
                  <span className={`badge ${nextEvent.status === 'confirmed' ? 'badge-lime' : 'badge-yellow'}`}>
                    {nextEvent.status === 'confirmed' ? '✓ Confirmado' : 'En planeación'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[{ l: 'Días', v: t.d }, { l: 'Hrs', v: t.h }, { l: 'Min', v: t.m }, { l: 'Seg', v: t.s }].map((c) => (
                    <div key={c.l} className="rounded-lg bg-black/40 border border-border py-2.5 text-center">
                      <div className="text-2xl font-extrabold text-white tabular-nums">{String(c.v).padStart(2, '0')}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-2 mt-0.5">{c.l}</div>
                    </div>
                  ))}
                </div>
                {onCta && (
                  <button data-neon-target="reservar" onClick={onCta} className="btn btn-primary w-full mt-4">
                    Reservar mi entrada <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Flyer en móvil/tablet (la columna derecha solo existe en lg+) */}
            {nextEvent && (
              <div className="lg:hidden mt-8 space-y-3">
                <div className="relative rounded-2xl overflow-hidden border-2 border-neon-magenta shadow-[0_0_30px_rgba(255,0,255,0.25)] w-full max-w-sm mx-auto glitch-hover">
                  <FlyerMedia url={nextEvent.flyer_url || "/nightcorefest2.0.webp"} alt="Event Flyer" />
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-ghost w-full max-w-sm mx-auto flex border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10">
                  <Info className="h-4 w-4" /> Conoce los detalles
                </button>
              </div>
            )}

            {/* Temáticas */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-1">Temáticas</span>
              {(nextEvent?.themes ? nextEvent.themes.split(',').map(t => ({ label: t.trim(), emoji: '✦' })) : THEMES).map((th) => (
                <span key={th.label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-3 py-1 text-xs font-semibold text-muted hover:text-foreground hover:border-neon-magenta/40 transition-colors cursor-default">
                  <span>{th.emoji}</span>{th.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right column: Flyer */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-5">
            <div className="relative rounded-2xl overflow-hidden border-2 border-neon-magenta shadow-[0_0_30px_rgba(255,0,255,0.25)] transform md:rotate-2 hover:rotate-0 transition-all duration-300 w-full max-w-sm glitch-hover">
              <FlyerMedia url={nextEvent?.flyer_url || "/nightcorefest2.0.webp"} alt="Event Flyer" />
            </div>
            {nextEvent && (
              <button onClick={() => setShowModal(true)} className="btn btn-ghost border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10">
                <Info className="h-4 w-4" /> Conoce los detalles
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Modal de detalles */}
      {showModal && nextEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-neon-magenta rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(255,0,255,0.2)]">
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface/90 backdrop-blur border-b border-border p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-neon-magenta" /> {nextEvent.title}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 grid md:grid-cols-2 gap-8 items-start">
              <div>
                <FlyerMedia url={nextEvent.flyer_url || "/nightcorefest2.0.webp"} alt="Flyer" className="rounded-xl border border-border shadow-lg" />
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white">{nextEvent.title}</h3>
                  <p className="text-neon-cyan font-bold mt-1">{nextEvent.tagline}</p>
                </div>
                
                <div className="space-y-4 text-sm text-muted">
                  <p className="leading-relaxed">{nextEvent.description}</p>
                  
                  <div className="card p-5 accent-lime bg-black/40">
                    <h4 className="font-bold text-neon-lime mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 glow-lime" /> Extras del evento
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs">
                      {nextEvent.details ? nextEvent.details.split(',').map((det, i) => (
                        <li key={i}>✦ <strong className="text-white">{det.trim()}</strong></li>
                      )) : (
                        <>
                          <li>🥃 <strong className="text-white">Shots gratis</strong> a los primeros en llegar</li>
                          <li>🍸 <strong className="text-white">Cóctel gratis</strong> si vienes con cosplay</li>
                          <li>🍾 <strong className="text-white">1 sellada</strong> al grupo más grande</li>
                          <li>🎵 <strong className="text-white">10 horas</strong> de música Nightcore</li>
                          <li>🎤 <strong className="text-white">Pedidos musicales</strong> a los DJs por WhatsApp</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {nextEvent.google_maps_url && (
                    <a href={nextEvent.google_maps_url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg border border-border hover:border-neon-cyan/50 bg-white/5 text-neon-cyan transition-colors text-center text-xs font-bold">
                      📍 Ver ubicación en Google Maps
                    </a>
                  )}

                  {nextEvent.tiktok_urls && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-muted-2 uppercase">TikToks Relacionados</p>
                      <div className="flex flex-col gap-2">
                        {nextEvent.tiktok_urls.split(',').map((url, i) => (
                          <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-pink hover:underline truncate block">
                            ▶ {url.trim()}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-border flex justify-end">
                  <button onClick={() => setShowModal(false)} className="btn btn-ghost mr-3">
                    Cerrar
                  </button>
                  {onCta && (
                    <button onClick={() => { setShowModal(false); onCta(); }} className="btn btn-primary">
                      Reservar mi entrada <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
