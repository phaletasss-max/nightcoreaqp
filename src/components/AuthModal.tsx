'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, username);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    if (mode === 'register') {
      setDone('Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.');
      return;
    }
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6 sm:p-8 relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <h2 className="section-title mb-1">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
        <p className="text-sm text-muted mb-6">
          {mode === 'login' ? 'Entra para votar, sugerir música y ganar puntos.' : 'Únete a la comunidad nightcore de Arequipa.'}
        </p>

        {!configured && (
          <div className="badge badge-yellow w-full justify-start mb-4 py-2 px-3 normal-case tracking-normal text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Supabase no está conectado: el login real requiere configurar las variables de entorno.</span>
          </div>
        )}

        {done ? (
          <div className="text-center space-y-4 py-4">
            <Mail className="h-10 w-10 mx-auto text-neon-cyan" />
            <p className="text-sm text-foreground">{done}</p>
            <button onClick={() => { setMode('login'); setDone(null); }} className="btn btn-ghost w-full">Ir a iniciar sesión</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Nombre de usuario</label>
                <input className="input" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej. Kaito_99" />
              </div>
            )}
            <div>
              <label className="label">Correo</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>

            {error && (
              <div className="badge badge-red w-full justify-start py-2 px-3 normal-case tracking-normal text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {busy ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}
            </button>
          </form>
        )}

        {!done && (
          <p className="text-xs text-muted text-center mt-5">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="text-neon-pink font-bold hover:underline">
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? require('react-dom').createPortal(modalContent, document.body) : null;
}
