export const MARKETPLACE_CONFIG = {
  COMMISSION_RATE: 0.30, // 30%
  MIN_PRICE: 1000,
  MAX_PRICE: 500000,
  CURRENCY: 'CLP'
};

export const formatMarketplacePrice = (amount, currency = 'CLP') => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const calculateCommission = (price) => {
  return Math.round(price * MARKETPLACE_CONFIG.COMMISSION_RATE);
};

export const calculateNetEarnings = (price) => {
  return price - calculateCommission(price);
};