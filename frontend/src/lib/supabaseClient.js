import { createClient } from '@supabase/supabase-js';

const SUPABASE_BASE = process.env.REACT_APP_SUPABASE_BASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Client dédié à l'auth admin (Supabase Auth). Les lectures publiques
// d'articles continuent de passer par fetch() direct dans api.js — ce client
// ne gère que la session admin et les RPC note_perso.
export const supabase = createClient(SUPABASE_BASE, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'techwatch-admin-auth',
  },
});
