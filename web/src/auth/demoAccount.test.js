import { describe, expect, it } from 'vitest';
import { applyDemoRole, localDemoSession } from './demoAccount';

describe('demo account', () => {
  it('opens the selected view instead of the account role', () => {
    const session = applyDemoRole(
      {
        userId: 'u1',
        role: 'teacher',
        displayName: 'Demo',
        email: 'demo@eduhub.club',
        ageBand: null,
      },
      'parent',
    );
    expect(session.role).toBe('parent');
    expect(session.displayName).toBe('Demo Parent');
    expect(session.demo).toBe(true);
  });

  it('builds a local preview when sign-in is not available', () => {
    expect(localDemoSession('student')).toMatchObject({
      userId: 'demo',
      role: 'student',
      email: 'demo@eduhub.club',
      demo: true,
    });
  });
});
