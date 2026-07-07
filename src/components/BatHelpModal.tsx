'use client';

// ── Pop-up post-descarga del .bat ────────────────────────────────────────────
// Aparece justo después de que el usuario descarga un .bat (playlist o página
// de descargas) y le explica EN SIMPLE qué es y qué hacer con él, para que no
// se quede mirando un archivo raro sin saber qué hacer.

import React from 'react';
import { FileDown, X, MousePointerClick, FolderCheck, ShieldCheck } from 'lucide-react';

export default function BatHelpModal({ onClose, count = 1 }: { onClose: () => void; count?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="card w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-neon-lime" />
            <h3 className="font-bold text-white">¡Tu descargador está listo! ✅</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-muted-2 hover:text-white hover:bg-white/10 transition-colors" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted">
            Se guardó un archivo <strong className="text-white">.bat</strong> en tu carpeta de <strong>Descargas</strong>.
            Ese archivo es tu descargador: al abrirlo, baja {count === 1 ? 'tu canción' : `tus ${count} canciones`} directo a tu PC.
          </p>

          <ol className="space-y-3 text-xs text-muted-2">
            <li className="flex gap-3 items-start">
              <MousePointerClick className="h-4 w-4 text-neon-cyan shrink-0 mt-0.5" />
              <span><strong className="text-white">1. Ábrelo con doble clic.</strong> Si Windows pregunta, elige <strong>&quot;Más información&quot; → &quot;Ejecutar de todas formas&quot;</strong> (es normal, no está firmado).</span>
            </li>
            <li className="flex gap-3 items-start">
              <ShieldCheck className="h-4 w-4 text-neon-magenta shrink-0 mt-0.5" />
              <span><strong className="text-white">2. La primera vez se prepara solo</strong> (baja sus herramientas, 1–2 min). Las siguientes veces es directo.</span>
            </li>
            <li className="flex gap-3 items-start">
              <FolderCheck className="h-4 w-4 text-neon-lime shrink-0 mt-0.5" />
              <span><strong className="text-white">3. Tu música queda en</strong> Escritorio → carpeta <strong>NightcoreAQP</strong>. Al terminar, el .bat se borra solo.</span>
            </li>
          </ol>

          <p className="text-[11px] text-muted-2 border-t border-border pt-3">
            🛡️ Es seguro: usa <strong>yt-dlp</strong> y <strong>ffmpeg</strong> (software libre usado por millones). La descarga ocurre en tu PC, sin pasar por nuestros servidores.
          </p>

          <button onClick={onClose} className="btn btn-primary w-full justify-center text-sm py-2.5">
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}
