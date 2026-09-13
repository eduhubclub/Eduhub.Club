/**
 * Local calendar day as YYYY-MM-DD.
 * @param {Date} [date]
 */
export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {string} iso
 * @param {number} days
 */
export function addDaysToDateKey(iso, days) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + Number(days) || 0);
  return localDateKey(date);
}

/**
 * Today plus the next `extraDays` calendar days.
 * @param {string} [start]
 * @param {number} [extraDays]
 */
export function weekPreviewKeys(start = localDateKey(), extraDays = 7) {
  const keys = [];
  for (let i = 0; i <= extraDays; i += 1) {
    keys.push(addDaysToDateKey(start, i));
  }
  return keys.filter(Boolean);
}

/**
 * @param {string} iso
 */
export function formatOfTheDayDate(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * @param {string} iso
 */
export function formatOfTheDayDateShort(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * FNV-1a hash for stable daily picks.
 * @param {string} text
 */
export function hashKey(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
