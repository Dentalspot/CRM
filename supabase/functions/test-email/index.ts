import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
  if (req.method === 'OPTIONS') return new Response('ok', { headers })

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendKey = Deno.env.get('RESEND_API_KEY')

  // 1. Test Resend
  let resendResult = 'not tested'
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Fonokit <no-reply@fonokit.cl>',
          to: ['danissa@gmail.com'],
          subject: 'Test campaña Fonokit',
          html: '<h2>Funciona!</h2><p>El sistema de campañas esta operativo.</p>',
        }),
      })
      const data = await res.json()
      resendResult = { status: res.status, data }
    } catch (e) { resendResult = { error: e.message } }
  }

  // 2. Test DB write
  let dbResult = 'not tested'
  if (url && key) {
    try {
      const supabase = createClient(url, key)
      const { data, error } = await supabase.from('email_notifications').insert({
        recipient_email: 'test@test.com',
        notification_type: 'test',
        subject: 'test',
        status: 'sent',
        sent_at: new Date().toISOString(),
      }).select()
      dbResult = { data, error }
      // Clean up
      if (data?.[0]?.id) await supabase.from('email_notifications').delete().eq('id', data[0].id)
    } catch (e) { dbResult = { error: e.message } }
  }

  return new Response(JSON.stringify({
    env: {
      SUPABASE_URL: url ? url.substring(0, 30) + '...' : 'MISSING',
      SERVICE_ROLE_KEY: key ? key.substring(0, 10) + '...' : 'MISSING',
      RESEND_API_KEY: resendKey ? resendKey.substring(0, 10) + '...' : 'MISSING',
    },
    resend: resendResult,
    db: dbResult,
  }, null, 2), { headers })
})
