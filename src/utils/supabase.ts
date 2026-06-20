import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with the database
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Helper to check if Supabase is properly configured (i.e. real env vars are set,
// not the placeholders from .env.local.example).
export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('tu-project-ref') &&
    !supabaseUrl.includes('your-project-ref') &&
    !!supabaseAnonKey &&
    !supabaseAnonKey.includes('placeholder') &&
    !supabaseAnonKey.includes('tu-anon-key') &&
    !supabaseAnonKey.includes('your-key-here')
  );
};
