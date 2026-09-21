import { describe, expect, it } from 'vitest';
import { defaultOpenDemoPolicy, evaluateLocalDemoApp } from './demoAccess';

describe('local demo class rules', () => {
  it('opens an app with no stored policy (demo default)', () => {
    const status = evaluateLocalDemoApp(
      'arcade',
      {
        timezone: 'UTC',
        policies: {},
        usage: {},
      },
      new Date('2026-09-14T15:00:00Z'),
    );
    expect(status.open).toBe(true);
  });

  it('keeps an app closed when the demo class turns it off', () => {
    const status = evaluateLocalDemoApp('arcade', {
      timezone: 'UTC',
      policies: {
        arcade: {
          ...defaultOpenDemoPolicy(),
          enabled: false,
        },
      },
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

  it('opens Headspace by default for demos', () => {
    const status = evaluateLocalDemoApp(
      'headspace',
      {
        timezone: 'UTC',
        policies: {},
        usage: {},
      },
      new Date('2026-09-20T15:00:00Z'), // Sunday
    );
    expect(status.open).toBe(true);
  });
});
