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

const FROM = 'DentalSpot <no-reply@dentalspot.cl>'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://dentalspot.cl'

const formatCLP = (n: number) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0))

/**
 * Send Budget Notification via Resend
 *
 * Evento soportado en MVP:
 *   - budget_sent: dentista envia presupuesto al paciente (unico que envia email)
 *
 * Otros eventos (budget_accepted, budget_payment_registered, budget_completed)
 * son solo in-app — NO usan esta function.
 *
 * Payload: { event_type, budget_id }
 *
 * Respeta user_notification_preferences. Registra el envio en email_notifications.
 */

interface BudgetData {
  id: string
  budget_number: number
  title: string
  total: number
  currency: string
  patient_id: string
  therapist_id: string
}

const buildEmail = (
  eventType: string,
  budget: BudgetData,
  patientName: string,
  therapistName: string
): { subject: string; html: string; text: string } => {
  const total = `$${formatCLP(budget.total)} ${budget.currency}`
  const dashboardUrl = `${APP_URL}/dashboard`

  if (eventType === 'budget_sent') {
    const subject = `Tienes un nuevo presupuesto: #${budget.budget_number} — ${budget.title}`
    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0d9488;">Hola ${patientName},</h2>
        <p>Tu odontólogo${therapistName ? ` <strong>${therapistName}</strong>` : ''} te envió un presupuesto.</p>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Presupuesto #${budget.budget_number}</strong></p>
          <p style="margin: 4px 0; color: #555;">${budget.title}</p>
          <p style="margin: 12px 0 4px; font-size: 22px; color: #0d9488;"><strong>Total: ${total}</strong></p>
        </div>
        <p>Ingresa a tu dashboard para verlo en detalle y aceptarlo:</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Ver presupuesto</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #888;">
          Recibes este email porque tu odontólogo te envió un presupuesto a través de DentalSpot.
          Para desactivar estas notificaciones, contacta a tu odontólogo o ajusta tus preferencias en el dashboard.
        </p>
      </div>
    `.trim()
    const text = `Hola ${patientName},\n\nTu odontólogo te envió un presupuesto:\n\nPresupuesto #${budget.budget_number}\n${budget.title}\nTotal: ${total}\n\nVer en: ${dashboardUrl}`
    return { subject, html, text }
  }

  if (eventType === 'budget_accepted') {
    const subject = `${patientName} aceptó el presupuesto #${budget.budget_number}`
    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0d9488;">¡Buenas noticias!</h2>
        <p><strong>${patientName}</strong> aceptó el presupuesto que le enviaste.</p>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Presupuesto #${budget.budget_number}</strong></p>
          <p style="margin: 4px 0; color: #555;">${budget.title}</p>
          <p style="margin: 12px 0 4px;"><strong>Total: ${total}</strong></p>
        </div>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Ir al dashboard</a>
        </p>
      </div>
    `.trim()
    const text = `${patientName} aceptó el presupuesto #${budget.budget_number} (${budget.title}). Total: ${total}`
    return { subject, html, text }
  }

  if (eventType === 'budget_completed') {
    const subject = `Presupuesto #${budget.budget_number} pagado completamente`
    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #16a34a;">¡Pago completado!</h2>
        <p>Hola ${patientName},</p>
        <p>Confirmamos que el presupuesto <strong>#${budget.budget_number} — ${budget.title}</strong> ha sido pagado en su totalidad.</p>
        <p>Total cubierto: <strong>${total}</strong></p>
        <p>Gracias por confiar en DentalSpot.</p>
      </div>
    `.trim()
    const text = `Presupuesto #${budget.budget_number} (${budget.title}) pagado en su totalidad. Total: ${total}.`
    return { subject, html, text }
  }

  throw new Error(`Unknown event_type: ${eventType}`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return errorResponse('Missing RESEND_API_KEY', 500)

    const { event_type, budget_id } = await req.json()
    if (!event_type || !budget_id) return errorResponse('event_type and budget_id required', 400)

    // 1) Cargar budget con info del paciente y dentista
    const { data: budget, error: budgetErr } = await supabase
      .from('treatment_budgets')
      .select('id, budget_number, title, total, currency, patient_id, therapist_id')
      .eq('id', budget_id)
      .single()
    if (budgetErr || !budget) return errorResponse(`Budget not found: ${budgetErr?.message}`, 404)

    // 2) Determinar destinatario según evento
    let recipientUserId: string | null = null
    if (event_type === 'budget_sent' || event_type === 'budget_completed') {
      // → al paciente: necesitamos el profile_id desde patients
      const { data: pat } = await supabase
        .from('patients')
        .select('profile_id')
        .eq('id', budget.patient_id)
        .single()
      recipientUserId = pat?.profile_id ?? null
    } else if (event_type === 'budget_accepted') {
      // → al dentista
      recipientUserId = budget.therapist_id
    }

    if (!recipientUserId) {
      return jsonResponse({ skipped: true, reason: 'no recipient profile' })
    }

    // 3) Verificar preferencias del usuario (opt-out)
    const { data: pref } = await supabase
      .from('user_notification_preferences')
      .select('preferences')
      .eq('user_id', recipientUserId)
      .single()

    const prefVal = pref?.preferences?.[event_type]
    if (prefVal === false) {
      return jsonResponse({ skipped: true, reason: 'user opt-out' })
    }

    // 4) Buscar email + nombre
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', recipientUserId)
      .single()

    if (!recipientProfile?.email) {
      return jsonResponse({ skipped: true, reason: 'no email registered' })
    }

    // Para personalizar email: nombres del paciente y dentista
    let patientName = 'Paciente'
    let therapistName = ''
    {
      const { data: pat } = await supabase
        .from('patients')
        .select('profile_id')
        .eq('id', budget.patient_id)
        .single()
      if (pat?.profile_id) {
        const { data: pp } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', pat.profile_id)
          .single()
        if (pp?.full_name) patientName = pp.full_name
      }
      const { data: tp } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', budget.therapist_id)
        .single()
      if (tp?.full_name) therapistName = tp.full_name
    }

    const { subject, html, text } = buildEmail(event_type, budget as BudgetData, patientName, therapistName)

    // 5) Enviar via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [recipientProfile.email],
        subject,
        html,
        text,
      }),
    })

    const resendBody = await resendRes.json().catch(() => ({}))
    const ok = resendRes.ok

    // 6) Registrar en email_notifications (auditoría)
    await supabase.from('email_notifications').insert({
      user_id: recipientUserId,
      notification_type: event_type,
      subject,
      body_html: html,
      body_text: text,
      recipient_email: recipientProfile.email,
      status: ok ? 'sent' : 'failed',
      sent_at: ok ? new Date().toISOString() : null,
      failed_at: ok ? null : new Date().toISOString(),
      error_message: ok ? null : JSON.stringify(resendBody),
      metadata: { budget_id, resend_id: resendBody?.id ?? null },
    })

    if (!ok) return errorResponse(`Resend failed: ${JSON.stringify(resendBody)}`, 502)
    return jsonResponse({ ok: true, message_id: resendBody?.id })

  } catch (e) {
    return errorResponse(`Unexpected: ${(e as Error).message}`, 500)
  }
})
