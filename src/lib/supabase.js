import { createClient } from '@supabase/supabase-js';

// Support both build-time (Vite) and runtime (Docker) environment variables
const supabaseUrl = window?.__VITE_SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = window?.__VITE_SUPABASE_ANON_KEY__ || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
}

// Only create the client if we have the required variables to avoid crashing the app
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
