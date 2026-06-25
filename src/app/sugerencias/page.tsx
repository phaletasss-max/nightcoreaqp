'use client';

import React, { useState } from 'react';
import { Inbox, Megaphone, ShieldAlert, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { submitSuggestion } from '@/lib/data';

type Category = 'sugerencia' | 'denuncia';

const CATEGORIES: { id: Category; label: string; hint: string; icon: React.ElementType; color: string }[] = [
  {
    id: 'sugerencia',
    label: 'Sugerencia',
    hint: 'Ideas para mejorar los eventos, la app o la comunidad.',
    icon: Megaphone,
    color: 'border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10',
  },
  {
    id: 'denuncia',
    label: 'Denuncia',
    hint: 'Reporta comportamientos que afecten la seguridad o convivencia.',
    icon: ShieldAlert,
    color: 'border-neon-pink/40 text-neon-pink hover:bg-neon-pink/10',
  },
];

export default function SugerenciasPage() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<Category>('sugerencia');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 10) { setError('Escribe al menos 10 caracteres.'); return; }
    setError('');
    setSending(true);
    const ok = await submitSuggestion(
      category,
      trimmed.slice(0, 1000),
      contact.trim() || null,
      profile?.id ?? null,
    );
    setSending(false);
    if (ok) { setSent(true); }
    else { setError('No se pudo enviar. Inténtalo de nuevo.'); }
  };

  const handleReset = () => {
    setSent(false);
    setContent('');
    setContact('');
    setError('');
  };

  if (sent) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8 text-center">
        <div className="card p-10 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-neon-lime mx-auto" />
          <h1 className="section-title text-xl">¡Recibido, gracias!</h1>
          <p className="text-sm text-muted">
            {category === 'sugerencia'
              ? 'Tu sugerencia fue enviada al equipo. La revisaremos pronto.'
              : 'Tu denuncia fue enviada de forma confidencial. Solo el staff puede leerla.'}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={handleReset} className="btn btn-primary text-sm">
              Enviar otra
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="section-title text-2xl flex items-center gap-2">
          <Inbox className="h-6 w-6 text-neon-cyan" /> Buzón de sugerencias
        </h1>
        <p className="text-sm text-muted">
          Escríbenos de forma anónima. Solo el staff ve lo que envías aquí.
        </p>
      </div>

      {/* Selector de categoría */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`card p-4 text-left transition-colors border-2 ${
                active ? c.color + ' bg-white/5' : 'border-border text-muted hover:border-border'
              }`}
            >
              <Icon className="h-5 w-5 mb-2" />
              <span className="font-bold text-sm block">{c.label}</span>
              <span className="text-[11px] text-muted-2 leading-tight">{c.hint}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">
            {category === 'sugerencia' ? 'Tu sugerencia' : 'Tu denuncia'}
            <span className="text-muted-2 font-normal ml-1">(10–1000 caracteres)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value.slice(0, 1000)); setError(''); }}
            rows={5}
            placeholder={
              category === 'sugerencia'
                ? 'Ej: Estaría bueno tener un concurso de baile durante el evento…'
                : 'Describe lo que pasó con el mayor detalle posible…'
            }
            className="input w-full resize-none text-sm"
          />
          <div className="flex justify-between mt-1">
            {error ? <span className="text-xs text-red-400">{error}</span> : <span />}
            <span className="text-[11px] text-muted-2">{content.length}/1000</span>
          </div>
        </div>

        <div>
          <label className="label">
            Contacto <span className="text-muted-2 font-normal">(opcional — apodo, correo, etc.)</span>
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value.slice(0, 100))}
            placeholder="Si quieres que te respondamos, déjanos cómo."
            className="input w-full text-sm"
          />
          <p className="text-[11px] text-muted-2 mt-1">
            Si no pones nada, tu envío es completamente anónimo.
          </p>
        </div>

        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>

      <p className="text-[11px] text-muted-2 text-center pb-4">
        Solo el staff (admin/DJ) puede leer estos mensajes. Nunca se publican.
      </p>
    </div>
  );
}
