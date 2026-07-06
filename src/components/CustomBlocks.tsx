'use client';

// Renderiza los bloques de contenido que el admin creó desde /admin → Bloques.
// Cada tipo tiene su propio layout; el accent define el color de borde/énfasis.

import React, { useEffect, useState } from 'react';
import { Megaphone, ExternalLink, Image as ImageIcon, Video, AlignLeft } from 'lucide-react';
import { getCustomBlocks } from '@/lib/data';
import type { CustomBlock } from '@/lib/types';

const ACCENT_CLASS: Record<string, string> = {
  cyan:    'border-neon-cyan/40 text-neon-cyan',
  magenta: 'border-neon-magenta/40 text-neon-magenta',
  lime:    'border-neon-lime/40 text-neon-lime',
  yellow:  'border-neon-yellow/40 text-neon-yellow',
  purple:  'border-neon-purple/40 text-neon-purple',
};

function accentCls(accent: string) {
  return ACCENT_CLASS[accent] ?? ACCENT_CLASS.cyan;
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function BlockRenderer({ b }: { b: CustomBlock }) {
  const ac = accentCls(b.accent);

  if (b.type === 'anuncio') {
    return (
      <div className={`card p-5 flex gap-4 border-l-4 ${ac}`}>
        <Megaphone className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          {b.title && <p className="font-extrabold text-white text-sm">{b.title}</p>}
          {b.content && <p className="text-sm text-muted whitespace-pre-wrap">{b.content}</p>}
        </div>
      </div>
    );
  }

  if (b.type === 'texto') {
    return (
      <div className="card p-5 space-y-2">
        {b.title && (
          <p className="font-extrabold text-white flex items-center gap-2">
            <AlignLeft className="h-4 w-4 text-neon-cyan" /> {b.title}
          </p>
        )}
        {b.content && <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{b.content}</p>}
      </div>
    );
  }

  if (b.type === 'enlace') {
    return (
      <div className={`card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-4 ${ac}`}>
        <div className="flex-1 min-w-0">
          {b.title && <p className="font-extrabold text-white text-sm">{b.title}</p>}
          {b.content && <p className="text-xs text-muted mt-0.5">{b.content}</p>}
        </div>
        {b.url && (
          <a
            href={b.url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-primary shrink-0 text-sm py-2 px-4 flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" /> Abrir enlace
          </a>
        )}
      </div>
    );
  }

  if (b.type === 'imagen') {
    if (!b.img_url) return null;
    return (
      <div className="card p-3 space-y-2">
        <img
          src={b.img_url}
          alt={b.title ?? 'Imagen'}
          className="w-full rounded-xl object-cover max-h-80"
          loading="lazy"
        />
        {(b.title || b.content) && (
          <p className="text-xs text-muted px-1">{b.title}{b.title && b.content ? ' — ' : ''}{b.content}</p>
        )}
      </div>
    );
  }

  if (b.type === 'video') {
    const vid = b.url ? youtubeId(b.url) : null;
    if (!vid) return null;
    return (
      <div className="card p-4 space-y-3">
        {b.title && (
          <p className="font-extrabold text-white flex items-center gap-2 text-sm">
            <Video className="h-4 w-4 text-neon-magenta" /> {b.title}
          </p>
        )}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-xl"
            src={`https://www.youtube.com/embed/${vid}`}
            title={b.title ?? 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return null;
}

interface Props {
  section?: string;
  /** Qué mostrar si NO hay bloques (p. ej. el placeholder de "Sets del DJ"). */
  fallback?: React.ReactNode;
}

export default function CustomBlocks({ section = 'home', fallback = null }: Props) {
  const [blocks, setBlocks] = useState<CustomBlock[]>([]);

  useEffect(() => {
    getCustomBlocks(section).then((list) => setBlocks(list.filter((b) => b.visible)));
  }, [section]);

  if (!blocks.length) return <>{fallback}</>;

  return (
    <div className="space-y-3">
      {blocks.map((b) => <BlockRenderer key={b.id} b={b} />)}
    </div>
  );
}
