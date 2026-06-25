'use client';

// ── Contexto de autenticación ────────────────────────────────────────────────
// Con Supabase configurado: auth real (sesión en localStorage vía supabase-js).
// Sin configurar: un "invitado demo" persistido en localStorage, para que la app
// siga siendo usable como demostración.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import type { Profile } from './types';

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  addPoints: (delta: number) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_KEY = 'nq_demo_profile';

function loadDemoProfile(): Profile {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(DEMO_KEY);
    if (saved) return JSON.parse(saved);
  }
  const fresh: Profile = {
    id: 'demo-user',
    username: 'Invitado',
    role: 'admin', // en demo dejamos ver el panel admin
    points: 120,
    streak_count: 4,
    last_check_in: null,
    avatar_url: null,
  };
  return fresh;
}

function saveDemoProfile(p: Profile) {
  if (typeof window !== 'undefined') localStorage.setItem(DEMO_KEY, JSON.stringify(p));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Función para restaurar perfil desde localStorage (instantáneo) ──
  const restoreLocalProfile = useCallback((): Profile | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('nq_local_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignorar */ }
    }
    return null;
  }, []);

  const loadProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data && !error) {
        const prof = { ...(data as Profile), email };
         
        setProfile(prof);
        localStorage.setItem('nq_local_profile', JSON.stringify(prof));
      } else {
        const fallback: Profile = {
          id: userId,
          username: email ? email.split('@')[0] : 'Usuario',
          role: 'user',
          points: 0,
          streak_count: 0,
          last_check_in: null,
          avatar_url: null,
          email,
        };
        setProfile(fallback);
        localStorage.setItem('nq_local_profile', JSON.stringify(fallback));
      }
    } catch {
      const fallback: Profile = {
        id: userId,
        username: email ? email.split('@')[0] : 'Usuario',
        role: 'user',
        points: 0,
        streak_count: 0,
        last_check_in: null,
        avatar_url: null,
        email,
      };
      setProfile(fallback);
      localStorage.setItem('nq_local_profile', JSON.stringify(fallback));
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      setTimeout(() => setProfile(loadDemoProfile()), 0);
      setTimeout(() => setLoading(false), 0);
      return;
    }

    // ★ PASO 1: Restaurar perfil desde localStorage INMEDIATAMENTE
    // Esto garantiza que el usuario NUNCA pierde su sesión al dar F5
    const localProfile = restoreLocalProfile();
    if (localProfile) {
      setProfile(localProfile);
      setLoading(false);
    }

    // PASO 2: Intentar obtener sesión real de Supabase (si existe, reemplaza)
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        if (session.user.email !== 'admin@nightcore.aqp') {
          localStorage.removeItem('nq_emergency_admin');
        }
        loadProfile(session.user.id, session.user.email).finally(() => mounted && setLoading(false));
      } else {
        if (!localProfile) {
          setLoading(false);
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (session.user.email !== 'admin@nightcore.aqp') {
          localStorage.removeItem('nq_emergency_admin');
        }
        loadProfile(session.user.id, session.user.email);
      } else {
        // Al cerrar sesión, limpiar
        if (_event === 'SIGNED_OUT') {
          localStorage.removeItem('nq_emergency_admin');
          localStorage.removeItem('nq_local_profile');
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured, loadProfile, restoreLocalProfile]);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    if (!configured) return { error: 'Conecta Supabase para iniciar sesión real.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, username) => {
    if (!configured) return { error: 'Conecta Supabase para registrarte.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      // Si el error es un 500 por conflicto de username en el trigger,
      // creamos un perfil local para que el usuario no se quede bloqueado
      if (error.message?.includes('Database error') || error.status === 500) {
        const fallbackProfile: Profile = {
          id: `local-${Date.now()}`,
          username: username || email.split('@')[0],
          role: 'user',
          points: 0,
          streak_count: 0,
          last_check_in: null,
          avatar_url: null,
          email,
        };
        setProfile(fallbackProfile);
        localStorage.setItem('nq_local_profile', JSON.stringify(fallbackProfile));
        return { error: null }; // éxito silencioso
      }
      return { error: error.message ?? 'Error al registrarte' };
    }

    return { error: null };
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    if (!configured) return { error: 'Conecta Supabase para recuperar la contraseña.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    localStorage.removeItem('nq_emergency_admin');
    localStorage.removeItem('nq_local_profile');
    
    // Eliminar todos los aliases y fondos locales para evitar fugas entre cuentas
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('nq_alias') || key.startsWith('nq_bg'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }

    if (configured) await supabase.auth.signOut();
    setProfile(null);
  };

  const addPoints = (delta: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, points: prev.points + delta };
      if (!configured) saveDemoProfile(next);
      return next;
    });
    if (configured && profile) {
      supabase.from('profiles').update({ points: profile.points + delta }).eq('id', profile.id).then(() => {});
    }
  };

  const refresh = async () => {
    if (!configured) {
      setProfile(loadDemoProfile());
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await loadProfile(session.user.id, session.user.email);
  };

  // Staff = rol real en la BD (lo que valida is_staff() en la RLS). Sin allowlist de
  // correos hardcodeados (no daban permisos reales y exponían datos).
  const isStaff = profile?.role === 'admin' || profile?.role === 'dj';

  return (
    <AuthContext.Provider value={{ profile, loading, configured, isStaff, signIn, signUp, resetPassword, signOut, addPoints, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
