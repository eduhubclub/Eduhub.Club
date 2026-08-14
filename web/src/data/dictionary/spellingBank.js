const STORAGE_KEY = 'eduHub.dictionary.spellings';
const MAX_ATTEMPTS = 500;

/**
 * @param {string} raw
 */
export function normalizeLookup(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function readBank() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeBank(bank) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
  } catch {
    /* ignore quota */
  }
}

function prune(bank) {
  const keys = Object.keys(bank);
  if (keys.length <= MAX_ATTEMPTS) return bank;
  const ranked = keys
    .map((attempt) => {
      const total = Object.values(bank[attempt] || {}).reduce(
        (sum, n) => sum + Number(n || 0),
        0,
      );
      return { attempt, total };
    })
    .sort((a, b) => a.total - b.total);
  const next = { ...bank };
  const drop = ranked.length - MAX_ATTEMPTS;
  for (let i = 0; i < drop; i += 1) delete next[ranked[i].attempt];
  return next;
}

/**
 * Learned corrections for an attempted spelling, highest count first.
 * @param {string} attempt
 * @returns {{ word: string, count: number }[]}
 */
export function learnedFor(attempt) {
  const key = normalizeLookup(attempt);
  if (!key) return [];
  const row = readBank()[key] || {};
  return Object.entries(row)
    .map(([word, count]) => ({ word, count: Number(count) || 0 }))
    .filter((item) => item.word && item.count > 0)
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

/**
 * Record that `attempt` was resolved to `chosen`. No-op if they match.
 * @param {string} attempt
 * @param {string} chosen
 */
export function recordSpelling(attempt, chosen) {
  const from = normalizeLookup(attempt);
  const to = normalizeLookup(chosen);
  if (!from || !to || from === to) return;
  const bank = prune(readBank());
  const row = { ...(bank[from] || {}) };
  row[to] = (Number(row[to]) || 0) + 1;
  bank[from] = row;
  writeBank(prune(bank));
}
