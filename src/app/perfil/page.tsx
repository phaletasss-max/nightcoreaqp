'use client';

import React, { useState, useEffect } from 'react';
import {
  User, Flame, Coins, Ticket, Bell, Smartphone, QrCode,
  AlertCircle, CheckCircle2, Camera, MessageSquare, Heart, Medal, ShieldAlert,
  Music, Sparkles, Plus, Trash2, ExternalLink, Check
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getAttendees, getUserActivity, addSong } from '@/lib/data';
import type { UserActivity } from '@/lib/data';
import type { Attendee } from '@/lib/types';

function rankFor(points: number) {
  if (points >= 200) return { title: 'Hypebeast de Oro', cls: 'badge-yellow' };
  if (points >= 100) return { title: 'Otaku de Plata', cls: 'badge-cyan' };
  return { title: 'Fan de Bronce', cls: 'badge-pink' };
}

import Link from 'next/link';

export default function PerfilPage() {
  const { profile, addPoints, loading, isStaff } = useAuth();
  const [tickets, setTickets] = useState<Attendee[]>([]);
  const [activity, setActivity] = useState<UserActivity>({ costumes: [], comments: [], attended: [], likesGiven: 0 });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);
  const [notifyEvent, setNotifyEvent] = useState(true);
  const [notifySongs, setNotifySongs] = useState(false);

  const [subTab, setSubTab] = useState<'tickets' | 'music'>('tickets');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [savedSongs, setSavedSongs] = useState<{ id: string; title: string; artist: string; url: string }[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [suggestSuccess, setSuggestSuccess] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [localAlias, setLocalAlias] = useState('');
  const [localBg, setLocalBg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPushEnabled(localStorage.getItem('nq_push_enabled') === 'true');
      const suffix = profile?.id ? `_${profile.id}` : '_guest';
      setLocalAlias(localStorage.getItem(`nq_alias${suffix}`) || '');
      setLocalBg(localStorage.getItem(`nq_bg${suffix}`) || '');

      if (profile?.id) {
        setSpotifyUrl(localStorage.getItem(`nq_spotify_url_${profile.id}`) || '');
        try {
          setSavedSongs(JSON.parse(localStorage.getItem(`nq_fav_songs_${profile.id}`) || '[]'));
        } catch {
          setSavedSongs([]);
        }
      }
    }
    getAttendees().then((all) => {
      const uid = profile?.id;
      setTickets(uid ? all.filter((a) => a.user_id === uid) : all.slice(0, 0));
    });
    getUserActivity(profile?.id ?? null).then(setActivity);
  }, [profile?.id]);

  const saveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const suffix = profile?.id ? `_${profile.id}` : '_guest';
    localStorage.setItem(`nq_alias${suffix}`, localAlias);
    localStorage.setItem(`nq_bg${suffix}`, localBg);
    setEditing(false);
  };

  const handleSaveSpotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    localStorage.setItem(`nq_spotify_url_${profile.id}`, spotifyUrl);
  };

  const handleAddFavSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !newTitle || !newArtist) return;
    const newSong = { id: `fav-${Date.now()}`, title: newTitle, artist: newArtist, url: newUrl };
    const updated = [...savedSongs, newSong];
    setSavedSongs(updated);
    localStorage.setItem(`nq_fav_songs_${profile.id}`, JSON.stringify(updated));
    setNewTitle('');
    setNewArtist('');
    setNewUrl('');
  };

  const handleDeleteFavSong = (id: string) => {
    if (!profile?.id) return;
    const updated = savedSongs.filter(s => s.id !== id);
    setSavedSongs(updated);
    localStorage.setItem(`nq_fav_songs_${profile.id}`, JSON.stringify(updated));
  };

  const handleSuggestSong = async (s: { title: string; artist: string; url: string }) => {
    try {
      await addSong(
        { title: s.title, artist: s.artist, youtube_url: s.url },
        profile?.id ?? null,
        profile?.username ?? 'Tú'
      );
      setSuggestSuccess(s.title);
      setTimeout(() => setSuggestSuccess(null), 3000);
    } catch {
      alert('Error al sugerir la canción. Inténtalo de nuevo.');
    }
  };

  const spotifyPlaylistId = spotifyUrl ? (spotifyUrl.match(/playlist[/:]([a-zA-Z0-9]{22})/) || [])[1] : null;

  const handlePush = () => {
    if (pushEnabled) return;
    setLoadingPush(true);
    setTimeout(() => {
      setPushEnabled(true);
      setLoadingPush(false);
      localStorage.setItem('nq_push_enabled', 'true');
      addPoints(15);
    }, 1200);
  };

  const points = profile?.points ?? 0;
  const rank = rankFor(points);
  
  const displayName = localAlias || profile?.username || 'Invitado';

  if (!loading && !profile) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto relative overflow-hidden">
        {localBg && (
          <img src={localBg} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none mix-blend-screen" alt="bg" />
        )}
        <div className="relative z-10">
          <User className="h-10 w-10 text-neon-pink mx-auto mb-3" />
          <h1 className="section-title">Inicia sesión para ver tu perfil</h1>
          <p className="text-sm text-muted mt-2 mb-6">
            Usa el botón <span className="text-neon-pink font-bold">Entrar</span> de la barra superior
            para registrarte o iniciar sesión. Tu perfil guarda tus puntos, racha, publicaciones e
            insignias de asistencia.
          </p>
          <div className="card bg-black/40 p-4 text-left border-dashed">
            <p className="font-bold text-white mb-2 text-sm">Personalización local (Modo Invitado)</p>
            <form onSubmit={saveProfileSettings} className="space-y-3">
              <div><label className="label">Alias / @nombre</label><input className="input py-1.5 text-xs" value={localAlias} onChange={(e) => setLocalAlias(e.target.value)} placeholder="@invitado_genial" /></div>
              <div><label className="label">URL de Fondo (Imagen/GIF)</label><input className="input py-1.5 text-xs" value={localBg} onChange={(e) => setLocalBg(e.target.value)} placeholder="https://..." /></div>
              <button type="submit" className="btn btn-primary py-1.5 text-xs w-full">Guardar personalización</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {localBg && (
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <img src={localBg} className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen" alt="Profile background" />
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-8 items-start relative z-10">
        {/* Resumen */}
        <div className="space-y-6">
          <div className="card p-6 space-y-6 relative overflow-hidden">
            {localBg && (
              <img src={localBg} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none blur-sm" alt="card bg" />
            )}
            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <div className="h-20 w-20 rounded-full bg-neon-pink/15 border border-neon-pink/30 flex items-center justify-center overflow-hidden">
                <User className="h-9 w-9 text-neon-pink" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {displayName}
                </h2>
                <span className={`badge ${rank.cls} mt-2`}>{rank.title}</span>
              </div>
              <button onClick={() => setEditing(!editing)} className="text-xs text-neon-cyan hover:underline mt-1">
                {editing ? 'Cancelar edición' : 'Personalizar perfil'}
              </button>
            </div>

            {editing && (
              <form onSubmit={saveProfileSettings} className="relative z-10 card bg-black/50 p-4 space-y-3 border-dashed border-neon-cyan/50 animate-fade-in">
                <div>
                  <label className="label text-[10px]">Alias / @nombre (Local)</label>
                  <input className="input py-1.5 text-xs" value={localAlias} onChange={(e) => setLocalAlias(e.target.value)} placeholder={`Ej. @${profile?.username || 'user'}`} />
                </div>
                <div>
                  <label className="label text-[10px]">Fondo del Perfil (URL Imagen/GIF)</label>
                  <input className="input py-1.5 text-xs" value={localBg} onChange={(e) => setLocalBg(e.target.value)} placeholder="https://..." />
                </div>
                <button type="submit" className="btn btn-cyan py-1.5 text-xs w-full">Guardar cambios</button>
              </form>
            )}

            <div className="relative z-10 grid grid-cols-2 gap-3 border-t border-border pt-5">
              <div className="card bg-surface-2 p-4 text-center">
                <Coins className="h-5 w-5 text-neon-cyan mx-auto mb-1" />
                <span className="text-2xl font-extrabold text-white block">{points}</span>
                <span className="text-[10px] text-muted-2 font-bold uppercase tracking-wider">Puntos</span>
              </div>
              <div className="card bg-surface-2 p-4 text-center">
                <Flame className="h-5 w-5 text-neon-pink mx-auto mb-1" />
                <span className="text-2xl font-extrabold text-white block">{profile?.streak_count ?? 0}</span>
                <span className="text-[10px] text-muted-2 font-bold uppercase tracking-wider">Racha</span>
              </div>
            </div>
          </div>

        {/* Notificaciones */}
        <div className="card accent-pink p-6 space-y-4">
          <h3 className="section-title text-base flex items-center gap-2"><Bell className="h-5 w-5 text-neon-pink" /> Notificaciones</h3>
          <p className="text-xs text-muted">Recibe alertas de eventos, estados de tus canciones y cupones.</p>

          {!pushEnabled ? (
            <button onClick={handlePush} disabled={loadingPush} className="btn btn-primary w-full text-xs">
              <Smartphone className="h-4 w-4" /> {loadingPush ? 'Habilitando…' : 'Activar Web Push (+15)'}
            </button>
          ) : (
            <div className="badge badge-green w-full justify-start py-2.5 px-3 normal-case tracking-normal text-sm">
              <CheckCircle2 className="h-4 w-4" /> Web Push activo
            </div>
          )}

          <div className="space-y-3 pt-1 text-xs text-muted">
            <label className="flex items-center justify-between"><span>Alertas de eventos (24h antes)</span>
              <input type="checkbox" checked={notifyEvent} onChange={(e) => setNotifyEvent(e.target.checked)} className="accent-[var(--pink)]" /></label>
            <label className="flex items-center justify-between"><span>Votos en mis canciones</span>
              <input type="checkbox" checked={notifySongs} onChange={(e) => setNotifySongs(e.target.checked)} className="accent-[var(--pink)]" /></label>
          </div>
        </div>
      </div>

      {/* Entradas */}
      {/* Entradas y Playlist Tab Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Selector de Pestañas */}
        <div className="flex border-b border-white/10 mb-6 gap-2">
          <button 
            onClick={() => setSubTab('tickets')} 
            className={`px-4 py-2 font-bold text-sm border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              subTab === 'tickets' 
                ? 'border-neon-cyan text-neon-cyan' 
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <Ticket className="h-4 w-4" /> Entradas y Actividad
          </button>
          <button 
            onClick={() => setSubTab('music')} 
            className={`px-4 py-2 font-bold text-sm border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              subTab === 'music' 
                ? 'border-neon-magenta text-neon-magenta font-extrabold' 
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <Music className="h-4 w-4" /> Mi Playlist y Música
          </button>
        </div>

        {subTab === 'tickets' ? (
          <div className="space-y-6 animate-fade-in">
            {/* Entradas */}
            <div className="card accent-cyan p-6 sm:p-8 space-y-6">
              <h2 className="section-title text-lg flex items-center gap-2"><Ticket className="h-6 w-6 text-neon-cyan" /> Mis entradas</h2>

              {tickets.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <AlertCircle className="h-8 w-8 text-muted-2 mx-auto mb-2" />
                  <p className="text-sm text-muted font-bold">No tienes reservas activas</p>
                  <p className="text-xs text-muted-2 mt-1">Ve a la página de inicio para reservar tu entrada.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((t) => (
                    <div key={t.id} className="card flex flex-col sm:flex-row overflow-hidden">
                      <div className="p-5 flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="eyebrow">Pase de acceso</span>
                          <span className={`badge ${t.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>{t.status === 'confirmed' ? 'Confirmado' : 'Interesado'}</span>
                        </div>
                        <p className="text-lg font-extrabold text-white">Nightcore AQP</p>
                        <p className="text-xs text-muted">Titular: {t.name}</p>
                        <p className="text-xs text-muted">{t.email}</p>
                      </div>
                      <div className="border-t sm:border-t-0 sm:border-l border-dashed border-border p-5 flex flex-col items-center justify-center bg-surface-2 sm:min-w-[150px]">
                        <QrCode className="h-14 w-14 text-white mb-2" />
                        <span className="text-xs font-mono font-bold text-neon-cyan tracking-widest">{t.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Insignias de asistencia */}
            <div className="card p-6 sm:p-8 space-y-4">
              <h2 className="section-title text-lg flex items-center gap-2"><Medal className="h-5 w-5 text-yellow-400" /> Insignias de asistencia</h2>
              {activity.attended.length === 0 ? (
                <p className="text-sm text-muted-2">Aún sin insignias. Asiste a un evento para ganar la tuya.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activity.attended.map((a) => (
                    <span key={a.id} className={`badge ${a.status === 'confirmed' ? 'badge-yellow' : 'badge-cyan'}`}>
                      <Medal className="h-3.5 w-3.5" /> Asistió · {a.code ?? 'Evento'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mi actividad */}
            <div className="card p-6 sm:p-8 space-y-5">
              <h2 className="section-title text-lg">Mi actividad</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Camera, label: 'Publicaciones', value: activity.costumes.length, color: 'text-neon-cyan' },
                  { icon: MessageSquare, label: 'Comentarios', value: activity.comments.length, color: 'text-neon-pink' },
                  { icon: Heart, label: 'Likes dados', value: activity.likesGiven, color: 'text-neon-purple' },
                ].map((s) => (
                  <div key={s.label} className="card bg-surface-2 p-4 text-center">
                    <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                    <span className="text-xl font-extrabold text-white block">{s.value}</span>
                    <span className="text-[10px] text-muted-2 font-bold uppercase tracking-wider">{s.label}</span>
                  </div>
                ))}
              </div>

              {activity.costumes.length > 0 && (
                <div className="space-y-2">
                  <p className="eyebrow">Mis disfraces</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {activity.costumes.map((c) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={c.id} src={c.photo_url} alt={c.char_name} title={c.char_name} className="h-20 w-16 rounded-lg object-cover border border-border shrink-0" />
                    ))}
                  </div>
                </div>
              )}

              {activity.comments.length > 0 && (
                <div className="space-y-2">
                  <p className="eyebrow">Mis comentarios recientes</p>
                  <div className="space-y-2">
                    {activity.comments.slice(0, 4).map((c) => (
                      <p key={c.id} className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-2.5">&ldquo;{c.content}&rdquo;</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Music Tab Content */
          <div className="space-y-6 animate-fade-in">
            {/* Spotify Playlist Linker */}
            <div className="card accent-pink p-6 sm:p-8 space-y-4">
              <h2 className="section-title text-lg flex items-center gap-2 text-neon-pink">
                <Sparkles className="h-5 w-5" /> Playlist de Spotify
              </h2>
              <p className="text-xs text-muted">
                Vincula tu playlist favorita de Spotify para tenerla integrada directamente en tu perfil.
              </p>
              
              <form onSubmit={handleSaveSpotify} className="flex gap-2">
                <input 
                  type="text" 
                  className="input text-xs" 
                  value={spotifyUrl} 
                  onChange={(e) => setSpotifyUrl(e.target.value)} 
                  placeholder="Ej. https://open.spotify.com/playlist/37i9dQZF1DX10zKzsJ2jva..." 
                />
                <button type="submit" className="btn btn-primary text-xs shrink-0 py-2">
                  Vincular Playlist
                </button>
              </form>

              {spotifyPlaylistId ? (
                <div className="pt-2">
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="380"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl border border-border bg-black/40"
                  ></iframe>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-xl">
                  <Music className="h-8 w-8 text-muted-2 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-muted font-bold">Sin playlist vinculada</p>
                  <p className="text-xs text-muted-2 mt-1">Inserta un enlace de compartir de Spotify arriba para reproducirla desde aquí.</p>
                </div>
              )}
            </div>

            {/* Biblioteca de Sugerencias Rápidas */}
            <div className="card accent-cyan p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="section-title text-lg flex items-center gap-2 text-neon-cyan">
                  <Music className="h-5 w-5" /> Mis canciones guardadas
                </h2>
                <p className="text-xs text-muted mt-1">
                  Guarda aquí tus canciones preferidas para enviarlas sugeridas al DJ en un instante.
                </p>
              </div>

              {suggestSuccess && (
                <div className="badge badge-green py-2 px-3 justify-start gap-2 text-xs w-full animate-pulse">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>¡Sugerencia enviada para &ldquo;{suggestSuccess}&rdquo;!</span>
                </div>
              )}

              {/* Formulario para Añadir Canción */}
              <form onSubmit={handleAddFavSong} className="card bg-black/40 p-4 border-dashed border-neon-cyan/35 space-y-3">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Añadir nueva canción favorita</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-[10px] uppercase font-bold text-muted">Título *</label>
                    <input 
                      type="text" 
                      required 
                      className="input py-1.5 text-xs" 
                      value={newTitle} 
                      onChange={(e) => setNewTitle(e.target.value)} 
                      placeholder="Ej. Butterfly" 
                    />
                  </div>
                  <div>
                    <label className="label text-[10px] uppercase font-bold text-muted">Artista *</label>
                    <input 
                      type="text" 
                      required 
                      className="input py-1.5 text-xs" 
                      value={newArtist} 
                      onChange={(e) => setNewArtist(e.target.value)} 
                      placeholder="Ej. Smile.dk" 
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-[10px] uppercase font-bold text-muted">Enlace YouTube o Spotify (Opcional)</label>
                  <input 
                    type="url" 
                    className="input py-1.5 text-xs" 
                    value={newUrl} 
                    onChange={(e) => setNewUrl(e.target.value)} 
                    placeholder="https://youtube.com/watch?v=... o https://open.spotify.com/track/..." 
                  />
                </div>
                <button type="submit" className="btn btn-primary text-xs w-full py-2 flex items-center justify-center gap-1.5">
                  <Plus className="h-4 w-4" /> Guardar canción
                </button>
              </form>

              {/* Lista de Canciones */}
              {savedSongs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white/[0.01]">
                  <Music className="h-8 w-8 text-muted-2 mx-auto mb-2" />
                  <p className="text-sm text-muted font-bold">Tu biblioteca favorita está vacía</p>
                  <p className="text-xs text-muted-2 mt-1">Completa el formulario de arriba para añadir tus primeras canciones.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {savedSongs.map((s) => (
                    <div key={s.id} className="card bg-white/[0.02] border border-border p-4 flex items-center justify-between gap-4 hover:border-neon-cyan/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-white truncate text-sm sm:text-base">{s.title}</p>
                        <p className="text-xs text-muted truncate">{s.artist}</p>
                        {s.url && (
                          <a 
                            href={s.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline mt-1.5"
                          >
                            <ExternalLink className="h-3 w-3" /> Ver enlace original
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleSuggestSong(s)} 
                          className="btn btn-primary text-[10px] py-1.5 px-3 uppercase tracking-wider font-extrabold flex items-center gap-1"
                          title="Sugerir inmediatamente al DJ"
                        >
                          <Sparkles className="h-3 w-3" /> Sugerir al DJ
                        </button>
                        <button 
                          onClick={() => handleDeleteFavSong(s.id)} 
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
                          title="Eliminar de favoritos"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
