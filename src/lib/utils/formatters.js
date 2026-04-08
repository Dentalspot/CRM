
/**
 * Formatters - Utility functions for formatting data
 * @module lib/utils/formatters
 */

// ============================================
// CURRENCY FORMATTERS
// ============================================

/**
 * Formats a number as Chilean Peso (CLP).
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ============================================
// PHONE FORMATTERS
// ============================================

/**
 * Formats a phone number for display.
 * @param {string} phone - The phone number to format.
 * @returns {string} The formatted phone number.
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');

  // Format as 9 XXXX XXXX if length is 9
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{1})(\d{4})(\d{4})/, '$1 $2 $3');
  }

  // Format as +56 9 XXXX XXXX if length is 11 starting with 56
  if (cleaned.length === 11 && cleaned.startsWith('56')) {
    return cleaned.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '+$1 $2 $3 $4');
  }

  return phone;
};

/**
 * Removes all non-numeric characters from a phone number.
 * @param {string} phone - The phone number to clean.
 * @returns {string} The cleaned phone number (digits only).
 */
export const cleanPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// ============================================
// RUT FORMATTERS (Chilean ID)
// ============================================

/**
 * Cleans a RUT by removing dots, dashes, and spaces.
 * @param {string} rut - The RUT to clean.
 * @returns {string} The cleaned RUT (only numbers and K).
 */
export const cleanRut = (rut) => {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

/**
 * Formats a RUT with dots and dash (Chilean format).
 * @param {string} rut - The RUT to format.
 * @returns {string} The formatted RUT (e.g., 12.345.678-9).
 */
export const formatRut = (rut) => {
  if (!rut) return '';
  const cleaned = cleanRut(rut);
  if (cleaned.length <= 1) return cleaned;

  let rutBody = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Add dots every 3 digits from right to left
  rutBody = rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${rutBody}-${dv}`;
};

/**
 * Validates a Chilean RUT.
 * @param {string} rut - The RUT to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export const validateRut = (rut) => {
  if (!rut) return false;

  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return false;

  const dv = cleaned.slice(-1).toUpperCase();
  let rutBody = parseInt(cleaned.slice(0, -1), 10);

  if (isNaN(rutBody)) return false;

  let M = 0;
  let S = 1;

  for (; rutBody; rutBody = Math.floor(rutBody / 10)) {
    S = (S + (rutBody % 10) * (9 - M++ % 6)) % 11;
  }

  const calculatedDv = S ? String(S - 1) : 'K';

  return calculatedDv === dv;
};

// ============================================
// DATE FORMATTERS
// ============================================

/**
 * Formats a date string or Date object.
 * @param {string|Date} date - The date to format.
 * @param {string} formatStr - The format string (default: 'd MMM yyyy').
 * @returns {string} The formatted date or empty string if invalid.
 */
export const formatDate = (date, formatStr = 'd MMM yyyy') => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    // Simple formatting without date-fns dependency
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('es-CL', { month: 'short' });
    const year = dateObj.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return '';
  }
};
