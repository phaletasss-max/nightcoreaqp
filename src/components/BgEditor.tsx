'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Check, X, Loader2, Sparkles } from 'lucide-react';
import { updateSiteSetting, uploadMediaFile, generateImage, uploadDataUrl } from '@/lib/data';
import { PROMPT_PRESETS, type ImageAspect } from '@/lib/imagePrompts';

interface BgEditorProps {
  sectionKey: string;
  currentBg?: string;
  onBgUpdate: (bgUrl: string) => void;
  currentOpacity?: number;
  onOpacityUpdate?: (opacity: number) => void;
  theme?: string;   // tema activo (design_theme) para que la imagen combine
}

export default function BgEditor({ sectionKey, currentBg, onBgUpdate, currentOpacity = 0.2, onOpacityUpdate, theme = 'default' }: BgEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState(currentBg || '');
  const [uploading, setUploading] = useState(false);

  // Generación con IA
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAspect, setAiAspect] = useState<ImageAspect>('banner');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Guarda la opacidad de este fondo (clave bg_opacity_<sección> en site_settings).
  const handleOpacity = async (value: number) => {
    onOpacityUpdate?.(value);
    await updateSiteSetting(`bg_opacity_${sectionKey}`, String(value));
  };

  const handleSave = async (bgUrl: string) => {
    setUploading(true);
    try {
      await updateSiteSetting(sectionKey, bgUrl);
      onBgUpdate(bgUrl);
      setIsOpen(false);
    } catch (e) {
      alert('Error al guardar el fondo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadMediaFile(file);
      if (publicUrl) {
        setUrl(publicUrl);
        await handleSave(publicUrl);
      }
    } catch (e) {
      alert('Error al subir la imagen');
      setUploading(false);
    }
  };

  // Genera un fondo con IA (estilo del sitio + tema), lo sube a Storage y lo aplica.
  const handleGenerate = async () => {
    setGenerating(true);
    setAiError(null);
    try {
      const dataUrl = await generateImage(aiPrompt, { theme, aspect: aiAspect });
      const publicUrl = await uploadDataUrl(dataUrl, 'png');
      if (publicUrl) {
        setUrl(publicUrl);
        await handleSave(publicUrl);
      } else {
        setAiError('La imagen se generó pero no se pudo guardar (revisa el bucket "media").');
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'No se pudo generar la imagen.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-2 right-2 z-50 bg-black/60 hover:bg-neon-magenta text-white p-2 rounded-lg backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 shadow-xl border border-white/10"
        title="Cambiar Fondo del Contenedor"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute top-2 right-2 z-50 bg-black/90 p-4 rounded-xl border border-neon-magenta shadow-2xl shadow-neon-magenta/20 backdrop-blur-md w-72 max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-white flex items-center gap-2"><ImageIcon className="h-3 w-3 text-neon-magenta" /> Fondo de Sección</h4>
        <button onClick={() => setIsOpen(false)} className="text-muted hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-muted-2 uppercase font-bold mb-1 block">URL de la Imagen</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://..."
              className="flex-1 bg-black/50 border border-border rounded px-2 py-1 text-xs text-white"
            />
            <button onClick={() => handleSave(url)} disabled={uploading} className="bg-neon-magenta text-white px-2 rounded hover:bg-pink-600 transition-colors">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <span className="text-[10px] text-muted-2 uppercase font-bold">- O sube un archivo -</span>
          <label className="mt-2 block w-full py-2 border border-dashed border-neon-cyan hover:bg-neon-cyan/10 rounded cursor-pointer text-xs font-bold text-neon-cyan transition-colors">
            {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
            <input type="file" accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
        </div>

        {/* Generar con IA */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <span className="text-[10px] text-neon-magenta uppercase font-bold flex items-center gap-1"><Sparkles className="h-3 w-3" /> Generar con IA</span>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={2}
            placeholder="Describe el fondo (ej. ciudad cyberpunk lluviosa)…"
            className="w-full bg-black/50 border border-border rounded px-2 py-1 text-xs text-white resize-none"
          />
          <div className="flex flex-wrap gap-1">
            {PROMPT_PRESETS.slice(0, 4).map((p) => (
              <button key={p.label} type="button" onClick={() => setAiPrompt(p.idea)}
                className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-2 hover:text-white hover:border-neon-magenta/50">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['banner', 'square'] as const).map((a) => (
              <button key={a} type="button" onClick={() => setAiAspect(a)}
                className={`text-[9px] px-2 py-0.5 rounded border font-bold ${aiAspect === a ? 'border-neon-cyan text-neon-cyan' : 'border-border text-muted-2'}`}>
                {a === 'banner' ? 'Banner' : 'Cuadrado'}
              </button>
            ))}
            <button type="button" onClick={handleGenerate} disabled={generating}
              className="ml-auto flex items-center gap-1 bg-neon-magenta text-white text-[10px] font-bold px-2.5 py-1 rounded hover:bg-pink-600 disabled:opacity-50">
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {generating ? 'Generando…' : 'Generar'}
            </button>
          </div>
          {aiError && <p className="text-[10px] text-red-400 leading-tight">{aiError}</p>}
          <p className="text-[9px] text-muted-2 leading-tight">Usa el tema activo para combinar. Requiere key de Google con acceso a imágenes (de pago).</p>
        </div>

        {/* Opacidad del fondo de esta sección */}
        {onOpacityUpdate && (
          <div className="pt-2 border-t border-white/10">
            <label className="text-[10px] text-muted-2 uppercase font-bold mb-1 flex justify-between">
              <span>Opacidad del fondo</span>
              <span className="text-neon-cyan font-mono">{Math.round(currentOpacity * 100)}%</span>
            </label>
            <input
              type="range" min="0" max="1" step="0.05" defaultValue={currentOpacity}
              onChange={(ev) => handleOpacity(parseFloat(ev.target.value))}
              className="w-full accent-neon-magenta cursor-pointer"
            />
          </div>
        )}
        {currentBg && (
          <button onClick={() => handleSave('')} className="w-full text-xs text-red-400 hover:text-red-300 pt-2 border-t border-white/10 mt-2">
            Restaurar Original
          </button>
        )}
      </div>
    </div>
  );
}
