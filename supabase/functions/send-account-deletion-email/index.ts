import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dentalspot.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const errorResponse = (msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const FROM = 'DentalSpot <no-reply@dentalspot.cl>'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return errorResponse('Missing RESEND_API_KEY', 500)

    const { email, full_name } = await req.json()
    if (!email) return errorResponse('email required', 400)

    const subject = 'Confirmación de eliminación de tu cuenta DentalSpot'
    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0d9488;">Hola ${full_name || 'Usuario'},</h2>
        <p>Confirmamos que tu cuenta en <strong>DentalSpot</strong> ha sido eliminada.</p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Lo que se eliminó:</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #555;">
            <li>Tu nombre, email, teléfono y RUT</li>
            <li>Tu foto de perfil</li>
            <li>Tu acceso a la plataforma</li>
          </ul>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Lo que conservamos por obligación legal:</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #555;">
            <li>Historial clínico anonimizado (5 años)</li>
            <li>Registros de pago anonimizados (5 años)</li>
          </ul>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #888;">
            Conforme a la Ley 21.719 sobre protección de datos personales y normativa sanitaria chilena.
          </p>
        </div>

        <p>Si esta acción no fue realizada por ti o necesitas más información, contáctanos a la brevedad:
          <a href="mailto:dentalspot.cl@gmail.com">dentalspot.cl@gmail.com</a>
        </p>

        <p style="color: #888;">Gracias por haber sido parte de DentalSpot.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #888;">
          DentalSpot SpA — RUT 77.599.283-2 — Hochstetter 1002, oficina 1103
        </p>
      </div>
    `.trim()

    const text = `Hola ${full_name || 'Usuario'},\n\nTu cuenta DentalSpot ha sido eliminada.\n\nDatos personales eliminados: nombre, email, teléfono, RUT, foto.\nDatos retenidos por obligación legal (5 años, anonimizados): historial clínico, registros de pago.\n\nSi tienes dudas: dentalspot.cl@gmail.com\n\nGracias por haber sido parte de DentalSpot.`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject,
        html,
        text,
      }),
    })

    const resendBody = await resendRes.json().catch(() => ({}))
    const ok = resendRes.ok

    // Registro auditable (best effort)
    await supabase.from('email_notifications').insert({
      user_id: null, // ya está anonimizado, no podemos referenciar
      notification_type: 'system_update',
      subject,
      body_html: html,
      body_text: text,
      recipient_email: email,
      status: ok ? 'sent' : 'failed',
      sent_at: ok ? new Date().toISOString() : null,
      failed_at: ok ? null : new Date().toISOString(),
      error_message: ok ? null : JSON.stringify(resendBody),
      metadata: { event: 'account_deletion_confirmation', resend_id: resendBody?.id ?? null },
    }).catch(() => { /* ignore audit failure */ })

    if (!ok) return errorResponse(`Resend failed: ${JSON.stringify(resendBody)}`, 502)
    return jsonResponse({ ok: true, message_id: resendBody?.id })

  } catch (e) {
    return errorResponse(`Unexpected: ${(e as Error).message}`, 500)
  }
})
