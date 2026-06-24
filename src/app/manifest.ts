import type { MetadataRoute } from 'next';

// Web App Manifest → permite "instalar" la web como app (icono en el celular,
// pantalla completa). Next inyecta el <link rel="manifest"> automáticamente.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nightcore AQP — Club de nightcore de Arequipa',
    short_name: 'Nightcore AQP',
    description: 'Eventos, playlist colaborativa, concurso de disfraces, encuestas y rachas. El club de nightcore de Arequipa.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'es',
    categories: ['music', 'entertainment', 'social'],
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
