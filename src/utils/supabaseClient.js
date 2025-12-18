import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials missing.');
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.error('Failed to initialize Supabase client:', err);
  // Fallback dummy object to prevent top-level crashes
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ error: new Error('Auth not configured') }),
      signUp: () => Promise.resolve({ error: new Error('Auth not configured') }),
      signInWithOtp: () => Promise.resolve({ error: new Error('Auth not configured') }),
      signInWithOAuth: () => Promise.resolve({ error: new Error('Auth not configured') }),
      signOut: () => Promise.resolve({ error: null }),
    }
  };
}

export { supabase };
