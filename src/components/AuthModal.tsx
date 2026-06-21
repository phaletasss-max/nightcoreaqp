'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { configured, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
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
    if (mode === 'recovery') {
      const { error } = await resetPassword(email);
      if (error) setError(error);
      else setDone('Revisa tu correo. Te hemos enviado un enlace para cambiar tu contraseña.');
    } else if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else onClose();
    } else {
      const { error } = await signUp(email, password, username);
      if (error) setError(error);
      else setDone('¡Cuenta creada! Revisa tu correo para verificar tu cuenta (si aplica), o cierra esto y ya estarás logeado.');
    }
    setBusy(false);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6 sm:p-8 relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
          {mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'}
        </h2>
        <p className="text-sm text-muted mb-6">
          {mode === 'login' ? 'Entra para votar, sugerir música y ganar puntos.' : mode === 'register' ? 'Únete a la comunidad nightcore de Arequipa.' : 'Te enviaremos un correo con instrucciones para restablecer tu contraseña.'}
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
            {mode !== 'recovery' && (
              <div>
                <label className="label">Contraseña</label>
                <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
            )}

            {error && (
              <div className="badge badge-red w-full justify-start py-2 px-3 normal-case tracking-normal text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {busy ? 'Procesando…' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Registrarme' : 'Recuperar contraseña'}
            </button>
          </form>
        )}

        {!done && (
          <div className="text-xs text-muted text-center mt-5 space-y-2 flex flex-col items-center">
            <p>
              {mode === 'login' ? '¿No tienes cuenta?' : mode === 'register' ? '¿Ya tienes cuenta?' : '¿Recordaste tu contraseña?'}{' '}
              <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="text-neon-pink font-bold hover:underline">
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
            {mode === 'login' && (
              <button type="button" onClick={() => { setMode('recovery'); setError(null); }} className="text-neon-cyan hover:underline transition-colors">
                Olvidé mi contraseña
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? require('react-dom').createPortal(modalContent, document.body) : null;
}
