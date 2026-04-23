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
    // F-014 (spec 019): `final_price` del cliente se ignora deliberadamente.
    // El precio final se calcula server-side desde subscription_plans + discount_coupons.
    // Spec 022: billing_cycle del cliente se acepta (monthly | annual), default monthly.
    const { plan_name, therapist_id, payer_email, payer_name, coupon_code } = body
    const billing_cycle: 'monthly' | 'annual' = body.billing_cycle === 'annual' ? 'annual' : 'monthly'

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
    // Spec 022: incluir annual_discount_percent para cálculo de billing_cycle annual
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('name, price, slug, annual_discount_percent')
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

    // 3. Calcular chargePrice server-side.
    // Default: precio del plan desde DB. Si hay coupon_code válido, aplicar descuento server-side.
    let chargePrice = plan.price
    let validatedCouponCode: string | null = null
    // Spec 022: tracking de cupón con max_renewals para renovaciones controladas
    let couponMaxRenewals: number | null = null

    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('discount_coupons')
        .select('id, code, discount_type, discount_value, max_discount_amount, min_purchase_amount, applicable_plans, is_active, valid_from, expiration_date, max_uses, current_uses, max_renewals')
        .eq('code', coupon_code)
        .maybeSingle()

      if (couponError || !coupon) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cupón inválido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const nowTs = new Date()
      if (!coupon.is_active) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cupón inactivo' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      if (coupon.valid_from && new Date(coupon.valid_from) > nowTs) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cupón aún no vigente' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      if (coupon.expiration_date && new Date(coupon.expiration_date) <= nowTs) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cupón expirado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      if (coupon.max_uses !== null && coupon.max_uses !== undefined
          && (coupon.current_uses ?? 0) >= coupon.max_uses) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cupón agotado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      if (Array.isArray(coupon.applicable_plans) && coupon.applicable_plans.length > 0
          && !coupon.applicable_plans.includes(plan.slug)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cupón no aplicable a este plan' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      if (coupon.min_purchase_amount !== null && coupon.min_purchase_amount !== undefined
          && Number(coupon.min_purchase_amount) > Number(plan.price)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Monto mínimo del cupón no alcanzado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const basePrice = Number(plan.price)
      if (coupon.discount_type === 'percentage') {
        const pct = Number(coupon.discount_value)
        chargePrice = Math.round(basePrice * (1 - pct / 100))
      } else if (coupon.discount_type === 'fixed') {
        let discount = Number(coupon.discount_value)
        if (coupon.max_discount_amount !== null && coupon.max_discount_amount !== undefined) {
          discount = Math.min(discount, Number(coupon.max_discount_amount))
        }
        chargePrice = Math.max(basePrice - discount, 0)
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'Tipo de cupón inválido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (chargePrice < 0) chargePrice = 0
      validatedCouponCode = coupon.code
      // Spec 022: capturar max_renewals para tracking de renovaciones (cupón beta)
      couponMaxRenewals = coupon.max_renewals ?? null
    }

    // Spec 022: si billing_cycle === 'annual', aplicar descuento anual server-side.
    // Fórmula: chargePrice_annual = chargePrice_monthly × 12 × (1 - annual_discount_percent/100)
    // Aplica DESPUÉS del cupón (si lo hubo), sobre el chargePrice ya calculado.
    const annualDiscountPercent = Number(plan.annual_discount_percent) || 0
    if (billing_cycle === 'annual' && annualDiscountPercent > 0) {
      chargePrice = Math.round(chargePrice * 12 * (1 - annualDiscountPercent / 100))
    }

    const external_reference = `dentalspot_sub_${therapist_id}_${Date.now()}`

    // Spec 022: si chargePrice === 0 (ej. cupón 100% off como BETA-3M-2026), bypass MP
    // MercadoPago API rechaza unit_price=0. Creamos sub activa directamente preservando
    // tracking de applied_coupon_code + current_renewal_count para renovaciones futuras.
    if (chargePrice <= 0) {
      const nowBypass = new Date()
      const periodDaysBypass = billing_cycle === 'annual' ? 365 : 30
      const periodEndBypass = new Date(nowBypass.getTime() + periodDaysBypass * 24 * 60 * 60 * 1000)
      const initialRenewalCountBypass = validatedCouponCode && couponMaxRenewals !== null ? 1 : 0
      const appliedCouponCodeBypass = validatedCouponCode && couponMaxRenewals !== null ? validatedCouponCode : null

      // UPSERT directo en therapist_subscriptions
      if (existing) {
        await supabase.from('therapist_subscriptions').update({
          plan_name: plan.slug,
          price: 0,
          original_price: plan.price,
          discount_percent: 100,
          status: 'active',
          payment_status: 'approved',
          payment_method: 'coupon_free',
          billing_cycle,
          current_renewal_count: initialRenewalCountBypass,
          applied_coupon_code: appliedCouponCodeBypass,
          external_reference,
          current_period_start: nowBypass.toISOString().split('T')[0],
          current_period_end: periodEndBypass.toISOString().split('T')[0],
          updated_at: nowBypass.toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from('therapist_subscriptions').insert({
          therapist_id,
          plan_name: plan.slug,
          price: 0,
          original_price: plan.price,
          discount_percent: 100,
          currency: 'CLP',
          billing_cycle,
          current_renewal_count: initialRenewalCountBypass,
          applied_coupon_code: appliedCouponCodeBypass,
          status: 'active',
          payment_status: 'approved',
          payment_method: 'coupon_free',
          external_reference,
          current_period_start: nowBypass.toISOString().split('T')[0],
          current_period_end: periodEndBypass.toISOString().split('T')[0],
          cancel_at_period_end: false,
        })
      }

      console.log('✓ Free subscription activated (chargePrice=0, bypass MP):', external_reference, 'coupon:', appliedCouponCodeBypass)

      return new Response(
        JSON.stringify({
          success: true,
          bypass_mp: true,  // flag para que el frontend sepa no redirigir a MP checkout
          message: 'Suscripción activada sin cobro (cupón 100%)',
          external_reference,
          billing_cycle,
          charge_price: 0,
          applied_coupon: appliedCouponCodeBypass
            ? { code: appliedCouponCodeBypass, renewals_remaining: (couponMaxRenewals ?? 0) - 1 }
            : null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const preferenceData = {
      items: [{
        id: plan.slug,
        title: validatedCouponCode
          ? `${plan.name} - DENTALSPOT (Cupón: ${validatedCouponCode})`
          : `${plan.name} - DENTALSPOT`,
        description: billing_cycle === 'annual'
          ? `Suscripción anual - ${plan.name} (ahorra ${annualDiscountPercent}%)`
          : `Suscripción mensual - ${plan.name}`,
        quantity: 1,
        currency_id: 'CLP',
        unit_price: chargePrice
      }],
      payer: {
        email: payer_email,
        name: payer_name || ''
      },
      back_urls: {
        success: `https://dentalspot.cl/dashboard/membership/status?status=approved&plan=${plan.slug}`,
        failure: `https://dentalspot.cl/dashboard/membership/status?status=failure&plan=${plan.slug}`,
        pending: `https://dentalspot.cl/dashboard/membership/status?status=pending&plan=${plan.slug}`
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
    // Spec 022: period_end según billing_cycle (30 días mensual, 365 días anual)
    const now = new Date()
    const periodDays = billing_cycle === 'annual' ? 365 : 30
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000)

    // Spec 022: tracking inicial del cupón si tiene max_renewals
    const initialRenewalCount = validatedCouponCode && couponMaxRenewals !== null ? 1 : 0
    const appliedCouponCode = validatedCouponCode && couponMaxRenewals !== null ? validatedCouponCode : null

    if (existing) {
      // Upgrade: update plan, price, and preference for webhook confirmation
      const { error: updateError } = await supabase.from('therapist_subscriptions')
        .update({
          plan_name: plan.slug,
          price: chargePrice,
          original_price: plan.price,
          discount_percent: validatedCouponCode && plan.price > 0 ? Math.round((1 - chargePrice / plan.price) * 100) : 0,
          preference_id: mpResult.id,
          external_reference,
          billing_cycle,  // spec 022: preservar 'monthly' | 'annual'
          current_renewal_count: initialRenewalCount,  // spec 022
          applied_coupon_code: appliedCouponCode,  // spec 022
          current_period_start: now.toISOString().split('T')[0],
          current_period_end: periodEnd.toISOString().split('T')[0],
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id)
      if (updateError) console.error('DB UPDATE ERROR:', JSON.stringify(updateError))
      else console.log('DB UPDATE OK (upgrade):', external_reference, 'cycle:', billing_cycle, 'coupon:', appliedCouponCode)
    } else {
      await supabase.from('therapist_subscriptions').insert({
        therapist_id,
        plan_name: plan.slug,
        price: chargePrice,
        original_price: plan.price,
        discount_percent: validatedCouponCode && plan.price > 0 ? Math.round((1 - chargePrice / plan.price) * 100) : 0,
        currency: 'CLP',
        billing_cycle,  // spec 022: 'monthly' | 'annual' (antes hardcoded 'monthly')
        current_renewal_count: initialRenewalCount,  // spec 022
        applied_coupon_code: appliedCouponCode,  // spec 022
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
        // Spec 022: info adicional para UX (opcional)
        billing_cycle,
        charge_price: chargePrice,
        applied_coupon: appliedCouponCode
          ? { code: appliedCouponCode, renewals_remaining: (couponMaxRenewals ?? 0) - 1 }
          : null,
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
