import { describe, expect, it } from 'vitest';
import { buildDemoTeacherResults, mockRatingValue } from './demoTeacherResults';

describe('buildDemoTeacherResults', () => {
  it('places current class students into next-grade rooms from mock ratings', () => {
    const cls = {
      id: 'demo-3rd-grade',
      name: 'Demo Class',
      grade: '3rd Grade',
      studentList: [
        { id: 'a', name: 'Ada Lovelace', gender: 'F' },
        { id: 'b', name: 'Alan Turing', gender: 'M' },
        { id: 'c', name: 'Grace Hopper', gender: 'F' },
        { id: 'd', name: 'Kai Rivera', gender: 'M' },
      ],
    };
    const preview = buildDemoTeacherResults(cls);
    expect(preview).toBeTruthy();
    expect(preview.destinationGrade).toBe('4th Grade');
    expect(preview.destinationTeachers.length).toBeGreaterThanOrEqual(2);
    expect(preview.cohortStudentIds).toHaveLength(4);
    expect(preview.ratings.a.overall_academics).toBe(mockRatingValue('a', 'overall_academics'));
    const placed = Object.values(preview.draftClasses).flat();
    expect(placed).toHaveLength(4);
  });
});
