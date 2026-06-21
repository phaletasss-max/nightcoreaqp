'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Users, Music, TrendingUp, BarChart3, Trash2, Check,
  Plus, Calendar, Eye, EyeOff, Sparkles, Radio, Download, Film, Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  getEvents, saveEvent, deleteEvent, getSongs, setSongPlayed, deleteSong,
  getAttendees, launchSurvey, setSongFileUrl, clearSongs,
  getProfiles, updateProfileRole, deleteProfile, getAllComments, deleteCostume,
  adminResetPassword, deleteComment, getCostumes
} from '@/lib/data';
import { downloadMedia, storeBackup, isMediaConfigured } from '@/lib/media';
import type { EventItem, Song, Attendee, EventStatus, Profile, Costume, EventComment } from '@/lib/types';

type Tab = 'kpi' | 'dj' | 'survey' | 'events' | 'users' | 'posts' | 'comments';

export default function AdminPage() {
  const { isStaff } = useAuth();
  const [tab, setTab] = useState<Tab>('kpi');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [rsvps, setRsvps] = useState<Attendee[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [downloadingSet, setDownloadingSet] = useState(false);
  const [storingId, setStoringId] = useState<string | null>(null);

  // form encuesta
  const [sQuestion, setSQuestion] = useState('');
  const [sOptions, setSOptions] = useState('');

  // form evento
  const [evTitle, setEvTitle] = useState('');
  const [evTagline, setEvTagline] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evDate, setEvDate] = useState('2026-08-25T18:00');
  const [evLocation, setEvLocation] = useState('');
  const [evPrice, setEvPrice] = useState('0');
  const [evCap, setEvCap] = useState(150);
  const [evStatus, setEvStatus] = useState<EventStatus>('planning');
  const [evComments, setEvComments] = useState(true);
  
  const [evFlyer, setEvFlyer] = useState('');
  const [evThemes, setEvThemes] = useState('');
  const [evDetails, setEvDetails] = useState('');
  const [evGoogleMaps, setEvGoogleMaps] = useState('');
  const [evTikToksList, setEvTikToksList] = useState<{title: string; url: string}[]>([]);
  const [evDJs, setEvDJs] = useState<{ name: string; tel: string; color: string; bg_url: string }[]>([]);

  const [strictAuth, setStrictAuth] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const PRESET_DJS = [
    { name: 'DJ Lobito', tel: '946 388 627', color: 'neon-magenta', bg_url: '/fondoscenecoe.mp4' },
    { name: 'DJ Matt', tel: '944 506 957', color: 'neon-lime', bg_url: '/fondoscenecoe.mp4' },
    { name: 'DJ Mely', tel: '951 710 227', color: 'neon-cyan', bg_url: '/mikualentadora.jpg' }
  ];

  useEffect(() => {
    getEvents().then(setEvents);
    getSongs().then(setSongs);
    getAttendees().then(setRsvps);
    getProfiles().then(setProfiles);
    getAllComments().then(setComments);
    getCostumes().then(setCostumes);
  }, []);

  if (!strictAuth) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-10 w-10 text-neon-pink mx-auto mb-3" />
        <h1 className="section-title text-xl">Acceso Admin</h1>
        <p className="text-sm text-muted">Ingresa tus credenciales maestras para continuar.</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          const ADMIN_EMAILS = ['manchuriam@nightcore.aqp.fest.com', 'manchuria@nightcoreaqp.com', 'admin@nightcore.aqp', 'phaletasss@gmail.com'];
          if (ADMIN_EMAILS.includes(loginEmail) && loginPass === 'Nakamura321.') {
            setStrictAuth(true);
            setLoginError('');
          } else {
            setLoginError('Credenciales incorrectas');
          }
        }} className="space-y-4 mt-4">
          <input type="email" required className="input w-full text-center" placeholder="Correo electrónico" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
          <input type="password" required className="input w-full text-center" placeholder="Contraseña" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
          {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
          <button type="submit" className="btn btn-primary w-full">Ingresar a Consola</button>
        </form>
      </div>
    );
  }

  const countRsvp = (eventId: string, type?: 'confirmed' | 'interested') =>
    rsvps.filter((r) => r.event_id === eventId && (!type || r.status === type)).length;
  const totalConfirmed = rsvps.filter((r) => r.status === 'confirmed').length;

  const toggleStatus = async (ev: EventItem) => {
    const order: EventStatus[] = ['planning', 'confirmed', 'paused'];
    const next = order[(order.indexOf(ev.status) + 1) % 3];
    const updated = { ...ev, status: next };
    setEvents((p) => p.map((e) => e.id === ev.id ? updated : e));
    await saveEvent(updated);
  };
  const toggleComments = async (ev: EventItem) => {
    const updated = { ...ev, comments_enabled: !ev.comments_enabled };
    setEvents((p) => p.map((e) => e.id === ev.id ? updated : e));
    await saveEvent(updated);
  };
  const removeEvent = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    setEvents((p) => p.filter((e) => e.id !== id));
    await deleteEvent(id);
  };
  const togglePlayed = async (s: Song) => {
    setSongs((p) => p.map((x) => x.id === s.id ? { ...x, played: !x.played } : x));
    await setSongPlayed(s.id, !s.played);
  };
  const removeSong = async (id: string) => {
    setSongs((p) => p.filter((x) => x.id !== id));
    await deleteSong(id);
  };
  const handleClearSongs = async () => {
    if (!confirm('¿ESTÁS SEGURO? Esto eliminará TODAS las canciones de la base de datos de Supabase. Esta acción no se puede deshacer.')) return;
    await clearSongs();
    setSongs([]);
    alert('Playlist vaciada con éxito.');
  };

  const handleDownloadSet = async () => {
    const queue = songs.filter((s) => !s.played);
    if (!queue.length) return;
    setDownloadingSet(true);
    // Descarga secuencial de la cola (cada una abre su archivo MP3).
    for (const s of queue) {
      try {
        await downloadMedia(s.youtube_url, 'mp3', `${s.artist} - ${s.title}`.replace(/[^a-z0-9]/gi, '_'));
      } catch { /* continúa con la siguiente */ }
    }
    setDownloadingSet(false);
  };

  // Descarga el MP4 de la canción (vía media-service → Supabase Storage) y lo marca
  // para usarse de fondo. Resuelve los videos de YouTube que no permiten embed.
  const handleStoreBackground = async (s: Song) => {
    setStoringId(s.id);
    try {
      const fileUrl = await storeBackup(s.youtube_url, 'mp4');
      if (fileUrl) {
        await setSongFileUrl(s.id, fileUrl);
        setSongs((prev) => prev.map((x) => x.id === s.id ? { ...x, file_url: fileUrl } : x));
      } else {
        alert('No se pudo descargar (¿media-service conectado?).');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar a fondo');
    } finally {
      setStoringId(null);
    }
  };

  const handleLaunchSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sQuestion) return;
    const opts = sOptions.split(',').map((o) => o.trim()).filter(Boolean);
    await launchSurvey(sQuestion, opts);
    setSQuestion(''); setSOptions('');
    alert('Encuesta publicada.');
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle) return;
    const ev: EventItem = {
      id: `e-${Date.now()}`,
      title: evTitle,
      tagline: evTagline || null,
      description: evDesc || null,
      date: `${evDate}:00-05:00`,
      location: evLocation || null,
      ticket_price: Number(evPrice) || 0,
      total_tickets: Number(evCap),
      available_tickets: Number(evCap),
      status: evStatus,
      comments_enabled: evComments,
      flyer_url: evFlyer || null,
      themes: evThemes || null,
      details: evDetails || null,
      google_maps_url: evGoogleMaps || null,
      tiktok_urls: evTikToksList.length > 0 ? JSON.stringify(evTikToksList) : null,
      djs: evDJs.length > 0 ? evDJs : undefined,
    };
    setEvents((p) => [...p, ev]);
    await saveEvent(ev);
    setEvTitle(''); setEvTagline(''); setEvDesc(''); setEvLocation(''); setEvPrice('0'); setEvCap(150); setEvStatus('planning'); setEvComments(true);
    setEvFlyer(''); setEvThemes(''); setEvDetails(''); setEvGoogleMaps(''); setEvTikToksList([]); setEvDJs([]);
  };

  const handleAddDJ = () => setEvDJs([...evDJs, { name: '', tel: '', color: 'neon-lime', bg_url: '' }]);
  const handleRemoveDJ = (idx: number) => setEvDJs(evDJs.filter((_, i) => i !== idx));
  const handleUpdateDJ = (idx: number, field: string, val: string) => {
    const newDjs = [...evDJs];
    newDjs[idx] = { ...newDjs[idx], [field]: val };
    setEvDJs(newDjs);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'kpi', label: 'Métricas' },
    { id: 'dj', label: 'Consola DJ' },
    { id: 'survey', label: 'Encuestas' },
    { id: 'events', label: 'Eventos' },
    { id: 'users', label: 'Usuarios' },
    { id: 'posts', label: 'Disfraces' },
    { id: 'comments', label: 'Comentarios' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="section-title flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-neon-pink" /> Panel admin / DJ</h1>
          <p className="text-sm text-muted mt-1">Métricas, consola de playlist, encuestas y eventos.</p>
        </div>
        <span className="badge badge-red"><Radio className="h-3.5 w-3.5 animate-soft-pulse" /> Live</span>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-neon-pink text-neon-pink' : 'border-transparent text-muted hover:text-white'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* KPIs */}
      {tab === 'kpi' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Users, color: 'text-neon-pink', label: 'Asistentes confirmados', value: totalConfirmed, sub: 'RSVP totales' },
              { icon: TrendingUp, color: 'text-neon-cyan', label: 'Eventos activos', value: events.length, sub: 'en agenda' },
              { icon: Music, color: 'text-neon-purple', label: 'Temas en playlist', value: songs.length, sub: 'sugeridos' },
            ].map((k) => (
              <div key={k.label} className="card p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-border"><k.icon className={`h-6 w-6 ${k.color}`} /></div>
                <div>
                  <span className="text-xs text-muted-2 uppercase font-bold block">{k.label}</span>
                  <span className="text-2xl font-extrabold text-white">{k.value}</span>
                  <span className="text-[10px] text-muted block">{k.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card accent-cyan p-6 space-y-4">
              <h3 className="section-title text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-neon-cyan" /> Preferencia de día</h3>
              {[{ l: 'Sábado noche', p: 65 }, { l: 'Viernes noche', p: 25 }, { l: 'Matinée domingo', p: 10 }].map((s) => (
                <div key={s.l} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold"><span className="text-muted">{s.l}</span><span className="text-neon-cyan">{s.p}%</span></div>
                  <div className="track"><span style={{ width: `${s.p}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="card p-6 space-y-3">
              <h3 className="section-title text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-neon-purple" /> Proyección AQP</h3>
              {[
                ['Evento pasado', '98 asistentes'],
                ['Próximo (proyección)', '135 asistentes'],
                ['Conversión interés→confirmado', '72.4%'],
                ['Género más sugerido', 'Eurobeat & Vocaloid'],
              ].map(([k, v], i, arr) => (
                <div key={k} className={`flex justify-between text-sm ${i < arr.length - 1 ? 'border-b border-border pb-2' : ''}`}>
                  <span className="text-muted">{k}</span><span className="font-bold text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DJ console */}
      {tab === 'dj' && (
        <div className="card accent-pink p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="section-title text-base flex items-center gap-2"><Music className="h-5 w-5 text-neon-pink" /> Control de playlist</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">En cola: {songs.length}</span>
              {isMediaConfigured() ? (
                <button onClick={handleDownloadSet} disabled={downloadingSet} className="btn btn-ghost px-3 py-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> {downloadingSet ? 'Descargando…' : 'Descargar set (MP3)'}
                </button>
              ) : (
                <span className="text-[10px] text-muted-2" title="Disponible al conectar el media-service">Descarga del set: media-service no conectado</span>
              )}
              <div className="w-px h-4 bg-border mx-1" />
              <button onClick={handleClearSongs} className="btn border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1.5 text-xs">
                <Trash2 className="h-3.5 w-3.5" /> Vaciar Playlist
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-2 text-xs uppercase">
                  <th className="py-2.5 px-3">Canción</th>
                  <th className="py-2.5 px-3 text-center">Votos</th>
                  <th className="py-2.5 px-3">Sugerido</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {songs.map((s) => (
                  <tr key={s.id} className={s.played ? 'opacity-50' : ''}>
                    <td className="py-3 px-3"><div className="font-bold text-white">{s.title}</div><div className="text-xs text-muted">{s.artist}</div></td>
                    <td className="py-3 px-3 text-center font-bold text-neon-cyan">{s.votes_count}</td>
                    <td className="py-3 px-3 text-muted">{s.suggested_by_name}</td>
                    <td className="py-3 px-3 text-center"><span className={`badge ${s.played ? 'badge-green' : 'badge-pink'}`}>{s.played ? 'Tocada' : 'En cola'}</span></td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-2">
                        {isMediaConfigured() && (
                          <button onClick={() => handleStoreBackground(s)} disabled={storingId === s.id}
                            title={s.file_url ? 'Ya está en el fondo · re-descargar' : 'Descargar MP4 y usar de fondo'}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${s.file_url ? 'border-neon-pink/40 text-neon-pink' : 'border-border text-muted hover:text-white'}`}>
                            {storingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                          </button>
                        )}
                        <button onClick={() => togglePlayed(s)} title="Marcar tocada"
                          className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${s.played ? 'border-green-500/30 text-green-400' : 'border-border text-muted hover:text-white'}`}>
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeSong(s.id)} title="Eliminar"
                          className="h-8 w-8 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Survey config */}
      {tab === 'survey' && (
        <form onSubmit={handleLaunchSurvey} className="card p-6 sm:p-8 space-y-4 max-w-2xl mx-auto animate-fade-in">
          <h3 className="section-title text-base flex items-center gap-2 border-b border-border pb-4"><Plus className="h-5 w-5 text-neon-cyan" /> Lanzar encuesta</h3>
          <div>
            <label className="label">Pregunta</label>
            <input className="input" required value={sQuestion} onChange={(e) => setSQuestion(e.target.value)} placeholder="Ej. ¿Qué temática para el próximo concurso?" />
          </div>
          <div>
            <label className="label">Opciones (separadas por comas)</label>
            <input className="input" required value={sOptions} onChange={(e) => setSOptions(e.target.value)} placeholder="Cyberpunk, Vocaloid, Jujutsu Kaisen, Evangelion" />
          </div>
          <button type="submit" className="btn btn-cyan w-full"><Sparkles className="h-4 w-4" /> Publicar y reemplazar activa</button>
        </form>
      )}

      {/* Events management */}
      {tab === 'events' && (
        <div className="grid lg:grid-cols-3 gap-8 items-start animate-fade-in">
          <form onSubmit={handleAddEvent} className="card p-6 space-y-4 text-sm">
            <h3 className="section-title text-base flex items-center gap-2 border-b border-border pb-3"><Plus className="h-5 w-5 text-neon-cyan" /> Agregar evento</h3>
            <div><label className="label">Título</label><input className="input" required value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="Ej. Nightcore Friki Fest" /></div>
            <div><label className="label">Tagline</label><input className="input" value={evTagline} onChange={(e) => setEvTagline(e.target.value)} placeholder="Ej. Miku & FNAF" /></div>
            <div><label className="label">Descripción</label><textarea className="input resize-none" rows={3} value={evDesc} onChange={(e) => setEvDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Flyer URL (Imagen, MP4, MP3)</label><input className="input" value={evFlyer} onChange={(e) => setEvFlyer(e.target.value)} placeholder="https://..." /></div>
              <div><label className="label">Temáticas</label><input className="input" value={evThemes} onChange={(e) => setEvThemes(e.target.value)} placeholder="Cyberpunk, Vocaloid" /></div>
            </div>
            <div><label className="label">Detalles del Flyer (Bullets)</label><textarea className="input resize-none" rows={2} value={evDetails} onChange={(e) => setEvDetails(e.target.value)} placeholder="Shots gratis, Cóctel gratis..." /></div>
            <div className="space-y-3">
              <div><label className="label">Google Maps Link</label><input className="input" value={evGoogleMaps} onChange={(e) => setEvGoogleMaps(e.target.value)} placeholder="https://maps.app.goo.gl/..." /></div>
              <div className="space-y-2 border-l-2 border-neon-cyan/30 pl-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Enlaces Informativos (TikTok, Posts...)</label>
                  <button type="button" onClick={() => setEvTikToksList([...evTikToksList, {title: '', url: ''}])} className="btn btn-ghost px-2 py-1 text-xs"><Plus className="h-3 w-3" /> Añadir URL</button>
                </div>
                {evTikToksList.map((tkk, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input className="input flex-1 text-xs" placeholder="Título (ej. Dresscode TikTok)" value={tkk.title} onChange={e => {
                      const n = [...evTikToksList]; n[idx].title = e.target.value; setEvTikToksList(n);
                    }} />
                    <input className="input flex-[2] text-xs" placeholder="https://..." value={tkk.url} onChange={e => {
                      const n = [...evTikToksList]; n[idx].url = e.target.value; setEvTikToksList(n);
                    }} />
                    <button type="button" onClick={() => setEvTikToksList(evTikToksList.filter((_, i) => i !== idx))} className="btn btn-ghost p-2"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Fecha</label><input className="input" type="datetime-local" required value={evDate} onChange={(e) => setEvDate(e.target.value)} /></div>
              <div><label className="label">Capacidad</label><input className="input" type="number" required value={evCap} onChange={(e) => setEvCap(Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Precio (S/.)</label><input className="input" required value={evPrice} onChange={(e) => setEvPrice(e.target.value)} /></div>
              <div><label className="label">Estado</label>
                <select className="input" value={evStatus} onChange={(e) => setEvStatus(e.target.value as EventStatus)}>
                  <option value="planning">Planeación</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="paused">Pausado</option>
                </select>
              </div>
            </div>
            <div><label className="label">Ubicación</label><input className="input" value={evLocation} onChange={(e) => setEvLocation(e.target.value)} placeholder="Ej. Casona San Francisco 308" /></div>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={evComments} onChange={(e) => setEvComments(e.target.checked)} className="accent-[var(--cyan)]" /> Habilitar comentarios
            </label>

            {/* Configuración de DJs */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <label className="label mb-0">DJs del Evento</label>
                <select className="input max-w-[150px] text-xs py-1" value="" onChange={(e) => {
                  if(!e.target.value) return;
                  if (e.target.value === 'custom') {
                    handleAddDJ();
                  } else {
                    const dj = PRESET_DJS.find(d => d.name === e.target.value);
                    if (dj && !evDJs.some(ex => ex.name === dj.name)) setEvDJs([...evDJs, dj]);
                  }
                }}>
                  <option value="">Añadir DJ...</option>
                  {PRESET_DJS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  <option value="custom">Otro DJ (Manual)</option>
                </select>
              </div>
              {evDJs.map((dj, idx) => (
                <div key={idx} className="p-3 bg-white/5 border border-border rounded-lg space-y-3 relative">
                  <button type="button" onClick={() => handleRemoveDJ(idx)} className="absolute top-2 right-2 p-1 text-muted hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  <div className="grid grid-cols-2 gap-2">
                    <div><input className="input text-xs" placeholder="Nombre (ej. DJ MELY)" value={dj.name} onChange={(e) => handleUpdateDJ(idx, 'name', e.target.value)} required /></div>
                    <div><input className="input text-xs" placeholder="Teléfono" value={dj.tel} onChange={(e) => handleUpdateDJ(idx, 'tel', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><input className="input text-xs" placeholder="Color neón (ej. neon-lime)" value={dj.color} onChange={(e) => handleUpdateDJ(idx, 'color', e.target.value)} /></div>
                    <div><input className="input text-xs" placeholder="Fondo URL (ej. https://...)" value={dj.bg_url} onChange={(e) => handleUpdateDJ(idx, 'bg_url', e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-cyan w-full mt-4"><Plus className="h-4 w-4" /> Registrar</button>
          </form>

          <div className="lg:col-span-2 space-y-6">
            <div className="card accent-cyan p-6 space-y-4">
              <h3 className="section-title text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-neon-cyan" /> Agenda de eventos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-2 uppercase">
                      <th className="py-2 px-2">Evento</th>
                      <th className="py-2 px-2 text-center">Estado</th>
                      <th className="py-2 px-2 text-center">Chat</th>
                      <th className="py-2 px-2 text-center">Inscritos</th>
                      <th className="py-2 px-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td className="py-3 px-2">
                          <div className="font-bold text-white">{ev.title}</div>
                          <div className="text-[10px] text-muted truncate max-w-[180px]">{ev.location}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => toggleStatus(ev)} className={`badge ${ev.status === 'confirmed' ? 'badge-green' : ev.status === 'paused' ? 'badge-red' : 'badge-yellow'}`}>
                            {ev.status === 'confirmed' ? 'Confirmado' : ev.status === 'paused' ? 'Pausado' : 'Planeación'}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => toggleComments(ev)} className={`p-1.5 rounded-lg border transition-colors ${ev.comments_enabled ? 'border-neon-cyan/30 text-neon-cyan' : 'border-red-500/30 text-red-400'}`}>
                            {ev.comments_enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-white">
                          {countRsvp(ev.id)}<span className="text-[9px] text-muted-2 block">({countRsvp(ev.id, 'confirmed')} conf.)</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${expandedEvent === ev.id ? 'bg-white text-black border-white' : 'border-border text-muted hover:text-white'}`}>
                              {expandedEvent === ev.id ? 'Ocultar' : 'Ver'}
                            </button>
                            <button onClick={() => removeEvent(ev.id)} className="p-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {expandedEvent && (
              <div className="card p-6 space-y-3 animate-fade-in">
                <h4 className="font-bold text-white text-sm">Asistentes — {events.find((e) => e.id === expandedEvent)?.title}</h4>
                {rsvps.filter((r) => r.event_id === expandedEvent).length === 0 ? (
                  <p className="text-xs text-muted-2 text-center py-4">Sin registros todavía.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b border-border text-muted-2 uppercase"><th className="py-1.5 px-2">Nombre</th><th className="py-1.5 px-2">Correo</th><th className="py-1.5 px-2">Código</th><th className="py-1.5 px-2 text-right">Estado</th></tr></thead>
                    <tbody className="divide-y divide-border text-muted">
                      {rsvps.filter((r) => r.event_id === expandedEvent).map((a) => (
                        <tr key={a.id}>
                          <td className="py-2 px-2 font-bold text-white">{a.name}</td>
                          <td className="py-2 px-2">{a.email}</td>
                          <td className="py-2 px-2 font-mono text-neon-cyan">{a.code ?? 'N/A'}</td>
                          <td className="py-2 px-2 text-right"><span className={`badge ${a.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>{a.status === 'confirmed' ? 'Conf.' : 'Int.'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: USUARIOS */}
      {tab === 'users' && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-neon-pink" /> Gestión de Usuarios
            </h2>
            <p className="text-xs text-muted mt-1">Modifica roles, restablece contraseñas o elimina perfiles.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-muted-2 uppercase font-bold text-xs">
                  <th className="py-3 px-2">Usuario</th>
                  <th className="py-3 px-2">Correo</th>
                  <th className="py-3 px-2 text-center">Puntos</th>
                  <th className="py-3 px-2 text-center">Racha</th>
                  <th className="py-3 px-2 text-center">Rol</th>
                  <th className="py-3 px-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center text-[10px] text-neon-pink uppercase font-extrabold">
                        {p.username ? p.username[0] : '?'}
                      </div>
                      {p.username || 'Invitado'}
                    </td>
                    <td className="py-3 px-2 font-mono text-xs">{p.email || 'N/A'}</td>
                    <td className="py-3 px-2 text-center text-neon-cyan font-bold">{p.points}</td>
                    <td className="py-3 px-2 text-center text-neon-lime font-bold">{p.streak_count}d</td>
                    <td className="py-3 px-2 text-center">
                      <select
                        value={p.role}
                        onChange={async (e) => {
                          const newRole = e.target.value as 'user' | 'dj' | 'admin';
                          await updateProfileRole(p.id, newRole);
                          setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, role: newRole } : x));
                        }}
                        className="bg-black border border-border rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="user">Usuario</option>
                        <option value="dj">DJ</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      {p.email && (
                        <button
                          onClick={async () => {
                            const ok = await adminResetPassword(p.email!);
                            if (ok) alert(`Correo de restauración enviado a ${p.email}`);
                            else alert('Error al enviar el correo');
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                        >
                          Reiniciar Clave
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!confirm(`¿Eliminar al usuario ${p.username}?`)) return;
                          await deleteProfile(p.id);
                          setProfiles(prev => prev.filter(x => x.id !== p.id));
                        }}
                        className="p-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: DISFRACES */}
      {tab === 'posts' && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neon-lime" /> Moderación de Disfraces
            </h2>
            <p className="text-xs text-muted mt-1">Elimina disfraces inapropiados sugeridos para el concurso.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costumes.map((c) => (
              <div key={c.id} className="border border-border rounded-xl overflow-hidden bg-white/5 flex flex-col justify-between">
                <div>
                  <div className="relative aspect-video w-full bg-cover bg-center" style={{ backgroundImage: `url(${c.photo_url})` }} />
                  <div className="p-4 space-y-2">
                    <span className="badge badge-yellow text-[9px] uppercase font-bold">{c.anime}</span>
                    <h3 className="font-bold text-white text-base">{c.char_name}</h3>
                    {c.description && <p className="text-xs text-muted line-clamp-2">{c.description}</p>}
                    <div className="text-[10px] text-muted-2">Votos: <strong className="text-white">{c.votes_count}</strong></div>
                  </div>
                </div>
                <div className="p-4 border-t border-border flex justify-end">
                  <button
                    onClick={async () => {
                      if (!confirm('¿Eliminar este disfraz de la competencia?')) return;
                      await deleteCostume(c.id);
                      setCostumes(prev => prev.filter(x => x.id !== c.id));
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
            {costumes.length === 0 && (
              <p className="text-xs text-muted text-center py-6 col-span-full">No hay disfraces postulados.</p>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: COMENTARIOS */}
      {tab === 'comments' && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-neon-pink" /> Moderación de Comentarios
            </h2>
            <p className="text-xs text-muted mt-1">Revisa y elimina comentarios inapropiados en los eventos.</p>
          </div>
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="border border-border rounded-lg p-4 bg-white/5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{c.username}</span>
                    <span className="text-[10px] text-muted">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted">{c.content}</p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('¿Eliminar este comentario?')) return;
                    await deleteComment(c.id);
                    setComments(prev => prev.filter(x => x.id !== c.id));
                  }}
                  className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-muted text-center py-6">No hay comentarios en la plataforma.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
