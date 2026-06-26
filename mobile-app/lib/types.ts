// ── Tipos del dominio Nightcore AQP (copia de la web: src/lib/types.ts) ───────
// Mantener en sync con la web. Reflejan las tablas de supabase/schema.sql.
// La app móvil usa las MISMAS tablas, así que comparte los mismos tipos.

export type UserRole = 'user' | 'dj' | 'admin';
export type EventStatus = 'planning' | 'confirmed' | 'paused';
export type RsvpStatus = 'interested' | 'confirmed';
export type VoteType = 'upvote' | 'downvote';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  points: number;
  streak_count: number;
  last_check_in: string | null;
  avatar_url: string | null;
  email?: string;
  is_private?: boolean;
  bio?: string | null;
  tiktok_url?: string | null;
  instagram_url?: string | null;
  bg_url?: string | null;
  accent?: string | null;
}

export interface ProfilePhoto {
  id: string;
  user_id: string;
  url: string;
  caption?: string | null;
  position: number;
  created_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  date: string;
  location: string | null;
  ticket_price: number;
  total_tickets: number;
  available_tickets: number;
  status: EventStatus;
  comments_enabled: boolean;
  flyer_url?: string | null;
  themes?: string | null;
  details?: string | null;
  google_maps_url?: string | null;
  tiktok_urls?: string | null;
  djs?: { name: string; tel?: string; color?: string; bg_url?: string }[];
}

export interface Attendee {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string;
  email: string;
  code: string | null;
  status: RsvpStatus;
  created_at: string;
}

export interface Song {
  id: string;
  event_id: string | null;
  title: string;
  artist: string;
  youtube_url: string;
  genre: string | null;
  geek_tag: string | null;
  suggested_by: string | null;
  suggested_by_name: string | null;
  votes_count: number;
  played: boolean;
  file_url?: string | null;
  userVote?: VoteType | null;
  tags?: string[] | null;
}

export interface EventComment {
  id: string;
  event_id: string;
  user_id: string | null;
  username: string;
  content: string;
  created_at: string;
  flagged?: boolean;
}

export interface Costume {
  id: string;
  event_id: string | null;
  user_id: string | null;
  char_name: string;
  anime: string;
  photo_url: string;
  description: string | null;
  votes_count: number;
  voted?: boolean;
  tags?: string[] | null;
  is_wip?: boolean;
}

export interface SurveyOption {
  id: string;
  survey_id: string;
  text: string;
  position: number;
  votes_count: number;
}

export interface Survey {
  id: string;
  question: string;
  active: boolean;
  options: SurveyOption[];
}

export type ProofStatus = 'pending' | 'approved' | 'rejected';

export interface ChatMessage {
  id: string;
  room: string;
  user_id: string | null;
  username: string;
  content: string;
  hidden?: boolean;
  created_at: string;
}
