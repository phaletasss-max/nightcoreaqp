// ── Cliente Supabase (móvil) ─────────────────────────────────────────────────
// Reusa la MISMA instancia de Supabase que la web (mismas tablas, misma RLS). No
// es un backend nuevo. La sesión se persiste con AsyncStorage (ya instalado) y se
// auto-refresca según el AppState (foreground/background), patrón oficial de
// Supabase para React Native.
//
// Las claves se leen de variables EXPO_PUBLIC_* (visibles en el bundle, igual que
// la anon key en la web — es pública por diseño; la seguridad real la da la RLS).
// Crea un archivo `.env` en mobile-app/ con:
//   EXPO_PUBLIC_SUPABASE_URL=...
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
// (los mismos valores que NEXT_PUBLIC_SUPABASE_* de la web).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Igual que `cfg()` en la web: true solo si hay credenciales reales.
export const isConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // En móvil no hay URL de callback con el token (eso es de la web/OAuth web).
    detectSessionInUrl: false,
  },
});

// Auto-refresh del token solo mientras la app está en primer plano (recomendado
// por Supabase para no consumir batería/cuota en segundo plano).
AppState.addEventListener('change', (state) => {
  if (!isConfigured) return;
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
