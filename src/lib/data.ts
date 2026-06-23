// ── Capa de acceso a datos ───────────────────────────────────────────────────
// Una sola API para las páginas. Si Supabase está configurado, habla con la BD;
// si no, cae a datos demo persistidos en localStorage. Así la app corre con o
// sin credenciales, y las páginas no necesitan saber en qué modo están.

import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { logError } from './logger';
import {
  DEMO_EVENTS, DEMO_SONGS, DEMO_SURVEY, DEMO_COSTUMES, DEMO_COMMENTS, DEMO_THEMES,
} from './demo-data';
import type {
  EventItem, Song, Survey, Costume, EventComment, Attendee, VoteType, Theme, Profile
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

export async function saveEvent(ev: EventItem): Promise<EventItem | void> {
  if (cfg()) {
    // Los eventos nuevos traen un id de cliente ("e-...") que NO es uuid → si se
    // hace upsert con ese id, Postgres falla. Para nuevos: insertar sin id (la BD
    // genera el uuid) y devolver la fila real para que el front reemplace el temporal.
    const isNew = !ev.id || ev.id.startsWith('e-');
    if (isNew) {
      const { id: _omit, ...rest } = ev;
      void _omit;
      const ins = await supabase.from('events').insert(rest).select().single();
      if (ins.error) {
        // Reintento solo con columnas base por si faltan las extra (migración phase-de.sql no corrida).
        const base = {
          title: ev.title, tagline: ev.tagline, description: ev.description, date: ev.date,
          location: ev.location, ticket_price: ev.ticket_price, total_tickets: ev.total_tickets,
          available_tickets: ev.available_tickets, status: ev.status, comments_enabled: ev.comments_enabled,
        };
        const retry = await supabase.from('events').insert(base).select().single();
        if (retry.error) { logError('saveEvent.insert', retry.error); return; }
        return retry.data as EventItem;
      }
      return ins.data as EventItem;
    }
    const { error } = await supabase.from('events').upsert(ev);
    if (error) logError('saveEvent.upsert', error);
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
//  SITE SETTINGS (Fondos dinámicos)
// ════════════════════════════════════════════════════════════════════════════
export async function getSiteSettings(): Promise<Record<string, string>> {
  if (cfg()) {
    const { data } = await supabase.from('site_settings').select('*');
    if (data) {
      const settings: Record<string, string> = {};
      data.forEach(row => settings[row.key] = row.value);
      return settings;
    }
  }
  return lsGet('nq_site_settings', {});
}

export async function updateSiteSetting(key: string, value: string): Promise<void> {
  if (cfg()) {
    await supabase.from('site_settings').upsert({ key, value });
    return;
  }
  const settings = lsGet('nq_site_settings', {} as Record<string, string>);
  settings[key] = value;
  lsSet('nq_site_settings', settings);
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
//  CANCIONES (playlist) — localStorage-first, Supabase como sync
// ════════════════════════════════════════════════════════════════════════════
export async function getSongs(): Promise<Song[]> {
  // 1. Siempre leer lo local primero (esto NUNCA falla)
  const local = lsGet<Song[]>('nq_songs', []);

  // 2. Intentar traer de Supabase como complemento
  let remote: Song[] = [];
  if (cfg()) {
    try {
      const { data, error } = await supabase.from('songs').select('*').order('votes_count', { ascending: false });
      if (!error && data && data.length > 0) remote = data as Song[];
    } catch { /* silencioso */ }
  }

  // 3. Combinar: remote primero, luego locales que no estén en remote
  const combined = [...remote];
  local.forEach(l => {
    if (!combined.find(c => c.id === l.id || c.youtube_url === l.youtube_url)) {
      combined.push(l);
    }
  });
  return combined.sort((a, b) => b.votes_count - a.votes_count);
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

  // ★ SIEMPRE guardar en localStorage PRIMERO (garantía de persistencia)
  const all = lsGet<Song[]>('nq_songs', []);
  all.push(row);
  lsSet('nq_songs', all);

  // Intentar también en Supabase como backup en la nube (opcional, no bloquea)
  if (cfg()) {
    const { error } = await supabase.from('songs').insert({
      title: row.title, artist: row.artist, youtube_url: row.youtube_url,
      genre: row.genre, geek_tag: row.geek_tag, suggested_by: userId, suggested_by_name: userName,
    });
    // Causa típica: RLS (sesión no real → auth.uid() ≠ suggested_by). Antes era
    // silencioso y la canción quedaba solo en localStorage ("desaparecía").
    if (error) logError('addSong.insert', error, { userId });
  }

  return row;
}

// Persiste el voto. Devuelve el nuevo votes_count. La math optimista la hace la página.
export async function setSongVote(songId: string, vote: VoteType | null, userId: string | null): Promise<void> {
  if (cfg() && userId) {
    if (vote === null) {
      const { error } = await supabase.from('song_votes').delete().match({ song_id: songId, user_id: userId });
      if (error) logError('setSongVote.delete', error, { songId });
    } else {
      // La columna es 'vote' (no 'vote_type') y el conflicto es por (song_id,user_id).
      const { error } = await supabase
        .from('song_votes')
        .upsert({ song_id: songId, user_id: userId, vote }, { onConflict: 'song_id,user_id' });
      if (error) logError('setSongVote.upsert', error, { songId, vote });
    }
    return;
  }
  // Local fallback (optimista, no requiere persistencia estricta para probar)
  const all = lsGet<Song[]>('nq_songs', []);
  const idx = all.findIndex(s => s.id === songId);
  if (idx >= 0) {
    if (vote === 'upvote') all[idx].votes_count += 1;
    if (vote === 'downvote') all[idx].votes_count -= 1;
    lsSet('nq_songs', all);
  }
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
    // 'dummy' no es un uuid → el filtro anterior fallaba y no borraba nada.
    // Filtro válido: todas las filas con id no nulo (es decir, todas).
    const { error } = await supabase.from('songs').delete().not('id', 'is', null);
    if (error) logError('clearSongs', error);
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

export async function uploadMediaFile(file: File): Promise<string | null> {
  if (!cfg()) return URL.createObjectURL(file);
  const ext = file.name.split('.').pop() || 'mp4';
  const path = `uploads/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file);
  if (error) {
    // Causa típica: faltan políticas del bucket 'media' (ver supabase/fixes.sql).
    logError('uploadMediaFile', error, { path });
    return null;
  }
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
  return publicUrl;
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

export async function addComment(eventId: string, userId: string | null, username: string, content: string, flagged = false): Promise<EventComment> {
  const row: EventComment = { id: `c-${Date.now()}`, event_id: eventId, user_id: userId, username, content, created_at: new Date().toISOString(), flagged };
  if (cfg()) {
    const ins = await supabase.from('event_comments').insert({ event_id: eventId, user_id: userId, username, content, flagged }).select().single();
    if (ins.error) {
      // Reintento sin 'flagged' por si la columna aún no existe (migración no corrida).
      const retry = await supabase.from('event_comments').insert({ event_id: eventId, user_id: userId, username, content }).select().single();
      if (retry.error) logError('addComment', retry.error);
      return (retry.data as EventComment) ?? row;
    }
    return (ins.data as EventComment) ?? row;
  }
  const all = lsGet('nq_comments', DEMO_COMMENTS);
  all.unshift(row);
  lsSet('nq_comments', all);
  return row;
}

// Aprobar un comentario marcado (quita flagged → se muestra sin censura).
export async function approveComment(commentId: string): Promise<void> {
  if (cfg()) {
    const { error } = await supabase.from('event_comments').update({ flagged: false }).eq('id', commentId);
    if (error) logError('approveComment', error);
    return;
  }
  const all = lsGet<EventComment[]>('nq_comments', DEMO_COMMENTS).map((c) => c.id === commentId ? { ...c, flagged: false } : c);
  lsSet('nq_comments', all);
}

// ════════════════════════════════════════════════════════════════════════════
//  MODERACIÓN — filtros de palabras (Fase E)
// ════════════════════════════════════════════════════════════════════════════
export async function getBannedWords(): Promise<string[]> {
  if (cfg()) {
    const { data, error } = await supabase.from('banned_words').select('word').order('word');
    if (error) { logError('getBannedWords', error); return []; }
    return (data ?? []).map((r) => r.word as string);
  }
  return lsGet<string[]>('nq_banned_words', []);
}

export async function addBannedWord(word: string): Promise<void> {
  const w = word.trim().toLowerCase();
  if (!w) return;
  if (cfg()) {
    const { error } = await supabase.from('banned_words').insert({ word: w });
    if (error) logError('addBannedWord', error);
    return;
  }
  const all = lsGet<string[]>('nq_banned_words', []);
  if (!all.includes(w)) { all.push(w); lsSet('nq_banned_words', all); }
}

export async function removeBannedWord(word: string): Promise<void> {
  if (cfg()) {
    const { error } = await supabase.from('banned_words').delete().eq('word', word);
    if (error) logError('removeBannedWord', error);
    return;
  }
  lsSet('nq_banned_words', lsGet<string[]>('nq_banned_words', []).filter((w) => w !== word));
}

// ════════════════════════════════════════════════════════════════════════════
//  PERFIL PÚBLICO + PRIVACIDAD (Fase D)
// ════════════════════════════════════════════════════════════════════════════
export async function getProfileById(id: string): Promise<Profile | null> {
  if (cfg()) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) { logError('getProfileById', error, { id }); return null; }
    return (data as Profile) ?? null;
  }
  return lsGet<Profile[]>('nq_profiles', []).find((p) => p.id === id) ?? null;
}

// Guarda la foto de perfil (subida a Storage por uploadMediaFile).
export async function updateProfileAvatar(id: string, url: string): Promise<void> {
  if (cfg()) {
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', id);
    if (error) logError('updateProfileAvatar', error, { id });
    return;
  }
  const all = lsGet<Profile[]>('nq_profiles', []).map((p) => p.id === id ? { ...p, avatar_url: url } : p);
  lsSet('nq_profiles', all);
}

export async function updateProfilePrivacy(id: string, isPrivate: boolean): Promise<void> {
  if (cfg()) {
    const { error } = await supabase.from('profiles').update({ is_private: isPrivate }).eq('id', id);
    if (error) logError('updateProfilePrivacy', error);
    return;
  }
  const all = lsGet<Profile[]>('nq_profiles', []).map((p) => p.id === id ? { ...p, is_private: isPrivate } : p);
  lsSet('nq_profiles', all);
}

export async function deleteComment(commentId: string): Promise<void> {
  if (cfg()) { await supabase.from('event_comments').delete().eq('id', commentId); return; }
  lsSet('nq_comments', lsGet('nq_comments', DEMO_COMMENTS).filter((c) => c.id !== commentId));
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

// ════════════════════════════════════════════════════════════════════════════
//  ADMINISTRACIÓN DE USUARIOS, COMENTARIOS Y POSTS
// ════════════════════════════════════════════════════════════════════════════
export async function getProfiles(): Promise<Profile[]> {
  if (cfg()) {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return (data as Profile[]) ?? [];
  }
  return lsGet<Profile[]>('nq_profiles', [
    {
      id: 'af46f257-2bcc-4f0b-86b2-d8047ba6a9fd',
      username: 'manchuriam',
      role: 'admin',
      points: 9999,
      streak_count: 999,
      last_check_in: null,
      avatar_url: null,
      email: 'manchuria@nightcoreaqp.com'
    }
  ]);
}

export async function updateProfileRole(id: string, role: 'user' | 'dj' | 'admin'): Promise<void> {
  if (cfg()) {
    await supabase.from('profiles').update({ role }).eq('id', id);
    return;
  }
  const all = lsGet<Profile[]>('nq_profiles', []);
  const idx = all.findIndex(p => p.id === id);
  if (idx >= 0) {
    all[idx].role = role;
    lsSet('nq_profiles', all);
  }
}

export async function deleteProfile(id: string): Promise<void> {
  if (cfg()) {
    await supabase.from('profiles').delete().eq('id', id);
    return;
  }
  lsSet('nq_profiles', lsGet<Profile[]>('nq_profiles', []).filter(p => p.id !== id));
}

export async function getAllComments(): Promise<EventComment[]> {
  if (cfg()) {
    const { data } = await supabase.from('event_comments').select('*').order('created_at', { ascending: false });
    return (data as EventComment[]) ?? [];
  }
  return lsGet<EventComment[]>('nq_comments', DEMO_COMMENTS);
}

export async function deleteCostume(id: string): Promise<void> {
  if (cfg()) {
    await supabase.from('costumes').delete().eq('id', id);
    return;
  }
  lsSet('nq_costumes', lsGet<Costume[]>('nq_costumes', DEMO_COSTUMES).filter(c => c.id !== id));
}

export async function adminResetPassword(email: string): Promise<boolean> {
  if (cfg()) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });
    return !error;
  }
  return true;
}
