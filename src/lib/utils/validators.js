import { normalizeRut } from './normalizers';

/**
 * Validates a Chilean RUT
 * Checks format and verifies check digit (DV) using Modulo 11 algorithm
 * @param {string} rut - RUT to validate
 * @returns {boolean} True if valid
 */
export const isValidRut = (rut) => {
  if (!rut || typeof rut !== 'string') return false;

  const cleanRut = normalizeRut(rut);
  if (cleanRut.length < 8) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  let rutBody = parseInt(body, 10);

  if (isNaN(rutBody)) return false;

  let sum = 0;
  let multiplier = 2;

  while (rutBody > 0) {
    sum += (rutBody % 10) * multiplier;
    rutBody = Math.floor(rutBody / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedDv = remainder === 11 ? '0' : remainder === 10 ? 'K' : remainder.toString();

  return dv === expectedDv;
};

/**
 * Validates email format (RFC 5322 compliant regex)
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 compliant regex
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  return emailRegex.test(email);
};

/**
 * Validates Chilean phone number format
 * Accepts: +569XXXXXXXX, 569XXXXXXXX, 9XXXXXXXX
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check common Chilean mobile formats
  // +569 + 8 digits
  // 569 + 8 digits
  // 9 + 8 digits
  const phoneRegex = /^(\+?56)?9\d{8}$/;
  
  return phoneRegex.test(cleanPhone);
};

/**
 * Validates if a value is a valid date
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if valid
 */
export const isValidDate = (date) => {
  if (!date) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Validates if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates password strength
 * Rules: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // Min 8 chars
  if (password.length < 8) return false;
  
  // At least one uppercase
  if (!/[A-Z]/.test(password)) return false;
  
  // At least one lowercase
  if (!/[a-z]/.test(password)) return false;
  
  // At least one number
  if (!/[0-9]/.test(password)) return false;
  
  return true;
};

/**
 * Validates a person's name
 * Allows letters, spaces, hyphens, apostrophes, and accented characters
 * Rejects numbers and special symbols
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // Allow Unicode letters (accents), spaces, hyphens, apostrophes
  // Reject digits and other symbols
  const nameRegex = /^[a-zA-Z\u00C0-\u00FF\s\-\']+$/;
  
  return name.trim().length > 1 && nameRegex.test(name.trim());
};

export default {
  isValidRut,
  isValidEmail,
  isValidPhone,
  isValidDate,
  isValidUrl,
  isValidPassword,
  isValidName
};