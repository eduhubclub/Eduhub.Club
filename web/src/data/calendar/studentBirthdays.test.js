import { describe, expect, it } from 'vitest';
import {
  expandStudentBirthdays,
  parseBirthMonthDay,
} from './studentBirthdays.js';

describe('parseBirthMonthDay', () => {
  it('parses MM/DD/YYYY', () => {
    expect(parseBirthMonthDay('04/12/2017')).toEqual({ month: 4, day: 12 });
  });

  it('parses ISO dates', () => {
    expect(parseBirthMonthDay('2016-09-03')).toEqual({ month: 9, day: 3 });
  });

  it('rejects empty', () => {
    expect(parseBirthMonthDay('')).toBe(null);
  });
});

describe('expandStudentBirthdays', () => {
  const students = [
    { id: 'a', name: 'Ada Lovelace', birthdate: '09/03/2016' },
    { id: 'b', name: 'Grace Hopper', birthdate: '04/12/2017' },
  ];

  it('places birthdays on matching month/day in range', () => {
    const rows = expandStudentBirthdays({
      rangeStart: '2026-09-01',
      rangeEnd: '2026-09-30',
      classBundles: [
        { classId: 'c1', className: 'Demo', students },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2026-09-03');
    expect(rows[0].title).toBe('Ada Lovelace');
    expect(rows[0].kind).toBe('birthday');
    expect(rows[0].classId).toBe('c1');
  });

  it('skips students without birthdates', () => {
    const rows = expandStudentBirthdays({
      rangeStart: '2026-09-01',
      rangeEnd: '2026-09-30',
      classBundles: [
        {
          classId: 'c1',
          className: 'Demo',
          students: [{ id: 'x', name: 'No Date', birthdate: '' }],
        },
      ],
    });
    expect(rows).toHaveLength(0);
  });
});
