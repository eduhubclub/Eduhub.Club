/**
 * LETRS Basic (K–2) and Advanced (3–5) spelling items.
 * Sentences are what the recorded voices say. Feature cells match the
 * scoring grids from the Letrs Screener (word correct + pattern rows).
 */

function wordRow(count) {
  return {
    name: 'Word Correct',
    max: count,
    cells: Array.from({ length: count }, (_, i) => ({
      w: i,
      label: '✓',
      kind: 'word',
    })),
  };
}

export const BASIC_WORDS = [
  { word: 'mud', sentence: "Don't step in the mud." },
  { word: 'nap', sentence: "I like to nap when I'm tired." },
  { word: 'set', sentence: 'The sun will set in the west.' },
  { word: 'fog', sentence: "It's hard to see in thick fog." },
  { word: 'rib', sentence: 'The football player broke his rib.' },
  { word: 'life', sentence: 'Remember to enjoy life every day.' },
  { word: 'shack', sentence: 'A shack is a small house.' },
  { word: 'stone', sentence: 'Stone walls last a long time.' },
  { word: 'trunk', sentence: 'I keep all my toys in a trunk.' },
  { word: 'goat', sentence: 'A goat is a useful farm animal.' },
  { word: 'scrape', sentence: 'Did you scrape your knee when you fell down?' },
  { word: 'beat', sentence: 'Keep the beat when you clap to music.' },
  { word: 'champ', sentence: 'The World Series winner was the champ.' },
  { word: 'third', sentence: 'Third place is behind first and second.' },
  { word: 'drain', sentence: 'Water goes down a drain.' },
  { word: 'bridges', sentence: 'Two bridges go over the canyon.' },
  { word: 'crutch', sentence: 'If you are hurt, you can use a crutch to walk.' },
  { word: 'growing', sentence: 'We are growing carrots in our garden.' },
  { word: 'walked', sentence: 'I walked slowly to school.' },
  { word: 'born', sentence: 'The kittens were born yesterday.' },
  { word: 'spoil', sentence: "Don't let the rain spoil the trip." },
  { word: 'smiling', sentence: 'Smiling is easy if you are having fun.' },
  { word: 'slipping', sentence: 'Our feet were slipping on the ice.' },
  { word: 'shouting', sentence: 'My voice was tired from shouting.' },
  { word: 'higher', sentence: 'Eagles fly higher than most small birds.' },
];

export const ADVANCED_WORDS = [
  { word: 'cap', sentence: 'My cap fits me perfectly.' },
  { word: 'chip', sentence: 'It is hard to eat just one potato chip.' },
  { word: 'shut', sentence: 'Please shut the window.' },
  { word: 'tent', sentence: 'I love sleeping in a cozy tent.' },
  { word: 'grain', sentence: 'I eat whole grain bread for breakfast.' },
  { word: 'broke', sentence: 'My brother broke my phone.' },
  { word: 'slice', sentence: 'Please give me one slice of apple.' },
  { word: 'trudge', sentence: "I'll trudge to school with my heavy pack." },
  { word: 'flight', sentence: 'My flight home was delayed.' },
  { word: 'dropping', sentence: 'Dropping eggs is messy.' },
  { word: 'gnaw', sentence: 'The squirrel will gnaw on nuts.' },
  { word: 'curved', sentence: 'A bow is a curved hunting weapon.' },
  { word: 'fewer', sentence: 'We had fewer rainstorms this year.' },
  { word: 'babies', sentence: 'My rabbit had five babies.' },
  { word: 'matched', sentence: 'Her sweater matched the color of her eyes.' },
  { word: 'known', sentence: 'I wish I had known about the party.' },
  { word: 'pattern', sentence: 'If you sew a costume, follow a pattern.' },
  { word: 'staples', sentence: 'We will need staples for the stapler.' },
  { word: 'radar', sentence: 'Airports track planes by radar.' },
  { word: 'except', sentence: 'I like all vegetables except broccoli.' },
  { word: 'treasure', sentence: 'The sunken ship still contained a treasure chest.' },
  { word: 'organization', sentence: 'Would you like to join our organization?' },
  { word: 'questionable', sentence: 'The results of the test were questionable.' },
  { word: 'obedient', sentence: 'An obedient dog follows commands.' },
  { word: 'resident', sentence: 'A new resident came to live in our neighborhood.' },
];

export const BASIC_FEATURES = [
  wordRow(BASIC_WORDS.length),
  {
    name: 'Initial Consonant',
    max: 9,
    cells: [
      { w: 0, label: 'm', re: /^m/i },
      { w: 1, label: 'n', re: /^n/i },
      { w: 2, label: 's', re: /^s/i },
      { w: 3, label: 'f', re: /^f/i },
      { w: 4, label: 'r', re: /^r/i },
      { w: 5, label: 'l', re: /^l/i },
      { w: 9, label: 'g', re: /^g/i },
      { w: 18, label: 'w', re: /^w/i },
      { w: 24, label: 'h', re: /^h/i },
    ],
  },
  {
    name: 'Final Consonant',
    max: 7,
    cells: [
      { w: 0, label: 'd', re: /d$/i },
      { w: 1, label: 'p', re: /p$/i },
      { w: 2, label: 't', re: /t$/i },
      { w: 3, label: 'g', re: /g$/i },
      { w: 4, label: 'b', re: /b$/i },
      { w: 5, label: 'f', re: /f/i },
      { w: 6, label: 'ck', re: /ck/i },
    ],
  },
  {
    name: 'Digraph, Trigraph',
    max: 6,
    cells: [
      { w: 6, label: 'sh', re: /^sh/i },
      { w: 12, label: 'ch', re: /^ch/i },
      { w: 13, label: 'th', re: /^th/i },
      { w: 15, label: 'dge', re: /dge/i },
      { w: 16, label: 'tch', re: /tch/i },
      { w: 23, label: 'sh', re: /^sh/i },
    ],
  },
  {
    name: 'Blend',
    max: 12,
    cells: [
      { w: 7, label: 'st', re: /^st/i },
      { w: 8, label: 'tr', re: /^tr/i },
      { w: 8, label: 'nk', re: /nk/i },
      { w: 10, label: 'scr', re: /^scr/i },
      { w: 12, label: 'mp', re: /mp/i },
      { w: 14, label: 'dr', re: /^dr/i },
      { w: 15, label: 'br', re: /^br/i },
      { w: 16, label: 'cr', re: /^cr/i },
      { w: 17, label: 'gr', re: /^gr/i },
      { w: 20, label: 'sp', re: /^sp/i },
      { w: 21, label: 'sm', re: /^sm/i },
      { w: 22, label: 'sl', re: /^sl/i },
    ],
  },
  {
    name: 'Short Vowel',
    max: 5,
    cells: [
      { w: 0, label: 'u', re: /u/i },
      { w: 1, label: 'a', re: /a/i },
      { w: 2, label: 'e', re: /e/i },
      { w: 3, label: 'o', re: /o/i },
      { w: 4, label: 'i', re: /i/i },
    ],
  },
  {
    name: 'Long Vowel VCe',
    max: 3,
    cells: [
      { w: 5, label: 'i_e', re: /i.*e$/i },
      { w: 7, label: 'o_e', re: /o.*e$/i },
      { w: 10, label: 'a_e', re: /a.*e$/i },
    ],
  },
  {
    name: 'Vowel Team/ Diphthong',
    max: 8,
    cells: [
      { w: 9, label: 'oa', re: /oa/i },
      { w: 11, label: 'ea', re: /ea/i },
      { w: 14, label: 'ai', re: /ai/i },
      { w: 17, label: 'ow', re: /ow/i },
      { w: 18, label: 'al', re: /al/i },
      { w: 20, label: 'oi', re: /oi/i },
      { w: 23, label: 'ou', re: /ou/i },
      { w: 24, label: 'igh', re: /igh/i },
    ],
  },
  {
    name: 'Vowel-r',
    max: 2,
    cells: [
      { w: 13, label: 'ir', re: /ir/i },
      { w: 19, label: 'or', re: /or/i },
    ],
  },
  {
    name: 'Inflections',
    max: 7,
    cells: [
      { w: 15, label: 's', re: /s$/i },
      { w: 17, label: 'ing', re: /ing$/i },
      { w: 18, label: 'ed', re: /ed$/i },
      { w: 21, label: 'ling', re: /ling$/i },
      { w: 22, label: 'pping', re: /pping$/i },
      { w: 23, label: 'ting', re: /ting$/i },
      { w: 24, label: 'er', re: /er$/i },
    ],
  },
];

export const ADVANCED_FEATURES = [
  wordRow(ADVANCED_WORDS.length),
  {
    name: 'Short Vowel',
    max: 5,
    cells: [
      { w: 0, label: 'a', re: /a/i },
      { w: 1, label: 'i', re: /i/i },
      { w: 2, label: 'u', re: /u/i },
      { w: 3, label: 'e', re: /e/i },
      { w: 9, label: 'o', re: /o/i },
    ],
  },
  {
    name: 'Blend',
    max: 10,
    cells: [
      { w: 3, label: 'nt', re: /nt/i },
      { w: 4, label: 'gr', re: /^gr/i },
      { w: 5, label: 'br', re: /^br/i },
      { w: 6, label: 'sl', re: /^sl/i },
      { w: 7, label: 'tr', re: /^tr/i },
      { w: 8, label: 'fl', re: /^fl/i },
      { w: 9, label: 'dr', re: /^dr/i },
      { w: 17, label: 'st', re: /^st/i },
      { w: 19, label: 'pt', re: /pt/i },
      { w: 20, label: 'tr', re: /^tr/i },
    ],
  },
  {
    name: 'Digraph, Trigraph',
    max: 4,
    cells: [
      { w: 1, label: 'ch', re: /^ch/i },
      { w: 2, label: 'sh', re: /^sh/i },
      { w: 7, label: 'dge', re: /dge/i },
      { w: 14, label: 'tch', re: /tch/i },
    ],
  },
  {
    name: 'Long Vowel',
    max: 5,
    cells: [
      { w: 4, label: 'ai', re: /ai/i },
      { w: 5, label: 'o_e', re: /o.*e$/i },
      { w: 6, label: 'i_e', re: /i.*e$/i },
      { w: 8, label: 'igh', re: /igh/i },
      { w: 15, label: 'ow', re: /ow/i },
    ],
  },
  {
    name: 'Other Vowel',
    max: 7,
    cells: [
      { w: 10, label: 'aw', re: /aw/i },
      { w: 11, label: 'ur', re: /ur/i },
      { w: 12, label: 'ew', re: /ew/i },
      { w: 16, label: 'er', re: /er/i },
      { w: 18, label: 'ar', re: /ar/i },
      { w: 20, label: 'ea', re: /ea/i },
      { w: 21, label: 'or', re: /^or/i },
    ],
  },
  {
    name: 'Complex Consonant',
    max: 3,
    cells: [
      { w: 6, label: 'c(e)', re: /ce$/i },
      { w: 10, label: 'gn', re: /^gn/i },
      { w: 15, label: 'kn', re: /^kn/i },
    ],
  },
  {
    name: 'Inflection',
    max: 6,
    cells: [
      { w: 9, label: 'ing', re: /ing$/i },
      { w: 11, label: 'ed', re: /ed$/i },
      { w: 12, label: 'er', re: /er$/i },
      { w: 13, label: 'es', re: /(?:ies|es)$/i },
      { w: 14, label: 'ed', re: /ed$/i },
      { w: 17, label: 's', re: /s$/i },
    ],
  },
  {
    name: 'Syllable Juncture',
    max: 5,
    cells: [
      { w: 9, label: 'pp', re: /pp/i },
      { w: 13, label: 'b', re: /bab/i },
      { w: 16, label: 'tt', re: /tt/i },
      { w: 17, label: 'p', re: /stap/i },
      { w: 18, label: 'd', re: /rad/i },
    ],
  },
  {
    name: 'Unaccented Syllable',
    max: 4,
    cells: [
      { w: 17, label: 'ple', re: /ple|ples/i },
      { w: 19, label: 'ex', re: /^ex/i },
      { w: 20, label: 'sure', re: /sure/i },
      { w: 23, label: 'i', re: /edi|odi|idi/i },
    ],
  },
  {
    name: 'Derivational Suffix',
    max: 4,
    cells: [
      { w: 21, label: 'tion', re: /tion$/i },
      { w: 22, label: 'able', re: /able$/i },
      { w: 23, label: 'ent', re: /ent$/i },
      { w: 24, label: 'ent', re: /ent$/i },
    ],
  },
  {
    name: 'Root or Base Word',
    max: 4,
    cells: [
      { w: 21, label: 'organiz(e)', re: /organiz/i },
      { w: 22, label: 'question', re: /question/i },
      { w: 23, label: 'obe(y)', re: /obe/i },
      { w: 24, label: 'resid(e)', re: /resid/i },
    ],
  },
];

export function wordsFor(level) {
  return level === 'advanced' ? ADVANCED_WORDS : BASIC_WORDS;
}

export function gridFor(level) {
  const advanced = level === 'advanced';
  const items = advanced ? ADVANCED_WORDS : BASIC_WORDS;
  return {
    words: items.map((item) => item.word),
    features: advanced ? ADVANCED_FEATURES : BASIC_FEATURES,
  };
}

export function levelLabel(level) {
  return level === 'advanced' ? 'Advanced (3–5)' : 'Basic (K–2)';
}
