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
function ensureFontLink(font: string) {
  if (typeof document === 'undefined') return;
  const map: Record<string, string> = {
    pixel: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
    rounded: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap',
  };
  const href = map[font];
  if (!href) return;
  const id = `nq-font-${font}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
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

  if (s.design_card_opacity) root.style.setProperty('--card-opacity', s.design_card_opacity);
  else root.style.removeProperty('--card-opacity');
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
        setOverlay(parseFloat(s.design_overlay || '0') || 0);
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
