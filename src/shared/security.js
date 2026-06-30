/**
 * security.js
 * Centralized utility for input validation and sanitization
 */

/**
 * Trims and truncates a string to a maximum length.
 * Basic HTML escaping to prevent XSS (though React escapes by default, this ensures safe data in Firestore).
 *
 * @param {string} str - The input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  let sanitized = str.trim().slice(0, maxLength);
  // Basic HTML escape
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  return sanitized;
}

/**
 * Validates if a number is within the given range (inclusive).
 * Returns the number if valid, or a fallback value if invalid.
 *
 * @param {any} value - The input value to parse
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} fallback - Value to return if invalid
 * @returns {number} Validated number
 */
export function validateNumber(value, min, max, fallback = 0) {
  const num = parseFloat(value);
  if (isNaN(num) || num < min || num > max) {
    return fallback;
  }
  return num;
}

/**
 * Basic email validation regex
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  // A simple but effective email regex pattern
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
