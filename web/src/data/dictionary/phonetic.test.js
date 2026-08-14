import { describe, expect, it } from 'vitest';
import { classroomWords } from './classroomWords';
import { localPhoneticMatches, phoneticKey, scoreKidSpelling } from './phonetic';

describe('kid phonetic spelling', () => {
  it('folds pouhm to the same key as poem', () => {
    expect(phoneticKey('pouhm')).toBe(phoneticKey('poem'));
    expect(phoneticKey('pouhm')).toBe('pm');
  });

  it('suggests poem for pouhm from classroom words', () => {
    const hits = localPhoneticMatches('pouhm', classroomWords());
    expect(hits[0]).toBe('poem');
    expect(scoreKidSpelling('pouhm', 'poem')).toBeGreaterThan(
      scoreKidSpelling('pouhm', 'palm'),
    );
  });

  it('catches other invented spellings', () => {
    const words = classroomWords();
    expect(localPhoneticMatches('becuz', words)).toContain('because');
    expect(localPhoneticMatches('frend', words)).toContain('friend');
    expect(localPhoneticMatches('nite', words)).toContain('night');
  });
});
