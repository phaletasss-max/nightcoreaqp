// ── Datos demo ───────────────────────────────────────────────────────────────
// Se usan cuando Supabase NO está configurado, para que la app sea navegable
// sin backend. Reflejan supabase/seed.sql.

import type { EventItem, Song, Survey, Costume, EventComment, Theme } from './types';

export const DEMO_EVENTS: EventItem[] = [
  {
    id: 'e1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    title: 'Nightcore Nexus V1',
    tagline: 'Anime, eurobeat y nightcore en Arequipa',
    description:
      'Una noche de visuales cyberpunk, remixes acelerados de tus canciones de anime favoritas y un setlist comandado por los DJs de la escena local.',
    date: '2026-07-18T20:00:00-05:00',
    location: 'Casona San Francisco 308, Centro Histórico, Arequipa',
    ticket_price: 15,
    total_tickets: 150,
    available_tickets: 27,
    status: 'confirmed',
    comments_enabled: true,
  },
  {
    id: 'e2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
    title: 'Nightcore Friki Fest',
    tagline: 'Edición especial · Miku · FNAF · Cultura geek',
    description:
      'Nuestra próxima gran fecha temática: concurso de disfraces, cabina cyberpunk con visuales de Vocaloid y animatrónicos, y playbacks en vivo.',
    date: '2026-08-25T18:00:00-05:00',
    location: 'Por confirmar (Arequipa)',
    ticket_price: 12,
    total_tickets: 200,
    available_tickets: 200,
    status: 'planning',
    comments_enabled: true,
  },
];

export const DEMO_SONGS: Song[] = [
  { id: 's1', event_id: DEMO_EVENTS[0].id, title: 'Caramelldansen (Swedish Original)', artist: 'Caramella Girls', youtube_url: 'https://www.youtube.com/watch?v=A67GrVdEg94', genre: 'Nightcore Classics', geek_tag: 'Dance', suggested_by: null, suggested_by_name: 'MikuFan_AQP', votes_count: 98, played: false, userVote: null },
  { id: 's2', event_id: DEMO_EVENTS[0].id, title: 'Idol (アイドル)', artist: 'YOASOBI', youtube_url: 'https://www.youtube.com/watch?v=ZRtdQ81jPUQ', genre: 'Anime Eurobeat', geek_tag: 'Anime', suggested_by: null, suggested_by_name: 'OshiNoKo_Lover', votes_count: 87, played: false, userVote: null },
  { id: 's3', event_id: DEMO_EVENTS[0].id, title: 'Ева — Винтаж (Dante Dance Song)', artist: 'Vintage (DMC Speedup)', youtube_url: 'https://www.youtube.com/watch?v=5gU966a3Bik', genre: 'Eurobeat Speedup', geek_tag: 'Gaming', suggested_by: null, suggested_by_name: 'Dante_Slayer', votes_count: 76, played: false, userVote: null },
  { id: 's4', event_id: DEMO_EVENTS[0].id, title: 'FRIENDS', artist: 'Marshmello & Anne-Marie (Speedup)', youtube_url: 'https://www.youtube.com/watch?v=jzD_yyEw0M4', genre: 'Nightcore Pop', geek_tag: 'Pop', suggested_by: null, suggested_by_name: 'Friendzone_Hero', votes_count: 65, played: false, userVote: null },
  { id: 's5', event_id: DEMO_EVENTS[0].id, title: "Five Nights at Freddy's 2 Song", artist: 'The Living Tombstone', youtube_url: 'https://www.youtube.com/watch?v=d1wK9FzN96w', genre: 'Creepy Synthwave', geek_tag: 'FNAF', suggested_by: null, suggested_by_name: 'Foxy_BiteOf87', votes_count: 59, played: false, userVote: 'upvote' },
  { id: 's6', event_id: DEMO_EVENTS[0].id, title: 'Stronger Than You — Chara Response', artist: 'Undertale Parody', youtube_url: 'https://www.youtube.com/watch?v=co5Zo6Ng9-c', genre: 'Chiptune Remix', geek_tag: 'Undertale', suggested_by: null, suggested_by_name: 'Sans_Undertale', votes_count: 48, played: false, userVote: null },
  { id: 's7', event_id: DEMO_EVENTS[0].id, title: 'Creeper vs Zombie (1 Millón)', artist: 'Zarcort & Kronno Zomber', youtube_url: 'https://www.youtube.com/watch?v=5m288qNNDw0', genre: 'Geek Rap', geek_tag: 'Minecraft', suggested_by: null, suggested_by_name: 'Fernanfloo_Fan', votes_count: 43, played: false, userVote: null },
];

export const DEMO_SURVEY: Survey = {
  id: 'p1',
  question: '¿Qué día prefieres para el próximo evento de Nightcore AQP?',
  active: true,
  options: [
    { id: 'o1', survey_id: 'p1', text: 'Viernes por la noche', position: 0, votes_count: 85 },
    { id: 'o2', survey_id: 'p1', text: 'Sábado por la noche', position: 1, votes_count: 221 },
    { id: 'o3', survey_id: 'p1', text: 'Domingo por la tarde', position: 2, votes_count: 36 },
  ],
};

export const DEMO_COSTUMES: Costume[] = [
  { id: 'c1', event_id: DEMO_EVENTS[0].id, user_id: null, char_name: 'Misa Amane', anime: 'Death Note', photo_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80', description: 'Armé el outfit gótico completo para el evento pasado.', votes_count: 74, voted: false, comments: [] },
  { id: 'c2', event_id: DEMO_EVENTS[0].id, user_id: null, char_name: 'Ken Kaneki', anime: 'Tokyo Ghoul', photo_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80', description: 'Cosplay versión battle. La máscara la hice yo mismo.', votes_count: 53, voted: false, comments: [] },
  { id: 'c3', event_id: DEMO_EVENTS[0].id, user_id: null, char_name: 'Cyberpunk DJ', anime: 'Original', photo_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80', description: 'DJ futurista con luces LED al ritmo del nightcore.', votes_count: 31, voted: true, comments: [] },
];

export const DEMO_COMMENTS: EventComment[] = [];

export const DEMO_THEMES: Theme[] = [
  { id: 't1', name: 'Hatsune Miku / Vocaloid', suggested_by: null, suggested_by_name: 'MikuFan_AQP', clicks: 142 },
  { id: 't2', name: 'FNAF / Horror', suggested_by: null, suggested_by_name: 'Foxy_BiteOf87', clicks: 118 },
  { id: 't3', name: 'Caramelldansen / Meme', suggested_by: null, suggested_by_name: 'Kawaii_Neko', clicks: 97 },
  { id: 't4', name: 'Undertale', suggested_by: null, suggested_by_name: 'Sans_Undertale', clicks: 85 },
  { id: 't5', name: 'Minecraft / Gamer', suggested_by: null, suggested_by_name: 'Fernanfloo_Fan', clicks: 73 },
  { id: 't6', name: 'Cyberpunk / Edgerunners', suggested_by: null, suggested_by_name: 'CyberDJ_99', clicks: 64 },
  { id: 't7', name: 'Evangelion', suggested_by: null, suggested_by_name: 'Asuka_S2', clicks: 51 },
  { id: 't8', name: 'Jujutsu Kaisen', suggested_by: null, suggested_by_name: 'Magic_Mash', clicks: 38 },
];

export const DEMO_LEADERBOARD = [
  { rank: 1, name: 'Yukari_01', points: 1530 },
  { rank: 2, name: 'DJ_Haru', points: 1420 },
  { rank: 3, name: 'Kaito_99', points: 1250 },
];
