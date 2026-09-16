import { describe, expect, it } from 'vitest';
import {
  CLASSROOM_JOIN_CODE_LENGTH,
  JOIN_ALPHABET,
  buildLoginQrPayload,
  canSelfServeSignup,
  isValidPin,
  makeClassroomJoinCode,
  normalizeJoinCode,
  parseLoginQr,
  passwordError,
} from './codes';
import { sessionForShell, sessionFromUser, shellForRole } from './session';

describe('auth codes', () => {
  it('normalizes join codes and rejects lookalike punctuation', () => {
    expect(normalizeJoinCode(' ab-12 ')).toBe('AB12');
  });

  it('makes a six-character classroom code from the join alphabet', () => {
    const code = makeClassroomJoinCode();
    expect(code).toHaveLength(CLASSROOM_JOIN_CODE_LENGTH);
    expect([...code].every((ch) => JOIN_ALPHABET.includes(ch))).toBe(true);
  });

  it('accepts a 4 to 6 digit PIN only', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12ab')).toBe(false);
  });

  it('parses classroom QR payloads and ignores other barcodes', () => {
    const payload = buildLoginQrPayload('abcdefghijklmnopqrstuvwxyz');
    expect(parseLoginQr(payload)).toBe('abcdefghijklmnopqrstuvwxyz');
    expect(parseLoginQr('9780142403877')).toBe('');
  });

  it('reads the secret from a student card without treating a name card as a login', () => {
    const card = JSON.stringify({
      v: 2,
      app: 'eduhub.card',
      studentId: 'student-1',
      token: 'abcdefghijklmnopqrstuvwxyz',
    });
    expect(parseLoginQr(card)).toBe('abcdefghijklmnopqrstuvwxyz');
    expect(parseLoginQr(JSON.stringify({ app: 'eduhub.bank', studentId: 'student-1' }))).toBe('');
  });

  it('requires an 8 character password', () => {
    expect(passwordError('short')).toMatch(/8/);
    expect(passwordError('longenough')).toBe('');
  });

  it('lets teachers and parents create an account, not admin or student', () => {
    expect(canSelfServeSignup('teacher')).toBe(true);
    expect(canSelfServeSignup('parent')).toBe(true);
    expect(canSelfServeSignup('admin')).toBe(false);
    expect(canSelfServeSignup('student')).toBe(false);
  });
});

describe('auth session', () => {
  it('routes known roles and refuses an unknown role', () => {
    expect(shellForRole('teacher')).toBe('teacher');
    expect(shellForRole('admin')).toBe('admin');
    expect(shellForRole('parent')).toBe('parent');
    expect(shellForRole('student')).toBe('student');
    expect(shellForRole('owner')).toBe(null);
    expect(shellForRole('superuser')).toBe(null);
  });

  it('builds a session from the profile, not a hardcoded account', () => {
    const session = sessionFromUser(
      { id: 'u1', email: 'ada@school.edu', user_metadata: { role: 'teacher' } },
      { role: 'teacher', display_name: 'Ada', age_band: null },
    );
    expect(session).toEqual({
      userId: 'u1',
      role: 'teacher',
      owner: false,
      displayName: 'Ada',
      email: 'ada@school.edu',
      ageBand: null,
    });
  });

  it('treats an owner profile as an owner even when the word is capitalized', () => {
    const session = sessionFromUser(
      { id: 'u1', email: 'ada@school.edu', user_metadata: { role: 'teacher' } },
      { role: 'Owner', display_name: 'Ada', age_band: null },
    );
    expect(session.owner).toBe(true);
    expect(session.role).toBe('');
  });

  it('keeps a saved school role instead of the sign-in card', () => {
    const session = sessionForShell(
      { userId: 'u1', role: 'teacher', owner: false, email: 'ada@school.edu' },
      'admin',
    );
    expect(session.role).toBe('teacher');
  });

  it('opens the sign-in card when a school account has no saved role', () => {
    const session = sessionForShell(
      { userId: 'u1', role: '', owner: false, email: 'ada@school.edu' },
      'admin',
    );
    expect(session.role).toBe('admin');
  });

  it('keeps a school role when the profile role is missing', () => {
    const session = sessionFromUser(
      { id: 'u1', email: 'ada@school.edu', user_metadata: { role: 'admin' } },
      null,
    );
    expect(session).toMatchObject({ role: 'admin', owner: false });
  });
});
