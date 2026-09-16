import { describe, expect, it } from 'vitest';
import { STUDENT_APP_IDS } from './studentApps';
import {
  canEnterApp,
  clockLabel,
  dayPhrase,
  opensDetail,
  scheduleLabel,
} from './accessCopy';

describe('student app access copy', () => {
  it('matches the weekday phrases the database uses', () => {
    expect(dayPhrase([1, 2, 3, 4, 5])).toBe('weekdays');
    expect(dayPhrase([0, 6])).toBe('weekends');
    expect(dayPhrase([0, 1, 2, 3, 4, 5, 6])).toBe('every day');
    expect(dayPhrase([1, 5])).toBe('Monday and Friday');
    expect(dayPhrase([1, 3, 5])).toBe('Monday, Wednesday, and Friday');
    expect(dayPhrase([])).toBe('no days');
  });

  it('formats a clock window the same way as the lock dialog', () => {
    expect(clockLabel('14:00')).toBe('2:00 PM');
    expect(clockLabel('09:05:00')).toBe('9:05 AM');
    expect(scheduleLabel([1, 2, 3, 4, 5], '14:00', '14:30')).toBe(
      '2:00 PM–2:30 PM on weekdays',
    );
    expect(opensDetail([5], null, null)).toBe('Opens Friday.');
  });

  it('keeps Arcade on the student list so the same lock rules can open it', () => {
    expect(STUDENT_APP_IDS).toContain('arcade');
  });

  it('only lets a student in when the server says the app is open', () => {
    expect(canEnterApp({ open: true })).toBe(true);
    expect(canEnterApp({ open: false, reason: 'outside_window' })).toBe(false);
    expect(canEnterApp(null)).toBe(false);
  });
});
