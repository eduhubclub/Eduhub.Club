/**
 * Kid-friendly American dictionary respelling from IPA (or passthrough if already respelling).
 * Example: /noʊˈɛtɪk/ → [noh-et-ik], /bɔːt/ → [bawt]
 */

/** Longest-first IPA → respelling tokens. */
const IPA_TOKENS = [
  ['tʃ', 'ch'],
  ['dʒ', 'j'],
  ['aɪ', 'igh'],
  ['aʊ', 'ow'],
  ['ɔɪ', 'oy'],
  ['eɪ', 'ay'],
  ['oʊ', 'oh'],
  ['əʊ', 'oh'],
  ['ɪə', 'eer'],
  ['ɛə', 'air'],
  ['ʊə', 'oor'],
  ['ɑː', 'ah'],
  ['ɔː', 'aw'],
  ['uː', 'oo'],
  ['iː', 'ee'],
  ['ɜː', 'ur'],
  ['ʌɪ', 'igh'],
  ['ʃ', 'sh'],
  ['ʒ', 'zh'],
  ['θ', 'th'],
  ['ð', 'th'],
  ['ŋ', 'ng'],
  ['æ', 'a'],
  ['ɑ', 'ah'],
  ['ɒ', 'o'],
  ['ɔ', 'aw'],
  ['ə', 'uh'],
  ['ɚ', 'ur'],
  ['ɝ', 'ur'],
  ['ɛ', 'e'],
  ['e', 'e'],
  ['ɪ', 'i'],
  ['i', 'ee'],
  ['ʊ', 'oo'],
  ['u', 'oo'],
  ['ʌ', 'uh'],
  ['ɜ', 'ur'],
  ['ɹ', 'r'],
  ['r', 'r'],
  ['j', 'y'],
  ['w', 'w'],
  ['h', 'h'],
  ['b', 'b'],
  ['d', 'd'],
  ['f', 'f'],
  ['g', 'g'],
  ['ɡ', 'g'],
  ['k', 'k'],
  ['l', 'l'],
  ['m', 'm'],
  ['n', 'n'],
  ['p', 'p'],
  ['s', 's'],
  ['t', 't'],
  ['v', 'v'],
  ['z', 'z'],
  ['x', 'kh'],
];

const VOWEL_SPELLINGS = [
  'oor',
  'eer',
  'air',
  'igh',
  'oh',
  'oo',
  'oy',
  'ow',
  'aw',
  'ah',
  'ay',
  'uh',
  'ur',
  'ee',
  'a',
  'e',
  'i',
  'o',
  'u',
];

function looksLikeIpa(text) {
  return /[əæɑɒɔɛɪʊʌɜɝɚθðʃʒŋɡːˈˌ\/]/.test(text);
}

function looksLikeRespelling(text) {
  return /^[\[(].+[\])]$/.test(text) || /^[a-z]+(-[a-z]+)+$/i.test(text);
}

/**
 * Insert hyphens between vowel nuclei (Dictionary.com style).
 * @param {string} text
 */
function syllabify(text) {
  const s = String(text || '').toLowerCase().replace(/-/g, '');
  if (!s) return '';

  /** @type {{ type: 'v' | 'c', value: string }[]} */
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    let vowel = null;
    for (const v of VOWEL_SPELLINGS) {
      if (s.startsWith(v, i)) {
        vowel = v;
        break;
      }
    }
    if (vowel) {
      tokens.push({ type: 'v', value: vowel });
      i += vowel.length;
    } else {
      tokens.push({ type: 'c', value: s[i] });
      i += 1;
    }
  }

  /** @type {string[][]} */
  const syllables = [];
  /** @type {string[]} */
  let cur = [];
  let hasVowel = false;

  for (const tok of tokens) {
    if (tok.type === 'v') {
      if (hasVowel) {
        syllables.push(cur);
        cur = [tok.value];
      } else {
        cur.push(tok.value);
      }
      hasVowel = true;
    } else {
      cur.push(tok.value);
    }
  }
  if (cur.length) syllables.push(cur);
  return syllables.map((parts) => parts.join('')).filter(Boolean).join('-');
}

/**
 * @param {string | null | undefined} raw
 * @returns {string | null} e.g. [noh-et-ik]
 */
export function formatRespelling(raw) {
  const t = String(raw || '').trim();
  if (!t) return null;
  if (looksLikeRespelling(t) && !looksLikeIpa(t)) {
    if (t.startsWith('[') || t.startsWith('(')) {
      return t.replace(/^\(/, '[').replace(/\)$/, ']');
    }
    return `[${t}]`;
  }

  const ipa = t.replace(/^\/+|\/+$/g, '').replace(/^\[+|\]+$/g, '').trim();
  if (!ipa) return null;

  let out = '';
  for (let i = 0; i < ipa.length; ) {
    const ch = ipa[i];
    if (ch === 'ˈ' || ch === 'ˌ' || ch === '.' || ch === ' ' || ch === 'ː' || ch === '-') {
      i += 1;
      continue;
    }
    let matched = false;
    for (const [from, to] of IPA_TOKENS) {
      if (ipa.startsWith(from, i)) {
        out += to;
        i += from.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (/[a-z]/i.test(ch)) out += ch.toLowerCase();
      i += 1;
    }
  }

  const joined = syllabify(out);
  if (!joined) return null;
  return `[${joined}]`;
}

/**
 * IPA display form.
 * @param {string | null | undefined} text
 */
export function formatPronunciation(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  if (t.startsWith('/') || t.startsWith('[') || t.startsWith('(')) return t;
  if (looksLikeIpa(t)) return `/${t}/`;
  return `[ ${t} ]`;
}

/**
 * Kid line: respelling first, IPA second when both exist.
 * @param {string | null | undefined} text
 */
export function formatPronunciationLine(text) {
  const ipa = formatPronunciation(text);
  const respell = formatRespelling(text);
  if (respell && ipa && respell !== ipa && looksLikeIpa(String(text || ''))) {
    return `${respell}  ${ipa}`;
  }
  return respell || ipa;
}
