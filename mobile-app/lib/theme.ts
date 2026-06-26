// ── Tema base oscuro scenecore (móvil) ───────────────────────────────────────
// Espejo de los tokens neón de la web (globals.css preset "default"). La app móvil
// arranca con el tema oscuro por defecto; más adelante se puede leer el tema del
// usuario desde site_settings, igual que DesignLoader en la web.

export const theme = {
  // Superficies
  bg: '#0a0410',
  surface: '#110818',
  surface2: '#19101f',
  border: 'rgba(255, 0, 255, 0.16)',

  // Texto
  text: '#f5f0ff',
  muted: '#b9a9c9',
  muted2: '#7a6b88',

  // Neón (scenecore)
  magenta: '#ff00ff',
  cyan: '#00ffff',
  lime: '#39ff14',
  pink: '#ff2d8f',
  purple: '#9933ff',
  yellow: '#fff01f',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export type Theme = typeof theme;
