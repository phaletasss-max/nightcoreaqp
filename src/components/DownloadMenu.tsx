'use client';

// ── Menú de descarga con calidades y tamaños ─────────────────────────────────
// Botón "Descargar ▾" que, al abrirse, consulta el media-service (/api/info) para
// mostrar el tamaño aprox del MP3 y las calidades de MP4 disponibles ANTES de bajar.
// Si no hay media-service, cae a una descarga directa (sin tamaños).

import React, { useState } from 'react';
import { Download, Loader2, ChevronDown, Music, Video, AlertCircle } from 'lucide-react';
import { checkVideo, downloadMedia, isMediaConfigured, type VideoInfo } from '@/lib/media';

const fmtMb = (mb?: number | null) => (mb != null ? `~${mb} MB` : '');

export default function DownloadMenu({ url, filename }: { url: string; filename: string }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    setErr(null);
    if (next && !info && isMediaConfigured()) {
      setLoading(true);
      try { setInfo(await checkVideo(url)); } finally { setLoading(false); }
    }
  };

  const go = async (format: 'mp3' | 'mp4', quality?: string) => {
    setBusy(`${format}-${quality || 'best'}`);
    setErr(null);
    try {
      await downloadMedia(url, format, filename, quality);
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error en la descarga');
    } finally {
      setBusy(null);
    }
  };

  const qualities = info?.video?.filter((v) => v.height) ?? [];

  return (
    <div className="relative">
      <button onClick={toggle}
        className="h-9 px-2.5 rounded-lg border border-border text-xs text-muted hover:text-white hover:border-white transition-colors flex items-center gap-1">
        <Download className="h-3.5 w-3.5" /> Descargar <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 w-60 card bg-black/95 p-2 z-50 animate-fade-in space-y-1.5">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted px-2 py-3 justify-center">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando tamaños…
              </div>
            ) : (
              <>
                {/* MP3 */}
                <button onClick={() => go('mp3')} disabled={!!busy}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left text-foreground hover:bg-white/10 transition-colors">
                  <span className="flex items-center gap-2"><Music className="h-4 w-4 text-neon-magenta" /> MP3 (audio)</span>
                  <span className="text-[11px] text-muted-2 font-mono">
                    {busy === 'mp3-best' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : fmtMb(info?.audioSizeMb)}
                  </span>
                </button>

                <div className="h-px bg-border my-1" />

                {/* MP4 — por calidad si las conocemos, si no, "mejor" */}
                {qualities.length > 0 ? qualities.map((q) => (
                  <button key={q.height} onClick={() => go('mp4', String(q.height))} disabled={!!busy}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left text-foreground hover:bg-white/10 transition-colors">
                    <span className="flex items-center gap-2"><Video className="h-4 w-4 text-neon-cyan" /> MP4 {q.height}p</span>
                    <span className="text-[11px] text-muted-2 font-mono">
                      {busy === `mp4-${q.height}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : fmtMb(q.sizeMb)}
                    </span>
                  </button>
                )) : (
                  <button onClick={() => go('mp4')} disabled={!!busy}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left text-foreground hover:bg-white/10 transition-colors">
                    <span className="flex items-center gap-2"><Video className="h-4 w-4 text-neon-cyan" /> MP4 (video)</span>
                    <span className="text-[11px] text-muted-2 font-mono">
                      {busy === 'mp4-best' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'mejor'}
                    </span>
                  </button>
                )}

                {!isMediaConfigured() && (
                  <p className="text-[10px] text-muted-2 px-2 pt-1">Tamaños disponibles al conectar el media-service.</p>
                )}
                {err && (
                  <div className="flex items-start gap-1.5 text-[11px] text-red-400 px-2 pt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> <span>{err}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
