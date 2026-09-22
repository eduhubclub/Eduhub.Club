import { describe, expect, it } from 'vitest';
import { resolveAccuracy } from './settings';

describe('resolveAccuracy', () => {
  it('keystroke mode uses wrong-key counts', () => {
    expect(
      resolveAccuracy('keystroke', { correctKeystrokes: 9, errorKeystrokes: 1 }),
    ).toBe(0.9);
  });

  it('letters mode uses letter correct/wrong ratio', () => {
    expect(
      resolveAccuracy('letters', { letterCorrect: 8, letterWrong: 2 }),
    ).toBe(0.8);
  });

  it('empty stats are 100%', () => {
    expect(resolveAccuracy('keystroke', {})).toBe(1);
    expect(resolveAccuracy('letters', {})).toBe(1);
  });
});
