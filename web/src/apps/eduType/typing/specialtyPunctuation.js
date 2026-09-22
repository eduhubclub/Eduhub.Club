/**
 * Specialty punctuation kids can type with plain-keyboard shortcuts.
 * When the target is a specialty char, the shortcut inserts that char.
 */

/** @typedef {{ char: string, name: string, shortcut: string, hint: string }} SpecialtyShortcut */

/** @type {SpecialtyShortcut[]} */
export const SPECIALTY_PUNCTUATION = [
  { char: '—', name: 'Em dash', shortcut: '--', hint: 'type --' },
  { char: '–', name: 'En dash', shortcut: '-', hint: 'type -' },
  { char: '…', name: 'Ellipsis', shortcut: '...', hint: 'type ...' },
  { char: '\u2018', name: 'Left single quote', shortcut: "'", hint: "type '" },
  { char: '\u2019', name: 'Right single quote', shortcut: "'", hint: "type '" },
  { char: '\u201C', name: 'Left double quote', shortcut: '"', hint: 'type "' },
  { char: '\u201D', name: 'Right double quote', shortcut: '"', hint: 'type "' },
];

const BY_CHAR = new Map(SPECIALTY_PUNCTUATION.map((row) => [row.char, row]));

export function specialtyForChar(ch) {
  return BY_CHAR.get(ch) || null;
}

/** Shortcuts that appear in a passage, de-duped by char. */
export function specialtiesInText(text) {
  const seen = new Set();
  const out = [];
  for (const ch of String(text || '')) {
    if (seen.has(ch)) continue;
    const row = BY_CHAR.get(ch);
    if (!row) continue;
    seen.add(ch);
    out.push(row);
  }
  return out;
}

/**
 * Apply one printable key against an expected specialty (or null).
 * @returns {{ pending: string, insert: string|null, correct: boolean, error: boolean }}
 */
export function applySpecialtyKey(expect, pending, ch) {
  const row = expect ? BY_CHAR.get(expect) : null;
  if (!row) {
    return { pending: '', insert: null, correct: false, error: true };
  }

  const next = `${pending || ''}${ch}`;
  if (next === row.shortcut) {
    return { pending: '', insert: expect, correct: true, error: false };
  }
  if (row.shortcut.startsWith(next)) {
    return { pending: next, insert: null, correct: false, error: false };
  }
  return { pending: '', insert: null, correct: false, error: true };
}
