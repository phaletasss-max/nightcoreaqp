// ── Capa de acceso a datos ───────────────────────────────────────────────────
// Una sola API para las páginas. Si Supabase está configurado, habla con la BD;
// si no, cae a datos demo persistidos en localStorage. Así la app corre con o
// sin credenciales, y las páginas no necesitan saber en qué modo están.

import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import {
  DEMO_EVENTS, DEMO_SONGS, DEMO_SURVEY, DEMO_COSTUMES, DEMO_COMMENTS, DEMO_THEMES,
} from './demo-data';
import type {
  EventItem, Song, Survey, Costume, EventComment, Attendee, VoteType, Theme,
} from './types';

const cfg = () => isSupabaseConfigured();

// ── Helpers de localStorage (modo demo) ──────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
function lsSet<T>(key: string, value: T) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
}

// ════════════════════════════════════════════════════════════════════════════
//  EVENTOS
// ════════════════════════════════════════════════════════════════════════════
export async function getEvents(): Promise<EventItem[]> {
  if (cfg()) {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    return (data as EventItem[]) ?? [];
  }
  return lsGet('nq_events', DEMO_EVENTS);
}

export async function saveEvent(ev: EventItem): Promise<void> {
  if (cfg()) {
    await supabase.from('events').upsert(ev);
    return;
  }
  const events = lsGet('nq_events', DEMO_EVENTS);
  const idx = events.findIndex((e) => e.id === ev.id);
  if (idx >= 0) events[idx] = ev; else events.push(ev);
  lsSet('nq_events', events);
}

export async function deleteEvent(id: string): Promise<void> {
  if (cfg()) {
    await supabase.from('events').delete().eq('id', id);
    return;
  }
  lsSet('nq_events', lsGet('nq_events', DEMO_EVENTS).filter((e) => e.id !== id));
}

// ════════════════════════════════════════════════════════════════════════════
//  RSVP / ASISTENTES
// ════════════════════════════════════════════════════════════════════════════
export async function getAttendees(eventId?: string): Promise<Attendee[]> {
  if (cfg()) {
    let q = supabase.from('event_attendees').select('*');
    if (eventId) q = q.eq('event_id', eventId);
    const { data } = await q;
    return (data as Attendee[]) ?? [];
  }
  const all = lsGet<Attendee[]>('nq_rsvps', []);
  return eventId ? all.filter((a) => a.event_id === eventId) : all;
}

export async function createRsvp(input: Omit<Attendee, 'id' | 'created_at' | 'code'>): Promise<Attendee> {
  const code = `NQAQP-${Math.floor(1000 + Math.random() * 9000)}-${input.status === 'confirmed' ? 'VIP' : 'INT'}`;
  const row: Attendee = { ...input, code, id: `r-${Date.now()}`, created_at: new Date().toISOString() };
  if (cfg()) {
    const { data } = await supabase
      .from('event_attendees')
      .insert({ event_id: input.event_id, user_id: input.user_id, name: input.name, email: input.email, code, status: input.status })
      .select()
      .single();
    return (data as Attendee) ?? row;
  }
  const all = lsGet<Attendee[]>('nq_rsvps', []);
  all.push(row);
  lsSet('nq_rsvps', all);
  return row;
}

// ════════════════════════════════════════════════════════════════════════════
//  CANCIONES (playlist)
// ════════════════════════════════════════════════════════════════════════════
export async function getSongs(): Promise<Song[]> {
  if (cfg()) {
    const { data } = await supabase.from('songs').select('*').order('votes_count', { ascending: false });
    return (data as Song[]) ?? [];
  }
  return lsGet('nq_songs', DEMO_SONGS);
}

export async function addSong(input: Pick<Song, 'title' | 'artist' | 'youtube_url'> & Partial<Song>, userId: string | null, userName: string): Promise<Song> {
  const row: Song = {
    id: `s-${Date.now()}`,
    event_id: input.event_id ?? null,
    title: input.title,
    artist: input.artist,
    youtube_url: input.youtube_url,
    genre: input.genre ?? 'Sugerida',
    geek_tag: input.geek_tag ?? 'User',
    suggested_by: userId,
    suggested_by_name: userName,
    votes_count: 1,
    played: false,
    userVote: 'upvote',
  };
  if (cfg()) {
    const { data } = await supabase.from('songs').insert({
      title: row.title, artist: row.artist, youtube_url: row.youtube_url,
      genre: row.genre, geek_tag: row.geek_tag, suggested_by: userId, suggested_by_name: userName,
    }).select().single();
    return (data as Song) ?? row;
  }
  const all = lsGet('nq_songs', DEMO_SONGS);
  all.push(row);
  lsSet('nq_songs', all);
  return row;
}

// Persiste el voto. Devuelve el nuevo votes_count. La math optimista la hace la página.
export async function setSongVote(songId: string, vote: VoteType | null, userId: string | null): Promise<void> {
  if (cfg() && userId) {
    if (vote === null) {
      await supabase.from('song_votes').delete().match({ song_id: songId, user_id: userId });
    } else {
      await supabase.from('song_votes').upsert({ song_id: songId, user_id: userId, vote }, { onConflict: 'song_id,user_id' });
    }
    return;
  }
  // demo: nada que persistir aparte del estado local de la página
}

export async function setSongPlayed(songId: string, played: boolean): Promise<void> {
  if (cfg()) { await supabase.from('songs').update({ played }).eq('id', songId); return; }
  const all = lsGet('nq_songs', DEMO_SONGS).map((s) => (s.id === songId ? { ...s, played } : s));
  lsSet('nq_songs', all);
}

export async function deleteSong(songId: string): Promise<void> {
  if (cfg()) { await supabase.from('songs').delete().eq('id', songId); return; }
  lsSet('nq_songs', lsGet('nq_songs', DEMO_SONGS).filter((s) => s.id !== songId));
}

export async function clearSongs(): Promise<void> {
  if (cfg()) {
    // Delete all songs
    await supabase.from('songs').delete().neq('id', 'dummy'); 
    return;
  }
  lsSet('nq_songs', []);
}

// Guarda el MP4 propio de una canción (lo subió el media-service a Storage).
export async function setSongFileUrl(songId: string, fileUrl: string): Promise<void> {
  if (cfg()) { await supabase.from('songs').update({ file_url: fileUrl }).eq('id', songId); return; }
  const all = lsGet('nq_songs', DEMO_SONGS).map((s) => (s.id === songId ? { ...s, file_url: fileUrl } : s));
  lsSet('nq_songs', all);
}

// ════════════════════════════════════════════════════════════════════════════
//  COMENTARIOS DEL EVENTO
// ════════════════════════════════════════════════════════════════════════════
export async function getComments(eventId: string): Promise<EventComment[]> {
  if (cfg()) {
    const { data } = await supabase.from('event_comments').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
    return (data as EventComment[]) ?? [];
  }
  return lsGet('nq_comments', DEMO_COMMENTS).filter((c) => c.event_id === eventId);
}

export async function addComment(eventId: string, userId: string | null, username: string, content: string): Promise<EventComment> {
  const row: EventComment = { id: `c-${Date.now()}`, event_id: eventId, user_id: userId, username, content, created_at: new Date().toISOString() };
  if (cfg()) {
    const { data } = await supabase.from('event_comments').insert({ event_id: eventId, user_id: userId, username, content }).select().single();
    return (data as EventComment) ?? row;
  }
  const all = lsGet('nq_comments', DEMO_COMMENTS);
  all.unshift(row);
  lsSet('nq_comments', all);
  return row;
}

// ════════════════════════════════════════════════════════════════════════════
//  ENCUESTA
// ════════════════════════════════════════════════════════════════════════════
export async function getActiveSurvey(): Promise<Survey | null> {
  if (cfg()) {
    const { data: survey } = await supabase.from('surveys').select('*').eq('active', true).order('created_at', { ascending: false }).limit(1).single();
    if (!survey) return null;
    const { data: options } = await supabase.from('survey_options').select('*').eq('survey_id', survey.id).order('position');
    return { ...(survey as Survey), options: (options as Survey['options']) ?? [] };
  }
  return lsGet('nq_survey', DEMO_SURVEY);
}

export async function voteSurvey(surveyId: string, optionId: string, userId: string | null): Promise<void> {
  if (cfg() && userId) {
    await supabase.from('survey_responses').upsert({ survey_id: surveyId, option_id: optionId, user_id: userId }, { onConflict: 'survey_id,user_id' });
    return;
  }
  const survey = lsGet('nq_survey', DEMO_SURVEY);
  survey.options = survey.options.map((o) => (o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o));
  lsSet('nq_survey', survey);
}

export async function launchSurvey(question: string, options: string[]): Promise<void> {
  if (cfg()) {
    await supabase.from('surveys').update({ active: false }).eq('active', true);
    const { data: survey } = await supabase.from('surveys').insert({ question, active: true }).select().single();
    if (survey) {
      await supabase.from('survey_options').insert(options.map((text, i) => ({ survey_id: survey.id, text, position: i })));
    }
    return;
  }
  const newSurvey: Survey = {
    id: `p-${Date.now()}`,
    question,
    active: true,
    options: options.map((text, i) => ({ id: `o-${Date.now()}-${i}`, survey_id: 'demo', text, position: i, votes_count: 0 })),
  };
  lsSet('nq_survey', newSurvey);
}

// ════════════════════════════════════════════════════════════════════════════
//  DISFRACES
// ════════════════════════════════════════════════════════════════════════════
export async function getCostumes(): Promise<Costume[]> {
  if (cfg()) {
    const { data } = await supabase.from('costumes').select('*, costume_comments(*)').order('votes_count', { ascending: false });
    return (data as Costume[]) ?? [];
  }
  return lsGet('nq_costumes', DEMO_COSTUMES);
}

export async function addCostume(input: Pick<Costume, 'char_name' | 'anime' | 'photo_url' | 'description'>, userId: string | null, eventId: string | null): Promise<Costume> {
  const row: Costume = { id: `cos-${Date.now()}`, event_id: eventId, user_id: userId, ...input, votes_count: 1, voted: true, comments: [] };
  if (cfg()) {
    const { data } = await supabase.from('costumes').insert({ user_id: userId, event_id: eventId, char_name: input.char_name, anime: input.anime, photo_url: input.photo_url, description: input.description }).select().single();
    return (data as Costume) ?? row;
  }
  const all = lsGet('nq_costumes', DEMO_COSTUMES);
  all.unshift(row);
  lsSet('nq_costumes', all);
  return row;
}

export async function setCostumeVote(costumeId: string, voted: boolean, userId: string | null): Promise<void> {
  if (cfg() && userId) {
    if (voted) await supabase.from('costume_votes').upsert({ costume_id: costumeId, user_id: userId }, { onConflict: 'costume_id,user_id' });
    else await supabase.from('costume_votes').delete().match({ costume_id: costumeId, user_id: userId });
    return;
  }
  const all = lsGet('nq_costumes', DEMO_COSTUMES).map((c) =>
    c.id === costumeId ? { ...c, voted, votes_count: c.votes_count + (voted ? 1 : -1) } : c,
  );
  lsSet('nq_costumes', all);
}

// ════════════════════════════════════════════════════════════════════════════
//  TEMÁTICAS (sugeridas por la comunidad, ranking por clicks)
// ════════════════════════════════════════════════════════════════════════════
export async function getThemes(): Promise<Theme[]> {
  if (cfg()) {
    const { data } = await supabase.from('themes').select('*').order('clicks', { ascending: false });
    return (data as Theme[]) ?? [];
  }
  return lsGet('nq_themes', DEMO_THEMES).sort((a, b) => b.clicks - a.clicks);
}

export async function addTheme(name: string, userId: string | null, userName: string): Promise<Theme> {
  const row: Theme = { id: `t-${Date.now()}`, name, suggested_by: userId, suggested_by_name: userName, clicks: 1 };
  if (cfg()) {
    const { data } = await supabase.from('themes').insert({ name, suggested_by: userId, suggested_by_name: userName, clicks: 1 }).select().single();
    return (data as Theme) ?? row;
  }
  const all = lsGet('nq_themes', DEMO_THEMES);
  // Evita duplicados (case-insensitive) también en demo.
  if (all.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    return all.find((t) => t.name.toLowerCase() === name.toLowerCase())!;
  }
  all.push(row);
  lsSet('nq_themes', all);
  return row;
}

export async function clickTheme(themeId: string): Promise<void> {
  if (cfg()) { await supabase.rpc('click_theme', { p_theme_id: themeId }); return; }
  const all = lsGet('nq_themes', DEMO_THEMES).map((t) => t.id === themeId ? { ...t, clicks: t.clicks + 1 } : t);
  lsSet('nq_themes', all);
}

// ════════════════════════════════════════════════════════════════════════════
//  ACTIVIDAD DEL USUARIO (para el perfil: publicaciones, comentarios, asistencia)
// ════════════════════════════════════════════════════════════════════════════
export interface UserActivity {
  costumes: Costume[];
  comments: EventComment[];
  attended: Attendee[];      // eventos a los que asistió (insignias)
  likesGiven: number;
}

export async function getUserActivity(userId: string | null): Promise<UserActivity> {
  if (!userId) return { costumes: [], comments: [], attended: [], likesGiven: 0 };

  if (cfg()) {
    const [costumes, comments, attended, songLikes, costumeLikes] = await Promise.all([
      supabase.from('costumes').select('*').eq('user_id', userId),
      supabase.from('event_comments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('event_attendees').select('*').eq('user_id', userId),
      supabase.from('song_votes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('costume_votes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    return {
      costumes: (costumes.data as Costume[]) ?? [],
      comments: (comments.data as EventComment[]) ?? [],
      attended: (attended.data as Attendee[]) ?? [],
      likesGiven: (songLikes.count ?? 0) + (costumeLikes.count ?? 0),
    };
  }

  // Demo: derivar de localStorage.
  const costumes = lsGet('nq_costumes', DEMO_COSTUMES).filter((c) => c.user_id === userId);
  const comments = lsGet('nq_comments', DEMO_COMMENTS).filter((c) => c.user_id === userId);
  const attended = lsGet<Attendee[]>('nq_rsvps', []).filter((r) => r.user_id === userId);
  return { costumes, comments, attended, likesGiven: 0 };
}

// ════════════════════════════════════════════════════════════════════════════
//  CHECK-IN DIARIO (racha)
// ════════════════════════════════════════════════════════════════════════════
export async function dailyCheckIn(): Promise<{ ok: boolean; streak: number | null }> {
  if (cfg()) {
    const { data, error } = await supabase.rpc('daily_check_in');
    return { ok: !error, streak: (data as number) ?? null };
  }
  return { ok: true, streak: null };
}
