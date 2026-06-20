'use client';

import React, { useState, useEffect } from 'react';
import {
  User, Flame, Coins, Ticket, Bell, Smartphone, QrCode,
  AlertCircle, CheckCircle2, Camera, MessageSquare, Heart, Medal,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getAttendees, getUserActivity } from '@/lib/data';
import type { UserActivity } from '@/lib/data';
import type { Attendee } from '@/lib/types';

function rankFor(points: number) {
  if (points >= 200) return { title: 'Hypebeast de Oro', cls: 'badge-yellow' };
  if (points >= 100) return { title: 'Otaku de Plata', cls: 'badge-cyan' };
  return { title: 'Fan de Bronce', cls: 'badge-pink' };
}

export default function PerfilPage() {
  const { profile, addPoints, loading } = useAuth();
  const [tickets, setTickets] = useState<Attendee[]>([]);
  const [activity, setActivity] = useState<UserActivity>({ costumes: [], comments: [], attended: [], likesGiven: 0 });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);
  const [notifyEvent, setNotifyEvent] = useState(true);
  const [notifySongs, setNotifySongs] = useState(false);

  useEffect(() => {
    // Lee el flag desde localStorage al montar (solo cliente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof window !== 'undefined') setPushEnabled(localStorage.getItem('nq_push_enabled') === 'true');
    getAttendees().then((all) => {
      const uid = profile?.id;
      setTickets(uid ? all.filter((a) => a.user_id === uid) : all.slice(0, 0));
    });
    getUserActivity(profile?.id ?? null).then(setActivity);
  }, [profile?.id]);

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

  // Perfil solo para usuarios con sesión (decisión 2026-06-20).
  if (!loading && !profile) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto">
        <User className="h-10 w-10 text-neon-pink mx-auto mb-3" />
        <h1 className="section-title">Inicia sesión para ver tu perfil</h1>
        <p className="text-sm text-muted mt-2">
          Usa el botón <span className="text-neon-pink font-bold">Entrar</span> de la barra superior
          para registrarte o iniciar sesión. Tu perfil guarda tus puntos, racha, publicaciones e
          insignias de asistencia.
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      {/* Resumen */}
      <div className="space-y-6">
        <div className="card p-6 space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-20 w-20 rounded-full bg-neon-pink/15 border border-neon-pink/30 flex items-center justify-center">
              <User className="h-9 w-9 text-neon-pink" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">{profile?.username ?? 'Invitado'}</h2>
              <span className={`badge ${rank.cls} mt-2`}>{rank.title}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-5">
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
      <div className="lg:col-span-2">
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
        <div className="card p-6 sm:p-8 space-y-4 mt-6">
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
        <div className="card p-6 sm:p-8 space-y-5 mt-6">
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
    </div>
  );
}
