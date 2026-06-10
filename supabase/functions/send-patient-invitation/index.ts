// @ts-nocheck
/**
 * @file supabase/functions/send-patient-invitation/index.ts
 *
 * Spec 030 followup: envía email al paciente invitándolo a crear cuenta en
 * DentalSpot. El paciente recibe link con token único y al aceptar se vincula
 * automáticamente a su patient row existente (via RUT match).
 *
 * Flow:
 * 1. Dentista clickea "Enviar invitación" en la ficha del paciente.
 * 2. Frontend INSERT en patient_invitations + invoca esta edge function.
 * 3. Esta edge function lee el row + envía email con link /auth/accept-invitation?token=xxx.
 *
 * Payload esperado:
 *   { invitation_id }
 *
 * Auth: requiere usuario logueado (RLS valida que sea dentista/admin de la org).
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
const PROD_URL = 'https://dentalspot.cl'

// Spec 030 followup: resolver el APP_URL desde el Origin del request para que
// en local el email genere link de localhost y en prod genere link de prod.
// Solo aceptamos origins de la allowlist; en cualquier otro caso, fallback a prod.
function resolveAppUrl(req: Request): string {
  const origin = req.headers.get('origin') || ''
  if (ALLOWED_ORIGINS.includes(origin)) return origin
  return PROD_URL
}

function template(
  patientName: string,
  dentistName: string,
  organizationName: string,
  acceptUrl: string,
) {
  const safeName = patientName || 'Paciente'
  const safeDentist = dentistName || 'Tu dentista'
  const safeOrg = organizationName || 'tu clínica'
  const subject = `${safeDentist} te invitó a DentalSpot`

  // Template visual consistente con spec 023 (clinic-invitations):
  // logo horizontal, línea acento teal, badge de rol, footer claro.
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f8fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);overflow:hidden;">
          <tr>
            <td align="center" style="padding:40px 32px 24px 32px;">
              <img src="https://dentalspot.cl/logo-dentalspot-full.png" alt="DentalSpot" height="40" style="display:block;border:0;max-width:240px;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px;">
              <div style="width:48px;height:3px;background:linear-gradient(90deg,#14B8A6,#45b5c4);border-radius:2px;margin:0 auto;"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 8px 32px;">
              <div style="display:inline-block;background:#ecfdf5;color:#047857;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:12px">🦷 INVITACIÓN DE PACIENTE</div>
              <h1 style="margin:8px 0 0 0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;line-height:1.3;">Hola ${safeName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 8px 40px;font-size:15px;line-height:1.7;color:#374151;">
              <p style="margin:0 0 16px 0;"><strong>${safeDentist}</strong>, de <strong>${safeOrg}</strong>, te invitó a usar DentalSpot.</p>
              <p style="margin:0;color:#475569;font-size:14px;">Al activar tu cuenta vas a poder ver:</p>
              <ul style="margin:8px 0 0 0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
                <li>Tu plan de tratamiento con barra de avance</li>
                <li>Lo pagado y lo que te queda por pagar</li>
                <li>Las indicaciones que tu dentista te deja después de cada sesión</li>
                <li>Tus próximas citas y agenda</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 16px 32px;">
              <a href="${acceptUrl}" style="display:inline-block;padding:14px 36px;background-color:#14B8A6;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em;box-shadow:0 1px 3px rgba(20,184,166,0.3);">Activar mi cuenta</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 8px 40px;">
              <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;">
                <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;">
                  <strong>Importante:</strong> el enlace vence en 7 días. Para validar tu identidad, te vamos a pedir tu RUT al registrarte.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 8px 40px;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">
              ¿No funciona el botón? Copiá este enlace:<br>
              <a href="${acceptUrl}" style="color:#14B8A6;word-break:break-all;">${acceptUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 24px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;">Si no esperabas esta invitación, podés ignorar este correo.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px;background-color:#ffffff;border-top:1px solid #f1f5f9;font-size:11px;line-height:1.6;color:#94a3b8;">
              <p style="margin:0 0 8px 0;color:#475569;font-weight:600;font-size:13px;">DentalSpot</p>
              <p style="margin:0 0 12px 0;">La plataforma odontológica de Chile</p>
              <p style="margin:0;">
                <a href="https://dentalspot.cl/legal/politica-privacidad" style="color:#94a3b8;text-decoration:none;">Privacidad</a>
                &nbsp;·&nbsp;
                <a href="https://dentalspot.cl/legal/terminos-condiciones" style="color:#94a3b8;text-decoration:none;">Términos</a>
                &nbsp;·&nbsp;
                <a href="mailto:soporte@dentalspot.cl" style="color:#94a3b8;text-decoration:none;">Soporte</a>
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;margin-top:16px;">
          <tr>
            <td align="center" style="font-size:11px;color:#94a3b8;padding:0 32px;line-height:1.5;">
              DentalSpot SpA · RUT 77.599.283-2 · Hochstetter 1002, oficina 1103, Temuco · soporte@dentalspot.cl
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `Hola ${safeName},

${safeDentist}, de ${safeOrg}, te invitó a usar DentalSpot.

Al activar tu cuenta vas a poder ver:
- Tu plan de tratamiento con barra de avance
- Lo pagado y lo que te queda por pagar
- Indicaciones de tu dentista después de cada sesión
- Tus próximas citas

Activá acá (vence en 7 días):
${acceptUrl}

IMPORTANTE: te vamos a pedir tu RUT para validar tu identidad.

¿Dudas? soporte@dentalspot.cl

Si no esperabas esta invitación, ignorá este correo.

DentalSpot SpA · RUT 77.599.283-2 · Temuco, Chile`

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
    const { invitation_id } = body

    if (!invitation_id) return errorResponse('invitation_id required', 400, req)

    // Fetch invitation + paciente + dentista + org
    const { data: inv, error: invErr } = await supabase
      .from('patient_invitations')
      .select('id, patient_id, organization_id, invited_by, email, token, expires_at')
      .eq('id', invitation_id)
      .single()

    if (invErr || !inv) {
      return errorResponse('Invitation not found', 404, req)
    }

    if (!inv.email) {
      return errorResponse('Invitation has no email (use accept_url instead)', 400, req)
    }

    // Resolver nombre del paciente (profile o full_name denorm)
    const { data: patientRow } = await supabase
      .from('patients')
      .select(`
        full_name,
        profile:profiles!patients_profile_id_fkey(full_name)
      `)
      .eq('id', inv.patient_id)
      .maybeSingle()
    const patientName = patientRow?.profile?.full_name || patientRow?.full_name || ''

    const { data: dentistRow } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', inv.invited_by)
      .maybeSingle()
    const dentistName = dentistRow?.full_name || ''

    const { data: orgRow } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', inv.organization_id)
      .maybeSingle()
    const organizationName = orgRow?.name || ''

    const appUrl = resolveAppUrl(req)
    const acceptUrl = `${appUrl}/auth/accept-invitation?token=${encodeURIComponent(inv.token)}`
    const tpl = template(patientName, dentistName, organizationName, acceptUrl)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [inv.email],
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      }),
    })

    const resendBody = await resendRes.json().catch(() => ({}))
    const ok = resendRes.ok

    if (!ok) {
      return errorResponse(
        `Resend rejected: ${JSON.stringify(resendBody)}`,
        500,
        req
      )
    }

    return jsonResponse(
      { ok: true, accept_url: acceptUrl, resend_id: resendBody?.id ?? null },
      200,
      req
    )
  } catch (err) {
    return errorResponse(err?.message || 'Unknown error', 500, req)
  }
})
