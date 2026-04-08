
/**
 * @file billingApi.js
 * @description API module for billing management features including subscriptions, payments, plans, coupons, and commissions.
 * @module features/admin/modules/billing/api
 */

import { supabase } from '@/lib/supabaseClient';
import { apiHandler } from '@/lib/api/apiHandler';

export const billingApi = {
  /**
   * Fetches dashboard metrics for the billing module
   * @returns {Promise<object>}
   */
  fetchDashboardMetrics: apiHandler('fetchDashboardMetrics', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get active subscriptions and MRR
    const { data: activeSubs, error: subsError } = await supabase
      .from('therapist_subscriptions')
      .select('price')
      .eq('status', 'active');

    if (subsError) throw subsError;

    const mrr = activeSubs.reduce((sum, sub) => sum + (Number(sub.price) || 0), 0);
    const activeSubscriptions = activeSubs.length;

    // Get failed payments today
    const { count: failedPaymentsToday, error: failedError } = await supabase
      .from('therapist_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'past_due')
      .gte('updated_at', today.toISOString());

    if (failedError) throw failedError;

    // Get churn rate (canceled this month / active previous month proxy)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { count: cancelledThisMonth, error: cancelError } = await supabase
      .from('therapist_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('updated_at', startOfMonth.toISOString());

    if (cancelError) throw cancelError;

    const base = activeSubscriptions + (cancelledThisMonth || 0);
    const churnRate = base > 0 ? ((cancelledThisMonth || 0) / base) * 100 : 0;

    return {
      mrr,
      activeSubscriptions,
      churnRate: Number(churnRate.toFixed(2)),
      failedPaymentsToday: failedPaymentsToday || 0
    };
  }, null),

  /**
   * Fetches paginated list of subscriptions
   * @param {object} params
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchSubscriptions: apiHandler('fetchSubscriptions', async ({ page = 0, limit = 20, filters = {} }) => {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('therapist_subscriptions')
      .select('*, therapist:profiles!therapist_subscriptions_therapist_id_fkey(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.plan_name) {
      query = query.ilike('plan_name', `%${filters.plan_name}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  /**
   * Fetches a single subscription by ID
   * @param {string} id
   * @returns {Promise<object>}
   */
  fetchSubscriptionById: apiHandler('fetchSubscriptionById', async (id) => {
    const { data, error } = await supabase
      .from('therapist_subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || {};
  }, null),

  /**
   * Fetches paginated list of payments (simulated from subscriptions)
   * @param {object} params
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchPayments: apiHandler('fetchPayments', async ({ page = 0, limit = 20, filters = {} }) => {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('therapist_subscriptions')
      .select('id, therapist_id, plan_name, price, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  /**
   * Fetches details for a specific payment transaction
   * @param {string} id
   * @returns {Promise<object>}
   */
  fetchPaymentById: apiHandler('fetchPaymentById', async (id) => {
    const { data, error } = await supabase
      .from('therapist_subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || {};
  }, null),

  /**
   * Processes a refund for a payment
   * @param {string} paymentId
   * @param {object} refundData
   * @returns {Promise<object>}
   */
  processRefund: apiHandler.mutation('processRefund', async (paymentId, refundData) => {
    const { error } = await supabase
      .from('therapist_subscriptions')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (error) throw error;

    return {
      success: true,
      refundId: `ref_${Date.now()}`
    };
  }),

  /**
   * Fetches all membership plans
   * @returns {Promise<Array>}
   */
  fetchPlans: apiHandler('fetchPlans', async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      return [
        { id: '1', name: 'Individual', price: 25778, description: 'Para terapeutas independientes', features: ['Agenda', 'Ficha clínica', 'Perfil profesional'] },
        { id: '2', name: 'Profesional', price: 52556, description: 'Para profesionales avanzados', features: ['Todo Individual', 'IA', 'Marketplace', 'Reportes'] },
        { id: '3', name: 'Centro', price: 88222, description: 'Para clínicas y centros', features: ['Todo Profesional', '5 usuarios', 'Gestión de equipo'] },
      ];
    }

    return data || [];
  }, []),

  /**
   * Creates or updates a plan
   * @param {object} planData
   * @returns {Promise<object>}
   */
  upsertPlan: apiHandler.mutation('upsertPlan', async (planData) => {
    let query;

    if (planData.id) {
      query = supabase
        .from('subscription_plans')
        .update(planData)
        .eq('id', planData.id);
    } else {
      query = supabase
        .from('subscription_plans')
        .insert([planData]);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;
    return data;
  }),

  deletePlan: apiHandler.mutation('deletePlan', async (id) => {
    const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
    if (error) throw error;
    return true;
  }),

  /**
   * Fetches paginated list of coupons
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchCoupons: apiHandler('fetchCoupons', async () => {
    const { data, count, error } = await supabase
      .from('discount_coupons')
      .select('*', { count: 'exact' })
      .eq('coupon_type', 'membership')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  /**
   * Creates a new discount coupon
   * @param {object} couponData
   * @returns {Promise<object>}
   */
  createCoupon: apiHandler.mutation('createCoupon', async (couponData) => {
    const { data, error } = await supabase
      .from('discount_coupons')
      .insert([{
        code: couponData.code,
        discount_type: couponData.discount_type,
        discount_value: couponData.discount_value,
        valid_from: couponData.valid_from,
        expiration_date: couponData.valid_until,
        max_uses: couponData.max_uses,
        is_active: couponData.active !== undefined ? couponData.active : true,
        coupon_type: 'membership',
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }),

  /**
   * Fetches commissions summary
   * @param {object} params
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchCommissions: apiHandler('fetchCommissions', async (params = {}) => {
    const { page = 0, limit = 20 } = params;
    const from = page * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('therapist_commissions')
      .select('*, therapist:profiles(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  /**
   * Fetches invoices generated by the system (simulated from subscriptions)
   * @param {object} params
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchInvoices: apiHandler('fetchInvoices', async (params = {}) => {
    const { page = 0, limit = 20 } = params;
    const from = page * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('therapist_subscriptions')
      .select('id, therapist_id, plan_name, price, status, created_at, current_period_end, therapist:profiles(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 })
};
