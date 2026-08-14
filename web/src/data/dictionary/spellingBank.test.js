import { describe, expect, it, beforeEach } from 'vitest';
import { learnedFor, normalizeLookup, recordSpelling } from './spellingBank';
import { mergeSuggestions } from './suggest';

function mockStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  };
}

describe('dictionary spelling bank', () => {
  beforeEach(() => {
    mockStorage();
  });

  it('normalizes attempts to a–z', () => {
    expect(normalizeLookup(' Be-Cuz! ')).toBe('becuz');
  });

  it('attaches a kid spelling to the teacher’s word', () => {
    recordSpelling('pouhm', 'poem');
    expect(learnedFor('pouhm').map((h) => h.word)).toEqual(['poem']);
  });
});

describe('mergeSuggestions', () => {
  it('puts learned hits before remote suggestions', () => {
    expect(
      mergeSuggestions({
        query: 'becuz',
        learned: [{ word: 'because', count: 3 }],
        remote: ['beckon', 'because', 'become'],
      }),
    ).toEqual(['because', 'beckon', 'become']);
  });

  it('puts kid-phonetic classroom matches before Datamuse', () => {
    expect(
      mergeSuggestions({
        query: 'pouhm',
        learned: [],
        local: ['poem'],
        remote: ['pouch', 'palm'],
      }),
    ).toEqual(['poem', 'pouch', 'palm']);
  });
});
