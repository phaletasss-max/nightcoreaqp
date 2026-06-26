'use client';

// ── Perfil público (Fase D) ──────────────────────────────────────────────────
// Vista de otro usuario: nombre, avatar, rango y (si no es privado) su actividad
// pública: disfraces, comentarios e insignias de asistencia.

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { User, Flame, Coins, Camera, MessageSquare, Heart, Medal, Lock, ArrowLeft, AtSign, Music2, ExternalLink } from 'lucide-react';
import { getProfileById, getUserActivity, getProfilePhotos } from '@/lib/data';
import type { UserActivity } from '@/lib/data';
import type { Profile, ProfilePhoto } from '@/lib/types';
import styles from './perfil.module.css';

function rankFor(points: number) {
  if (points >= 200) return { title: 'Hypebeast de Oro', cls: 'badge-yellow' };
  if (points >= 100) return { title: 'Otaku de Plata', cls: 'badge-cyan' };
  return { title: 'Fan de Bronce', cls: 'badge-pink' };
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activity, setActivity] = useState<UserActivity>({ costumes: [], comments: [], attended: [], likesGiven: 0 });
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    getProfileById(id).then((p) => {
      if (!active) return;
      setProfile(p);
      // Solo cargamos actividad y galería si el perfil NO es privado.
      if (p && !p.is_private) {
        getUserActivity(id).then((a) => active && setActivity(a));
        getProfilePhotos(id).then((ph) => active && setPhotos(ph));
      }
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-muted-2 animate-pulse">Cargando perfil…</div>;
  }

  if (!profile) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto space-y-3">
        <User className="h-10 w-10 text-muted-2 mx-auto" />
        <h1 className="section-title">Perfil no encontrado</h1>
        <Link href="/" className="text-neon-cyan text-sm hover:underline inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Volver al inicio</Link>
      </div>
    );
  }

  const rank = rankFor(profile.points);
  const isPrivate = !!profile.is_private;
  const accent = profile.accent || undefined;
  const hasSocials = !!(profile.tiktok_url || profile.instagram_url);

  return (
    <div
      className={`${styles.retro} space-y-6`}
      style={accent ? ({ ['--perfil-accent']: accent } as React.CSSProperties) : undefined}
    >
      <Link href="/" className="text-muted hover:text-white text-sm inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Volver</Link>

      {/* Cabecera retro hi5 */}
      <div className={styles.panel}>
        <div className={styles.titlebar}>★ Perfil de {profile.username} ★</div>
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div
            className="h-20 w-20 rounded-full bg-neon-pink/15 border border-neon-pink/30 flex items-center justify-center overflow-hidden shrink-0"
            style={accent ? { borderColor: `color-mix(in srgb, ${accent} 60%, transparent)`, backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)` } : undefined}
          >
            {profile.avatar_url

              ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              : <User className="h-9 w-9 text-neon-pink" />}
          </div>
          <div className="flex-1 w-full">
            <h1 className={`text-2xl font-extrabold ${styles.glowName}`}>{profile.username}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
              <span className={`badge ${rank.cls}`}>{rank.title}</span>
              <span className="badge badge-cyan"><Coins className="h-3.5 w-3.5" /> {profile.points} pts</span>
              <span className="badge badge-pink"><Flame className="h-3.5 w-3.5" /> {profile.streak_count}d</span>
              {isPrivate && <span className="badge badge-yellow"><Lock className="h-3.5 w-3.5" /> Privado</span>}
            </div>

            {profile.bio && <p className="text-sm text-muted mt-3 whitespace-pre-wrap">{profile.bio}</p>}

            {hasSocials && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                {profile.tiktok_url && (
                  <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="badge badge-pink hover:opacity-80">
                    <Music2 className="h-3.5 w-3.5" /> TikTok <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {profile.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="badge badge-cyan hover:opacity-80">
                    <AtSign className="h-3.5 w-3.5" /> Instagram <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* A4 — skin retro "now spinning" (adorno; el audio real lo maneja el reproductor global) */}
            <div className={`${styles.player} mt-4`}>
              <div className={styles.disc} aria-hidden />
              <div className={styles.marquee}>
                <span>♪ {profile.username} en NIGHTCORE AQP — sube tu música a la playlist y mantén tu racha 🔥 ♪</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPrivate ? (
        <div className={`${styles.panel} p-10 text-center space-y-2`}>
          <Lock className="h-8 w-8 text-muted-2 mx-auto" />
          <p className="text-sm text-muted font-bold">Este perfil es privado</p>
          <p className="text-xs text-muted-2">{profile.username} eligió ocultar su actividad y comentarios.</p>
        </div>
      ) : (
        <>
          {/* Galería de fotos (A6 — estilo hi5) */}
          {photos.length > 0 && (
            <div className={`${styles.panel} p-6 space-y-3`}>
              <h2 className="section-title text-base flex items-center gap-2"><Camera className="h-5 w-5 text-neon-cyan" /> Galería</h2>
              <div className={styles.gallery}>
                {photos.map((ph) => (
                  <a key={ph.id} href={ph.url} target="_blank" rel="noopener noreferrer" className={styles.thumb} title={ph.caption ?? undefined}>
                    { }
                    <img src={ph.url} alt={ph.caption ?? 'foto'} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
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

          {/* Insignias */}
          {activity.attended.length > 0 && (
            <div className={`${styles.panel} p-6 space-y-3`}>
              <h2 className="section-title text-base flex items-center gap-2"><Medal className="h-5 w-5 text-yellow-400" /> Insignias de asistencia</h2>
              <div className="flex flex-wrap gap-2">
                {activity.attended.map((a) => (
                  <span key={a.id} className={`badge ${a.status === 'confirmed' ? 'badge-yellow' : 'badge-cyan'}`}>
                    <Medal className="h-3.5 w-3.5" /> {a.code ?? 'Evento'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disfraces */}
          {activity.costumes.length > 0 && (
            <div className={`${styles.panel} p-6 space-y-3`}>
              <h2 className="section-title text-base flex items-center gap-2"><Camera className="h-5 w-5 text-neon-cyan" /> Disfraces</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {activity.costumes.map((c) => (
                   
                  <img key={c.id} src={c.photo_url} alt={c.char_name} title={c.char_name} className="h-28 w-24 rounded-lg object-cover border border-border shrink-0" />
                ))}
              </div>
            </div>
          )}

          {/* Comentarios recientes */}
          {activity.comments.length > 0 && (
            <div className={`${styles.panel} p-6 space-y-3`}>
              <h2 className="section-title text-base flex items-center gap-2"><MessageSquare className="h-5 w-5 text-neon-pink" /> Comentarios recientes</h2>
              <div className="space-y-2">
                {activity.comments.slice(0, 6).map((c) => (
                  <p key={c.id} className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-2.5">&ldquo;{c.content}&rdquo;</p>
                ))}
              </div>
            </div>
          )}

          {activity.costumes.length === 0 && activity.comments.length === 0 && activity.attended.length === 0 && (
            <div className={`${styles.panel} p-10 text-center text-muted-2 text-sm`}>Este usuario aún no tiene actividad pública.</div>
          )}
        </>
      )}
    </div>
  );
}
