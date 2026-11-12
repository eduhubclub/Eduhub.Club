import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_PACKS,
  getCurriculumTemplate,
  listCurriculumTemplates,
} from './curriculumTemplates';
import { countSectionQuestions } from './sectionQuestions';

describe('curriculumTemplates', () => {
  it('includes Arts & Letters Anatomy of an Essay', () => {
    const pack = CURRICULUM_PACKS.find((p) => p.id === 'arts-letters');
    expect(pack).toBeTruthy();
    expect(pack.templates.some((t) => t.name === 'Anatomy of an Essay')).toBe(
      true,
    );
  });

  it('exposes stable ids with anatomy-style section questions', () => {
    const list = listCurriculumTemplates();
    expect(list.length).toBeGreaterThan(0);
    const essay = getCurriculumTemplate(
      'curriculum:arts-letters:painted-essay',
    );
    expect(essay?.curriculumName).toBe('Arts & Letters');
    expect(essay?.bodyCount).toBe(2);
    expect(essay.questions.intro.some((q) => /hook/i.test(q))).toBe(true);
    expect(essay.questions.body.some((q) => /evidence/i.test(q))).toBe(true);
    expect(essay.questions.conclusion.some((q) => /thank/i.test(q))).toBe(true);
    expect(countSectionQuestions(essay.questions)).toBe(11);
  });
});
