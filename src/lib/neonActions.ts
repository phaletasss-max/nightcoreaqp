// ── Acciones guiadas de NΞON ─────────────────────────────────────────────────
// Detecta intenciones del usuario ("quiero subir mi disfraz") y devuelve una
// respuesta + (opcional) un botón que NAVEGA a la ruta y RESALTA el elemento
// clave (data-neon-target) para guiar dónde hacer clic.
//
// SEGURIDAD: NΞON nunca otorga permisos. El rol solo decide si MUESTRA el botón
// o explica que no puede dar acceso. La autorización real es la RLS de Supabase.

export interface NeonButton {
  label: string;
  route: string;
  target?: string;   // data-neon-target a resaltar tras navegar (opcional)
}

export interface NeonActionResult {
  reply: string;
  button?: NeonButton;
}

interface Rule {
  keys: string[];
  requires?: 'staff' | 'admin';   // permiso para MOSTRAR el botón
  reply: string;                  // respuesta normal (o para staff/admin)
  blocked?: string;               // respuesta si NO cumple el permiso (sin botón)
  button?: NeonButton;
}

// Intenciones de rol (no dan acceso, solo explican). Se revisan PRIMERO.
const ROLE_INTENTS: Rule[] = [
  {
    keys: ['quiero ser dj', 'como ser dj', 'cómo ser dj', 'ser dj', 'quiero dj', 'hazme dj', 'darme dj'],
    reply: 'No puedo darte el rol de DJ — eso lo decide un administrador. Si aportas buena música/contenido, pídele a un admin que te promueva desde el panel. Yo te aviso cuando tu frecuencia suba 🎧',
  },
  {
    keys: ['quiero ser admin', 'ser administrador', 'como ser admin', 'cómo ser admin', 'quiero admin', 'hazme admin', 'darme admin'],
    reply: 'Ser administrador requiere una credencial especial que solo tiene el dueño del proyecto. No puedo dártela ni gestionarla 🔒',
  },
];

// Acciones con navegación. El orden importa (primero las más específicas).
const ACTIONS: Rule[] = [
  {
    // 'disfra' cubre disfraz/disfraces/disfrazar (en español el plural cambia z→c).
    keys: ['disfra', 'cosplay', 'concurso'],
    reply: 'Te llevo a Disfraces 📸 Pulsa «Subir disfraz» (te lo dejo resaltado) y sube tu foto de cosplay.',
    button: { label: 'Ir a Disfraces →', route: '/disfraces', target: 'subir-disfraz' },
  },
  {
    // 'descarg' cubre descargar/descarga/descargas/descargador. Va antes que
    // Playlist para que "descargar canción" mande a Descargas, no a Playlist.
    keys: ['descarg', 'mp3', 'mp4', 'bajar cancion', 'bajar canción', 'bajar musica', 'bajar música'],
    reply: 'Zona de descargas ⬇️ Pega el link, elige MP3 o MP4 y descarga a tu equipo.',
    button: { label: 'Ir a Descargas →', route: '/perfil/descargas' },
  },
  {
    // 'cancion'/'cancione' cubre canción/canciones; 'sugeri' cubre sugerir/sugiere.
    keys: ['cancion', 'canción', 'cancione', 'playlist', 'sugeri una', 'sugeri can', 'tema musical'],
    reply: 'A la Playlist 🎧 Toca «Sugerir canción» (te lo resalto) y pega el link de YouTube.',
    button: { label: 'Ir a Playlist →', route: '/playlist', target: 'sugerir-cancion' },
  },
  {
    keys: ['reserv', 'entrada', 'asistir', 'rsvp', 'boleto', 'ticket'],
    reply: 'Al inicio 🎟️ Reserva tu entrada para el próximo evento (te resalto el botón).',
    button: { label: 'Ir al evento →', route: '/', target: 'reservar' },
  },
  {
    keys: ['encuesta', 'votar', 'reto', 'racha', 'check-in', 'checkin', 'daily'],
    reply: 'A Encuestas ⚡ Vota y haz tu check-in diario para subir tu racha.',
    button: { label: 'Ir a Encuestas →', route: '/encuestas' },
  },
  {
    keys: ['chat', 'conversar', 'comunidad', 'hablar con la gente'],
    reply: 'Al Chat de la comunidad 💬 ¡Saluda!',
    button: { label: 'Ir al Chat →', route: '/chat' },
  },
  {
    keys: ['mi perfil', 'perfil', 'mis puntos', 'mis insignias', 'avatar', 'personalizar'],
    reply: 'Tu Perfil 🟣 racha, puntos, insignias y personalización.',
    button: { label: 'Ir a mi Perfil →', route: '/perfil' },
  },
  {
    keys: ['sugerencia', 'buzon', 'buzón', 'denuncia', 'reportar', 'reclamo', 'queja'],
    reply: 'Al Buzón 📩 Deja tu sugerencia o reporte (anónimo si quieres).',
    button: { label: 'Ir al Buzón →', route: '/sugerencias' },
  },
  {
    keys: ['consola dj', 'panel dj', 'ir a dj', 'cabina', 'setlist', 'crate'],
    requires: 'staff',
    reply: 'Consola DJ lista 🎛️ ahí tienes el setlist más votado y el crate de descarga.',
    blocked: 'La Consola DJ es solo para DJs, y yo no puedo darte ese acceso. Un administrador debe asignarte el rol DJ desde el panel.',
    button: { label: 'Ir a Consola DJ →', route: '/dj' },
  },
  {
    keys: ['panel admin', 'administrar', 'ruta admin', 'ir a admin', 'administracion', 'administración', 'gestionar usuarios', 'cambiar roles', 'panel de control'],
    requires: 'admin',
    reply: 'Panel de administración 🛠️ desde ahí gestionas eventos, usuarios, diseño, encuestas y más.',
    blocked: 'El panel de administración es solo para administradores. No puedo darte acceso ni llevarte ahí; esa zona la controla el dueño del proyecto.',
    button: { label: 'Ir al Panel →', route: '/admin' },
  },
];

function hasKey(text: string, keys: string[]): boolean {
  return keys.some((k) => text.includes(k));
}

export function matchNeonAction(
  raw: string,
  opts: { isStaff: boolean; isAdmin: boolean },
): NeonActionResult | null {
  const text = raw.toLowerCase().trim();
  if (!text) return null;

  // 1) Intenciones de rol (no dan acceso).
  for (const r of ROLE_INTENTS) {
    if (hasKey(text, r.keys)) return { reply: r.reply };
  }

  // 2) Acciones con navegación (respetando permisos).
  for (const a of ACTIONS) {
    if (!hasKey(text, a.keys)) continue;
    const allowed =
      !a.requires ||
      (a.requires === 'admin' && opts.isAdmin) ||
      (a.requires === 'staff' && opts.isStaff);
    if (allowed) return { reply: a.reply, button: a.button };
    return { reply: a.blocked ?? 'No tienes acceso a esa zona.' };
  }

  return null;
}
