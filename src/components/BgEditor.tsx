'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Check, X, Loader2 } from 'lucide-react';
import { updateSiteSetting, uploadMediaFile } from '@/lib/data';

interface BgEditorProps {
  sectionKey: string;
  currentBg?: string;
  onBgUpdate: (bgUrl: string) => void;
  currentOpacity?: number;
  onOpacityUpdate?: (opacity: number) => void;
}

export default function BgEditor({ sectionKey, currentBg, onBgUpdate, currentOpacity = 0.2, onOpacityUpdate }: BgEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState(currentBg || '');
  const [uploading, setUploading] = useState(false);

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
    <div className="absolute top-2 right-2 z-50 bg-black/90 p-4 rounded-xl border border-neon-magenta shadow-2xl shadow-neon-magenta/20 backdrop-blur-md w-72">
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

        {/* Opacidad del fondo de esta sección */}
        {onOpacityUpdate && (
          <div className="pt-2 border-t border-white/10">
            <label className="text-[10px] text-muted-2 uppercase font-bold mb-1 flex justify-between">
              <span>Opacidad del fondo</span>
              <span className="text-neon-cyan font-mono">{Math.round(currentOpacity * 100)}%</span>
            </label>
            <input
              type="range" min="0" max="1" step="0.05" defaultValue={currentOpacity}
              onChange={(e) => handleOpacity(parseFloat(e.target.value))}
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
