import { describe, expect, it } from 'vitest';
import { evaluateLocalDemoApp } from './demoAccess';

describe('local demo class rules', () => {
  it('keeps an app closed until the demo class turns it on', () => {
    const status = evaluateLocalDemoApp('arcade', {
      timezone: 'UTC',
      policies: {},
      usage: {},
    });
    expect(status.open).toBe(false);
    expect(status.reason).toBe('closed');
  });

  it('opens Arcade on a weekday when the demo class allows it all day', () => {
    const status = evaluateLocalDemoApp(
      'arcade',
      {
        timezone: 'UTC',
        policies: {
          arcade: {
            enabled: true,
            weekdays: [1, 2, 3, 4, 5],
            windowStart: '',
            windowEnd: '',
            dailyMinutes: null,
          },
        },
        usage: {},
      },
      new Date('2026-09-14T15:00:00Z'),
    );
    expect(status.open).toBe(true);
  });
});
