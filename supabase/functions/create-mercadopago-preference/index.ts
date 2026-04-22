/**
 * create-mercadopago-preference — Marketplace Purchase Checkout
 *
 * Creates a MercadoPago preference for marketplace item purchases.
 * Called from PurchaseModal when user selects MercadoPago payment.
 *
 * Input:  { items, payer, metadata, back_urls }
 * Output: { init_point, sandbox_init_point, preference_id, external_reference }
 *
 * The webhook (mercadopago-webhook) handles payment confirmation
 * using external_reference prefix "fonokit_order_".
 */

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
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'MERCADOPAGO_ACCESS_TOKEN no configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const body = await req.json()
    const { items, payer, metadata, back_urls } = body

    if (!items?.length || !payer?.email) {
      return new Response(
        JSON.stringify({ error: 'Faltan items o email del comprador' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Build external_reference using purchase_id from metadata (set by frontend)
    // This links the MP payment to our marketplace_purchases record
    const purchaseId = metadata?.purchase_id || metadata?.order_id || `unknown_${Date.now()}`
    const external_reference = `fonokit_order_${purchaseId}`

    console.log(`[mp-preference] Creating preference for purchase ${purchaseId}`)
    console.log(`[mp-preference] Items: ${items.length}, Payer: ${payer.email}`)

    // F-014 (spec 019): validar cada item.unit_price contra DB server-side.
    // `item.id` puede apuntar a marketplace_plans (flujo principal) o marketplace_items (legacy).
    const supabase = createClient(supabaseUrl, supabaseKey)
    const validatedItems: Array<Record<string, unknown>> = []
    for (const item of items as any[]) {
      if (!item?.id) {
        return new Response(
          JSON.stringify({ error: 'Falta item.id' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      let dbPrice: number | null = null
      const { data: plan } = await supabase
        .from('marketplace_plans')
        .select('price_clp')
        .eq('id', item.id)
        .maybeSingle()
      if (plan) {
        dbPrice = Number(plan.price_clp)
      } else {
        const { data: mpItem } = await supabase
          .from('marketplace_items')
          .select('price')
          .eq('id', item.id)
          .maybeSingle()
        if (mpItem) dbPrice = Number(mpItem.price)
      }

      if (dbPrice === null) {
        return new Response(
          JSON.stringify({ error: 'Producto no encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (Number(item.unit_price) !== dbPrice) {
        console.warn(`[mp-preference] Price manipulation detected: item ${item.id} client=${item.unit_price} db=${dbPrice}`)
        return new Response(
          JSON.stringify({ error: 'Precio manipulado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      validatedItems.push({
        id: item.id,
        title: item.title || 'Recurso Fonokit',
        description: item.description ? item.description.substring(0, 255) : 'Compra en Fonokit Marketplace',
        picture_url: item.picture_url || undefined,
        quantity: item.quantity || 1,
        unit_price: dbPrice,
        currency_id: item.currency_id || 'CLP',
      })
    }

    // Create MercadoPago preference
    const preferenceData: Record<string, unknown> = {
      items: validatedItems,
      payer: {
        email: payer.email,
        name: payer.name || '',
        surname: payer.surname || '',
      },
      back_urls: {
        success: back_urls?.success || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=approved&purchase_id=${purchaseId}`,
        failure: back_urls?.failure || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=failure&purchase_id=${purchaseId}`,
        pending: back_urls?.pending || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=pending&purchase_id=${purchaseId}`,
      },
      auto_return: 'approved',
      external_reference,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      metadata: {
        ...metadata,
        type: 'marketplace_purchase',
      },
      statement_descriptor: 'FONOKIT',
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    })

    const mpResult = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('[mp-preference] MercadoPago error:', JSON.stringify(mpResult))
      return new Response(
        JSON.stringify({ error: mpResult.message || 'Error de MercadoPago', details: mpResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`[mp-preference] ✓ Preference created: ${mpResult.id}`)

    return new Response(
      JSON.stringify({
        init_point: mpResult.init_point,
        sandbox_init_point: mpResult.sandbox_init_point,
        preference_id: mpResult.id,
        external_reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[mp-preference] Error:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
