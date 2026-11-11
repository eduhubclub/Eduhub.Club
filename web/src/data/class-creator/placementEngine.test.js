import { describe, expect, it } from 'vitest';
import { emptyPlacementRun, normalizeStudentSnapshot } from './classCreatorModel';
import { checkMoveConstraints, runPlacement } from './placementEngine';

function student(id, gender, extras = {}) {
  return normalizeStudentSnapshot({ id, name: id, gender, ...extras });
}

describe('runPlacement', () => {
  it('honors locks and keeps pairings together', () => {
    const teachers = [
      { id: 't1', name: 'A' },
      { id: 't2', name: 'B' },
    ];
    const students = {
      s1: student('s1', 'F'),
      s2: student('s2', 'M'),
      s3: student('s3', 'F'),
      s4: student('s4', 'M'),
    };
    const run = emptyPlacementRun({
      destinationTeachers: teachers,
      students,
      cohortStudentIds: ['s1', 's2', 's3', 's4'],
      locks: { s1: 't2' },
      pairings: [{ a: 's3', b: 's4' }],
      ratings: {
        s1: { overall_academics: 3, behavior: 3, teacher_time: 2 },
        s2: { overall_academics: 2, behavior: 2, teacher_time: 3 },
        s3: { overall_academics: 4, behavior: 3, teacher_time: 1 },
        s4: { overall_academics: 3, behavior_time: 2, behavior: 3 },
      },
    });

    const { draftClasses, unassigned } = runPlacement(run);
    expect(unassigned).toEqual([]);
    expect(draftClasses.t2).toContain('s1');
    const room3 = Object.keys(draftClasses).find((tid) => draftClasses[tid].includes('s3'));
    expect(draftClasses[room3]).toContain('s4');
  });

  it('keeps students in their next-year grade teacher lane', () => {
    const run = emptyPlacementRun({
      destinationTeachers: [
        { id: 't3a', name: '3A', destinationGrade: '3rd Grade' },
        { id: 't3b', name: '3B', destinationGrade: '3rd Grade' },
        { id: 't4a', name: '4A', destinationGrade: '4th Grade' },
      ],
      students: {
        s2: student('s2', 'F', { grade_level: '2nd Grade' }),
        s3: student('s3', 'M', { grade_level: '3rd Grade' }),
      },
      cohortStudentIds: ['s2', 's3'],
      ratings: {
        s2: { overall_academics: 3, behavior: 3, teacher_time: 2 },
        s3: { overall_academics: 3, behavior: 3, teacher_time: 2 },
      },
    });

    const { draftClasses, unassigned } = runPlacement(run);
    expect(unassigned).toEqual([]);
    const room2 = Object.keys(draftClasses).find((tid) => draftClasses[tid].includes('s2'));
    const room3 = Object.keys(draftClasses).find((tid) => draftClasses[tid].includes('s3'));
    expect(['t3a', 't3b']).toContain(room2);
    expect(room3).toBe('t4a');
  });

  it('flags separation breaks on manual moves', () => {
    const run = emptyPlacementRun({
      destinationTeachers: [
        { id: 't1', name: 'A' },
        { id: 't2', name: 'B' },
      ],
      students: {
        s1: student('s1', 'F'),
        s2: student('s2', 'M'),
      },
      separations: [{ a: 's1', b: 's2' }],
      draftClasses: { t1: ['s2'], t2: [] },
    });
    const check = checkMoveConstraints(run, { t1: ['s2'], t2: [] }, 's1', 't1');
    expect(check.ok).toBe(false);
    expect(check.breaks[0]).toMatch(/separated/i);
  });
});
