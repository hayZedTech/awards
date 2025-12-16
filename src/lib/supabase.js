import { createClient } from '@supabase/supabase-js';

// Load variables from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safety Check: Ensure keys exist before initializing
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('⚠️ Supabase URL or Anon Key is missing! Check your .env file.');
}

// Initialize the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);