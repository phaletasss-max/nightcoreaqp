// ── Sistema de prompts para generación de imágenes (Gemini/Imagen) ───────────
// Envuelve la idea del usuario con la estética scenecore + la paleta del tema
// activo, para que lo generado combine con "los estilos/headers" de la web.
// Lo usa la ruta server /api/generate-image (la idea del usuario nunca pierde el
// estilo del sitio). En inglés porque los modelos de imagen responden mejor así.

export type ImageAspect = 'banner' | 'square' | 'og';

// Paleta dominante por tema (hex de --magenta/--cyan/--lime/--bg de globals.css).
// Mantener en sync con html[data-theme="..."] de src/app/globals.css.
const THEME_PALETTES: Record<string, string> = {
  default:   'hot magenta #ff00ff, electric cyan #00ffff and neon lime #39ff14 over a near-black purple background #0a0a0f',
  pixel:     'pure neon green #00ff66, cyan #00e5ff and magenta #ff00d4 over pitch black #050505 (8-bit arcade)',
  gothic:    'deep crimson #c1121f, muted steel blue #6b8cae and antique gold #c9a227 over charcoal #0a0709 (dark romantic)',
  anime:     'pastel sakura pink #ff6fb5, sky blue #7ec8ff and mint #9bf6c8 over soft dark plum #16101d (kawaii pastel)',
  y2k:       'bubblegum lilac #c774ff, baby blue #6fe0ff and chrome mint #aef5d0 over midnight blue #0b0f1f (Y2K chrome)',
  vaporwave: 'magenta #ff4fd8, aqua #05ffd1 and violet #b967ff over deep mauve #1a0b2e (retro sunset)',
  cyber:     'acid lime #4dff9e, electric cyan #18e0ff and yellow #f6ff45 over blue-black #04070a (cyberpunk terminal)',
};

const ASPECT_HINT: Record<ImageAspect, string> = {
  banner: 'Wide 16:9 banner composition, content spread horizontally.',
  square: '1:1 square composition.',
  og:     'Wide 1200x630 social-share banner composition, balanced and centered.',
};

// Relación de aspecto para modelos tipo Imagen (param aspectRatio).
export const ASPECT_RATIO: Record<ImageAspect, string> = {
  banner: '16:9',
  square: '1:1',
  og:     '16:9',
};

const STYLE_PREAMBLE =
  "Background artwork for a nightcore / scenecore party website. " +
  "Aesthetic: vibrant neon glow, early-2000s scene / Y2K, glossy gradients, subtle checkerboard, " +
  "stars and sparkles, energetic and playful but tasteful. " +
  "Keep it dark and moody enough that white UI text stays readable on top. " +
  "Abstract, seamless, suitable as a section background BEHIND content. " +
  "Absolutely NO text, NO words, NO letters, NO logos, NO watermark, NO UI mockups.";

// Construye el prompt final: estilo + paleta del tema + aspecto + idea del usuario.
export function buildImagePrompt(userIdea: string, theme = 'default', aspect: ImageAspect = 'banner'): string {
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.default;
  const idea = (userIdea || '').trim() || 'abstract neon scenecore background';
  return [
    STYLE_PREAMBLE,
    `Dominant color palette: ${palette}.`,
    ASPECT_HINT[aspect],
    `Theme/subject requested: ${idea}.`,
  ].join(' ');
}

// Presets rápidos que se muestran como chips en el editor (la idea del usuario).
export const PROMPT_PRESETS: { label: string; idea: string }[] = [
  { label: 'Neón abstracto', idea: 'abstract glowing neon waves and light streaks' },
  { label: 'Ciudad cyberpunk', idea: 'rainy neon cyberpunk city skyline at night, bokeh lights' },
  { label: 'Sakura pastel', idea: 'dreamy pastel sky with falling sakura petals and soft clouds' },
  { label: 'Arcade Y2K', idea: 'retro Y2K arcade grid with chrome shapes and starbursts' },
  { label: 'Galaxia', idea: 'deep space nebula with stars and colorful cosmic dust' },
  { label: 'Checkerboard rave', idea: 'tilted checkerboard floor with neon haze and laser beams' },
];
