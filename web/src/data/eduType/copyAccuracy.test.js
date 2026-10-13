import { describe, expect, it } from 'vitest';
import {
  compareCopyAccuracy,
  extractTokens,
  formatAccuracyPercent,
} from './copyAccuracy.js';

describe('extractTokens', () => {
  it('pulls words and punctuation separately', () => {
    expect(extractTokens("Hello, world's!", 'word').map((t) => t.value)).toEqual([
      'Hello',
      "world's",
    ]);
    expect(extractTokens("Hello, world's!", 'punct').map((t) => t.value)).toEqual([
      ',',
      '!',
    ]);
  });
});

describe('compareCopyAccuracy', () => {
  it('scores perfect copy at 100%', () => {
    const result = compareCopyAccuracy(
      'The quick fox.',
      'The quick fox.',
    );
    expect(result.words.ratio).toBe(1);
    expect(result.punctuation.ratio).toBe(1);
    expect(result.capitalization.ratio).toBe(1);
    expect(result.overall).toBe(1);
  });

  it('flags wrong capitalization while keeping words', () => {
    const result = compareCopyAccuracy('Hello World!', 'hello world!');
    expect(result.words.ratio).toBe(1);
    expect(result.punctuation.ratio).toBe(1);
    expect(result.capitalization.ratio).toBe(0.8);
    expect(result.capitalization.correct).toBe(8);
    expect(result.capitalization.total).toBe(10);
  });

  it('flags missing punctuation', () => {
    const result = compareCopyAccuracy('Wait, stop!', 'Wait stop!');
    expect(result.words.ratio).toBe(1);
    expect(result.punctuation.correct).toBe(1);
    expect(result.punctuation.total).toBe(2);
    expect(result.punctuation.ratio).toBe(0.5);
  });

  it('flags wrong words', () => {
    const result = compareCopyAccuracy('The cat sat.', 'The dog sat.');
    expect(result.words.correct).toBe(2);
    expect(result.words.total).toBe(3);
    expect(result.words.ratio).toBeCloseTo(0.6667, 3);
  });

  it('formats percents for the UI', () => {
    expect(formatAccuracyPercent(0.875)).toBe('88%');
    expect(formatAccuracyPercent(1)).toBe('100%');
  });
});
