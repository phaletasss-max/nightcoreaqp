'use client';

// ── PageVideoBg ──────────────────────────────────────────────────────────────
// Video de fondo en loop a nivel de PÁGINA (playlist, disfraces...). Es el
// hermano de GlitchBackground (que es global y atado al tema glitch): este se
// monta donde la página lo pida, con cualquier archivo de public/ y siempre
// activo. Si el archivo no existe o falla, no muestra nada (queda el fondo
// scenecore de siempre). z-index -17: sobre el video global (-18) y bajo el
// overlay oscuro del admin (-5), así la página "pisa" al global sin taparlo todo.

import { useState } from 'react';

export default function PageVideoBg({ src, opacity = 0.3 }: { src: string; opacity?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;
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
      style={{ zIndex: -17, opacity }}
      src={src}
    />
  );
}
