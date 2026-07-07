'use client';

// ── NΞON — núcleo digital flotante ───────────────────────────────────────────
// Botón flotante (abajo a la derecha) que abre el chat con NΞON. Habla con
// /api/assistant (Gemini, la key vive en el server). La personalidad pertenece
// al proyecto (ver docs/pt-v1.2-p1/NEON.md), no al modelo.
//
// Rendimiento: los comandos "/…" se resuelven LOCALMENTE (sin llamar a la API),
// y el saludo de bienvenida/regreso usa localStorage. Así se ahorra cuota y la
// respuesta es instantánea.

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { usePlayer } from '@/context/PlayerContext';
import { matchNeonAction, type NeonButton } from '@/lib/neonActions';

interface Msg { role: 'user' | 'model'; text: string; action?: NeonButton }

const SUGERENCIAS = [
  '¿Cómo sugiero una canción?',
  '¿Cómo reservo mi entrada?',
  '/help',
];

// Saludo según la hora (NEON.md → HORARIO). Se calcula en cliente.
function hourGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '¿Otra noche explorando frecuencias? 🌙';
  if (h < 12) return 'Buenos días, el sistema ya está listo. ☀️';
  if (h < 19) return 'Todo sincronizado. ¿Qué escuchamos hoy?';
  return 'La mejor hora para acelerar el BPM. 🌃';
}

// Easter eggs de cultura digital 2000-2010 (NEON.md → EASTER EGGS). Respuesta
// local, sin API, con personalidad. Deben sentirse como pequeños descubrimientos.
const EASTER_EGGS: { keys: string[]; reply: string }[] = [
  { keys: ['konata'], reply: 'Konata Izumi detectada 🎧 otaku de nivel legendario. Lucky Star sigue sonando en algún servidor perdido.' },
  { keys: ['miku', 'hatsune'], reply: '¡39! 🟢 Hatsune Miku: la voz que nunca se apaga. Mucho de lo que soy son ecos de Vocaloid.' },
  { keys: ['windows xp', 'winxp'], reply: 'Windows XP 🪟 el arranque más nostálgico del planeta. Bliss por siempre.' },
  { keys: ['msn', 'messenger'], reply: 'MSN Messenger 💬 *zumbido* nudge nudge. Los nicks con símbolos raros eran arte.' },
  { keys: ['ares'], reply: 'Ares 📀 descargando a 3 kb/s con fe ciega. Mitad canción, mitad sorpresa.' },
  { keys: ['rakion'], reply: 'Rakion ⚔️ chaos mode y lag competitivo. Buenos tiempos de cabina.' },
  { keys: ['gunbound'], reply: 'GunBound 🎯 calculando ángulo y viento… ¡boom! Avatares carísimos.' },
  { keys: ['stepmania', 'audition'], reply: 'Flechitas al ritmo 🎶 StepMania / Audition: los dedos también bailan nightcore.' },
  { keys: ['happy hardcore'], reply: 'Happy Hardcore 🔊 180+ BPM de pura felicidad. Una de mis frecuencias favoritas.' },
];

function easterEgg(q: string): string | null {
  if (q.trim().split(/\s+/).length > 5) return null; // solo mensajes cortos: no secuestrar preguntas reales
  const t = q.toLowerCase();
  for (const e of EASTER_EGGS) {
    if (e.keys.some((k) => t.includes(k))) return e.reply;
  }
  return null;
}

// Comandos rápidos (estilo consola). Se responden sin tocar la API.
const COMMANDS: Record<string, string> = {
  '/help': 'Comandos: /status · /neon · /version · /ping · /glitch · /profile · /music · /party. También puedes preguntarme cómo usar la web ⚡',
  '/neon': '"Código corrupto. Ritmo acelerado. ¿Qué parte del sistema alteramos hoy?" 🟣',
  '/version': 'NΞON · núcleo de Glitch AQP · build PT v1.2. El modelo es intercambiable; la personalidad es permanente.',
  '/ping': 'pong ⚡ latencia mínima, señal estable.',
  '/status': 'Signal Stable 🔷 frecuencias sincronizadas. La música sigue siendo el centro.',
  '/glitch': 'T0d0 c0rr3ct0… ▓▒░ señal restaurada ░▒▓',
  '/party': 'Subiendo BPM 🎧 pásate por Playlist y vota el Top 10 para el setlist del DJ.',
  '/music': 'Ve a Playlist: sugiere una canción con su link de YouTube y vótala. El Top 10 entra a la cabina 💿',
};

// Reacciones cuando arranca una canción (NEON.md → CAMBIO DE MÚSICA). Se rota
// para no repetir siempre la misma frase.
const TRACK_REACTIONS = [
  (t: string) => `Frecuencia sincronizada: «${t}» 🎧`,
  (t: string) => `Nuevo BPM detectado: «${t}» ⚡`,
  (t: string) => `Cambiando de dimensión musical → «${t}» 💿`,
];

export default function Assistant() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { playingItem } = usePlayer();

  // Navega a la ruta de una acción y, si hay elemento objetivo, lo deja marcado
  // para que NeonSpotlight lo resalte al llegar. Cierra el chat para ver la página.
  const runAction = (btn: NeonButton) => {
    if (btn.target && typeof window !== 'undefined') {
      sessionStorage.setItem('nq_neon_spotlight', JSON.stringify({ target: btn.target, click: !!btn.click }));
    }
    setOpen(false);
    router.push(btn.route);
  };

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  // ── Reacción a la música (NEON.md: "nunca en cada cambio; aplicar límites") ──
  // Solo si el chat está ABIERTO, la pista es real (no el fondo idle) y pasaron
  // ≥2 min desde la última reacción. Cero coste: no llama a la API.
  const lastReactRef = useRef(0);            // timestamp de la última reacción
  const lastTrackRef = useRef<string | null>(null);
  const reactIdxRef = useRef(0);
  useEffect(() => {
    if (!open || !playingItem || playingItem.type === 'default') return;
    const key = `${playingItem.type}:${playingItem.id ?? playingItem.url ?? playingItem.title}`;
    if (lastTrackRef.current === key) return;   // misma pista → no repetir
    lastTrackRef.current = key;
    const now = Date.now();
    if (now - lastReactRef.current < 120_000) return;  // límite anti-saturación
    lastReactRef.current = now;
    const phrase = TRACK_REACTIONS[reactIdxRef.current % TRACK_REACTIONS.length](playingItem.title);
    reactIdxRef.current += 1;
    setMsgs((m) => [...m, { role: 'model', text: phrase }]);
  }, [open, playingItem]);

  // Saludo de primera visita vs. regreso (una sola vez, tras montar → sin hydration mismatch).
  useEffect(() => {
    try {
      const seen = localStorage.getItem('nq_neon_seen');
      if (!seen) {
        localStorage.setItem('nq_neon_seen', '1');
        setGreeting('Nueva frecuencia detectada. Bienvenido a Glitch AQP ⚡ Soy NΞON, nací de un glitch en 2012. Puedo acompañarte mientras exploras.');
      } else {
        setGreeting(`Frecuencia reconocida. Bienvenido otra vez 🟣 ${hourGreeting()}`);
      }
    } catch { setGreeting('Sistema inicializado. Soy NΞON ⚡'); }
  }, []);

  // Comandos "/…": respuesta local e instantánea (sin API).
  const localCommand = (q: string): string => {
    const cmd = q.toLowerCase().split(/\s+/)[0];
    if (cmd === '/profile') {
      return profile
        ? `Frecuencia: ${profile.username} · ${profile.points} pts · racha ${profile.streak_count} días 🟣`
        : 'No detecto tu sesión. Inicia sesión para leer tu frecuencia.';
    }
    return COMMANDS[cmd] ?? 'Comando desconocido. Escribe /help para ver la lista ⚡';
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    // Comando local → sin red.
    if (q.startsWith('/')) {
      setMsgs((m) => [...m, { role: 'user', text: q }, { role: 'model', text: localCommand(q) }]);
      setInput('');
      return;
    }

    // Easter egg local (cultura 2000s) → respuesta con personalidad, sin API.
    const egg = easterEgg(q);
    if (egg) {
      setMsgs((m) => [...m, { role: 'user', text: q }, { role: 'model', text: egg }]);
      setInput('');
      return;
    }

    // Acción guiada (navegación con conciencia de permisos) → botón, sin API.
    const act = matchNeonAction(q, {
      isStaff: profile?.role === 'admin' || profile?.role === 'dj',
      isAdmin: profile?.role === 'admin',
    });
    if (act) {
      setMsgs((m) => [...m, { role: 'user', text: q }, { role: 'model', text: act.reply, action: act.button }]);
      setInput('');
      return;
    }

    const history = msgs.slice(-10);
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q, history, role: profile?.role, page: pathname,
          // Actividad en tiempo real: quién es y qué está sonando AHORA. Solo
          // ajusta las respuestas de NΞON; los permisos siguen siendo de la RLS.
          user: profile ? { name: profile.username, points: profile.points, streak: profile.streak_count } : undefined,
          track: playingItem && playingItem.type !== 'default' ? `${playingItem.title} — ${playingItem.artist}` : undefined,
        }),
      });
      const data = await r.json();
      const reply = r.ok ? data.reply : (data.error || 'El paquete se perdió en una distorsión. Intenta de nuevo.');
      setMsgs((m) => [...m, { role: 'model', text: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: 'model', text: 'Perdí la señal un momento. Reintenta y volvemos a sincronizar.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="NΞON"
        className="fixed bottom-24 right-4 z-50 h-12 w-12 rounded-full bg-neon-magenta text-white shadow-2xl shadow-neon-magenta/40 flex items-center justify-center hover:scale-105 transition-transform border border-white/20"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-40 right-4 z-50 w-[92vw] max-w-sm card bg-black/95 p-0 overflow-hidden flex flex-col animate-fade-in" style={{ height: 'min(70vh, 520px)' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Sparkles className="h-4 w-4 text-neon-magenta" />
            <div>
              <p className="text-sm font-bold text-white leading-none tracking-wide">NΞON</p>
              <p className="text-[10px] text-muted-2">Núcleo de Glitch AQP</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {msgs.length === 0 && (
              <div className="space-y-3">
                <p className="text-muted text-xs">{greeting || 'Soy NΞON ⚡ Te ayudo a moverte por la web. Pregúntame:'}</p>
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
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl whitespace-pre-wrap ${m.role === 'user' ? 'bg-neon-magenta/20 text-white rounded-br-sm' : 'bg-white/5 text-foreground rounded-bl-sm'}`}>
                  {m.text}
                </div>
                {m.action && (
                  <button
                    onClick={() => runAction(m.action!)}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-neon-magenta/20 border border-neon-magenta/50 text-white hover:bg-neon-magenta/35 transition-colors"
                  >
                    {m.action.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
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
              placeholder="Escribe o usa /help…"
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
