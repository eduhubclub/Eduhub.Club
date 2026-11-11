import { describe, expect, it } from 'vitest';
import { clipUrl, normalizeRecordedVoice } from './letrsAudio';
import { wordsFor } from './letrsBank';
import { scoreLetrs } from './letrsScore';

describe('scoreLetrs', () => {
  it('scores a perfect Basic list with no instructional targets', () => {
    const answers = wordsFor('basic').map((item) => item.word);
    const scored = scoreLetrs(answers, 'basic');
    expect(scored.wordsCorrect).toBe(25);
    expect(scored.wordsTotal).toBe(25);
    expect(scored.concerns).toEqual([]);
    expect(scored.grandEarned).toBe(scored.grandMax);
    expect(scored.grandMax).toBe(84);
  });

  it('accepts capitalization and still marks the word correct', () => {
    const answers = wordsFor('basic').map((item) => item.word);
    answers[0] = 'Mud';
    const scored = scoreLetrs(answers, 'basic');
    expect(scored.wordRows[0].correct).toBe(true);
    expect(scored.wordsCorrect).toBe(25);
  });

  it('gives feature credit when the pattern is present but the word is wrong', () => {
    const scored = scoreLetrs(['mad'], 'basic');
    expect(scored.wordsCorrect).toBe(0);
    expect(scored.categoryScores['Initial Consonant']).toEqual({
      earned: 1,
      possible: 9,
    });
    expect(scored.categoryScores['Short Vowel'].earned).toBe(0);
    expect(scored.categoryScores['Final Consonant'].earned).toBe(1);
    expect(scored.concerns.some((row) => row.name === 'Short Vowel')).toBe(true);
  });

  it('marks Advanced root and suffix cells on organization', () => {
    const answers = wordsFor('advanced').map(() => '');
    answers[21] = 'organization';
    const scored = scoreLetrs(answers, 'advanced');
    expect(scored.categoryScores['Derivational Suffix'].earned).toBe(1);
    expect(scored.categoryScores['Root or Base Word'].earned).toBe(1);
    expect(scored.categoryScores['Other Vowel'].earned).toBe(1);
    expect(scored.wordsCorrect).toBe(1);
  });

  it('scores a perfect Advanced list', () => {
    const answers = wordsFor('advanced').map((item) => item.word);
    const scored = scoreLetrs(answers, 'advanced');
    expect(scored.wordsCorrect).toBe(25);
    expect(scored.concerns).toEqual([]);
    expect(scored.grandMax).toBe(82);
    expect(scored.grandEarned).toBe(82);
  });
});

describe('letrs audio paths', () => {
  it('builds the public clip URL used by the voice packs', () => {
    expect(clipUrl('basic', 0, 'mud', 'en-us-female')).toBe(
      'https://cdn.jsdelivr.net/gh/thomaseccles67/letrs-screener-audio@v1/en-us-female/basic/01-mud.mp3',
    );
  });

  it('falls back to the American female pack for an unknown voice', () => {
    expect(normalizeRecordedVoice('nope')).toBe('en-us-female');
  });
});
