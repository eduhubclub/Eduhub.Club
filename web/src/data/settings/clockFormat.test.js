import { describe, expect, it, beforeEach } from 'vitest';
import {
  CLOCK_FORMAT_STORAGE_KEY,
  formatClockRange,
  formatClockTime,
  formatMinutesAsClock,
  readUseMilitaryTime,
  writeUseMilitaryTime,
} from './clockFormat.js';

function mockLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
  };
  globalThis.window = {
    dispatchEvent: () => true,
  };
}

describe('clockFormat', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.removeItem(CLOCK_FORMAT_STORAGE_KEY);
  });

  it('defaults to 12-hour', () => {
    expect(readUseMilitaryTime()).toBe(false);
    expect(formatClockTime('14:50')).toBe('2:50 PM');
    expect(formatClockTime('09:10')).toBe('9:10 AM');
  });

  it('formats military when enabled', () => {
    writeUseMilitaryTime(true);
    expect(readUseMilitaryTime()).toBe(true);
    expect(formatClockTime('14:50')).toBe('14:50');
    expect(formatClockTime('09:10')).toBe('09:10');
    expect(formatMinutesAsClock(14 * 60 + 50)).toBe('14:50');
  });

  it('formats ranges', () => {
    expect(formatClockRange('14:50', '15:35')).toBe('2:50 PM – 3:35 PM');
    expect(formatClockRange('14:50', '15:35', { useMilitaryTime: true })).toBe(
      '14:50 – 15:35',
    );
  });
});
