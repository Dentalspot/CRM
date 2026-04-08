import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    const {
      event_name,
      event_source_url,
      event_id,
      action_source = 'website',
      dataset_id,
      pixel_id,
      user_data = {},
      custom_data = {},
    } = body

    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN')
    const targetPixelId = dataset_id || pixel_id || Deno.env.get('META_PIXEL_ID')

    if (!accessToken) {
      console.error('Missing META_CAPI_ACCESS_TOKEN')
      return new Response(
        JSON.stringify({ error: 'Server not configured for CAPI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!targetPixelId) {
      return new Response(
        JSON.stringify({ error: 'Missing pixel_id or dataset_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash user data (Meta requires SHA-256 hashed PII)
    const hashSHA256 = async (value: string): Promise<string> => {
      if (!value) return ''
      const normalized = value.trim().toLowerCase()
      const buffer = new TextEncoder().encode(normalized)
      const hash = await crypto.subtle.digest('SHA-256', buffer)
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    }

    // Get client IP from request headers
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      ''

    // Build Meta CAPI event payload
    const eventPayload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url,
          event_id,
          action_source,
          user_data: {
            em: user_data.email ? [await hashSHA256(user_data.email)] : undefined,
            ph: user_data.phone ? [await hashSHA256(user_data.phone)] : undefined,
            client_ip_address: clientIp || undefined,
            client_user_agent: user_data.client_user_agent || undefined,
            fbc: user_data.fbc || undefined,
            fbp: user_data.fbp || undefined,
          },
          custom_data: {
            currency: custom_data.currency || 'CLP',
            value: custom_data.value || undefined,
            content_name: custom_data.content_name || undefined,
            content_ids: custom_data.content_ids || undefined,
            content_type: custom_data.content_type || undefined,
            ...custom_data,
          },
        },
      ],
    }

    // Clean undefined values
    const cleanObj = (obj: Record<string, unknown>) => {
      Object.keys(obj).forEach(key => {
        if (obj[key] === undefined || obj[key] === '') delete obj[key]
      })
      return obj
    }
    cleanObj(eventPayload.data[0].user_data as Record<string, unknown>)
    cleanObj(eventPayload.data[0].custom_data as Record<string, unknown>)

    // Send to Meta Conversions API
    const metaUrl = `https://graph.facebook.com/v21.0/${targetPixelId}/events?access_token=${accessToken}`

    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    })

    const metaResult = await metaResponse.json()

    if (!metaResponse.ok) {
      console.error('Meta CAPI error:', JSON.stringify(metaResult))
      return new Response(
        JSON.stringify({ error: 'Meta CAPI rejected event', details: metaResult }),
        { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        events_received: metaResult.events_received || 1,
        fbtrace_id: metaResult.fbtrace_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('CAPI function error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
