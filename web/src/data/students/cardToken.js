/**
 * One secret per student card. Reprinting a lost card returns the same
 * token. A new token is written only when a teacher or admin replaces it.
 */

const STORAGE_KEY = 'edu.student.cardTokens';

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function writeCard(studentId, token, updatedAt = Date.now()) {
  const id = String(studentId || '');
  if (!id || !token) return null;
  const row = { token: String(token), updatedAt: Number(updatedAt) || Date.now() };
  const map = readMap();
  map[id] = row;
  writeMap(map);
  return row;
}

/** @returns {{ token: string, updatedAt: number } | null} */
export function readCardToken(studentId) {
  const row = readMap()[String(studentId || '')];
  if (!row?.token) return null;
  return { token: String(row.token), updatedAt: Number(row.updatedAt) || 0 };
}

/** Same token on every call until the card is replaced. */
export function ensureCardToken(studentId) {
  return readCardToken(studentId) || writeCard(studentId, randomToken());
}

/** Teacher or admin only. The previous printed card stops matching. */
export function rotateCardToken(studentId) {
  return writeCard(studentId, randomToken());
}

export function saveCardToken(studentId, token, updatedAt = Date.now()) {
  return writeCard(studentId, token, updatedAt);
}

/** False only when this computer already has a different current card. */
export function cardTokenMatches(studentId, token) {
  const current = readCardToken(studentId);
  if (!current || !token) return true;
  return current.token === String(token);
}
