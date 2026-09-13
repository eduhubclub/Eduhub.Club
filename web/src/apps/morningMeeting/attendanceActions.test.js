import { describe, expect, it, beforeEach } from 'vitest';
import {
  getDayRecord,
  writeClassAttendanceRecord,
} from '../../data/attendance/todayPresence';
import { emptyClassRecord } from '../../data/attendance/attendanceModel';
import {
  readTodayDay,
  setStudentLunch,
  toggleStudentPresent,
} from './attendanceActions';

describe('morningMeeting attendanceActions', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
    writeClassAttendanceRecord('c1', emptyClassRecord());
  });

  it('checks a student in as present and undoes', () => {
    const roster = [{ id: 's1', name: 'Ada' }];
    toggleStudentPresent('c1', 's1', roster);
    expect(getDayRecord('c1').marks.s1).toBe('present');
    toggleStudentPresent('c1', 's1', roster);
    expect(getDayRecord('c1').marks.s1).toBeUndefined();
  });

  it('sets lunch and auto check-in when unmarked', () => {
    const roster = [{ id: 's1', name: 'Ada' }];
    setStudentLunch('c1', 's1', 'school', roster);
    const day = readTodayDay('c1', roster);
    expect(day.lunch.s1).toBe('school');
    expect(day.marks.s1).toBe('present');
  });
});
