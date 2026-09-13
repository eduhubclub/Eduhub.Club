import { describe, expect, it } from 'vitest';
import { applyOwnerView, isAccountView, isOwnerRole } from './ownerView';

describe('owner view', () => {
  const owner = {
    userId: 'u1',
    role: '',
    owner: true,
    displayName: 'Alex',
    email: 'alex@school.edu',
    ageBand: null,
  };

  it('opens the school role that was signed in, and keeps the owner account', () => {
    expect(applyOwnerView(owner, 'student')).toMatchObject({
      role: 'student',
      owner: true,
      displayName: 'Alex',
      email: 'alex@school.edu',
    });
    expect(applyOwnerView(owner, 'admin').role).toBe('admin');
    expect(applyOwnerView(owner, 'parent').role).toBe('parent');
    expect(applyOwnerView(owner, 'teacher').role).toBe('teacher');
  });

  it('does not let a school account change role by picking another sign-in card', () => {
    const teacher = { ...owner, role: 'teacher', owner: false };
    expect(applyOwnerView(teacher, 'admin')).toBe(teacher);
  });

  it('refuses owner as a public sign-up role', () => {
    expect(isOwnerRole('owner')).toBe(true);
    expect(isAccountView('owner')).toBe(false);
    expect(isAccountView('teacher')).toBe(true);
  });
});
