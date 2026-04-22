// Edge Function: mercadopago-webhook
// Procesa notificaciones de MercadoPago para suscripciones y pagos

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'Webhook endpoint active' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  try {
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('========== WEBHOOK RECEIVED ==========');
    console.log('Type:', body.type);
    console.log('Action:', body.action);
    console.log('Data ID:', body.data?.id);

    const { type, data } = body;

    if (!data?.id) {
      return new Response(
        JSON.stringify({ received: true, message: 'No data.id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    switch (type) {
      case 'subscription_preapproval':
        await handlePreapproval(data.id, accessToken, supabase);
        break;
      case 'subscription_authorized_payment':
        await handleAuthorizedPayment(data.id, accessToken, supabase);
        break;
      case 'payment':
        await handlePayment(data.id, accessToken, supabase);
        break;
      default:
        console.log(`Evento no manejado: ${type}`);
    }

    return new Response(
      JSON.stringify({ received: true, type, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ received: true, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

async function handlePreapproval(preapprovalId: string, accessToken: string, supabase: any) {
  console.log(`>>> Processing preapproval: ${preapprovalId}`);

  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) throw new Error(`Failed to fetch preapproval: ${response.status}`);

  const preapproval = await response.json();
  const statusMap: Record<string, string> = {
    'pending': 'pending', 'authorized': 'active', 'paused': 'suspended', 'cancelled': 'cancelled'
  };
  const newStatus = statusMap[preapproval.status] || preapproval.status;

  const { error, data } = await supabase
    .from('therapist_subscriptions')
    .update({ status: newStatus, mp_preapproval_id: preapprovalId, updated_at: new Date().toISOString() })
    .eq('external_reference', preapproval.external_reference)
    .select();

  if (error) console.error('Error updating preapproval:', error);
  else console.log(`✓ Preapproval updated to: ${newStatus}`, data);
}

async function handleAuthorizedPayment(paymentId: string, accessToken: string, supabase: any) {
  console.log(`>>> Processing authorized payment: ${paymentId}`);

  const response = await fetch(`https://api.mercadopago.com/authorized_payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) return await handlePayment(paymentId, accessToken, supabase);

  const payment = await response.json();
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from('therapist_subscriptions')
    .update({
      status: 'active', last_payment_id: paymentId,
      current_period_start: now.toISOString().split('T')[0],
      current_period_end: periodEnd.toISOString().split('T')[0],
      updated_at: now.toISOString()
    })
    .eq('mp_preapproval_id', payment.preapproval_id);

  if (error) console.error('Error:', error);
  else console.log('✓ Authorized payment processed');
}

async function handlePayment(paymentId: string, accessToken: string, supabase: any) {
  console.log(`>>> Processing payment: ${paymentId}`);

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) throw new Error(`Failed to fetch payment: ${response.status}`);

  const payment = await response.json();
  console.log('Payment status:', payment.status, 'Ref:', payment.external_reference);

  if (payment.external_reference?.startsWith('dentalspot_sub_')) {
    if (payment.status === 'approved') {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { error, data } = await supabase
        .from('therapist_subscriptions')
        .update({
          status: 'active',
          plan_name: payment.metadata?.plan_name || undefined,
          price: payment.transaction_amount || undefined,
          last_payment_id: String(paymentId),
          payment_status: 'approved',
          payment_method: payment.payment_type_id,
          current_period_start: now.toISOString().split('T')[0],
          current_period_end: periodEnd.toISOString().split('T')[0],
          updated_at: now.toISOString()
        })
        .eq('external_reference', payment.external_reference)
        .select();

      if (error) {
        console.error('Error activating subscription:', JSON.stringify(error));
      } else if (!data?.length) {
        // Fallback: extract therapist_id from external_reference and create
        console.log('No matching subscription found, creating from webhook...');
        const parts = payment.external_reference.split('_');
        const therapistId = parts.slice(2, -1).join('_'); // dentalspot_sub_{uuid}_{timestamp}

        const { error: insertError } = await supabase
          .from('therapist_subscriptions')
          .insert({
            therapist_id: therapistId,
            plan_name: payment.metadata?.plan_name || 'individual',
            price: payment.transaction_amount,
            currency: 'CLP',
            billing_cycle: 'monthly',
            status: 'active',
            payment_status: 'approved',
            payment_method: payment.payment_type_id,
            last_payment_id: String(paymentId),
            external_reference: payment.external_reference,
            current_period_start: now.toISOString().split('T')[0],
            current_period_end: periodEnd.toISOString().split('T')[0],
            cancel_at_period_end: false,
          });

        if (insertError) console.error('Error creating subscription from webhook:', JSON.stringify(insertError));
        else console.log('✓ Subscription created from webhook for:', therapistId);
      } else {
        console.log('✓ Subscription activated:', data);
      }
    }
  }
  else if (payment.external_reference?.startsWith('dentalspot_order_')) {
    if (payment.status === 'approved') {
      const orderId = payment.external_reference.replace('dentalspot_order_', '');

      const { error } = await supabase
        .from('marketplace_purchases')
        .update({
          payment_status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) console.error('Error completing order:', error);
      else {
        console.log('✓ Order completed');
        await supabase.rpc('process_completed_order', { order_id: orderId }).catch((e: Error) => console.warn('Clone error:', e));
      }
    }
  }
  else {
    console.log('Unknown payment type:', payment.external_reference);
  }
}
