import { describe, expect, it } from 'vitest';
import {
  classAttendancePercent,
  dailyRotateIndex,
  isHereStatus,
  pickChampion,
  submitDay,
} from './attendanceModel';

describe('attendanceModel', () => {
  it('treats present and tardy as here', () => {
    expect(isHereStatus('present')).toBe(true);
    expect(isHereStatus('tardy')).toBe(true);
    expect(isHereStatus('absent')).toBe(false);
    expect(isHereStatus('excused')).toBe(false);
  });

  it('submit marks unmarked students absent', () => {
    const roster = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const day = {
      submitted: false,
      marks: { a: 'present', b: 'tardy' },
      lunch: {},
    };
    const next = submitDay(day, roster);
    expect(next.submitted).toBe(true);
    expect(next.marks.a).toBe('present');
    expect(next.marks.b).toBe('tardy');
    expect(next.marks.c).toBe('absent');
  });

  it('excludes excused from attendance percent denominator', () => {
    const roster = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const days = {
      '2026-08-01': {
        submitted: true,
        marks: { 1: 'present', 2: 'absent', 3: 'excused' },
        lunch: {},
      },
    };
    // 1 present / (1 present + 1 absent) = 50%
    expect(classAttendancePercent(days, roster)).toBe(50);
  });

  it('rotates tied champions by day', () => {
    const roster = [
      { id: 'b', name: 'Booker' },
      { id: 'a', name: 'Ada' },
      { id: 'c', name: 'Clara' },
    ];
    const tied = { a: 3, b: 3, c: 3 };
    const day1 = pickChampion(roster, tied, '2026-08-07', 'attendance');
    const day2 = pickChampion(roster, tied, '2026-08-08', 'attendance');
    expect(day1.days).toBe(3);
    expect(day2.days).toBe(3);
    expect(day1.student.id).not.toBe(day2.student.id);

    // Same day stays stable
    expect(pickChampion(roster, tied, '2026-08-07', 'attendance').student.id).toBe(
      day1.student.id,
    );
  });

  it('dailyRotateIndex stays in range', () => {
    expect(dailyRotateIndex('2026-08-07', 'attendance', 3)).toBeGreaterThanOrEqual(0);
    expect(dailyRotateIndex('2026-08-07', 'attendance', 3)).toBeLessThan(3);
    expect(dailyRotateIndex('2026-08-07', '', 1)).toBe(0);
  });
});
