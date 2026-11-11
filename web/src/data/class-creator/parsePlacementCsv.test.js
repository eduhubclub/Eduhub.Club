import { describe, expect, it } from 'vitest';
import { parsePlacementCsv } from './parsePlacementCsv';

describe('parsePlacementCsv', () => {
  it('parses Skyward-style headers', () => {
    const csv =
      'student_id,first_name,last_name,gender,grade,school\n' +
      '10001,Ada,Lovelace,F,Kindergarten,TES\n';
    const { students, errors } = parsePlacementCsv(csv);
    expect(errors).toEqual([]);
    expect(students).toHaveLength(1);
    expect(students[0].name).toBe('Ada Lovelace');
    expect(students[0].gender).toBe('F');
    expect(students[0].studentId).toBe('10001');
    expect(students[0].source).toBe('external');
  });
});
