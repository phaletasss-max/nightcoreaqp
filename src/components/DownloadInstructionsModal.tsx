import React from 'react';
import { Download, Terminal, X, Smartphone, Monitor } from 'lucide-react';

export default function DownloadInstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-neon-lime" />
            <h3 className="font-bold text-white">Descargar Canciones</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-muted-2 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          <p className="text-sm text-muted">
            Para no depender de servidores que YouTube bloquea, la descarga ocurre <strong>en tu propio dispositivo</strong>,
            a máxima velocidad y sin restricciones.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5">
              <div className="flex items-center gap-3 mb-2">
                <Monitor className="h-5 w-5 text-neon-cyan" />
                <h4 className="font-bold text-white text-sm">Para PC (Windows) — recomendado</h4>
              </div>
              <p className="text-xs text-muted-2 mb-3">
                Instala la <strong>app de escritorio</strong>: pega tus enlaces, elige MP3/MP4 y descarga con botones (sin terminal). Se instala en 2 clics, pregunta la carpeta y crea el acceso directo. Se actualiza sola.
              </p>
              <a
                href="https://github.com/phaletasss-max/nightcoreaqp/releases/latest/download/NightcoreAQP-Downloader-Setup.exe"
                target="_blank" rel="noreferrer"
                className="btn btn-primary w-full justify-center text-xs py-2.5"
              >
                <Download className="h-4 w-4 mr-1" /> Descargar la App (.exe)
              </a>
              <p className="text-[10px] text-muted-2 mt-2 leading-relaxed">
                ⚠️ Windows puede mostrar <strong>&quot;protegió tu PC&quot;</strong> (app sin firma): clic en <strong>Más información</strong> → <strong>Ejecutar de todas formas</strong>.
              </p>
              <a
                href="/downloads/Crate_Builder.bat" download
                className="mt-2 block text-center text-[11px] text-neon-cyan/80 hover:text-neon-cyan flex items-center justify-center gap-1"
              >
                <Terminal className="h-3 w-3" /> ¿Prefieres sin instalar? Usa el script .bat
              </a>
            </div>

            <div className="p-4 rounded-xl border border-neon-pink/20 bg-neon-pink/5">
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="h-5 w-5 text-neon-pink" />
                <h4 className="font-bold text-white text-sm">Para Celulares (Android)</h4>
              </div>
              <p className="text-xs text-muted-2 mb-3">Recomendamos aplicaciones seguras de código abierto como YTDLnis o Seal para extraer el audio.</p>
              <div className="flex gap-2">
                <a href="https://github.com/deniscerri/ytdlnis/releases/latest" target="_blank" rel="noreferrer" className="btn bg-surface border border-border text-xs flex-1 justify-center hover:border-neon-pink transition-colors">
                  Descargar YTDLnis
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-black/50 text-center">
          <p className="text-[11px] text-muted-2">Las herramientas locales son seguras, libres de virus y usan software libre.</p>
        </div>
      </div>
    </div>
  );
}
