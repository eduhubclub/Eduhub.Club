/** Keep in sync with web/src/data/auth/codes.js */
export const QR_PREFIX = 'eduhub-login:';

export function normalizeJoinCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isValidPin(value) {
  return /^\d{4,6}$/.test(String(value || '').trim());
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

export function parseLoginQr(value) {
  const raw = String(value || '').trim();
  if (raw.startsWith(QR_PREFIX)) {
    const token = raw.slice(QR_PREFIX.length).trim();
    return token.length >= 16 ? token : '';
  }
  return tokenFromCard(raw);
}
