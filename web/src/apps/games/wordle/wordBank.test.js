import { describe, expect, it } from 'vitest';
import { WORD_LISTS as CURRICULUM_LISTS } from './wordLists';
import { COMMON_WORDS_BY_LENGTH } from './allWords';
import {
  ALL_WORDS_LIST_ID,
  DEFAULT_WORD_LIST_IDS,
  WORD_LISTS,
  answerWordsForLength,
  firstLengthWithWords,
  normalizeListIds,
  normalizePuzzleWord,
  wordsForLength,
} from './wordBank';

describe('wordle word lists', () => {
  it('has four curriculum lists plus an opt-in all-words list', () => {
    expect(CURRICULUM_LISTS.map((list) => list.id)).toEqual([
      'fry',
      'dolch',
      'heart',
      'irregular',
    ]);
    expect(WORD_LISTS.map((list) => list.id)).toEqual([
      'fry',
      'dolch',
      'heart',
      'irregular',
      'all',
    ]);
    expect(DEFAULT_WORD_LIST_IDS).toEqual(['fry', 'dolch', 'heart', 'irregular']);
    expect(DEFAULT_WORD_LIST_IDS).not.toContain(ALL_WORDS_LIST_ID);
  });

  it('keeps only a–z words of length 2–8', () => {
    for (const list of CURRICULUM_LISTS) {
      expect(list.words.length).toBeGreaterThan(100);
      for (const word of list.words) {
        expect(word).toMatch(/^[a-z]{2,8}$/);
      }
    }
  });

  it('falls back to curriculum lists when none are selected', () => {
    expect(normalizeListIds([])).toEqual(DEFAULT_WORD_LIST_IDS);
    expect(normalizeListIds(['nope'])).toEqual(DEFAULT_WORD_LIST_IDS);
    expect(normalizeListIds(['dolch', 'dolch', 'fry'])).toEqual(['dolch', 'fry']);
    expect(normalizeListIds(['all'])).toEqual(['all']);
  });

  it('filters the bank to enabled lists', () => {
    const dolchFive = wordsForLength(5, ['dolch']);
    const fryFive = wordsForLength(5, ['fry']);
    expect(dolchFive).toContain('about');
    expect(dolchFive).not.toContain('earth');
    expect(fryFive).toContain('earth');
    expect(dolchFive.length).toBeLessThan(fryFive.length);
  });

  it('uses common words as all-words answers and a larger dictionary for guesses', () => {
    const guesses = wordsForLength(5, ['all']);
    const answers = answerWordsForLength(5, ['all']);
    expect(guesses.length).toBeGreaterThan(5000);
    expect(answers.length).toBeGreaterThan(500);
    expect(answers.length).toBeLessThan(guesses.length);
    expect(answers).toEqual([...(COMMON_WORDS_BY_LENGTH[5] || [])].sort());
    expect(guesses).toContain('heart');
    expect(answers).toContain('heart');
  });

  it('picks another length when the preferred length is empty', () => {
    expect(firstLengthWithWords(['dolch'], 5)).toBe(5);
    expect(firstLengthWithWords(['dolch'], 99)).toBe(2);
  });

  it('normalizes teacher puzzle words to 2–8 letters', () => {
    expect(normalizePuzzleWord('Heart!')).toBe('heart');
    expect(normalizePuzzleWord('a')).toBe('');
    expect(normalizePuzzleWord('xylophone')).toBe('');
  });
});
