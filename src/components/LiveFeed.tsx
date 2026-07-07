'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Flame, CheckSquare, Crown, ArrowRight, User } from 'lucide-react';
import { getComments, getActiveSurvey, getProfiles, getCostumes, voteSurvey } from '@/lib/data';
import type { EventComment, Survey, Profile, Costume } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

type FeedItem = 
  | { type: 'poll'; data: Survey; date: number }
  | { type: 'comment'; data: EventComment; date: number }
  | { type: 'streak'; data: Profile; date: number }
  | { type: 'costume'; data: Costume; date: number };

export default function LiveFeed({ eventId }: { eventId: string }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedOption, setVotedOption] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      try {
        const [commentsRes, surveyRes, profilesRes, costumesRes] = await Promise.all([
          getComments(eventId),
          getActiveSurvey(),
          getProfiles(), // We need a function to get profiles, or just use dummy for streak
          getCostumes()
        ]);

        const newItems: FeedItem[] = [];

        // 1. Debates (Comments)
        commentsRes.slice(0, 10).forEach(c => {
          newItems.push({ type: 'comment', data: c, date: new Date(c.created_at).getTime() });
        });

        // 2. Encuesta del día (Poll)
        if (surveyRes) {
          // Fake date for the poll to make it show up at the top
          newItems.push({ type: 'poll', data: surveyRes, date: Date.now() + 100000 });
        }

        // 3. Rachas (Streak)
        const topStreaks = (profilesRes || []).filter(p => (p.streak_count || 0) >= 3).sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0)).slice(0, 3);
        topStreaks.forEach((p, i) => {
          newItems.push({ type: 'streak', data: p, date: Date.now() - (i * 3600000) }); // Spread them out
        });

        // 4. Disfraces recientes
        costumesRes.slice(0, 5).forEach(c => {
          // Use ID as a fake timestamp if needed, or actual date if available
          newItems.push({ type: 'costume', data: c, date: Date.now() - 5000000 }); 
        });

        // Sort by date descending
        newItems.sort((a, b) => b.date - a.date);
        
        setItems(newItems);
      } catch (err) {
        console.error('Error loading feed:', err);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadFeed();
    }
  }, [eventId]);

  if (loading) {
    return <div className="p-8 text-center text-muted-2 animate-pulse">Cargando muro en vivo...</div>;
  }

  if (items.length === 0) {
    return <div className="p-8 text-center text-muted-2">Aún no hay actividad en el muro.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="section-title text-xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-neon-cyan" /> Muro en vivo
        </h3>
      </div>
      
      <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
        {items.map((item, idx) => {
          if (item.type === 'poll') {
            const survey = item.data;
            return (
              <div key={`poll-${survey.id}`} className="card p-5 accent-cyan border-l-4 border-l-neon-cyan">
                <div className="flex items-center gap-2 text-neon-cyan mb-2 font-bold text-xs uppercase tracking-wider">
                  <CheckSquare className="h-4 w-4" /> Encuesta Destacada
                </div>
                <h4 className="text-white font-bold mb-3">{survey.question}</h4>
                <div className="space-y-2">
                  {survey.options.map((opt) => {
                    const total = survey.options.reduce((s, o) => s + o.votes_count, 0);
                    const pct = total > 0 ? Math.round((opt.votes_count / total) * 100) : 0;
                    const isVoted = votedOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={async () => {
                          if (votedOption) return;
                          setVotedOption(opt.id);
                          await voteSurvey(survey.id, opt.id, profile?.id ?? null);
                          setItems((prev) => prev.map((it) => {
                            if (it.type !== 'poll') return it;
                            return { ...it, data: { ...it.data, options: it.data.options.map((o) => o.id === opt.id ? { ...o, votes_count: o.votes_count + 1 } : o) } };
                          }));
                        }}
                        disabled={!!votedOption}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-bold transition-colors relative overflow-hidden ${isVoted ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan' : 'border-border text-muted hover:border-neon-cyan/50 hover:text-white'} ${votedOption ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {votedOption && (
                          <span className="absolute inset-y-0 left-0 bg-neon-cyan/10 transition-all" style={{ width: `${pct}%` }} />
                        )}
                        <span className="relative flex justify-between items-center">
                          <span>{opt.text}</span>
                          {votedOption && <span className="text-neon-cyan">{pct}%</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!votedOption && !profile && (
                  <p className="text-[10px] text-muted-2 mt-2 text-center">Inicia sesión para que tu voto se guarde</p>
                )}
              </div>
            );
          }

          if (item.type === 'streak') {
            const profile = item.data;
            return (
              <div key={`streak-${profile.id}`} className="card p-4 bg-white/[0.02] border border-border flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-neon-pink/20 flex items-center justify-center shrink-0">
                  {profile.avatar_url ? (
                    <img loading="lazy" decoding="async" src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Flame className="h-6 w-6 text-neon-pink" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-bold text-neon-pink">{profile.username}</span> está on fire 🔥
                  </p>
                  <p className="text-xs text-muted-2">¡Lleva una racha de {profile.streak_count} eventos seguidos!</p>
                </div>
              </div>
            );
          }

          if (item.type === 'comment') {
            const comment = item.data;
            return (
              <div key={`comment-${comment.id}`} className="p-4 rounded-xl bg-white/[0.03] border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-2" />
                  {comment.user_id ? (
                    <Link href={`/perfil/${comment.user_id}`} className="font-bold text-neon-magenta hover:underline">{comment.username}</Link>
                  ) : (
                    <span className="font-bold text-neon-magenta">{comment.username}</span>
                  )}
                  <span className="text-muted-2 ml-auto">Hace un momento</span>
                </div>
                <p className="text-sm text-foreground pl-5 border-l-2 border-white/10 ml-1.5">
                  {comment.content}
                </p>
              </div>
            );
          }

          if (item.type === 'costume') {
            const costume = item.data;
            return (
              <div key={`costume-${costume.id}`} className="p-4 rounded-xl bg-white/[0.03] border border-border flex gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black">
                  <img loading="lazy" decoding="async" src={costume.photo_url} alt={costume.char_name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-neon-cyan font-bold mb-1">
                    <User className="h-3.5 w-3.5" /> Nuevo Cosplay
                  </div>
                  <p className="text-sm text-white font-bold">{costume.char_name}</p>
                  <p className="text-[10px] text-muted-2">de {costume.anime}</p>
                </div>
                <div className="ml-auto flex items-center">
                   <Link href="/disfraces" className="btn btn-ghost p-2 rounded-full"><ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
