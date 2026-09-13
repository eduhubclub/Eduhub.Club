import {
  isBlockedDefinition,
  isBlockedWord,
  normalizeAgeLevel,
  readDictionaryAge,
} from './ageFilter';
import { fetchDefinition, fetchPronunciation } from './definitions';
import { fetchWordImage } from './images';

const STORAGE_KEY = 'eduHub.dictionary.wordOfTheDay';
const MAX_TRIES = 3;

/** Concrete, picture-friendly classroom words — K–2. */
const K2 = [
  'apple',
  'ball',
  'bear',
  'bird',
  'boat',
  'book',
  'bread',
  'camel',
  'candle',
  'carrot',
  'castle',
  'chair',
  'cloud',
  'crab',
  'drum',
  'duck',
  'eagle',
  'farm',
  'feather',
  'fish',
  'flag',
  'flower',
  'forest',
  'frog',
  'garden',
  'goat',
  'grape',
  'horse',
  'house',
  'island',
  'kite',
  'lake',
  'leaf',
  'lemon',
  'lion',
  'moon',
  'mouse',
  'nest',
  'ocean',
  'owl',
  'panda',
  'peach',
  'piano',
  'pumpkin',
  'rabbit',
  'rain',
  'river',
  'rocket',
  'seed',
  'sheep',
  'snail',
  'snow',
  'star',
  'sun',
  'tiger',
  'train',
  'tree',
  'turtle',
  'volcano',
  'whale',
  'zebra',
];

/** 3–5 — still concrete, a bit richer. */
const K5 = [
  'anchor',
  'cactus',
  'canyon',
  'compass',
  'coral',
  'desert',
  'eclipse',
  'fossil',
  'glacier',
  'harvest',
  'iceberg',
  'jungle',
  'lantern',
  'magnet',
  'meadow',
  'mosaic',
  'orchard',
  'planet',
  'prairie',
  'rainbow',
  'reef',
  'satellite',
  'squirrel',
  'thunder',
  'valley',
  'waterfall',
];

/** 6–8 and unrestricted — still visual, more ambitious vocabulary. */
const MIDDLE = [
  'aurora',
  'cathedral',
  'constellation',
  'delta',
  'equator',
  'geyser',
  'habitat',
  'hibernate',
  'labyrinth',
  'migrate',
  'monsoon',
  'peninsula',
  'quartz',
  'reservoir',
  'silhouette',
  'telescope',
  'tributary',
];

function poolFor(ageId) {
  if (ageId === 'k2') return K2;
  if (ageId === 'k5') return [...K5, ...K2];
  return [...MIDDLE, ...K5, ...K2];
}

function hashKey(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Local calendar day as YYYY-MM-DD.
 * @param {Date} [date]
 */
export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {string} iso
 */
export function formatWordOfTheDayDate(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Age-filtered candidates for a day, starting at the hashed index.
 * @param {string} dateKey
 * @param {string} [ageId]
 */
export function pickWordCandidates(dateKey, ageId = readDictionaryAge()) {
  const age = normalizeAgeLevel(ageId);
  const pool = poolFor(age).filter((word) => !isBlockedWord(word, age));
  if (!pool.length) return [];
  const start = hashKey(`${dateKey}:${age}`) % pool.length;
  return pool.slice(start).concat(pool.slice(0, start));
}

export function pickWordOfTheDay(dateKey, ageId = readDictionaryAge()) {
  return pickWordCandidates(dateKey, ageId)[0] || null;
}

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return raw && typeof raw === 'object' ? raw : null;
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore quota */
  }
  return entry;
}

/**
 * @typedef {{
 *   date: string,
 *   ageId: string,
 *   word: string,
 *   definition: import('./definitions.js').WordDefinition,
 *   pronunciation: string | null,
 *   image: import('./images.js').DictionaryImage | null,
 * }} WordOfTheDay
 */

/**
 * Cached daily word + definition + picture for the class age band.
 * OfTheDay may pass `forcedWord` after a teacher reshuffle.
 * @param {{ dateKey?: string, ageId?: string, forcedWord?: string }} [opts]
 * @returns {Promise<WordOfTheDay | null>}
 */
export async function loadWordOfTheDay(opts = {}) {
  const date = opts.dateKey || localDateKey();
  const ageId = normalizeAgeLevel(opts.ageId || readDictionaryAge());
  const forced = String(opts.forcedWord || '').trim().toLowerCase();
  const cached = readCache();
  if (
    !forced &&
    cached?.date === date &&
    cached?.ageId === ageId &&
    cached?.word &&
    cached?.definition &&
    !isBlockedWord(cached.word, ageId)
  ) {
    return cached;
  }

  let candidates = pickWordCandidates(date, ageId);
  if (forced) {
    candidates = [forced, ...candidates.filter((w) => w !== forced)];
  }
  let fallback = null;

  for (const word of candidates.slice(0, forced ? MAX_TRIES + 1 : MAX_TRIES)) {
    const [def, pic, pronunciation] = await Promise.all([
      fetchDefinition(word),
      fetchWordImage(word),
      fetchPronunciation(word),
    ]);
    if (!def) continue;
    if (isBlockedDefinition(def.definition, ageId) || isBlockedDefinition(def.example, ageId)) {
      continue;
    }
    const entry = {
      date,
      ageId,
      word,
      definition: def,
      pronunciation: pronunciation || def.pronunciation || null,
      image: pic,
    };
    if (pic) return writeCache(entry);
    if (!fallback) fallback = entry;
  }

  return fallback ? writeCache(fallback) : null;
}
