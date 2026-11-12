import { describe, expect, it } from 'vitest';
import {
  countsTowardCompile,
  formatNativeScore,
  coverSchedule,
  normalizeAssessment,
  normalizeSchedule,
  scheduleDayMarks,
  SHELVES,
  studentCanSeeAssignment,
  numbersMatch,
  scoreAttempt,
  scoreItem,
  speakScript,
  standardIdsOf,
  validateAssessment,
} from './model';

function item(partial) {
  return {
    id: partial.id || 'q1',
    points: 1,
    standardIds: [],
    prompt: 'Prompt',
    ...partial,
  };
}

describe('assessment library', () => {
  it('keeps a teacher test on the saved shelf unless it is district or community', () => {
    const saved = normalizeAssessment({ title: 'Check', subject: 'Math' });
    expect(saved.shelf).toBe('mine');
    expect(saved.archived).toBe(false);
    expect(SHELVES).toContain('district');
    const district = normalizeAssessment({
      title: 'District check',
      subject: 'Math',
      shelf: 'district',
      archived: true,
    });
    expect(district.shelf).toBe('district');
    expect(district.archived).toBe(true);
    expect(normalizeAssessment({ title: 'Other', subject: 'Math', shelf: 'public' }).shelf).toBe(
      'mine',
    );
  });
});

describe('assessment schedule', () => {
  it('keeps testing days inside the window and hides a future assign date', () => {
    const schedule = coverSchedule(
      normalizeSchedule({
        assessmentId: 'a1',
        scope: 'class',
        classId: 'class-1',
        windowStart: '2026-11-12',
        windowEnd: '2026-11-13',
        testingDays: ['2026-11-11'],
        assignOn: '2026-11-16',
        studentAssignOn: { stu: '2026-11-10' },
      }),
    );
    expect(schedule.windowStart).toBe('2026-11-11');
    expect(schedule.windowEnd).toBe('2026-11-13');
    expect(scheduleDayMarks(schedule, '2026-11-11')).toEqual(['window', 'testing']);
    expect(scheduleDayMarks(schedule, '2026-11-10')).toEqual(['assign']);
    expect(studentCanSeeAssignment(schedule, 'stu', '2026-11-10')).toBe(true);
    expect(studentCanSeeAssignment(schedule, 'other', '2026-11-12')).toBe(false);
    expect(studentCanSeeAssignment(null, 'other', '2026-11-12')).toBe(true);
  });
});

describe('assessment scoring', () => {
  it('marks a choose-one answer and leaves the original points intact', () => {
    const question = item({
      type: 'choose_one',
      choices: [
        { id: 'a', label: '4' },
        { id: 'b', label: '5' },
      ],
      correctChoiceId: 'a',
      points: 2,
    });
    expect(scoreItem(question, { choiceId: 'a' })).toEqual({
      auto: true,
      correct: true,
      points: 2,
    });
    expect(scoreItem(question, { choiceId: 'b' }).correct).toBe(false);
  });

  it('treats 4 and 4.0 as the same number', () => {
    expect(numbersMatch('4', '4.0')).toBe(true);
    expect(numbersMatch('4', '5')).toBe(false);
    const question = item({ type: 'number', correctNumber: '4.0', points: 1 });
    expect(scoreItem(question, { number: '4' }).correct).toBe(true);
  });

  it('holds writing for the teacher and still counts its points as possible', () => {
    const assessment = normalizeAssessment({
      id: 't1',
      title: 'Check',
      subject: 'Math',
      purpose: 'formative',
      items: [
        item({ id: 'n', type: 'number', correctNumber: '3', points: 1 }),
        item({ id: 'w', type: 'short_write', points: 2, standardIds: ['W.2'] }),
      ],
    });
    const scored = scoreAttempt(assessment, {
      n: { number: '3' },
      w: { text: 'I counted.' },
    });
    expect(scored.status).toBe('needs_grading');
    expect(scored.pointsEarned).toBe(1);
    expect(scored.pointsPossible).toBe(3);
    expect(scored.answers.w.auto).toBe(false);
    expect(countsTowardCompile(assessment)).toBe(false);
    expect(standardIdsOf(assessment)).toEqual(['W.2']);
  });

  it('scores a fully automatic test as graded', () => {
    const assessment = normalizeAssessment({
      title: 'Facts',
      subject: 'Math',
      purpose: 'summative',
      items: [
        item({
          id: 'c',
          type: 'choose_one',
          choices: [
            { id: 'a', label: 'Yes' },
            { id: 'b', label: 'No' },
          ],
          correctChoiceId: 'a',
        }),
        item({ id: 'n', type: 'number', correctNumber: '10' }),
      ],
    });
    const scored = scoreAttempt(assessment, {
      c: { choiceId: 'a' },
      n: { number: '10' },
    });
    expect(scored.status).toBe('graded');
    expect(scored.pointsEarned).toBe(2);
    expect(countsTowardCompile(assessment)).toBe(true);
  });

  it('scores choose-many, order, and match when a key is stored', () => {
    expect(
      scoreItem(
        item({
          type: 'choose_many',
          correctChoiceIds: ['a', 'c'],
        }),
        { choiceIds: ['c', 'a'] },
      ).correct,
    ).toBe(true);
    expect(
      scoreItem(item({ type: 'order', correctOrder: ['a', 'b'] }), { orderIds: ['b', 'a'] })
        .correct,
    ).toBe(false);
    expect(
      scoreItem(
        item({
          type: 'match',
          correctPairs: [{ leftId: 'l', rightId: 'r' }],
        }),
        { pairs: [{ leftId: 'l', rightId: 'r' }] },
      ).correct,
    ).toBe(true);
  });

  it('refuses a choose-one question with no correct choice', () => {
    const { errors } = validateAssessment({
      title: 'Quiz',
      subject: 'Reading',
      items: [
        {
          type: 'choose_one',
          prompt: 'Pick one',
          choices: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ],
          correctChoiceId: '',
        },
      ],
    });
    expect(errors.some((error) => /correct choice/.test(error))).toBe(true);
  });

  it('formats the native score without dropping a closed teacher entry', () => {
    expect(formatNativeScore(null).label).toBe('—');
    expect(
      formatNativeScore({
        status: 'closed',
        pointsEarned: 3,
        pointsPossible: 4,
        teacherEntered: true,
      }),
    ).toEqual({ label: '3/4', detail: 'Closed' });
    expect(
      formatNativeScore({ status: 'needs_grading', pointsEarned: 1, pointsPossible: 2 }).detail,
    ).toBe('Needs grading');
  });

  it('reads the prompt and the choices aloud', () => {
    expect(
      speakScript({
        type: 'choose_one',
        prompt: 'What is two plus two?',
        choices: [
          { id: 'a', label: '4' },
          { id: 'b', label: '5' },
        ],
      }),
    ).toBe('What is two plus two? Choices. 4. 5');
  });
});
