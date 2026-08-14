/**
 * Definitions via Datamuse (WordNet + Wiktionary), with Free Dictionary API fallback.
 * https://www.datamuse.com/api/
 */

const cache = new Map();

const POS = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
};

/**
 * @typedef {{ word: string, partOfSpeech: string | null, definition: string, example: string | null, pronunciation?: string | null }} WordDefinition
 */

function skipDef(text) {
  return /^(a surname|obsolete|archaic)\b/i.test(text) || /\(obsolete\)|\(archaic\)/i.test(text);
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
  for (const raw of defs) {
    const text = String(raw || '');
    const tab = text.indexOf('\t');
    const posCode = tab >= 0 ? text.slice(0, tab).trim() : '';
    const definition = (tab >= 0 ? text.slice(tab + 1) : text).trim();
    if (!definition || skipDef(definition)) continue;
    return {
      word: hit.word || key,
      partOfSpeech: POS[posCode] || posCode || null,
      definition,
      example: null,
    };
  }
  return null;
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

function fromFreeDictionary(data, key) {
  const entry = Array.isArray(data) ? data[0] : null;
  const meanings = entry?.meanings || [];
  for (const meaning of meanings) {
    const def = meaning.definitions?.[0];
    if (!def?.definition) continue;
    return {
      word: entry.word || key,
      partOfSpeech: meaning.partOfSpeech || null,
      definition: def.definition,
      example: def.example || null,
      pronunciation: phoneticFromFreeDictionary(data),
    };
  }
  return null;
}

const pronunciationCache = new Map();

/**
 * Dictionary.com-style pronunciation string when Free Dictionary has one.
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
 * @param {string} word
 * @returns {Promise<WordDefinition | null>}
 */
export async function fetchDefinition(word) {
  const key = word.toLowerCase();
  if (cache.has(key)) return cache.get(key);

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

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,
    );
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const parsed = fromFreeDictionary(await res.json(), key);
    cache.set(key, parsed);
    return parsed;
  } catch {
    cache.set(key, null);
    return null;
  }
}
