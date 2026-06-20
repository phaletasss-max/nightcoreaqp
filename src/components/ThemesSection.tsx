'use client';

// ── Temáticas sugeridas por la comunidad ─────────────────────────────────────
// La gente sugiere temáticas y las "clickea". Las más clickeadas suben en el
// ranking; el top 10 son las populares. Alimentan las votaciones de próximos
// eventos y (más adelante) el fondo de video.

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Flame, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getThemes, addTheme, clickTheme } from '@/lib/data';
import type { Theme } from '@/lib/types';

export default function ThemesSection() {
  const { profile } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { getThemes().then(setThemes); }, []);

  const resort = (list: Theme[]) => [...list].sort((a, b) => b.clicks - a.clicks);

  const handleClick = async (id: string) => {
    setThemes((prev) => resort(prev.map((t) => t.id === id ? { ...t, clicks: t.clicks + 1 } : t)));
    await clickTheme(id);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (themes.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setName(''); setShowForm(false); return;
    }
    const row = await addTheme(trimmed, profile?.id ?? null, profile?.username ?? 'Tú');
    setThemes((prev) => resort([...prev, row]));
    setName(''); setShowForm(false);
  };

  const top10 = themes.slice(0, 10);

  return (
    <section className="card p-6 sm:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="section-title text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-purple" /> Temáticas de la comunidad
          </h3>
          <p className="text-sm text-muted mt-0.5">Clickea las que te gusten. Las más populares definen las próximas fiestas.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-ghost shrink-0">
          <Plus className="h-4 w-4" /> Sugerir temática
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="flex gap-3 animate-fade-in">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Genshin Impact, Eurobeat 90s, Vtubers…" maxLength={40} />
          <button type="submit" className="btn btn-primary shrink-0">Agregar</button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {top10.map((t, i) => (
          <button key={t.id} onClick={() => handleClick(t.id)}
            className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
              i === 0 ? 'border-neon-pink/40 bg-neon-pink/10 text-neon-pink'
              : i < 3 ? 'border-neon-purple/30 bg-neon-purple/10 text-neon-purple'
              : 'border-border text-muted hover:text-white hover:bg-white/5'
            }`}
            title="Click para apoyar esta temática">
            {i === 0 ? <Flame className="h-3.5 w-3.5" /> : i < 3 ? <TrendingUp className="h-3.5 w-3.5" /> : null}
            <span>{t.name}</span>
            <span className="text-xs font-bold tabular-nums opacity-70">{t.clicks}</span>
          </button>
        ))}
        {themes.length === 0 && (
          <p className="text-sm text-muted-2">Sé el primero en sugerir una temática.</p>
        )}
      </div>

      {themes.length > 10 && (
        <p className="text-[11px] text-muted-2">Mostrando el top 10 de {themes.length} temáticas.</p>
      )}
    </section>
  );
}
