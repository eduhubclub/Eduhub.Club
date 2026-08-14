import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEFAULT_DICTIONARY_AGE,
  flagWord,
  filterBlockedWords,
  imageLooksAdult,
  isBlockedDefinition,
  isBlockedWord,
  isTeacherFlagged,
  normalizeAgeLevel,
  unflagWord,
} from './ageFilter';

describe('dictionary age filter', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('defaults to K–2', () => {
    expect(normalizeAgeLevel('nope')).toBe(DEFAULT_DICTIONARY_AGE);
    expect(DEFAULT_DICTIONARY_AGE).toBe('k2');
  });

  it('blocks sex for elementary but not unrestricted', () => {
    expect(isBlockedWord('sex', 'k2')).toBe(true);
    expect(isBlockedWord('sex', 'k5')).toBe(true);
    expect(isBlockedWord('sex', 'middle')).toBe(false);
    expect(isBlockedWord('sex', 'all')).toBe(false);
    expect(isBlockedWord('apple', 'k2')).toBe(false);
  });

  it('blocks explicit terms at every school level', () => {
    expect(isBlockedWord('porn', 'middle')).toBe(true);
    expect(isBlockedWord('porn', 'all')).toBe(false);
  });

  it('filters suggestion lists and adult definitions for elementary', () => {
    expect(filterBlockedWords(['cat', 'sex', 'tree'], 'k5')).toEqual(['cat', 'tree']);
    expect(
      isBlockedDefinition(
        '(uncountable) Sexual activity, usually sexual intercourse unless preceded by a modifier.',
        'k5',
      ),
    ).toBe(true);
    expect(isBlockedDefinition('A round fruit that grows on trees.', 'k5')).toBe(false);
  });

  it('flags adult picture titles', () => {
    expect(imageLooksAdult('Sexe électrique')).toBe(true);
    expect(imageLooksAdult('Red apple on a table')).toBe(false);
  });

  it('lets teachers flag extra words for every school age band', () => {
    expect(isBlockedWord('death', 'k2')).toBe(false);
    flagWord('Death!');
    expect(isTeacherFlagged('death')).toBe(true);
    expect(isBlockedWord('death', 'k2')).toBe(true);
    expect(isBlockedWord('death', 'middle')).toBe(true);
    expect(isBlockedWord('death', 'all')).toBe(false);
    expect(filterBlockedWords(['cat', 'death'], 'k5')).toEqual(['cat']);
    unflagWord('death');
    expect(isBlockedWord('death', 'k2')).toBe(false);
  });
});
