'use client';

import { useEffect } from 'react';

// Registra el service worker (/sw.js) para que la web sea instalable (PWA) y
// funcione offline básico. Silencioso: si falla, no rompe nada.
// SOLO en producción: el sw.js cachea los estáticos cache-first, y en dev eso
// hace que localhost muestre JS/CSS viejos ("no veo los cambios"). En dev,
// además, des-registra cualquier SW previo y borra sus caches.
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
      return;
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
