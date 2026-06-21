'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera, Sparkles, Heart, MessageSquare, Send, UploadCloud, User, Award,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getCostumes, addCostume, setCostumeVote, getEvents } from '@/lib/data';
import type { Costume, EventItem } from '@/lib/types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function DisfracesPage() {
  const { profile, addPoints } = useAuth();
  const [entries, setEntries] = useState<Costume[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectableEvents, setSelectableEvents] = useState<EventItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [charName, setCharName] = useState('');
  const [anime, setAnime] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [eventId, setEventId] = useState('');
  const [openComment, setOpenComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    getCostumes().then(setEntries);
    getEvents().then((evs) => {
      setEvents(evs);
      // Solo se puede subir a eventos futuros o que terminaron hace ≤ 1 semana.
      const cutoff = Date.now() - WEEK_MS;
      setSelectableEvents(evs.filter((ev) => new Date(ev.date).getTime() >= cutoff));
    });
  }, []);

  const eventName = (id: string | null) => events.find((ev) => ev.id === id)?.title ?? null;

  const handleVote = async (id: string) => {
    let nowVoted = false;
    setEntries((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      nowVoted = !e.voted;
      return { ...e, voted: nowVoted, votes_count: e.votes_count + (nowVoted ? 1 : -1) };
    }));
    await setCostumeVote(id, nowVoted, profile?.id ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName || !anime || !description) return;
    const finalPhoto = photoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
    const row = await addCostume({ char_name: charName, anime, photo_url: finalPhoto, description }, profile?.id ?? null, eventId || null);
    setEntries((prev) => [row, ...prev]);
    setCharName(''); setAnime(''); setDescription(''); setPhotoUrl(''); setEventId(''); setShowForm(false);
    addPoints(10);
  };

  const addLocalComment = (id: string) => {
    if (!commentText.trim()) return;
    setEntries((prev) => prev.map((e) => e.id !== id ? e : {
      ...e,
      comments: [...(e.comments ?? []), { id: `cc-${Date.now()}`, costume_id: id, username: profile?.username ?? 'Tú', content: commentText, created_at: new Date().toISOString() }],
    }));
    setCommentText('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2 text-2xl">
            <Camera className="h-6 w-6 text-neon-cyan" /> Pasarela de disfraces
          </h1>
          <p className="text-sm text-muted mt-1">Sube tu cosplay del evento. El más votado gana pases VIP gratis.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-cyan">
          <UploadCloud className="h-4 w-4" /> Subir disfraz
        </button>
      </div>

      {showForm && (
        <div className="flex flex-col md:flex-row gap-8 items-start animate-fade-in">
          <form onSubmit={handleSubmit} className="card accent-cyan p-5 space-y-4 flex-1 w-full max-w-2xl">
            <h3 className="font-bold text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-neon-cyan" /> Registrar disfraz</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">Personaje</label><input className="input" required value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="Ej. Misa Amane" /></div>
              <div><label className="label">Anime / Serie</label><input className="input" required value={anime} onChange={(e) => setAnime(e.target.value)} placeholder="Ej. Death Note" /></div>
            </div>
            <div>
              <label className="label">Foto (Sube un PNG o JPG)</label>
              <input 
                className="input cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neon-cyan/10 file:text-neon-cyan hover:file:bg-neon-cyan/20" 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handlePhotoUpload} 
                required 
              />
              <p className="text-[11px] text-muted-2 mt-1">En producción esto subirá la imagen a Supabase Storage.</p>
            </div>
            <div>
              <label className="label">¿De qué evento es la foto?</label>
              <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">Sin evento / general</option>
                {selectableEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-2 mt-1">Solo aparecen eventos vigentes o que terminaron hace ≤ 1 semana.</p>
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input resize-none" rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles, materiales, tus redes de cosplay…" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
              <button type="submit" className="btn btn-cyan">Publicar</button>
            </div>
          </form>
          
          <div className="hidden md:flex flex-col items-center justify-center max-w-xs text-center space-y-4 mt-6">
            <div className="relative rounded-2xl overflow-hidden border-2 border-neon-magenta shadow-[0_0_25px_rgba(255,0,255,0.3)] transform rotate-3 hover:rotate-0 transition-transform w-full max-w-[200px]">
              <img src="/mikualentadora.jpg" alt="Miku alentadora" className="w-full h-auto object-cover" />
            </div>
            <div className="card p-4 accent-magenta relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surface border-t border-l border-border rotate-45" />
              <p className="text-sm font-bold text-white relative z-10">
                ¡Anímate a subir tu cosplay o fotos que tengas de los cosplays para recordarlos! ✦
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <div key={entry.id} className="card card-hover overflow-hidden flex flex-col">
            <div className="relative aspect-[4/5] bg-black overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.photo_url} alt={entry.char_name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 badge badge-cyan bg-black/70 backdrop-blur">
                <Award className="h-3.5 w-3.5" /> {entry.char_name}
              </div>
              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur border border-border rounded-lg p-2.5">
                <p className="text-[10px] text-muted-2">Anime / origen</p>
                <p className="text-sm font-bold text-white">{entry.anime}</p>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-neon-pink" />
                  {entry.user_id ? 'Usuario' : 'Comunidad'}
                </span>
                {eventName(entry.event_id) && (
                  <span className="badge badge-pink">{eventName(entry.event_id)}</span>
                )}
              </div>
              <p className="text-sm text-muted italic">&ldquo;{entry.description}&rdquo;</p>

              <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                <button onClick={() => handleVote(entry.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    entry.voted ? 'border-neon-pink/50 bg-neon-pink/10 text-neon-pink' : 'border-border text-muted hover:text-white'
                  }`}>
                  <Heart className={`h-4 w-4 ${entry.voted ? 'fill-neon-pink' : ''}`} /> {entry.votes_count}
                </button>
                <button onClick={() => setOpenComment(openComment === entry.id ? null : entry.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    openComment === entry.id ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan' : 'border-border text-muted hover:text-white'
                  }`}>
                  <MessageSquare className="h-4 w-4" /> {entry.comments?.length ?? 0}
                </button>
              </div>

              {openComment === entry.id && (
                <div className="pt-3 border-t border-border space-y-2 animate-fade-in">
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {(entry.comments ?? []).length === 0 ? (
                      <p className="text-[11px] text-muted-2 italic text-center py-2">Sé el primero en comentar.</p>
                    ) : entry.comments!.map((c) => (
                      <div key={c.id} className="bg-white/[0.03] border border-border rounded-lg p-2 text-xs">
                        <span className="font-bold text-neon-cyan">{c.username}</span>
                        <p className="text-muted mt-0.5">{c.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="input text-xs py-1.5" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addLocalComment(entry.id); }} placeholder="Comenta…" />
                    <button onClick={() => addLocalComment(entry.id)} className="btn btn-cyan px-2.5 py-1.5"><Send className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
