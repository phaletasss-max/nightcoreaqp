// ── Catálogos de diseño compartidos ──────────────────────────────────────────
// Única fuente de verdad para temas/fuentes/acentos. Los usan:
//   · /admin → Diseño (default del sitio, se guarda en site_settings)
//   · /perfil → "Mi estilo" (override POR USUARIO, se guarda en localStorage)
// Las paletas reales viven en globals.css (html[data-theme="..."]); aquí solo
// están las muestras de la vista previa.

export const THEME_OPTIONS = [
  { key: 'default', label: 'Scenecore', hint: 'Neón morado (base)', colors: ['#ff00ff', '#00ffff', '#39ff14'] },
  { key: 'pixel', label: 'Pixel Arcade', hint: 'Combínalo con la fuente Pixel', colors: ['#00ff66', '#00e5ff', '#ff00d4'] },
  { key: 'gothic', label: 'Gótico', hint: 'Carmesí, plata y carbón', colors: ['#c1121f', '#6b8cae', '#c9a227'] },
  { key: 'anime', label: 'Anime Pastel', hint: 'Sakura, lavanda y menta', colors: ['#ff8fc7', '#b69cff', '#9bf6c8'] },
  { key: 'y2k', label: 'Y2K Chrome', hint: 'Cromo, lila burbuja y celeste', colors: ['#ff6ad5', '#6fe0ff', '#c774ff'] },
  { key: 'vaporwave', label: 'Vaporwave', hint: 'Magenta, cian y violeta', colors: ['#ff71ce', '#05ffd1', '#b967ff'] },
  { key: 'cyber', label: 'Cyber', hint: 'Lima ácida y cian eléctrico', colors: ['#4dff9e', '#18e0ff', '#f6ff45'] },
  { key: 'glitch', label: 'Glitch', hint: 'Corrupción digital: scanlines + RGB split', colors: ['#ff00c8', '#00f0ff', '#39ff88'] },
];

export const FONT_OPTIONS = [
  { key: 'default', label: 'Geist (limpia)' },
  { key: 'pixel', label: 'Pixel / Scene' },
  { key: 'rounded', label: 'Redondeada / Happycore' },
  { key: 'mono', label: 'Monoespaciada' },
  { key: 'vt323', label: 'Terminal (VT323)' },
  { key: 'orbitron', label: 'Orbitron (cyber)' },
  { key: 'bungee', label: 'Bungee (Y2K)' },
  { key: 'rajdhani', label: 'Rajdhani' },
];

// Fuente del CUERPO (las "letras"). Mantén legibilidad: las pixeladas cansan en texto largo.
export const BODY_FONT_OPTIONS = [
  { key: 'default', label: 'Geist (limpia)' },
  { key: 'rounded', label: 'Baloo 2 (redonda)' },
  { key: 'poppins', label: 'Poppins' },
  { key: 'nunito', label: 'Nunito' },
  { key: 'comic', label: 'Comic Neue' },
  { key: 'rajdhani', label: 'Rajdhani' },
  { key: 'mono', label: 'Monoespaciada' },
  { key: 'vt323', label: 'Terminal (VT323)' },
];

// Color de acento (token sobre el tema). '' = usar el del tema.
export const ACCENT_OPTIONS = [
  { key: '', label: 'Del tema', color: 'transparent' },
  { key: '#ff00ff', label: 'Magenta', color: '#ff00ff' },
  { key: '#00ffff', label: 'Cian', color: '#00ffff' },
  { key: '#39ff14', label: 'Lima', color: '#39ff14' },
  { key: '#ff2d8f', label: 'Rosa', color: '#ff2d8f' },
  { key: '#9933ff', label: 'Morado', color: '#9933ff' },
  { key: '#fff01f', label: 'Amarillo', color: '#fff01f' },
];

// ── Overrides de diseño POR USUARIO ──────────────────────────────────────────
// El admin define el default global (site_settings). Cada usuario puede pisar
// ESTAS claves solo para él; el resto (colores a medida, opacidades, secciones)
// sigue siendo del admin. Se guarda en localStorage por id de usuario, así
// funciona igual con Supabase o en modo demo.
export const USER_DESIGN_KEYS = [
  'design_theme',
  'design_accent',
  'design_font',
  'design_body_font',
  'design_font_scale',
] as const;

export type UserDesign = Partial<Record<(typeof USER_DESIGN_KEYS)[number], string>>;

const userDesignKey = (userId: string | null | undefined) => `nq_user_design_${userId || 'guest'}`;

export function getUserDesign(userId: string | null | undefined): UserDesign {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(userDesignKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    // Solo claves permitidas (por si quedó algo viejo guardado).
    const clean: UserDesign = {};
    for (const k of USER_DESIGN_KEYS) if (parsed[k]) clean[k] = parsed[k];
    return clean;
  } catch { return {}; }
}

export function setUserDesign(userId: string | null | undefined, design: UserDesign): void {
  if (typeof window === 'undefined') return;
  try {
    const clean: Record<string, string> = {};
    for (const k of USER_DESIGN_KEYS) if (design[k]) clean[k] = design[k]!;
    if (Object.keys(clean).length === 0) localStorage.removeItem(userDesignKey(userId));
    else localStorage.setItem(userDesignKey(userId), JSON.stringify(clean));
    // DesignLoader escucha esto y re-aplica el merge default+usuario en vivo.
    window.dispatchEvent(new CustomEvent('nq-user-design-updated'));
  } catch { /* ignorar */ }
}
