// @ts-nocheck
/**
 * @file supabase/functions/send-signup-approval/index.ts
 *
 * Edge function que notifica a un profesional cuando un admin aprobó su signup.
 * Forma parte del gate pre-launch (Ley 21.719 verificación humana).
 *
 * Flow:
 *   1. Admin clickea "Aprobar" en /dashboard/admin/signup-approvals
 *   2. Frontend invoca RPC approve_signup() (DB updates approval_status)
 *   3. Frontend invoca esta edge function (best-effort, no bloquea aprobación)
 *   4. Resend envía email con CTA "Iniciá sesión"
 *
 * Payload esperado:
 *   { email, full_name, role }  // role: 'therapist' | 'clinic'
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ALLOWED_ORIGINS = [
  'https://dentalspot.cl',
  'https://www.dentalspot.cl',
  'https://dev.dentalspot.cl',
  'https://dentalspot.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://localhost:4173',
]

const corsFor = (req: Request) => {
  const origin = req.headers.get('origin') || ''
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const jsonResponse = (data: unknown, status = 200, req?: Request) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...(req ? corsFor(req) : {}), 'Content-Type': 'application/json' },
  })

const errorResponse = (msg: string, status = 500, req?: Request) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...(req ? corsFor(req) : {}), 'Content-Type': 'application/json' },
  })

const FROM = 'DentalSpot <no-reply@dentalspot.cl>'
const APP_URL = 'https://dentalspot.cl'

function template(full_name: string, role: string) {
  const safeName = full_name || 'Profesional'
  const isDentist = role === 'therapist'
  const subject = `Tu cuenta en DentalSpot fue aprobada`
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); border-radius: 16px; padding: 32px 24px; text-align: center; color: white;">
        <div style="font-size: 48px; margin-bottom: 8px;">✓</div>
        <h2 style="margin: 0; font-size: 22px;">¡Bienvenido a DentalSpot!</h2>
        <p style="margin: 8px 0 0 0; opacity: 0.95;">Tu cuenta fue aprobada</p>
      </div>

      <p style="margin: 24px 0 12px 0;">Hola <strong>${safeName}</strong>,</p>
      <p style="margin: 0 0 16px 0;">
        Nuestro equipo revisó y aprobó tu solicitud de registro. Ya puedes ingresar al sistema
        y empezar a gestionar ${isDentist ? 'tus pacientes, agenda y consulta' : 'tu clínica, equipo y pacientes'}.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #166534; font-weight: 600;">Próximos pasos</p>
        <ol style="margin: 0; padding-left: 18px; color: #14532d;">
          ${isDentist
            ? `<li style="margin-bottom: 6px;">Completa los datos de tu lugar de atención en "Mi Perfil"</li>
               <li style="margin-bottom: 6px;">Configura tu agenda y horarios</li>
               <li>Empieza a registrar pacientes</li>`
            : `<li style="margin-bottom: 6px;">Completa los datos de tu clínica en "Mi Perfil"</li>
               <li style="margin-bottom: 6px;">Invita a los dentistas de tu equipo desde "Gestión de Personal"</li>
               <li>Tu equipo puede empezar a operar</li>`
          }
        </ol>
      </div>

      <p style="margin: 24px 0;">
        <a href="${APP_URL}/auth/login" style="display: inline-block; background: #0d9488; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
          Iniciar sesión
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">¿Dudas? Escríbenos a <a href="mailto:soporte@dentalspot.cl" style="color: #0d9488;">soporte@dentalspot.cl</a>.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="font-size: 11px; color: #9ca3af;">
        DentalSpot SpA — RUT 77.599.283-2 — Hochstetter 1002, oficina 1103, Temuco.
      </p>
    </div>
  `.trim()

  const text = `Hola ${safeName},\n\n¡Tu cuenta en DentalSpot fue aprobada!\n\nYa puedes ingresar al sistema: ${APP_URL}/auth/login\n\n${isDentist
    ? 'Pasos sugeridos:\n1. Completa tu lugar de atención en "Mi Perfil"\n2. Configura tu agenda\n3. Empieza a registrar pacientes'
    : 'Pasos sugeridos:\n1. Completa los datos de tu clínica\n2. Invita a los dentistas de tu equipo\n3. Tu equipo puede operar'
  }\n\n¿Dudas? soporte@dentalspot.cl`

  return { subject, html, text }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsFor(req) })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405, req)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return errorResponse('Missing RESEND_API_KEY', 500, req)

    const body = await req.json()
    const { email, full_name, role } = body

    if (!email) return errorResponse('email required', 400, req)
    if (!role) return errorResponse('role required', 400, req)

    const tpl = template(full_name || '', role)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      }),
    })

    const resendBody = await resendRes.json().catch(() => ({}))
    const ok = resendRes.ok

    // Auditoría best-effort en email_notifications (mismo patrón que send-patient-welcome
    // fix de 2026-05-13: try/catch real, no .catch del builder).
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', String(email).toLowerCase().trim())
        .maybeSingle()

      if (profile?.id) {
        await supabase.from('email_notifications').insert({
          user_id: profile.id,
          notification_type: 'system_update',
          subject: tpl.subject,
          body_html: tpl.html,
          body_text: tpl.text,
          recipient_email: email,
          status: ok ? 'sent' : 'failed',
          sent_at: ok ? new Date().toISOString() : null,
          failed_at: ok ? null : new Date().toISOString(),
          error_message: ok ? null : JSON.stringify(resendBody),
          resend_id: resendBody?.id ?? null,
          metadata: { event: 'signup_approval', role },
        })
      }
    } catch (_auditErr) {
      // Ignore audit failure — el email a Resend ya se envió.
    }

    if (!ok) return errorResponse(`Resend failed: ${JSON.stringify(resendBody)}`, 502, req)
    return jsonResponse({ ok: true, message_id: resendBody?.id }, 200, req)
  } catch (e) {
    return errorResponse(`Unexpected: ${(e as Error).message}`, 500, req)
  }
})
