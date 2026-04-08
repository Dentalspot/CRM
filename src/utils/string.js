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