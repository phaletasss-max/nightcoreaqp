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
  click?: boolean;   // además de resaltar, hacer clic (ej. abrir una pestaña del panel)
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
    keys: ['consola dj', 'panel dj', 'ir a dj', 'gestion de dj', 'gestión de dj', 'gestionar dj', 'gestion dj', 'cabina', 'setlist', 'crate'],
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

// Secciones (pestañas) del panel /admin. Solo se ofrecen si el usuario ES admin.
// El botón navega a /admin, RESALTA la pestaña y la ABRE (click).
interface AdminTab { keys: string[]; tab: string; label: string; reply: string }
const ADMIN_TABS: AdminTab[] = [
  { keys: ['metrica', 'métrica', 'kpi', 'estadistica', 'estadística', 'analitica', 'analítica'], tab: 'kpi', label: 'Ver Métricas →', reply: 'Panel → Métricas 📊 asistentes, eventos, temas y votos en vivo.' },
  { keys: ['usuario', 'miembros', 'cuentas', 'lista de usuario', 'ver usuario', 'cambiar rol', 'gestionar rol', 'asignar rol', 'dar dj', 'dar admin', 'promover'], tab: 'users', label: 'Ver Usuarios →', reply: 'Panel → Usuarios 👥 ahí ves a todos, cambias roles (DJ/Admin) y gestionas cuentas.' },
  { keys: ['evento', 'crear evento', 'editar evento', 'gestionar evento', 'nuevo evento', 'agenda'], tab: 'events', label: 'Gestionar Eventos →', reply: 'Panel → Eventos 🎟️ crea, edita y publica los eventos del club.' },
  { keys: ['gestionar encuesta', 'crear encuesta', 'lanzar encuesta', 'administrar encuesta', 'nueva encuesta'], tab: 'survey', label: 'Gestionar Encuestas →', reply: 'Panel → Encuestas 🗳️ lanza y administra las encuestas de la comunidad.' },
  { keys: ['gestionar disfra', 'moderar disfra', 'administrar disfra', 'disfraces del panel'], tab: 'posts', label: 'Moderar Disfraces →', reply: 'Panel → Disfraces 👗 revisa y modera los cosplays subidos.' },
  { keys: ['comentario', 'moderar comentario', 'gestionar comentario'], tab: 'comments', label: 'Moderar Comentarios →', reply: 'Panel → Comentarios 💬 revisa, aprueba o elimina comentarios.' },
  { keys: ['insignia', 'prueba de asistencia', 'aprobar asistencia', 'validar asistencia', 'constancia'], tab: 'proofs', label: 'Ver Insignias →', reply: 'Panel → Insignias 🏅 aprueba las pruebas de asistencia de los usuarios.' },
  { keys: ['buzon', 'buzón', 'bandeja', 'sugerencias recibidas', 'reportes recibidos'], tab: 'buzon', label: 'Abrir Buzón →', reply: 'Panel → Buzón 📩 lee las sugerencias y reportes que envía la gente.' },
  { keys: ['bloque', 'contenido personalizado', 'anuncio', 'banner', 'sets del dj', 'set del dj'], tab: 'bloques', label: 'Editar Bloques →', reply: 'Panel → Bloques 🧩 crea anuncios, enlaces, imágenes y sets del DJ para la home.' },
  { keys: ['diseño', 'diseno', 'apariencia', 'tema del sitio', 'fondos', 'personalizar el sitio', 'colores del sitio', 'video de fondo'], tab: 'design', label: 'Ir a Diseño →', reply: 'Panel → Diseño 🎨 tema, colores, fuentes y videos de fondo del sitio.' },
];

// Guías "cómo hago X" del panel (pasos reales, sin inventar). Se revisan ANTES
// que ADMIN_TABS porque son más específicas. Cada una lleva a la pestaña correcta.
interface AdminHowto { keys: string[]; reply: string; button: NeonButton }
const TAB = (tab: string, label: string): NeonButton => ({ label, route: '/admin', target: `tab-${tab}`, click: true });
const ADMIN_HOWTO: AdminHowto[] = [
  {
    keys: ['como cambiar rol', 'cómo cambiar rol', 'como cambiar el rol', 'como dar dj', 'como dar admin', 'como hacer admin', 'como hacer dj', 'como promover', 'como asignar rol', 'como dar rol'],
    reply: 'En Usuarios: busca la fila de la persona y usa el selector de rol (Usuario / DJ / Admin).\n• DJ es directo.\n• ADMIN te pedirá la credencial especial.\nTodo cambio queda registrado en la auditoría.',
    button: TAB('users', 'Ver Usuarios →'),
  },
  {
    keys: ['como crear evento', 'cómo crear evento', 'como hacer un evento', 'como publicar evento', 'como editar evento', 'crear un evento', 'nuevo evento'],
    reply: 'En Eventos: pulsa «Nuevo evento», completa título, fecha, lugar y entradas, y guarda.\nCambia el estado a «Confirmado» para que aparezca en la home con su cuenta regresiva.',
    button: TAB('events', 'Gestionar Eventos →'),
  },
  {
    keys: ['como lanzar encuesta', 'como crear encuesta', 'cómo crear encuesta', 'como hacer encuesta', 'nueva encuesta'],
    reply: 'En Encuestas: escribe la pregunta y las opciones y pulsa «Lanzar».\nLa nueva encuesta reemplaza a la que estaba activa.',
    button: TAB('survey', 'Gestionar Encuestas →'),
  },
  {
    keys: ['como aprobar asistencia', 'como validar asistencia', 'como dar insignia', 'como aprobar insignia', 'como validar insignia', 'aprobar prueba'],
    reply: 'En Insignias: cada usuario sube su prueba de asistencia. Revísala y pulsa «Aprobar» o «Rechazar».\nAl aprobar, se le otorga la insignia del evento.',
    button: TAB('proofs', 'Ver Insignias →'),
  },
  {
    keys: ['como moderar comentario', 'como borrar comentario', 'como aprobar comentario', 'como eliminar comentario', 'moderar comentarios'],
    reply: 'En Comentarios: los marcados salen censurados hasta que los revises.\nPulsa «Aprobar» para mostrarlos, o «Eliminar» para borrarlos.',
    button: TAB('comments', 'Moderar Comentarios →'),
  },
  {
    keys: ['como crear bloque', 'como publicar set', 'como poner anuncio', 'como hacer un bloque', 'como añadir bloque', 'como agregar bloque', 'set del dj'],
    reply: 'En Bloques: pulsa «Nuevo bloque», elige el tipo (anuncio / enlace / imagen / video) y la sección (Home o «Sets del DJ»), y guárdalo. Puedes reordenarlos y ocultarlos.',
    button: TAB('bloques', 'Editar Bloques →'),
  },
  {
    keys: ['como cambiar el fondo', 'como cambiar diseño', 'como cambiar diseno', 'como poner video de fondo', 'como cambiar el tema', 'como cambiar colores', 'como personalizar el sitio'],
    reply: 'En Diseño: elige tema, colores y fuentes.\nEn «Videos de fondo por página» subes o pegas un video y eliges dónde se ve (una página, varias o todas).',
    button: TAB('design', 'Ir a Diseño →'),
  },
  {
    keys: ['como publicar la playlist', 'como marcar cancion', 'como marcar canción', 'como limpiar la cola', 'como vaciar la cola', 'marcar tocada'],
    reply: 'En la Consola DJ: tienes el setlist más votado. Marca canciones como «tocadas», descarga el crate (.bat) o vacía la cola cuando termines.',
    button: { label: 'Ir a Consola DJ →', route: '/dj' },
  },
];

// Normaliza: minúsculas + quita artículos/preposiciones que la gente intercala
// ("cambiar UN rol", "ver LOS usuarios", "gestión DE dj") para que el match sea
// robusto. Se aplica al texto Y a cada clave, así ambas quedan consistentes.
const STOPWORDS = new Set(['un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las', 'de', 'del', 'al', 'mi', 'mis', 'tu', 'tus']);
function normalize(s: string): string {
  return s.toLowerCase().trim().split(/\s+/).filter((w) => !STOPWORDS.has(w)).join(' ');
}

function hasKey(text: string, keys: string[]): boolean {
  return keys.some((k) => text.includes(normalize(k)));
}

export function matchNeonAction(
  raw: string,
  opts: { isStaff: boolean; isAdmin: boolean },
): NeonActionResult | null {
  const text = normalize(raw);
  if (!text) return null;

  // 1) Intenciones de rol (no dan acceso).
  for (const r of ROLE_INTENTS) {
    if (hasKey(text, r.keys)) return { reply: r.reply };
  }

  // 1.5) Panel admin — SOLO si el usuario es admin. Primero las guías "cómo hago
  // X" (pasos), luego las secciones. Navegan a /admin, abren y resaltan la pestaña.
  if (opts.isAdmin) {
    for (const h of ADMIN_HOWTO) {
      if (hasKey(text, h.keys)) return { reply: h.reply, button: h.button };
    }
    for (const t of ADMIN_TABS) {
      if (hasKey(text, t.keys)) {
        return { reply: t.reply, button: { label: t.label, route: '/admin', target: `tab-${t.tab}`, click: true } };
      }
    }
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
