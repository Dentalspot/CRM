import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { plan_name, therapist_id, payer_email, payer_name, final_price, coupon_code } = body

    if (!plan_name || !therapist_id || !payer_email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Faltan campos requeridos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'MERCADOPAGO_ACCESS_TOKEN no configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Leer precio dinámico desde subscription_plans
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('name, price, slug')
      .eq('slug', plan_name.toLowerCase())
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Plan no encontrado o inactivo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. Limpiar suscripciones pending viejas (intentos fallidos)
    await supabase
      .from('therapist_subscriptions')
      .delete()
      .eq('therapist_id', therapist_id)
      .eq('status', 'pending')

    // 3. Verificar suscripción activa existente (permitir upgrade)
    const { data: existing } = await supabase
      .from('therapist_subscriptions')
      .select('id, status, plan_name')
      .eq('therapist_id', therapist_id)
      .eq('status', 'active')
      .maybeSingle()

    // 3. Crear preferencia en MercadoPago
    // Use final_price if coupon was applied, otherwise use plan price
    const chargePrice = (final_price !== null && final_price !== undefined && final_price >= 0)
      ? final_price
      : plan.price
    const external_reference = `fonokit_sub_${therapist_id}_${Date.now()}`

    const preferenceData = {
      items: [{
        id: plan.slug,
        title: coupon_code
          ? `${plan.name} - FONOKIT (Cupón: ${coupon_code})`
          : `${plan.name} - FONOKIT`,
        description: `Suscripción mensual - ${plan.name}`,
        quantity: 1,
        currency_id: 'CLP',
        unit_price: chargePrice
      }],
      payer: {
        email: payer_email,
        name: payer_name || ''
      },
      back_urls: {
        success: `https://fonokit.cl/dashboard/membership/status?status=approved&plan=${plan.slug}`,
        failure: `https://fonokit.cl/dashboard/membership/status?status=failure&plan=${plan.slug}`,
        pending: `https://fonokit.cl/dashboard/membership/status?status=pending&plan=${plan.slug}`
      },
      auto_return: 'approved',
      external_reference,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      metadata: {
        therapist_id,
        plan_name: plan.slug,
        type: 'subscription'
      }
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    const mpResult = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('MercadoPago Error:', mpResult)
      return new Response(
        JSON.stringify({ success: false, error: mpResult.message || 'Error de MercadoPago' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 4. Guardar en Supabase
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (existing) {
      // Upgrade: update plan, price, and preference for webhook confirmation
      const { error: updateError } = await supabase.from('therapist_subscriptions')
        .update({
          plan_name: plan.slug,
          price: chargePrice,
          original_price: plan.price,
          discount_percent: coupon_code && plan.price > 0 ? Math.round((1 - chargePrice / plan.price) * 100) : 0,
          preference_id: mpResult.id,
          external_reference,
          current_period_start: now.toISOString().split('T')[0],
          current_period_end: periodEnd.toISOString().split('T')[0],
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id)
      if (updateError) console.error('DB UPDATE ERROR:', JSON.stringify(updateError))
      else console.log('DB UPDATE OK (upgrade):', external_reference)
    } else {
      await supabase.from('therapist_subscriptions').insert({
        therapist_id,
        plan_name: plan.slug,
        price: chargePrice,
        original_price: plan.price,
        discount_percent: coupon_code && plan.price > 0 ? Math.round((1 - chargePrice / plan.price) * 100) : 0,
        currency: 'CLP',
        billing_cycle: 'monthly',
        status: 'pending',
        preference_id: mpResult.id,
        external_reference,
        current_period_start: now.toISOString().split('T')[0],
        current_period_end: periodEnd.toISOString().split('T')[0],
        cancel_at_period_end: false,
        payment_status: 'pending',
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        init_point: mpResult.init_point,
        sandbox_init_point: mpResult.sandbox_init_point,
        preference_id: mpResult.id,
        external_reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
