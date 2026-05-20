import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Safely create Supabase client. If credentials are placeholders, we'll gracefully fallback
// to log warnings instead of throwing runtime errors that completely crash the application startup.
export const isSupabaseConfigured = 
  supabaseUrl !== 'https://placeholder-url.supabase.co' && 
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey !== 'placeholder-anon-key' &&
  supabaseAnonKey.trim() !== '';

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase has not been configured yet. AutoMission Pro will run fully in Local/Offline mode (using LocalStorage/IndexedDB). ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file to connect your cloud database.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
