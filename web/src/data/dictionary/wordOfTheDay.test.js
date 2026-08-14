import { describe, expect, it, beforeEach } from 'vitest';
import {
  formatWordOfTheDayDate,
  localDateKey,
  pickWordCandidates,
  pickWordOfTheDay,
} from './wordOfTheDay';

describe('word of the day', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('uses the local calendar date', () => {
    expect(localDateKey(new Date(2026, 7, 14))).toBe('2026-08-14');
    expect(formatWordOfTheDayDate('2026-08-14')).toContain('2026');
    expect(formatWordOfTheDayDate('2026-08-14')).toContain('14');
  });

  it('picks the same word for the same day and age', () => {
    const a = pickWordOfTheDay('2026-08-14', 'k2');
    const b = pickWordOfTheDay('2026-08-14', 'k2');
    expect(a).toBeTruthy();
    expect(a).toBe(b);
  });

  it('can pick a different word for a different age band', () => {
    const k2 = pickWordOfTheDay('2026-08-14', 'k2');
    const middle = pickWordOfTheDay('2026-08-14', 'middle');
    expect(k2).toBeTruthy();
    expect(middle).toBeTruthy();
    expect(pickWordCandidates('2026-08-14', 'k2').includes('labyrinth')).toBe(false);
    expect(pickWordCandidates('2026-08-14', 'middle').length).toBeGreaterThan(
      pickWordCandidates('2026-08-14', 'k2').length,
    );
  });
});
