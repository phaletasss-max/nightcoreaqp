// ── Videos de fondo por página (gestor del admin) ───────────────────────────
// El admin sube un video (o pega una URL) y elige EN QUÉ PÁGINAS se muestra:
// una, varias o todas. Se guarda en site_settings bajo la clave
// `design_page_videos` como JSON { pageKey: url }. La clave especial 'all'
// aplica a todas las páginas (una específica la pisa).
// Render: PageVideoManager (global, en el layout). GlobalPlayer usa
// resolvePageVideo para ocultar su fondo idle donde haya video de página.

export const PAGE_VIDEO_KEY = 'design_page_videos';

export const PAGE_OPTIONS: { key: string; path: string; label: string }[] = [
  { key: 'all', path: '*', label: 'Todas las páginas' },
  { key: 'home', path: '/', label: 'Inicio / Eventos' },
  { key: 'playlist', path: '/playlist', label: 'Playlist' },
  { key: 'chat', path: '/chat', label: 'Chat' },
  { key: 'sugerencias', path: '/sugerencias', label: 'Buzón' },
  { key: 'disfraces', path: '/disfraces', label: 'Disfraces' },
  { key: 'history', path: '/history', label: 'Historial' },
  { key: 'descargas', path: '/perfil/descargas', label: 'Descargas' },
  { key: 'encuestas', path: '/encuestas', label: 'Encuestas' },
  { key: 'perfil', path: '/perfil', label: 'Perfil' },
  { key: 'dj', path: '/dj', label: 'Panel DJ' },
];

// Default de fábrica (si el admin nunca configuró nada): el video glitch en
// Playlist, como quedó tras el rebrand. El admin puede quitarlo desde su panel.
export const DEFAULT_PAGE_VIDEOS: Record<string, string> = {
  playlist: '/section-glitch.mp4',
};

export function parsePageVideos(raw: string | undefined | null): Record<string, string> {
  if (raw === undefined || raw === null || raw === '') return { ...DEFAULT_PAGE_VIDEOS };
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch { /* JSON corrupto → default */ }
  return { ...DEFAULT_PAGE_VIDEOS };
}

// URL del video que toca en esta ruta (o null). Una página específica pisa 'all'.
export function resolvePageVideo(pathname: string, config: Record<string, string>): string | null {
  const page = PAGE_OPTIONS.find((p) => p.path !== '*' && (
    p.path === '/' ? pathname === '/' : pathname === p.path
  ));
  if (page && config[page.key]) return config[page.key];
  if (config.all) return config.all;
  return null;
}
