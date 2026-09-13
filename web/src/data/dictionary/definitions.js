/**
 * Definitions via Free Dictionary API, with Datamuse (WordNet) fallback.
 * https://dictionaryapi.dev/ · https://www.datamuse.com/api/
 */

import {
  formatPronunciation,
  formatPronunciationLine,
  formatRespelling,
} from './respelling';

export { formatPronunciation, formatPronunciationLine, formatRespelling };

const cache = new Map();
const MAX_SENSES = 6;

const POS = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
};

/**
 * @typedef {{ partOfSpeech: string | null, definition: string, example: string | null }} WordSense
 * @typedef {{
 *   word: string,
 *   partOfSpeech: string | null,
 *   definition: string,
 *   example: string | null,
 *   pronunciation?: string | null,
 *   senses: WordSense[],
 * }} WordDefinition
 */

function skipDef(text) {
  return /^(a surname|obsolete|archaic)\b/i.test(text) || /\(obsolete\)|\(archaic\)/i.test(text);
}

/**
 * @param {WordSense[]} senses
 * @param {string} word
 * @param {string | null} [pronunciation]
 * @returns {WordDefinition | null}
 */
function packDefinition(senses, word, pronunciation = null) {
  const list = (senses || []).filter((s) => s?.definition);
  if (!list.length) return null;
  const first = list[0];
  return {
    word,
    partOfSpeech: first.partOfSpeech,
    definition: first.definition,
    example: first.example,
    pronunciation,
    senses: list.slice(0, MAX_SENSES),
  };
}

/**
 * @param {unknown} data
 * @param {string} key
 * @returns {WordDefinition | null}
 */
function fromDatamuse(data, key) {
  const rows = Array.isArray(data) ? data : [];
  const hit =
    rows.find((row) => String(row?.word || '').toLowerCase() === key) || rows[0];
  const defs = Array.isArray(hit?.defs) ? hit.defs : [];
  const senses = [];
  for (const raw of defs) {
    const text = String(raw || '');
    const tab = text.indexOf('\t');
    const posCode = tab >= 0 ? text.slice(0, tab).trim() : '';
    const definition = (tab >= 0 ? text.slice(tab + 1) : text).trim();
    if (!definition || skipDef(definition)) continue;
    senses.push({
      partOfSpeech: POS[posCode] || posCode || null,
      definition,
      example: null,
    });
    if (senses.length >= MAX_SENSES) break;
  }
  return packDefinition(senses, hit?.word || key);
}

/**
 * @param {unknown} data
 * @returns {string | null}
 */
function phoneticFromFreeDictionary(data) {
  const entry = Array.isArray(data) ? data[0] : null;
  const direct = String(entry?.phonetic || '').trim();
  if (direct) return direct;
  const rows = Array.isArray(entry?.phonetics) ? entry.phonetics : [];
  for (const row of rows) {
    const text = String(row?.text || '').trim();
    if (text) return text;
  }
  return null;
}

/**
 * @param {unknown} data
 * @param {string} key
 * @returns {WordDefinition | null}
 */
function fromFreeDictionary(data, key) {
  const entry = Array.isArray(data) ? data[0] : null;
  const meanings = entry?.meanings || [];
  const senses = [];
  for (const meaning of meanings) {
    const defs = Array.isArray(meaning?.definitions) ? meaning.definitions : [];
    for (const def of defs) {
      if (!def?.definition || skipDef(def.definition)) continue;
      senses.push({
        partOfSpeech: meaning.partOfSpeech || null,
        definition: def.definition,
        example: def.example || null,
      });
      if (senses.length >= MAX_SENSES) break;
    }
    if (senses.length >= MAX_SENSES) break;
  }
  return packDefinition(
    senses,
    entry?.word || key,
    phoneticFromFreeDictionary(data),
  );
}

const pronunciationCache = new Map();

/**
 * Pronunciation string when Free Dictionary has one (often IPA).
 * @param {string} word
 * @returns {Promise<string | null>}
 */
export async function fetchPronunciation(word) {
  const key = String(word || '').toLowerCase();
  if (!key) return null;
  if (pronunciationCache.has(key)) return pronunciationCache.get(key);
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,
    );
    if (!res.ok) {
      pronunciationCache.set(key, null);
      return null;
    }
    const text = phoneticFromFreeDictionary(await res.json());
    pronunciationCache.set(key, text);
    return text;
  } catch {
    pronunciationCache.set(key, null);
    return null;
  }
}

/**
 * All kid-readable senses for a word (primary first).
 * Prefers Free Dictionary for multiple everyday meanings.
 * @param {string} word
 * @returns {Promise<WordDefinition | null>}
 */
export async function fetchDefinition(word) {
  const key = word.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,
    );
    if (res.ok) {
      const parsed = fromFreeDictionary(await res.json(), key);
      if (parsed) {
        cache.set(key, parsed);
        return parsed;
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const datamuse = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(key)}&md=d&max=1`,
    );
    if (datamuse.ok) {
      const parsed = fromDatamuse(await datamuse.json(), key);
      if (parsed) {
        cache.set(key, parsed);
        return parsed;
      }
    }
  } catch {
    /* fall through */
  }

  cache.set(key, null);
  return null;
}
