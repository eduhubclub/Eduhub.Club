import { describe, expect, it } from 'vitest';
import { dateKey } from './attendanceModel';
import {
  DEMO_ATTENDANCE_CLASS_ID,
  buildRollingMonthDemoAttendance,
  demoStatusFor,
  ensureDemoAttendanceRecord,
  getDemoAttendanceRoster,
} from './demoAttendanceSeed';

describe('demoAttendanceSeed', () => {
  const roster = getDemoAttendanceRoster();

  it('loads the Demo Class roster', () => {
    expect(DEMO_ATTENDANCE_CLASS_ID).toBe('demo-3rd-grade');
    expect(roster.length).toBeGreaterThan(10);
  });

  it('builds weekday history ending yesterday with empty today', () => {
    const today = '2026-08-07'; // Friday
    const record = buildRollingMonthDemoAttendance(roster, today);
    expect(record.demoSeedAsOf).toBe(today);
    expect(record.days[today].submitted).toBe(false);
    expect(Object.keys(record.days[today].marks)).toHaveLength(0);

    // Thursday before should be submitted weekday history
    expect(record.days['2026-08-06']?.submitted).toBe(true);
    expect(Object.keys(record.days['2026-08-06'].marks).length).toBe(roster.length);

    // Weekend days are skipped
    expect(record.days['2026-08-02']).toBeUndefined(); // Sunday
    expect(record.days['2026-08-01']).toBeUndefined(); // Saturday
  });

  it('rolls history forward when the calendar day changes', () => {
    const day1 = buildRollingMonthDemoAttendance(roster, '2026-08-06');
    expect(day1.days['2026-08-06'].submitted).toBe(false);

    const { record: day2, didWrite } = ensureDemoAttendanceRecord(
      DEMO_ATTENDANCE_CLASS_ID,
      day1,
      new Date(2026, 7, 7),
    );
    expect(didWrite).toBe(true);
    expect(day2.demoSeedAsOf).toBe('2026-08-07');
    expect(day2.days['2026-08-07'].submitted).toBe(false);
    // Previous practice day becomes seeded history
    expect(day2.days['2026-08-06'].submitted).toBe(true);
  });

  it('keeps today practice marks when refreshing the same day', () => {
    const today = dateKey(new Date(2026, 7, 7));
    const base = buildRollingMonthDemoAttendance(roster, today);
    base.days[today] = {
      submitted: false,
      marks: { [String(roster[0].id)]: 'present' },
      lunch: {},
      checkIns: {},
    };

    const { record, didWrite } = ensureDemoAttendanceRecord(
      DEMO_ATTENDANCE_CLASS_ID,
      base,
      new Date(2026, 7, 7),
    );
    expect(didWrite).toBe(false);
    expect(record.days[today].marks[String(roster[0].id)]).toBe('present');
  });

  it('uses deterministic statuses per student/day', () => {
    expect(demoStatusFor('demo-student-2', '2026-08-05')).toBe(
      demoStatusFor('demo-student-2', '2026-08-05'),
    );
  });
});
