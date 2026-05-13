// @ts-nocheck
/**
 * @file supabase/functions/send-patient-welcome/index.ts
 *
 * Edge function que envia email al paciente cuando un dentista le crea cuenta
 * en DentalSpot. Reemplaza el flow viejo donde la password era los primeros
 * 6 digitos del RUT (P0 seguridad Ley 21.719 art. 2g).
 *
 * Flow:
 * 1. Dentista crea paciente con email/full_name/rut/phone.
 * 2. Backend genera password aleatoria segura (12 chars sin ambiguos).
 * 3. Despues del signUp en Supabase Auth, invoca esta edge function.
 * 4. Esta edge function envia email al paciente con credenciales.
 *
 * Payload esperado:
 *   { email, full_name, temp_password, dentist_name }
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

function template(full_name: string, email: string, temp_password: string, dentist_name: string) {
  const safeName = full_name || 'Paciente'
  const safeDentist = dentist_name || 'Tu dentista'
  const subject = `${safeDentist} te creó cuenta en DentalSpot`
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0d9488;">Hola ${safeName},</h2>
      <p><strong>${safeDentist}</strong> te creó una cuenta en DentalSpot para que puedas ver tu ficha clínica, agendar citas y comunicarte con tu equipo dental.</p>

      <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #86efac;">
        <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #166534;">Tus credenciales</p>
        <p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 6px 0 0 0;"><strong>Contraseña temporal:</strong> <code style="background: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 16px; letter-spacing: 1px; border: 1px solid #d1d5db;">${temp_password}</code></p>
      </div>

      <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; margin: 20px 0;">
        <p style="margin: 0; color: #78350f; font-size: 14px;">
          <strong>Importante</strong>: cambia tu contraseña al primer ingreso desde "Mi Cuenta → Cambiar contraseña". La contraseña temporal solo debe usarse una vez.
        </p>
      </div>

      <p style="margin: 24px 0;">
        <a href="${APP_URL}/auth/login" style="display: inline-block; background: #0d9488; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Iniciar sesión
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">¿Problemas para entrar? Escribinos a <a href="mailto:soporte@dentalspot.cl">soporte@dentalspot.cl</a>.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="font-size: 11px; color: #9ca3af;">
        DentalSpot SpA — RUT 77.599.283-2 — Hochstetter 1002, oficina 1103, Temuco.
      </p>
    </div>
  `.trim()

  const text = `Hola ${safeName},\n\n${safeDentist} te creó una cuenta en DentalSpot.\n\nTus credenciales:\nEmail: ${email}\nContraseña temporal: ${temp_password}\n\nIMPORTANTE: cambia tu contraseña al primer ingreso desde "Mi Cuenta → Cambiar contraseña".\n\nIniciar sesión: ${APP_URL}/auth/login\n\nAyuda: soporte@dentalspot.cl`

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
    const { email, full_name, temp_password, dentist_name } = body

    if (!email) return errorResponse('email required', 400, req)
    if (!temp_password) return errorResponse('temp_password required', 400, req)

    const tpl = template(full_name || '', email, temp_password, dentist_name || '')

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

    // Auditoria best-effort en email_notifications. No bloquea la response.
    await supabase.from('email_notifications').insert({
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
      metadata: { event: 'patient_welcome', dentist_name },
    }).catch(() => { /* ignore audit failure */ })

    if (!ok) return errorResponse(`Resend failed: ${JSON.stringify(resendBody)}`, 502, req)
    return jsonResponse({ ok: true, message_id: resendBody?.id }, 200, req)

  } catch (e) {
    return errorResponse(`Unexpected: ${(e as Error).message}`, 500, req)
  }
})
