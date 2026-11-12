import { describe, expect, it } from 'vitest';
import {
  assembleDraft,
  buildSteps,
  validatePiece,
  wordCount,
} from './buildSteps';

describe('buildSteps', () => {
  it('builds a sentence path with prompt, edit, assemble, finalEdit', () => {
    const steps = buildSteps({
      genre: 'opinion',
      length: 'sentence',
      topic: 'recess',
    });
    expect(steps.map((s) => s.kind)).toEqual([
      'prompt',
      'edit',
      'assemble',
      'finalEdit',
    ]);
    expect(steps[0].prompt.toLowerCase()).toContain('recess');
  });

  it('builds a paragraph path with three prompt/edit pairs', () => {
    const steps = buildSteps({
      genre: 'narrative',
      length: 'paragraph',
      topic: 'the park',
    });
    const prompts = steps.filter((s) => s.kind === 'prompt');
    const edits = steps.filter((s) => s.kind === 'edit');
    expect(prompts).toHaveLength(3);
    expect(edits).toHaveLength(3);
    expect(steps.at(-2).kind).toBe('assemble');
    expect(steps.at(-1).kind).toBe('finalEdit');
  });

  it('builds an essay with intro, N bodies, and conclusion', () => {
    const steps = buildSteps({
      genre: 'informative',
      length: 'essay',
      topic: 'frogs',
      bodyCount: 2,
    });
    const sections = steps
      .filter((s) => s.kind === 'prompt')
      .map((s) => s.sectionKey);
    expect(sections.filter((s) => s === 'intro').length).toBeGreaterThan(0);
    expect(sections.filter((s) => s === 'body-1').length).toBeGreaterThan(0);
    expect(sections.filter((s) => s === 'body-2').length).toBeGreaterThan(0);
    expect(sections.filter((s) => s === 'conclusion').length).toBeGreaterThan(0);
    expect(sections.some((s) => s === 'body-3')).toBe(false);
  });

  it('uses teacher profile questions instead of genre packs', () => {
    const steps = buildSteps({
      genre: 'opinion',
      length: 'essay',
      topic: 'dogs',
      profileQuestions: ['What do you like about {topic}?', 'Why?'],
    });
    const prompts = steps.filter((s) => s.kind === 'prompt');
    expect(prompts).toHaveLength(2);
    expect(prompts[0].prompt).toContain('dogs');
    expect(prompts[1].prompt).toBe('Why?');
  });

  it('repeats body-section questions for each body paragraph', () => {
    const steps = buildSteps({
      genre: 'opinion',
      length: 'essay',
      topic: 'dogs',
      bodyCount: 2,
      profileQuestions: {
        intro: ['Hook about {topic}'],
        body: ['Reason for {topic}', 'Example'],
        conclusion: ['Wrap up {topic}'],
      },
    });
    const prompts = steps.filter((s) => s.kind === 'prompt');
    expect(prompts.map((s) => s.sectionKey)).toEqual([
      'intro',
      'body-1',
      'body-1',
      'body-2',
      'body-2',
      'conclusion',
    ]);
    expect(prompts[0].prompt).toContain('dogs');
    expect(prompts[1].prompt).toContain('dogs');
  });
});

describe('assembleDraft + validatePiece', () => {
  it('joins unique piece keys in order', () => {
    const steps = buildSteps({
      genre: 'opinion',
      length: 'paragraph',
      topic: 'pizza',
    });
    const pieces = {};
    for (const step of steps) {
      if (step.kind === 'prompt') pieces[step.pieceKey] = `Text for ${step.pieceKey}.`;
    }
    const draft = assembleDraft(steps, pieces);
    expect(draft.split('\n\n')).toHaveLength(3);
  });

  it('validates empty and short pieces', () => {
    expect(wordCount('one two three')).toBe(3);
    expect(validatePiece({ minWords: 4 }, '')).toBe('empty');
    expect(validatePiece({ minWords: 4 }, 'too short')).toBe('short');
    expect(validatePiece({ minWords: 2 }, 'long enough here')).toBe('ok');
  });
});
