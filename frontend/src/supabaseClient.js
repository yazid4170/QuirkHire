import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    redirectTo: process.env.REACT_APP_SITE_URL,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}); 