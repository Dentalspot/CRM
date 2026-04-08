import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Creates a Mercado Pago preference for checkout
 * @param {Object} params - The preference parameters
 * @param {Array} params.items - Array of items to purchase { id, title, description, quantity, unit_price, picture_url }
 * @param {Object} params.payer - Payer information { email, name, surname }
 * @param {Object} params.metadata - Custom metadata to attach to the payment
 * @param {Object} params.backUrls - Custom redirect URLs { success, failure, pending }
 * @returns {Promise<Object>} The created preference with init_point
 */
export const createPreference = async ({ items, payer, metadata, backUrls }) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
      body: {
        items,
        payer,
        metadata,
        back_urls: backUrls
      },
      method: 'POST'
    });

    if (error) {
      logger.error('Supabase Function Error (create-mercadopago-preference):', error);
      // Check for specific edge function errors (like 404 if not deployed)
      if (error.code === 'FunctionsHttpError' || error.status === 404) {
        throw new Error('El servicio de pagos no está disponible en este momento. Por favor intente más tarde.');
      }
      throw new Error(error.message || 'Error al conectar con el servicio de pagos');
    }

    if (!data || !data.init_point) {
      logger.error('Invalid response from create-mercadopago-preference:', data);
      throw new Error('No se pudo generar el link de pago. Respuesta inválida del servidor.');
    }

    return data;
  } catch (error) {
    logger.error('Error creating Mercado Pago preference:', error);
    throw error;
  }
};

/**
 * Gets payment information by ID (Can be used to verify status client-side if needed)
 * @param {string} paymentId - The Mercado Pago payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentInfo = async (paymentId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (error) {
      // Fallback: Check subscriptions or orders
      const { data: subData } = await supabase
        .from('therapist_subscriptions')
        .select('*')
        .eq('payment_id', paymentId)
        .maybeSingle();
        
      if (subData) return { ...subData, type: 'subscription' };
      
      const { data: orderData } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('payment_id', paymentId)
        .maybeSingle();
        
      if (orderData) return { ...orderData, type: 'marketplace' };
      
      // If not found in any table, it might not be an error if looking up a fresh payment
      if (error.code === 'PGRST116') return null;
      
      throw error;
    }
    
    return data;
  } catch (error) {
    logger.error('Error fetching payment info:', error);
    return null;
  }
};