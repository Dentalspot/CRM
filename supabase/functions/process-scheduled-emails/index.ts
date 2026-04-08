/**
 * @file process-scheduled-emails/index.ts
 * @description Cron worker that processes pending scheduled emails.
 * Picks up emails from email_notifications with status='pending' and scheduled_for <= now().
 * Should be called every 15 minutes via cron (pg_cron, external scheduler, or Supabase cron).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_BATCH = 50
const DELAY_MS = 200

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

    // --- Fetch pending emails ---
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_notifications')
      .select('id, recipient_email, lead_id, metadata')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(MAX_BATCH)

    if (fetchError) {
      console.error('[process-scheduled-emails] Fetch error:', fetchError)
      return json({ error: 'Failed to fetch pending emails' }, 500)
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return json({ success: true, processed: 0, message: 'No pending emails' })
    }

    let sent = 0
    let failed = 0
    let skipped = 0

    for (const notification of pendingEmails) {
      try {
        // --- Check lead still valid ---
        if (notification.lead_id) {
          const { data: lead } = await supabase
            .from('marketing_leads')
            .select('id, full_name, email, status')
            .eq('id', notification.lead_id)
            .single()

          if (!lead || lead.status === 'unsubscribed' || !lead.email) {
            await supabase
              .from('email_notifications')
              .update({ status: 'cancelled', error_message: 'Lead unsubscribed or invalid' })
              .eq('id', notification.id)
            skipped++
            continue
          }

          // --- Load template ---
          const meta = notification.metadata as Record<string, unknown> || {}
          const templateName = meta.template_name as string
          const step = meta.step as number

          if (!templateName) {
            await supabase
              .from('email_notifications')
              .update({ status: 'failed', error_message: 'No template_name in metadata' })
              .eq('id', notification.id)
            failed++
            continue
          }

          const { data: template } = await supabase
            .from('email_templates')
            .select('subject_template, body_html_template')
            .eq('template_name', templateName)
            .eq('is_active', true)
            .single()

          if (!template) {
            await supabase
              .from('email_notifications')
              .update({ status: 'failed', error_message: `Template ${templateName} not found` })
              .eq('id', notification.id)
            failed++
            continue
          }

          // --- Interpolate ---
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
            console.error(`[process-scheduled-emails] Resend error for ${notification.id}:`, resendData)
            await supabase
              .from('email_notifications')
              .update({
                status: 'failed',
                failed_at: new Date().toISOString(),
                error_message: resendData.message || 'Resend API error',
              })
              .eq('id', notification.id)
            failed++
          } else {
            await supabase
              .from('email_notifications')
              .update({
                subject,
                body_html: htmlBody,
                status: 'sent',
                sent_at: new Date().toISOString(),
                resend_id: resendData.id || null,
              })
              .eq('id', notification.id)
            sent++
          }
        } else {
          // No lead_id — skip
          await supabase
            .from('email_notifications')
            .update({ status: 'cancelled', error_message: 'No lead_id' })
            .eq('id', notification.id)
          skipped++
        }

        // Rate limit: 200ms between sends
        if (sent + failed < pendingEmails.length) {
          await new Promise(r => setTimeout(r, DELAY_MS))
        }
      } catch (emailErr) {
        console.error(`[process-scheduled-emails] Error processing ${notification.id}:`, emailErr)
        await supabase
          .from('email_notifications')
          .update({ status: 'failed', error_message: emailErr.message })
          .eq('id', notification.id)
        failed++
      }
    }

    console.log(`[process-scheduled-emails] Done: ${sent} sent, ${failed} failed, ${skipped} skipped`)

    return json({
      success: true,
      processed: pendingEmails.length,
      sent,
      failed,
      skipped,
    })

  } catch (err) {
    console.error('[process-scheduled-emails] Error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
