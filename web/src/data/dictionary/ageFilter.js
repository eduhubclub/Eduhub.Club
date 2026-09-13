import { normalizeLookup } from './spellingBank';

export const DICTIONARY_AGE_EVENT = 'eduHub.dictionary.ageFilter';
const STORAGE_KEY = 'eduHub.dictionary.ageFilter';

export const DICTIONARY_AGE_LEVELS = [
  {
    id: 'k2',
    label: 'K–2',
    description: 'Strictest. Hides adult, violent, and drug-related words.',
  },
  {
    id: 'k5',
    label: '3–5',
    description: 'Elementary. Hides sexual, graphic, and drug-related words.',
  },
  {
    id: 'middle',
    label: '6–8',
    description: 'Middle school. Hides explicit sexual terms and slurs.',
  },
  {
    id: 'all',
    label: 'Unrestricted',
    description: 'No extra filter. Use only when an adult is guiding lookup.',
  },
];

export const DEFAULT_DICTIONARY_AGE = 'k2';

/** Always hidden except Unrestricted. */
const ALWAYS = [
  'anal',
  'blowjob',
  'bondage',
  'cock',
  'cocks',
  'cunnilingus',
  'dildo',
  'ejaculate',
  'erotic',
  'erotica',
  'fuck',
  'fucked',
  'fucker',
  'fucking',
  'handjob',
  'hentai',
  'horny',
  'incest',
  'masturbate',
  'masturbation',
  'nsfw',
  'orgasm',
  'orgy',
  'porn',
  'porno',
  'pornography',
  'rape',
  'raped',
  'raping',
  'whore',
  'xxx',
];

/** Hidden for K–8 (not Unrestricted). */
const SCHOOL = [
  'hooker',
  'nude',
  'nudes',
  'nudity',
  'slut',
];

/** Hidden through 5th grade. */
const ELEMENTARY = [
  'anus',
  'boob',
  'boobs',
  'clitoris',
  'condom',
  'intercourse',
  'naked',
  'penis',
  'semen',
  'sex',
  'sexual',
  'sexuality',
  'sexy',
  'sperm',
  'testicle',
  'testicles',
  'vagina',
  'vulva',
];

/** Extra caution for K–2. */
const EARLY = [
  'alcohol',
  'beer',
  'bloody',
  'cigarette',
  'cocaine',
  'damn',
  'gun',
  'guns',
  'hell',
  'heroin',
  'kill',
  'killed',
  'killing',
  'marijuana',
  'meth',
  'murder',
  'murdered',
  'pills',
  'tobacco',
  'vodka',
  'weed',
  'wine',
];

const ADULT_DEF =
  /\b(sexual intercourse|sexual activity|pornograph|erotic|genitals?|ejaculat|masturbat|orgasm)\b/i;

const ADULT_IMAGE =
  /\b(sex|sexe|sexual|erotic|nude|naked|porn|nsfw|intercourse|genital|penis|vagina)\b/i;

function listForLevel(levelId) {
  if (levelId === 'all') return new Set();
  const words = [...ALWAYS, ...SCHOOL];
  if (levelId === 'k2' || levelId === 'k5') words.push(...ELEMENTARY);
  if (levelId === 'k2') words.push(...EARLY);
  return new Set(words);
}

export function normalizeAgeLevel(id) {
  return DICTIONARY_AGE_LEVELS.some((level) => level.id === id)
    ? id
    : DEFAULT_DICTIONARY_AGE;
}

export function readDictionaryAge() {
  try {
    return normalizeAgeLevel(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_DICTIONARY_AGE;
  }
}

export function writeDictionaryAge(id) {
  const next = normalizeAgeLevel(id);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(DICTIONARY_AGE_EVENT, { detail: { id: next } }));
  return next;
}

export const DICTIONARY_FLAGS_EVENT = 'eduHub.dictionary.flaggedWords';
const FLAGS_KEY = 'eduHub.dictionary.flaggedWords';
const MAX_FLAGS = 200;

export function readFlaggedWords() {
  try {
    const raw = JSON.parse(localStorage.getItem(FLAGS_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map((word) => normalizeLookup(word)).filter(Boolean))].sort();
  } catch {
    return [];
  }
}

function writeFlaggedWords(words) {
  const next = [...new Set((words || []).map((word) => normalizeLookup(word)).filter(Boolean))]
    .sort()
    .slice(0, MAX_FLAGS);
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DICTIONARY_FLAGS_EVENT, { detail: { words: next } }));
  }
  return next;
}

export function isTeacherFlagged(raw) {
  const word = normalizeLookup(raw);
  return Boolean(word) && readFlaggedWords().includes(word);
}

export function flagWord(raw) {
  const word = normalizeLookup(raw);
  if (!word) return readFlaggedWords();
  const current = readFlaggedWords();
  if (current.includes(word)) return current;
  return writeFlaggedWords([...current, word]);
}

export function unflagWord(raw) {
  const word = normalizeLookup(raw);
  return writeFlaggedWords(readFlaggedWords().filter((item) => item !== word));
}

/**
 * Built-in list only — not teacher flags.
 * @param {string} raw
 * @param {string} [levelId]
 */
export function isBuiltInBlocked(raw, levelId = readDictionaryAge()) {
  const level = normalizeAgeLevel(levelId);
  if (level === 'all') return false;
  const word = normalizeLookup(raw);
  if (!word) return false;
  return listForLevel(level).has(word);
}

/**
 * @param {string} raw
 * @param {string} [levelId]
 */
export function isBlockedWord(raw, levelId = readDictionaryAge()) {
  const level = normalizeAgeLevel(levelId);
  const word = normalizeLookup(raw);
  if (!word) return false;
  if (level !== 'all' && isTeacherFlagged(word)) return true;
  return isBuiltInBlocked(word, level);
}

/**
 * Block if the definition itself is adult for this age band.
 * @param {string | null | undefined} text
 * @param {string} [levelId]
 */
export function isBlockedDefinition(text, levelId = readDictionaryAge()) {
  const level = normalizeAgeLevel(levelId);
  if (level === 'all' || level === 'middle') return false;
  return ADULT_DEF.test(String(text || ''));
}

/**
 * Drop adult senses; keep kid-safe ones. Null if none remain.
 * @param {import('./definitions.js').WordDefinition | null | undefined} def
 * @param {string} [levelId]
 */
export function filterDefinitionForAge(def, levelId = readDictionaryAge()) {
  if (!def) return null;
  const raw =
    Array.isArray(def.senses) && def.senses.length
      ? def.senses
      : [
          {
            partOfSpeech: def.partOfSpeech,
            definition: def.definition,
            example: def.example,
          },
        ];
  const senses = raw.filter(
    (sense) =>
      sense?.definition &&
      !isBlockedDefinition(sense.definition, levelId) &&
      !isBlockedDefinition(sense.example, levelId),
  );
  if (!senses.length) return null;
  const first = senses[0];
  return {
    ...def,
    partOfSpeech: first.partOfSpeech,
    definition: first.definition,
    example: first.example,
    senses,
  };
}

/**
 * @param {string[]} words
 * @param {string} [levelId]
 */
export function filterBlockedWords(words, levelId = readDictionaryAge()) {
  return (words || []).filter((word) => !isBlockedWord(word, levelId));
}

/**
 * Skip pictures whose title/tags are adult, even if the lookup word itself is allowed.
 * @param {string | null | undefined} title
 * @param {string} [extra]
 */
export function imageLooksAdult(title, extra = '') {
  return ADULT_IMAGE.test(`${title || ''} ${extra || ''}`);
}
