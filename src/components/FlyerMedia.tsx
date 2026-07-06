'use client';

// ── FlyerMedia ───────────────────────────────────────────────────────────────
// Renderiza el flyer de un evento según su tipo real: el admin puede subir
// imagen, MP4 o MP3 (así lo dice el formulario), pero antes siempre se pintaba
// como <img>. Detecta por extensión; ante la duda, imagen.

import React from 'react';

function mediaKind(url: string): 'video' | 'audio' | 'image' {
  const clean = url.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|mov)$/.test(clean)) return 'video';
  if (/\.(mp3|ogg|wav|m4a)$/.test(clean)) return 'audio';
  return 'image';
}

export default function FlyerMedia({ url, alt = 'Flyer del evento', className = '' }: {
  url: string;
  alt?: string;
  className?: string;
}) {
  const kind = mediaKind(url);
  if (kind === 'video') {
    return (
      <video
        src={url}
        autoPlay
        muted
        loop
        playsInline
        controls
        className={`w-full h-auto object-cover bg-black ${className}`}
      />
    );
  }
  if (kind === 'audio') {
    return (
      <div className={`w-full bg-black/60 p-4 flex flex-col items-center gap-2 ${className}`}>
        <span className="text-4xl">🎵</span>
        <audio src={url} controls className="w-full" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={`w-full h-auto object-cover bg-black ${className}`} />;
}
