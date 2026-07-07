'use client';

// ── NeonSpotlight ────────────────────────────────────────────────────────────
// Cuando NΞON manda al usuario a una ruta con un elemento objetivo, deja el
// nombre en sessionStorage ('nq_neon_spotlight'). Al montar/cambiar de ruta,
// este componente busca [data-neon-target="…"], hace scroll y lo resalta con un
// glow temporal. Es tolerante a fallos: si el elemento no aparece, no hace nada.

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function NeonSpotlight() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = sessionStorage.getItem('nq_neon_spotlight');
    if (!target) return;
    sessionStorage.removeItem('nq_neon_spotlight');

    let tries = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let clear: ReturnType<typeof setTimeout> | undefined;

    const findAndGlow = () => {
      const el = document.querySelector<HTMLElement>(`[data-neon-target="${target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('nq-spotlight');
        clear = setTimeout(() => el.classList.remove('nq-spotlight'), 4500);
        return;
      }
      // La página puede cargar datos async → reintentar ~5s antes de rendirse.
      if (tries++ < 20) retry = setTimeout(findAndGlow, 250);
    };

    const start = setTimeout(findAndGlow, 300);
    return () => {
      clearTimeout(start);
      if (retry) clearTimeout(retry);
      if (clear) clearTimeout(clear);
    };
  }, [pathname]);

  return null;
}
