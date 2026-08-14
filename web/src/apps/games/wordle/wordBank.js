import { WORD_LISTS as CURRICULUM_LISTS } from './wordLists';
import { ALL_WORDS_BY_LENGTH, COMMON_WORDS_BY_LENGTH } from './allWords';

export const ALL_WORDS_LIST_ID = 'all';

export const ALL_WORDS_LIST = {
  id: ALL_WORDS_LIST_ID,
  name: 'All English words',
  description:
    'Public-domain ENABLE dictionary. Puzzles use everyday words; any dictionary word is a valid guess.',
};

/** Lists shown in Wordle settings (curriculum + optional full dictionary). */
export const WORD_LISTS = [...CURRICULUM_LISTS, ALL_WORDS_LIST];
export const WORD_LIST_IDS = WORD_LISTS.map((list) => list.id);
export const WORD_LENGTHS = [2, 3, 4, 5, 6, 7, 8];

/** Curriculum lists on by default; All English words is opt-in. */
export const DEFAULT_WORD_LIST_IDS = CURRICULUM_LISTS.map((list) => list.id);

const heartList = CURRICULUM_LISTS.find((list) => list.id === 'heart');
const irregularList = CURRICULUM_LISTS.find((list) => list.id === 'irregular');

/** UFLI heart + irregular words (for the post-round Heart badge). */
export const HEART_WORDS = new Set([
  ...(heartList?.words || []),
  ...(irregularList?.words || []),
]);

/**
 * Keep known list ids; fall back to curriculum lists if nothing valid is selected.
 * @param {string[] | null | undefined} ids
 */
export function normalizeListIds(ids) {
  const allowed = new Set(WORD_LIST_IDS);
  const next = [...new Set((Array.isArray(ids) ? ids : []).filter((id) => allowed.has(id)))];
  return next.length ? next : [...DEFAULT_WORD_LIST_IDS];
}

function addCurriculumWords(out, len, enabled) {
  for (const list of CURRICULUM_LISTS) {
    if (!enabled.has(list.id)) continue;
    for (const word of list.words) {
      if (word.length === len) out.add(word);
    }
  }
}

/**
 * Valid guesses for `len` from the enabled lists.
 * @param {number} len
 * @param {string[]} [listIds]
 */
export function wordsForLength(len, listIds = DEFAULT_WORD_LIST_IDS) {
  const enabled = new Set(normalizeListIds(listIds));
  const out = new Set();
  addCurriculumWords(out, len, enabled);
  if (enabled.has(ALL_WORDS_LIST_ID)) {
    for (const word of ALL_WORDS_BY_LENGTH[len] || []) out.add(word);
  }
  return [...out].sort();
}

/**
 * Puzzle answers. When All English words is on, everyday words are used
 * instead of obscure dictionary entries.
 * @param {number} len
 * @param {string[]} [listIds]
 */
export function answerWordsForLength(len, listIds = DEFAULT_WORD_LIST_IDS) {
  const enabled = new Set(normalizeListIds(listIds));
  const out = new Set();
  addCurriculumWords(out, len, enabled);
  if (enabled.has(ALL_WORDS_LIST_ID)) {
    for (const word of COMMON_WORDS_BY_LENGTH[len] || []) out.add(word);
  }
  return [...out].sort();
}

/**
 * Count of words a settings chip should show for this list at `len`.
 * @param {string} listId
 * @param {number} len
 */
export function listCountAtLength(listId, len) {
  if (listId === ALL_WORDS_LIST_ID) {
    return (ALL_WORDS_BY_LENGTH[len] || []).length;
  }
  const list = CURRICULUM_LISTS.find((item) => item.id === listId);
  if (!list) return 0;
  return list.words.filter((word) => word.length === len).length;
}

/**
 * @param {string[]} listIds
 * @param {number} preferred
 */
export function firstLengthWithWords(listIds, preferred = 5) {
  if (answerWordsForLength(preferred, listIds).length) return preferred;
  for (const n of WORD_LENGTHS) {
    if (n !== preferred && answerWordsForLength(n, listIds).length) return n;
  }
  return preferred;
}

/**
 * @param {number} len
 * @param {string[]} [listIds]
 */
export function pickRandomWord(len, listIds = DEFAULT_WORD_LIST_IDS) {
  const list = answerWordsForLength(len, listIds);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Letters-only puzzle word, length 2–8, or empty if invalid.
 * @param {string} raw
 */
export function normalizePuzzleWord(raw) {
  const word = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  if (word.length < 2 || word.length > 8) return '';
  return word;
}
