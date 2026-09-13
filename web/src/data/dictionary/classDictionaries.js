import { normalizeLookup } from './spellingBank';

export const CLASS_DICTIONARIES_EVENT = 'eduHub.dictionary.classDictionaries';
const STORAGE_KEY = 'eduHub.dictionary.classDictionaries';

/**
 * @typedef {{
 *   id: string,
 *   word: string,
 *   definition: string | null,
 *   partOfSpeech: string | null,
 *   pronunciation: string | null,
 *   note: string,
 *   addedBy: 'teacher' | 'student',
 *   addedAt: string,
 * }} DictionaryEntry
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   ownerType: 'class' | 'student',
 *   ownerId: string | null,
 *   words: DictionaryEntry[],
 * }} ClassDictionary
 */

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLASS_DICTIONARIES_EVENT));
  }
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {unknown} raw
 * @returns {DictionaryEntry | null}
 */
function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const word = normalizeLookup(raw.word);
  if (!word) return null;
  return {
    id: String(raw.id || newId('entry')),
    word,
    definition: raw.definition ? String(raw.definition) : null,
    partOfSpeech: raw.partOfSpeech ? String(raw.partOfSpeech) : null,
    pronunciation: raw.pronunciation ? String(raw.pronunciation) : null,
    note: String(raw.note || '').trim(),
    addedBy: raw.addedBy === 'student' ? 'student' : 'teacher',
    addedAt: String(raw.addedAt || new Date().toISOString()),
  };
}

/**
 * @param {unknown} raw
 * @returns {ClassDictionary | null}
 */
function normalizeDictionary(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const ownerType = raw.ownerType === 'student' ? 'student' : 'class';
  const words = (Array.isArray(raw.words) ? raw.words : [])
    .map(normalizeEntry)
    .filter(Boolean)
    .sort((a, b) => a.word.localeCompare(b.word));
  return {
    id: String(raw.id || newId('dict')),
    name: String(raw.name || (ownerType === 'class' ? 'Class dictionary' : 'My dictionary')).trim()
      || (ownerType === 'class' ? 'Class dictionary' : 'My dictionary'),
    ownerType,
    ownerId: raw.ownerId != null ? String(raw.ownerId) : null,
    words,
  };
}

/**
 * @param {string | null | undefined} classId
 * @returns {ClassDictionary[]}
 */
export function readClassDictionaries(classId) {
  if (!classId) return [];
  const all = readAll();
  const list = Array.isArray(all[String(classId)]) ? all[String(classId)] : [];
  return list.map(normalizeDictionary).filter(Boolean);
}

/**
 * @param {string} classId
 * @param {ClassDictionary[]} dictionaries
 */
export function writeClassDictionaries(classId, dictionaries) {
  if (!classId) return [];
  const all = readAll();
  all[String(classId)] = (dictionaries || []).map(normalizeDictionary).filter(Boolean);
  writeAll(all);
  return readClassDictionaries(classId);
}

/**
 * Ensure the shared class dictionary exists.
 * @param {string} classId
 * @param {string} [className]
 */
export function ensureClassDictionary(classId, className = 'Class') {
  const list = readClassDictionaries(classId);
  const existing = list.find((d) => d.ownerType === 'class' && !d.ownerId);
  if (existing) return existing;
  const next = {
    id: newId('dict'),
    name: `${className} dictionary`,
    ownerType: 'class',
    ownerId: null,
    words: [],
  };
  writeClassDictionaries(classId, [next, ...list]);
  return next;
}

/**
 * Ensure a student dictionary exists for this roster student.
 * @param {string} classId
 * @param {{ id: string, name?: string }} student
 */
export function ensureStudentDictionary(classId, student) {
  if (!classId || !student?.id) return null;
  const list = readClassDictionaries(classId);
  const existing = list.find(
    (d) => d.ownerType === 'student' && String(d.ownerId) === String(student.id),
  );
  if (existing) return existing;
  const next = {
    id: newId('dict'),
    name: `${student.name || 'Student'}’s dictionary`,
    ownerType: 'student',
    ownerId: String(student.id),
    words: [],
  };
  writeClassDictionaries(classId, [...list, next]);
  return next;
}

/**
 * Merge word inputs into one dictionary (new entry ids per dictionary).
 * @param {ClassDictionary} dict
 * @param {{ word: string, definition?: string | null, partOfSpeech?: string | null, pronunciation?: string | null, note?: string, addedBy?: 'teacher' | 'student' }[]} inputs
 * @param {string} now
 */
function mergeWordsIntoDictionary(dict, inputs, now) {
  const byWord = new Map(dict.words.map((entry) => [entry.word, entry]));
  for (const input of inputs) {
    const word = normalizeLookup(input?.word);
    if (!word) continue;
    byWord.set(
      word,
      normalizeEntry({
        id: byWord.get(word)?.id || newId('entry'),
        word,
        definition: input.definition ?? null,
        partOfSpeech: input.partOfSpeech ?? null,
        pronunciation: input.pronunciation ?? null,
        note: input.note || '',
        addedBy: input.addedBy === 'student' ? 'student' : 'teacher',
        addedAt: now,
      }),
    );
  }
  return {
    ...dict,
    words: [...byWord.values()].sort((a, b) => a.word.localeCompare(b.word)),
  };
}

/**
 * @param {string} classId
 * @param {string} dictionaryId
 * @param {{ word: string, definition?: string | null, partOfSpeech?: string | null, pronunciation?: string | null, note?: string, addedBy?: 'teacher' | 'student' }} input
 */
export function addDictionaryWord(classId, dictionaryId, input) {
  return addDictionaryWords(classId, dictionaryId, [input]);
}

/**
 * Add many words in one write. Later duplicates in the batch win.
 * Whole-class adds also copy into every student dictionary for that class.
 * @param {string} classId
 * @param {string} dictionaryId
 * @param {{ word: string, definition?: string | null, partOfSpeech?: string | null, pronunciation?: string | null, note?: string, addedBy?: 'teacher' | 'student' }[]} inputs
 */
export function addDictionaryWords(classId, dictionaryId, inputs) {
  if (!classId || !dictionaryId || !Array.isArray(inputs) || !inputs.length) {
    return readClassDictionaries(classId);
  }
  const list = readClassDictionaries(classId);
  const idx = list.findIndex((d) => d.id === dictionaryId);
  if (idx < 0) return list;
  const dict = list[idx];
  const now = new Date().toISOString();
  const targetIndexes = dict.ownerType === 'class' ? list.map((_, i) => i) : [idx];

  for (const i of targetIndexes) {
    list[i] = mergeWordsIntoDictionary(list[i], inputs, now);
  }
  return writeClassDictionaries(classId, list);
}

/**
 * @param {string} classId
 * @param {string} dictionaryId
 * @param {string} entryId
 */
export function removeDictionaryWord(classId, dictionaryId, entryId) {
  const list = readClassDictionaries(classId);
  const idx = list.findIndex((d) => d.id === dictionaryId);
  if (idx < 0) return list;
  list[idx] = {
    ...list[idx],
    words: list[idx].words.filter((entry) => entry.id !== entryId),
  };
  return writeClassDictionaries(classId, list);
}
