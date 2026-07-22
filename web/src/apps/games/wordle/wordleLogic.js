/** Wordle guess evaluation helpers. */

/** @typedef {'correct' | 'present' | 'absent'} LetterStatus */

/**
 * Score a guess against the secret (Wordle rules).
 * @param {string} guess
 * @param {string} answer
 * @returns {LetterStatus[]}
 */
export function evaluateGuess(guess, answer) {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const n = a.length;
  /** @type {(LetterStatus | null)[]} */
  const result = Array(n).fill(null);
  const remaining = {};

  for (let i = 0; i < n; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct';
    } else {
      remaining[a[i]] = (remaining[a[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < n; i++) {
    if (result[i]) continue;
    const ch = g[i];
    if (remaining[ch] > 0) {
      result[i] = 'present';
      remaining[ch] -= 1;
    } else {
      result[i] = 'absent';
    }
  }

  return /** @type {LetterStatus[]} */ (result);
}

export function maxGuessesForLength(len) {
  return Math.max(6, len);
}

export const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back'],
];

/**
 * Merge key statuses; correct > present > absent.
 * @param {Record<string, LetterStatus>} current
 * @param {string} guess
 * @param {LetterStatus[]} statuses
 */
export function mergeKeyStatuses(current, guess, statuses) {
  const next = { ...current };
  const rank = { absent: 1, present: 2, correct: 3 };
  for (let i = 0; i < guess.length; i++) {
    const ch = guess[i];
    const status = statuses[i];
    if (!next[ch] || rank[status] > rank[next[ch]]) {
      next[ch] = status;
    }
  }
  return next;
}
