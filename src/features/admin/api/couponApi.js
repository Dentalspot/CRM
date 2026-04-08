import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const getCoupons = async ({ status = 'all' } = {}) => {
  try {
    let query = supabase
      .from('discount_coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (status === 'active') {
      query = query.eq('is_active', true).gte('expiration_date', new Date().toISOString());
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    } else if (status === 'expired') {
      query = query.lt('expiration_date', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Error fetching coupons:', error);
    return { success: false, error: error.message };
  }
};

export const createCoupon = async (couponData) => {
  try {
    // Verificar código único
    const { data: existing } = await supabase
      .from('discount_coupons')
      .select('id')
      .eq('code', couponData.code)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'El código ya existe.' };
    }

    const { data, error } = await supabase
      .from('discount_coupons')
      .insert([couponData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Error creating coupon:', error);
    return { success: false, error: error.message };
  }
};

export const updateCoupon = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('discount_coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Error updating coupon:', error);
    return { success: false, error: error.message };
  }
};

export const deleteCoupon = async (id) => {
  try {
    const { error } = await supabase
      .from('discount_coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting coupon:', error);
    return { success: false, error: error.message };
  }
};

export const getCouponStats = async () => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('discount_coupons')
      .select('id, is_active, expiration_date, current_uses');

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(c => c.is_active && (!c.expiration_date || c.expiration_date > now)).length,
      expired: data.filter(c => c.expiration_date && c.expiration_date < now).length,
      totalUses: data.reduce((sum, c) => sum + (c.current_uses || 0), 0)
    };

    return { success: true, data: stats };
  } catch (error) {
    logger.error('Error getting coupon stats:', error);
    return { success: false, error: error.message };
  }
};

export const generateCouponCode = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};