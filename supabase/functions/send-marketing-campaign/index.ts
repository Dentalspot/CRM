import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const jsonResponse = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const errorResponse = (msg: string, status = 500) => new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

/**
 * Send Marketing Campaign via Resend
 *
 * Receives campaign_id, fetches leads by segment/tags, sends emails via Resend.
 * Respects Resend free tier: batches of 10 with 1s delay.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return errorResponse('Missing RESEND_API_KEY', 500)
    console.log('[CAMPAIGN] RESEND_API_KEY starts with:', resendKey.substring(0, 6))

    const { campaign_id } = await req.json()
    if (!campaign_id) return errorResponse('campaign_id required', 400)

    // Fetch campaign
    const { data: campaign, error: campErr } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campErr || !campaign) return errorResponse('Campaign not found', 404)
    if (campaign.status === 'sent') return errorResponse('Campaign already sent', 400)

    // Update status to sending
    await supabase.from('marketing_campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', campaign_id)

    // Build lead query
    let query = supabase
      .from('marketing_leads')
      .select('id, full_name, email, city, region')
      .not('email', 'is', null)
      .neq('status', 'unsubscribed')

    // Apply segment filter (maps to lead status or special values)
    if (campaign.segment && campaign.segment !== 'all' && campaign.segment !== 'all_with_email') {
      // Segments like 'new', 'contacted', 'converted', 'registered' map to status
      query = query.eq('status', campaign.segment)
    }

    // Apply source filter
    if (campaign.source_filter) {
      query = query.eq('source', campaign.source_filter)
    }

    // Apply tags filter (leads must have ALL specified tags)
    const tagsFilter = campaign.tags_filter || []
    if (Array.isArray(tagsFilter) && tagsFilter.length > 0) {
      for (const tag of tagsFilter) {
        query = query.contains('tags', JSON.stringify([tag]))
      }
    }

    const { data: leads, error: leadsErr } = await query.limit(5000)
    if (leadsErr) throw leadsErr

    if (!leads || leads.length === 0) {
      await supabase.from('marketing_campaigns')
        .update({ status: 'failed', recipient_count: 0, updated_at: new Date().toISOString() })
        .eq('id', campaign_id)
      return jsonResponse({ message: 'No leads match the filter', sent: 0 })
    }

    // Update recipient count
    await supabase.from('marketing_campaigns')
      .update({ recipient_count: leads.length })
      .eq('id', campaign_id)

    let sentCount = 0
    let failedCount = 0
    let lastError = ''

    // Send sequentially (1 by 1) for reliability
    for (const lead of leads) {
      let html = campaign.body_html
      let subject = campaign.subject

      const vars: Record<string, string> = {
        '{{nombre}}': lead.full_name || 'Profesional',
        '{{email}}': lead.email || '',
        '{{ciudad}}': lead.city || '',
        '{{region}}': lead.region || '',
        '{{unsubscribe_url}}': `https://fonokit.cl/unsubscribe?email=${encodeURIComponent(lead.email)}&campaign=${campaign_id}`,
      }

      for (const [key, val] of Object.entries(vars)) {
        html = html.replaceAll(key, val)
        subject = subject.replaceAll(key, val)
      }

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Fonokit <no-reply@fonokit.cl>',
            reply_to: 'hola@fonokit.cl',
            to: [lead.email],
            subject,
            html,
          }),
        })

        const resData = await res.json()

        if (res.ok) {
          sentCount++
          await supabase.from('email_notifications').insert({
            recipient_email: lead.email,
            notification_type: 'marketing_campaign',
            subject,
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_id: resData.id || null,
            campaign_id: campaign_id,
            lead_id: lead.id,
          })
        } else {
          failedCount++
          lastError = resData.message || JSON.stringify(resData)
          console.error(`[CAMPAIGN] ${lead.email}: ${lastError}`)
        }
      } catch (err) {
        failedCount++
        lastError = err?.message || String(err)
        console.error(`[CAMPAIGN] Exception ${lead.email}: ${lastError}`)
      }

      // Small delay between sends
      if (sentCount + failedCount < leads.length) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    // Update campaign status
    await supabase.from('marketing_campaigns')
      .update({
        status: failedCount === leads.length ? 'failed' : 'sent',
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign_id)

    return jsonResponse({
      success: true,
      recipient_count: leads.length,
      sent_count: sentCount,
      failed_count: failedCount,
    })
  } catch (err) {
    console.error('send-marketing-campaign error:', err)
    return errorResponse(err.message)
  }
})
