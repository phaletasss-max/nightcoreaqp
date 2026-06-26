// ── Capa de datos (móvil) ─────────────────────────────────────────────────────
// Lectores de solo-lectura contra la MISMA base de Supabase que la web. A diferencia
// de la web, el móvil NO tiene modo demo localStorage: si no hay credenciales
// (`isConfigured` false), las funciones devuelven [] / null y la UI muestra un aviso.
//
// IMPORTANTE: este archivo es independiente del de la web (`src/lib/data.ts`); no
// se importa código de `src/`. Mantener las consultas alineadas con la RLS.

import { supabase, isConfigured } from './supabase';
import type { EventItem, Song } from './types';

// Evento "activo": el confirmado, o el más próximo por fecha (igual criterio que la web).
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

// Playlist: canciones más votadas (las no tocadas primero).
export async function getSongs(): Promise<Song[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('votes_count', { ascending: false });
  if (error || !data) return [];
  return data as Song[];
}
