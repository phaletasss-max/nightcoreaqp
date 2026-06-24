'use client';

// ── Página principal: Eventos — Edición Scenecore ────────────────────────────
// Feed de eventos con selector, detalle, RSVP, muro de comentarios,
// retos de la comunidad, feed de novedades y temáticas sugeridas.

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, MapPin, Clock, Ticket, Users, Check, ArrowRight,
  MessageSquare, Send, AlertTriangle, Music4, Download, Zap,
  Headphones, Star, Link2, Trash2,
} from 'lucide-react';
import Hero from '@/components/Hero';
import DailyChallenges from '@/components/DailyChallenges';
import ThemesSection from '@/components/ThemesSection';
import CommunityFeed from '@/components/CommunityFeed';
import VideoBackground from '@/components/VideoBackground';
import ScenecoreBackground from '@/components/ScenecoreBackground';
import AttendanceProofModal from '@/components/AttendanceProofModal';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  getEvents, getComments, addComment, deleteComment, createRsvp, getAttendees, getSiteSettings, getBannedWords
} from '@/lib/data';
import type { EventItem, EventComment, Attendee } from '@/lib/types';
import { hasBannedWord, censorText } from '@/lib/moderation';
import SectionBg from '@/components/SectionBg';

export default function Home() {
  const { profile, addPoints, isStaff } = useAuth();
  const detailRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [comments, setComments] = useState<EventComment[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  const [commentText, setCommentText] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rsvpType, setRsvpType] = useState<'confirmed' | 'interested'>('confirmed');
  const [status, setStatus] = useState<'idle' | 'booking' | 'booked'>('idle');
  const [ticketCode, setTicketCode] = useState('');
  const [bgs, setBgs] = useState<Record<string, string>>({});
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [commentNotice, setCommentNotice] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);

  // Carga inicial
  useEffect(() => {
    getEvents().then((evs) => {
      setEvents(evs);
      const confirmed = evs.find((e) => e.status === 'confirmed');
      setSelectedId(confirmed?.id ?? evs[0]?.id ?? '');
    });
    getSiteSettings().then(setBgs);
    getBannedWords().then(setBannedWords);
  }, []);

  const updateBg = (key: string, url: string) => setBgs((prev) => ({ ...prev, [key]: url }));
  // Una sección está visible salvo que el admin la haya apagado (section_<k>_off = 'true').
  const sectionOn = (k: string) => bgs[`section_${k}_off`] !== 'true';

  // Datos dependientes del evento seleccionado
  useEffect(() => {
    if (!selectedId) return;
    getComments(selectedId).then(setComments);
    getAttendees(selectedId).then(setAttendees);
  }, [selectedId]);

  const selected = events.find((e) => e.id === selectedId);
  const nextEvent = events.find((e) => e.status === 'confirmed') ?? events[0];

  const goToDetail = () => detailRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !name || !email) return;
    setStatus('booking');
    const row = await createRsvp({
      event_id: selected.id,
      user_id: profile?.id ?? null,
      name, email, status: rsvpType,
    });
    addPoints(rsvpType === 'confirmed' ? 15 : 5);
    setTicketCode(row.code ?? '');
    setStatus('booked');
    getAttendees(selected.id).then(setAttendees);
    
    if (rsvpType === 'confirmed') {
      setShowProofModal(true);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !commentText.trim()) return;
    const content = commentText.trim();
    const flagged = hasBannedWord(content, bannedWords);
    const row = await addComment(selected.id, profile?.id ?? null, profile?.username ?? 'Invitado', content, flagged);
    setComments((prev) => [row, ...prev]);
    setCommentText('');
    setCommentNotice(flagged ? 'Tu comentario usa palabras sensibles: quedará en revisión y se mostrará censurado hasta que un moderador lo apruebe. Evita ese tipo de lenguaje. 🙏' : null);
    if (!flagged) addPoints(2);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-10 relative">
      <section className="relative group overflow-hidden rounded-3xl">
        <SectionBg sectionKey="hero" bgs={bgs} onChange={updateBg} isStaff={isStaff} defaultOpacity={0.3} />
        <div className="relative z-10">
          <Hero nextEvent={nextEvent} onCta={goToDetail} />
        </div>
      </section>

      {/* DJs del evento — mostrado solo para Nightcore Fest 2.0 */}
      {selected && selected.title.includes('Cyberpunk') && (
        <section className="card p-6 sm:p-8 space-y-4 accent-magenta checkerboard-subtle">
          <h3 className="section-title flex items-center gap-2 text-xl">
            <Headphones className="h-5 w-5 text-neon-magenta glow-magenta" /> DJs del Evento
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(nextEvent?.djs?.length ? nextEvent.djs : [
              { name: 'DJ LOBITO', tel: '946 388 627', color: 'neon-magenta', bg_url: '' },
              { name: 'DJ MATT', tel: '944 506 957', color: 'neon-lime', bg_url: '' },
              { name: 'DJ MELY', tel: '951 710 227', color: 'neon-cyan', bg_url: '' },
            ]).map((dj) => (
              <div 
                key={dj.name} 
                className="card bg-surface-2 p-5 text-center space-y-2 border-neon-lime/30 relative overflow-hidden transition-all hover:border-neon-lime hover:shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                style={dj.bg_url ? { backgroundImage: `url(${dj.bg_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                {dj.bg_url && <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />}
                <div className="relative z-10">
                  <div className={`h-14 w-14 rounded-full bg-${dj.color || 'neon-lime'}/15 border border-${dj.color || 'neon-lime'}/50 flex items-center justify-center mx-auto shadow-[0_0_10px_currentColor] text-${dj.color || 'neon-lime'}`}>
                    <Headphones className="h-7 w-7" />
                  </div>
                  <h4 className="font-extrabold text-white text-lg mt-3">{dj.name}</h4>
                  {dj.tel && <p className="text-sm text-neon-lime font-mono font-bold tracking-widest">📞 {dj.tel}</p>}
                  <p className="text-[10px] text-neon-lime/80 uppercase tracking-widest font-bold mt-1">Pedidos Abiertos</p>
                </div>
              </div>
            ))}
          </div>
          <div className="card bg-surface-2 p-4 border-neon-lime/20 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-neon-lime glow-lime" />
              <span className="font-bold text-neon-lime">Extras del evento</span>
            </div>
            <ul className="text-xs text-muted space-y-1 list-inside">
              <li>🥃 <strong>Shots gratis</strong> a los primeros en llegar</li>
              <li>🍸 <strong>Cóctel gratis</strong> si vienes con cosplay</li>
              <li>🍾 <strong>1 sellada</strong> al grupo más grande</li>
              <li>🎵 <strong>10 horas</strong> de música Nightcore</li>
              <li>🎤 <strong>Pedidos musicales</strong> a los DJs por WhatsApp</li>
            </ul>
          </div>
        </section>
      )}

      {/* Selector de eventos */}
      {events.length > 0 && (
        <div className="space-y-3">
          <p className="eyebrow">Seleccionar evento</p>
          <div className="flex flex-wrap gap-2">
            {events.map((evt) => {
              const active = evt.id === selectedId;
              return (
                <button
                  key={evt.id}
                  onClick={() => { setSelectedId(evt.id); setStatus('idle'); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors rainbow-border ${
                    active ? 'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta' : 'border-border text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{evt.title}</span>
                  <span className={`badge ${evt.status === 'confirmed' ? 'badge-lime' : evt.status === 'paused' ? 'badge-red' : 'badge-yellow'}`}>
                    {evt.status === 'confirmed' ? 'Confirmado' : evt.status === 'paused' ? 'Pausado' : 'Planeación'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalle del evento */}
      {selected && (
        <section ref={detailRef} className="card p-6 sm:p-8 space-y-6 relative group overflow-hidden">
          <SectionBg sectionKey="event_detail" bgs={bgs} onChange={updateBg} isStaff={isStaff} defaultOpacity={0.2} />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{selected.title}</h2>
              {selected.tagline && <p className="text-neon-cyan font-medium">{selected.tagline}</p>}
              {selected.description && <p className="text-muted leading-relaxed">{selected.description}</p>}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 text-sm text-muted">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-neon-magenta glow-magenta" /> {fmtDate(selected.date)}</span>
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-neon-magenta glow-magenta" /> {selected.status === 'planning' ? 'Hora por confirmar' : '5:00 PM — hasta que aguantes 🔥'}</span>
              </div>
              <span className="flex items-center gap-2 text-sm text-muted">
                <MapPin className="h-4 w-4 text-neon-cyan glow-cyan" /> {selected.location || 'Ubicación por confirmar (Arequipa)'}
              </span>

              {/* Maps & TikToks */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selected.google_maps_url && (
                  <a href={selected.google_maps_url} target="_blank" rel="noreferrer" className="btn btn-ghost px-3 py-1.5 text-xs border border-border">
                    <MapPin className="h-3.5 w-3.5 text-neon-cyan" /> Ver en Mapa
                  </a>
                )}
                {selected.tiktok_urls && (() => {
                  try {
                    const links: {title: string, url: string}[] = JSON.parse(selected.tiktok_urls);
                    return links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noreferrer" className="btn btn-ghost px-3 py-1.5 text-xs border border-border">
                        <Link2 className="h-3.5 w-3.5 text-neon-magenta" /> {l.title || 'Info URL'}
                      </a>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>

            {/* Capacidad */}
            <div className="card bg-surface-2 p-5 w-full lg:w-72 shrink-0 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted font-semibold">{selected.status === 'planning' ? 'Registrados' : 'Capacidad'}</span>
                <span className="text-neon-cyan font-bold">
                  {selected.status === 'planning' ? attendees.length : `${attendees.length}/${selected.total_tickets || '∞'}`}
                </span>
              </div>
              <div className="track">
                <span style={{ width: `${selected.status === 'planning'
                  ? Math.min((attendees.length / Math.max(selected.total_tickets, 1)) * 100, 100)
                  : Math.min((attendees.length / Math.max(selected.total_tickets, 1)) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-2">
                {selected.status === 'paused' ? 'Venta pausada temporalmente.' : selected.status === 'planning' ? 'Pre-registro de interés abierto.' : '¡Asegura tu lugar!'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* RSVP + asistentes */}
      {selected && sectionOn('rsvp') && (
        <section className="grid md:grid-cols-2 gap-6 items-start relative group rounded-3xl overflow-hidden p-4">
          <SectionBg sectionKey="rsvp" bgs={bgs} onChange={updateBg} isStaff={isStaff} defaultOpacity={0.2} />
          
          {/* Form RSVP */}
          <div className="card p-6 space-y-5 accent-magenta relative z-10">
            <h3 className="section-title flex items-center gap-2 text-xl">
              <Ticket className="h-5 w-5 text-neon-magenta glow-magenta" />
              {selected.status === 'planning' ? 'Registro de interés' : 'Reservar entrada'}
            </h3>

            {selected.status === 'paused' ? (
              <div className="badge badge-red w-full justify-start py-3 px-4 normal-case tracking-normal text-sm">
                <AlertTriangle className="h-5 w-5" /> Registros suspendidos temporalmente.
              </div>
            ) : status === 'booked' ? (
              <div className="card accent-lime p-5 text-center space-y-3">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-neon-lime/15 text-neon-lime">
                  <Check className="h-6 w-6" />
                </div>
                <p className="font-bold text-white">¡Reserva registrada!</p>
                <p className="text-sm text-muted">Ganaste {rsvpType === 'confirmed' ? 15 : 5} puntos.</p>
                <div className="text-left bg-black/30 rounded-lg p-3 font-mono text-sm border border-border">
                  <p><span className="text-muted-2">CÓDIGO:</span> <span className="text-neon-lime font-bold">{ticketCode}</span></p>
                  <p><span className="text-muted-2">TITULAR:</span> {name}</p>
                </div>
                <button onClick={() => setStatus('idle')} className="text-xs text-neon-cyan font-bold hover:underline">Registrar a otra persona</button>
                {rsvpType === 'confirmed' && (
                  <button onClick={() => setShowProofModal(true)} className="btn btn-primary w-full mt-3 text-xs shadow-[0_0_10px_rgba(255,0,255,0.3)]">
                    📸 Manda foto para insignia
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleRsvp} className="space-y-4">
                <div>
                  <label className="label">Nombre completo</label>
                  <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Yuki Arakaki" />
                </div>
                <div>
                  <label className="label">Correo</label>
                  <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['confirmed', 'interested'] as const).map((rt) => (
                    <button key={rt} type="button" onClick={() => setRsvpType(rt)}
                      className={`px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors ${
                        rsvpType === rt ? 'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta' : 'border-border text-muted hover:text-white'
                      }`}>
                      {rt === 'confirmed' ? (selected.status === 'planning' ? 'Asistencia segura' : '🔥 Voy a ir') : 'Solo interesado'}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={status === 'booking'} className="btn btn-primary w-full">
                  {status === 'booking' ? 'Procesando…' : <>Confirmar <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            )}
          </div>

          {/* Asistentes */}
          <div className="card p-6 space-y-4 h-full relative z-10 accent-cyan">
            <div className="flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-neon-cyan glow-cyan" /> Asistentes
              </h3>
              <span className="badge badge-cyan">{attendees.length} registrados</span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {attendees.length === 0 ? (
                <p className="text-sm text-muted-2 text-center py-8">Aún no hay registros. ¡Sé el primero! ✦</p>
              ) : (
                attendees.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-border text-sm rainbow-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-neon-magenta/20 border border-border flex items-center justify-center text-xs font-bold text-white uppercase">
                        {a.name.substring(0, 2)}
                      </div>
                      <span className="font-semibold text-foreground">{a.name}</span>
                    </div>
                    <span className={`badge ${a.status === 'confirmed' ? 'badge-lime' : 'badge-yellow'}`}>
                      {a.status === 'confirmed' ? 'Confirmado' : 'Interesado'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Muro de comentarios */}
      {selected && sectionOn('wall') && (
        <section className="card p-6 sm:p-8 space-y-5 relative group overflow-hidden">
          <SectionBg sectionKey="wall" bgs={bgs} onChange={updateBg} isStaff={isStaff} defaultOpacity={0.2} />
          <div className="relative z-10 space-y-5">
            <h3 className="section-title flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5 text-neon-magenta glow-magenta" /> Muro de comentarios
            </h3>

          {!selected.comments_enabled ? (
            <div className="badge badge-red w-full justify-start py-3 px-4 normal-case tracking-normal text-sm">
              <AlertTriangle className="h-5 w-5" /> Comentarios desactivados para esta fecha.
            </div>
          ) : (
            <>
              <form onSubmit={handleComment} className="flex gap-3">
                <input className="input" value={commentText} onChange={(e) => { setCommentText(e.target.value); setCommentNotice(null); }} placeholder="Escribe un comentario… (+2 pts) ✦" />
                <button type="submit" className="btn btn-primary shrink-0"><Send className="h-4 w-4" /></button>
              </form>
              {commentNotice && (
                <div className="badge badge-yellow w-full justify-start py-2 px-3 normal-case tracking-normal text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> <span>{commentNotice}</span>
                </div>
              )}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-2 text-center py-8 border border-dashed border-border rounded-xl">Aún no hay comentarios. ¡Comenta algo! ✦</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-white/[0.03] border border-border space-y-1 rainbow-border">
                      <div className="flex items-center justify-between text-xs">
                        {c.user_id ? (
                          <Link href={`/perfil/${c.user_id}`} className="font-bold text-neon-magenta hover:underline">{c.username}</Link>
                        ) : (
                          <span className="font-bold text-neon-magenta">{c.username}</span>
                        )}
                        <span className="text-muted-2">{new Date(c.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-sm text-foreground">
                          {c.flagged ? censorText(c.content, bannedWords) : c.content}
                          {c.flagged && <span className="badge badge-yellow ml-2 align-middle">en revisión</span>}
                        </p>
                        {isStaff && (
                          <button onClick={async () => {
                            if (confirm('¿Eliminar comentario?')) {
                              await deleteComment(c.id);
                              setComments(comments.filter(x => x.id !== c.id));
                            }
                          }} className="text-red-400 hover:text-red-300 p-1 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          </div>
        </section>
      )}

      {/* Retos de la comunidad */}
      {sectionOn('challenges') && (
      <section className="space-y-5 relative group p-6 rounded-3xl overflow-hidden">
        <SectionBg sectionKey="challenges" bgs={bgs} onChange={updateBg} isStaff={isStaff} defaultOpacity={0.2} />
        <div className="relative z-10">
          <div>
            <h3 className="section-title text-xl flex items-center gap-2">
              <Star className="h-5 w-5 text-neon-yellow glow-lime" /> Retos de la comunidad
            </h3>
            <p className="text-sm text-muted mt-0.5">Mantén tu racha, vota la encuesta del día y escala en el ranking.</p>
          </div>
          <DailyChallenges bgImage={bgs['daily_bg']} />
          {isStaff && <div className="absolute top-2 left-2 z-50 text-xs bg-black/80 px-2 py-1 rounded text-white border border-white/10">Fondo de Racha → Usa el editor en su esquina superior derecha</div>}
        </div>
      </section>

      )}

      {/* Novedades de la comunidad (feed) */}
      {sectionOn('feed') && (
      <section className="relative group p-6 rounded-3xl overflow-hidden">
        <SectionBg sectionKey="feed" bgs={bgs} onChange={updateBg} isStaff={isStaff} defaultOpacity={0.2} />
        <div className="relative z-10">
          <CommunityFeed />
        </div>
      </section>

      )}

      {/* Temáticas sugeridas por la comunidad */}
      {sectionOn('themes') && (
      <section className="relative group p-6 rounded-3xl overflow-hidden">
        <SectionBg sectionKey="themes" bgs={bgs} onChange={updateBg} isStaff={isStaff} defaultOpacity={0.2} />
        <div className="relative z-10">
          <ThemesSection />
        </div>
      </section>

      )}

      {/* Descargas (sets propios del DJ) */}
      {sectionOn('sets') && (
      <section className="card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Music4 className="h-5 w-5 text-neon-magenta glow-magenta" />
          <div>
            <h3 className="section-title text-xl">Sets del DJ</h3>
            <p className="text-sm text-muted mt-0.5">Grabaciones oficiales de los sets en vivo, libres de copyright.</p>
          </div>
        </div>
        <div className="text-sm text-muted-2 text-center py-10 border border-dashed border-border rounded-xl flex flex-col items-center gap-2">
          <Download className="h-6 w-6" />
          Aún no hay grabaciones publicadas. Aparecerán aquí después del próximo evento. ✦
        </div>
      </section>
      )}

      {showProofModal && selected && (
        <AttendanceProofModal 
          eventId={selected.id} 
          userId={profile?.id ?? null} 
          onClose={() => setShowProofModal(false)} 
        />
      )}
    </div>
  );
}
