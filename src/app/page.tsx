'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, MapPin, Clock, Ticket, Users, Check, ArrowRight,
  MessageSquare, Send, AlertTriangle, Music4, Download,
} from 'lucide-react';
import Hero from '@/components/Hero';
import DailyChallenges from '@/components/DailyChallenges';
import ThemesSection from '@/components/ThemesSection';
import CommunityFeed from '@/components/CommunityFeed';
import VideoBackground from '@/components/VideoBackground';
import { useAuth } from '@/lib/auth';
import {
  getEvents, getComments, addComment, createRsvp, getAttendees,
} from '@/lib/data';
import type { EventItem, EventComment, Attendee } from '@/lib/types';

export default function Home() {
  const { profile, addPoints } = useAuth();
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

  // Carga inicial
  useEffect(() => {
    getEvents().then((evs) => {
      setEvents(evs);
      const confirmed = evs.find((e) => e.status === 'confirmed');
      setSelectedId(confirmed?.id ?? evs[0]?.id ?? '');
    });
  }, []);

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
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !commentText.trim()) return;
    const row = await addComment(selected.id, profile?.id ?? null, profile?.username ?? 'Invitado', commentText.trim());
    setComments((prev) => [row, ...prev]);
    setCommentText('');
    addPoints(2);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-10">
      <VideoBackground />
      <Hero nextEvent={nextEvent} onCta={goToDetail} />

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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                    active ? 'border-neon-pink/50 bg-neon-pink/10 text-neon-pink' : 'border-border text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{evt.title}</span>
                  <span className={`badge ${evt.status === 'confirmed' ? 'badge-green' : evt.status === 'paused' ? 'badge-red' : 'badge-yellow'}`}>
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
        <section ref={detailRef} className="card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{selected.title}</h2>
              {selected.tagline && <p className="text-neon-cyan font-medium">{selected.tagline}</p>}
              {selected.description && <p className="text-muted leading-relaxed">{selected.description}</p>}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 text-sm text-muted">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-neon-pink" /> {fmtDate(selected.date)}</span>
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-neon-pink" /> {selected.status === 'planning' ? 'Hora por confirmar' : '08:00 PM – 03:00 AM'}</span>
              </div>
              <span className="flex items-center gap-2 text-sm text-muted">
                <MapPin className="h-4 w-4 text-neon-cyan" /> {selected.location || 'Ubicación por confirmar (Arequipa)'}
              </span>
            </div>

            {/* Capacidad */}
            <div className="card bg-surface-2 p-5 w-full lg:w-72 shrink-0 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted font-semibold">{selected.status === 'planning' ? 'Registrados' : 'Entradas'}</span>
                <span className="text-neon-cyan font-bold">
                  {selected.status === 'planning' ? attendees.length : `${selected.available_tickets}/${selected.total_tickets}`}
                </span>
              </div>
              <div className="track">
                <span style={{ width: `${selected.status === 'planning'
                  ? Math.min((attendees.length / Math.max(selected.total_tickets, 1)) * 100, 100)
                  : (selected.available_tickets / Math.max(selected.total_tickets, 1)) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-2">
                {selected.status === 'paused' ? 'Venta pausada temporalmente.' : selected.status === 'planning' ? 'Pre-registro de interés abierto.' : 'Últimas entradas disponibles.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* RSVP + asistentes */}
      {selected && (
        <section className="grid md:grid-cols-2 gap-6 items-start">
          {/* Form RSVP */}
          <div className="card p-6 space-y-5">
            <h3 className="section-title flex items-center gap-2 text-xl">
              <Ticket className="h-5 w-5 text-neon-cyan" />
              {selected.status === 'planning' ? 'Registro de interés' : 'Reservar entrada'}
            </h3>

            {selected.status === 'paused' ? (
              <div className="badge badge-red w-full justify-start py-3 px-4 normal-case tracking-normal text-sm">
                <AlertTriangle className="h-5 w-5" /> Registros suspendidos temporalmente.
              </div>
            ) : status === 'booked' ? (
              <div className="card accent-cyan p-5 text-center space-y-3">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-neon-cyan/15 text-neon-cyan">
                  <Check className="h-6 w-6" />
                </div>
                <p className="font-bold text-white">¡Reserva registrada!</p>
                <p className="text-sm text-muted">Ganaste {rsvpType === 'confirmed' ? 15 : 5} puntos.</p>
                <div className="text-left bg-black/30 rounded-lg p-3 font-mono text-sm border border-border">
                  <p><span className="text-muted-2">CÓDIGO:</span> <span className="text-neon-cyan font-bold">{ticketCode}</span></p>
                  <p><span className="text-muted-2">TITULAR:</span> {name}</p>
                </div>
                <button onClick={() => setStatus('idle')} className="text-xs text-neon-cyan font-bold hover:underline">Registrar a otra persona</button>
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
                        rsvpType === rt ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan' : 'border-border text-muted hover:text-white'
                      }`}>
                      {rt === 'confirmed' ? (selected.status === 'planning' ? 'Asistencia segura' : 'Voy a ir') : 'Solo interesado'}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={status === 'booking'} className="btn btn-cyan w-full">
                  {status === 'booking' ? 'Procesando…' : <>Confirmar <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            )}
          </div>

          {/* Asistentes */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-neon-pink" /> Asistentes
              </h3>
              <span className="badge badge-pink">{attendees.length} registrados</span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {attendees.length === 0 ? (
                <p className="text-sm text-muted-2 text-center py-8">Aún no hay registros. ¡Sé el primero!</p>
              ) : (
                attendees.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-border text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-neon-purple/20 border border-border flex items-center justify-center text-xs font-bold text-white uppercase">
                        {a.name.substring(0, 2)}
                      </div>
                      <span className="font-semibold text-foreground">{a.name}</span>
                    </div>
                    <span className={`badge ${a.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>
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
      {selected && (
        <section className="card p-6 sm:p-8 space-y-5">
          <h3 className="section-title flex items-center gap-2 text-xl">
            <MessageSquare className="h-5 w-5 text-neon-cyan" /> Muro de comentarios
          </h3>

          {!selected.comments_enabled ? (
            <div className="badge badge-red w-full justify-start py-3 px-4 normal-case tracking-normal text-sm">
              <AlertTriangle className="h-5 w-5" /> Comentarios desactivados para esta fecha.
            </div>
          ) : (
            <>
              <form onSubmit={handleComment} className="flex gap-3">
                <input className="input" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Escribe un comentario… (+2 pts)" />
                <button type="submit" className="btn btn-cyan shrink-0"><Send className="h-4 w-4" /></button>
              </form>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-2 text-center py-8 border border-dashed border-border rounded-xl">Aún no hay comentarios.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-white/[0.03] border border-border space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-neon-pink">{c.username}</span>
                        <span className="text-muted-2">{new Date(c.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-foreground">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Retos de la comunidad (antes /encuestas, ahora en el feed de Eventos) */}
      <section className="space-y-5">
        <div>
          <h3 className="section-title text-xl">Retos de la comunidad</h3>
          <p className="text-sm text-muted mt-0.5">Mantén tu racha, vota la encuesta del día y escala en el ranking.</p>
        </div>
        <DailyChallenges />
      </section>

      {/* Novedades de la comunidad (feed) */}
      <CommunityFeed />

      {/* Temáticas sugeridas por la comunidad */}
      <ThemesSection />

      {/* Descargas (sets propios del DJ) */}
      <section className="card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Music4 className="h-5 w-5 text-neon-purple" />
          <div>
            <h3 className="section-title text-xl">Sets del DJ</h3>
            <p className="text-sm text-muted mt-0.5">Grabaciones oficiales de los sets en vivo, libres de copyright.</p>
          </div>
        </div>
        <div className="text-sm text-muted-2 text-center py-10 border border-dashed border-border rounded-xl flex flex-col items-center gap-2">
          <Download className="h-6 w-6" />
          Aún no hay grabaciones publicadas. Aparecerán aquí después del próximo evento.
        </div>
      </section>
    </div>
  );
}
