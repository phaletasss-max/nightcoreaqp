'use client';

// ── Retos diarios (movidos a Eventos como sección del feed) ──────────────────
// Racha diaria + encuesta del día + fans del mes + historial. Antes vivían en
// /encuestas; ahora son parte del feed de la home (decisión 2026-06-20).

import React, { useState, useEffect } from 'react';
import { Flame, Vote, CheckCircle2, Trophy, BarChart3, CalendarCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getActiveSurvey, voteSurvey, dailyCheckIn } from '@/lib/data';
import { DEMO_LEADERBOARD } from '@/lib/demo-data';
import type { Survey } from '@/lib/types';

const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function DailyChallenges() {
  const { profile, addPoints, refresh } = useAuth();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    getActiveSurvey().then(setSurvey);
    if (typeof window !== 'undefined') {
      // Sincroniza estado desde localStorage al montar (solo cliente).
      /* eslint-disable react-hooks/set-state-in-effect */
      setCheckedIn(localStorage.getItem('nq_checked_in_today') === new Date().toDateString());
      setVotedOption(localStorage.getItem('nq_survey_voted'));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  const todayIdx = (new Date().getDay() + 6) % 7;
  const streak = profile?.streak_count ?? 0;

  const handleCheckIn = async () => {
    if (checkedIn) return;
    setCheckedIn(true);
    localStorage.setItem('nq_checked_in_today', new Date().toDateString());
    const res = await dailyCheckIn();
    if (res.ok) { addPoints(5); refresh(); }
  };

  const handleVote = async (optionId: string) => {
    if (votedOption || !survey) return;
    setVotedOption(optionId);
    localStorage.setItem('nq_survey_voted', optionId);
    setSurvey({ ...survey, options: survey.options.map((o) => o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o) });
    await voteSurvey(survey.id, optionId, profile?.id ?? null);
    addPoints(3);
  };

  const total = survey?.options.reduce((s, o) => s + o.votes_count, 0) ?? 0;

  return (
    <div className="grid lg:grid-cols-3 gap-6 items-start">
      {/* Racha + ranking */}
      <div className="space-y-6">
        <div 
          className="card accent-pink p-6 space-y-5 relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: 'url(/mikualentadora.jpg)' }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${checkedIn ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' : 'bg-white/5 border-border text-muted'}`}>
                <Flame className={`h-6 w-6 ${checkedIn ? 'glow-magenta' : ''}`} />
              </div>
              <div>
                <h3 className="font-extrabold text-white">Racha diaria</h3>
                <p className="text-xs text-muted-2">Entra {7 - streak} días seguidos para medalla mensual.</p>
              </div>
            </div>

          <div className="text-center py-5 rounded-xl bg-black/30 border border-border">
            <span className="text-5xl font-extrabold text-white text-glow-pink">{streak}</span>
            <p className="text-sm text-muted mt-1">días seguidos</p>
            {checkedIn ? (
              <span className="badge badge-green mt-3"><CheckCircle2 className="h-3.5 w-3.5" /> Check-in hecho (+5)</span>
            ) : (
              <p className="text-xs text-orange-400 mt-2">¡No olvides tu check-in!</p>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEK.map((d, i) => {
              const past = i < todayIdx;
              const today = i === todayIdx;
              const done = past || (today && checkedIn);
              return (
                <div key={d} className={`rounded-lg py-2 flex flex-col items-center gap-1 border text-[10px] font-bold uppercase ${
                  done ? 'border-neon-pink/30 bg-neon-pink/10 text-neon-pink' : today ? 'border-neon-cyan/40 text-neon-cyan' : 'border-border text-muted-2'
                }`}>
                  {d}
                  {done ? <Flame className="h-3.5 w-3.5 fill-neon-pink" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-2/40" />}
                </div>
              );
            })}
          </div>

            <button
              onClick={handleCheckIn}
              disabled={checkedIn}
              className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
                checkedIn ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink cursor-not-allowed' : 'bg-white text-black hover:bg-neon-pink hover:text-white hover:shadow-[0_0_15px_rgba(255,0,255,0.5)]'
              }`}
            >
              {checkedIn ? '✅ Registrado por hoy' : 'Reclamar +5 PTS'}
            </button>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h3 className="section-title text-base flex items-center gap-2"><Trophy className="h-5 w-5 text-neon-cyan" /> Top fans del mes</h3>
          {DEMO_LEADERBOARD.length === 0 ? (
            <p className="text-sm text-muted-2 text-center py-4">El ranking se llenará con actividad de la comunidad. ✦</p>
          ) : (
            DEMO_LEADERBOARD.map((f) => (
              <div key={f.rank} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-border text-xs">
                <div className="flex items-center gap-2">
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold ${f.rank === 1 ? 'bg-yellow-400 text-black' : f.rank === 2 ? 'bg-slate-300 text-black' : 'bg-amber-600 text-black'}`}>{f.rank}</span>
                  <span className="font-bold text-foreground">{f.name}</span>
                </div>
                <span className="font-extrabold text-neon-cyan">{f.points} pts</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Encuesta + historial */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card accent-cyan p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Vote className="h-6 w-6 text-neon-cyan" />
            <div>
              <h3 className="section-title text-lg">Encuesta del día</h3>
              <p className="text-xs text-muted">Vota y ayúdanos a planear las próximas temáticas. (+3 pts)</p>
            </div>
          </div>

          {!survey ? (
            <p className="text-sm text-muted-2 text-center py-8">No hay encuesta activa.</p>
          ) : (
            <div className="card bg-surface-2 p-6 space-y-4">
              <h4 className="font-bold text-white">{survey.question}</h4>
              {votedOption ? (
                <div className="space-y-3 pt-1">
                  {survey.options.map((o) => {
                    const pct = total ? Math.round((o.votes_count / total) * 100) : 0;
                    const mine = votedOption === o.id;
                    return (
                      <div key={o.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={mine ? 'text-neon-cyan' : 'text-muted'}>{o.text} {mine && '✓'}</span>
                          <span className="text-neon-cyan">{pct}%</span>
                        </div>
                        <div className="track"><span style={{ width: `${pct}%`, background: mine ? 'linear-gradient(90deg, var(--cyan), var(--purple))' : 'rgba(255,255,255,0.18)' }} /></div>
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-muted-2 pt-2 border-t border-border">Total: {total} votos</p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {survey.options.map((o) => (
                    <button key={o.id} onClick={() => handleVote(o.id)}
                      className="w-full text-left p-3.5 rounded-lg border border-border text-sm font-bold text-muted hover:text-white hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-colors">
                      {o.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-6 sm:p-8 space-y-4">
          <h3 className="section-title text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-neon-purple" /> Historial de encuestas</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { q: '¿Anime favorito para remixes?', top: 'Naruto Shippuden (45%)', date: '15 Jun 2026' },
              { q: '¿Subgénero preferido en eventos?', top: 'Eurobeat Speedup (58%)', date: '10 Jun 2026' },
            ].map((h, i) => (
              <div key={i} className="card bg-surface-2 p-4 space-y-1.5">
                <span className="text-[10px] text-muted-2 font-bold">{h.date}</span>
                <h4 className="font-bold text-white text-sm">{h.q}</h4>
                <p className="text-xs text-muted">Ganador: <span className="text-neon-purple font-bold">{h.top}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
