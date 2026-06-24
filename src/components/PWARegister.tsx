'use client';

import { useEffect } from 'react';

// Registra el service worker (/sw.js) para que la web sea instalable (PWA) y
// funcione offline básico. Silencioso: si falla, no rompe nada.
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
