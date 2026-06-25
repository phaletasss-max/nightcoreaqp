'use client';

// ── Fondo de sección (imagen o video) con opacidad configurable ──────────────
// Reemplaza el patrón repetido en la home: <img bg> + <BgEditor>. La opacidad se
// guarda por sección (clave bg_opacity_<key> en site_settings) y el admin la ajusta
// con el slider del BgEditor. Soporta MP4/WebM además de imágenes.

import BgEditor from './BgEditor';

interface SectionBgProps {
  sectionKey: string;
  bgs: Record<string, string>;
  onChange: (key: string, value: string) => void;  // actualiza el estado del padre
  isStaff: boolean;
  defaultOpacity?: number;
  blend?: boolean;   // mix-blend-screen (para que el neón "atraviese")
}

export default function SectionBg({ sectionKey, bgs, onChange, isStaff, defaultOpacity = 0.2, blend = true }: SectionBgProps) {
  const url = bgs[sectionKey];
  const opacityRaw = bgs[`bg_opacity_${sectionKey}`];
  const opacity = opacityRaw != null && opacityRaw !== '' ? parseFloat(opacityRaw) : defaultOpacity;
  const isVideo = !!url && /\.(mp4|webm)(\?|$)/i.test(url);

  return (
    <>
      {url && (isVideo ? (
        <video
          src={url} autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          style={{ opacity }}
        />
      ) : (
         
        <img
          src={url} alt=""
          className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none ${blend ? 'mix-blend-screen' : ''}`}
          style={{ opacity }}
        />
      ))}
      {isStaff && (
        <BgEditor
          sectionKey={sectionKey}
          currentBg={url}
          currentOpacity={opacity}
          theme={bgs['design_theme'] || 'default'}
          onBgUpdate={(u) => onChange(sectionKey, u)}
          onOpacityUpdate={(o) => onChange(`bg_opacity_${sectionKey}`, String(o))}
        />
      )}
    </>
  );
}
