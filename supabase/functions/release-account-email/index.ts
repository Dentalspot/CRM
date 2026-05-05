import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// CORS multi-origen: prod + localhost para dev/QA. Misma allowlist que
// create-mp-checkout para consistencia.
const ALLOWED_ORIGINS = new Set([
  'https://dentalspot.cl',
  'https://www.dentalspot.cl',
  'https://dev.dentalspot.cl',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
])

function corsFor(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://dentalspot.cl'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}
const jsonResponse = (req: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsFor(req), 'Content-Type': 'application/json' } })
const errorResponse = (req: Request, msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsFor(req), 'Content-Type': 'application/json' } })

/**
 * Release Account Email
 *
 * Tras la anonimización de profiles, esta función actualiza el email en auth.users
 * a un placeholder único, liberando el email original para futuro re-registro.
 *
 * Seguridad:
 *   - Requiere JWT del usuario que solicita la eliminación.
 *   - Verifica que profiles.deleted_at IS NOT NULL (sólo procede si la cuenta
 *     ya fue marcada como eliminada por la RPC anterior).
 *   - Sólo modifica el email del propio usuario (auth.uid()).
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsFor(req) })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!SERVICE_ROLE_KEY) return errorResponse(req, 'Missing SUPABASE_SERVICE_ROLE_KEY', 500)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse(req, 'Missing Authorization header', 401)

    // Cliente con JWT del usuario para obtener su id de forma segura
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: getUserErr } = await supabaseUser.auth.getUser()
    if (getUserErr || !user) {
      return errorResponse(req, 'Invalid or expired token', 401)
    }

    // Cliente con service role para operaciones admin
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Verificación: la cuenta ya debe estar marcada como eliminada
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('deleted_at, role')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile) {
      return errorResponse(req, 'Profile not found', 404)
    }
    if (!profile.deleted_at) {
      return errorResponse(
        req,
        'Profile is not marked as deleted. Call request_account_deletion first.',
        400
      )
    }

    // Cambiar el email en auth.users a un placeholder único
    const placeholder = `deleted-${user.id}@dentalspot.local`
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: placeholder,
      email_confirm: true, // skip flow de confirmación, este email es solo placeholder
    })

    if (updateErr) {
      return errorResponse(req, `Failed to update auth user: ${updateErr.message}`, 500)
    }

    return jsonResponse(req, { ok: true, placeholder })
  } catch (e) {
    return errorResponse(req, `Unexpected: ${(e as Error).message}`, 500)
  }
})
