import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const errorResponse = (msg: string, status = 500) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// Generate 8-char alphanumeric invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ============================================
// EMAIL 1: Aceptacion (inmediato)
// ============================================
function buildEmail1Html(nombre: string, inviteLink: string): string {
  const firstName = nombre.split(' ')[0]
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#00bcb5 0%,#16d6db 100%);padding:40px 32px;text-align:center;">
    <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;">Programa AFI</h1>
    <p style="color:#94a3b8;font-size:14px;margin:0;">Automatización Fonoaudiológica con Inteligencia Artificial</p>
  </div>

  <div style="padding:32px;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Hola ${firstName},</p>

    <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 16px;">
      Revisamos tu postulación al Programa de Automatización Fonoaudiológica con Inteligencia Artificial.
    </p>

    <div style="background:#d2f2f0;border-left:4px solid #00bcb5;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="font-size:18px;font-weight:700;color:#00897b;margin:0;">Fuiste seleccionada.</p>
    </div>

    <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 20px;">
      De las profesionales que aplicaron, solo un grupo reducido cumplió con el perfil que buscamos para esta primera cohorte. Tú estás dentro.
    </p>

    <p style="font-size:15px;color:#1e293b;font-weight:600;margin:0 0 16px;">
      Esto es lo que significa ser parte del Programa AFI:
    </p>

    <div style="margin:0 0 24px;">
      <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <p style="font-size:14px;color:#1e293b;margin:0;"><strong>&rarr; Sello "Profesional Fundadora":</strong> un reconocimiento permanente que identifica a quienes estuvieron desde el inicio. No se compra. No se consigue después.</p>
      </div>
      <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <p style="font-size:14px;color:#1e293b;margin:0;"><strong>&rarr; FonoLevel activado:</strong> el primer sistema en Latinoamérica que cuantifica y verifica tus competencias profesionales reales. Tus estudios, especializaciones y trayectoria clínica traducidos en un score visible y verificable.</p>
      </div>
      <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <p style="font-size:14px;color:#1e293b;margin:0;"><strong>&rarr; Perfil verificado:</strong> validación de tu formación y especialidades con doble verificación. Tus futuros pacientes van a saber, antes de agendar, que eres exactamente la profesional que necesitan.</p>
      </div>
      <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <p style="font-size:14px;color:#1e293b;margin:0;"><strong>&rarr; Prioridad de visibilidad:</strong> cuando la plataforma se abra a pacientes, las profesionales fundadoras aparecen primero. Ventaja de haber llegado temprano.</p>
      </div>
      <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <p style="font-size:14px;color:#1e293b;margin:0;"><strong>&rarr; Registro clínico para cumplimiento normativo:</strong> la Ley de Protección de Datos Personales entra en vigencia este 2026. Si te auditan, necesitas tener tu registro de pacientes en orden. Esto lo resuelves gratis desde el día uno.</p>
      </div>
      <div style="padding:12px 0;">
        <p style="font-size:14px;color:#1e293b;margin:0;"><strong>&rarr; 10 invitaciones exclusivas:</strong> solo tú puedes invitar a colegas de tu confianza. Nadie más puede registrarse sin una invitación de alguien que ya este dentro.</p>
      </div>
    </div>

    <div style="background:#fffbeb;border:1px solid #ff74c3;padding:12px 16px;border-radius:8px;margin:0 0 24px;text-align:center;">
      <p style="font-size:14px;color:#c2185b;margin:0;font-weight:600;">Tu cupo está reservado por las próximas 72 horas.</p>
    </div>

    <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">
      <strong>Paso siguiente:</strong> regístrate, completa tu perfil profesional y deja que el sistema calcule tu FonoLevel.
    </p>

    <div style="text-align:center;margin:0 0 24px;">
      <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#ff74c3 0%,#e8559f 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
        Registrarme en Fonokit
      </a>
    </div>

    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0 0 8px;">O copia este enlace en tu navegador:</p>
    <p style="font-size:12px;color:#64748b;text-align:center;word-break:break-all;margin:0 0 24px;background:#f8fafc;padding:8px 12px;border-radius:6px;">${inviteLink}</p>

    <p style="font-size:15px;color:#475569;margin:0;">Nos vemos dentro de la app.</p>
  </div>

  <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="font-size:12px;color:#94a3b8;margin:0;">Fonokit &mdash; Plataforma clínica para fonoaudiólogos</p>
    <p style="font-size:11px;color:#cbd5e1;margin:4px 0 0;">Este email fue enviado porque completaste el formulario de solicitud al Programa AFI.</p>
  </div>

</div>
</body>
</html>`
}

// ============================================
// EMAIL 2: Recordatorio 48h (quedan 24h)
// ============================================
function buildEmail2Html(nombre: string, inviteLink: string): string {
  const firstName = nombre.split(' ')[0]
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#00bcb5 0%,#16d6db 100%);padding:32px;text-align:center;">
    <h1 style="color:#ffffff;font-size:22px;margin:0;">Programa AFI</h1>
  </div>

  <div style="padding:32px;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Hola ${firstName},</p>

    <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 16px;">
      Te escribimos porque hace 2 días te notificamos que fuiste seleccionada para el Programa AFI, pero aún no has completado tu registro.
    </p>

    <div style="background:#fce4ec;border-left:4px solid #ff74c3;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="font-size:16px;font-weight:700;color:#c2185b;margin:0;">Tu cupo vence en menos de 24 horas.</p>
    </div>

    <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 20px;">
      Sabemos que a veces el día a día no deja tiempo, pero no queremos que pierdas tu lugar. El registro toma menos de 3 minutos.
    </p>

    <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Si tienes alguna duda o necesitas ayuda con el proceso, estamos disponibles para asistirte. No dudes en responder este correo.
    </p>

    <div style="text-align:center;margin:0 0 24px;">
      <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#ff74c3 0%,#e8559f 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
        Completar mi registro ahora
      </a>
    </div>

    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0 0 8px;">Tu enlace personal:</p>
    <p style="font-size:12px;color:#64748b;text-align:center;word-break:break-all;margin:0 0 24px;background:#f8fafc;padding:8px 12px;border-radius:6px;">${inviteLink}</p>

    <p style="font-size:15px;color:#475569;margin:0;">Estamos para ayudarte,<br><strong>Equipo Fonokit</strong></p>
  </div>

  <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="font-size:12px;color:#94a3b8;margin:0;">Fonokit &mdash; Plataforma clínica para fonoaudiólogos</p>
  </div>

</div>
</body>
</html>`
}

// ============================================
// EMAIL 3: Último aviso 72h + WhatsApp
// ============================================
function buildEmail3Html(nombre: string, inviteLink: string): string {
  const firstName = nombre.split(' ')[0]
  const whatsappLink = 'https://wa.me/56934200434?text=' + encodeURIComponent(`¡Hola! Soy ${firstName}, fui seleccionada al Programa AFI y necesito ayuda para registrarme.`)
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#00bcb5 0%,#16d6db 100%);padding:32px;text-align:center;">
    <h1 style="color:#ffffff;font-size:22px;margin:0;">Programa AFI</h1>
  </div>

  <div style="padding:32px;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Hola ${firstName},</p>

    <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 16px;">
      Este es nuestro último mensaje sobre tu selección al Programa AFI.
    </p>

    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="font-size:16px;font-weight:700;color:#b71c1c;margin:0;">Tu cupo ha expirado.</p>
    </div>

    <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 20px;">
      Entendemos que quizás tuviste dudas o dificultades técnicas. Si todavía tienes interés en ser parte del grupo fundador, escríbenos directamente por WhatsApp y vemos cómo ayudarte.
    </p>

    <!-- WhatsApp CTA -->
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${whatsappLink}" style="display:inline-block;background:linear-gradient(135deg,#25d366 0%,#128c7e 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
        Escribenos por WhatsApp
      </a>
    </div>

    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0 0 24px;">
      O escribe directamente a <strong style="color:#64748b;">+56 9 3420 0434</strong>
    </p>

    <!-- Secondary CTA: register link still works -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:0 0 24px;">
      <p style="font-size:13px;color:#64748b;margin:0 0 8px;text-align:center;">Si prefieres registrarte directamente, tu enlace sigue activo:</p>
      <p style="font-size:12px;color:#2563eb;text-align:center;word-break:break-all;margin:0;">
        <a href="${inviteLink}" style="color:#2563eb;">${inviteLink}</a>
      </p>
    </div>

    <p style="font-size:15px;color:#475569;margin:0;">Un abrazo,<br><strong>Equipo Fonokit</strong></p>
  </div>

  <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="font-size:12px;color:#94a3b8;margin:0;">Fonokit &mdash; Plataforma clínica para fonoaudiólogos</p>
  </div>

</div>
</body>
</html>`
}

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return errorResponse('Missing RESEND_API_KEY', 500)

    const body = await req.json()

    // ============================================
    // ACTION: process_followups (called by cron)
    // ============================================
    if (body.action === 'process_followups') {
      const now = new Date().toISOString()

      const { data: pending, error: fetchErr } = await supabase
        .from('email_notifications')
        .select('id, recipient_email, subject, body_html, metadata')
        .eq('notification_type', 'form_auto_responder')
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true })
        .limit(50)

      if (fetchErr) {
        console.error('[AFI-FOLLOWUP] Fetch error:', fetchErr)
        return errorResponse('Failed to fetch pending emails')
      }

      if (!pending || pending.length === 0) {
        return jsonResponse({ success: true, processed: 0, message: 'No pending follow-ups' })
      }

      let sent = 0, failed = 0

      for (const notif of pending) {
        try {
          // Check if user already registered (skip if converted)
          const meta = notif.metadata as Record<string, unknown> || {}
          const leadEmail = notif.recipient_email

          const { data: lead } = await supabase
            .from('marketing_leads')
            .select('status')
            .eq('email', leadEmail)
            .single()

          // Skip if lead already converted/registered
          if (lead?.status === 'converted' || lead?.status === 'registered') {
            await supabase.from('email_notifications')
              .update({ status: 'cancelled', error_message: 'Lead already registered' })
              .eq('id', notif.id)
            continue
          }

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Fonokit <no-reply@fonokit.cl>',
              reply_to: 'hola@fonokit.cl',
              to: [leadEmail],
              subject: notif.subject,
              html: notif.body_html,
            }),
          })

          const resData = await res.json()

          if (res.ok) {
            await supabase.from('email_notifications')
              .update({ status: 'sent', sent_at: new Date().toISOString(), resend_id: resData.id || null })
              .eq('id', notif.id)
            sent++
          } else {
            await supabase.from('email_notifications')
              .update({ status: 'failed', error_message: resData.message || 'Resend error' })
              .eq('id', notif.id)
            failed++
          }

          // Rate limit
          await new Promise(r => setTimeout(r, 200))
        } catch (err) {
          await supabase.from('email_notifications')
            .update({ status: 'failed', error_message: err.message })
            .eq('id', notif.id)
          failed++
        }
      }

      console.log(`[AFI-FOLLOWUP] Processed: ${sent} sent, ${failed} failed`)
      return jsonResponse({ success: true, sent, failed })
    }

    // ============================================
    // ACTION: default — new form submission
    // ============================================
    const { name, email, secret } = body

    // Validate secret token
    const expectedSecret = Deno.env.get('FORM_AUTO_RESPONDER_SECRET') || 'fonokit-afi-2026'
    if (secret !== expectedSecret) {
      return errorResponse('Invalid secret', 403)
    }

    if (!email) return errorResponse('email is required', 400)
    if (!name) return errorResponse('name is required', 400)

    const cleanEmail = email.toLowerCase().trim()

    // Check if already sent (avoid duplicates)
    const { data: existing } = await supabase
      .from('email_notifications')
      .select('id')
      .eq('recipient_email', cleanEmail)
      .eq('notification_type', 'form_auto_responder')
      .is('scheduled_for', null) // only check the immediate email, not follow-ups
      .limit(1)

    if (existing && existing.length > 0) {
      return jsonResponse({ success: true, message: 'Email already sent to this address', skipped: true })
    }

    // Generate unique invite code
    const inviteCode = generateInviteCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Insert invitation
    const { error: inviteError } = await supabase
      .from('therapist_invitations')
      .insert({
        invite_code: inviteCode,
        inviter_id: null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })

    if (inviteError) {
      console.error('[AUTO-RESPONDER] Failed to create invitation:', inviteError.message)
    }

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://fonokit.cl'
    const inviteLink = `${frontendUrl}/auth/register?invite=${inviteCode}`

    // ---- EMAIL 1: Send immediately ----
    const html1 = buildEmail1Html(name, inviteLink)
    const subject1 = 'Tu solicitud al Programa AFI ha sido evaluada'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fonokit <no-reply@fonokit.cl>',
        reply_to: 'hola@fonokit.cl',
        to: [cleanEmail],
        subject: subject1,
        html: html1,
      }),
    })

    const resData = await res.json()

    if (!res.ok) {
      console.error('[AUTO-RESPONDER] Resend error:', resData)
      return errorResponse(`Failed to send email: ${resData.message || 'Unknown error'}`, 500)
    }

    // Track Email 1
    await supabase.from('email_notifications').insert({
      recipient_email: cleanEmail,
      notification_type: 'form_auto_responder',
      subject: subject1,
      status: 'sent',
      sent_at: new Date().toISOString(),
      resend_id: resData.id || null,
      metadata: { name, invite_code: inviteCode, step: 1 },
    })

    // ---- EMAIL 2: Schedule for 48 hours later ----
    const scheduled48h = new Date()
    scheduled48h.setHours(scheduled48h.getHours() + 48)

    const html2 = buildEmail2Html(name, inviteLink)
    const subject2 = `${name.split(' ')[0]}, tu cupo en el Programa AFI vence mañana`

    await supabase.from('email_notifications').insert({
      recipient_email: cleanEmail,
      notification_type: 'form_auto_responder',
      subject: subject2,
      body_html: html2,
      status: 'pending',
      scheduled_for: scheduled48h.toISOString(),
      metadata: { name, invite_code: inviteCode, step: 2 },
    })

    // ---- EMAIL 3: Schedule for 72 hours later ----
    const scheduled72h = new Date()
    scheduled72h.setHours(scheduled72h.getHours() + 72)

    const html3 = buildEmail3Html(name, inviteLink)
    const subject3 = `${name.split(' ')[0]}, última oportunidad — Programa AFI`

    await supabase.from('email_notifications').insert({
      recipient_email: cleanEmail,
      notification_type: 'form_auto_responder',
      subject: subject3,
      body_html: html3,
      status: 'pending',
      scheduled_for: scheduled72h.toISOString(),
      metadata: { name, invite_code: inviteCode, step: 3 },
    })

    // Upsert into marketing_leads
    const { data: existingLead } = await supabase
      .from('marketing_leads')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1)

    if (!existingLead || existingLead.length === 0) {
      await supabase.from('marketing_leads').insert({
        full_name: name,
        email: cleanEmail,
        source: 'google_form_afi',
        status: 'contacted',
        tags: ['afi', 'auto-responder'],
      })
    }

    console.log(`[AUTO-RESPONDER] Sequence started for ${email}: invite=${inviteCode}, 3 emails scheduled`)

    return jsonResponse({
      success: true,
      invite_code: inviteCode,
      resend_id: resData.id,
      emails_scheduled: 3,
    })
  } catch (err) {
    console.error('[AUTO-RESPONDER] Error:', err)
    return errorResponse(err.message)
  }
})
