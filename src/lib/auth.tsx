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

  const loadProfile = useCallback(async (userId: string, email?: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile({ ...(data as Profile), email });
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      // Sincroniza el perfil demo desde localStorage al montar (solo en cliente,
      // por eso va en un efecto y no en el initializer: evita mismatch de hidratación).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(loadDemoProfile());
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadProfile(session.user.id, session.user.email).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    if (!configured) return { error: 'Conecta Supabase para iniciar sesión real.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, username) => {
    if (!configured) return { error: 'Conecta Supabase para registrarte.' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
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

  const ADMIN_EMAILS = ['manchuriam@nightcore.aqp.fest.com', 'phaletasss@gmail.com'];
  const isStaff = profile?.role === 'admin' || profile?.role === 'dj' || (profile?.email ? ADMIN_EMAILS.includes(profile.email) : false);

  return (
    <AuthContext.Provider value={{ profile, loading, configured, isStaff, signIn, signUp, signOut, addPoints, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
