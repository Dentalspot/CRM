/**
 * @file marketplace.edge.js
 * @description Client-side SDK for Marketplace Admin & Financial Ops.
 * 
 * MODULE RESPONSIBILITY:
 * - Interface with 'marketplace' Edge Function.
 * - Manage complex multi-party transactions (commissions, withdrawals).
 * - Handle coupon logic and sale invalidations.
 * 
 * SECURITY/AUDIT APPROACH:
 * - JWT: Validates seller/admin roles.
 * - ACID: Critical for commission splitting (Server-side).
 * - Rate Limiting: Essential for coupon endpoints to prevent brute-force.
 * 
 * HOW TO EXTEND:
 * - Add new marketplace features (e.g., bundles, auctions) as actions.
 */

import { supabase } from '@/lib/supabaseClient';

const FUNCTION_NAME = 'marketplace';

const formatResponse = (data, error) => ({
  success: !error,
  data: data || null,
  error: error?.message || null,
  code: error?.code || (error ? 'MARKETPLACE_ERROR' : 'SUCCESS'),
  auditId: data?.auditId || null,
  timestamp: new Date().toISOString()
});

/**
 * Security & Compliance Checklist:
 * [x] Role Check (Seller vs Admin logic on server)
 * [x] Transaction Integrity (Server-side locks)
 * [x] Audit Logs (Financial movements logged)
 */

export const marketplaceApi = {

  processMarketplaceSale: async ({ buyerId, items, paymentIntent }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'processMarketplaceSale', buyerId, items, paymentIntent }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  calculateCommission: async ({ saleAmount, sellerId, category }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'calculateCommission', saleAmount, sellerId, category }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  processWithdrawal: async ({ sellerId, amount, method }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'processWithdrawal', sellerId, amount, method }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  approveWithdrawal: async ({ withdrawalId, adminId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'approveWithdrawal', withdrawalId, adminId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  rejectWithdrawal: async ({ withdrawalId, adminId, reason }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'rejectWithdrawal', withdrawalId, adminId, reason }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  createCoupon: async (couponData) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'createCoupon', ...couponData }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  validateCoupon: async ({ code, cartTotal, userId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'validateCoupon', code, cartTotal, userId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  applyCoupon: async ({ code, orderId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'applyCoupon', code, orderId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  invalidateSale: async ({ saleId, reason }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'invalidateSale', saleId, reason }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  refundSale: async ({ saleId, amount, reason }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'refundSale', saleId, amount, reason }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  generateMarketplaceReport: async ({ period, sellerId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'generateMarketplaceReport', period, sellerId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  }
};