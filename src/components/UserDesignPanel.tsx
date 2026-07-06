'use client';

// ── UserDesignPanel — "Mi estilo" ────────────────────────────────────────────
// Personalización de diseño POR USUARIO (tema, acento, fuentes, tamaño de letra).
// El admin define el default global en /admin → Diseño (site_settings); lo que el
// usuario elija aquí lo PISA solo en su navegador (localStorage por id de usuario,
// ver lib/designPresets). "Del sitio" = quitar el override y volver al default.
// DesignLoader escucha 'nq-user-design-updated' y aplica el merge en vivo.

import React, { useState, useEffect } from 'react';
import { Palette, Type, RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  THEME_OPTIONS, FONT_OPTIONS, BODY_FONT_OPTIONS, ACCENT_OPTIONS,
  getUserDesign, setUserDesign, type UserDesign,
} from '@/lib/designPresets';

export default function UserDesignPanel() {
  const { profile } = useAuth();
  const userId = profile?.id ?? null;
  const [design, setDesign] = useState<UserDesign>({});

  useEffect(() => { setDesign(getUserDesign(userId)); }, [userId]);

  const setKey = (key: keyof UserDesign, value: string) => {
    // Elegir lo mismo que ya estaba (o 'default') = quitar el override.
    const next = { ...design };
    if (!value || value === 'default' || next[key] === value) delete next[key];
    else next[key] = value;
    setDesign(next);
    setUserDesign(userId, next);
  };

  const resetAll = () => {
    setDesign({});
    setUserDesign(userId, {});
  };

  const hasOverrides = Object.keys(design).length > 0;

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="section-title text-xl flex items-center gap-2">
            <Palette className="h-5 w-5 text-neon-magenta glow-magenta" /> Mi estilo
          </h3>
          <p className="text-xs text-muted mt-1">
            Elige cómo ves TÚ la página (solo afecta a tu cuenta en este dispositivo).
            Lo que no cambies usa el diseño del sitio.
          </p>
        </div>
        {hasOverrides && (
          <button onClick={resetAll} className="btn btn-ghost px-3 py-1.5 text-xs shrink-0" title="Volver al diseño del sitio">
            <RotateCcw className="h-3.5 w-3.5" /> Del sitio
          </button>
        )}
      </div>

      {/* Tema visual */}
      <div className="space-y-2">
        <p className="label mb-0">Tema visual {!design.design_theme && <span className="text-neon-cyan normal-case">· del sitio</span>}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {THEME_OPTIONS.map((t) => {
            const active = (design.design_theme ?? '') === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setKey('design_theme', t.key)}
                className={`group relative p-3 rounded-xl border text-left transition-all duration-200 overflow-hidden hover:-translate-y-0.5 ${
                  active
                    ? 'border-neon-magenta/70 bg-neon-magenta/10 shadow-[0_0_16px_color-mix(in_srgb,var(--magenta)_30%,transparent)]'
                    : 'border-border hover:border-border-strong bg-white/[0.02] hover:shadow-[0_0_12px_rgba(255,255,255,0.06)]'
                }`}
                title={t.hint}
              >
                {/* Franja de la paleta como gradiente (vista previa del tema) */}
                <div
                  className="h-1.5 w-full rounded-full mb-2 opacity-90 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${t.colors.join(', ')})` }}
                />
                <p className="text-xs font-bold text-white leading-tight">{t.label}</p>
                <p className="text-[9px] text-muted-2 leading-tight mt-0.5 line-clamp-1">{t.hint}</p>
                {active && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-neon-magenta text-black text-[10px] font-black flex items-center justify-center shadow-[0_0_8px_var(--magenta)]">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Acento */}
      <div className="space-y-2">
        <p className="label mb-0">Color de acento {!design.design_accent && <span className="text-neon-cyan normal-case">· del tema</span>}</p>
        <div className="flex flex-wrap items-center gap-2.5">
          {ACCENT_OPTIONS.map((a) => {
            const active = (design.design_accent ?? '') === a.key;
            if (!a.key) {
              // "Del tema" = sin override: chip especial con la franja multicolor.
              return (
                <button
                  key="theme"
                  onClick={() => setKey('design_accent', '')}
                  title="Usar el color del tema"
                  className={`px-3 h-9 rounded-full border text-[11px] font-bold flex items-center gap-2 transition-all ${
                    active ? 'border-white/60 bg-white/10 text-white' : 'border-border text-muted hover:text-white hover:border-border-strong'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full border border-white/30 rainbow-stripe" />
                  Del tema
                </button>
              );
            }
            return (
              <button
                key={a.key}
                onClick={() => setKey('design_accent', a.key)}
                title={a.label}
                className={`h-9 w-9 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                  active ? 'border-white scale-110' : 'border-white/15'
                }`}
                style={{
                  background: a.color,
                  boxShadow: active ? `0 0 14px ${a.color}` : `0 0 5px ${a.color}55`,
                }}
              >
                {active && <span className="text-black text-xs font-black drop-shadow">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fuentes */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> Fuente de títulos</label>
          <select className="input" value={design.design_font ?? 'default'} onChange={(e) => setKey('design_font', e.target.value)}>
            {FONT_OPTIONS.map((f) => <option key={f.key} value={f.key}>{f.label}{f.key === 'default' ? ' · del sitio' : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="label flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> Fuente del texto</label>
          <select className="input" value={design.design_body_font ?? 'default'} onChange={(e) => setKey('design_body_font', e.target.value)}>
            {BODY_FONT_OPTIONS.map((f) => <option key={f.key} value={f.key}>{f.label}{f.key === 'default' ? ' · del sitio' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* Tamaño de letra */}
      <div>
        <label className="label flex justify-between">
          <span>Tamaño de letra</span>
          <span className="text-neon-cyan font-mono font-bold">
            {design.design_font_scale ? `${Math.round(parseFloat(design.design_font_scale) * 100)}%` : 'del sitio'}
          </span>
        </label>
        <input
          type="range" min="0.9" max="1.15" step="0.05"
          value={design.design_font_scale ?? '1'}
          onChange={(e) => setKey('design_font_scale', e.target.value === '1' ? '' : e.target.value)}
          className="w-full accent-neon-cyan cursor-pointer bg-white/10 rounded-lg appearance-none h-1.5"
        />
      </div>
    </div>
  );
}
