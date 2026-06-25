'use client';

// ── DesignLoader (Fase B) ────────────────────────────────────────────────────
// Aplica los ajustes de diseño que el admin gestiona desde /admin → Diseño.
// Lee de site_settings (vía getSiteSettings) y aplica al <html>:
//   · design_card_opacity → variable CSS --card-opacity (opacidad de .card)
//   · design_font         → atributo data-font (fuente de títulos) + carga la web font
//   · design_overlay      → opacidad de una capa oscura sobre el fondo general
// Cachea en localStorage para aplicar al instante (sin parpadeo) y se re-aplica
// en vivo cuando el admin guarda (evento 'nq-design-updated').

import { useEffect, useState } from 'react';
import { getSiteSettings } from '@/lib/data';

const CACHE_KEY = 'nq_design_cache';

// Carga dinámica de fuentes web solo cuando se eligen (no penaliza por defecto).
// El mismo catálogo sirve para títulos (data-font) y cuerpo (data-bodyfont).
const FONT_HREFS: Record<string, string> = {
  pixel: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  rounded: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap',
  vt323: 'https://fonts.googleapis.com/css2?family=VT323&display=swap',
  orbitron: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap',
  bungee: 'https://fonts.googleapis.com/css2?family=Bungee&display=swap',
  rajdhani: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap',
  poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap',
  nunito: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800&display=swap',
  comic: 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap',
};

function ensureFontLink(font: string) {
  if (typeof document === 'undefined') return;
  const href = FONT_HREFS[font];
  if (!href) return; // default / mono no necesitan link
  const id = `nq-font-${font}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// Hex (#rrggbb) → "r, g, b" para alimentar --card-rgb (las tarjetas usan rgba(var(--card-rgb), …)).
function hexToRgbTriple(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function applyDesign(s: Record<string, string>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const font = s.design_font || 'default';
  if (font && font !== 'default') {
    root.setAttribute('data-font', font);
    ensureFontLink(font);
  } else {
    root.removeAttribute('data-font');
  }

  // Fuente del cuerpo ("las letras"). data-bodyfont lo lee globals.css.
  const bodyFont = s.design_body_font || 'default';
  if (bodyFont && bodyFont !== 'default') {
    root.setAttribute('data-bodyfont', bodyFont);
    ensureFontLink(bodyFont);
  } else {
    root.removeAttribute('data-bodyfont');
  }

  // Tamaño de letra global (escala el UI proporcionalmente).
  if (s.design_font_scale) root.style.setProperty('--font-scale', s.design_font_scale);
  else root.style.removeProperty('--font-scale');

  // Colores a medida (sobre el tema). Vacío = se usa el del tema.
  if (s.design_color_bg) root.style.setProperty('--background', s.design_color_bg);
  else root.style.removeProperty('--background');

  if (s.design_color_surface) {
    root.style.setProperty('--surface', s.design_color_surface);
    root.style.setProperty('--surface-2', s.design_color_surface);
    const rgb = hexToRgbTriple(s.design_color_surface);
    if (rgb) root.style.setProperty('--card-rgb', rgb); // que las tarjetas sigan la superficie
  } else {
    root.style.removeProperty('--surface');
    root.style.removeProperty('--surface-2');
    root.style.removeProperty('--card-rgb');
  }

  if (s.design_color_text) root.style.setProperty('--foreground', s.design_color_text);
  else root.style.removeProperty('--foreground');

  // Tema visual (paleta + superficies) → data-theme en <html>. Los bloques
  // html[data-theme="..."] de globals.css recolorean toda la app.
  const theme = s.design_theme || 'default';
  if (theme && theme !== 'default') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');

  // Color de acento (token): tiñe el primario por encima del tema. Vacío = el del tema.
  if (s.design_accent) {
    root.style.setProperty('--magenta', s.design_accent);
    root.style.setProperty('--pink', s.design_accent);
  } else {
    root.style.removeProperty('--magenta');
    root.style.removeProperty('--pink');
  }

  if (s.design_card_opacity) root.style.setProperty('--card-opacity', s.design_card_opacity);
  else root.style.removeProperty('--card-opacity');

  if (s.design_radius) root.style.setProperty('--card-radius', `${s.design_radius}px`);
  else root.style.removeProperty('--card-radius');

  // Lightning CSS (Tailwind v4) elimina `blur(var(--x))`, así que la variable guarda el
  // valor COMPLETO (`blur(Npx)`), que sí sobrevive al compilado.
  if (s.design_glass_blur) {
    root.style.setProperty('--glass-blur', `${s.design_glass_blur}px`);
    root.style.setProperty('--card-backdrop', `blur(${s.design_glass_blur}px)`);
  } else {
    root.style.removeProperty('--glass-blur');
    root.style.removeProperty('--card-backdrop');
  }
}

export default function DesignLoader() {
  const [overlay, setOverlay] = useState(0);

  useEffect(() => {
    // 1) Aplicar cache local al instante (evita parpadeo en F5).
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const s = JSON.parse(cached) as Record<string, string>;
        applyDesign(s);
        setTimeout(() => setOverlay(parseFloat(s.design_overlay || '0') || 0), 0);
      }
    } catch { /* ignorar */ }

    // 2) Traer lo real de site_settings y refrescar.
    let active = true;
    getSiteSettings().then((s) => {
      if (!active) return;
      applyDesign(s);
      setOverlay(parseFloat(s.design_overlay || '0') || 0);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch { /* ignorar */ }
    });

    // 3) Re-aplicar en vivo cuando el admin guarda.
    const onUpdate = (e: Event) => {
      const s = (e as CustomEvent<Record<string, string>>).detail || {};
      applyDesign(s);
      setOverlay(parseFloat(s.design_overlay || '0') || 0);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch { /* ignorar */ }
    };
    window.addEventListener('nq-design-updated', onUpdate as EventListener);

    return () => { active = false; window.removeEventListener('nq-design-updated', onUpdate as EventListener); };
  }, []);

  // Capa oscura sobre el fondo general (debajo del contenido, encima del fondo).
  if (overlay <= 0) return null;
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none bg-black"
      style={{ opacity: Math.min(overlay, 0.9), zIndex: -5 }}
    />
  );
}
