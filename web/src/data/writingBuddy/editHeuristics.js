/**
 * Lightweight non-AI edit checks for Writing Buddy revise gates.
 */

/**
 * @param {string} text
 */
export function startsWithCapital(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  const ch = t[0];
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

/**
 * @param {string} text
 */
export function endsWithEndMark(text) {
  const t = String(text || '').trim();
  return /[.!?]$/.test(t);
}

/**
 * Split into word tokens with original offsets for chip UI.
 * @param {string} text
 * @returns {{ word: string, start: number, end: number }[]}
 */
export function tokenizeWords(text) {
  const src = String(text || '');
  const out = [];
  const re = /[A-Za-z']+/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * Replace one token span in text.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {string} nextWord
 */
export function replaceSpan(text, start, end, nextWord) {
  const src = String(text || '');
  const a = Math.max(0, Number(start) || 0);
  const b = Math.max(a, Number(end) || a);
  return `${src.slice(0, a)}${nextWord}${src.slice(b)}`;
}

/**
 * Build a checklist snapshot for the revise UI.
 * @param {string} text
 */
export function editChecklist(text) {
  const t = String(text || '').trim();
  return {
    hasText: Boolean(t),
    capital: startsWithCapital(t),
    endMark: endsWithEndMark(t),
  };
}
