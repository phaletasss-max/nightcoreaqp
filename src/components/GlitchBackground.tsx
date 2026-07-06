'use client';

// ── GlitchBackground ─────────────────────────────────────────────────────────
// Video de fondo en loop para el tema "glitch" (clip generado con Veo 3 u otro).
// Busca /glitch-bg.mp4 en public/; si no existe (o falla la carga), no muestra
// nada y queda el ScenecoreBackground de siempre. Solo se monta con el tema
// glitch activo (observa data-theme en <html>, que setea DesignLoader).

import { useEffect, useState } from 'react';

const VIDEO_SRC = '/glitch-bg.mp4';

export default function GlitchBackground() {
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const check = () => setActive(root.getAttribute('data-theme') === 'glitch');
    check();
    const obs = new MutationObserver(check);
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  if (!active || failed) return null;
  return (
    <video
      aria-hidden
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onError={() => setFailed(true)}
      className="fixed inset-0 w-full h-full object-cover pointer-events-none"
      style={{ zIndex: -18, opacity: 0.45 }}
      src={VIDEO_SRC}
    />
  );
}
