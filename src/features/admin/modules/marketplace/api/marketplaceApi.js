
/**
 * @file marketplaceApi.js
 * @description API module for Marketplace management. Handles sales, commissions, withdrawals, products, and coupons.
 * @module features/admin/modules/marketplace/api
 */

import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import { apiHandler } from '@/lib/api/apiHandler';

/**
 * Logs marketplace admin actions for audit purposes.
 * @param {string} action - The action performed (e.g., 'approve_commission').
 * @param {object} details - Metadata about the action.
 */
const logMarketplaceAction = async (action, details = {}) => {
  logger.log(`[Marketplace Audit] ${action}`, details);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action,
        target_resource: 'marketplace',
        details
      });
    }
  } catch (err) {
    logger.error('Failed to log audit action', err);
  }
};

export const marketplaceApi = {
  /**
   * Fetches marketplace sales with pagination and filters.
   * @param {object} params - { page, limit, status, dateFrom, dateTo }
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchSales: apiHandler('fetchSales', async ({ page = 0, limit = 10, status, dateFrom, dateTo } = {}) => {
    await logMarketplaceAction('fetch_sales', { page, limit, status, dateFrom, dateTo });

    let query = supabase
      .from('sales_summary')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('payment_status', status);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    query = query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }, { data: [], count: 0 }),

  /**
   * Fetches details of a specific sale.
   * @param {string} saleId
   * @returns {Promise<object>}
   */
  fetchSaleById: apiHandler('fetchSaleById', async (saleId) => {
    await logMarketplaceAction('fetch_sale_detail', { saleId });
    const { data, error } = await supabase
      .from('sales_summary')
      .select('*')
      .eq('id', saleId)
      .single();
    if (error) throw error;
    return data;
  }, null),

  /**
   * Invalidates a sale (e.g., fraud or dispute).
   * @param {string} saleId
   * @param {string} reason
   * @returns {Promise<object>}
   */
  invalidateSale: apiHandler.mutation('invalidateSale', async (saleId, reason) => {
    await logMarketplaceAction('invalidate_sale', { saleId, reason });
    const { data, error } = await supabase
      .from('sales_summary')
      .update({ payment_status: 'invalidated', client_info: { invalidation_reason: reason } })
      .eq('id', saleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Fetches commissions pending or paid.
   * @param {object} params
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchCommissions: apiHandler('fetchCommissions', async ({ page = 0, limit = 10, status } = {}) => {
    await logMarketplaceAction('fetch_commissions', { page, limit, status });

    let query = supabase
      .from('therapist_commissions')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);

    query = query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }, { data: [], count: 0 }),

  /**
   * Approves a commission for payment.
   * @param {string} commissionId
   * @returns {Promise<object>}
   */
  approveCommission: apiHandler.mutation('approveCommission', async (commissionId) => {
    await logMarketplaceAction('approve_commission', { commissionId });
    const { data, error } = await supabase
      .from('therapist_commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', commissionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Fetches withdrawal requests.
   * @param {object} params
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchWithdrawals: apiHandler('fetchWithdrawals', async ({ page = 0, limit = 10, status } = {}) => {
    await logMarketplaceAction('fetch_withdrawals', { page, limit, status });

    let query = supabase
      .from('marketplace_payouts')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);

    query = query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }, { data: [], count: 0 }),

  /**
   * Approves and processes a withdrawal (mark as paid).
   * @param {string} withdrawalId
   * @param {string} paymentReference
   * @returns {Promise<object>}
   */
  approveWithdrawal: apiHandler.mutation('approveWithdrawal', async (withdrawalId, paymentReference) => {
    await logMarketplaceAction('approve_withdrawal', { withdrawalId, paymentReference });
    const { data, error } = await supabase
      .from('marketplace_payouts')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_reference: paymentReference
      })
      .eq('id', withdrawalId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Rejects/cancels a withdrawal request.
   * @param {string} withdrawalId
   * @returns {Promise<object>}
   */
  rejectWithdrawal: apiHandler.mutation('rejectWithdrawal', async (withdrawalId) => {
    await logMarketplaceAction('reject_withdrawal', { withdrawalId });
    const { data, error } = await supabase
      .from('marketplace_payouts')
      .update({ status: 'cancelled' })
      .eq('id', withdrawalId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Fetches products from vendors.
   * @param {object} params
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchProducts: apiHandler('fetchProducts', async ({ page = 0, limit = 10, isApproved, isActive } = {}) => {
    await logMarketplaceAction('fetch_products', { page, limit, isApproved, isActive });

    let query = supabase
      .from('marketplace_items')
      .select('*', { count: 'exact' });

    if (isApproved !== undefined) query = query.eq('is_approved', isApproved);
    if (isActive !== undefined) query = query.eq('is_active', isActive);

    query = query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }, { data: [], count: 0 }),

  /**
   * Approves a product listing.
   * @param {string} productId
   * @returns {Promise<object>}
   */
  approveProduct: apiHandler.mutation('approveProduct', async (productId) => {
    await logMarketplaceAction('approve_product', { productId });
    const { data, error } = await supabase
      .from('marketplace_items')
      .update({ is_approved: true })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Rejects a product listing.
   * @param {string} productId
   * @returns {Promise<object>}
   */
  rejectProduct: apiHandler.mutation('rejectProduct', async (productId) => {
    await logMarketplaceAction('reject_product', { productId });
    const { data, error } = await supabase
      .from('marketplace_items')
      .update({ is_approved: false, is_active: false })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Fetches marketplace coupons.
   * @param {object} params
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchCoupons: apiHandler('fetchCoupons', async ({ page = 0, limit = 10 } = {}) => {
    await logMarketplaceAction('fetch_coupons', { page, limit });

    const { data, error, count } = await supabase
      .from('discount_coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;
    return { data, count };
  }, { data: [], count: 0 }),

  /**
   * Creates a new coupon.
   * @param {object} couponData
   * @returns {Promise<object>}
   */
  createCoupon: apiHandler.mutation('createCoupon', async (couponData) => {
    await logMarketplaceAction('create_coupon', { code: couponData.code });
    const { data, error } = await supabase
      .from('discount_coupons')
      .insert(couponData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Updates an existing coupon.
   * @param {string} couponId
   * @param {object} updates
   * @returns {Promise<object>}
   */
  updateCoupon: apiHandler.mutation('updateCoupon', async (couponId, updates) => {
    await logMarketplaceAction('update_coupon', { couponId, updates });
    const { data, error } = await supabase
      .from('discount_coupons')
      .update(updates)
      .eq('id', couponId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Deactivates a coupon.
   * @param {string} couponId
   * @returns {Promise<object>}
   */
  deactivateCoupon: apiHandler.mutation('deactivateCoupon', async (couponId) => {
    await logMarketplaceAction('deactivate_coupon', { couponId });
    const { data, error } = await supabase
      .from('discount_coupons')
      .update({ is_active: false })
      .eq('id', couponId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  /**
   * Fetches overall marketplace metrics.
   * @returns {Promise<object>}
   */
  fetchMetrics: async () => {
    // This could also be replaced by a real RPC call or aggregated query in the future.
    return Promise.resolve({ total_volume: 0, commission_revenue: 0 });
  }
};
