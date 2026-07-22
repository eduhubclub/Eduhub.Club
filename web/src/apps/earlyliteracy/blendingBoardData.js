/**
 * Grapheme banks for Edu.EarlyLiteracy blending board.
 * Rows mirror the UFLI Virtual Blending Board letter-combination menu
 * (onset · vowel · coda · suffix), with All / None per row.
 */

/** @typedef {'onset' | 'vowel' | 'coda' | 'suffix'} ColumnId */
/** @typedef {'consonant' | 'coda' | 'vowel' | 'suffix'} TileKind */

/** @type {{ id: ColumnId, label: string, kind: TileKind, cols: number }[]} */
export const COLUMN_META = [
  { id: 'onset', label: 'Beginning', kind: 'consonant', cols: 8 },
  { id: 'vowel', label: 'Vowel', kind: 'vowel', cols: 3 },
  { id: 'coda', label: 'Ending', kind: 'coda', cols: 4 },
  { id: 'suffix', label: 'Suffix', kind: 'suffix', cols: 1 },
];

/**
 * Each row is one All/None band in the letter-combination menu.
 * @type {{ id: string, label: string, onset: string[], vowel: string[], coda: string[], suffix: string[] }[]}
 */
export const GRAPHEME_ROWS = [
  {
    id: 'basic',
    label: 'Letters',
    onset: [
      'b',
      'c',
      'd',
      'f',
      'g',
      'h',
      'j',
      'k',
      'l',
      'm',
      'n',
      'p',
      'r',
      's',
      't',
      'v',
      'w',
      'y',
      'z',
    ],
    vowel: ['a', 'e', 'i', 'o', 'u', 'y'],
    coda: ['b', 'd', 'g', 'k', 'm', 'n', 'p', 's', 't', 'x'],
    suffix: ['e'],
  },
  {
    id: 'digraphs',
    label: 'Digraphs & r-controlled',
    onset: ['ch', 'sh', 'th', 'ph', 'wh'],
    vowel: ['ar', 'er', 'ir', 'or', 'ur'],
    coda: ['c', 'f', 'l', 'r', 's', 'z', 'ff', 'll', 'ss', 'zz', 'v'],
    suffix: ['s', 'es'],
  },
  {
    id: 'blends',
    label: 'Blends & vowel teams',
    onset: [
      'sc',
      'sk',
      'sl',
      'sm',
      'sn',
      'sp',
      'st',
      'sw',
      'br',
      'cr',
      'dr',
      'fr',
      'gr',
      'pr',
      'tr',
      'bl',
      'cl',
      'fl',
      'gl',
      'pl',
      'tw',
    ],
    vowel: ['ai', 'ea', 'ee', 'ie', 'oa', 'oi', 'oo', 'ou', 'ow'],
    coda: [
      'ct',
      'ft',
      'lt',
      'nt',
      'pt',
      'st',
      'xt',
      'ld',
      'lf',
      'lp',
      'mp',
      'sp',
      'sk',
      'nch',
      'nd',
    ],
    suffix: [],
  },
  {
    id: 'complex',
    label: 'Complex patterns',
    onset: ['shr', 'thr', 'scr', 'spl', 'spr', 'squ', 'str'],
    vowel: ['au', 'aw', 'ei', 'eu', 'ew', 'ue', 'ui'],
    coda: ['ch', 'ph', 'sh', 'th', 'ck', 'ng'],
    suffix: [],
  },
  {
    id: 'advanced',
    label: 'Silent letters & more',
    onset: ['gn', 'kn', 'wr', 'qu'],
    vowel: ['aigh', 'augh', 'igh', 'eigh', 'ough', 'oe', 'ay', 'ey', 'oy'],
    coda: ['mb', 'nk', 'dge', 'tch'],
    suffix: [],
  },
];

/** Stable key for a grapheme in a column. */
export function graphemeKey(columnId, grapheme) {
  return `${columnId}:${grapheme}`;
}

/** Default selection — basic CVC set (matches UFLI default board). */
export function createDefaultSelectedKeys() {
  const keys = new Set();
  const row = GRAPHEME_ROWS[0];
  for (const col of COLUMN_META) {
    for (const g of row[col.id]) {
      keys.add(graphemeKey(col.id, g));
    }
  }
  return keys;
}

/** Flatten every grapheme key in the catalog. */
export function allGraphemeKeys() {
  const keys = [];
  for (const row of GRAPHEME_ROWS) {
    for (const col of COLUMN_META) {
      for (const g of row[col.id]) {
        keys.push(graphemeKey(col.id, g));
      }
    }
  }
  return keys;
}

/**
 * Build live board columns from the selected key set.
 * Blank slots stay available in onset / coda / suffix for optional positions.
 */
export function buildColumnsFromSelection(selectedKeys) {
  return COLUMN_META.map((meta) => {
    const graphemes = [];
    const seen = new Set();
    // Preserve catalog order across rows; skip duplicates (e.g. coda "s").
    for (const row of GRAPHEME_ROWS) {
      for (const g of row[meta.id]) {
        if (!selectedKeys.has(graphemeKey(meta.id, g))) continue;
        if (seen.has(g)) continue;
        seen.add(g);
        graphemes.push(g);
      }
    }

    const withBlanks =
      meta.id === 'vowel'
        ? graphemes
        : ['', ...graphemes];

    // Suggest grid density from count.
    let cols = meta.cols;
    if (meta.id === 'onset') {
      cols = withBlanks.length > 24 ? 10 : withBlanks.length > 16 ? 8 : 6;
    } else if (meta.id === 'vowel') {
      cols = withBlanks.length > 9 ? 5 : withBlanks.length > 6 ? 4 : 3;
    } else if (meta.id === 'coda') {
      cols = withBlanks.length > 16 ? 6 : withBlanks.length > 10 ? 5 : 4;
    } else {
      cols = 1;
    }

    return {
      ...meta,
      graphemes: withBlanks,
      cols,
    };
  }).filter((col) => col.graphemes.some((g) => g !== '') || col.id === 'suffix');
}

export function emptySelections(columns) {
  return Object.fromEntries(columns.map((col) => [col.id, null]));
}

/** Build display word from column selections (skips blank / null / hyphen). */
export function blendWord(columns, selections) {
  return columns
    .map((col) => {
      const idx = selections[col.id];
      if (idx == null) return '';
      return col.graphemes[idx] ?? '';
    })
    .filter((g) => g !== '' && g !== '-')
    .join('');
}

/** Keys belonging to one menu row. */
export function keysForRow(row) {
  const keys = [];
  for (const col of COLUMN_META) {
    for (const g of row[col.id]) {
      keys.push(graphemeKey(col.id, g));
    }
  }
  return keys;
}
