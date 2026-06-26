// ── Auth (móvil) ──────────────────────────────────────────────────────────────
// Contexto de sesión, espejo simplificado de src/lib/auth.tsx (web). Usa la sesión
// real de Supabase (persistida con AsyncStorage por lib/supabase.ts). No hay modo
// invitado/demo en el móvil: sin sesión, `profile` es null.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isConfigured } from './supabase';
import { getProfile } from './data';
import type { Profile } from './types';

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) { setProfile(null); return; }
    const p = await getProfile(userId);
    setProfile(p);
  }, []);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      await loadProfile(session?.user?.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      loadProfile(session?.user?.id);
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signIn: AuthValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthValue['signUp'] = async (email, password, username) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const refresh = async () => { await loadProfile(session?.user?.id); };

  const isStaff = profile?.role === 'admin' || profile?.role === 'dj';

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, configured: isConfigured, isStaff, signIn, signUp, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
