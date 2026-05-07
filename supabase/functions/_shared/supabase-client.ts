import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// CORS restringido: solo acepta requests de dominios autorizados de DentalSpot
const ALLOWED_ORIGINS = [
  'https://dentalspot.cl',
  'https://www.dentalspot.cl',
  'https://dentalspot.vercel.app',
  'http://localhost:5173',    // desarrollo local Vite
  'http://localhost:3000',    // desarrollo local alternativo
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}

// Mantener compatibilidad temporal con funciones que importan corsHeaders
// TODO: migrar todas las funciones a getCorsHeaders(req) y eliminar este export
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dentalspot.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

export function createSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization')
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader ?? '' } } }
  )
}

export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
