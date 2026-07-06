'use client';

// ── PageVideoManager ─────────────────────────────────────────────────────────
// Renderiza el video de fondo que el admin configuró para la página actual
// (Admin → Diseño → Videos de fondo). Lee site_settings[design_page_videos],
// cachea en localStorage y se actualiza en vivo con 'nq-design-updated'.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSiteSettings } from '@/lib/data';
import { PAGE_VIDEO_KEY, parsePageVideos, resolvePageVideo } from '@/lib/pageVideos';
import PageVideoBg from '@/components/PageVideoBg';

const CACHE_KEY = 'nq_page_videos_cache';

// Hook compartido: URL del video de página para la ruta actual (o null).
// Lo usa también GlobalPlayer para ocultar su fondo idle donde haya video.
export function usePageVideoUrl(): string | null {
  const pathname = usePathname();
  const [config, setConfig] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return parsePageVideos(null);
    try { return parsePageVideos(localStorage.getItem(CACHE_KEY)); } catch { return parsePageVideos(null); }
  });

  useEffect(() => {
    let active = true;
    getSiteSettings().then((s) => {
      if (!active) return;
      setConfig(parsePageVideos(s[PAGE_VIDEO_KEY]));
      try {
        if (s[PAGE_VIDEO_KEY]) localStorage.setItem(CACHE_KEY, s[PAGE_VIDEO_KEY]);
        else localStorage.removeItem(CACHE_KEY);
      } catch { /* ignorar */ }
    });
    const onUpdate = (e: Event) => {
      const s = (e as CustomEvent<Record<string, string>>).detail || {};
      setConfig(parsePageVideos(s[PAGE_VIDEO_KEY]));
      try {
        if (s[PAGE_VIDEO_KEY]) localStorage.setItem(CACHE_KEY, s[PAGE_VIDEO_KEY]);
        else localStorage.removeItem(CACHE_KEY);
      } catch { /* ignorar */ }
    };
    window.addEventListener('nq-design-updated', onUpdate as EventListener);
    return () => { active = false; window.removeEventListener('nq-design-updated', onUpdate as EventListener); };
  }, []);

  return pathname ? resolvePageVideo(pathname, config) : null;
}

export default function PageVideoManager() {
  const url = usePageVideoUrl();
  if (!url) return null;
  // key: al cambiar de video se remonta el <video> (si no, el src viejo persiste)
  return <PageVideoBg key={url} src={url} />;
}
