/**
 * Date and time formatting helpers for ShiftProof.
 *
 * Every date, hour and window figure is produced by the server (shifts come
 * with computed hours/pay, the summary carries the rolling window bounds);
 * this module only turns those values into display labels.
 * Pure functions - no state, no side effects.
 */

/**
 * Returns the day of the week for a given date string or Date object.
 * @param {string|Date} date
 * @returns {string} Lowercase day name (e.g. 'monday')
 */
export function getDayOfWeek(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[d.getDay()];
}

/**
 * Formats a date string or Date object as a human-readable string.
 * @param {string|Date} date
 * @returns {string} e.g. "Mon, 15 Sep 2026"
 */
export function formatDate(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a time string (HH:MM or HH:MM:SS) to 12-hour display.
 * @param {string} timeString
 * @returns {string} e.g. "9:00 AM"
 */
export function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Label for a server-supplied window (e.g. summary.window_start/window_end).
 * @param {string} startISO YYYY-MM-DD
 * @param {string} endISO YYYY-MM-DD
 * @returns {string} e.g. "29 Sep – 12 Oct"
 */
export function formatDateRange(startISO, endISO) {
  const opts = { day: 'numeric', month: 'short' };
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  return `${start.toLocaleDateString('en-AU', opts)} – ${end.toLocaleDateString('en-AU', opts)}`;
}

/**
 * Returns the ISO date string (YYYY-MM-DD) for a Date object.
 * @param {Date} date
 * @returns {string}
 */
export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
