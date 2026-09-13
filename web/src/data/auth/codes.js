/**
 * Classroom sign-in codes. Keep in sync with
 * supabase/functions/_shared/codes.js (the Edge Function cannot import this file).
 */

export const JOIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const QR_PREFIX = 'eduhub-login:';
export const MIN_PASSWORD_LENGTH = 8;
export const ROLES = ['admin', 'teacher', 'student', 'parent'];
export const AGE_BANDS = ['k2', 'grades35', 'secondary'];

const PENDING_ROLE_KEY = 'edu.auth.pendingRole';

export function normalizeJoinCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isValidPin(value) {
  return /^\d{4,6}$/.test(String(value || '').trim());
}

export function isValidRole(value) {
  return ROLES.includes(value);
}

export function isValidAgeBand(value) {
  return value == null || value === '' || AGE_BANDS.includes(value);
}

export function passwordError(password) {
  if (String(password || '').length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return '';
}

function tokenFromCard(raw) {
  if (!raw.startsWith('{')) return '';
  try {
    const data = JSON.parse(raw);
    if (data?.app !== 'eduhub.card') return '';
    const token = String(data.token || '').trim();
    return token.length >= 16 ? token : '';
  } catch {
    return '';
  }
}

/** @returns {string} token, or '' if this is not a student card or login QR */
export function parseLoginQr(value) {
  const raw = String(value || '').trim();
  if (raw.startsWith(QR_PREFIX)) {
    const token = raw.slice(QR_PREFIX.length).trim();
    return token.length >= 16 ? token : '';
  }
  return tokenFromCard(raw);
}

export function buildLoginQrPayload(token) {
  return `${QR_PREFIX}${token}`;
}

export function rememberPendingRole(role) {
  if (!isValidRole(role)) return;
  try {
    sessionStorage.setItem(PENDING_ROLE_KEY, role);
  } catch {
    /* private mode */
  }
}

export function consumePendingRole() {
  try {
    const role = sessionStorage.getItem(PENDING_ROLE_KEY);
    sessionStorage.removeItem(PENDING_ROLE_KEY);
    return isValidRole(role) ? role : '';
  } catch {
    return '';
  }
}

export function clearPendingRole() {
  try {
    sessionStorage.removeItem(PENDING_ROLE_KEY);
  } catch {
    /* private mode */
  }
}
