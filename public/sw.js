// Service worker de Glitch AQP — habilita "instalar" (PWA) + offline básico.
// Diseño conservador: solo toca peticiones GET del MISMO origen y nunca /api,
// así no interfiere con YouTube, Supabase ni las rutas dinámicas.

// v3: rebrand Glitch AQP — bump para que los clientes viejos descarten su cache.
const CACHE = 'nq-cache-v3';
const PRECACHE = ['/', '/playlist', '/icon-192x192.png', '/icon-512x512.png'];

// Respuesta de último recurso: nunca devolver undefined a respondWith() (eso lanza
// "Failed to convert value to 'Response'"). Se crea fresca en cada uso (el body se consume).
const offlineResponse = () =>
  new Response('Sin conexión. Vuelve a intentar cuando tengas internet.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     // terceros: que el navegador maneje
  if (url.pathname.startsWith('/api/')) return;         // APIs: siempre frescas, sin cache

  // Navegaciones (páginas): red primero, con fallback al cache si no hay internet.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
        .then((r) => r || offlineResponse()),
    );
    return;
  }

  // Estáticos del mismo origen (_next, imágenes…): cache primero + revalidación.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }).then((r) => r || offlineResponse()),
  );
});
