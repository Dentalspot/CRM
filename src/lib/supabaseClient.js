import logger from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('⚠️ Faltan variables de entorno de Supabase');
  logger.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗ FALTA');
  logger.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗ FALTA');
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY');
}

/**
 * Supabase Client Initialization
 * 
 * TIMEZONE HANDLING NOTE:
 * Supabase/PostgreSQL stores timestamps in UTC by default (timestamptz).
 * When querying/saving dates:
 * 1. Read: Use 'profiles.timezone' preference to convert UTC timestamps to user's local time for display.
 *    Libraries like date-fns-tz or Intl.DateTimeFormat should be used in UI components.
 * 2. Write: Convert user's local time input to UTC before saving to the database.
 *    Ensure that appointment times respect the stored timezone offset.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'dentalspot-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: {},
  },
});

export default supabase;