/**
 * String Utilities
 * Helper functions for string manipulation
 * 
 * @module lib/utils/strings
 */

/**
 * Extracts initials from a full name.
 * @param {string} name - The full name to extract initials from.
 * @returns {string} The initials (up to 2 characters).
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string.
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalizes the first letter of each word.
 * @param {string} str - The string to title case.
 * @returns {string} The title-cased string.
 */
export const titleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncates a string to a specified length and adds an ellipsis.
 * @param {string} str - The string to truncate.
 * @param {number} length - The maximum length.
 * @returns {string} The truncated string.
 */
export const truncate = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * Removes accents/diacritics from a string.
 * @param {string} str - The string to normalize.
 * @returns {string} The normalized string without accents.
 */
export const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Converts a string to a URL-friendly slug.
 * @param {string} str - The string to slugify.
 * @returns {string} The slugified string.
 */
export const slugify = (str) => {
  if (!str) return '';
  return removeAccents(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generates a random string of specified length.
 * @param {number} length - The desired length.
 * @returns {string} A random alphanumeric string.
 */
export const randomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Masks a string, showing only first and last characters.
 * Useful for displaying sensitive data like RUT or emails.
 * @param {string} str - The string to mask.
 * @param {number} visibleStart - Characters to show at start.
 * @param {number} visibleEnd - Characters to show at end.
 * @param {string} maskChar - Character to use for masking.
 * @returns {string} The masked string.
 */
export const maskString = (str, visibleStart = 2, visibleEnd = 2, maskChar = '*') => {
  if (!str || str.length <= visibleStart + visibleEnd) return str;

  const start = str.substring(0, visibleStart);
  const end = str.substring(str.length - visibleEnd);
  const middleLength = str.length - visibleStart - visibleEnd;
  const middle = maskChar.repeat(Math.min(middleLength, 6)); // Max 6 mask chars

  return start + middle + end;
};

/**
 * Checks if a string is empty or contains only whitespace.
 * @param {string} str - The string to check.
 * @returns {boolean} True if empty or whitespace only.
 */
export const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};

/**
 * Pluralizes a word based on count.
 * @param {number} count - The count to check.
 * @param {string} singular - Singular form.
 * @param {string} plural - Plural form (optional, defaults to singular + 's').
 * @returns {string} The appropriate form.
 */
export const pluralize = (count, singular, plural = null) => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};

export default {
  getInitials,
  capitalize,
  titleCase,
  truncate,
  removeAccents,
  slugify,
  randomString,
  maskString,
  isEmpty,
  pluralize
};