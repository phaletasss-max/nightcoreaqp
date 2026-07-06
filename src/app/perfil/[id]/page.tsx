'use client';

// ── Perfil público (Fase D + Fase 14-B Perfil hi5) ─────────────────────────────
// Vista de otro usuario: nombre, avatar, rango, reacciones/fives, galería de fotos,
// estadísticas, insignias, disfraces, comentarios y el libro de visitas (guestbook).

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, Flame, Coins, Camera, MessageSquare, Heart, Medal, Lock, ArrowLeft,
  AtSign, Music2, ExternalLink, Star, Skull, Ghost, Trash2
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';
import {
  getProfileById, getUserActivity, getProfilePhotos,
  getProfileGuestbook, addGuestbookEntry, deleteGuestbookEntry, subscribeProfileGuestbook,
  getProfileReactions, toggleProfileReaction, subscribeProfileReactions
} from '@/lib/data';
import type { UserActivity } from '@/lib/data';
import type { Profile, ProfilePhoto, ProfileGuestbook, ProfileReaction } from '@/lib/types';
import styles from './perfil.module.css';

function rankFor(points: number) {
  if (points >= 200) return { title: 'Hypebeast de Oro', cls: 'badge-yellow' };
  if (points >= 100) return { title: 'Otaku de Plata', cls: 'badge-cyan' };
  return { title: 'Fan de Bronce', cls: 'badge-pink' };
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  
  const { profile: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activity, setActivity] = useState<UserActivity>({ costumes: [], comments: [], attended: [], likesGiven: 0 });
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Perfil hi5 - States
  const [reactions, setReactions] = useState<ProfileReaction[]>([]);
  const [guestbook, setGuestbook] = useState<ProfileGuestbook[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    
    getProfileById(id).then((p) => {
      if (!active) return;
      setProfile(p);
      // Solo cargamos actividad, galería, reacciones y guestbook si el perfil NO es privado.
      if (p && !p.is_private) {
        getUserActivity(id).then((a) => active && setActivity(a));
        getProfilePhotos(id).then((ph) => active && setPhotos(ph));
        getProfileReactions(id).then((r) => active && setReactions(r));
        getProfileGuestbook(id).then((g) => active && setGuestbook(g));
      }
    }).finally(() => active && setLoading(false));
    
    return () => { active = false; };
  }, [id]);

  // Realtime subscription setup
  useEffect(() => {
    if (!id || (profile && profile.is_private)) return;
    
    const unsubReactions = subscribeProfileReactions(id, () => {
      getProfileReactions(id).then(setReactions);
    });
    
    const unsubGuestbook = subscribeProfileGuestbook(id, () => {
      getProfileGuestbook(id).then(setGuestbook);
    });
    
    return () => {
      unsubReactions();
      unsubGuestbook();
    };
  }, [id, profile?.is_private]);

  if (loading) {
    return <div className="text-center py-20 text-muted-2 animate-pulse">Cargando perfil…</div>;
  }

  if (!profile) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto space-y-3">
        <User className="h-10 w-10 text-muted-2 mx-auto" />
        <h1 className="section-title">Perfil no encontrado</h1>
        <Link href="/" className="text-neon-cyan text-sm hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
      </div>
    );
  }

  const rank = rankFor(profile.points);
  const isPrivate = !!profile.is_private;
  const accent = profile.accent || undefined;
  const hasSocials = !!(profile.tiktok_url || profile.instagram_url);

  const handleReact = async (reactionType: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const alreadyReacted = reactions.some(
      (r) => r.user_id === currentUser.id && r.reaction === reactionType
    );
    
    // UI update optimista
    const updatedReactions = alreadyReacted
      ? reactions.filter((r) => !(r.user_id === currentUser.id && r.reaction === reactionType))
      : [
          ...reactions,
          {
            // eslint-disable-next-line react-hooks/purity
            id: 'temp-' + Date.now(),
            profile_id: id,
            user_id: currentUser.id,
            reaction: reactionType,
            created_at: new Date().toISOString(),
          },
        ];
    setReactions(updatedReactions);

    try {
      await toggleProfileReaction(id, currentUser.id, reactionType, !alreadyReacted);
    } catch (e) {
      // Revertir ante error
      getProfileReactions(id).then(setReactions);
    }
  };

  const handleAddGuestbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const val = newComment.trim();
    if (!val) return;

    setSubmittingComment(true);
    try {
      const entry = await addGuestbookEntry(id, currentUser.id, currentUser.username, val);
      if (entry) {
        setGuestbook((prev) => [entry, ...prev.filter(g => g.id !== entry.id)]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteGuestbook = async (entryId: string) => {
    if (!currentUser) return;
    if (window.confirm('¿Seguro que deseas eliminar este mensaje del muro?')) {
      // Optimistic update
      setGuestbook((prev) => prev.filter((g) => g.id !== entryId));
      try {
        await deleteGuestbookEntry(entryId, id);
      } catch (err) {
        getProfileGuestbook(id).then(setGuestbook);
      }
    }
  };

  return (
    <div
      className={`${styles.retro} space-y-6`}
      style={accent ? ({ ['--perfil-accent']: accent } as React.CSSProperties) : undefined}
    >
      <Link href="/" className="text-muted hover:text-white text-sm inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

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

            {/* A4 — skin retro "now spinning" (adorno) */}
            <div className={`${styles.player} mt-4`}>
              <div className={styles.disc} aria-hidden />
              <div className={styles.marquee}>
                <span>♪ {profile.username} en GLITCH AQP — sube tu música a la playlist y mantén tu racha 🔥 ♪</span>
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
          {/* Reacciones / Fives */}
          <div className={`${styles.panel} p-4`}>
            <div className={styles.titlebar}>★ Reacciones / Fives ★</div>
            <div className="p-4 flex flex-wrap items-center justify-center gap-4">
              {[
                { type: 'star', label: 'Estrella', icon: Star, color: 'text-yellow-400', hoverBg: 'hover:bg-yellow-400/10' },
                { type: 'heart', label: 'Corazón', icon: Heart, color: 'text-red-500', hoverBg: 'hover:bg-red-500/10' },
                { type: 'skull', label: 'Calavera', icon: Skull, color: 'text-neutral-400', hoverBg: 'hover:bg-neutral-400/10' },
                { type: 'fire', label: 'Fuego', icon: Flame, color: 'text-orange-500', hoverBg: 'hover:bg-orange-500/10' },
                { type: 'ghost', label: 'Fantasma', icon: Ghost, color: 'text-purple-400', hoverBg: 'hover:bg-purple-400/10' }
              ].map((react) => {
                const count = reactions.filter((r) => r.reaction === react.type).length;
                const active = currentUser && reactions.some((r) => r.user_id === currentUser.id && r.reaction === react.type);
                const Icon = react.icon;
                
                return (
                  <button
                    key={react.type}
                    onClick={() => handleReact(react.type)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border border-border transition-all duration-200 ${react.hoverBg} ${
                      active
                        ? 'bg-white/10 border-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)] scale-105'
                        : 'bg-black/30'
                    }`}
                    title={react.label}
                  >
                    <Icon className={`h-5 w-5 ${react.color} ${active ? 'scale-110' : ''}`} />
                    <span className="text-xs font-bold text-white">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Galería de fotos (A6 — estilo hi5) */}
          {photos.length > 0 && (
            <div className={`${styles.panel} p-6 space-y-3`}>
              <h2 className="section-title text-base flex items-center gap-2"><Camera className="h-5 w-5 text-neon-cyan" /> Galería</h2>
              <div className={styles.gallery}>
                {photos.map((ph) => (
                  <a key={ph.id} href={ph.url} target="_blank" rel="noopener noreferrer" className={styles.thumb} title={ph.caption ?? undefined}>
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

          {/* Libro de Visitas (Guestbook) */}
          <div className={`${styles.panel} p-6 space-y-4`}>
            <div className={styles.titlebar}>★ Libro de Visitas (Guestbook) ★</div>
            
            {/* Formulario */}
            {currentUser ? (
              <form onSubmit={handleAddGuestbook} className="space-y-3">
                <textarea
                  className="input min-h-[80px] w-full resize-none p-3 text-sm rounded-lg"
                  placeholder={`Escríbele algo en su muro a ${profile.username}...`}
                  required
                  maxLength={500}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="btn btn-primary text-xs py-1.5 px-4"
                  >
                    Firmar muro
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 bg-white/[0.02] border border-dashed border-border rounded-lg">
                <p className="text-xs text-muted">
                  Debes{' '}
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="text-neon-cyan font-bold hover:underline"
                  >
                    iniciar sesión
                  </button>{' '}
                  para firmar el libro de visitas.
                </p>
              </div>
            )}

            {/* Listado de firmas */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
              {guestbook.length > 0 ? (
                guestbook.map((entry) => {
                  const isAuthor = currentUser && entry.author_id === currentUser.id;
                  const isOwner = currentUser && profile.id === currentUser.id;
                  const isStaffMember = currentUser && (currentUser.role === 'admin' || currentUser.role === 'dj');
                  const canDelete = isAuthor || isOwner || isStaffMember;
                  
                  return (
                    <div
                      key={entry.id}
                      className="flex gap-3 p-3 bg-white/[0.02] border border-border/50 rounded-lg hover:border-border transition-colors duration-200"
                    >
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-neon-pink/15 border border-neon-pink/30 flex items-center justify-center overflow-hidden shrink-0">
                        {entry.author?.avatar_url ? (
                          <img
                            src={entry.author.avatar_url}
                            alt={entry.author_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-black text-neon-pink">
                            {entry.author_name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-white hover:underline">
                            {entry.author_id ? (
                              <Link href={`/perfil/${entry.author_id}`}>
                                {entry.author_name}
                              </Link>
                            ) : (
                              entry.author_name
                            )}
                          </span>
                          <span className="text-[10px] text-muted-2">
                            {new Date(entry.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-1 break-words">{entry.content}</p>
                      </div>

                      {/* Acciones */}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteGuestbook(entry.id)}
                          className="text-muted hover:text-red-500 p-1 self-start transition-colors duration-200"
                          title="Eliminar mensaje"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-6 text-xs text-muted-2 italic">
                  El libro de visitas está vacío. ¡Sé el primero en firmar!
                </p>
              )}
            </div>
          </div>

          {activity.costumes.length === 0 && activity.comments.length === 0 && activity.attended.length === 0 && (
            <div className={`${styles.panel} p-10 text-center text-muted-2 text-sm`}>
              Este usuario aún no tiene actividad pública.
            </div>
          )}
        </>
      )}

      {/* Modal de autenticación */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
