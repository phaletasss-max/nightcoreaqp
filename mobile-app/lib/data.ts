// ── Capa de datos (móvil) ─────────────────────────────────────────────────────
// Lectores/escritores contra la MISMA base de Supabase que la web. A diferencia de
// la web, el móvil NO tiene modo demo localStorage: si no hay credenciales
// (`isConfigured` false), las lecturas devuelven [] / null y la UI avisa.
//
// Nombres de tabla/columna ESPEJADOS de la web (src/lib/data.ts):
//   events · songs · song_votes({song_id,user_id,vote}) · event_attendees · profiles
// Mantener alineado con la RLS. Este archivo NO importa nada de `src/`.

import { supabase, isConfigured } from './supabase';
import type { EventItem, Song, Attendee, Profile, VoteType, Costume, ChatMessage, Survey, SurveyOption } from './types';

// ── Eventos ──────────────────────────────────────────────────────────────────
// Evento "activo": el confirmado, o el más próximo por fecha (igual que la web).
export async function getNextEvent(): Promise<EventItem | null> {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  if (error || !data) return null;
  const events = data as EventItem[];
  return events.find((e) => e.status === 'confirmed') ?? events[0] ?? null;
}

export async function getEvents(): Promise<EventItem[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  if (error || !data) return [];
  return data as EventItem[];
}

// ── Asistencia (RSVP) ─────────────────────────────────────────────────────────
export async function getAttendees(eventId?: string): Promise<Attendee[]> {
  if (!isConfigured) return [];
  let q = supabase.from('event_attendees').select('*');
  if (eventId) q = q.eq('event_id', eventId);
  const { data } = await q;
  return (data as Attendee[]) ?? [];
}

// Crea/registra una reserva. Mismo patrón que createRsvp de la web (genera code).
export async function createRsvp(
  input: Omit<Attendee, 'id' | 'created_at' | 'code'>,
): Promise<Attendee | null> {
  if (!isConfigured) return null;
  const code = `NQAQP-${Math.floor(1000 + Math.random() * 9000)}-${input.status === 'confirmed' ? 'VIP' : 'INT'}`;
  const { data, error } = await supabase
    .from('event_attendees')
    .insert({
      event_id: input.event_id,
      user_id: input.user_id,
      name: input.name,
      email: input.email,
      code,
      status: input.status,
    })
    .select()
    .single();
  if (error) return null;
  return (data as Attendee) ?? null;
}

// ── Playlist ──────────────────────────────────────────────────────────────────
// Canciones más votadas primero. Si hay usuario, marca su voto (userVote).
export async function getSongs(userId?: string | null): Promise<Song[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('votes_count', { ascending: false });
  if (error || !data) return [];
  const songs = data as Song[];

  if (userId) {
    const { data: votes } = await supabase
      .from('song_votes')
      .select('song_id, vote')
      .eq('user_id', userId);
    const map = new Map((votes ?? []).map((v: { song_id: string; vote: VoteType }) => [v.song_id, v.vote]));
    return songs.map((s) => ({ ...s, userVote: map.get(s.id) ?? null }));
  }
  return songs;
}

// Vota una canción. `vote === null` retira el voto. La columna es `vote` y el
// conflicto es por (song_id, user_id). votes_count lo mantiene un trigger en BD.
export async function setSongVote(
  songId: string,
  userId: string,
  vote: VoteType | null,
): Promise<void> {
  if (!isConfigured) return;
  if (vote === null) {
    await supabase.from('song_votes').delete().match({ song_id: songId, user_id: userId });
  } else {
    await supabase
      .from('song_votes')
      .upsert({ song_id: songId, user_id: userId, vote }, { onConflict: 'song_id,user_id' });
  }
}

export async function setSongPlayed(songId: string, played: boolean): Promise<void> {
  if (!isConfigured) return;
  await supabase.from('songs').update({ played }).eq('id', songId);
}

export async function getProfiles(): Promise<Profile[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('points', { ascending: false });
  if (error || !data) return [];
  return data as Profile[];
}

// ── Perfil ─────────────────────────────────────────────────────────────────────
export async function getProfile(id: string): Promise<Profile | null> {
  if (!isConfigured) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Profile;
}

// Actualiza campos editables del propio perfil (la RLS exige id === auth.uid()).
export async function updateMyProfile(
  id: string,
  patch: Partial<Pick<Profile, 'username' | 'bio' | 'tiktok_url' | 'instagram_url' | 'accent'>>,
): Promise<void> {
  if (!isConfigured) return;
  await supabase.from('profiles').update(patch).eq('id', id);
}

// ── Disfraces (cosplay) ────────────────────────────────────────────────────────
// Voto binario (te gusta / no), espejo de costume_votes en la web. Si hay userId,
// marca `voted` consultando los votos del usuario.
export async function getCostumes(userId?: string | null): Promise<Costume[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('costumes')
    .select('*')
    .order('votes_count', { ascending: false });
  if (error || !data) return [];
  const costumes = data as Costume[];

  if (userId) {
    const { data: votes } = await supabase
      .from('costume_votes')
      .select('costume_id')
      .eq('user_id', userId);
    const voted = new Set((votes ?? []).map((v: { costume_id: string }) => v.costume_id));
    return costumes.map((c) => ({ ...c, voted: voted.has(c.id) }));
  }
  return costumes;
}

export async function setCostumeVote(
  costumeId: string,
  voted: boolean,
  userId: string,
): Promise<void> {
  if (!isConfigured) return;
  if (voted) {
    await supabase
      .from('costume_votes')
      .upsert({ costume_id: costumeId, user_id: userId }, { onConflict: 'costume_id,user_id' });
  } else {
    await supabase.from('costume_votes').delete().match({ costume_id: costumeId, user_id: userId });
  }
}

export async function addCostume(
  charName: string,
  anime: string,
  photoUrl: string,
  userId: string,
): Promise<Costume | null> {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('costumes')
    .insert({
      char_name: charName,
      anime,
      photo_url: photoUrl,
      user_id: userId,
      votes_count: 0,
    })
    .select()
    .single();
  if (error || !data) return null;
  return data as Costume;
}

// ── Chat de comunidad ───────────────────────────────────────────────────────────
// Requiere la migración `phase-chat.sql` corrida en Supabase (tabla chat_messages
// + Realtime habilitado). Sin ella, getChatMessages devuelve [] y el envío falla.
export async function getChatMessages(room = 'general', limit = 80): Promise<ChatMessage[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room', room)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as ChatMessage[]).reverse();
}

export async function sendChatMessage(
  room: string,
  content: string,
  userId: string | null,
  username: string,
): Promise<ChatMessage | null> {
  const text = content.trim();
  if (!isConfigured || !text) return null;
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ room, user_id: userId, username, content: text })
    .select()
    .single();
  if (error) return null;
  return data as ChatMessage;
}

// Suscripción Realtime a nuevos mensajes de una sala. Devuelve la función de
// limpieza (mismo patrón que la web). Llamar dentro de un useEffect.
export function subscribeChat(room: string, onInsert: (m: ChatMessage) => void): () => void {
  if (!isConfigured) return () => {};
  const channel = supabase
    .channel(`chat:${room}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${room}` },
      (payload) => onInsert(payload.new as ChatMessage),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ── Mi actividad ────────────────────────────────────────────────────────────────
// Canciones que YO sugerí (para la pantalla "Mi actividad"). Las reservas propias
// se obtienen con getAttendees() + filtro por user_id en la pantalla.
export async function getMySuggestedSongs(userId: string): Promise<Song[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('suggested_by', userId)
    .order('votes_count', { ascending: false });
  if (error || !data) return [];
  return data as Song[];
}

// ── Encuestas (Surveys) ──────────────────────────────────────────────────────────
// Obtiene la encuesta activa y, si userId está provisto, verifica cuál opción votó.
export async function getActiveSurvey(userId?: string | null): Promise<(Survey & { votedOptionId?: string }) | null> {
  if (!isConfigured) return null;
  const { data: survey, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !survey) return null;

  const { data: options } = await supabase
    .from('survey_options')
    .select('*')
    .eq('survey_id', survey.id)
    .order('position');

  const result: Survey & { votedOptionId?: string } = {
    ...(survey as Survey),
    options: (options as SurveyOption[]) ?? [],
  };

  if (userId) {
    const { data: response } = await supabase
      .from('survey_responses')
      .select('option_id')
      .eq('survey_id', survey.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (response) {
      result.votedOptionId = response.option_id;
    }
  }
  return result;
}

// Vota una opción de encuesta. Genera una respuesta única (survey_id, user_id).
export async function voteSurvey(surveyId: string, optionId: string, userId: string): Promise<void> {
  if (!isConfigured) return;
  await supabase
    .from('survey_responses')
    .upsert({ survey_id: surveyId, option_id: optionId, user_id: userId }, { onConflict: 'survey_id,user_id' });
}

// ── Check-in diario (Rachas) ────────────────────────────────────────────────────
export async function dailyCheckIn(): Promise<{ ok: boolean; streak: number | null }> {
  if (!isConfigured) return { ok: false, streak: null };
  const { data, error } = await supabase.rpc('daily_check_in');
  return { ok: !error, streak: (data as number) ?? null };
}

// Obtiene encuestas pasadas inactivas para mostrar en el historial.
export async function getPastSurveys(): Promise<Survey[]> {
  if (!isConfigured) return [];
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('*, survey_options(*)')
    .eq('active', false)
    .order('created_at', { ascending: false })
    .limit(6);
  if (error || !surveys) return [];

  return (surveys as any[]).map((s) => ({
    id: s.id,
    question: s.question,
    active: s.active,
    options: (s.survey_options as SurveyOption[]) ?? [],
  }));
}
