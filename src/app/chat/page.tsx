'use client';

// ── Chat de comunidad (Fase Chat) ────────────────────────────────────────────
// Sala pública en tiempo real (Supabase Realtime). Cualquiera lee; para escribir
// hace falta sesión. Filtro de groserías reutilizando moderation.ts. El staff
// (admin/dj) puede ocultar o borrar mensajes; todos pueden reportar.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Send, Flag, Trash2, EyeOff, Eye, Loader2, LogIn, ShieldAlert, User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';
import {
  getChatMessages, sendChatMessage, reportChatMessage,
  setChatMessageHidden, deleteChatMessage, subscribeChatMessages, getBannedWords,
} from '@/lib/data';
import { censorText } from '@/lib/moderation';
import type { ChatMessage } from '@/lib/types';

const ROOM = 'general';
const MAX_LEN = 500;
const RATE_MS = 1500;

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { profile, isStaff, addPoints } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reported, setReported] = useState<string[]>([]);

  const bannedRef = useRef<string[]>([]);
  const lastSentRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Inserta un mensaje evitando duplicados por id (el autor lo añade optimista y
  // Realtime lo reenvía). Respeta el orden cronológico.
  const pushMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  // Carga inicial + palabras prohibidas + suscripción en vivo.
  useEffect(() => {
    let active = true;
    setLoading(true);
    getBannedWords().then((w) => { bannedRef.current = w; }).catch(() => {});
    getChatMessages(ROOM).then((list) => {
      if (active) { setMessages(list); setLoading(false); }
    });
    const unsub = subscribeChatMessages(ROOM, (m) => pushMessage(m));
    return () => { active = false; unsub(); };
  }, [pushMessage]);

  // Autoscroll al fondo cuando llegan mensajes (si el usuario está cerca del final).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = text.trim();
    if (!raw || !profile?.id || sending) return;
    if (Date.now() - lastSentRef.current < RATE_MS) return; // rate-limit suave
    lastSentRef.current = Date.now();
    setSending(true);
    try {
      const clean = censorText(raw.slice(0, MAX_LEN), bannedRef.current);
      const saved = await sendChatMessage(ROOM, clean, profile.id, profile.username);
      if (saved) {
        pushMessage(saved);
        setText('');
        // +2 por el primer mensaje del día (incentivo sin spamear).
        const today = new Date().toISOString().slice(0, 10);
        const flag = `nq_chat_points_${profile.id}`;
        if (typeof window !== 'undefined' && localStorage.getItem(flag) !== today) {
          localStorage.setItem(flag, today);
          addPoints(2);
        }
      }
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (id: string) => {
    if (reported.includes(id)) return;
    setReported((p) => [...p, id]);
    await reportChatMessage(id, profile?.id ?? null);
  };

  const handleToggleHide = async (m: ChatMessage) => {
    const next = !m.hidden;
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, hidden: next } : x)));
    await setChatMessageHidden(m.id, next, ROOM);
  };

  const handleDelete = async (id: string) => {
    setMessages((prev) => prev.filter((x) => x.id !== id));
    await deleteChatMessage(id, ROOM);
  };

  // Los mensajes ocultos solo los ve el staff (en modo demo filtramos en cliente;
  // con Supabase la RLS ya los esconde, pero filtramos por si el staff los recibe).
  const visible = messages.filter((m) => isStaff || !m.hidden);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="section-title text-2xl flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-neon-magenta" /> Chat de la comunidad
        </h1>
        <span className="badge badge-cyan">{visible.length} mensajes</span>
      </div>
      <p className="text-sm text-muted -mt-1">
        Habla en vivo con la banda de Nightcore AQP. Sé buena onda: hay filtro de palabras y moderación.
      </p>

      <div className="card p-0 overflow-hidden flex flex-col" style={{ height: '70vh' }}>
        {/* Lista de mensajes */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted py-12">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando mensajes…
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16 text-muted-2">
              <MessageCircle className="h-9 w-9 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">Aún no hay mensajes</p>
              <p className="text-xs mt-1">¡Sé el primero en romper el hielo!</p>
            </div>
          ) : (
            visible.map((m) => {
              const mine = !!profile?.id && m.user_id === profile.id;
              return (
                <div key={m.id} className={`group flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 border ${
                    m.hidden
                      ? 'bg-white/[0.02] border-dashed border-neon-yellow/40'
                      : mine
                        ? 'bg-neon-magenta/12 border-neon-magenta/30'
                        : 'bg-white/[0.03] border-border'
                  }`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      {m.user_id ? (
                        <Link href={`/perfil/${m.user_id}`} className="text-[11px] font-extrabold text-neon-cyan hover:underline flex items-center gap-1">
                          <User className="h-3 w-3" /> {m.username}
                        </Link>
                      ) : (
                        <span className="text-[11px] font-extrabold text-muted">{m.username}</span>
                      )}
                      <span className="text-[10px] text-muted-2">{timeLabel(m.created_at)}</span>
                      {m.hidden && <span className="badge badge-yellow text-[9px] py-0 px-1.5">oculto</span>}
                    </div>
                    <p className="text-sm text-white whitespace-pre-wrap break-words">{m.content}</p>
                  </div>

                  {/* Acciones (aparecen al pasar el mouse) */}
                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {profile && !mine && (
                      <button
                        onClick={() => handleReport(m.id)}
                        disabled={reported.includes(m.id)}
                        className="text-[10px] text-muted-2 hover:text-neon-yellow flex items-center gap-1 disabled:text-neon-yellow"
                        title="Reportar mensaje"
                      >
                        <Flag className="h-3 w-3" /> {reported.includes(m.id) ? 'Reportado' : 'Reportar'}
                      </button>
                    )}
                    {isStaff && (
                      <>
                        <button onClick={() => handleToggleHide(m)} className="text-[10px] text-muted-2 hover:text-neon-cyan flex items-center gap-1" title={m.hidden ? 'Mostrar' : 'Ocultar'}>
                          {m.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {m.hidden ? 'Mostrar' : 'Ocultar'}
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="text-[10px] text-muted-2 hover:text-red-400 flex items-center gap-1" title="Eliminar">
                          <Trash2 className="h-3 w-3" /> Eliminar
                        </button>
                      </>
                    )}
                    {mine && !isStaff && (
                      <button onClick={() => handleDelete(m.id)} className="text-[10px] text-muted-2 hover:text-red-400 flex items-center gap-1" title="Eliminar mi mensaje">
                        <Trash2 className="h-3 w-3" /> Borrar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Caja de envío */}
        <div className="border-t border-border p-3 sm:p-4 bg-surface-2">
          {profile ? (
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                }}
                rows={1}
                placeholder="Escribe un mensaje… (Enter para enviar)"
                className="input flex-1 resize-none py-2 text-sm max-h-32"
              />
              <button type="submit" disabled={!text.trim() || sending} className="btn btn-primary py-2 px-3 shrink-0 disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted">Entra para escribir en el chat.</p>
              <button onClick={() => setAuthOpen(true)} className="btn btn-primary py-1.5 px-3 text-xs">
                <LogIn className="h-4 w-4" /> Entrar
              </button>
            </div>
          )}
          {isStaff && (
            <p className="text-[10px] text-muted-2 mt-2 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-neon-magenta" /> Eres staff: puedes ocultar o eliminar mensajes.
            </p>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
