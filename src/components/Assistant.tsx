'use client';

// ── Asistente flotante (Gemini) ──────────────────────────────────────────────
// Botón flotante (abajo a la derecha) que abre un chat. Habla con /api/assistant.
// Si la asistente no está configurada en el server, muestra un aviso amable.

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';

interface Msg { role: 'user' | 'model'; text: string }

const SUGERENCIAS = [
  '¿Cómo sugiero una canción?',
  '¿Cómo reservo mi entrada?',
  '¿Cómo subo mi disfraz?',
];

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const history = msgs.slice(-10);
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history }),
      });
      const data = await r.json();
      const reply = r.ok ? data.reply : (data.error || 'No pude responder ahora.');
      setMsgs((m) => [...m, { role: 'model', text: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: 'model', text: 'No me pude conectar. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Asistente"
        className="fixed bottom-24 right-4 z-50 h-12 w-12 rounded-full bg-neon-magenta text-white shadow-2xl shadow-neon-magenta/40 flex items-center justify-center hover:scale-105 transition-transform border border-white/20"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-40 right-4 z-50 w-[92vw] max-w-sm card bg-black/95 p-0 overflow-hidden flex flex-col animate-fade-in" style={{ height: 'min(70vh, 520px)' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Sparkles className="h-4 w-4 text-neon-magenta" />
            <div>
              <p className="text-sm font-bold text-white leading-none">Nightie</p>
              <p className="text-[10px] text-muted-2">Asistente del club</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {msgs.length === 0 && (
              <div className="space-y-3">
                <p className="text-muted text-xs">¡Hola! Soy Nightie 💜 Te ayudo a usar la web. Pregúntame:</p>
                <div className="flex flex-col gap-1.5">
                  {SUGERENCIAS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="text-left text-xs px-3 py-2 rounded-lg border border-border text-muted hover:text-white hover:border-neon-magenta/50 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl whitespace-pre-wrap ${m.role === 'user' ? 'bg-neon-magenta/20 text-white rounded-br-sm' : 'bg-white/5 text-foreground rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-white/5 text-muted"><Loader2 className="h-4 w-4 animate-spin" /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-2 border-t border-border flex items-center gap-2">
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              className="input py-2 text-sm flex-1"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="h-9 w-9 rounded-lg bg-neon-magenta text-white flex items-center justify-center disabled:opacity-40 shrink-0">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
