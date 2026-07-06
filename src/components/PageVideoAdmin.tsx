'use client';

// ── PageVideoAdmin — "Videos de fondo por página" (Admin → Diseño) ───────────
// El admin sube un video (o pega una URL) y elige en qué páginas se muestra:
// una, varias o todas. Guarda TODO en site_settings[design_page_videos] (JSON
// { pageKey: url }) vía el setDesignKey del panel → se aplica en vivo para
// todos (PageVideoManager escucha 'nq-design-updated').

import React, { useState } from 'react';
import { Film, Trash2, UploadCloud, Loader2, Plus } from 'lucide-react';
import { uploadMediaFile } from '@/lib/data';
import { PAGE_OPTIONS, parsePageVideos } from '@/lib/pageVideos';

export default function PageVideoAdmin({ raw, onSave }: {
  raw: string | undefined;
  onSave: (json: string) => void;
}) {
  const config = parsePageVideos(raw);
  const [urlInput, setUrlInput] = useState('');
  const [targets, setTargets] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = (next: Record<string, string>) => onSave(JSON.stringify(next));

  const toggleTarget = (key: string) =>
    setTargets((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const assign = (url: string) => {
    const clean = url.trim();
    if (!clean) { setError('Pega una URL o sube un archivo primero.'); return; }
    if (targets.length === 0) { setError('Marca al menos una página donde mostrarlo.'); return; }
    const next = { ...config };
    for (const k of targets) next[k] = clean;
    save(next);
    setUrlInput('');
    setTargets([]);
    setError(null);
  };

  const remove = (key: string) => {
    const next = { ...config };
    delete next[key];
    save(next);
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadMediaFile(file);
      if (url) setUrlInput(url);
      else setError('No se pudo subir el video (revisa el bucket "media").');
    } catch {
      setError('Error al subir el video.');
    } finally {
      setUploading(false);
    }
  };

  const assigned = PAGE_OPTIONS.filter((p) => config[p.key]);

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Film className="h-4 w-4 text-neon-magenta" /> Videos de fondo por página
        </h3>
        <p className="text-[11px] text-muted-2 mt-1">
          Sube el video que quieras y elige dónde se ve (una página, varias o todas).
          Se aplica en vivo para todos los visitantes. Formato ideal: MP4 corto en loop, ≤10 MB.
        </p>
      </div>

      {/* Asignaciones actuales */}
      {assigned.length > 0 ? (
        <div className="space-y-2">
          {assigned.map((p) => (
            <div key={p.key} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-border">
              <video src={config[p.key]} muted playsInline preload="metadata" className="h-10 w-16 rounded object-cover bg-black shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">{p.label}</p>
                <p className="text-[10px] text-muted-2 truncate">{config[p.key]}</p>
              </div>
              <button onClick={() => remove(p.key)} title="Quitar video de esta página"
                className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-2 text-center py-3 border border-dashed border-border rounded-lg">
          Sin videos asignados. Añade uno abajo. ✦
        </p>
      )}

      {/* Añadir nuevo */}
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-bold text-white flex items-center gap-1.5"><Plus className="h-3.5 w-3.5 text-neon-lime" /> Añadir video</p>
        <div className="flex gap-2">
          <input className="input py-1.5 text-xs" value={urlInput} onChange={(e) => { setUrlInput(e.target.value); setError(null); }}
            placeholder="https://...mp4 o sube un archivo →" />
          <div className="relative shrink-0">
            <input type="file" accept="video/mp4,video/webm" disabled={uploading}
              onChange={(e) => handleUpload(e.target.files?.[0])}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <span className="btn btn-ghost py-1.5 px-3 text-xs pointer-events-none">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />} Subir
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PAGE_OPTIONS.map((p) => (
            <button key={p.key} type="button" onClick={() => toggleTarget(p.key)}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors ${
                targets.includes(p.key)
                  ? 'border-neon-magenta/60 bg-neon-magenta/15 text-white'
                  : 'border-border text-muted hover:text-white'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        {error && <p className="text-[11px] text-red-400 font-bold">⚠️ {error}</p>}
        <button type="button" onClick={() => assign(urlInput)} className="btn btn-primary w-full py-2 text-xs">
          Asignar a {targets.length || 0} página{targets.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  );
}
