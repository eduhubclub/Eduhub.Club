import {
  pickWordCandidates,
  loadWordOfTheDay,
} from '../dictionary/wordOfTheDay';

/**
 * @param {string} dateKey
 */
export function pickWordIdForDate(dateKey) {
  const word = pickWordCandidates(dateKey)[0];
  return word ? `word:${word}` : null;
}

/**
 * @param {string} dateKey
 * @param {string} [currentId]
 */
export function reshuffleWordId(dateKey, currentId) {
  const current = String(currentId || '').replace(/^word:/, '');
  const pool = pickWordCandidates(dateKey);
  if (!pool.length) return currentId || pickWordIdForDate(dateKey);
  const idx = Math.max(0, pool.indexOf(current));
  const next = pool[(idx + 1) % pool.length];
  return next ? `word:${next}` : currentId;
}

function wordFromId(wordId) {
  const raw = String(wordId || '');
  return raw.startsWith('word:') ? raw.slice(5) : raw;
}

/**
 * Dictionary-backed Word of the Day item for OfTheDay cards.
 * Honors a stored `word:apple` pick when provided.
 *
 * @param {{ dateKey: string, wordId?: string | null }} opts
 */
export async function loadOfTheDayWord(opts) {
  const dateKey = opts.dateKey;
  const forced = wordFromId(opts.wordId);
  const entry = await loadWordOfTheDay({
    dateKey,
    forcedWord: forced || undefined,
  });
  if (!entry?.word) {
    return {
      id: opts.wordId || pickWordIdForDate(dateKey),
      type: 'word',
      title: 'Word of the Day',
      body: 'Today’s word isn’t available right now.',
      source: 'Edu.Dictionary',
    };
  }
  const pos = entry.definition?.partOfSpeech;
  const def = entry.definition?.definition || '';
  const body = [pos ? `(${pos})` : '', def].filter(Boolean).join(' ');
  return {
    id: `word:${entry.word}`,
    type: 'word',
    title: entry.word,
    body,
    imageSrc: entry.image?.thumb || '',
    imageAttribution: entry.image?.license || '',
    source: 'Edu.Dictionary',
  };
}
