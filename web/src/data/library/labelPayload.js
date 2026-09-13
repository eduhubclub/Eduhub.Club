/**
 * Unique Edu.Hub copy labels (QR payload + short human code).
 * Publisher ISBN barcodes cannot tell copies apart.
 */

const APP = 'eduhub.library';

/**
 * @param {string} copyId
 * @param {string} [shortCode]
 */
export function buildLibraryLabelPayload(copyId, shortCode = '') {
  if (!copyId) return '';
  return JSON.stringify({
    v: 1,
    app: APP,
    copyId: String(copyId),
    code: String(shortCode || '').trim(),
  });
}

/**
 * @param {unknown} raw
 * @returns {{ copyId: string, code: string, v: number } | null}
 */
export function parseLibraryLabelPayload(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || data.app !== APP || !data.copyId) return null;
    return {
      copyId: String(data.copyId),
      code: String(data.code || '').trim(),
      v: Number(data.v) || 1,
    };
  } catch {
    return null;
  }
}

/**
 * Short sticker code, e.g. LIB-7K2M.
 * @param {string} [seed]
 */
export function makeShortCode(seed = '') {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 2166136261;
  const text = `${seed}:${Date.now()}:${Math.random()}`;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = '';
  let n = h >>> 0;
  for (let i = 0; i < 4; i += 1) {
    out += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length);
  }
  return `LIB-${out}`;
}

/**
 * Digits-only ISBN (allows trailing X for ISBN-10).
 * @param {string} raw
 */
export function normalizeIsbn(raw) {
  let cleaned = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^0-9X]/g, '');
  if (cleaned.length === 12 && !cleaned.includes('X')) {
    cleaned = `0${cleaned}`;
  }
  if (cleaned.length === 10 || cleaned.length === 13) return cleaned;
  return '';
}

/**
 * Heuristic: looks like a publisher ISBN (not our JSON label).
 * @param {string} raw
 */
export function looksLikeIsbn(raw) {
  return Boolean(normalizeIsbn(raw));
}
