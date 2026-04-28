import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const errorResponse = (msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!SERVICE_ROLE_KEY) return errorResponse('Missing SUPABASE_SERVICE_ROLE_KEY', 500)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Missing Authorization header', 401)

    // Cliente con JWT del usuario para obtener su id de forma segura
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: getUserErr } = await supabaseUser.auth.getUser()
    if (getUserErr || !user) {
      return errorResponse('Invalid or expired token', 401)
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
      return errorResponse('Profile not found', 404)
    }
    if (!profile.deleted_at) {
      return errorResponse(
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
      return errorResponse(`Failed to update auth user: ${updateErr.message}`, 500)
    }

    return jsonResponse({ ok: true, placeholder })
  } catch (e) {
    return errorResponse(`Unexpected: ${(e as Error).message}`, 500)
  }
})
