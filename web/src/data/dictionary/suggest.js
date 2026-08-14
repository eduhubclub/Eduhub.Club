import { filterBlockedWords } from './ageFilter';
import { classroomWords } from './classroomWords';
import { localPhoneticMatches } from './phonetic';
import { learnedFor, normalizeLookup } from './spellingBank';

const MAX_REMOTE = 8;
const MAX_RESULTS = 8;

/**
 * Merge learned hits, kid-phonetic classroom matches, then Datamuse.
 * @param {{ query: string, learned?: { word: string, count: number }[], local?: string[], remote?: string[] }} input
 */
export function mergeSuggestions({ query, learned = [], local = [], remote = [] }) {
  const q = normalizeLookup(query);
  const seen = new Set();
  const out = [];

  const push = (word) => {
    const next = normalizeLookup(word);
    if (!next || seen.has(next)) return;
    seen.add(next);
    out.push(next);
  };

  for (const hit of learned) push(hit.word);
  for (const word of local) push(word);
  for (const word of remote) push(word);
  if (!out.length && q) push(q);
  return out.slice(0, MAX_RESULTS);
}

function lettersOnly(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => normalizeLookup(row?.word || row))
    .filter(Boolean);
}

async function datamuse(param, query) {
  const url = `https://api.datamuse.com/words?${param}=${encodeURIComponent(query)}&max=${MAX_REMOTE}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return lettersOnly(await res.json());
}

function queryVariants(query) {
  const variants = [query];
  const noH = query.charAt(0) + query.slice(1).replace(/h/g, '');
  if (noH !== query && noH.length >= 2) variants.push(noH);
  return variants;
}

function collectLocal(query) {
  const learned = learnedFor(query);
  const local = localPhoneticMatches(query, classroomWords());
  return { learned, local };
}

/**
 * Instant chips from this class’s learned spellings + classroom phonetic matches.
 * @param {string} raw
 */
export function quickSuggestions(raw) {
  const query = normalizeLookup(raw);
  if (query.length < 2) return [];
  const { learned, local } = collectLocal(query);
  return filterBlockedWords(mergeSuggestions({ query, learned, local }));
}

/**
 * @param {string} raw
 * @returns {Promise<string[]>}
 */
export async function fetchSuggestions(raw) {
  const query = normalizeLookup(raw);
  if (query.length < 2) return [];

  const { learned, local } = collectLocal(query);
  let remote = [];
  try {
    const jobs = [];
    for (const variant of queryVariants(query)) {
      jobs.push(datamuse('sp', variant), datamuse('sl', variant));
    }
    const chunks = await Promise.all(jobs);
    remote = chunks.flat();
  } catch {
    remote = [];
  }
  return filterBlockedWords(mergeSuggestions({ query, learned, local, remote }));
}
