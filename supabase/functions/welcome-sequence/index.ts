/**
 * @file welcome-sequence/index.ts
 * @description Sends welcome email sequence to new leads.
 * Step 1: Immediate welcome. Step 2: Tools deep-dive (day 2). Step 3: Social proof (day 5).
 * Called by database trigger on marketing_leads INSERT or by cron via process-scheduled-emails.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEMPLATE_MAP: Record<number, string> = {
  1: 'welcome_01_bienvenida',
  2: 'welcome_02_herramientas',
  3: 'welcome_03_comunidad',
}

const DELAY_DAYS: Record<number, number> = {
  1: 0,
  2: 2,
  3: 5,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (!resendKey) {
      return json({ error: 'RESEND_API_KEY not configured' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    const { lead_id, step = 1 } = body

    if (!lead_id) {
      return json({ error: 'lead_id required' }, 400)
    }

    // --- Fetch lead ---
    const { data: lead, error: leadError } = await supabase
      .from('marketing_leads')
      .select('id, full_name, email, phone, status, source, segment')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return json({ error: 'Lead not found' }, 404)
    }

    if (lead.status === 'unsubscribed') {
      return json({ success: true, skipped: true, reason: 'Lead unsubscribed' })
    }

    if (!lead.email) {
      return json({ error: 'Lead has no email' }, 400)
    }

    // --- Load template ---
    const templateName = TEMPLATE_MAP[step]
    if (!templateName) {
      return json({ error: `Invalid step: ${step}` }, 400)
    }

    const { data: template, error: tplError } = await supabase
      .from('email_templates')
      .select('subject_template, body_html_template, body_text_template')
      .eq('template_name', templateName)
      .eq('is_active', true)
      .single()

    if (tplError || !template) {
      console.error(`[welcome-sequence] Template not found: ${templateName}`)
      return json({ error: `Template ${templateName} not found` }, 404)
    }

    // --- Interpolate variables ---
    const nombre = lead.full_name || 'profesional'
    const unsubscribeUrl = `https://fonokit.cl/api/unsubscribe?email=${encodeURIComponent(lead.email)}&token=${lead.id}`

    const interpolate = (text: string) =>
      text
        .replace(/\{\{nombre\}\}/g, nombre)
        .replace(/\{\{email\}\}/g, lead.email)
        .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)

    const subject = interpolate(template.subject_template)
    const htmlBody = interpolate(template.body_html_template)

    // --- Send via Resend ---
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fonokit <no-reply@fonokit.cl>',
        reply_to: 'hola@fonokit.cl',
        to: [lead.email],
        subject,
        html: htmlBody,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('[welcome-sequence] Resend error:', JSON.stringify(resendData))

      // Record failed attempt
      await supabase.from('email_notifications').insert({
        recipient_email: lead.email,
        notification_type: 'welcome_sequence',
        subject,
        body_html: htmlBody,
        status: 'failed',
        error_message: resendData.message || 'Resend API error',
        lead_id: lead.id,
        metadata: { step, template_name: templateName },
      })

      return json({ error: 'Failed to send email', details: resendData }, 500)
    }

    // --- Record sent email ---
    await supabase.from('email_notifications').insert({
      recipient_email: lead.email,
      notification_type: 'welcome_sequence',
      subject,
      body_html: htmlBody,
      status: 'sent',
      sent_at: new Date().toISOString(),
      resend_id: resendData.id || null,
      lead_id: lead.id,
      metadata: { step, template_name: templateName },
    })

    // --- Schedule follow-up emails (only on step 1) ---
    if (step === 1) {
      const now = new Date()

      for (const nextStep of [2, 3]) {
        const delayDays = DELAY_DAYS[nextStep]
        const scheduledFor = new Date(now)
        scheduledFor.setDate(scheduledFor.getDate() + delayDays)
        // Set to 9 AM Chile time (UTC-3 / UTC-4)
        scheduledFor.setUTCHours(12, 0, 0, 0) // 12 UTC = 9 AM CLT

        const nextTemplateName = TEMPLATE_MAP[nextStep]

        await supabase.from('email_notifications').insert({
          recipient_email: lead.email,
          notification_type: 'welcome_sequence',
          subject: `(pending) Welcome step ${nextStep}`,
          status: 'pending',
          scheduled_for: scheduledFor.toISOString(),
          lead_id: lead.id,
          metadata: { step: nextStep, template_name: nextTemplateName },
        })
      }
    }

    // --- Update lead status ---
    if (lead.status === 'new') {
      await supabase
        .from('marketing_leads')
        .update({ status: 'contacted', contacted_at: new Date().toISOString() })
        .eq('id', lead.id)
    }

    return json({
      success: true,
      step,
      email: lead.email,
      resend_id: resendData.id,
      scheduled_followups: step === 1 ? [2, 3] : [],
    })

  } catch (err) {
    console.error('[welcome-sequence] Error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
