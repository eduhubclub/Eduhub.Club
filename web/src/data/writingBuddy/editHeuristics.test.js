import { describe, expect, it } from 'vitest';
import {
  editChecklist,
  endsWithEndMark,
  replaceSpan,
  startsWithCapital,
  tokenizeWords,
} from './editHeuristics';

describe('editHeuristics', () => {
  it('checks capital and end mark', () => {
    expect(startsWithCapital('Hello')).toBe(true);
    expect(startsWithCapital('hello')).toBe(false);
    expect(endsWithEndMark('Done.')).toBe(true);
    expect(endsWithEndMark('Done')).toBe(false);
    expect(editChecklist('Hello world!')).toEqual({
      hasText: true,
      capital: true,
      endMark: true,
    });
  });

  it('tokenizes and replaces a word span', () => {
    const text = 'I like pezza a lot.';
    const tokens = tokenizeWords(text);
    const pezza = tokens.find((t) => t.word === 'pezza');
    expect(pezza).toBeTruthy();
    const next = replaceSpan(text, pezza.start, pezza.end, 'pizza');
    expect(next).toBe('I like pizza a lot.');
  });
});
