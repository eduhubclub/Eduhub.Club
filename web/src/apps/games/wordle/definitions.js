/**
 * Kid-friendly definitions via Free Dictionary API.
 * https://dictionaryapi.dev/
 */

const cache = new Map();

/**
 * @typedef {{ word: string, partOfSpeech: string | null, definition: string, example: string | null }} WordDefinition
 */

/**
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
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    const meanings = entry?.meanings || [];
    let best = null;
    for (const meaning of meanings) {
      const def = meaning.definitions?.[0];
      if (!def?.definition) continue;
      best = {
        word: entry.word || key,
        partOfSpeech: meaning.partOfSpeech || null,
        definition: def.definition,
        example: def.example || null,
      };
      break;
    }
    cache.set(key, best);
    return best;
  } catch {
    cache.set(key, null);
    return null;
  }
}
