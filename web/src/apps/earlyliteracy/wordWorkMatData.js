/**
 * Grapheme banks for Edu.EarlyLiteracy Word Work Mat.
 * Beginner ≈ Alphabet / Alphabet Review (through lesson 43).
 * Intermediate ≈ Digraphs unit and beyond (lesson 44+).
 */

/** @typedef {'consonant' | 'vowel' | 'digraph' | 'rcontrolled' | 'vowelteam' | 'other'} MatTileKind */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

/** @param {string} g */
export function kindForLetter(g) {
  return VOWELS.has(g) ? 'vowel' : 'consonant';
}

/**
 * @typedef {{ id: string, label: string, kind: MatTileKind, graphemes: string[] }} MatSection
 */

/** @type {MatSection[]} */
export const BEGINNER_SECTIONS = [
  {
    id: 'letters',
    label: 'Consonants & vowels',
    kind: 'consonant',
    graphemes: [
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
    ],
  },
];

/** @type {MatSection[]} */
export const INTERMEDIATE_SECTIONS = [
  {
    id: 'digraphs',
    label: 'Consonant digraphs',
    kind: 'digraph',
    graphemes: ['ch', 'sh', 'th', 'wh', 'ph', 'ck'],
  },
  {
    id: 'rcontrolled',
    label: 'R-controlled vowels',
    kind: 'rcontrolled',
    graphemes: ['ar', 'er', 'ir', 'or', 'ur', 'ore'],
  },
  {
    id: 'vowelteams',
    label: 'Vowel teams',
    kind: 'vowelteam',
    graphemes: [
      'ai',
      'ay',
      'ee',
      'ea',
      'ey',
      'oa',
      'ow',
      'oe',
      'ie',
      'igh',
      'oo',
      'ew',
      'ue',
      'ui',
      'au',
      'aw',
      'oi',
      'oy',
      'ou',
    ],
  },
  {
    id: 'other',
    label: 'Other',
    kind: 'other',
    graphemes: [
      'kn',
      'wr',
      'mb',
      'ng',
      'nk',
      'ff',
      'll',
      'ss',
      'zz',
      'dge',
      'tch',
    ],
  },
  {
    id: 'letters',
    label: 'Consonants & vowels',
    kind: 'consonant',
    graphemes: [
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
    ],
  },
];

export const MAT_MODES = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
];

/** @param {'beginner' | 'intermediate'} mode */
export function sectionsForMode(mode) {
  return mode === 'intermediate' ? INTERMEDIATE_SECTIONS : BEGINNER_SECTIONS;
}

/**
 * Resolve display kind for a bank tile (vowels in the alphabet row are yellow).
 * @param {MatSection} section
 * @param {string} grapheme
 */
export function resolveTileKind(section, grapheme) {
  if (section.id === 'letters') return kindForLetter(grapheme);
  return section.kind;
}
