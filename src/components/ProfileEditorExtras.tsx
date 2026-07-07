'use client';

// ── Editor de perfil: bio, links sociales, acento y galería de fotos ─────────
// (Fase Perfil+ / Personalización). Autocontenido: usa useAuth para el perfil y
// refresh. Persiste en Supabase vía data.ts (o localStorage en modo demo). La
// subida de fotos reusa uploadMediaFile (bucket 'media').

import React, { useEffect, useState } from 'react';
import { Camera, Plus, Trash2, Loader2, Check, Save, Palette } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  updateProfileMeta, getProfilePhotos, addProfilePhoto, deleteProfilePhoto, uploadMediaFile,
} from '@/lib/data';
import type { ProfilePhoto } from '@/lib/types';

// Paleta de acentos (scenecore). Guardamos el hex; el perfil público lo aplica
// con color-mix sobre la variable, no como color fijo del tema global.
const ACCENTS = [
  { name: 'Magenta', hex: '#ff2bd6' },
  { name: 'Cyan', hex: '#22d3ee' },
  { name: 'Lima', hex: '#a3e635' },
  { name: 'Púrpura', hex: '#a855f7' },
  { name: 'Rosa', hex: '#ff5fa2' },
  { name: 'Naranja', hex: '#fb923c' },
];

export default function ProfileEditorExtras() {
  const { profile, refresh } = useAuth();
  const [bio, setBio] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [instagram, setInstagram] = useState('');
  const [accent, setAccent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio ?? '');
    setTiktok(profile.tiktok_url ?? '');
    setInstagram(profile.instagram_url ?? '');
    setAccent(profile.accent ?? '');
    getProfilePhotos(profile.id).then(setPhotos);
  }, [profile?.id]);

  if (!profile) return null;

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfileMeta(profile.id, {
        bio: bio.trim() || null,
        tiktok_url: tiktok.trim() || null,
        instagram_url: instagram.trim() || null,
        accent: accent || null,
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMediaFile(file);
      if (url) {
        const row = await addProfilePhoto(profile.id, url);
        if (row) setPhotos((p) => [...p, row]);
      } else {
        alert('No se pudo subir la foto (revisa el bucket "media" en Supabase).');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    setPhotos((p) => p.filter((x) => x.id !== id));
    await deleteProfilePhoto(id, profile.id);
  };

  return (
    <div className="space-y-6">
      {/* Bio + links + acento */}
      <form onSubmit={handleSaveMeta} className="card p-6 space-y-4">
        <h3 className="section-title text-base flex items-center gap-2">
          <Palette className="h-5 w-5 text-neon-magenta" /> Sobre mí
        </h3>

        <div>
          <label className="label text-[10px]">Biografía</label>
          <textarea
            className="input py-2 text-sm resize-none"
            rows={3}
            maxLength={280}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Cuéntale a la banda quién eres, tu anime favorito, tu género nightcore…"
          />
          <p className="text-[10px] text-muted-2 text-right">{bio.length}/280</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label text-[10px]">TikTok (URL)</label>
            <input className="input py-1.5 text-xs" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@tu_user" />
          </div>
          <div>
            <label className="label text-[10px]">Instagram (URL)</label>
            <input className="input py-1.5 text-xs" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/tu_user" />
          </div>
        </div>

        <div>
          <label className="label text-[10px]">Color de acento de tu perfil</label>
          <div className="flex flex-wrap gap-2 mt-1">
            <button
              type="button"
              onClick={() => setAccent('')}
              className={`h-8 px-3 rounded-lg border text-[10px] font-bold ${accent === '' ? 'border-white text-white' : 'border-border text-muted-2'}`}
            >
              Por defecto
            </button>
            {ACCENTS.map((a) => (
              <button
                key={a.hex}
                type="button"
                onClick={() => setAccent(a.hex)}
                title={a.name}
                className={`h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110 ${accent === a.hex ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: a.hex }}
              >
                {accent === a.hex && <Check className="h-4 w-4 text-black mx-auto" />}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary text-xs w-full py-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Guardado' : 'Guardar sobre mí'}
        </button>
      </form>

      {/* Galería de fotos */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title text-base flex items-center gap-2">
            <Camera className="h-5 w-5 text-neon-cyan" /> Mi galería
          </h3>
          <span className="text-[10px] text-muted-2 font-bold">{photos.length} fotos</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((ph) => (
            <div key={ph.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              { }
              <img loading="lazy" decoding="async" src={ph.url} alt={ph.caption ?? 'foto'} className="w-full h-full object-cover" />
              <button
                onClick={() => handleDeletePhoto(ph.id)}
                className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300"
                title="Eliminar foto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Botón subir */}
          <label className="relative aspect-square rounded-lg border border-dashed border-white/20 hover:border-neon-cyan/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] text-muted-2">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-neon-cyan" /> : <Plus className="h-5 w-5 text-neon-cyan" />}
            <span className="text-[9px] font-bold mt-1">{uploading ? 'Subiendo…' : 'Añadir'}</span>
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={(e) => handleAddPhoto(e.target.files?.[0])} />
          </label>
        </div>
        <p className="text-[10px] text-muted-2">Tus fotos se ven en tu perfil público (si tu perfil no es privado).</p>
      </div>
    </div>
  );
}
