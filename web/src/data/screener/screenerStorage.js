/**
 * Screener results stay on this device, keyed by class.
 * Each screener stores its own answers; reports are scored again on open.
 */

const KEY = 'eduHub.screener.results';
const MAX_RESULTS = 400;

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_RESULTS)));
}

function isResult(row) {
  return Boolean(
    row &&
      typeof row.id === 'string' &&
      typeof row.screenerId === 'string' &&
      Array.isArray(row.answers),
  );
}

export function loadScreenerResults(classId) {
  const rows = readAll().filter(isResult);
  if (!classId) return rows;
  return rows.filter((row) => row.classId === classId);
}

export function saveScreenerResult(result) {
  if (!isResult(result)) {
    throw new Error('Screener result is missing an id or answers.');
  }
  const next = [result, ...readAll().filter((row) => row.id !== result.id)];
  writeAll(next);
  return result;
}

export function removeScreenerResult(id) {
  writeAll(readAll().filter((row) => row.id !== id));
}

export function newScreenerResultId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `screener-${Date.now()}`;
}
