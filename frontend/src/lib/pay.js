/**
 * Formatting helpers for money and counts.
 *
 * Hours, pay and breakdown figures are calculated by the server - this
 * module only formats those values for display.
 */

/**
 * Formats a number as Australian currency using Intl.NumberFormat.
 * Produces "$1,131.97" with proper thousands separators.
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

/**
 * Returns the correct plural form based on count.
 * pluralise(1, 'shift') -> '1 shift'
 * pluralise(3, 'shift') -> '3 shifts'
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural] - defaults to singular + 's'
 * @returns {string}
 */
export function pluralise(count, singular, plural) {
  const word = count === 1 ? singular : (plural || singular + 's');
  return `${count} ${word}`;
}
