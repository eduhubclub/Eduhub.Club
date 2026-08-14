import { WORD_LISTS } from '../../apps/games/wordle/wordLists';
import { normalizeLookup } from './spellingBank';

/** Extra everyday words kids invent-spell that classroom lists may miss. */
const EXTRA = [
  'poem',
  'poems',
  'dinosaur',
  'butterfly',
  'birthday',
  'because',
  'friend',
  'friends',
  'night',
  'light',
  'photo',
  'phone',
  'school',
  'people',
  'beautiful',
];

let cached = null;

/**
 * Fry / Dolch / UFLI plus a few high-frequency extras (3+ letters).
 */
export function classroomWords() {
  if (cached) return cached;
  const set = new Set();
  for (const word of EXTRA) {
    const next = normalizeLookup(word);
    if (next.length >= 3) set.add(next);
  }
  for (const list of WORD_LISTS) {
    for (const word of list.words || []) {
      const next = normalizeLookup(word);
      if (next.length >= 3) set.add(next);
    }
  }
  cached = [...set];
  return cached;
}
