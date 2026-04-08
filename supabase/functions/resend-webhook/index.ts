import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'

/**
 * Resend Webhook Handler
 *
 * Receives events from Resend for email tracking:
 * - email.delivered → update status
 * - email.opened → set opened_at
 * - email.clicked → set clicked_at
 * - email.bounced → mark as failed
 * - email.complained → mark as unsubscribed
 *
 * Configure in Resend Dashboard → Webhooks → Add endpoint:
 * URL: https://ungjizupgostxkemilob.supabase.co/functions/v1/resend-webhook
 * Events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createServiceClient()
    const body = await req.json()

    // Resend webhook payload
    const { type, data } = body

    if (!type || !data) {
      return jsonResponse({ received: true, skipped: 'no type or data' })
    }

    const emailId = data.email_id || data.id
    if (!emailId) {
      return jsonResponse({ received: true, skipped: 'no email_id' })
    }

    // Find the notification by resend_id
    const { data: notification } = await supabase
      .from('email_notifications')
      .select('id, recipient_email, lead_id')
      .eq('resend_id', emailId)
      .maybeSingle()

    if (!notification) {
      return jsonResponse({ received: true, skipped: 'notification not found' })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    switch (type) {
      case 'email.delivered':
        updates.status = 'delivered'
        break

      case 'email.opened':
        updates.opened_at = new Date().toISOString()
        break

      case 'email.clicked':
        updates.clicked_at = new Date().toISOString()
        break

      case 'email.bounced':
        updates.status = 'bounced'
        updates.error_message = data.bounce?.type || 'bounced'
        // Mark lead as unsubscribed if hard bounce
        if (notification.recipient_email) {
          await supabase.from('marketing_leads')
            .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
            .eq('email', notification.recipient_email)
        }
        break

      case 'email.complained':
        updates.status = 'complained'
        if (notification.recipient_email) {
          await supabase.from('marketing_leads')
            .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
            .eq('email', notification.recipient_email)
        }
        break

      case 'email.failed':
        updates.status = 'failed'
        updates.failed_at = new Date().toISOString()
        updates.error_message = data.error?.message || data.reason || 'failed'
        break

      case 'email.deleted':
        updates.status = 'deleted'
        break

      default:
        return jsonResponse({ received: true, skipped: `unknown type: ${type}` })
    }

    await supabase.from('email_notifications').update(updates).eq('id', notification.id)

    return jsonResponse({ received: true, type, email_id: emailId })
  } catch (err) {
    console.error('resend-webhook error:', err)
    return errorResponse(err.message)
  }
})
