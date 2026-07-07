// ── Datos demo ───────────────────────────────────────────────────────────────
// Se usan cuando Supabase NO está configurado, para que la app sea navegable
// sin backend. Vacíos por defecto: los datos reales se cargan desde Supabase.

import type { EventItem, Song, Survey, Costume, EventComment, Theme } from './types';

// Primer evento real: Nightcore Fest 2.0 — Cyberpunk
export const DEMO_EVENTS: EventItem[] = [
  {
    id: 'nf2-cyberpunk-2026',
    title: 'Nightcore Fest 2.0 — Cyberpunk',
    tagline: '¡Vive la fiesta, que no te lo cuenten… VÍVELO! 🚀🔥',
    description:
      'Segunda edición del Nightcore Fest con temática CYBERPUNK. ' +
      'DJs: DJ Lobito (946 388 627), DJ Matt (944 506 957), DJ Mely (951 710 227). ' +
      '10 horas de música Nightcore. Corcho libre hasta las 8 PM. ' +
      'Shots a los primeros en llegar. Cóctel gratis si vienes con cosplay. ' +
      '1 sellada al grupo más grande. ¡Reclama tu cóctel gratis si vienes con cosplay!',
    date: '2026-07-12T17:00:00-05:00',
    location: 'LUXX Club × Ember — A 1 cuadra y ½ de la Plaza de Armas, Arequipa',
    ticket_price: 0,
    total_tickets: 200,
    available_tickets: 200,
    status: 'confirmed',
    comments_enabled: true,
    flyer_url: '/nightcorefest2.0.webp',
    themes: 'Cyberpunk, Nightcore, Eurobeat',
    details: 'Shots gratis a los primeros en llegar, Cóctel gratis si vienes con cosplay, 1 sellada al grupo más grande, 10 horas de música Nightcore, Pedidos musicales a los DJs por WhatsApp',
    google_maps_url: 'https://maps.app.goo.gl/3NxsEokKjU8ZfBfW6',
    tiktok_urls: 'https://www.tiktok.com/@e1iseq/video/7523708643997388087',
  },
];

export const DEMO_SONGS: Song[] = [];
export const DEMO_SURVEY: Survey = {
  id: 'p-empty',
  question: '¿Qué temática quieres para el Nightcore Fest 3.0?',
  active: true,
  options: [
    { id: 'o-1', survey_id: 'p-empty', text: 'Anime Clásico (Naruto, Bleach, Death Note)', position: 0, votes_count: 0 },
    { id: 'o-2', survey_id: 'p-empty', text: 'Vocaloid / Hatsune Miku', position: 1, votes_count: 0 },
    { id: 'o-3', survey_id: 'p-empty', text: 'Gaming (FNAF, Undertale, Minecraft)', position: 2, votes_count: 0 },
    { id: 'o-4', survey_id: 'p-empty', text: 'Emo / Scene / Visual Kei', position: 3, votes_count: 0 },
  ],
};

export const DEMO_COSTUMES: Costume[] = [];
export const DEMO_COMMENTS: EventComment[] = [];
export const DEMO_THEMES: Theme[] = [];
export const DEMO_LEADERBOARD: { rank: number; name: string; points: number }[] = [];
