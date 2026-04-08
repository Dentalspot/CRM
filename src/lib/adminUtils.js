/**
 * Utility functions for Super Admin Dashboard
 */
import logger from '@/lib/utils/logger';

// Formats number as Currency (CLP default)
export const formatCurrency = (amount, currency = 'CLP') => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculates Monthly Recurring Revenue (MRR)
// Expects array of subscriptions with price and interval
export const calculateMRR = (subscriptions = []) => {
  return subscriptions.reduce((total, sub) => {
    let monthlyAmount = 0;
    const price = parseFloat(sub.price || 0);
    
    if (sub.status !== 'active') return total;

    switch (sub.billing_cycle) {
      case 'monthly':
        monthlyAmount = price;
        break;
      case 'yearly':
        monthlyAmount = price / 12;
        break;
      case 'lifetime':
        // Lifetime usually doesn't contribute to MRR in standard SaaS models,
        // or is amortized over expected lifetime (e.g., 24 months).
        // For simplicity here, we ignore or treat as 0 for MRR.
        monthlyAmount = 0; 
        break;
      default:
        monthlyAmount = 0;
    }
    return total + monthlyAmount;
  }, 0);
};

// Calculates Churn Rate
// (Lost Customers / Total Customers at Start of Period) * 100
export const calculateChurnRate = (totalCustomersStart, lostCustomers) => {
  if (totalCustomersStart === 0) return 0;
  return ((lostCustomers / totalCustomersStart) * 100).toFixed(2);
};

// Validates if a plan object has required features structure
export const validatePlanFeatures = (features) => {
  if (!Array.isArray(features)) return false;
  // Basic check: each feature should be a string or object with id/name
  return features.every(f => typeof f === 'string' || (typeof f === 'object' && f.id));
};

// Stub for invoice generation
export const generateInvoice = async (paymentId) => {
  logger.api(`Generating invoice for payment ${paymentId}...`);
  // Logic to call PDF generator or external API would go here
  return { success: true, url: `https://api.dentalspot.cl/invoices/${paymentId}.pdf` };
};

// Stub for sending subscription emails
export const sendSubscriptionEmail = async (userId, type, data) => {
  logger.api(`Sending ${type} email to user ${userId}`, data);
  // Logic to call email service (Resend, SendGrid, etc.)
  return { success: true };
};