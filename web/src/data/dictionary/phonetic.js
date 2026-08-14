import { normalizeLookup } from './spellingBank';

/**
 * Kid invented-spelling key: fold digraphs, drop extra h, then drop vowels.
 * “pouhm” and “poem” both become “pm”.
 * @param {string} raw
 */
export function phoneticKey(raw) {
  let w = normalizeLookup(raw);
  if (!w) return '';
  w = w
    .replace(/ph/g, 'f')
    .replace(/kn/g, 'n')
    .replace(/wr/g, 'r')
    .replace(/wh/g, 'w')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'k')
    .replace(/ght/g, 't')
    .replace(/igh/g, 'i')
    .replace(/dge/g, 'j')
    .replace(/tch/g, 'ch')
    .replace(/ch/g, 'c')
    .replace(/sh/g, 'c')
    .replace(/th/g, 't')
    .replace(/mb$/g, 'm')
    .replace(/x/g, 'ks')
    .replace(/z/g, 's')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k');
  w = w.charAt(0) + w.slice(1).replace(/h/g, '');
  w = w.replace(/[aeiouy]/g, '');
  w = w.replace(/(.)\1+/g, '$1');
  return w;
}

/**
 * Levenshtein distance, or -1 if it would exceed `max`.
 * @param {string} a
 * @param {string} b
 * @param {number} [max]
 */
export function editDistance(a, b, max = 3) {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return -1;
  const prev = new Array(lb + 1);
  const cur = new Array(lb + 1);
  for (let j = 0; j <= lb; j += 1) prev[j] = j;
  for (let i = 1; i <= la; i += 1) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= lb; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return -1;
    for (let j = 0; j <= lb; j += 1) prev[j] = cur[j];
  }
  const d = prev[lb];
  return d > max ? -1 : d;
}

/**
 * @param {string} query
 * @param {string} word
 */
export function scoreKidSpelling(query, word) {
  const q = normalizeLookup(query);
  const w = normalizeLookup(word);
  if (!q || !w || q === w) return 0;

  const qKey = phoneticKey(q);
  const wKey = phoneticKey(w);
  const lenDiff = Math.abs(w.length - q.length);
  const sameFirst = q[0] === w[0];

  if (qKey && qKey === wKey && sameFirst) {
    if (qKey.length <= 1 && lenDiff > 1) return 0;
    return Math.max(0, 88 - lenDiff * 4);
  }

  if (!sameFirst) return 0;
  const dist = editDistance(q, w, q.length >= 6 ? 3 : 2);
  if (dist === 1) return 72;
  if (dist === 2 && q.length >= 4) return 56;
  return 0;
}

const MIN_SCORE = 56;

/**
 * Classroom words that sound like an invented spelling, best first.
 * @param {string} raw
 * @param {string[]} words
 */
export function localPhoneticMatches(raw, words) {
  const query = normalizeLookup(raw);
  if (query.length < 3) return [];
  const scored = [];
  for (const word of words || []) {
    const next = normalizeLookup(word);
    if (!next || next === query) continue;
    const score = scoreKidSpelling(query, next);
    if (score >= MIN_SCORE) scored.push({ word: next, score });
  }
  scored.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
  const out = [];
  const seen = new Set();
  for (const row of scored) {
    if (seen.has(row.word)) continue;
    seen.add(row.word);
    out.push(row.word);
    if (out.length >= 6) break;
  }
  return out;
}
